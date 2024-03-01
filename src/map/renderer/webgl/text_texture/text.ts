import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../tile/tile';
import { TextureAtlas } from '../../../atlas/atlas_config';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';
import { PointMargin } from '../point/point';

export interface WebGlText extends WebGlObject {
  id: number;
  type: MapTileFeatureType.text;
  color: vec4;
  font: string;
  fontSize: number;
  text: string;
  center: vec2 | [number, number];
  margin?: PointMargin;

  // TODO: support this
  borderWidth: number;
  borderColor: vec4;
}

export interface TextMapping {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  font: string;
  fontSize: number;
  color: vec4 | [number, number, number, number];
  borderColor: vec4 | [number, number, number, number];
  widthPadding: number;
  heightPadding: number;
}

export interface WebGlTextTextureBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.text;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  texture: TextureAtlas;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}

export interface WebGlTextPolygonBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.text;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
