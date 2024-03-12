export enum TextureSourceType {
  ARRAY_BUFFER = 0,
  SHARED_MEMORY_ARRAY_BUFFER = 1,
  IMAGE_BITMAP = 2,
  HTML_IMAGE_ELEMENT = 3,
}

export type TextureSource =
  | ArrayBufferTextureSource
  | SharedMemoryArrayBufferTextureSource
  | ImageBitmapTextureSource
  | ImageBitmapTextureSource
  | ImageHtmlElementTextureSource;

export interface ArrayBufferTextureSource {
  type: TextureSourceType.ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface SharedMemoryArrayBufferTextureSource {
  type: TextureSourceType.SHARED_MEMORY_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ImageBitmapTextureSource {
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap;
}

export interface ImageHtmlElementTextureSource {
  type: TextureSourceType.HTML_IMAGE_ELEMENT;
  width: number;
  height: number;
  data: HTMLImageElement;
}
