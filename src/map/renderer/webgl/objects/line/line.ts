import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../../tile/tile';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineJoinStyle {
  miter = 'miter',
  round = 'round',
  bevel = 'bevel',
}

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineCapStyle {
  butt = 'butt',
  round = 'round',
  square = 'square',
}

export enum LineFillStyle {
  solid = 'solid',
  dashed = 'dashed',
  dotted = 'dotted',
  dotdashed = 'dotdashed',
}

export interface WebGlLine extends WebGlObject {
  id: number;
  type: MapTileFeatureType.line;
  color: vec4;
  width: number;
  vertecies: Array<vec2 | [number, number]>;
  // vertecies: Array<Array<vec2 | [number, number]>>;

  // TODO: support this
  fill: LineFillStyle;
  join: LineJoinStyle;
  cap: LineCapStyle;
  borderWidth: number;
  borderColor: vec4;
}

export interface WebGlLineBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.line;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  width: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>; // Array<vec2>;
  borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
