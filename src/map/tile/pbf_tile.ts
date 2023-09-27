import Protobuf from 'pbf';
import { VectorTile, VectorTileFeature, VectorTileLayer } from '@mapbox/vector-tile';
import { MapTile, MapTileOptions, MapTileFormatType, TileCoordinate, TileFeature, TileLayersMap } from './tile';
import { MapTilesMeta } from '../types';

export class PbfMapTile implements MapTile {
  id: string;
  formatType: MapTileFormatType.pbf;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileCoords: TileCoordinate;
  pixelRatio: number;
  tilesMeta: MapTilesMeta;

  private tileData?: VectorTile;
  private isDataLoading: boolean = false;
  private tileDataPromise?: Promise<void>;

  constructor(options: MapTileOptions) {
    this.resetState(options);
  }

  resetState(options: MapTileOptions): void {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.width = options.width * this.pixelRatio;
    this.height = options.height * this.pixelRatio;
    this.tileCoords = options.tileCoords;
    this.tilesMeta = options.tilesMeta;
    // this.tileData = undefined;
  }

  /**
   * Loads tile data if it was not loaded yet. Returns the promise of the success load.
   */
  async fetchTileData(abortSignal?: AbortSignal): Promise<void> {
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

      return this.tileDataPromise = fetch(tileUrl, { signal: abortSignal }).then(async (data) => {
        const buffer = await data.arrayBuffer();

        this.tileData = new VectorTile(new Protobuf(buffer));
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

  isReady() {
    return !!this.tileData;
  }

  getLayers(): TileLayersMap {
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
      const layer: VectorTileLayer = this.tileData.layers[layerName];

      if (!layer) {
        return layersMap;
      }

      const features: TileFeature[] = [];

      for (let i = 0; i < layer.length; i++) {
        features.push(this.getTileFeature(layer.feature(i)));
      }

      layersMap[layerName] = {
        name: layerName,
        features,
      };

      return layersMap;
    }, tileLayersMap);
  }

  getTileFeature(vectorTileFeature: VectorTileFeature): TileFeature {
    return {
      id: vectorTileFeature.id,
      bbox: vectorTileFeature.bbox(),
      geometry: vectorTileFeature.loadGeometry().map(points => points.map(p => [p.x, p.y])),
      properties: vectorTileFeature.properties,
    };
  } 
}
