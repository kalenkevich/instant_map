import { LngLat } from './lng_lat';

export class LngLatBounds {
  a: LngLat;
  b: LngLat;
  c: LngLat;
  d: LngLat;

  [0]: number;
  [1]: number;
  [2]: number;
  [3]: number;

  constructor(a: LngLat, d: LngLat) {
    this.a = a;
    this.b = new LngLat(d.lat, a.lng);
    this.c = new LngLat(a.lat, d.lng);
    this.d = d;

    this[0] = a.lat;
    this[1] = a.lng;
    this[2] = d.lat;
    this[3] = d.lng;
  }
}
