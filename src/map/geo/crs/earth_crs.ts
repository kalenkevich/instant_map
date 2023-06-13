import { CoordinateReferenceSystem } from './crs';
import { EARTH_RADIUS, MEAN_EARTH_RADIUS } from '../consts';
import { LatLng } from '../lat_lng';
import { SphericalMercatorProjection } from '../projection/spherical_mercator_projection';
import { Transformation } from '../../geometry/transformation';

const EARTH_CRS_SCALE = 0.5 / (Math.PI * EARTH_RADIUS);
const EARTH_CRS_TRANSFORMATION = new Transformation(EARTH_CRS_SCALE, 0.5, -EARTH_CRS_SCALE, 0.5);
const EARTH_CRS_PROGECTION = new SphericalMercatorProjection();

export class EarthCoordinateReferenceSystem extends CoordinateReferenceSystem {
  wrapLng: [-180, 180];

  R = MEAN_EARTH_RADIUS;

  projection = EARTH_CRS_PROGECTION;

  transformation = EARTH_CRS_TRANSFORMATION;

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
