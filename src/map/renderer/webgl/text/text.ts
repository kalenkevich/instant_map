import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../tile/tile';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';

export interface WebGlText extends WebGlObject {
  type: MapTileFeatureType.text;
  color: vec4;
  font: string;
  fontSize: number;
  text: string;
  center: vec2 | [number, number];

  // TODO: support this
  borderWidth: number;
  borderColor: vec4;
}

export interface WebGlTextBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.text;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
