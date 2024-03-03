import { vec2 } from 'gl-matrix';
import {
  WebGlObject,
  WebGlObjectBufferredGroup,
  WebGlObjectAttributeDescriptor,
  WebGlObjectAttributeType,
} from '../object/object';
import { MapTileFeatureType } from '../../../../tile/tile';
import { PointMargin } from '../point/point';
import { TextureAtlas } from '../../../../atlas/atlas_config';

export interface WebGlImage extends WebGlObject {
  id: number;
  type: MapTileFeatureType.image;
  name: string;
  topLeft: vec2 | [number, number];
  width: number;
  height: number;
  pixelRatio: number;
  source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
  margin?: PointMargin;
}

export interface WebGlImageBufferredGroup extends WebGlObjectBufferredGroup {
  type: MapTileFeatureType.image;
  size: number; // group size | number of instances;
  numElements: number; // number of elements
  texture: TextureAtlas;
  vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  textcoords: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
  color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
  selectionColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
}
