import { LngLat } from './lng_lat';

export type LatLngLike =
  | LngLat
  | [number, number]
  | [number, number, number]
  | { lat: number; lng: number; alt?: number };

export function toLngLat(latLngLike: LatLngLike): LngLat {
  if (latLngLike instanceof LngLat) {
    return latLngLike;
  }

  if (Array.isArray(latLngLike)) {
    return new LngLat(latLngLike[0], latLngLike[1], latLngLike[2]);
  }

  return new LngLat(latLngLike.lat, latLngLike.lng, latLngLike.alt);
}
