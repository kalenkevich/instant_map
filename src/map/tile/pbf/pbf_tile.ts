import tilebelt from '@mapbox/tilebelt';
import { Polygon } from 'geojson';
import { MapTile, MapTileFormatType, TileRef, MapTileLayer } from '../tile';
import { WebGlObjectBufferredGroup } from '../../renderer/webgl/webgl_map_object';

export interface PbfTileLayer extends MapTileLayer {
  layer: string;
  objectGroups: WebGlObjectBufferredGroup[];
}

export class PbfMapTile implements MapTile {
  readonly formatType: MapTileFormatType.pbf;
  readonly tileId: string;

  constructor(public readonly ref: TileRef, public layers: PbfTileLayer[]) {
    this.tileId = ref.join('/');
  }

  getLayers(): PbfTileLayer[] {
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
}
