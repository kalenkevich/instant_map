import { mat3 } from 'gl-matrix';
import { MapTile } from '../tile/tile';

export enum MapTileRendererType {
  webgl = 'webgl',

  // Possible renderes
  // html = 'html',
  // canvas2d = 'canvas2d',
  // webgpu = 'webgpu',
}

export interface MapStyles {
  disabledLayers?: string[];
  layers: Record<string, [number, number, number, number]>;
}

export interface RenderOptions {
  pruneCache?: boolean;
  readPixelRenderMode?: boolean;
}

export interface Renderer {
  init(): void;

  destroy(): void;

  resize(width: number, height: number): void;

  render(tiles: MapTile[], viewMatrix: mat3, zoom: number, tileSize: number, renderOptions?: RenderOptions): void;

  getObjectId(
    tiles: MapTile[],
    viewMatrix: mat3,
    zoom: number,
    tileSize: number,
    x: number,
    y: number
  ): number | undefined;
}
