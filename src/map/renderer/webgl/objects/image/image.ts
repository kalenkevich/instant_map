import { WebGlObjectBufferredGroup, WebGlObjectAttributeDescriptor, WebGlObjectAttributeType } from '../object/object';
import { MapFeatureType } from '../../../../tile/feature';
import { ImageBitmapTextureSource } from '../../../../texture/texture';

export interface WebGlImageBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapFeatureType.image;
  numElements: number; // number of elements
  texture: ImageBitmapTextureSource;
  // [x, y, alignment]
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>;
  // [width, height, offsetTop, offsetLeft]
  properties: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
}
