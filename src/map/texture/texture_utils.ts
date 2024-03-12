import {
  ArrayBufferTextureSource,
  SharedMemoryArrayBufferTextureSource,
  ImageHtmlElementTextureSource,
  TextureSource,
  TextureSourceType,
  ImageBitmapTextureSource,
} from './texture';

export function imageElToTextureSource(
  htmlEl: HTMLCanvasElement | HTMLImageElement | typeof Image
): ImageHtmlElementTextureSource {
  return {
    type: TextureSourceType.HTML_IMAGE_ELEMENT,
    width: (htmlEl as HTMLImageElement).width,
    height: (htmlEl as HTMLImageElement).height,
    data: htmlEl as HTMLImageElement,
  };
}

export function canvasToArrayBufferTextureSource(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  x: number,
  y: number,
  width: number,
  height: number
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
  height: number
): TextureSource {
  const res = canvasToArrayBufferTextureSource(canvas, x, y, width, height);

  return arrayBufferToSharebleTextureSource(res.data, width, height);
}

export function arrayBufferToSharebleTextureSource(
  originalBuffer: Uint8ClampedArray,
  width: number,
  height: number
): SharedMemoryArrayBufferTextureSource {
  const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Uint8ClampedArray.BYTES_PER_ELEMENT);
  const resultBuffer = new Uint8ClampedArray(sharedMemoryBuffer);
  resultBuffer.set(originalBuffer);

  return {
    type: TextureSourceType.SHARED_MEMORY_ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

export async function toImageBitmapTexture(
  texture: TextureSource,
  options?: ImageBitmapOptions
): Promise<ImageBitmapTextureSource> {
  switch (texture.type) {
    case TextureSourceType.IMAGE_BITMAP:
      return texture;
    case TextureSourceType.ARRAY_BUFFER:
      return arrayBufferToImageBitmapTextureSource(texture.data, 0, 0, texture.width, texture.height, options);
    case TextureSourceType.SHARED_MEMORY_ARRAY_BUFFER:
      return sharedArrayBufferToImageBitmapTextureSource(texture.data, 0, 0, texture.width, texture.height, options);
    case TextureSourceType.HTML_IMAGE_ELEMENT:
      return imageToImageBitmapTextureSource(texture.data, 0, 0, texture.width, texture.height, options);
    default:
      throw new Error(`Cannot convert ${texture} to ImageBitmapTextureSource`);
  }
}

export async function arrayBufferToImageBitmapTextureSource(
  sourceBuffer: Uint8ClampedArray,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions
): Promise<ImageBitmapTextureSource> {
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

export async function sharedArrayBufferToImageBitmapTextureSource(
  originalBuffer: Uint8ClampedArray,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions
): Promise<ImageBitmapTextureSource> {
  const resultBuffer = new Uint8ClampedArray(originalBuffer.length);
  resultBuffer.set(originalBuffer);

  return arrayBufferToImageBitmapTextureSource(resultBuffer, sx, sy, sw, sh, options);
}

export async function imageToImageBitmapTextureSource(
  image: HTMLCanvasElement | HTMLImageElement | OffscreenCanvas,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions
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
