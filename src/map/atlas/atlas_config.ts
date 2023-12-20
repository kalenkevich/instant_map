export interface AtlasTextrureConfig {
  name: string;
  width: number;
  height: number;
  source: string | ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement;
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
