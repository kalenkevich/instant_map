import tilebelt from '@mapbox/tilebelt';
import { Evented } from '../evented';
import { MapCamera } from '../camera/map_camera';
import { TileRef, MapTile, getTileId, getTileRef } from './tile';
import { Projection } from '../geo/projection/projection';
import { MapTileLayer } from './tile';
import { MapTileRendererType } from '../renderer/renderer';
import { LRUCache } from '../utils/lru_cache';
import { GlyphsManager } from '../glyphs/glyphs_manager';
import { DataTileStyles } from '../styles/styles';
import { MapFeatureFlags } from '../flags';
import { FontManager } from '../font/font_manager';
import {
  WorkerTaskRequestType,
  WorkerTaskResponseType,
  TileFullCompleteResponse,
  TileLayerCompleteResponse,
} from '../worker/worker_actions';
import { WorkerPool, WorkerTask, CANCEL_WORKER_ERROR_MESSAGE } from '../worker/worker_pool';

export enum TilesGridEvent {
  TILE_LOADED = 0,
  TILE_LAYER_COMPLETE = 1,
}

export class TilesGrid extends Evented<TilesGridEvent> {
  private tiles: LRUCache<string, MapTile> = new LRUCache(128);
  private tilesInView: TileRef[];
  private workerPool: WorkerPool;
  private bufferedTiles: TileRef[];
  private currentLoadingTiles: Map<string, WorkerTask<any>> = new Map();

  constructor(
    private readonly featureFlags: MapFeatureFlags,
    private readonly rendererType: MapTileRendererType,
    private readonly tileStyles: DataTileStyles,
    private readonly tileBuffer: number,
    private readonly maxWorkerPool: number,
    private readonly tileSize: number,
    private readonly pixelRatio: number,
    private readonly maxTileZoom: number,
    private readonly projection: Projection,
    private readonly fontManager: FontManager,
    private readonly glyphsManager: GlyphsManager
  ) {
    super();
  }

  init() {
    this.tilesInView = [];
    this.workerPool = new WorkerPool(this.maxWorkerPool);

    this.workerPool.on(
      WorkerTaskResponseType.TILE_LAYER_COMPLETE,
      (event: WorkerTaskResponseType, response: TileLayerCompleteResponse) => {
        this.onTileLayerReady(response);
      }
    );
  }

  destroy() {}

  private onTileFullReady(response: TileFullCompleteResponse) {
    if (!response.data) {
      return;
    }

    const { tileId, layers: tileLayers } = response.data;

    if (!tileLayers || tileLayers.length === 0) {
      return;
    }

    let tile: MapTile;
    if (this.tiles.has(tileId)) {
      tile = this.tiles.get(tileId);

      tile.layers = tileLayers;
    } else {
      tile = this.createMapTile(tileId, tileLayers);

      this.tiles.set(tileId, tile);
    }

    setTimeout(() => {
      this.fire(TilesGridEvent.TILE_LOADED, tile);
    }, 0);
  }

  private onTileLayerReady(response: TileLayerCompleteResponse) {
    if (!response.data) {
      return;
    }

    const { tileId, tileLayer } = response.data;

    let tile: MapTile;
    if (this.tiles.has(tileId)) {
      tile = this.tiles.get(tileId);
      const layers = tile.layers;
      const hasLayer = layers.find(l => l.layerName === tileLayer.layerName);

      if (hasLayer) {
        tile.layers = layers.map(l => {
          if (l.layerName === tileLayer.layerName) {
            return tileLayer;
          }

          return l;
        });
      } else {
        layers.push(tileLayer);
      }
    } else {
      tile = this.createMapTile(tileId, [tileLayer]);

      this.tiles.set(tileId, tile);
    }

    setTimeout(() => {
      this.fire(TilesGridEvent.TILE_LAYER_COMPLETE, tile);
    }, 0);
  }

