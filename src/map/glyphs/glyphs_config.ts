export enum GlyphsTextrureAtlasType {
  png = 'png',
  svg = 'svg',
}

export interface TextureAtlasState {
  type: GlyphsTextrureAtlasType;
  name: string;
  width: number;
  height: number;
  source: TextureSource;
  mapping: Record<string, GlyphTextureAtlasMapping>;
}

export type GlyphsTextrureAtlasConfig = PngGlyphsTextrureAtlasConfig | SvgGlyphsTextureAtlasConfig;

export interface PngGlyphsTextrureAtlasConfig {
  type: GlyphsTextrureAtlasType.png;
  name: string;
  width: number;
  height: number;
  source?: TextureSource;
  sourceUrl?: string; //
  mapping?: Record<string, GlyphTextureAtlasMapping>; // actual mapping object
  mappingUrl?: string; // url to mapping obejct in json format
}

export interface SvgGlyphsTextureAtlasConfig {
  type: GlyphsTextrureAtlasType.svg;
  name: string;
  source?: string;
  sourceUrl?: string;
}

export interface GlyphTexture {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  pixelRatio: number;
  source?: TextureSource;
  sourceArrayBuffer?: Uint8ClampedArray;
}

export interface GlyphTextureAtlasMapping {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  pixelRatio: number;
}

// TODO: move to Webgl source
export interface TextureAtlas {
  width: number;
  height: number;
  source?: TextureSource; // in case width or height === 0 then source is not defined;
}

export type TextureSource = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
