import Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import { MapTile, MapTileOptions, MapTileFormatType, TileCoordinate, TileLayers } from '../tile';
import { MapTilesMeta } from '../../types';
import { downloadFile } from '../../utils/download_utils';
import { DataTileStyles } from '../../styles/styles';
import { getTileLayers } from './pbf_tile_utils';

export class PbfMapTile extends MapTile {
  id: string;
  formatType = MapTileFormatType.pbf;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  devicePixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileStyles?: DataTileStyles;

  private tileData?: VectorTile;
  private isDataLoading: boolean = false;
  private tileDataPromise?: Promise<void>;
  private tileDataBuffer?: ArrayBuffer;
  private tileLayers?: TileLayers;

  constructor(options: MapTileOptions) {
    super();
    this.resetState(options);
  }

  resetState(options: MapTileOptions): void {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.devicePixelRatio = options.devicePixelRatio;
    this.width = options.width;
    this.height = options.height;
    this.tileCoords = options.tileCoords;
    this.tilesMeta = options.tilesMeta;
    this.tileStyles = options.tileStyles;
  }

  /**
   * Loads tile data if it was not loaded yet. Returns the promise of the success load.
   */
  public async fetchTileData(abortSignal?: AbortSignal): Promise<void> {
    if (this.tileData) {
      return Promise.resolve();
    }

    if (this.isDataLoading) {
      return this.tileDataPromise;
    }

    try {
      this.isDataLoading = true;

      const tileUrl = this.tilesMeta.tiles[0]
        .replace('{z}', this.tileCoords.z.toString())
        .replace('{x}', this.tileCoords.x.toString())
        .replace('{y}', this.tileCoords.y.toString());

      return (this.tileDataPromise = fetch(tileUrl, { signal: abortSignal }).then(async data => {
        this.tileDataBuffer = await data.arrayBuffer();

        this.tileData = new VectorTile(new Protobuf(this.tileDataBuffer));
        this.tileLayers = getTileLayers(this.tileData, this.tileStyles);
      }));
    } catch (e) {
      if (e.type === 'AbortError') {
        // skip error;
        return Promise.resolve();
      }

      return Promise.reject();
    } finally {
      this.isDataLoading = false;
    }
  }

  public isReady() {
    return !!this.tileData;
  }

  public getLayers(): TileLayers {
    return this.tileLayers;
  }

  public download(): Promise<void> {
    const tileUrl = new URL(this.tilesMeta.tiles[0]);
    const safeHostName = tileUrl.host
      .split('')
      .map(c => (c === '.' ? '_' : c))
      .join('');
    const fileName = `${safeHostName}_${this.tileCoords.z.toString()}_${this.tileCoords.x.toString()}_${this.tileCoords.y.toString()}.pbf`;

    return downloadFile(fileName, this.tileDataBuffer, 'application/x-protobuf');
  }
}
