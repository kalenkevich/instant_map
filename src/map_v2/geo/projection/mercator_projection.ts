import { Point } from '../../geometry/point';
import { LngLat } from '../lng_lat';
import { Projection } from './projection';

export class MercatorProjection implements Projection {
  project(point: Point): LngLat {
    return new LngLat(0, 0);
  }

  unproject(lngLat: LngLat): Point {
    return new Point(0, 0);
  }
}
