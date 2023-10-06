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

/**
 * Base class for tiles:
 *  - pbf
 *  - json
 *  - xml
 *  - img
 *  - ...
 */

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

export interface MapTile extends MapTileOptions {
  fetchTileData(abortSignal?: AbortSignal): Promise<void>;
  isReady(): boolean;
  getLayers(): TileLayersMap;
  resetState(tileState: MapTileOptions): void;
  download(): Promise<void>;
  hasRenderingCache(): boolean;
  getRenderingCache(): RenderingCache | undefined;
  setRenderingCache(cache: RenderingCache): void;
  pruneRenderingCache(): void;
}
