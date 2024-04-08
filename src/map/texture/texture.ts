export enum TextureSourceType {
  ARRAY_BUFFER = 0,
  FLOAT_ARRAY_BUFFER = 1,
  IMAGE_BITMAP = 2,
}

export type TextureSource = ArrayBufferTextureSource | ImageBitmapTextureSource | Float32ArrayBufferTextureSource;

/** Bynary source of the image. */
export interface ArrayBufferTextureSource {
  type: TextureSourceType.ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Bynary source of the image. */
export interface Float32ArrayBufferTextureSource {
  type: TextureSourceType.FLOAT_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Float32Array;
}

/** Bitmap image source. Ready to be used in canvas by GPU. */
export interface ImageBitmapTextureSource {
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap;
}
