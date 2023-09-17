import { MapTile, MapTileFormatType, MapTileOptions, TileCoordinate, TileLayersMap } from './tile';
import { MapTilesMeta } from '../types';

export class PngMapTile implements MapTile {
  id: string;
  formatType: MapTileFormatType.png;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  pixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileUrl: string;

  constructor(options: MapTileOptions) {
    this.resetState(options);
  }

  async fetchTileData(abortSignal?: AbortSignal): Promise<void> {
    return Promise.resolve();
  }

  resetState(options: MapTileOptions): void {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.tileCoords = options.tileCoords;
    this.tilesMeta = options.tilesMeta;
    this.tileUrl = this.tilesMeta.tiles[0]
      .replace('{z}', this.tileCoords.z.toString())
      .replace('{x}', this.tileCoords.x.toString())
      .replace('{y}', this.tileCoords.y.toString());
  }

  getLayers(): TileLayersMap {
    return {};
  }
}
