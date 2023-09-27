import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png_tile'
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { WebGlPainter, GlProgram, v2, WebGlImage } from '../../../webgl';
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

  init() {
    this.map.addEventListener({
      eventType: MapEventType.RESIZE,
      handler: () => {
        const width = this.map.getWidth();
        const height = this.map.getHeight();
  
        this.canvasEl.width = width;
        this.canvasEl.height = height;
        this.canvasEl.style.width = `${width}px`;
        this.canvasEl.style.height = `${height}px`;
      },
    });
  }

  createCanvasEl(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const width = this.map.getWidth();
    const height = this.map.getHeight();

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

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
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImagePrograms(tile as PngMapTile, mapState);
    }

    return this.getDataTilePrograms(tile, mapState);
  }

  private getDataTilePrograms(tile: MapTile, mapState: MapState): GlProgram[] {
    const tileLayers = tile.getLayers();

    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as GlProgram[];
    }

    const simplifyOptions = {
      ...DefaultSipmlifyGeometryOptions,
      tolerance: 10,
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

  private getImagePrograms(tile: PngMapTile, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(mapState);
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;

    return [
      new WebGlImage({
        width: tile.width,
        height: tile.height,
        image: tile.image,
        scale: [
          tileScale,
          tileScale,
        ],
        translation: [tileX, tileY],
      }),
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