import {
  ArrayBufferTextureSource,
  TextureSource,
  TextureSourceType,
  ImageBitmapTextureSource,
  Float32ArrayBufferTextureSource,
} from './texture';

export function canvasToArrayBufferTextureSource(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
): ArrayBufferTextureSource {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  return {
    type: TextureSourceType.ARRAY_BUFFER,
    width,
    height,
    data: new Uint8ClampedArray(ctx.getImageData(x, y, width, height).data.buffer),
  };
}

export function canvasToSharebleArrayBufferTextureSource(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
): ArrayBufferTextureSource {
  const res = canvasToArrayBufferTextureSource(canvas, x, y, width, height);

  return arrayBufferToSharebleTextureSource(res.data, width, height);
}

export function arrayBufferToSharebleTextureSource(
  originalBuffer: Uint8ClampedArray | number[],
  width: number,
  height: number,
): ArrayBufferTextureSource {
  const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Uint8ClampedArray.BYTES_PER_ELEMENT);
  const resultBuffer = new Uint8ClampedArray(sharedMemoryBuffer);
  resultBuffer.set(originalBuffer);

  return {
    type: TextureSourceType.ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

export function floatArrayBufferToSharebleTextureSource(
  originalBuffer: Float32Array | number[],
  width: number,
  height: number,
): Float32ArrayBufferTextureSource {
  const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Uint8ClampedArray.BYTES_PER_ELEMENT);
  const resultBuffer = new Float32Array(sharedMemoryBuffer);
  resultBuffer.set(originalBuffer);

  return {
    type: TextureSourceType.FLOAT_ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

export async function toImageBitmapTexture(
  texture: TextureSource,
  options?: ImageBitmapOptions,
): Promise<ImageBitmapTextureSource> {
  switch (texture.type) {
    case TextureSourceType.IMAGE_BITMAP:
      return texture;
    case TextureSourceType.ARRAY_BUFFER:
      return arrayBufferToImageBitmapTextureSource(texture.data, 0, 0, texture.width, texture.height, options);
    default:
      throw new Error(`Cannot convert ${texture} to ImageBitmapTextureSource`);
  }
}

export async function arrayBufferToImageBitmapTextureSource(
  originalBuffer: Uint8ClampedArray,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions,
): Promise<ImageBitmapTextureSource> {
  const sourceBuffer = new Uint8ClampedArray(originalBuffer.length);
  sourceBuffer.set(originalBuffer);

  const sourceData = new ImageData(sourceBuffer, sw, sh);
  const resultOptions: ImageBitmapOptions = {
    premultiplyAlpha: 'premultiply',
    ...(options || {}),
  };

  return {
    type: TextureSourceType.IMAGE_BITMAP,
    width: sw,
    height: sh,
    data: await createImageBitmap(sourceData, sx, sy, sw, sh, resultOptions),
  };
}

export async function imageToImageBitmapTextureSource(
  image: HTMLCanvasElement | HTMLImageElement | OffscreenCanvas,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions,
): Promise<ImageBitmapTextureSource> {
  const resultOptions: ImageBitmapOptions = {
    premultiplyAlpha: 'premultiply',
    ...(options || {}),
  };

  return {
    type: TextureSourceType.IMAGE_BITMAP,
    width: sw,
    height: sh,
    data: await createImageBitmap(image, sx, sy, sw, sh, resultOptions),
  };
}

export async function blobToBitmapImageTextureSource(sourceBlob: Blob): Promise<ImageBitmapTextureSource> {
  const data = await createImageBitmap(sourceBlob);

  return {
    type: TextureSourceType.IMAGE_BITMAP,
    width: data.width,
    height: data.height,
    data,
  };
}

export async function blobToArrayBufferSource(sourceBlob: Blob): Promise<ArrayBufferTextureSource> {
  const sourceImage = await createImageBitmap(sourceBlob);
  const canvas = new OffscreenCanvas(sourceImage.width, sourceImage.height);
  const ctx = canvas.getContext('2d');
  const resultData = new Uint8ClampedArray(ctx.getImageData(0, 0, sourceImage.width, sourceImage.height).data.buffer);

  return arrayBufferToSharebleTextureSource(resultData, sourceImage.width, sourceImage.height);
}
