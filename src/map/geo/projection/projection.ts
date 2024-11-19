import { MercatorProjection } from './mercator_projection';

export enum ProjectionType {
  Mercator = 'mercator',
}

export interface ProjectOptions {
  normalize: boolean;
  clip: boolean;
}

export interface UnprojectOptions {
  normalized: boolean;
  clipped: boolean;
}

export interface Projection {
  getType(): ProjectionType;

  /**
   * Projects coorditates to flat x,y dimention.
   * @param lngLatAlt source point coordinates in [lng, lat, alt]
   * @param normalize if true than will return x and y in range from 0 to 1.
   * @returns projected [x,y] coordinates.
   */
  project(lngLatAlt: [number, number, number], options?: ProjectOptions): [number, number, number];
  projectX(lng: number, options?: ProjectOptions): number;
  projectY(lat: number, options?: ProjectOptions): number;
  projectZ(alt: number, options?: ProjectOptions): number;

  /**
   * Oposite operation for project.
   * @param lngLat source point coordinates in [x, y]
   * @param normalized if true than porcess x and y as in range from 0 to 1.
   * @returns unprojected [lng, lat] coordinates.
   */
  unproject(xyz: [number, number, number], options?: UnprojectOptions): [number, number, number];
  unprojectX(x: number, options: UnprojectOptions): number;
  unprojectY(y: number, options: UnprojectOptions): number;
  unprojectZ(y: number, options: UnprojectOptions): number;
}

export function getProjectionFromType(type: ProjectionType | string): Projection {
  if (type === ProjectionType.Mercator) {
    return new MercatorProjection();
  }

  return null;
}
