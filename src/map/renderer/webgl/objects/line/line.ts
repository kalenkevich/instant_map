import { MapFeatureType } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup, WebGlObjectAttributeDescriptor, WebGlObjectAttributeType } from '../object/object';

export interface WebGlLineBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapFeatureType.line;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  width: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>; // Array<vec2>;
  borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
  borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
