import { GlProgram } from '../../webgl';

export type MapTileId = string;

export type TileCoords = [number, number, number]; // z, x, y;

export interface MapTileOptions {
  id: MapTileId;
  tileCoords: TileCoords;
  renderOptions: MapTileRenderOptions;
}

export interface MapTileRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  pixelRatio?: number;
}

export const DEFAULT_TILE_WIDTH = 256;
export const DEFAULT_TILE_HEIGHT = 256;

/**
 * Base class for tiles:
 *  - pbf
 *  - json
 *  - xml
 *  - img
 *  - ...
 */
export abstract class MapTile {
  id: MapTileId;

  constructor(options: MapTileOptions) {
    this.id = options.id;
  }

  abstract fetchTileData(abortSignal?: AbortSignal): Promise<void>;

  abstract getRenderPrograms(): GlProgram[];
}
