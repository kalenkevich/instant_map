export type TileRef = [number, number, number];

export interface MapTile {
  ref: TileRef;
  tileId: string;
  layers: MapTileLayer[];
}

export interface MapTileLayer {
  tileId: string;
  source: string;
  layerName: string;
  zIndex: number;
}

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

export function getTileId(refOrId: TileRef | string): string {
  if (Array.isArray(refOrId)) {
    return refOrId.join('/');
  }

  return refOrId;
}

export function getTileRef(refOrId: TileRef | string): TileRef {
  if (Array.isArray(refOrId)) {
    return refOrId;
  }

  return refOrId.split('/') as unknown as TileRef;
}
