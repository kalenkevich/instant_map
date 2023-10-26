import { Object3D } from 'three';
import { MapTile } from '../../tile/tile';
import { MapState } from '../../map_state';
import { MapEventType } from '../../map';
import { RenderingCache } from '../renderer';
import { GlMapRenderer } from '../gl/gl_renderer';
import { ThreeJsPainter } from './three_js_painter';
import { getLayerObjects } from './three_js_utils';
import { DataTileStyles } from '../../styles/styles';

export interface ThreeJsRenderingCache extends RenderingCache {
  objects: Object3D[];
}

export class ThreeJsMapRenderer extends GlMapRenderer {
  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new ThreeJsPainter(this.canvasEl, this.devicePixelRatio);

    this.glPainter.init();
    this.map.on(MapEventType.RESIZE, this.resizeEventListener);
  }

  public renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState) {
    const objects = tiles.map(tile => this.getThreeJsObjects(tile, styles, mapState)).flatMap(obj => obj);

    console.time('three_js map_render');
    this.glPainter.draw(objects);
    console.timeEnd('three_js map_render');
  }

  private getThreeJsObjects(tile: MapTile, styles: DataTileStyles, mapState: MapState): Object3D[] {
    const tileScale = this.getTileScale(mapState);
    const xScale = (1 / 16) * tileScale;
    const yScale = (1 / 16) * tileScale;
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;
    const scale: [number, number] = [xScale, yScale];
    const mapWidth = this.map.getWidth();
    const mapHeight = this.map.getHeight();

    if (tile.hasRenderingCache()) {
      const cachedObjects = (tile.getRenderingCache() as ThreeJsRenderingCache).objects;

      for (const object of cachedObjects) {
        object.translateX(tileX);
        object.translateY(tileY);
        object.scale.set(scale[0], scale[1], 1);
      }

      return cachedObjects;
    }

    const tileLayers = tile.getLayers();
    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as Object3D[];
    }

    const objects: Object3D[] = [];

    for (const styleLayer of Object.values(styles)) {
      objects.push(
        ...getLayerObjects({
          layer: tileLayers[styleLayer.sourceLayer],
          mapState,
          x: tileX,
          y: tileY,
          scale,
          width: tile.width,
          height: tile.height,
          mapWidth,
          mapHeight,
        })
      );
    }

    tile.setRenderingCache({ objects });

    return objects;
  }
}
