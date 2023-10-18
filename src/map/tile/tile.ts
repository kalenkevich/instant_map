import { MapTilesMeta } from '../types';
import { RenderingCache } from '../render/renderer';
import { DataTileStyles } from '../styles/styles';
import { TileLayer } from './tile_layer';

export type MapTileId = string;

export interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface MapTileRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  pixelRatio?: number;
}

export interface TileLayers {
  [prop: string]: TileLayer;
}

export const DEFAULT_TILE_SIZE = 256;

export enum MapTileFormatType {
  xml = 'xml', // tile data stored as xml
  json = 'json', // tile data stored as json
  pbf = 'pbf', // tile data stored as pbf (most efficiet type)
  png = 'png', // tile data stored as image
}

export interface MapTileOptions {
  id: MapTileId;
  formatType: MapTileFormatType;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  devicePixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileStyles?: DataTileStyles;
}

/**
 * Base class for tiles.
 */
export abstract class MapTile implements MapTileOptions {
  id: MapTileId;
  formatType: MapTileFormatType;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  devicePixelRatio: number;
  tilesMeta: MapTilesMeta;

  abstract fetchTileData(abortSignal?: AbortSignal): Promise<void>;
  abstract isReady(): boolean;
  abstract getLayers(): TileLayers;
  abstract resetState(tileState: MapTileOptions): void;
  abstract download(): Promise<void>;

  private renderingCache?: RenderingCache;
  public hasRenderingCache(): boolean {
    return !!this.renderingCache;
  }

  public getRenderingCache() {
    return this.renderingCache;
  }

  public setRenderingCache(cache: RenderingCache) {
    this.renderingCache = cache;
  }

  public pruneRenderingCache(): void {
    this.renderingCache = undefined;
  }
}
