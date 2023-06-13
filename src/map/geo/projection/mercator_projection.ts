import { Point } from '../../geometry/point';
import { Bounds } from '../../geometry/bounds';
import { Projection } from './projection';
import { EARTH_RADIUS, EARTH_RADIUS_MINOR } from '../consts';
import { LatLng } from '../lat_lng';

const MERCATOR_BOUNDS = new Bounds(new Point(-20037508.34279, -15496570.73972), new Point(20037508.34279, 18764656.23138));

export class Mercator implements Projection {
  bounds = MERCATOR_BOUNDS;

  project(latlng: LatLng): Point {
    const d = Math.PI / 180;
    const r = EARTH_RADIUS;
    const tmp = EARTH_RADIUS_MINOR / r;
    const e = Math.sqrt(1 - tmp * tmp);
    let y = latlng.lat * d;
    const con = e * Math.sin(y);

    const ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
    y = -r * Math.log(Math.max(ts, 1e-10));

    return new Point(latlng.lng * d * r, y);
  }

  unproject(point: Point): LatLng {
    const d = 180 / Math.PI;
    const r = EARTH_RADIUS;
    const tmp = EARTH_RADIUS_MINOR / r;
    const e = Math.sqrt(1 - tmp * tmp);
    const ts = Math.exp(-point.y / r);
    let phi = Math.PI / 2 - 2 * Math.atan(ts);

    for (let i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
      con = e * Math.sin(phi);
      con = Math.pow((1 - con) / (1 + con), e / 2);
      dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
      phi += dphi;
    }

    return new LatLng(phi * d, (point.x * d) / r);
  }
}
