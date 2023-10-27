import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png/png_tile';
import { Painter } from '../painter';
import { MapRenderer, RenderingCache } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { WebGlPainter, GlProgram, WebGlImage } from '../../../webgl';
import { getLayerGlPrograms } from './gl_render_utils';
import { DataTileStyles } from '../../styles/styles';

export interface WebGlRenderingCache extends RenderingCache {
  programs: GlProgram[];
}

export class GlMapRenderer extends MapRenderer {
  protected readonly animationFrameTaskIdSet = new Set<number>();
  protected canvasEl?: HTMLCanvasElement;
  protected glPainter?: Painter;

  constructor(protected readonly map: GlideMap, protected readonly devicePixelRatio: number) {
    super(map, devicePixelRatio);
    this.resizeEventListener = this.resizeEventListener.bind(this);
  }

  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new WebGlPainter(this.canvasEl, this.devicePixelRatio);

    this.glPainter.init();
    this.map.on(MapEventType.RESIZE, this.resizeEventListener);
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

    this.glPainter?.setWidth(width);
    this.glPainter?.setHeight(height);
  }

  public destroy() {
    this.stopRender();
    this.glPainter?.destroy();
    this.map.off(MapEventType.RESIZE, this.resizeEventListener);

    if (this.canvasEl) {
      this.map.rootEl.removeChild(this.canvasEl);
    }
  }

  public renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState) {
    const glPrograms = tiles.map(tile => this.getRenderPrograms(tile, styles, mapState)).flatMap(obj => obj);

    console.time('gl map_render');
    this.glPainter.draw(glPrograms);
    console.timeEnd('gl map_render');
  }

  public preheatTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState) {
    for (const tile of tiles) {
      this.preheatTile(tile, styles, mapState);
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

  private preheatTile(tile: MapTile, styles: DataTileStyles, mapState: MapState) {
    if (tile.hasRenderingCache()) {
      return;
    }

    // will set rendering context cache inside
    const programs = this.getRenderPrograms(tile, styles, mapState);

    for (const program of programs) {
      this.glPainter.preheat(program);
    }
  }

  private getRenderPrograms(tile: MapTile, styles: DataTileStyles, mapState: MapState): GlProgram[] {
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImagePrograms(tile as PngMapTile, mapState);
    }

    return this.getDataTilePrograms(tile, styles, mapState);
  }

  private getDataTilePrograms(tile: MapTile, styles: DataTileStyles, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(mapState);
    const xScale = (tile.devicePixelRatio / 16) * tileScale;
    const yScale = (tile.devicePixelRatio / 16) * tileScale;
    const tileX = tile.x * (tileScale * tile.devicePixelRatio);
    const tileY = tile.y * (tileScale * tile.devicePixelRatio);
    const scale: [number, number] = [xScale, yScale];

    if (tile.hasRenderingCache()) {
      const cachedPrograms = (tile.getRenderingCache() as WebGlRenderingCache).programs;

      for (const program of cachedPrograms) {
        program.setScale(scale);
        program.setTranslation([tileX, tileY]);
      }

      return cachedPrograms;
    }

    const sourceLayers = tile.getLayers();
    if (!sourceLayers || Object.keys(sourceLayers).length === 0 || !styles || Object.keys(styles).length === 0) {
      return [] as GlProgram[];
    }

    const programs: GlProgram[] = [];

    const styleLayers = Object.values(styles).sort((l1, l2) => l1.layerIndex - l2.layerIndex);
    for (const styleLayer of styleLayers) {
      const sourceLayer = sourceLayers[styleLayer.styleLayerName];

      if (!sourceLayer) {
        continue;
      }

      programs.push(
        ...getLayerGlPrograms({
          layer: sourceLayer,
          mapState,
          x: tileX,
          y: tileY,
          scale,
          width: tile.width,
          height: tile.height,
          fontManager: this.map.getFontManager(),
        })
      );
    }

    tile.setRenderingCache({ programs });

    return programs;
  }

  private getImagePrograms(tile: PngMapTile, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(mapState) * tile.devicePixelRatio;
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;

    if (tile.hasRenderingCache()) {
      const cachedPrograms = (tile.getRenderingCache() as WebGlRenderingCache).programs;

      for (const program of cachedPrograms) {
        program.setScale([tileScale, tileScale]);
        program.setTranslation([tileX, tileY]);
      }

      return cachedPrograms;
    }

    const programs = [
      new WebGlImage({
        width: tile.width,
        height: tile.height,
        image: tile.image!,
        scale: [tileScale, tileScale],
        translation: [tileX, tileY],
      }),
    ];

    tile.setRenderingCache({ programs });

    return programs;
  }
}
