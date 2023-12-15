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

  render(tiles: MapTile[], zoom: number, matrix: mat3): void;
}
