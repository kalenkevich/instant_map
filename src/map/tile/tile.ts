import { GlProgram } from '../../webgl';

export type MapTileId = string;

export class TileCoordinate {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export interface MapTileOptions {
  id: MapTileId;
  tileCoords: TileCoordinate;
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

export const DEFAULT_TILE_SIZE = 256;

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
