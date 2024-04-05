import { Projection, ProjectionType } from './projection';

export class MercatorProjection implements Projection {
  getType(): ProjectionType {
    return ProjectionType.Mercator;
  }

  mercatorXfromLng(lng: number): number {
    return (180 + lng) / 360;
  }

  mercatorYfromLat(lat: number): number {
    return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
  }

  fromLngLat(lngLat: [number, number]): [number, number] {
    return [this.mercatorXfromLng(lngLat[0]), this.mercatorYfromLat(lngLat[1])];
  }

  lngFromMercatorX(x: number): number {
    return x * 360 - 180;
  }

  latFromMercatorY(y: number): number {
    const y2 = 180 - y * 360;
    return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }

  fromXY(xy: [number, number]): [number, number] {
    const [x, y] = xy;
    const lng = this.lngFromMercatorX(x);
    const lat = this.latFromMercatorY(y);

    return [lng, lat];
  }
}
