import { MapTile } from '../tile/tile';

export enum MapTileRendererType {
  webgl = 'webgl',
  webgl2 = 'webgl2',
  // html = 'html',
  // canvas2d = 'canvas2d',
  // webgpu = 'webgpu',
}

export interface SceneCamera {
  readonly distance: number;
  readonly viewMatrix: [number, number, number, number, number, number, number, number, number];
}

export interface RenderOptions {}

export interface MapTileRenderer {
  init(): Promise<void>;

  destroy(): void;

  resize(width: number, height: number): void;

  render(tiles: MapTile[], camera: SceneCamera, renderOptions?: RenderOptions): void;

  getObjectId(tiles: MapTile[], camera: SceneCamera, x: number, y: number): number | undefined;
}
