import { ExtendedWebGLRenderingContext } from '../webgl_context';

export interface CreateTextureOptions {
  name: string;
  width: number;
  height: number;
  flipY?: boolean;
  unpackPremultiplyAlpha?: boolean;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  level?: number;
  type?: number;
  pixels?: ArrayBufferView;
  source?: TexImageSource;
  internalFormat?: number;
  format?: number;
  border?: number;
}

export interface WebGlTexture {
  name: string;
  texture: WebGLTexture;
  index: number;
  width: number;
  height: number;
  level: number;
  setSource(source: TexImageSource): void;
  bind(): void;
  unbind(): void;
}

let CURRENT_TEXTURE_INDEX = 0;

export function createTexture(gl: ExtendedWebGLRenderingContext, options: CreateTextureOptions): WebGlTexture {
  const texture = gl.createTexture();
  const level = options.level || 0;
  const textureIndex = CURRENT_TEXTURE_INDEX++;

  gl.activeTexture(gl.TEXTURE0 + textureIndex);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (options.source) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.source
    );
  } else if (options.pixels !== undefined) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.width,
      options.height,
      options.border || 0,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.pixels
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
    setSource(source: TexImageSource) {
      gl.activeTexture(gl.TEXTURE0 + textureIndex);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        options.internalFormat || gl.RGBA,
        options.format || gl.RGBA,
        options.type || gl.UNSIGNED_BYTE,
        source
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
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
