import { TextureSource } from '../glyphs/glyphs_config';

export enum FontFormatType {
  vector = 'vector',
  sdf = 'sdf',
  texture = 'texture',
}

export type FontConfig = VectorFontConfig | SdfFontConfig | TextureFontConfig;

export const DEFAULT_SUPPORTED_CHARCODE_RANGES: Array<[number, number]> = [
  [0, 255],
  [256, 511],
  [512, 1023],
  [1024, 1279],
  [8192, 8447],
];

export interface VectorFontConfig {
  type: FontFormatType.vector;
  name: string; // font name
  sourceUrl: string;
  ranges?: Array<[number, number]>; // supported charcode ranges
}

export interface SdfFontConfig {
  type: FontFormatType.sdf;
  name: string; // font name
  sourceUrl: string;
  ranges?: Array<[number, number]>; // supported charcode ranges
}

export interface TextureFontConfig {
  type: FontFormatType.texture;
  name: string; // font name
  sourceUrl: string;
  ranges?: Array<[number, number]>; // supported charcode ranges
  width: number; // texture width
  height: number; // texture height
  glyphWidth: number; // glyph width
  glyphHeight: number; // glyph width
  pixelRatio: number;
}

export type FontAtlas = VectorFontAtlas | SdfFontAtlas | TextureFontAtlas;

export interface VectorFontAtlas {
  type: FontFormatType.vector;
  name: string;
  glyphs: Record<number, VectorFontGlyph>;
  ascender: number;
  descender: number;
  ranges: Array<[number, number]>; // supported charcode ranges
}

export interface SdfFontAtlas {
  type: FontFormatType.sdf;
  name: string;
  glyphs: Record<number, SdfFontGlyph>;
  ascender: number;
  descender: number;
  ranges: Array<[number, number]>; // supported charcode ranges
}

export interface TextureFontAtlas {
  type: FontFormatType.sdf;
  name: string;
  glyphs: Record<number, TextureFontGlyph>;
  sources: Record<string, TextureSource>; // <range, Image>
  ascender: number;
  descender: number;
  pixelRatio: number;
  ranges: Array<[number, number]>; // supported charcode ranges
}

export type FontGlyph = VectorFontGlyph | SdfFontGlyph | TextureFontGlyph;

export interface VectorFontGlyph {
  type: FontFormatType.vector;
  char: string; // char string
  charCode: number;
  source: VectorGlyphCommand[];
  width: number;
  height: number;
}

export interface SdfFontGlyph {
  type: FontFormatType.sdf;
  char: string; // char string
  charCode: number;
  source: Uint8ClampedArray;
  width: number;
  height: number;
  x: number; // ???
  y: number; // ???
  advance: number; //
}

export interface TextureFontGlyph {
  type: FontFormatType.texture;
  char: string; // char string
  charCode: number;
  width: number;
  height: number;
  x: number; // x position according to the source
  y: number; // y position according to the source
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
