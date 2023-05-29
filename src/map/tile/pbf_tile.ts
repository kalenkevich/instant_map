import Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import { MapTile } from './tile';
import { GlProgram } from '../../webgl';
import { getTransportationFeatures, getBuildingFeatures, getBoundaryFeatures, getWaterFeatures, getLandCoverFeatures } from '../render/pbf_gl_render_utils';
import { ZXY, MapTilesMeta } from '../types';

export interface MapTileOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  tileZXY: ZXY;
  tilesMeta: MapTilesMeta;
  pixelRatio?: number;
  blank?: boolean;
}

export class MapPbfTile extends MapTile {
  x: number;
  y: number;
  tileZXY: ZXY;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  pixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileData?: VectorTile;
  isDataLoading: boolean = false;
  blank: boolean;
  scale: [number, number];

  constructor(options: MapTileOptions) {
    super();

    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.blank = options.blank || false;

    this.tileZXY = options.tileZXY;
    this.tilesMeta = options.tilesMeta;
    this.scale = [this.width / this.mapWidth / this.pixelRatio, this.height / this.mapHeight / this.pixelRatio];
  }

  /**
   * Loads tile data if it was not loaded yet. Returns the promise of the success load.
   */
  async fetchTileData(abortSignal?: AbortSignal): Promise<void> {
    if (this.tileData) {
      return Promise.resolve();
    }

    try {
      this.isDataLoading = true;
      const [z, x, y] = this.tileZXY;

      const tileUrl = this.tilesMeta.tiles[0].replace('{z}', z.toString()).replace('{x}', x.toString()).replace('{y}', y.toString());

      const data = await fetch(tileUrl, { signal: abortSignal }).then(data => data.arrayBuffer());

      this.tileData = new VectorTile(new Protobuf(data));
    } catch (e) {
      if (e.type === 'AbortError') {
        // skip error;

        return Promise.resolve();
      }

      return Promise.reject();
    } finally {
      this.isDataLoading = false;
    }

    return Promise.resolve();
  }

  getRenderPrograms(): GlProgram[] {
    if (!this.tileData) {
      return [] as GlProgram[];
    }

    return [
      ...getWaterFeatures(this.tileData.layers.water, this.x, this.y, this.scale),
      ...getLandCoverFeatures(this.tileData.layers.landcover, this.x, this.y, this.scale),
      ...getLandCoverFeatures(this.tileData.layers.globallandcover, this.x, this.y, this.scale),
      ...getBoundaryFeatures(this.tileData.layers.boundary, this.x, this.y, this.scale),
      ...getTransportationFeatures(this.tileData.layers.transportation, this.x, this.y, this.scale),
      ...getBuildingFeatures(this.tileData.layers.building, this.x, this.y, this.scale),
    ];
  }
}
