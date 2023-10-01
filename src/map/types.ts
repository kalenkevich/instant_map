import { LatLng } from './geo/lat_lng';
import { CoordinateReferenceSystem } from './geo/crs/crs';
import { MapRenderer, MapRendererType } from './render/renderer';
import { MapTileFormatType } from './tile/tile';

export interface MapOptions {
  rootEl: HTMLElement;
  zoom?: number;
  center?: LatLng;
  mapMeta?: MapMeta;
  tilesMetaUrl?: string;
  devicePixelRatio?: number;
  renderer?: MapRendererType | MapRendererOptions;
  crs?: MapCrs;
  resizable?: boolean,
}

export type MapCrs = CoordinateReferenceSystem | MapCrsType;

export enum MapCrsType {
  earth = 'earth',
}

export interface MapRendererOptions {
  type: MapRendererType;
  renderer: MapRenderer;
}

export interface MapMeta {
  id?: string;
  mtime?: Date;
  bounds: [number, number, number, number]; // [minlat, minlon, maxlat, maxlon]
  center: [number, number, number];
  format: MapTileFormatType;
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
  pixel_scale?: string;
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
  pixel_scale?: string;
  tileset_type: 'mbtiles';
  tiles: string[];
}
