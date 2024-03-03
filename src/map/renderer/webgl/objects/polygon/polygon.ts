import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../../tile/tile';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';
import { LineJoinStyle } from '../line/line';

export interface WebGlPolygon extends WebGlObject {
  id: number;
  type: MapTileFeatureType.polygon;
  color: vec4;
  vertecies: Array<Array<vec2 | [number, number]>>;

  // TODO: support this
  borderWidth: number;
  borderColor: vec4;
  borderJoin: LineJoinStyle;
}

export interface WebGlPolygonBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.polygon;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
