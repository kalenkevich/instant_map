import { Point } from '../../geometry/point';
import { LngLat } from '../lng_lat';
import { Projection, ProjectionType } from './projection';

// helper class for converting lat/lng to "clip" space (x/y only)
// using Web Mercator Projectino (taken from mapbox, slightly modified):
//   https://github.com/mapbox/mapbox-gl-js/blob/main/src/geo/mercator_coordinate.js
export class MercatorProjection implements Projection {
  getType(): ProjectionType {
    return ProjectionType.Mercator;
  }

  mercatorXfromLng(lng: number): number {
    return (180 + lng) / 360;
  }

  mercatorYfromLat(lat: number): number {
    return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
  }

  fromLngLat(lngLat: [number, number]): [number, number] {
    let x = this.mercatorXfromLng(lngLat[0]);
    let y = this.mercatorYfromLat(lngLat[1]);

    // adjust so relative to origin at center of viewport, instead of top-left
    x = -1 + x * 2;
    y = 1 - y * 2;

    return [x, y];
  }

  lngFromMercatorX(x: number): number {
    return x * 360 - 180;
  }

  latFromMercatorY(y: number): number {
    const y2 = 180 - y * 360;
    return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }

  fromXY(xy: [number, number]): [number, number] {
    let [x, y] = xy;
    const lng = this.lngFromMercatorX((1 + x) / 2);
    const lat = this.latFromMercatorY((1 - y) / 2);

    return [lng, lat];
  }
}
