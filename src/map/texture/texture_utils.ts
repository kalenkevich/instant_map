import {
  TextureSource,
  TextureSourceType,
  ImageBitmapTextureSource,
  Uint8ClampedArrayBufferTextureSource,
  Uint8ArrayBufferTextureSource,
  Float32ArrayBufferTextureSource,
} from './texture';

function getNextTextureId() {
  return Date.now();
}

export interface CreateTextureSourceOptions {
  sharedMemory?: boolean;
  flipX?: boolean;
  flipY?: boolean;
}

const DefaultCreateOptions: CreateTextureSourceOptions = {
  sharedMemory: true,
  flipX: false,
  flipY: false,
};

export function canvasToArrayBufferTextureSource(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
): Uint8ClampedArrayBufferTextureSource {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  return {
    id: getNextTextureId(),
    type: TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER,
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
): Uint8ClampedArrayBufferTextureSource {
  const res = canvasToArrayBufferTextureSource(canvas, x, y, width, height);

  return toUint8ClampedTextureSource(res.data, width, height);
}

/**
 * Creates a texture data source that can be used by webgl later.
 * Useful to store images pixel data as it has a data range from 0 to 255.
 * @param originalBuffer - original source of data
 * @param width - width of the result texture.
 * @param height - height of the result texture.
 * @param sharedMemory - indicares should it be wrapped with SharedArrayBuffer to be transferred between main and worker threads.
 * @returns Texture object.
 */
export function toUint8ClampedTextureSource(
  originalBuffer: Uint8ClampedArray | number[],
  width: number,
  height: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions,
): Uint8ClampedArrayBufferTextureSource {
  let resultBuffer: Uint8ClampedArray;

  if (options.flipX) {
    originalBuffer = flipXArray(originalBuffer, width, height);
  }

  if (options.flipY) {
    originalBuffer = flipYArray(originalBuffer, width, height);
  }

  if (options.sharedMemory) {
    const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Uint8ClampedArray.BYTES_PER_ELEMENT);
    resultBuffer = new Uint8ClampedArray(sharedMemoryBuffer);
  } else {
    resultBuffer = new Uint8ClampedArray(originalBuffer.length);
  }

  resultBuffer.set(originalBuffer);

  return {
    id: getNextTextureId(),
    type: TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

/**
 *
 * @param originalBuffer
 * @param width
 * @param height
 * @returns
 */
export function toUint8TextureSource(
  originalBuffer: Uint8Array | number[],
  width: number,
  height: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions,
): Uint8ArrayBufferTextureSource {
  let resultBuffer: Uint8Array;

  if (options.flipX) {
    originalBuffer = flipXArray(originalBuffer, width, height);
  }

  if (options.flipY) {
    originalBuffer = flipYArray(originalBuffer, width, height);
  }

  if (options.sharedMemory) {
    const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Float32Array.BYTES_PER_ELEMENT);
    resultBuffer = new Uint8Array(sharedMemoryBuffer);
  } else {
    resultBuffer = new Uint8Array(originalBuffer);
  }

  resultBuffer.set(originalBuffer);

  return {
    id: getNextTextureId(),
    type: TextureSourceType.UINT8_ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

/**
 * Creates a texture data source that can be used by webgl later.
 * Useful to store data for object uniforms as it has wide data range for Float32 number.
 * @param originalBuffer - original source of data
 * @param width - width of the result texture.
 * @param height - height of the result texture.
 * @param sharedMemory - indicares should it be wrapped with SharedArrayBuffer to be transferred between main and worker threads.
 * @returns Texture object.
 */
export function toFloat32TextureSource(
  originalBuffer: Float32Array | number[],
  width: number,
  height: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions,
): Float32ArrayBufferTextureSource {
  let resultBuffer: Float32Array;

  if (options.flipX) {
    originalBuffer = flipXArray(originalBuffer, width, height);
  }

  if (options.flipY) {
    originalBuffer = flipYArray(originalBuffer, width, height);
  }

  if (options.sharedMemory) {
    const sharedMemoryBuffer = new SharedArrayBuffer(originalBuffer.length * Float32Array.BYTES_PER_ELEMENT);
    resultBuffer = new Float32Array(sharedMemoryBuffer);
  } else {
    resultBuffer = new Float32Array(originalBuffer);
  }

  resultBuffer.set(originalBuffer);

  return {
    id: getNextTextureId(),
    type: TextureSourceType.FLOAT_32_ARRAY_BUFFER,
    width,
    height,
    data: resultBuffer,
  };
}

export async function toImageBitmapTextureSource(
  texture: TextureSource,
  options?: ImageBitmapOptions,
): Promise<ImageBitmapTextureSource> {
  switch (texture.type) {
    case TextureSourceType.IMAGE_BITMAP:
      return texture;
    case TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER:
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
    id: getNextTextureId(),
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
    id: getNextTextureId(),
    type: TextureSourceType.IMAGE_BITMAP,
    width: sw,
    height: sh,
    data: await createImageBitmap(image, sx, sy, sw, sh, resultOptions),
  };
}

export async function blobToBitmapImageTextureSource(sourceBlob: Blob): Promise<ImageBitmapTextureSource> {
  const data = await createImageBitmap(sourceBlob);

  return {
    id: getNextTextureId(),
    type: TextureSourceType.IMAGE_BITMAP,
    width: data.width,
    height: data.height,
    data,
  };
}

export async function blobToArrayBufferSource(
  sourceBlob: Blob,
  options: CreateTextureSourceOptions = DefaultCreateOptions,
): Promise<Uint8ClampedArrayBufferTextureSource> {
  const sourceImage = await createImageBitmap(sourceBlob);
  const canvas = new OffscreenCanvas(sourceImage.width, sourceImage.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0);
  const resultData = new Uint8ClampedArray(ctx.getImageData(0, 0, sourceImage.width, sourceImage.height).data);

  return toUint8ClampedTextureSource(resultData, sourceImage.width, sourceImage.height, options);
}

export function flipXArray(data: ArrayLike<number>, width: number, height: number): number[] {
  const flippedSource: number[] = [];

  for (let row = 0; row < height; row++) {
    for (let column = width * 4 - 1; column >= 0; column -= 4) {
      flippedSource.push(data[row * 4 * width + column - 3]); // r
      flippedSource.push(data[row * 4 * width + column - 2]); // g
      flippedSource.push(data[row * 4 * width + column - 1]); // b
      flippedSource.push(data[row * 4 * width + column]); // a
    }
  }

  return flippedSource;
}

export function flipYArray(data: ArrayLike<number>, width: number, height: number): number[] {
  const flippedSource: number[] = [];

  for (let row = height - 1; row >= 0; row--) {
    for (let column = 0; column < width * 4; column++) {
      flippedSource.push(data[row * 4 * width + column]);
    }
  }

  return flippedSource;
}
