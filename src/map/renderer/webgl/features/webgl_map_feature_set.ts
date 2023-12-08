import { vec4, vec2 } from 'gl-matrix';

export type WebGlMapFeatureSet =
  | PointWebGlMapFeatureSet
  | PolygonWebGlMapFeatureSet
  | LineWebGlMapFeatureSet
  | TextWebGlMapFeatureSet
  | IconWebGlMapFeatureSet;

export enum WebGlMapFeatureSetType {
  point,
  polygon,
  line,
  text,
  icon,
}

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineJoinStyle {
  miter = 'miter',
  round = 'round',
  bevel = 'bevel',
}

// checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
export enum LineCapStyle {
  butt = 'butt',
  round = 'round',
  square = 'square',
}

export enum LineFillStyle {
  solid = 'solid',
  dashed = 'dashed',
}

export interface PointWebGlMapFeatureSet {
  type: WebGlMapFeatureSetType.point;
  color: vec4;
  center: vec2;
  borderWidth: number;
  borderColor: vec4;
}

export interface PolygonWebGlMapFeatureSet {
  type: WebGlMapFeatureSetType.polygon;
  color: vec4;
  vertecies: vec2[];

  // TODO: support this
  borderWidth: number;
  borderColor: vec4;
  borderJoin: LineJoinStyle;
}

export interface LineWebGlMapFeatureSet {
  type: WebGlMapFeatureSetType.line;
  color: vec4;
  width: number;
  vertecies: vec2[];

  // TODO: support this
  style: LineFillStyle;
  join: LineJoinStyle;
  cap: LineCapStyle;
  borderWidth: number;
  borderColor: vec4;
}

export interface TextWebGlMapFeatureSet {
  type: WebGlMapFeatureSetType.text;
}

export interface IconWebGlMapFeatureSet {
  type: WebGlMapFeatureSetType.icon;
}
