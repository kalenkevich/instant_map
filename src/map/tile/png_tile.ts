import { MapTile, MapTileFormatType, MapTileOptions, TileCoordinate, TileLayersMap } from './tile';
import { MapTilesMeta } from '../types';
import { downloadFile } from '../utils';

export class PngMapTile extends MapTile {
  id: string;
  formatType = MapTileFormatType.png;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  devicePixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileUrl: string;
  image?: HTMLImageElement;

  private ready = false;
  private fetchDataPromise?: Promise<void>;

  constructor(options: MapTileOptions) {
    super();
    this.resetState(options);
  }

  async fetchTileData(abortSignal?: AbortSignal): Promise<void> {
    if (this.ready && this.fetchDataPromise) {
      return this.fetchDataPromise;
    }

    this.image = new Image(this.width, this.height);
    this.image.src = this.tileUrl;
    this.image.crossOrigin = "anonymous";

    return this.fetchDataPromise = new Promise((resolve) => {
      this.image.onload = () => {
        resolve();
        this.ready = true;
      };
    });
  }

  isReady() {
    return this.ready;
  }

  resetState(options: MapTileOptions): void {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.devicePixelRatio = options.devicePixelRatio;
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

  async download(): Promise<void> {
    const tileUrl = new URL(this.tileUrl);
    const safeHostName = tileUrl.host
      .split('')
      .map(c => c === '.' ? '_' : c)
      .join('');
    const fileName = `${safeHostName}_${this.tileCoords.z.toString()}_${this.tileCoords.x.toString()}_${this.tileCoords.y.toString()}.png`;

    return fetch(this.tileUrl).then(async (response) => {
      const blob = await response.blob();

      return downloadFile(fileName, blob, 'image/png');
    });
  }
}
