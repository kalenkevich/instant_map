import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png/png_tile';
import { Painter } from '../painter';
import { MapRenderer, RenderStats, RenderingCache } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { WebGlPainter, GlProgram, WebGlImage } from '../../../webgl';
import { getLayerGlPrograms } from './gl_render_utils';
import { DataTileStyles } from '../../styles/styles';

export interface WebGlRenderingCache extends RenderingCache {
  programs: GlProgram[];
}

export interface GlRenderStats extends RenderStats {
  objects: number; // number of WebGl objects
}

export class GlMapRenderer extends MapRenderer {
  protected readonly animationFrameTaskIdSet = new Set<number>();
  protected canvasEl?: HTMLCanvasElement;
  protected glPainter?: Painter;
  protected resolution: [number, number];

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

    const width = this.map.getWidth() * this.devicePixelRatio;
    const height = this.map.getHeight() * this.devicePixelRatio;

    this.canvasEl.width = width;
    this.canvasEl.height = height;
    this.canvasEl.style.width = `${width / this.devicePixelRatio}px`;
    this.canvasEl.style.height = `${height / this.devicePixelRatio}px`;

    this.glPainter?.resize(width, height);
    this.resolution = [width, height];
  }

  public destroy() {
    this.stopRender();
    this.glPainter?.destroy();
    this.map.off(MapEventType.RESIZE, this.resizeEventListener);

    if (this.canvasEl) {
      this.map.rootEl.removeChild(this.canvasEl);
    }
  }

  public renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): GlRenderStats {
    const timeStart = Date.now();

    const glPrograms = tiles.map(tile => this.getRenderPrograms(tile, styles, mapState)).flatMap(obj => obj);
    this.glPainter.draw(glPrograms);

    return {
      timeInMs: Date.now() - timeStart,
      tiles: tiles.length,
      objects: glPrograms.length,
    };
  }

  public preheatTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): GlRenderStats {
    const timeStart = Date.now();

    let objects: number = 0;
    for (const tile of tiles) {
      objects += this.preheatTile(tile, styles, mapState).length;
    }

    return {
      timeInMs: Date.now() - timeStart,
      tiles: tiles.length,
      objects,
    };
  }

  public stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
  }

  protected createCanvasEl(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    // const width = this.map.getWidth();
    // const height = this.map.getHeight();
    const width = this.map.getWidth() * this.devicePixelRatio;
    const height = this.map.getHeight() * this.devicePixelRatio;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width / this.devicePixelRatio}px`;
    canvas.style.height = `${height / this.devicePixelRatio}px`;

    this.map.rootEl.appendChild(canvas);
    this.resolution = [width, height];

    return canvas;
  }

  private preheatTile(tile: MapTile, styles: DataTileStyles, mapState: MapState): GlProgram[] {
    if (tile.hasRenderingCache()) {
      return (tile.getRenderingCache() as WebGlRenderingCache).programs;
    }

    // will set rendering context cache inside
    const programs = this.getRenderPrograms(tile, styles, mapState);

    for (const program of programs) {
      this.glPainter.preheat(program);
    }

    return programs;
  }

  private getRenderPrograms(tile: MapTile, styles: DataTileStyles, mapState: MapState): GlProgram[] {
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImagePrograms(tile as PngMapTile, mapState);
    }

    return this.getDataTilePrograms(tile, styles, mapState);
  }

  private getDataTilePrograms(tile: MapTile, styles: DataTileStyles, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(tile.width, mapState);
    const xScale = tileScale / tile.devicePixelRatio;
    const yScale = tileScale / tile.devicePixelRatio;
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
    if (!sourceLayers || Object.keys(sourceLayers).length === 0 || !styles || Object.keys(styles.layers).length === 0) {
      return [] as GlProgram[];
    }

    const programs: GlProgram[] = [];

    const styleLayers = Object.values(styles.layers).sort((l1, l2) => l1.zIndex - l2.zIndex);
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
          devicePixelRatio: tile.devicePixelRatio,
        })
      );
    }

    tile.setRenderingCache({ programs });

    return programs;
  }

  private getImagePrograms(tile: PngMapTile, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(tile.width, mapState) * tile.devicePixelRatio;
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
