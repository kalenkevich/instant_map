import * as THREE from 'three';
import { MapTile } from '../../tile/tile';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
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
import { TileCoordinate } from '../../tile/tile';
import { Projection } from '../../geo/projection/projection';
import { LatLng } from '../../geo/lat_lng';
import { Point } from '../../geometry/point';

export class ThreeJsMapRenderer extends GlMapRenderer {
  public init() {
    this.canvasEl = this.createCanvasEl();
    this.glPainter = new ThreeJsPainter(this.canvasEl);

    this.glPainter.init();
    this.map.addEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });
  }

  public renderTiles(tiles: MapTile[], mapState: MapState) {
    // const objects = tiles
    //   .map(tile => this.getThreeJsObjects(tile, mapState))
    //   .flatMap(obj => obj);

    const objects = this.getThreeJsObjects(tiles[0], mapState);

    console.time('three_js map_render');
    // console.log(cameraPos);
    this.glPainter.draw(objects);
    console.timeEnd('three_js map_render');
  }

  private getThreeJsObjects(tile: MapTile, mapState: MapState): THREE.Object3D[] {
    const tileLayers = tile.getLayers();

    if (!tileLayers || Object.keys(tileLayers).length === 0) {
      return [] as THREE.Object3D[];
    }

    const simplifyOptions = {
      ...DefaultSipmlifyGeometryOptions,
      tolerance: 10,
    };

    const tileX = tile.x;
    const tileY = tile.y;
    const scale: [number, number] = [
      tile.width / tile.mapWidth / tile.pixelRatio,
      tile.height / tile.mapHeight / tile.pixelRatio,
    ];

    return [
      //...getWaterThreeJsObjects(tileLayers['water'], tileX, tileY, scale, {enabled: false}),
      // ...getLandCoverThreeJsObjects(tileLayers['globallandcover'], tileX, tileY, scale, {enabled: false}),
      // ...getLandCoverThreeJsObjects(tileLayers['landcover'], tileX, tileY, scale, {enabled: false}),
      // ...getBoundaryThreeJsObjects(tileLayers['boundary'], tileX, tileY, scale, {enabled: false}),
      ...getTransportationThreeJsObjects(tileLayers['transportation'], tileX, tileY, scale, simplifyOptions),
      // ...getBuildingThreeJsObjects(tileLayers['building'], tileX, tileY, scale, {enabled: false}),
    ];
  }
}

interface TileTransform {
  scale: number;
  x: number;
  y: number;
  x2: number;
  y2: number;
}

function lngFromMercatorX(x: number): number {
  return x * 360 - 180;
}

function latFromMercatorY(y: number): number {
  const y2 = 180 - y * 360;
  return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}

function getTileTransform(tileCoors: TileCoordinate, projection: Projection): TileTransform {
  // if (!projection.isReprojectedInTileSpace) {
  //     return {
  //       scale: 1 << tileCoors.z,
  //       x: tileCoors.x,
  //       y: tileCoors.y,
  //       x2: tileCoors.x + 1,
  //       y2: tileCoors.y + 1,
  //       projection,
  //     };
  // }

  const s = Math.pow(2, -tileCoors.z);

  const x1 = (tileCoors.x) * s;
  const x2 = (tileCoors.x + 1) * s;
  const y1 = (tileCoors.y) * s;
  const y2 = (tileCoors.y + 1) * s;

  const lng1 = lngFromMercatorX(x1);
  const lng2 = lngFromMercatorX(x2);
  const lat1 = latFromMercatorY(y1);
  const lat2 = latFromMercatorY(y2);

  const p0 = projection.project(new LatLng(lng1, lat1));
  const p1 = projection.project(new LatLng(lng2, lat1));
  const p2 = projection.project(new LatLng(lng2, lat2));
  const p3 = projection.project(new LatLng(lng1, lat2));

  let minX = Math.min(p0.x, p1.x, p2.x, p3.x);
  let minY = Math.min(p0.y, p1.y, p2.y, p3.y);
  let maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
  let maxY = Math.max(p0.y, p1.y, p2.y, p3.y);

  // we pick an error threshold for calculating the bbox that balances between performance and precision
  const maxErr = s / 16;

  function processSegment(pa: Point, pb: Point, ax: number, ay: number, bx: number, by: number) {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;

      const pm = projection.project(new LatLng(lngFromMercatorX(mx), latFromMercatorY(my)));
      const err = Math.max(0, minX - pm.x, minY - pm.y, pm.x - maxX, pm.y - maxY);

      minX = Math.min(minX, pm.x);
      maxX = Math.max(maxX, pm.x);
      minY = Math.min(minY, pm.y);
      maxY = Math.max(maxY, pm.y);

      if (err > maxErr) {
          processSegment(pa, pm, ax, ay, mx, my);
          processSegment(pm, pb, mx, my, bx, by);
      }
  }

  processSegment(p0, p1, x1, y1, x2, y1);
  processSegment(p1, p2, x2, y1, x2, y2);
  processSegment(p2, p3, x2, y2, x1, y2);
  processSegment(p3, p0, x1, y2, x1, y1);

  // extend the bbox by max error to make sure coords don't go past tile extent
  minX -= maxErr;
  minY -= maxErr;
  maxX += maxErr;
  maxY += maxErr;

  const max = Math.max(maxX - minX, maxY - minY);
  const scale = 1 / max;

  return {
    scale,
    x: minX * scale,
    y: minY * scale,
    x2: maxX * scale,
    y2: maxY * scale,
  };
}