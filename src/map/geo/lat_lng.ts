import { LatLngBounds } from './lat_lng_bounds';
import { CoordinateReferenceSystem } from './crs/crs';
import { EarthCoordinateReferenceSystem } from './crs/earth_crs';

export class LatLng {
  lat: number;
  lng: number;
  alt?: number;
  crs: CoordinateReferenceSystem = new EarthCoordinateReferenceSystem();

  constructor(lat: number, lng: number, alt?: number) {
    this.lat = lat;
    this.lng = lng;
    this.alt = alt;
  }

  equals(other: LatLng, maxMargin: number = 1.0e-9): boolean {
    const margin = Math.max(Math.abs(this.lat - other.lat), Math.abs(this.lng - other.lng));

    return margin <= maxMargin;
  }

  toBounds(sizeInMeters: number): LatLngBounds {
    const latAccuracy = (180 * sizeInMeters) / 40075017,
      lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

    return new LatLngBounds(new LatLng(this.lat - latAccuracy, this.lng - lngAccuracy), new LatLng(this.lat + latAccuracy, this.lng + lngAccuracy));
  }

  // Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
  distanceTo(other: LatLng) {
    return this.crs.distance(this, other);
  }

  // Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
  wrap() {
    return this.crs.wrapLatLng(this);
  }

  clone(): LatLng {
    return new LatLng(this.lat, this.lng, this.alt);
  }
}
