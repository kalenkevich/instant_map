import { Statement, ColorValue } from './style_statement';

export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  hide?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  feature?: FeaturePaint;
  background?: BackgroundPaint;
}

export enum DataLayerPaintType {
  line = 'line',
  polygon = 'polygon',
  text = 'text',
  image = 'image',
  background = 'background',
}

export type FeaturePaint = LinePaint | PolygonPaint | TextPaint | ImagePaint | BackgroundPaint;

export interface LinePaint {
  type: DataLayerPaintType.line;
  color: Statement<ColorValue>;
  style?: Statement<'solid' | 'dashed' | 'dotted'>; // default 'solid'
  width?: Statement<number>; // default 1
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface PolygonPaint {
  type: DataLayerPaintType.polygon;
  color: Statement<ColorValue>;
  border?: LinePaint;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface TextPaint {
  type: DataLayerPaintType.text;
  color: Statement<ColorValue>;
  font: Statement<string>;
  fontSize: Statement<number>;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface ImagePaint {
  type: DataLayerPaintType.image;
  width: Statement<number>;
  height: Statement<number>;
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}

export interface BackgroundPaint {
  type: DataLayerPaintType.background;
  color?: Statement<ColorValue>; // default white
  opacity?: Statement<number>; // from 0..1
  hide?: Statement<boolean>;
}
