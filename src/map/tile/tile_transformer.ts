import { ProjectionType } from '../geo/projection/projection';
import { AtlasTextureMappingState } from '../atlas/atlas_manager';
import { MapFeatureFlags } from '../flags';
import { DataTileStyles } from '../styles/styles';

export enum TileSourceType {
  pbf = 'pbf',
  png = 'png',

  // Possible
  // json = 'json',
  // xml = 'xml'
}

export enum TileRepresentationType {
  webgl = 'webgl',
  canvas2d = 'canvas2d',
}

export interface FetchTileOptions {
  tileId: string;
  url: string;
  projectionViewMat: [number, number, number, number, number, number, number, number, number];
  canvasWidth: number;
  canvasHeight: number;
  pixelRatio: number;
  zoom: number;
  tileSize: number;
  tileStyles: DataTileStyles;
  projectionType: ProjectionType;
  atlasTextureMappingState: AtlasTextureMappingState;
  featureFlags: MapFeatureFlags;
}

export interface TileTrasformer<TileSourceType, TileRepresentationType> {
  fetchTile(fetchTileOptions: FetchTileOptions): Promise<any>;
}
