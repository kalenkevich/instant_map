import { MapTile } from '../../tile/tile';
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap } from '../../map';
import { WebGlPainter, GlProgram, v2 } from '../../../webgl';
import {
  getTransportationFeatures,
  getBuildingFeatures,
  getBoundaryFeatures,
  getWaterFeatures,
  getLandCoverFeatures,
  DefaultSipmlifyGeometryOptions,
} from './gl_render_utils';

export class GlMapRenderer implements MapRenderer {
  private readonly animationFrameTaskIdSet = new Set<number>();
  private readonly canvasEl: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly glPainter: WebGlPainter;

  constructor(
    private readonly map: GlideMap,
  ) {
    this.map = map;
    this.canvasEl = this.createCanvasEl();
    this.gl = this.canvasEl.getContext('webgl', {
      powerPreference: 'high-performance',
    });
    this.glPainter = new WebGlPainter(this.gl, []);
  }

  init() {}

  createCanvasEl(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');

    canvas.width = this.map.width * this.map.devicePixelRatio;
    canvas.height = this.map.height * this.map.devicePixelRatio;
    this.map.rootEl.appendChild(canvas);

    return canvas;
  }

  renderTiles(tiles: MapTile[], mapState: MapState) {
    for (const tile of tiles) {
      const taskId = requestAnimationFrame(() => {
        const glPrograms = this.getRenderPrograms(tile, mapState);
  
        console.time('gl map_render');
        this.glPainter.setPrograms(glPrograms);
        this.glPainter.draw();
        console.timeEnd('gl map_render');

        this.animationFrameTaskIdSet.delete(taskId);
      });
      this.animationFrameTaskIdSet.add(taskId);
    }
  }

  stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
  }

  private getRenderPrograms(tile: MapTile, mapState: MapState): GlProgram[] {
    const tileLayers = tile.getLayers();

    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as GlProgram[];
    }

    const simplifyOptions = {
      ...DefaultSipmlifyGeometryOptions,
      tolerance: 100 / mapState.zoom,
    };

    const tileScale = this.getTileScale(mapState);
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;
    const scale: v2 = [
      (tile.width / tile.mapWidth / tile.pixelRatio) * tileScale,
      (tile.height / tile.mapHeight / tile.pixelRatio) * tileScale,
    ];

    return [
      ...getWaterFeatures(tileLayers['water'], tileX, tileY, scale, {enabled: false}),
      ...getLandCoverFeatures(tileLayers['globallandcover'], tileX, tileY, scale, {enabled: false}),
      ...getLandCoverFeatures(tileLayers['landcover'], tileX, tileY, scale, {enabled: false}),
      ...getBoundaryFeatures(tileLayers['boundary'], tileX, tileY, scale, simplifyOptions),
      ...getTransportationFeatures(tileLayers['transportation'], tileX, tileY, scale, simplifyOptions),
      ...getBuildingFeatures(tileLayers['building'], tileX, tileY, scale, simplifyOptions),
    ];
  }

  getTileScale({ zoom, center }: MapState): number {
    const tileZoom = this.getTileZoom(zoom);

    return this.map.getZoomScale(zoom, tileZoom);
  }

  getTileZoom(mapZoom: number): number | undefined {
    let tileZoom = Math.round(mapZoom);

    if (tileZoom > this.map.getMaxZoom() || tileZoom < this.map.getMinZoom()) {
      return undefined;
    }

    return this.clampZoom(tileZoom);
  }

  clampZoom(zoom: number) {
    const minZoom = this.map.getMinZoom();
    const maxZoom = this.map.getMaxZoom();

    if (zoom < minZoom) {
      return minZoom;
    }

    if (maxZoom < zoom) {
      return maxZoom;
    }

    return zoom;
  }
}