import { LatLng } from './geo/lat_lng';

export interface MapState {
  zoom: number;
  center: LatLng;
}
