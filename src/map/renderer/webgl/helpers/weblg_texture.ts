import { ImageBitmapTextureSource } from '../../../texture/texture';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { ArrayBufferTextureSource } from '../../../texture/texture';

export interface CreateTextureOptions {
  name: string;
  textureIndex?: number;
  width?: number;
  height?: number;
  flipY?: boolean;
  unpackPremultiplyAlpha?: boolean;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  level?: number;
  type?: number;
  pixels?: ArrayBufferView;
  source?: ImageBitmapTextureSource;
  internalFormat?: number;
  format?: number;
  alignment?: number;
}

export interface WebGlTexture {
  name: string;
  texture: WebGLTexture;
  index: number;
  width: number;
  height: number;
  level: number;
  setSource(source: ImageBitmapTextureSource): void;
  setPixels(texturePixels: ArrayBufferTextureSource): void;
  bind(): void;
  unbind(): void;
  destroy(): void;
}

let CURRENT_TEXTURE_INDEX = 0;
export function resetTextureIndex() {
  CURRENT_TEXTURE_INDEX = 0;
}

let FREE_TEXTURE_INDECIES = new Set();
function getNextTextureIndex(): number {
  if (FREE_TEXTURE_INDECIES.size) {
    const arr = [...FREE_TEXTURE_INDECIES] as number[];
    const result = arr.shift();
    FREE_TEXTURE_INDECIES = new Set(arr);

    return result;
  }

  return CURRENT_TEXTURE_INDEX++;
}

function releaseTextureIndex(index: number) {
  FREE_TEXTURE_INDECIES.add(index);
}

export function createWebGlTexture(gl: ExtendedWebGLRenderingContext, options: CreateTextureOptions): WebGlTexture {
  const texture = gl.createTexture();
  const level = options.level || 0;
  const textureIndex = options.textureIndex !== undefined ? options.textureIndex : getNextTextureIndex();

  gl.activeTexture(gl.TEXTURE0 + textureIndex);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (options.alignment) {
    gl.pixelStorei(gl.PACK_ALIGNMENT, options.alignment);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.alignment);
  }

  if (options.source !== undefined) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.source.data,
    );
  } else if (options.pixels !== undefined) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.width,
      options.height,
      0, // border
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.pixels,
    );
  }

  if (options.unpackPremultiplyAlpha) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  }
  if (options.flipY) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  if (options.wrapS !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS);
  }
  if (options.wrapT !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT);
  }
  if (options.minFilter !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter);
  }
  if (options.magFilter !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter);
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    name: options.name,
    texture,
    index: textureIndex,
    width: options.width,
    height: options.height,
    level,
    setSource(source: ImageBitmapTextureSource) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        options.internalFormat || gl.RGBA,
        options.format || gl.RGBA,
        options.type || gl.UNSIGNED_BYTE,
        source.data,
      );
    },
    setPixels(texturePixels: ArrayBufferTextureSource) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        options.internalFormat || gl.RGBA,
        texturePixels.width,
        texturePixels.height,
        0, // border
        options.format || gl.RGBA,
        options.type || gl.UNSIGNED_BYTE,
        texturePixels.data,
      );
    },
    destroy() {
      releaseTextureIndex(textureIndex);
    },
    bind() {
      gl.activeTexture(gl.TEXTURE0 + textureIndex);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    },
    unbind() {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
  };
}
