import { mat3 } from 'gl-matrix';
import { MapTile } from '../tile/tile';

export interface MapStyles {
  disabledLayers?: string[];
  layers: Record<string, [number, number, number, number]>;
}

export interface Renderer {
  init(): void;

  destroy(): void;

  resize(width: number, height: number): void;

  render(tiles: MapTile[], viewMatrix: mat3, zoom: number, tileSize: number, pruneCache?: boolean): void;
}
