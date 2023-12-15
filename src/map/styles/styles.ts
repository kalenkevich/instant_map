import { Statement, ColorValue } from './style_statement';
import { MapTileFeatureType } from '../tile/tile';

export interface DataTileStyles {
  tileSize?: number;
  layers: {
    [styleLayer: string]: DataLayerStyle;
  };
}

export interface DataLayerStyle {
  zIndex: number; // order number (like z-index in css);
  sourceLayer: SourceLayer; // tile feature layer;
  styleLayerName: string; // style layer name;
  show?: boolean;
  minzoom?: number;
  maxzoom?: number;
  feature: FeatureStyle;
}

export type SourceLayer = string;

export interface ImageSourceLayer {
  name: string;
  type: 'image';
  url: string;
}

export type FeatureStyle = PointStyle | LineStyle | PolygonStyle | TextStyle | IconStyle;

export interface PointStyle {
  type: MapTileFeatureType.point;
  color: Statement<ColorValue>;
  radius?: Statement<number>; // default 5
  show?: Statement<boolean>;
  border?: LineStyle;
  minzoom?: number;
  maxzoom?: number;
}

export interface LineStyle {
  type: MapTileFeatureType.line;
  color: Statement<ColorValue>;
  style?: Statement<'solid' | 'dashed' | 'dotted'>; // default 'solid'
  width?: Statement<number>; // default 1
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface PolygonStyle {
  type: MapTileFeatureType.polygon;
  color: Statement<ColorValue>;
  border?: LineStyle;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface TextStyle {
  type: MapTileFeatureType.text;
  color: Statement<ColorValue>;
  text: Statement<string>;
  font?: Statement<string>; // default roboto
  fontSize?: Statement<number>; // default 14
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

// TODO support Icon style
export interface IconStyle {
  type: MapTileFeatureType.icon;
  name: Statement<string>; // glyph name
  width?: Statement<number>; // optional
  height?: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}
