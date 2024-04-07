import { ImageBitmapTextureSource } from '../texture/texture';

export enum MapFeatureType {
  point = 'point',
  line = 'line',
  polygon = 'polygon',
  glyph = 'glyph',
  image = 'image',
  text = 'text',
}

export type MapFeature =
  | PointMapFeature
  | LineMapFeature
  | PolygonMapFeature
  | GlyphMapFeature
  | TextMapFeature
  | ImageMapFeature;

export interface PointMapFeature {
  id: number;
  type: MapFeatureType.point;
  color: [number, number, number, number]; // RGBA color
  center: [number, number];
  radius: number;
  offset?: PointOffset;
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
}

export interface LineMapFeature {
  id: number;
  type: MapFeatureType.line;
  color: [number, number, number, number]; // RGBA color
  width: number;
  vertecies: Array<[number, number]>;
  fill: LineFillStyle;
  join: LineJoinStyle;
  cap: LineCapStyle;
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
}

export interface PolygonMapFeature {
  id: number;
  type: MapFeatureType.polygon;
  color: [number, number, number, number]; // RGBA color
  vertecies: Array<Array<[number, number]>>;
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
  borderJoin: LineJoinStyle;
}

export interface GlyphMapFeature {
  id: number;
  type: MapFeatureType.glyph;
  atlas: string;
  name: string;
  center: [number, number];
  width: number;
  height: number;
  offset?: PointOffset;
}

export interface TextMapFeature {
  id: number;
  type: MapFeatureType.text;
  color: [number, number, number, number]; // RGBA color
  font: string;
  fontSize: number;
  text: string;
  center: [number, number];
  offset?: PointOffset;
  align?: TextAlign; // default left
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
}

export interface ImageMapFeature {
  id: number;
  type: MapFeatureType.image;
  bbox: Array<[number, number]>;
  topLeft: [number, number];
  width: number;
  height: number;
  pixelRatio: number;
  source: ImageBitmapTextureSource;
  offset?: PointOffset;
}

export interface PointOffset {
  top?: number;
  left?: number;
}

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineJoinStyle {
  miter = 0,
  round = 1,
  bevel = 2,
}

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineCapStyle {
  butt = 0,
  round = 1,
  square = 2,
}

export enum LineFillStyle {
  solid = 0,
  dashed = 1,
  dotted = 2,
  dotdashed = 3,
}

export enum TextAlign {
  left = 0,
  center = 1,
  right = 2,
}
