import { BBox } from 'geojson';
import { WebGlPainter } from '../webgl';

export interface MapOptions {
  el: HTMLElement;
  zoom?: number;
  center?: [number, number];
  tilesMetaUrl: string;
  devicePixelRatio?: number;
  renderer?: MapRendererType | MapRendererOptions;
}

export type MapRenderer = WebGlPainter; // | WebGl2Painter | WebGPUPainter | SVGPainter | ImagePainter;

export enum MapRendererType {
  webgl = 'webgl',
  svg = 'svg', // not supported yet.
  webgl2 = 'webgl2', // not supported yet.
  webgpu = 'webgpu', // not supported yet.
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

export interface MapTilesMeta {
  id: string;
  mtime: Date;
  bounds: BBox;
  center: [number, number, number];
  format: TilesetFormat.pbf;
  maxzoom: number;
  minzoom: number;
  version: string;
  generator: string;
  tilestats: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>;
  };
  pixel_scale?: number;
  crs: string;
  crs_wkt: string;
  extent: [number, number, number, number];
  tileset_type: 'mbtiles';
  tiles: string[];
  logo: string;
}
