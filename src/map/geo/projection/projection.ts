import { MercatorProjection } from './mercator_projection';

export enum ProjectionType {
  Mercator = 'mercator',
}

export interface Projection {
  getType(): ProjectionType;

  mercatorXfromLng(lng: number): number;
  mercatorYfromLat(lat: number): number;

  lngFromMercatorX(x: number): number;
  latFromMercatorY(y: number): number;

  fromLngLat(lngLat: [number, number]): [number, number];
  fromXY(xy: [number, number]): [number, number];
}

export function getProjectionFromType(type: ProjectionType | string): Projection {
  if (type === ProjectionType.Mercator) {
    return new MercatorProjection();
  }

  return null;
}
