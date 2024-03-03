import { MapTile, MapTileLayer } from '../../../tile/tile';
import { WebGlObjectBufferredGroup } from '../objects/object/object';

export interface WebGlMapTile extends MapTile {
  layers: WebGlMapLayer[];
}

export interface WebGlMapLayer extends MapTileLayer {
  objectGroups: WebGlObjectBufferredGroup[];
}
