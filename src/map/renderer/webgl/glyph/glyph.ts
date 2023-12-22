import { vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../tile/tile';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';

export interface WebGlGlyph extends WebGlObject {
  type: MapTileFeatureType.glyph;
  atlas: string;
  name: string;
  center: vec2 | [number, number];
  width: number;
  height: number;
}

export interface WebGlGlyphBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.glyph;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  atlas: string;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
}
