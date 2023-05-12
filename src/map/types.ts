import { BBox } from 'geojson';

export type ZXY = [number, number, number];

export type TileCacheKey = string;

export interface RenderTileInfo {
  tileZXY: ZXY;
  x: number;
  y: number;
  width: number;
  height: number;
  blank?: boolean;
};

export interface MapOptions {
  zoom?: number;
  center?: [number, number];
  tilesMetaUrl: string;
  devicePixelRatio?: number;
}

export enum TilesetFormat {
  xml = 'xml',
  json = 'json',
  pbf = 'pbf'
}

export interface MapTilesMeta {
  id: string;
  mtime: Date;
  bounds: BBox;
  center: [number, number, number];
  format: TilesetFormat.pbf;
  maxzoom: number,
  minzoom: number;
  version: string;
  generator: string;
  tilestats: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>
  },
  crs: string;
  crs_wkt: string;
  extent: [number, number, number, number];
  tileset_type: "mbtiles";
  tiles: string[];
  logo: string;
}