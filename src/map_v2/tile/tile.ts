import { Polygon } from 'geojson';
import { Projection } from '../geo/projection/projection';

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
  getVerticies(projection: Projection): number[];
}

export interface MapTileLayer {}
