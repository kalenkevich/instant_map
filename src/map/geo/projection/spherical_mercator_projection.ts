import { EARTH_RADIUS, MAX_LATITUDE } from '../consts';
import { Point } from '../../geometry/point';
import { Bounds } from '../../geometry/bounds';
import { Projection } from './projection';
import { LatLng } from '../lat_lng';

const d = EARTH_RADIUS * Math.PI;
const EARTH_BOUNDS = new Bounds(new Point(-d, -d), new Point(d, d));

export class SphericalMercatorProjection implements Projection {
  bounds = EARTH_BOUNDS;

  project(latlng: LatLng): Point {
    const d = Math.PI / 180;
    const max = MAX_LATITUDE;
    const lat = Math.max(Math.min(max, latlng.lat), -max);
    const sin = Math.sin(lat * d);

    return new Point(EARTH_RADIUS * latlng.lng * d, (EARTH_RADIUS * Math.log((1 + sin) / (1 - sin))) / 2);
  }

  unproject(point: Point): LatLng {
    var d = 180 / Math.PI;

    return new LatLng((2 * Math.atan(Math.exp(point.y / EARTH_RADIUS)) - Math.PI / 2) * d, (point.x * d) / EARTH_RADIUS);
  }
}
