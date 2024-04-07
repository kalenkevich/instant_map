import { ImageBitmapTextureSource } from '../texture/texture';

export enum MapFeatureType {
  point = 'point',
  line = 'line',
  polygon = 'polygon',
  glyph = 'glyph',
  image = 'image',
  text = 'text',
}

export interface MapFeature {
  id: number;
  type: MapFeatureType;
}

export interface PointMapFeature extends MapFeature {
  id: number;
  type: MapFeatureType.point;
  color: [number, number, number, number]; // RGBA color
  center: [number, number];
  radius: number;
  margin?: PointMargin;
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
}

export interface LineMapFeature extends MapFeature {
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

export interface PolygonMapFeature extends MapFeature {
  id: number;
  type: MapFeatureType.polygon;
  color: [number, number, number, number]; // RGBA color
  vertecies: Array<Array<[number, number]>>;
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
  borderJoin: LineJoinStyle;
}

export interface GlyphMapFeature extends MapFeature {
  id: number;
  type: MapFeatureType.glyph;
  atlas: string;
  name: string;
  center: [number, number];
  width: number;
  height: number;
  margin?: PointMargin;
}

export interface TextMapFeature extends MapFeature {
  id: number;
  type: MapFeatureType.text;
  color: [number, number, number, number]; // RGBA color
  font: string;
  fontSize: number;
  text: string;
  center: [number, number];
  margin?: PointMargin;
  align?: TextAlign; // default left
  borderWidth: number;
  borderColor: [number, number, number, number]; // RGBA color
}

export interface ImageMapFeature extends MapFeature {
  id: number;
  type: MapFeatureType.image;
  bbox: Array<[number, number]>;
  topLeft: [number, number];
  width: number;
  height: number;
  pixelRatio: number;
  source: ImageBitmapTextureSource;
  margin?: PointMargin;
}

export interface PointMargin {
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
