export enum TextureSourceType {
  IMAGE_BITMAP = 0,
  UINT_8_CLAMPED_ARRAY_BUFFER = 1,
  UINT8_ARRAY_BUFFER = 2,
  FLOAT_32_ARRAY_BUFFER = 3,
}

export type TextureSource = ArrayBufferTextureSource | ImageBitmapTextureSource;

export type ArrayBufferTextureSource =
  | Uint8ClampedArrayBufferTextureSource
  | Float32ArrayBufferTextureSource
  | Uint8ArrayBufferTextureSource;

/** Bynary source of the image. */
export interface Uint8ClampedArrayBufferTextureSource {
  id: number; // Every texture should have uniq id to identify it (and set only once for example);
  name?: string;
  type: TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Bynary source of the image. */
export interface Float32ArrayBufferTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.FLOAT_32_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Float32Array;
}

/** Bynary source of the image. */
export interface Uint8ArrayBufferTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.UINT8_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8Array;
}

/** Bitmap image source. Ready to be used in canvas by GPU. */
export interface ImageBitmapTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap;
}
