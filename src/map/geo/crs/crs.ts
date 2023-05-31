import { LatLng } from '../lat_lng';
import { LatLngBounds } from '../lat_lng_bounds';
import { Point } from '../../geometry/point';
import { Bounds } from '../../geometry/bounds';
import { Transformation } from '../../geometry/transformation';
import { Projection } from '../projection/projection';

// Returns the number `num` modulo `range` in such a way so it lies within
// `range[0]` and `range[1]`. The returned value will be always smaller than
// `range[1]` unless `includeMax` is set to `true`.
export function wrapNum(x: number, range: [number, number], includeMax: boolean) {
  const max = range[1];
  const min = range[0];
  const d = max - min;

  return x === max && includeMax ? x : ((((x - min) % d) + d) % d) + min;
}

export abstract class CoordinateReferenceSystem {
  wrapLat: [number, number];
  wrapLng?: [number, number];
  transformation: Transformation;
  projection: Projection;

  // distance between two geographical points using spherical law of cosines approximation
  abstract distance(latlng1: LatLng, latlng2: LatLng): number;

  // Projects geographical coordinates into pixel coordinates for a given zoom.
  latLngToPoint(latlng: LatLng, zoom: number): Point {
    const projectedPoint = this.projection.project(latlng);
    const scale = this.scale(zoom);

    return this.transformation.transform(projectedPoint, scale);
  }

  // The inverse of `latLngToPoint`. Projects pixel coordinates on a given
  // zoom into geographical coordinates.
  pointToLatLng(point: Point, zoom: number) {
    const scale = this.scale(zoom);
    const untransformedPoint = this.transformation.untransform(point, scale);

    return this.projection.unproject(untransformedPoint);
  }

  // Projects geographical coordinates into coordinates in units accepted for
  // this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
  project(latlng: LatLng): Point {
    return this.projection.project(latlng);
  }

  // Given a projected coordinate returns the corresponding LatLng.
  // The inverse of `project`.
  unproject(point: Point): LatLng {
    return this.projection.unproject(point);
  }

  // @method scale(zoom: Number): Number
  // Returns the scale used when transforming projected coordinates into
  // pixel coordinates for a particular zoom. For example, it returns
  // `256 * 2^zoom` for Mercator-based CRS.
  scale(zoom: number): number {
    return 256 * Math.pow(2, zoom);
  }

  // Inverse of `scale()`, returns the zoom level corresponding to a scale
  // factor of `scale`.
  zoom(scale: number): number {
    return Math.log(scale / 256) / Math.LN2;
  }

  // Returns the projection's bounds scaled and transformed for the provided `zoom`.
  getProjectedBounds(zoom: number): Bounds {
    if (this.infinite) {
      return null;
    }

    const b = this.projection.bounds;
    const s = this.scale(zoom);
    const min = this.transformation.transform(b.min, s);
    const max = this.transformation.transform(b.max, s);

    return new Bounds(min, max);
  }

  // @method distance(latlng1: LatLng, latlng2: LatLng): Number
  // Returns the distance between two geographical coordinates.

  // @property code: String
  // Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
  //
  // @property wrapLng: Number[]
  // An array of two numbers defining whether the longitude (horizontal) coordinate
  // axis wraps around a given range and how. Defaults to `[-180, 180]` in most
  // geographical CRSs. If `undefined`, the longitude axis does not wrap around.
  //
  // @property wrapLat: Number[]
  // Like `wrapLng`, but for the latitude (vertical) axis.

  // wrapLng: [min, max],
  // wrapLat: [min, max],

  // @property infinite: Boolean
  // If true, the coordinate space will be unbounded (infinite in both axes)
  infinite: false;

  // @method wrapLatLng(latlng: LatLng): LatLng
  // Returns a `LatLng` where lat and lng has been wrapped according to the
  // CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
  wrapLatLng(latlng: LatLng): LatLng {
    const lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng;
    const lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat;
    const alt = latlng.alt;

    return new LatLng(lat, lng, alt);
  }

  // Returns a `LatLngBounds` with the same size as the given one, ensuring
  // that its center is within the CRS's bounds.
  // Only accepts actual `L.LatLngBounds` instances, not arrays.
  wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds {
    const center = bounds.getCenter();
    const newCenter = this.wrapLatLng(center);
    const latShift = center.lat - newCenter.lat;
    const lngShift = center.lng - newCenter.lng;

    if (latShift === 0 && lngShift === 0) {
      return bounds;
    }

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift);
    const newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

    return new LatLngBounds(newSw, newNe);
  }
}
