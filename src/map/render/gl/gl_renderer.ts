import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png_tile'
import { Painter } from '../painter';
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { WebGlPainter, GlProgram, v2, WebGlImage } from '../../../webgl';
import { DefaultSipmlifyGeometryOptions } from '../simplify';
import {
  getTransportationGlPrograms,
  getBuildingGlPrograms,
  getBoundaryGlPrograms,
  getWaterGlPrograms,
  getLandCoverGlPrograms,
} from './gl_render_utils';

export class GlMapRenderer implements MapRenderer {
  protected readonly animationFrameTaskIdSet = new Set<number>();
  protected canvasEl?: HTMLCanvasElement;
  protected glPainter?: Painter;

  constructor(
    protected readonly map: GlideMap,
  ) {
    this.map = map;
    this.resizeEventListener = this.resizeEventListener.bind(this);
  }

  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new WebGlPainter(this.canvasEl);

    this.glPainter.init();
    this.map.addEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });
  }

  public resizeEventListener() {
    if (!this.canvasEl) {
      return;
    }

    const width = this.map.getWidth();
    const height = this.map.getHeight();

    this.canvasEl.width = width;
    this.canvasEl.height = height;
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;

    this.glPainter.setWidth(width);
    this.glPainter.setHeight(height);
  }

  public destroy() {
    this.stopRender();
    this.glPainter?.destroy();
    this.map.removeEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });

    if (this.canvasEl) {
      this.map.rootEl.removeChild(this.canvasEl);
    }
  }

  public renderTiles(tiles: MapTile[], mapState: MapState) {
    for (const tile of tiles) {
      const taskId = requestAnimationFrame(() => {
        const glPrograms = this.getRenderPrograms(tile, mapState);
  
        console.time('gl map_render');
        this.glPainter?.draw(glPrograms);
        console.timeEnd('gl map_render');

        this.animationFrameTaskIdSet.delete(taskId);
      });
      this.animationFrameTaskIdSet.add(taskId);
    }
  }

  public stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
  }

  protected createCanvasEl(): HTMLCanvasElement {
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
      (tile.width / tile.mapWidth) * tileScale,
      (tile.height / tile.mapHeight) * tileScale,
    ];

    return [
      // ...getWaterGlPrograms(tileLayers['water'], tileX, tileY, scale, {enabled: false}),
      // ...getLandCoverGlPrograms(tileLayers['globallandcover'], tileX, tileY, scale, {enabled: false}),
      // ...getLandCoverGlPrograms(tileLayers['landcover'], tileX, tileY, scale, {enabled: false}),
      // ...getBoundaryGlPrograms(tileLayers['boundary'], tileX, tileY, scale, simplifyOptions),
      ...getTransportationGlPrograms(tileLayers['transportation'], tileX, tileY, scale, simplifyOptions),
      // ...getBuildingGlPrograms(tileLayers['building'], tileX, tileY, scale, simplifyOptions),
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

  protected getTileScale({ zoom, center }: MapState): number {
    const tileZoom = this.getTileZoom(zoom);

    return this.map.getZoomScale(zoom, tileZoom);
  }

  protected getTileZoom(mapZoom: number): number | undefined {
    let tileZoom = Math.round(mapZoom);

    if (tileZoom > this.map.getMaxZoom() || tileZoom < this.map.getMinZoom()) {
      return undefined;
    }

    return this.clampZoom(tileZoom);
  }

  protected clampZoom(zoom: number) {
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