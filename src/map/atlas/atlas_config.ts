export interface AtlasTextrureConfig {
  name: string;
  width: number;
  height: number;
  source: string | ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
  mapping: string | Record<string, AtlasTextrureMapping>;
}

export interface AtlasTextrureMapping {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  pixelRatio: number;
}

export interface TextureAtlas {
  width: number;
  height: number;
  source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
}
