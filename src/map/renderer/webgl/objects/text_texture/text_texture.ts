import { vec4 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../../tile/tile';
import { TextureAtlas } from '../../../../glyphs/glyphs_config';
import { WebGlObjectBufferredGroup, WebGlObjectAttributeDescriptor, WebGlObjectAttributeType } from '../object/object';

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