  public async updateTiles(camera: MapCamera, zoom: number, canvasWidth: number, canvasHeight: number) {
    // update visible tiles based on viewport
    const bbox = camera.getCurrentBounds();
    const z = Math.min(Math.trunc(camera.getZoom()), this.maxTileZoom);
    const minTile = tilebelt.pointToTile(bbox[0], bbox[3], z);
    const maxTile = tilebelt.pointToTile(bbox[2], bbox[1], z);

    // tiles visible in viewport
    this.tilesInView = [];
    const [minX, maxX] = [Math.max(minTile[0], 0), maxTile[0]];
    const [minY, maxY] = [Math.max(minTile[1], 0), maxTile[1]];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        this.tilesInView.push([x, y, z]);
      }
    }

    // get additional tiles to buffer (based on buffer setting)
    this.bufferedTiles = [];
    const tileBuffer = this.tileBuffer;
    for (let bufX = minX - tileBuffer; bufX <= maxX + tileBuffer; bufX++) {
      for (let bufY = minY - tileBuffer; bufY <= maxY + tileBuffer; bufY++) {
        this.bufferedTiles.push([bufX, bufY, z]);

        // get parent
        this.bufferedTiles.push(tilebelt.getParent([bufX, bufY, z]) as TileRef);
      }
    }

    // remove duplicates
    let tilesToLoad = [
      ...new Set([
        ...this.tilesInView.map(t => getTileId(t as TileRef)),
        ...this.bufferedTiles.map(t => getTileId(t as TileRef)),
      ]),
    ];

    // make sure tiles are in range
    tilesToLoad = tilesToLoad.filter(tile => {
      const [x, y, z] = tile.split('/').map(Number);
      const N = Math.pow(2, z);
      const validX = x >= 0 && x < N;
      const validY = y >= 0 && y < N;
      const validZ = z >= 0 && z <= this.maxTileZoom;
      return validX && validY && validZ;
    });

    for (const [tileId, task] of this.currentLoadingTiles) {
      if (!tilesToLoad.includes(tileId)) {
        if (task) {
          task.worker.sendRequest({
            type: WorkerTaskRequestType.CANCEL_TILE_FETCH,
            data: tileId,
          });
          this.workerPool.cancel(task.taskId);
        }

        this.currentLoadingTiles.delete(tileId);
      }
    }

    for (const tileId of tilesToLoad) {
      if (this.tiles.has(tileId)) {
        continue;
      }

      this.tiles.set(tileId, this.createMapTile(tileId));

      const workerTask = await this.workerPool.execute({
        type: WorkerTaskRequestType.FETCH_TILE,
        data: {
          tileId,
          tileStyles: this.tileStyles,
          rendererType: this.rendererType,
          projectionViewMat: [...camera.getProjectionMatrix()],
          canvasWidth,
          canvasHeight,
          pixelRatio: this.pixelRatio,
          zoom,
          tileSize: this.tileSize,
          projectionType: this.projection.getType(),
          atlasTextureMappingState: this.glyphsManager.getMappingState(),
          fontManagerState: this.fontManager.getState(),
          featureFlags: this.featureFlags,
        },
      });
      this.currentLoadingTiles.set(tileId, workerTask);
      workerTask.task
        .then((result: any) => this.onTileFullReady(result))
        .catch(error => {
          if (error !== CANCEL_WORKER_ERROR_MESSAGE) {
            console.error(error);
          }
        });
    }
  }

  public getCurrentViewTiles(usePlaceholders: boolean = true): MapTile[] {
    const tiles = this.tilesInView
      .map(tileRef => {
        const tileId = getTileId(tileRef);

        return this.tiles.get(tileId);
      })
      .filter(tile => !!tile);

    if (!usePlaceholders) {
      return tiles;
    }

    // add placeholder tile data.
    for (const tile of tiles) {
      const tileLayers = tile.layers;

      if (!tileLayers || tileLayers.length === 0) {
        tile.layers = this.getPlaceholderLayers(tile.ref);
      }
    }

    return tiles;
  }

  private createMapTile(refOrId: TileRef | string, tileLayers: MapTileLayer[] = []): MapTile {
    return {
      ref: getTileRef(refOrId),
      tileId: getTileId(refOrId),
      layers: tileLayers,
    };
  }

  private getPlaceholderLayers(tile: TileRef): MapTileLayer[] {
    const parentId = getTileId(tilebelt.getParent(tile)! as TileRef);
    const parentTile = this.tiles.get(parentId);
    if (parentTile) {
      const parentLayers = parentTile.layers;

      if (parentLayers && parentLayers.length > 0) {
        return parentLayers;
      }
    }

    const childFeatureSets: any = [];
    const children = (tilebelt.getChildren(tile) || []).map(t => getTileId(t as TileRef));
    for (const childId of children) {
      const childTile = this.tiles.get(childId);

      if (!childTile) {
        continue;
      }

      childFeatureSets.push(...(childTile.layers || []));
    }

    return childFeatureSets;
  }
}
