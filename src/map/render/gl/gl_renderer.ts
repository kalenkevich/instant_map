import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png_tile';
import { Painter } from '../painter';
import { MapRenderer, RenderingCache } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { WebGlPainter, GlProgram, WebGlImage } from '../../../webgl';
import { DefaultSipmlifyGeometryOptions } from '../simplify';
import { getTransportationGlPrograms, getBuildingGlPrograms, getBoundaryGlPrograms, getWaterGlPrograms, getLandCoverGlPrograms } from './gl_render_utils';

export interface WebGlRenderingCache extends RenderingCache {
  programs: GlProgram[];
}

const simplifyOptions = {
  ...DefaultSipmlifyGeometryOptions,
  tolerance: 10,
};
export class GlMapRenderer extends MapRenderer {
  protected readonly animationFrameTaskIdSet = new Set<number>();
  protected canvasEl?: HTMLCanvasElement;
  protected glPainter?: Painter;

  constructor(
    protected readonly map: GlideMap,
    protected readonly devicePixelRatio: number,
  ) {
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

  public renderTiles(tiles: MapTile[], mapState: MapState) {
    const glPrograms = tiles
      .map(tile => this.getRenderPrograms(tile, mapState))
      .flatMap(obj => obj);

    console.time('gl map_render');
    this.glPainter.draw(glPrograms);
    console.timeEnd('gl map_render');
  }

  public preheatTiles(tiles: MapTile[], mapState: MapState) {
    for (const tile of tiles) {
      this.preheatTile(tile, mapState);
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

  private preheatTile(tile: MapTile, mapState: MapState) {
    if (tile.hasRenderingCache()) {
      return;
    }

    // will set rendering context cache inside
    const programs = this.getRenderPrograms(tile, mapState);

    for (const program of programs) {
      this.glPainter.preheat(program);
    }
  }

  private getRenderPrograms(tile: MapTile, mapState: MapState): GlProgram[] {
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImagePrograms(tile as PngMapTile, mapState);
    }

    return this.getDataTilePrograms(tile, mapState);
  }

  private getDataTilePrograms(tile: MapTile, mapState: MapState): GlProgram[] {
    const tileScale = this.getTileScale(mapState);
    const xScale = tile.devicePixelRatio / 16 * tileScale;
    const yScale = tile.devicePixelRatio / 16 * tileScale;
    const tileX = tile.x * (tileScale * tile.devicePixelRatio);
    const tileY = tile.y * (tileScale * tile.devicePixelRatio);
    const scale: [number, number] = [
      xScale,
      yScale,
    ];

    if (tile.hasRenderingCache()) {
      const cachedPrograms = (tile.getRenderingCache() as WebGlRenderingCache).programs;

      for (const program of cachedPrograms) {
        program.setScale(scale);
        program.setTranslation([tileX, tileY]);
      }

      return cachedPrograms;
    }

    const tileLayers = tile.getLayers();
    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as GlProgram[];
    }

    const waterLayer = tileLayers['water'];
    const globallandcoverLayer = tileLayers['globallandcover'];
    const landcoverLayer = tileLayers['landcover'];
    const boundaryLayer = tileLayers['boundary'];
    const transportationLayer = tileLayers['transportation'];
    const buildingLayer = tileLayers['building'];

    const programs = [
      ...(waterLayer?.shouldBeRendered(mapState.zoom) 
        ? getWaterGlPrograms(waterLayer, tileX, tileY, scale, {enabled: false})
        : []),
      ...(globallandcoverLayer?.shouldBeRendered(mapState.zoom)
        ? getLandCoverGlPrograms(globallandcoverLayer, tileX, tileY, scale, {enabled: false})
        : []),
      ...(landcoverLayer?.shouldBeRendered(mapState.zoom)
        ? getLandCoverGlPrograms(landcoverLayer, tileX, tileY, scale, {enabled: false})
        :[]),
      ...(boundaryLayer?.shouldBeRendered(mapState.zoom)
       ? getBoundaryGlPrograms(boundaryLayer, tileX, tileY, scale, simplifyOptions)
       : []),
      ...(transportationLayer?.shouldBeRendered(mapState.zoom)
        ? getTransportationGlPrograms(transportationLayer, tileX, tileY, scale, simplifyOptions)
        : []),
      ...(buildingLayer?.shouldBeRendered(mapState.zoom)
       ? getBuildingGlPrograms(buildingLayer, tileX, tileY, scale, simplifyOptions)
       : []),
    ];

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
