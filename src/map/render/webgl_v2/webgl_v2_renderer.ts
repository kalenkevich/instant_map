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

  public renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): Promise<GlRenderStats> {
    let objects = 0;

    return new Promise(resolve => {
      const timeStart = Date.now();

      const renderTiles = (tileIndex: number) => {
        if (tileIndex > 0) {
          resolve({
            timeInMs: Date.now() - timeStart,
            tiles: tiles.length,
            objects,
          });

          return;
        }

        const globalUniforms = this.getTileUniforms(tiles[tileIndex], mapState);
        const objectsByLayers = this.getRenderObjects(tiles[tileIndex], styles, mapState);

        const renderObjects = (layerIndex: number) => {
          if (layerIndex === objectsByLayers.length) {
            renderTiles(tileIndex + 1);
            return;
          }

          this.animationFrameTaskIdSet.add(
            requestAnimationFrame(() => {
              if (tileIndex === 0 && layerIndex === 0) {
              }

              objects += objectsByLayers[layerIndex].length;
              this.glPainter.draw(objectsByLayers[layerIndex], globalUniforms);

              renderObjects(layerIndex + 1);
            })
          );
        };
        renderObjects(0);
      };

      renderTiles(0);
    });
  }

  public clear() {
    this.glPainter.clear();
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

  private getRenderObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): WebGl2Object[][] {
    if (tile.formatType === MapTileFormatType.png) {
      return this.getImageObjects(tile as PngMapTile, mapState);
    }

    return this.getDataTileObjects(tile, styles, mapState);
  }

  private getDataTileObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): WebGl2Object[][] {
    const sourceLayers = tile.getLayers();
    if (!sourceLayers || Object.keys(sourceLayers).length === 0 || !styles || Object.keys(styles.layers).length === 0) {
      return [] as WebGl2Object[][];
    }

    const objects: WebGl2Object[][] = [];

    const styleLayers = Object.values(styles.layers).sort((l1, l2) => l1.zIndex - l2.zIndex);
    for (const styleLayer of styleLayers) {
      const sourceLayer = sourceLayers[styleLayer.styleLayerName];

      if (!sourceLayer) {
        continue;
      }

      objects.push(
        getLayerGl2Objects({
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

  private getImageObjects(tile: PngMapTile, mapState: MapState): WebGl2Object[][] {
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
