export class LngLat {
  lng: number;
  lat: number;
  alt: number;

  [0]: number;
  [1]: number;
  [2]: number;

  constructor(lng: number = 0, lat: number = 0, alt: number = 0) {
    this[0] = this.lng = lng;
    this[1] = this.lat = lat;
    this[2] = this.alt = alt;
  }
}
