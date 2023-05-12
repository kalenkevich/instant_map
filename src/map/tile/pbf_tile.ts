import Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import {MapTile} from './tile';
import { GlProgram } from "../../gl";
import {
  getTileBorders,
  getTransportationFeatures,
  getBuildingFeatures,
  getBoundaryFeatures,
  getWaterFeatures,
  getLandCoverFeatures,
} from '../render/vector_feature_gl_render';
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
  gl: WebGLRenderingContext;
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

  constructor(gl: WebGLRenderingContext, options: MapTileOptions) {
    super();

    this.gl = gl;
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

      const tileUrl = this.tilesMeta.tiles[0]
        .replace('{z}', z.toString())
        .replace('{x}', x.toString())
        .replace('{y}', y.toString());

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
      ...getWaterFeatures(
        this.gl,
        this.tileData.layers.water, 
        this.x,
        this.y,
        this.width,
        this.height,
        this.pixelRatio,
        this.mapWidth,
        this.mapHeight,
        this.tilesMeta.bounds as [number, number, number, number],
      ),
      ...getLandCoverFeatures(
        this.gl,
        this.tileData.layers.landcover, 
        this.x,
        this.y,
        this.width,
        this.height,
        this.pixelRatio,
        this.mapWidth,
        this.mapHeight,
        this.tilesMeta.bounds as [number, number, number, number],
      ),
      ...getLandCoverFeatures(
        this.gl,
        this.tileData.layers.globallandcover, 
        this.x,
        this.y,
        this.width,
        this.height,
        this.pixelRatio,
        this.mapWidth,
        this.mapHeight,
        this.tilesMeta.bounds as [number, number, number, number],
      ),
      ...getBoundaryFeatures(
        this.gl,
        this.tileData.layers.boundary,
        this.x,
        this.y,
        this.width,
        this.height,
        this.pixelRatio,
        this.mapWidth,
        this.mapHeight,
        this.tilesMeta.bounds as [number, number, number, number],
      ),
      ...getTransportationFeatures(
        this.gl,
        this.tileData.layers.transportation,
        this.x,
        this.y,
        this.width,
        this.height,
        this.pixelRatio,
        this.mapWidth,
        this.mapHeight,
        this.tilesMeta.bounds as [number, number, number, number],
      ),
      //...getBuildingFeatures(this.gl, this.tileData.layers.building),
    ];
  }
}