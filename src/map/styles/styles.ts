import { Statement, ColorValue } from './style_statement';

export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  hide?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  feature?: FeatureStyle;
  background?: BackgroundStyle;
}

export enum FeatureStyleType {
  line = 'line',
  polygon = 'polygon',
  text = 'text',
  image = 'image',
  background = 'background',
}

export type FeatureStyle = LineStyle | PolygonStyle | TextStyle | ImageStyle | BackgroundStyle;

export interface LineStyle {
  type: FeatureStyleType.line;
  color: Statement<ColorValue>;
  style?: Statement<'solid' | 'dashed' | 'dotted'>; // default 'solid'
  width?: Statement<number>; // default 1
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface PolygonStyle {
  type: FeatureStyleType.polygon;
  color: Statement<ColorValue>;
  border?: LineStyle;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface TextStyle {
  type: FeatureStyleType.text;
  color: Statement<ColorValue>;
  font: Statement<string>;
  fontSize: Statement<number>;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface ImageStyle {
  type: FeatureStyleType.image;
  width: Statement<number>;
  height: Statement<number>;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface BackgroundStyle {
  type: FeatureStyleType.background;
  color?: Statement<ColorValue>; // default white
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}
