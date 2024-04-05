import {
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';
import { MapFeatureType } from '../../../../tile/feature';
import { ImageBitmapTextureSource } from '../../../../texture/texture';

export interface WebGlImageBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapFeatureType.image;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  texture: ImageBitmapTextureSource;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
