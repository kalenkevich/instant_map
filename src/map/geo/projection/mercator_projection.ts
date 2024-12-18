import { Projection, ProjectionType, ProjectOptions, UnprojectOptions } from './projection';

const DEGREE = 180 / Math.PI;
const PI_BY_4 = Math.PI / 4;

export class MercatorProjection implements Projection {
  getType(): ProjectionType {
    return ProjectionType.Mercator;
  }

  project(lngLat: [number, number], options?: ProjectOptions): [number, number] {
    return [this.projectX(lngLat[0], options), this.projectY(lngLat[1], options)];
  }

  projectX(lng: number, options?: ProjectOptions): number {
    const dividor = options?.normalize ? 360 : 1;
    const x = (180 + lng) / dividor;

    return options?.clip ? -1 + x * 2 : x;
  }

  projectY(lat: number, options?: ProjectOptions): number {
    const dividor = options?.normalize ? 360 : 1;
    const y = (180 - DEGREE * Math.log(Math.tan(PI_BY_4 + (lat * Math.PI) / 360))) / dividor;

    return options.clip ? 1 - y * 2 : y;
  }

  unproject([x, y]: [number, number], options?: UnprojectOptions): [number, number] {
    return [this.unprojectX(x, options), this.unprojectY(y, options)];
  }

  unprojectX(x: number, options?: UnprojectOptions): number {
    const multiplier = options?.normalized ? 360 : 1;
    x = options?.clipped ? (1 + x) / 2 : x;
    x = x * multiplier;

    return x - 180;
  }

  unprojectY(y: number, options?: UnprojectOptions): number {
    const multiplier = options?.normalized ? 360 : 1;
    y = options?.clipped ? (1 - y) / 2 : y;
    y = 180 - y * multiplier;

    return (360 / Math.PI) * Math.atan(Math.exp((y * Math.PI) / 180)) - 90;
  }
}
