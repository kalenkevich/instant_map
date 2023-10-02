import { Object3D } from 'three';
import { MapTile } from '../../tile/tile';
import { MapState } from '../../map_state';
import { MapEventType } from '../../map';
import { GlMapRenderer } from '../gl/gl_renderer';
import { DefaultSipmlifyGeometryOptions } from '../simplify';
import { ThreeJsPainter } from './three_js_painter';
import {
  getTransportationThreeJsObjects,
  getBuildingThreeJsObjects,
  getBoundaryThreeJsObjects,
  getWaterThreeJsObjects,
  getLandCoverThreeJsObjects,
} from './three_js_utils';

const simplifyOptions = {
  ...DefaultSipmlifyGeometryOptions,
  tolerance: 10,
};

export class ThreeJsMapRenderer extends GlMapRenderer {
  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new ThreeJsPainter(this.canvasEl, this.devicePixelRatio);

    this.glPainter.init();
    this.map.addEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });
  }

  public renderTiles(tiles: MapTile[], mapState: MapState) {
    const objects = tiles
      .map(tile => this.getThreeJsObjects(tile, mapState))
      .flatMap(obj => obj);

    console.time('three_js map_render');
    this.glPainter.draw(objects);
    console.timeEnd('three_js map_render');
  }

  private getThreeJsObjects(tile: MapTile, mapState: MapState): Object3D[] {
    const tileLayers = tile.getLayers();

    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as Object3D[];
    }

    const tileScale = this.getTileScale(mapState);
    const xScale = 1/16 * tileScale;
    const yScale = 1/16 * tileScale;
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;
    const scale: [number, number] = [
      xScale,
      yScale,
    ];

    return [
      ...getWaterThreeJsObjects(tileLayers['water'], tileX, tileY, scale, {enabled: false}),
      ...getLandCoverThreeJsObjects(tileLayers['globallandcover'], tileX, tileY, scale, {enabled: false}),
      ...getLandCoverThreeJsObjects(tileLayers['landcover'], tileX, tileY, scale, {enabled: false}),
      ...getBoundaryThreeJsObjects(tileLayers['boundary'], tileX, tileY, scale, simplifyOptions),
      ...getTransportationThreeJsObjects(tileLayers['transportation'], tileX, tileY, scale, this.map.getWidth(), this.map.getHeight(), simplifyOptions),
      ...getBuildingThreeJsObjects(tileLayers['building'], tileX, tileY, scale, simplifyOptions),
    ];
  }
}
