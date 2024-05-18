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
  type: TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Bynary source of the image. */
export interface Float32ArrayBufferTextureSource {
  type: TextureSourceType.FLOAT_32_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Float32Array;
}

/** Bynary source of the image. */
export interface Uint8ArrayBufferTextureSource {
  type: TextureSourceType.UINT8_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8Array;
}

/** Bitmap image source. Ready to be used in canvas by GPU. */
export interface ImageBitmapTextureSource {
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap;
}
