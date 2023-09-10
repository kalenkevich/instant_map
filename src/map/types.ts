import { LatLng } from './geo/lat_lng';
import { CoordinateReferenceSystem } from './geo/crs/crs';
import { MapRenderer, MapRendererType } from './render/renderer';

export interface MapOptions {
  el: HTMLElement;
  zoom?: number;
  center?: LatLng;
  tilesMetaUrl: string;
  devicePixelRatio?: number;
  renderer?: MapRendererType | MapRendererOptions;
  crs?: MapCrs;
}

export type MapCrs = CoordinateReferenceSystem;

export enum MapCrsType {
  earth = 'earth',
}

export interface MapRendererOptions {
  type: MapRendererType;
  renderer: MapRenderer;
}

export enum TilesetFormat {
  xml = 'xml', // tile data stored as xml
  json = 'json', // tile data stored as json
  pbf = 'pbf', // tile data stored as pbf (most efficiet type)
  svg = 'svg', // tile data stored as svg
  png = 'png', // tile data stored as image
}

export interface MapMeta {
  id?: string;
  mtime?: Date;
  bounds: [number, number, number, number]; // [minlat, minlon, maxlat, maxlon]
  center: [number, number, number];
  format: TilesetFormat;
  maxzoom: number;
  minzoom: number;
  version?: string;
  generator?: string;
  tilestats?: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>;
  };
  pixel_scale?: number;
  crs?: string;
  crs_wkt?: string;
  extent?: [number, number, number, number];
  tileset_type?: 'mbtiles';
  tiles: string[];
  logo?: string;
}

export interface MapTilesMeta {
  tilestats: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>;
  };
  pixel_scale?: number;
  tileset_type: 'mbtiles';
  tiles: string[];
}
