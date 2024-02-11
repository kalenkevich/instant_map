import { vec2 } from 'gl-matrix';
import { MercatorProjection } from './mercator_projection';

export enum ProjectionType {
  Mercator = 'mercator',
}

export interface Projection {
  // project(point: Point): LngLat;
  // unproject(lngLat: LngLat): Point;

  getType(): ProjectionType;

  mercatorXfromLng(lng: number): number;
  mercatorYfromLat(lat: number): number;

  lngFromMercatorX(x: number): number;
  latFromMercatorY(y: number): number;

  fromLngLat(lngLat: [number, number] | vec2): [number, number];
  fromXY(xy: [number, number] | vec2): [number, number];
}

export function getProjectionFromType(type: ProjectionType | string): Projection {
  if (type === ProjectionType.Mercator) {
    return new MercatorProjection();
  }

  return null;
}
