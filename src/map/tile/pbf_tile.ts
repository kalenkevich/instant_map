import Protobuf from 'pbf';
import { VectorTile, VectorTileFeature, VectorTileLayer } from '@mapbox/vector-tile';
import { MapTile, MapTileOptions, MapTileFormatType, TileCoordinate, TileFeature, TileLayersMap } from './tile';
import { MapTilesMeta } from '../types';
import { downloadFile } from '../utils';

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

  private tileData?: VectorTile;
  private isDataLoading: boolean = false;
  private tileDataPromise?: Promise<void>;
  private tileDataBuffer?: ArrayBuffer;

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

      return this.tileDataPromise = fetch(tileUrl, { signal: abortSignal }).then(async data => {
        this.tileDataBuffer = await data.arrayBuffer();

        this.tileData = new VectorTile(new Protobuf(this.tileDataBuffer));
      });
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

  public getLayers(): TileLayersMap {
    if (!this.tileData) {
      return {};
    }

    const tileLayersMap: TileLayersMap = {};

    return [
      'water',
      'globallandcover',
      'landcover',
      'boundary',
      'transportation',
      'building',
    ].reduce((layersMap: TileLayersMap, layerName: string) => {
      const layer: VectorTileLayer | undefined = this.tileData?.layers[layerName];

      if (!layer) {
        return layersMap;
      }

      const features: TileFeature[] = [];

      for (let i = 0; i < layer.length; i++) {
        features.push(this.getTileFeature(layer.feature(i)));
      }

      const layerConfig = this.tilesMeta.vector_layers?.find(vl => vl.id === layerName);
      layersMap[layerName] = {
        name: layerName,
        features,
        shouldBeRendered(zoom: number) {
          if (!layerConfig) {
            return true;
          }

          return zoom >= layerConfig.minzoom && zoom <= layerConfig.maxzoom;
        }
      };

      return layersMap;
    }, tileLayersMap);
  }

  public getTileFeature(vectorTileFeature: VectorTileFeature): TileFeature {
    return {
      id: vectorTileFeature.id,
      bbox: vectorTileFeature.bbox(),
      geometry: vectorTileFeature.loadGeometry().map(points => points.map(p => [p.x, p.y])),
      properties: vectorTileFeature.properties,
    };
  }

  public download(): Promise<void> {
    const tileUrl = new URL(this.tilesMeta.tiles[0]);
    const safeHostName = tileUrl.host
      .split('')
      .map(c => c === '.' ? '_' : c)
      .join('');
    const fileName = `${safeHostName}_${this.tileCoords.z.toString()}_${this.tileCoords.x.toString()}_${this.tileCoords.y.toString()}.pbf`;

    return downloadFile(fileName, this.tileDataBuffer, 'application/x-protobuf');
  }
}
