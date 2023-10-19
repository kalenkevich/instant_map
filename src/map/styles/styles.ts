import { Statement, ColorValue } from './style_statement';

export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  feature?: FeatureStyle;
  background?: BackgroundStyle;
}

export enum FeatureStyleType {
  point = 'point',
  line = 'line',
  polygon = 'polygon',
  text = 'text',
  image = 'image',
  background = 'background',
}

export type FeatureStyle = PointStyle | LineStyle | PolygonStyle | TextStyle | ImageStyle | BackgroundStyle;

export interface PointStyle {
  type: FeatureStyleType.point;
  color: Statement<ColorValue>;
  radius?: Statement<number>; // default 5
  show?: Statement<boolean>;
  border?: LineStyle;
  minzoom?: number;
  maxzoom?: number;
}

export interface LineStyle {
  type: FeatureStyleType.line;
  color: Statement<ColorValue>;
  style?: Statement<'solid' | 'dashed' | 'dotted'>; // default 'solid'
  width?: Statement<number>; // default 1
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface PolygonStyle {
  type: FeatureStyleType.polygon;
  color: Statement<ColorValue>;
  border?: LineStyle;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface TextStyle {
  type: FeatureStyleType.text;
  color: Statement<ColorValue>;
  font: Statement<string>;
  fontSize: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface ImageStyle {
  type: FeatureStyleType.image;
  width: Statement<number>;
  height: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface BackgroundStyle {
  type: FeatureStyleType.background;
  color?: Statement<ColorValue>; // default transparent
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}
