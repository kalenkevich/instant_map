export enum TextureSourceType {
  ARRAY_BUFFER = 0,
  IMAGE_BITMAP = 1,
}

export type TextureSource = ArrayBufferTextureSource | ImageBitmapTextureSource;

/** Bynary source of the image. */
export interface ArrayBufferTextureSource {
  type: TextureSourceType.ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Bitmap image source. Ready to be used in canvas by GPU. */
export interface ImageBitmapTextureSource {
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap;
}
