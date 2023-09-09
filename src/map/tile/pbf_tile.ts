import Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import { MapTile, MapTileOptions, TileCoordinate } from './tile';
import { GlProgram } from '../../webgl';
import {
  getTransportationFeatures,
  getBuildingFeatures,
  getBoundaryFeatures,
  getWaterFeatures,
  getLandCoverFeatures,
  getTileBorders,
  SipmlifyGeometryOptions,
  DefaultSipmlifyGeometryOptions,
} from '../render/pbf_gl_render_utils';
import { MapTilesMeta } from '../types';

export interface PbfMapTileOptions extends MapTileOptions {
  tilesMeta: MapTilesMeta;
}

export class PbfMapTile extends MapTile {
  originalX: number
  originalY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  mapZoom: number;
  tileCoords: TileCoordinate;
  pixelRatio: number;
  tilesMeta: MapTilesMeta;
  tileData?: VectorTile;
  isDataLoading: boolean = false;
  scaleFactor: number;
  scale: [number, number];

  constructor(options: PbfMapTileOptions) {
    super(options);

    this.originalX = options.renderOptions.x;
    this.originalY = options.renderOptions.y;
    this.scaleFactor = options.renderOptions.scale;
    this.x = this.originalX * options.renderOptions.scale;
    this.y = this.originalY * options.renderOptions.scale;
    this.width = options.renderOptions.width;
    this.height = options.renderOptions.height;
    this.mapWidth = options.renderOptions.mapWidth;
    this.mapHeight = options.renderOptions.mapHeight;
    this.mapZoom = options.renderOptions.mapZoom;
    this.pixelRatio = options.renderOptions.pixelRatio || window.devicePixelRatio || 1;

    this.tileCoords = options.tileCoords;
    this.tilesMeta = options.tilesMeta;
    this.scale = [
      (this.width / this.mapWidth / this.pixelRatio) * options.renderOptions.scale,
      (this.height / this.mapHeight / this.pixelRatio) * options.renderOptions.scale,
    ];
  }

  setZoom(zoom: number) {
    this.mapZoom = zoom;
  }

  setScale(scale: number) {
    this.scaleFactor = scale;
    this.x = this.originalX * scale;
    this.y = this.originalY * scale;

    this.scale = [
      (this.width / this.mapWidth / this.pixelRatio) * scale,
      (this.height / this.mapHeight / this.pixelRatio) * scale,
    ];
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

      const tileUrl = this.tilesMeta.tiles[0]
        .replace('{z}', this.tileCoords.z.toString())
        .replace('{x}', this.tileCoords.x.toString())
        .replace('{y}', this.tileCoords.y.toString());

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

    const simplifyOptions = {
      ...DefaultSipmlifyGeometryOptions,
      tolerance: 50 / this.mapZoom,
    };

    return [
      ...getWaterFeatures(this.tileData.layers.water, this.x, this.y, this.scale, {enabled: false}),
      ...getLandCoverFeatures(this.tileData.layers.globallandcover, this.x, this.y, this.scale, {enabled: false}),
      ...getLandCoverFeatures(this.tileData.layers.landcover, this.x, this.y, this.scale, {enabled: false}),
      // ...getBoundaryFeatures(this.tileData.layers.boundary, this.x, this.y, this.scale, simplifyOptions),
      // ...getTransportationFeatures(this.tileData.layers.transportation, this.x, this.y, this.scale),
      // ...getBuildingFeatures(this.tileData.layers.building, this.x, this.y, this.scale),
      // ...getTileBorders(this.x, this.y, this.width, this.height),
    ];
  }
}
