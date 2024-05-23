import { MapFeatureType } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup, WebGlObjectAttributeDescriptor, WebGlObjectAttributeType } from '../object/object';

export interface WebGlGlyphBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapFeatureType.glyph;
  numElements: number; // number of elements
  atlas: string;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>;
  // [width, height, offsetTop, offsetLeft]
  properties: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>;
}
