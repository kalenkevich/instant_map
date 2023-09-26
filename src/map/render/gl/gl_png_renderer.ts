import { MapTile } from '../../tile/tile';
import { PngMapTile } from '../../tile/png_tile';
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap } from '../../map';
import { WebGlPainter, GlProgram } from '../../../webgl';

export class GlPngMapRenderer implements MapRenderer {
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
    const glPrograms = tiles.map(tile => this.getRenderProgram(tile as PngMapTile, mapState));
  
    this.glPainter.setPrograms(glPrograms);
    this.glPainter.draw();
  }

  getRenderProgram(tile: PngMapTile, mapState: MapState): GlProgram {

  }

  stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
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