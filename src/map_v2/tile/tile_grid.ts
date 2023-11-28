import tilebelt from '@mapbox/tilebelt';
import { Evented } from '../evented';
import { MapCamera } from '../camera/map_camera';
import { TileRef, MapTile } from './tile';
import { Projection } from '../geo/projection/projection';
import { MapTileFormatType, MapTileLayer } from './tile';
import { PbfMapTile, PbfTileLayer } from './pbf/pbf_tile';
import { LRUCache } from '../../map/utils/lru_cache';

export enum TilesGridEvent {
  TILE_LOADED = 'tileLoaded',
}

export class TilesGrid extends Evented<TilesGridEvent> {
  private tiles: LRUCache<string, MapTile> = new LRUCache(256);
  private tilesInView: TileRef[];
  private tileWorker: Worker;
  private bufferedTiles: TileRef[];
  private tileBuffer: number;
  private tileServerURL: string;
  private layers: Record<string, [number, number, number, number]>;
  private maxTileZoom: number;
  private projection: Projection;
  private tileFormatType: MapTileFormatType;

  constructor(
    tileFormatType: MapTileFormatType,
    tileServerURL: string,
    layers: Record<string, [number, number, number, number]>,
    tileBuffer: number,
    maxTileZoom: number,
    projection: Projection
  ) {
    super();

    this.tileFormatType = tileFormatType;
    this.tileServerURL = tileServerURL;
    this.layers = layers;
    this.tileBuffer = tileBuffer;
    this.maxTileZoom = maxTileZoom;
    this.projection = projection;
  }

  init() {
    this.tilesInView = [];
    this.tileWorker = new Worker(new URL('./tile_grid_worker.ts', import.meta.url));
    this.tileWorker.onmessage = this.handleTileWorker;
    this.tileWorker.onerror = this.handleTileWorkerError;
  }

  destroy() {}

  // update tiles with data from worker
  private handleTileWorker = (workerEvent: any) => {
    const { tileId, tileLayers } = workerEvent.data;

    let tile: MapTile;
    if (this.tiles.has(tileId)) {
      tile = this.tiles.get(tileId);

      tile.setLayers(tileLayers);
    } else {
      tile = this.createMapTile(tileId, tileLayers);

      this.tiles.set(tileId, tile);
    }

    setTimeout(() => {
      this.fire(TilesGridEvent.TILE_LOADED, tile);
    }, 0);
  };

  // errors from tile worker
  private handleTileWorkerError = (error: any) => {
    console.error('Uncaught worker error.', error);
  };

  public updateTiles(camera: MapCamera) {
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
        ...this.tilesInView.map(t => this.getTileId(t as TileRef)),
        ...this.bufferedTiles.map(t => this.getTileId(t as TileRef)),
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

    // tile fetching options
    const { layers, tileServerURL: url } = this;

    tilesToLoad.forEach(tileId => {
      if (this.tiles.has(tileId)) {
        return;
      }

      this.tiles.set(tileId, this.createMapTile(tileId));
      this.tileWorker.postMessage({ tileId, layers, url, projectionType: this.projection.getType() });
    });
  }

  public getCurrentViewTiles(usePlaceholders: boolean = true): MapTile[] {
    const tiles = this.tilesInView
      .map(tileRef => {
        const tileId = this.getTileId(tileRef);

        return this.tiles.get(tileId);
      })
      .filter(tile => !!tile);

    if (!usePlaceholders) {
      return tiles;
    }

    // add placeholder tile data.
    for (const tile of tiles) {
      const tileLayers = tile.getLayers();

      if (tileLayers.length === 0) {
        tile.setLayers(this.getPlaceholderLayers(tile.ref));
      }
    }

    return tiles;
  }

  private getTileId(tileOrRef: MapTile | TileRef): string {
    if (Array.isArray(tileOrRef)) {
      return tileOrRef.join('/');
    }

    return (tileOrRef as MapTile).tileId;
  }

  private createMapTile(refOrId: TileRef | string, tileLayers: MapTileLayer[] = []): MapTile {
    let tileRef: TileRef;
    if (typeof refOrId === 'string') {
      tileRef = refOrId.split('/') as unknown as TileRef;
    } else {
      tileRef = refOrId;
    }

    if (this.tileFormatType === MapTileFormatType.pbf) {
      return new PbfMapTile(tileRef, tileLayers as PbfTileLayer[]);
    }

    throw new Error(`${this.tileFormatType} is not supported.`);
  }

  private getPlaceholderLayers(tile: TileRef): MapTileLayer[] {
    const parentId = this.getTileId(tilebelt.getParent(tile)! as TileRef);
    const parentTile = this.tiles.get(parentId);
    if (parentTile) {
      const parentLayers = parentTile.getLayers();

      if (parentLayers.length > 0) {
        return parentLayers;
      }
    }

    const childFeatureSets: any = [];
    const children = (tilebelt.getChildren(tile) || []).map(t => this.getTileId(t as TileRef));
    for (const childId of children) {
      const childTile = this.tiles.get(childId);

      if (!childTile) {
        continue;
      }

      childFeatureSets.push(...childTile.getLayers());
    }

    return childFeatureSets;
  }
}