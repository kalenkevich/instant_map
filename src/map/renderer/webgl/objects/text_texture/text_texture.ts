import { MapFeatureType } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup, WebGlObjectAttributeDescriptor, WebGlObjectAttributeType } from '../object/object';
import { ArrayBufferTextureSource, TextureSource } from '../../../../texture/texture';

export interface WebGlTextTextureBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapFeatureType.text;
  numElements: number; // number of elements
  texture: TextureSource;
  isSfdTexture: boolean;
  properties: {
    texture: ArrayBufferTextureSource;
    sizeInPixels: number; // how many pixels needs to store the object properties
  };
  // [x, y, alignment]
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>;
  objectIndex: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>;
  // [width, height, offsetTop, offsetLeft]
  textProperties: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
}
