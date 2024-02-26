import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../tile/tile';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';

export interface WebGlPoint extends WebGlObject {
  type: MapTileFeatureType.point;
  color: vec4 | [number, number, number, number];
  center: vec2 | [number, number];
  radius: number;
  components?: number;
  margin?: PointMargin;

  // TODO: support this
  borderWidth: number;
  borderColor: vec4 | [number, number, number, number];
}

export interface PointMargin {
  top?: number;
  left?: number;
}

export interface WebGlPointBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.point;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
