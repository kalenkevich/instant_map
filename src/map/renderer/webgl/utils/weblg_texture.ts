import { ExtendedWebGLRenderingContext } from '../webgl_context';

export interface CreateTextureOptions {
  width: number;
  level?: number;
  height: number;
  type?: number;
  data?: ArrayBufferView;
  internalFormat?: number;
  format?: number;
  border?: number;
}

export interface WebGlTexture {
  texture: WebGLTexture;
  level: number;
  bind(): void;
  unbind(): void;
}

export function createTexture(gl: ExtendedWebGLRenderingContext, options: CreateTextureOptions): WebGlTexture {
  const texture = gl.createTexture();
  const level = options.level || 0;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    options.internalFormat || gl.RGBA,
    options.width,
    options.height,
    options.border || 0,
    options.format || gl.RGBA,
    options.type || gl.UNSIGNED_BYTE,
    options.data || null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    texture,
    level,
    bind() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
    },
    unbind() {
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
  };
}