import tilebelt from '@mapbox/tilebelt';
import { Evented } from '../evented';
import { MapCamera } from '../camera/map_camera';
import { TileRef, MapTile } from './tile';
import { Projection } from '../geo/projection/projection';

interface FeatureSet {
  layer: string;
  type: string;
  vertices: Float32Array;
}

export enum TilesGridEvent {
  TILE_LOADED = 'tileLoaded',
}

export class TilesGrid extends Evented<TilesGridEvent> {
  private tiles: Record<string, FeatureSet[]>;
  private tilesInView: TileRef[];
  private tileWorker: Worker;
  private bufferedTiles: TileRef[];
  private tileBuffer: number;
  private tileServerURL: string;
  private layers: Record<string, [number, number, number, number]>;
  private maxTileZoom: number;
  private projection: Projection;

  constructor(
    tileServerURL: string,
    layers: Record<string, [number, number, number, number]>,
    tileBuffer: number,
    maxTileZoom: number,
    projection: Projection
  ) {
    super();

    this.tileServerURL = tileServerURL;
    this.layers = layers;
    this.tileBuffer = tileBuffer;
    this.maxTileZoom = maxTileZoom;
    this.projection = projection;
  }

  init() {
    // init tile fields
    this.tiles = {}; // cached tile data
    this.tilesInView = []; // current visible tiles
    this.tileWorker = new Worker(new URL('./workers/tile-worker.ts', import.meta.url));
    this.tileWorker.onmessage = this.handleTileWorker;
    this.tileWorker.onerror = this.handleTileWorkerError;
  }

  destroy() {}

  // update tiles with data from worker
  private handleTileWorker = (workerEvent: any) => {
    const { tile, tileData } = workerEvent.data;
    this.tiles[tile] = tileData;

    this.fire(TilesGridEvent.TILE_LOADED, this.getMapTile(tile));
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

        // get parents 2 levels up
        this.bufferedTiles.push(tilebelt.getParent([bufX, bufY, z]) as TileRef);
        this.bufferedTiles.push(tilebelt.getParent(tilebelt.getParent([bufX, bufY, z])) as TileRef);
      }
    }

    // remove duplicates
    let tilesToLoad = [
      ...new Set([...this.tilesInView.map(t => t.join('/')), ...this.bufferedTiles.map(t => t.join('/'))]),
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

    // load tiles from tilerServer
    tilesToLoad.forEach(tile => {
      if (this.tiles[tile]) {
        return; // already loaded, no need to fetch
      }
      // temp hold for request
      this.tiles[tile] = [];

      // hand off buffered tiles to worker for fetching & processing
      this.tileWorker.postMessage({ tile, layers, url, projectionType: this.projection.getType() });
    });
  }

  public getCurrentViewTiles(usePlaceholders: boolean = true): MapTile[] {
    const tiles = this.tilesInView.map(tileRef => this.getMapTile(tileRef));

    if (!usePlaceholders) {
      return tiles;
    }

    // add placeholder tile data.
    for (const tile of tiles) {
      let featureSets = tile.featureSet;

      if (featureSets?.length === 0) {
        featureSets = this.getPlaceholderTile(tile.ref);
      }
    }

    return tiles;
  }

  private getMapTile(refOrId: TileRef | string): MapTile {
    let tileId: string;
    let tileRef: TileRef;
    if (typeof refOrId === 'string') {
      tileId = refOrId;
      tileRef = refOrId.split('/') as unknown as TileRef;
    } else {
      tileId = refOrId.join('/');
      tileRef = refOrId;
    }

    return {
      tileId,
      ref: tileRef,
      featureSet: this.tiles[tileId],
    };
  }

  // if current tile is not loaded, just render scaled versions of parent or children
  public getPlaceholderTile(tile: TileRef) {
    // use parent if available
    const parent = tilebelt.getParent(tile)?.join('/');
    const parentFeatureSet = this.tiles[parent];
    if (parentFeatureSet?.length > 0) {
      return parentFeatureSet;
    }

    // use whatever children are available
    const childFeatureSets: any = [];
    const children = (tilebelt.getChildren(tile) || []).map(t => t.join('/'));
    children.forEach(child => {
      const featureSet = this.tiles[child];
      if (featureSet?.length > 0) {
        childFeatureSets.push(...featureSet);
      }
    });

    return childFeatureSets;
  }
}
