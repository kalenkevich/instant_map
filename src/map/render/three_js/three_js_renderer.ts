import { Object3D } from 'three';
import { MapTile } from '../../tile/tile';
import { MapState } from '../../map_state';
import { MapEventType } from '../../map';
import { RenderingCache } from '../renderer';
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

export interface ThreeJsRenderingCache extends RenderingCache {
  objects: Object3D[];
}

const simplifyOptions = {
  ...DefaultSipmlifyGeometryOptions,
  tolerance: 10,
};

export class ThreeJsMapRenderer extends GlMapRenderer {
  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new ThreeJsPainter(this.canvasEl, this.devicePixelRatio);

    this.glPainter.init();
    this.map.on(MapEventType.RESIZE, this.resizeEventListener);
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
    const tileScale = this.getTileScale(mapState);
    const xScale = 1/16 * tileScale;
    const yScale = 1/16 * tileScale;
    const tileX = tile.x * tileScale;
    const tileY = tile.y * tileScale;
    const scale: [number, number] = [
      xScale,
      yScale,
    ];

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
    const waterLayer = tileLayers['water'];
    const globallandcoverLayer = tileLayers['globallandcover'];
    const landcoverLayer = tileLayers['landcover'];
    const boundaryLayer = tileLayers['boundary'];
    const transportationLayer = tileLayers['transportation'];
    const buildingLayer = tileLayers['building'];

    const objects = [
      ...(waterLayer?.shouldBeRendered(mapState.zoom) 
        ? getWaterThreeJsObjects(waterLayer, tileX, tileY, scale, {enabled: false})
        : []),
      ...(globallandcoverLayer?.shouldBeRendered(mapState.zoom)
        ? getLandCoverThreeJsObjects(globallandcoverLayer, tileX, tileY, scale, {enabled: false})
        : []),
      ...(landcoverLayer?.shouldBeRendered(mapState.zoom)
        ? getLandCoverThreeJsObjects(landcoverLayer, tileX, tileY, scale, {enabled: false})
        :[]),
      ...(boundaryLayer?.shouldBeRendered(mapState.zoom)
       ? getBoundaryThreeJsObjects(boundaryLayer, tileX, tileY, scale, simplifyOptions)
       : []),
      ...(transportationLayer?.shouldBeRendered(mapState.zoom)
        ? getTransportationThreeJsObjects(transportationLayer, tileX, tileY, scale, simplifyOptions)
        : []),
      ...(buildingLayer?.shouldBeRendered(mapState.zoom)
       ? getBuildingThreeJsObjects(buildingLayer, tileX, tileY, scale, simplifyOptions)
       : []),
    ];

    tile.setRenderingCache({ objects });

    return objects;
  }
}
