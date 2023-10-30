import { LatLng } from './geo/lat_lng';
import { CoordinateReferenceSystem } from './geo/crs/crs';
import { MapRenderer, MapRendererType } from './render/renderer';
import { MapTileFormatType } from './tile/tile';
import { DataTileStyles } from './styles/styles';

/**
 * Options to initialize Glide Map.
 */
export interface MapOptions {
  /** HtmlElement where map canvas will attached to. */
  rootEl: HTMLElement;
  /** Tile styles for data layers (non png). Required for data tile type. */
  styles: DataTileStyles;
  /** Initial zoom value of the map. */
  zoom?: number;
  /** Initial rotation value of the map. */
  rotation?: number;
  /** Initial center point of the map. */
  center?: LatLng;
  /** Meta info object about tiles and styles. */
  mapMeta?: MapMeta;
  /** Meta info url to fetch data about tiles and styles. */
  tileMetaUrl?: string;
  /** Custom value of device pixel ratio. By defauled would be used `window.devicePixelRatio`. */
  devicePixelRatio?: number;
  /** Renderer name or custom implementation. By defualt will be used webgl. */
  renderer?: MapRendererType | MapRendererOptions;
  /** Coordinate refference  system applied to the map data. */
  crs?: MapCrs;
  /** When `true` then map will listen for `rootEl` width/height changes. */
  resizable?: boolean;
  /**
   * @deprecated
   * Used to preheat tile data. Should not be used as it consume a lot of memory.
   */
  preheatTiles?: boolean;
  /**
   * Map control configuration.
   * Provide `true` or `false` to show/hide map control on UI.
   */
  controls?: {
    zoom?: boolean;
    move?: boolean;
    compas?: boolean;
    debug?: boolean;
  };
}

export { MapTileFormatType };

export type MapCrs = CoordinateReferenceSystem | MapCrsType;

export enum MapCrsType {
  earth = 'earth',
}

export interface MapRendererOptions {
  type: MapRendererType;
  renderer: MapRenderer;
}

export interface MapMeta {
  id?: string;
  mtime?: Date;
  bounds: [number, number, number, number]; // [minlat, minlon, maxlat, maxlon]
  center: [number, number, number];
  format: MapTileFormatType;
  maxzoom: number;
  minzoom: number;
  version?: string;
  generator?: string;
  tilestats?: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>;
  };
  vector_layers?: Array<{
    id: string;
    maxzoom: number;
    minzoom: number;
    description: string;
    fields: Record<string, string>;
  }>;
  pixel_scale?: string;
  crs?: string;
  crs_wkt?: string;
  extent?: [number, number, number, number];
  tileset_type?: 'mbtiles';
  tiles: string[];
  logo?: string;
}

export interface MapTilesMeta {
  tilestats: {
    layers: Array<{
      layer: string;
      geometry: 'Polygon';
      attributes: Array<{ type: string; attribute: string; values?: string[] }>;
    }>;
  };
  pixel_scale?: string;
  tileset_type: 'mbtiles';
  tiles: string[];
  vector_layers?: Array<{
    id: string;
    maxzoom: number;
    minzoom: number;
    description: string;
    fields: Record<string, string>;
  }>;
}
