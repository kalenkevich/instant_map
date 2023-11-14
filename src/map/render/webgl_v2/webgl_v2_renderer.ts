import { MapTileId, MapTile, MapTileFormatType } from '../../tile/tile';
import { PngMapTile } from '../../tile/png/png_tile';
import { MapState } from '../../map_state';
import { MapEventType } from '../../map';
import { DataTileStyles } from '../../styles/styles';
import { GlMapRenderer, GlRenderStats } from '../webgl/gl_renderer';
import { WebGl2Painter } from '../../../webgl_v2/painter';
import { WebGl2Object } from '../../../webgl_v2/objects/object';
import { getLayerGl2Objects } from './webgl_v2_render_utils';
import { LRUCache } from '../../utils/lru_cache';

export interface RenderFrame {
  index: number;
  objects: WebGl2Object[];
}

export class Gl2MapRenderer extends GlMapRenderer {
  renderTileCache: LRUCache<MapTileId, RenderFrame[]> = new LRUCache<MapTileId, RenderFrame[]>(32);

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
        if (tileIndex > 1) {
          resolve({
            timeInMs: Date.now() - timeStart,
            tiles: tiles.length,
            objects,
          });

          return;
        }

        const globalUniforms = this.getTileUniforms(tiles[tileIndex], mapState);
        const renderFrames = this.getRenderObjects(tiles[tileIndex], styles, mapState);

        const renderObjects = (layerIndex: number) => {
          if (layerIndex === renderFrames.length) {
            renderTiles(tileIndex + 1);
            return;
          }

          this.animationFrameTaskIdSet.add(
            requestAnimationFrame(() => {
              if (tileIndex === 0 && layerIndex === 0) {
                this.glPainter.clear();
              }

              objects += renderFrames[layerIndex].objects.length;
              this.glPainter.draw(renderFrames[layerIndex].objects, globalUniforms);

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

  private getRenderObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): RenderFrame[] {
    if (this.renderTileCache.has(tile.id)) {
      return this.renderTileCache.get(tile.id);
    }

    if (tile.formatType === MapTileFormatType.png) {
      const renderFrames = this.getImageObjects(tile as PngMapTile, mapState);
      this.renderTileCache.set(tile.id, renderFrames);

      return renderFrames;
    }

    const renderFrames = this.getDataTileObjects(tile, styles, mapState);
    this.renderTileCache.set(tile.id, renderFrames);

    return renderFrames;
  }

  private getDataTileObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): RenderFrame[] {
    const sourceLayers = tile.getLayers();
    if (!sourceLayers || Object.keys(sourceLayers).length === 0 || !styles || Object.keys(styles.layers).length === 0) {
      return [] as RenderFrame[];
    }

    const frames: RenderFrame[] = [];

    const styleLayers = Object.values(styles.layers).sort((l1, l2) => l1.zIndex - l2.zIndex);
    for (const styleLayer of styleLayers) {
      const sourceLayer = sourceLayers[styleLayer.styleLayerName];

      if (!sourceLayer) {
        continue;
      }

      frames.push({
        index: styleLayer.zIndex,
        objects: getLayerGl2Objects({
          layer: sourceLayer,
          mapState,
          width: tile.width,
          height: tile.height,
          fontManager: this.map.getFontManager(),
          devicePixelRatio: tile.devicePixelRatio,
        }),
      });
    }

    return frames;
  }

  private getImageObjects(tile: PngMapTile, mapState: MapState): RenderFrame[] {
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
