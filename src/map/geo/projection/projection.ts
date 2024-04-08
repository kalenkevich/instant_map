import { MercatorProjection } from './mercator_projection';

export enum ProjectionType {
  Mercator = 'mercator',
}

export interface Projection {
  getType(): ProjectionType;

  /**
   * Projects coorditates to flat x,y dimention.
   * @param lngLat source point coordinates in [lng, lat]
   * @param normalize if true than will return x and y in range from 0 to 1.
   * @returns projected [x,y] coordinates.
   */
  project(lngLat: [number, number], normalize: boolean): [number, number];
  projectX(lng: number, normalize: boolean): number;
  projectY(lat: number, normalize: boolean): number;

  /**
   * Oposite operation for project.
   * @param lngLat source point coordinates in [x, y]
   * @param normalized if true than porcess x and y as in range from 0 to 1.
   * @returns unprojected [lng, lat] coordinates.
   */
  unproject(xy: [number, number], normalized: boolean): [number, number];
  unprojectX(x: number, normalized: boolean): number;
  unprojectY(y: number, normalized: boolean): number;
}

export function getProjectionFromType(type: ProjectionType | string): Projection {
  if (type === ProjectionType.Mercator) {
    return new MercatorProjection();
  }

  return null;
}
