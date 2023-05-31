import { Point } from '../../geometry/point';
import { Bounds } from '../../geometry/bounds';
import { LatLng } from '../lat_lng';

export interface Projection {
  bounds: Bounds;
  project(latlng: LatLng): Point;
  unproject(point: Point): LatLng;
}
