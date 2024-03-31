import { MapTileFeatureType } from '../../../../tile/tile';

export interface WebGlObject {
  id: number;
  type: MapTileFeatureType;
}

export interface WebGlObjectBufferredGroup {
  type: MapTileFeatureType;
  name: string;
  zIndex: number;
}

export interface WebGlObjectAttributeDescriptor<AttributeType, SizeType, ArrayType> {
  type: AttributeType;
  size: SizeType; // dimention of the element: number -> 1, vec2 -> 2, vec3 -> 3, vec4 -> 4 and etc.
  buffer: ArrayType;
}

export enum WebGlObjectAttributeType {
  BYTE = 0x1400,
  UNSIGNED_BYTE = 0x1401,
  SHORT = 0x1402,
  UNSIGNED_SHORT = 0x1403,
  INT = 0x1404,
  UNSIGNED_INT = 0x1405,
  FLOAT = 0x1406,
}
