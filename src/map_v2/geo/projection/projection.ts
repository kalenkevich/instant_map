import { Point } from '../../geometry/point';
import { LngLat } from '../lng_lat';

export interface Projection {
  project(point: Point): LngLat;

  unproject(lngLat: LngLat): Point;
}
