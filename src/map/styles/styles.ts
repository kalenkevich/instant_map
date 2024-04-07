import { Statement, ColorValue } from './style_statement';
import { MapFeatureType, PointOffset, TextAlign } from '../tile/feature';
import { FontConfig } from '../font/font_config';
import { GlyphsTextrureAtlasConfig } from '../glyphs/glyphs_config';
import { TileSourceType } from '../tile/source/tile_source';
import { LineCapStyle, LineFillStyle, LineJoinStyle } from '../tile/feature';

export interface DataTileStyles {
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  sources: {
    [sourceLayer: string]: DataTileSource;
  };
  layers: {
    [styleLayer: string]: DataLayerStyle;
  };
  glyphs?: {
    [glyphsName: string]: GlyphsTextrureAtlasConfig;
  };
  fonts?: {
    [fontName: string]: FontConfig;
  };
}

export interface DataLayerStyle {
  zIndex: number; // order number (like z-index in css);
  source: string; // tile data source
  sourceLayer: string; // tile feature layer;
  styleLayerName: string; // style layer name;
  show?: boolean;
  minzoom?: number;
  maxzoom?: number;
  feature?: FeatureStyle;
}

export type DataTileSource = MvtTileSource | ImageTileSource;

export interface MvtTileSource {
  type: TileSourceType.mvt;
  name: string;
  url: string;
}

export interface ImageTileSource {
  type: TileSourceType.image;
  name: string;
  url: string;
  pixelRatio?: number;
}

export type FeatureStyle = PointStyle | LineStyle | PolygonStyle | TextStyle | GlyphStyle | ImageStyle;

export interface PointStyle {
  type: MapFeatureType.point;
  color: Statement<ColorValue>;
  radius?: Statement<number>; // default 5
  show?: Statement<boolean>;
  borderWidth?: Statement<number>;
  borderColor?: Statement<ColorValue>;
  minzoom?: number;
  maxzoom?: number;
  offset?: PointOffset;
}

export interface LineStyle {
  type: MapFeatureType.line;
  color: Statement<ColorValue>;
  fillStyle?: Statement<LineFillStyle.solid | LineFillStyle.dashed | LineFillStyle.dotted | LineFillStyle.dotdashed>; // default: 'solid'
  joinStyle?: Statement<LineJoinStyle.round | LineJoinStyle.bevel | LineJoinStyle.miter>; // default: none
  capStyle?: Statement<LineCapStyle.butt | LineCapStyle.round | LineCapStyle.square>;
  width?: Statement<number>; // default 1
  borderWidth?: Statement<number>; // default 1
  borderColor?: Statement<ColorValue>; // default <0, 0, 0, 0>
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface PolygonStyle {
  type: MapFeatureType.polygon;
  color: Statement<ColorValue>;
  border?: LineStyle;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
}

export interface TextStyle {
  type: MapFeatureType.text;
  color: Statement<ColorValue>;
  borderColor: Statement<ColorValue>;
  text: Statement<string>;
  font?: Statement<string>; // default roboto
  fontSize?: Statement<number>; // default 14
  show?: Statement<boolean>;
  align?: Statement<TextAlign>;
  minzoom?: number;
  maxzoom?: number;
  offset?: PointOffset;
}

export interface GlyphStyle {
  type: MapFeatureType.glyph;
  name: Statement<string>; // glyph name
  atlas: Statement<string>; // atlas name
  width?: Statement<number>;
  height?: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  offset?: PointOffset;
}

export interface ImageStyle {
  type: MapFeatureType.image;
  width?: Statement<number>;
  height?: Statement<number>;
  show?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  offset?: PointOffset;
}
