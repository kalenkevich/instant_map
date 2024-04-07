// import { Projection, ProjectionType } from './projection';

// const EARTH_RADIUS = 6378137;

// export class MercatorSphereProjection implements Projection {
//   getType(): ProjectionType {
//     return ProjectionType.MercatorSphere;
//   }

//   project(lngLat: [number, number], normalize: boolean): [number, number] {
//     return [this.projectX(lngLat[0], normalize), this.projectY(lngLat[1], normalize)];
//   }

//   projectX(lng: number, normalize: boolean): number {
//     const dividor = normalize ? 360 : 1;
//     const d = Math.PI / 180;

//     return (EARTH_RADIUS * lng * d) / dividor;
//   }

//   projectY(lat: number, normalize: boolean): number {
//     const dividor = normalize ? 360 : 1;
//     const d = Math.PI / 180;
//     const sin = Math.sin(lat * d);

//     return (EARTH_RADIUS * Math.log((1 + sin) / (1 - sin))) / 2 / dividor;
//   }

//   unproject(xy: [number, number], normalized: boolean): [number, number] {
//     const [x, y] = xy;
//     const lng = this.unprojectX(x, normalized);
//     const lat = this.unprojectY(y, normalized);

//     return [lng, lat];
//   }

//   unprojectX(x: number, normalized: boolean): number {
//     const multiplier = normalized ? 360 : 1;
//     const d = 180 / Math.PI;

//     return (x * multiplier * d) / EARTH_RADIUS;
//   }

//   unprojectY(y: number, normalized: boolean): number {
//     const d = 180 / Math.PI;
//     const multiplier = normalized ? 360 : 1;

//     return (2 * Math.atan(Math.exp((y * multiplier) / EARTH_RADIUS)) - Math.PI / 2) * d;
//   }
// }
