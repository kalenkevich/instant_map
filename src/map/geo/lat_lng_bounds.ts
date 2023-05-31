import { LatLng } from './lat_lng';

export class LatLngBounds {
  northEast: LatLng;
  southWest: LatLng;

  constructor(corner1: LatLng, corner2: LatLng) {
    this.extend(corner1);
    this.extend(corner2);
  }

  // Extend the bounds to contain the given point
  extend(obj: LatLng | LatLngBounds): LatLngBounds {
    const sw = this.southWest;
    const ne = this.northEast;
    let sw2, ne2;

    if (obj instanceof LatLng) {
      sw2 = obj;
      ne2 = obj;
    } else if (obj instanceof LatLngBounds) {
      sw2 = obj.southWest;
      ne2 = obj.northEast;

      if (!sw2 || !ne2) {
        return this;
      }
    }

    if (!sw && !ne) {
      this.southWest = new LatLng(sw2.lat, sw2.lng);
      this.northEast = new LatLng(ne2.lat, ne2.lng);
    } else {
      sw.lat = Math.min(sw2.lat, sw.lat);
      sw.lng = Math.min(sw2.lng, sw.lng);
      ne.lat = Math.max(ne2.lat, ne.lat);
      ne.lng = Math.max(ne2.lng, ne.lng);
    }

    return this;
  }

  // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
  // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
  // Negative values will retract the bounds.
  pad(bufferRatio: number) {
    const sw = this.southWest;
    const ne = this.northEast;
    const heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio;
    const widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

    return new LatLngBounds(new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer), new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
  }

  // Returns the center point of the bounds.
  getCenter() {
    return new LatLng((this.southWest.lat + this.northEast.lat) / 2, (this.southWest.lng + this.northEast.lng) / 2);
  }

  // Returns the south-west point of the bounds.
  getSouthWest() {
    return this.southWest;
  }

  // Returns the north-east point of the bounds.
  getNorthEast() {
    return this.northEast;
  }

  // @method getNorthWest(): LatLng
  // Returns the north-west point of the bounds.
  getNorthWest() {
    return new LatLng(this.getNorth(), this.getWest());
  }

  // Returns the south-east point of the bounds.
  getSouthEast() {
    return new LatLng(this.getSouth(), this.getEast());
  }

  // Returns the west longitude of the bounds
  getWest(): number {
    return this.southWest.lng;
  }

  // Returns the south latitude of the bounds
  getSouth(): number {
    return this.southWest.lat;
  }

  // Returns the east longitude of the bounds
  getEast(): number {
    return this.northEast.lng;
  }

  // Returns the north latitude of the bounds
  getNorth(): number {
    return this.northEast.lat;
  }

  // Returns `true` if the rectangle contains the given point.
  contains(obj: LatLng | LatLngBounds): boolean {
    const sw = this.southWest;
    const ne = this.northEast;
    let sw2, ne2;

    if (obj instanceof LatLngBounds) {
      sw2 = obj.getSouthWest();
      ne2 = obj.getNorthEast();
    } else {
      sw2 = ne2 = obj;
    }

    return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
  }

  // Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
  intersects(bounds: LatLngBounds): boolean {
    const sw = this.southWest;
    const ne = this.northEast;
    const sw2 = bounds.getSouthWest();
    const ne2 = bounds.getNorthEast();
    const latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat;
    const lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;

    return latIntersects && lngIntersects;
  }

  // Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
  overlaps(bounds: LatLngBounds): boolean {
    const sw = this.southWest;
    const ne = this.northEast;
    const sw2 = bounds.getSouthWest();
    const ne2 = bounds.getNorthEast();
    const latOverlaps = ne2.lat > sw.lat && sw2.lat < ne.lat;
    const lngOverlaps = ne2.lng > sw.lng && sw2.lng < ne.lng;

    return latOverlaps && lngOverlaps;
  }

  // Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
  toBBoxString(): string {
    return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
  }

  // Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
  equals(bounds: LatLngBounds, maxMargin: number): boolean {
    if (!bounds) {
      return false;
    }

    return this.southWest.equals(bounds.getSouthWest(), maxMargin) && this.northEast.equals(bounds.getNorthEast(), maxMargin);
  }

  // Returns `true` if the bounds are properly initialized.
  isValid(): boolean {
    return !!(this.southWest && this.northEast);
  }
}
