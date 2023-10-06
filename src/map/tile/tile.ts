import { BBox } from 'geojson';
import { MapTilesMeta } from '../types';
import { RenderingCache } from '../render/renderer';

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

export interface TileLayersMap {
  [prop: string]: TileLayer;
}

export interface TileLayer {
  name: string;
  features: TileFeature[];
  shouldBeRendered(zoom: number): boolean;
  properties?: Record<string, FeatureProperty>;
}

export enum TileFeatureType {
  some_type = 'some_type',
}

export interface TileFeature {
  id: string | number;
  name?: string;
  type?: TileFeatureType;
  bbox?: BBox;
  geometry: Array<Array<[number, number]>>;
  properties: Record<string, FeatureProperty>;
}

type BasicFeatureProperty = string | number | boolean | undefined;
export type FeatureProperty = BasicFeatureProperty | Array<BasicFeatureProperty> | Record<string, BasicFeatureProperty>;

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
  abstract getLayers(): TileLayersMap;
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
