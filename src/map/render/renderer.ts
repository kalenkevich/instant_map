import { MapTile } from '../tile/tile';
import { MapState } from '../map_state';

export interface MapRenderer {
  init(): void;

  renderTiles(tiles: MapTile[], mapState: MapState): void;

  stopRender(): void;
}

export enum MapRendererType {
  webgl = 'webgl',
  svg = 'svg', // not supported yet.
  webgl2 = 'webgl2', // not supported yet.
  webgpu = 'webgpu', // not supported yet.
}