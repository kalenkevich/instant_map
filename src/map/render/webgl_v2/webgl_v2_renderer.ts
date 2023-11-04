import { MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png/png_tile';
import { MapState } from '../../map_state';
import { MapEventType } from '../../map';
import { DataTileStyles } from '../../styles/styles';
import { GlMapRenderer, GlRenderStats } from '../webgl/gl_renderer';
import { WebGl2Painter } from '../../../webgl_v2/painter';
import { WebGl2Object } from '../../../webgl_v2/objects/object';
import { getLayerGl2Objects } from './webgl_v2_render_utils';

export class Gl2MapRenderer extends GlMapRenderer {
  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new WebGl2Painter(this.canvasEl, this.devicePixelRatio);

    this.glPainter.init();
    this.map.on(MapEventType.RESIZE, this.resizeEventListener);
  }

  public preheatTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): GlRenderStats {
    return {
      timeInMs: 0,
      tiles: 0,
      objects: 0,
    };
  }

  public renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): GlRenderStats {
    const timeStart = Date.now();

    const globalUniforms = this.getTileUniforms(tiles[0], mapState);
    const objects = this.getRenderObjects(tiles[0], styles, mapState);

    this.glPainter.draw(objects, globalUniforms);

    return {
      timeInMs: Date.now() - timeStart,
      tiles: tiles.length,
      objects: objects.length,
    };
  }

  private getTileUniforms(tile: MapTile, mapState: MapState) {
    const tileScale = this.getTileScale(tile.width, mapState);
    const scale = tileScale / tile.devicePixelRatio;
    const tileX = tile.x * (tileScale * tile.devicePixelRatio);
    const tileY = tile.y * (tileScale * tile.devicePixelRatio);

    return {
      translation: [tileX, tileY],
      scale: [scale, scale],
      resolution: this.resolution,
    };
  }

  private getRenderObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): WebGl2Object[] {
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImageObjects(tile as PngMapTile, mapState);
    }

    return this.getDataTileObjects(tile, styles, mapState);
  }

  private getDataTileObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): WebGl2Object[] {
    const sourceLayers = tile.getLayers();
    if (!sourceLayers || Object.keys(sourceLayers).length === 0 || !styles || Object.keys(styles.layers).length === 0) {
      return [] as WebGl2Object[];
    }

    const objects: WebGl2Object[] = [];

    const styleLayers = Object.values(styles.layers).sort((l1, l2) => l1.zIndex - l2.zIndex);
    for (const styleLayer of styleLayers) {
      const sourceLayer = sourceLayers[styleLayer.styleLayerName];

      if (!sourceLayer) {
        continue;
      }

      objects.push(
        ...getLayerGl2Objects({
          layer: sourceLayer,
          mapState,
          width: tile.width,
          height: tile.height,
          fontManager: this.map.getFontManager(),
          devicePixelRatio: tile.devicePixelRatio,
        })
      );
    }

    return objects;
  }

  private getImageObjects(tile: PngMapTile, mapState: MapState): WebGl2Object[] {
    // const tileScale = this.getTileScale(tile.width, mapState) * tile.devicePixelRatio;
    // const tileX = tile.x * tileScale;
    // const tileY = tile.y * tileScale;

    // const programs = [
    //   new WebGlImage({
    //     width: tile.width,
    //     height: tile.height,
    //     image: tile.image!,
    //     scale: [tileScale, tileScale],
    //     translation: [tileX, tileY],
    //   }),
    // ];

    // tile.setRenderingCache({ programs });

    // return programs;

    return [];
  }
}
