import { Statement, ColorValue } from './style_statement';
import { MapTileFeatureType } from '../tile/tile';
import { FontConfig } from '../font/font_config';
import { AtlasTextrureConfig } from '../atlas/atlas_config';
import { LineCapStyle, LineFillStyle, LineJoinStyle } from '../renderer/webgl/line/line';

export interface DataTileStyles {
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  layers: {
    [styleLayer: string]: DataLayerStyle;
  };
  atlas?: {
    [atlasName: string]: AtlasTextrureConfig;
  };
  fonts?: {
    [fontName: string]: FontConfig;
  };
}

export interface DataLayerStyle {
  zIndex: number; // order number (like z-index in css);
  sourceLayer: SourceLayer; // tile feature layer;
  styleLayerName: string; // style layer name;
  show?: boolean;
  minzoom?: number;
  maxzoom?: number;
  feature?: FeatureStyle;
}

export type SourceLayer = string;

export interface ImageSourceLayer {
  name: string;
  type: 'image';
  url: string;
}

export type FeatureStyle = PointStyle | LineStyle | PolygonStyle | TextStyle | GlyphStyle;

export interface PointStyle {
  type: MapTileFeatureType.point;
  color: Statement<ColorValue>;
  radius?: Statement<number>; // default 5
  show?: Statement<boolean>;
  border?: LineStyle;
  minzoom?: number;
  maxzoom?: number;
  margin?: PointMargin;
}

export interface PointMargin {
  top?: Statement<number>;
  left?: Statement<number>;
}

export interface LineStyle {
  type: MapTileFeatureType.line;
  color: Statement<ColorValue>;
  fillStyle?: Statement<LineFillStyle.solid | LineFillStyle.dashed | LineFillStyle.dotted | LineFillStyle.dotdashed>; // default: 'solid'
  joinStyle?: Statement<LineJoinStyle.round | LineJoinStyle.bevel | LineJoinStyle.miter>; // default: none
  capStyle?: Statement<LineCapStyle.butt | LineCapStyle.round | LineCapStyle.square>;
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
  borderColor: Statement<ColorValue>;
  text: Statement<string>;
  font?: Statement<string>; // default roboto
  fontSize?: Statement<number>; // default 14
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  margin?: PointMargin;
}

export interface GlyphStyle {
  type: MapTileFeatureType.glyph;
  name: Statement<string>; // glyph name
  atlas: Statement<string>; // atlas name
  width?: Statement<number>; // optional
  height?: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  margin?: PointMargin;
}
