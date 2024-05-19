import { TextureSource } from '../texture/texture';

export enum FontSourceType {
  font = 'font',
  pbf = 'pbf',
  image = 'image',
}

export enum FontFormatType {
  sdf = 'sdf',
  texture = 'texture',
}

export type FontConfig = SdfFontConfig | TextureFontConfig;

export const DEFAULT_SUPPORTED_CHARCODE_RANGES: Array<[number, number]> = [
  [0, 255],
  [256, 511],
  [512, 1023],
  [1024, 1279],
  [8192, 8447],
];

export const UNDEFINED_CHAR_CODE = -1;

export interface SdfFontConfig {
  type: FontFormatType.sdf;
  sourceType: FontSourceType.font | FontSourceType.pbf;
  name: string; // config font name name, alisas which used in styles.
  fontName: string; // system font name
  sourceUrl: string;
  fontSize: number;
  ranges?: Array<[number, number]>; // supported charcode ranges
  pixelRatio?: number;
}

export interface TextureFontConfig {
  type: FontFormatType.texture;
  sourceType: FontSourceType.font | FontSourceType.image;
  name: string; // config font name name, alisas which used in styles.
  fontName: string; // system font name
  sourceUrl: string;
  ranges?: Array<[number, number]>; // supported charcode ranges
  fontSize: number;
  width?: number; // texture width
  height?: number; // texture height
  glyphWidth?: number; // glyph width
  glyphHeight?: number; // glyph width
  pixelRatio?: number;
}

export type FontAtlas = SdfFontAtlas | TextureFontAtlas;

export interface SdfFontAtlas {
  type: FontFormatType.sdf;
  name: string;
  fontName: string;
  glyphs: Record<number, SdfFontGlyph>;
  sources: Array<{ index: number; name: string; source: TextureSource }>;
  ascender: number;
  descender: number;
  ranges: Array<[number, number]>; // supported charcode ranges
}

export interface TextureFontAtlas {
  type: FontFormatType.texture;
  name: string;
  fontName: string;
  glyphs: Record<number, TextureFontGlyph>;
  sources: Array<{ index: number; name: string; source: TextureSource }>;
  ascender: number;
  descender: number;
  pixelRatio: number;
  ranges: Array<[number, number]>; // supported charcode ranges
}

export type FontGlyph = SdfFontGlyph | TextureFontGlyph;

export interface SdfFontGlyph {
  type: FontFormatType.sdf;
  char: string; // char string
  charCode: number;
  source: Uint8ClampedArray;
  x: number; // x coordinate of left top corner of the glyph rectangle in the atlas
  y: number; // y coordinate of left top corner of the glyph rectangle in the atlas
  width: number; // width of the glyph rectangle in the atlas
  height: number; // height of the glyph rectangle in the atlas
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
  fontSize: number;
  pixelRatio: number;
}

export interface TextureFontGlyph {
  type: FontFormatType.texture;
  char: string; // char string
  charCode: number;
  x: number; // x coordinate of left top corner of the glyph rectangle in the atlas
  y: number; // y coordinate of left top corner of the glyph rectangle in the atlas
  width: number; // width of the glyph rectangle in the atlas
  height: number; // height of the glyph rectangle in the atlas
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
  fontSize: number;
  pixelRatio: number;
}

export type VectorGlyphCommand =
  | {
      type: 'M';
      x: number;
      y: number;
    }
  | {
      type: 'L';
      x: number;
      y: number;
    }
  | {
      type: 'C';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | {
      type: 'Q';
      x1: number;
      y1: number;
      x: number;
      y: number;
    }
  | {
      type: 'Z';
    };
