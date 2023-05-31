import { CoordinateReferenceSystem } from './crs';
import { MEAN_EARTH_RADIUS } from '../consts';
import { LatLng } from '../lat_lng';

export class EarthCoordinateReferenceSystem extends CoordinateReferenceSystem {
  wrapLng: [-180, 180];

  R = MEAN_EARTH_RADIUS;

  // distance between two geographical points using spherical law of cosines approximation
  distance(latlng1: LatLng, latlng2: LatLng): number {
    const rad = Math.PI / 180;
    const lat1 = latlng1.lat * rad;
    const lat2 = latlng2.lat * rad;
    const sinDLat = Math.sin(((latlng2.lat - latlng1.lat) * rad) / 2);
    const sinDLon = Math.sin(((latlng2.lng - latlng1.lng) * rad) / 2);
    const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.R * c;
  }
}
