import { MapFeature } from './feature';
import { WebGlObjectBufferredGroup } from '../renderer/webgl/objects/object/object';

export type TileRef = [number, number, number];

export type PrerendedTileData = WebGlObjectBufferredGroup[];

export interface MapTile {
  ref: TileRef;
  tileId: string;
  layers: MapTileLayer[];
  prerendedData?: PrerendedTileData;
}

export interface MapTileLayer {
  tileId: string;
  source: string;
  layerName: string;
  zIndex: number;
  features: MapFeature[];
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
