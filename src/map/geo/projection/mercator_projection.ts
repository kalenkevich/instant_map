import { Projection, ProjectionType } from './projection';

export class MercatorProjection implements Projection {
  getType(): ProjectionType {
    return ProjectionType.Mercator;
  }

  project(lngLat: [number, number], normalize: boolean): [number, number] {
    return [this.projectX(lngLat[0], normalize), this.projectY(lngLat[1], normalize)];
  }

  projectX(lng: number, normalize: boolean): number {
    const dividor = normalize ? 360 : 1;

    return (180 + lng) / dividor;
  }

  projectY(lat: number, normalize: boolean): number {
    const dividor = normalize ? 360 : 1;

    return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / dividor;
  }

  unproject(xy: [number, number], normalized: boolean): [number, number] {
    const [x, y] = xy;
    const lng = this.unprojectX(x, normalized);
    const lat = this.unprojectY(y, normalized);

    return [lng, lat];
  }

  unprojectX(x: number, normalized: boolean): number {
    const multiplier = normalized ? 360 : 1;

    return x * multiplier - 180;
  }

  unprojectY(y: number, normalized: boolean): number {
    const multiplier = normalized ? 360 : 1;
    const y2 = 180 - y * multiplier;

    return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }
}
