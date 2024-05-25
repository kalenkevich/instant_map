import { MapTile } from '../tile/tile';

export enum MapTileRendererType {
  webgl = 'webgl',
  webgl2 = 'webgl2',
  // webgpu = 'webgpu',
  // html = 'html',
  // canvas2d = 'canvas2d',
}

export interface SceneCamera {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly distance: number; // ???? zFar???

  // perspective camera props
  readonly fieldOfView: number; // in radians
  readonly zNear: number; // 1
  readonly zFar: number; // 2000
  readonly xRotation: number; // in radians
  readonly yRotation: number; // in radians
  readonly zRotation: number; // in radians
}

export interface RenderOptions {}

export interface MapTileRenderer {
  init(): Promise<void>;

  destroy(): void;

  resize(width: number, height: number): void;

  render(tiles: MapTile[], camera: SceneCamera, renderOptions?: RenderOptions): void;

  getObjectId(tiles: MapTile[], camera: SceneCamera, x: number, y: number): number | undefined;
}
