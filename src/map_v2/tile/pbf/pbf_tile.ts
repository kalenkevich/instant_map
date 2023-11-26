import tilebelt from '@mapbox/tilebelt';
import { Polygon } from 'geojson';
import { MapTile, MapTileFormatType, TileRef, MapTileLayer } from '../tile';
import { geometryToVertices } from './pbf_tile_utils';
import { Projection } from '../../geo/projection/projection';

export interface PbfTileLayer extends MapTileLayer {
  type: 'polygon' | 'point' | 'line';
  layer: string;
  vertices: Float32Array;
}

export class PbfMapTile implements MapTile {
  readonly formatType: MapTileFormatType.pbf;
  readonly tileId: string;

  constructor(public readonly ref: TileRef, public layers: PbfTileLayer[]) {
    this.tileId = ref.join('/');
  }

  getLayers(): MapTileLayer[] {
    return this.layers;
  }

  setLayers(layers: PbfTileLayer[]): void {
    this.layers = layers;
  }

  private _geojson?: Polygon;
  toGeoJson(): Polygon {
    if (this._geojson) {
      return this._geojson;
    }

    return (this._geojson = tilebelt.tileToGeoJSON(this.ref));
  }

  // ????
  private _verticies?: number[];
  getVerticies(projection: Projection): number[] {
    if (this._verticies) {
      return this._verticies;
    }

    return (this._verticies = geometryToVertices(tilebelt.tileToGeoJSON(this.ref), projection));
  }
}
