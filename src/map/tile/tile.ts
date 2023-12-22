import { Polygon } from 'geojson';

export type TileRef = [number, number, number];

export enum MapTileFormatType {
  xml = 'xml', // tile data stored as xml
  json = 'json', // tile data stored as json
  pbf = 'pbf', // tile data stored as pbf (most efficiet type)
  png = 'png', // tile data stored as image
}

export interface MapTile {
  ref: TileRef;
  tileId: string;
  formatType: MapTileFormatType;

  getLayers(): MapTileLayer[];
  setLayers(layers: MapTileLayer[]): void;

  toGeoJson(): Polygon;
}

export interface MapTileLayer {}

export interface MapTileFeature {
  type: MapTileFeatureType;
}

export enum MapTileFeatureType {
  point = 'point',
  line = 'line',
  polygon = 'polygon',
  text = 'text',
  glyph = 'glyph',
  image = 'image',
}
