import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { WebGlTexture } from './weblg_texture';

export interface CreateFrameBufferOptions {
  texture: WebGlTexture;
  attachmentPoint?: number;
}

export interface WebGlFrameBuffer {
  framebuffer: WebGLFramebuffer;
  bind(): void;
  unbind(): void;
  clear(): void;
}

export function createFrameBuffer(gl: ExtendedWebGLRenderingContext, options: CreateFrameBufferOptions) {
  const framebuffer = gl.createFramebuffer();
  const COLOR_ATTACHMENT0 = 0x8ce0;

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    options.texture.texture,
    options.texture.level
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    framebuffer,
    bind() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    },
    unbind() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    clear(color?: [number, number, number, number]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      if (color) {
        gl.clearColor(...color);
      } else {
        // default is white
        gl.clearColor(1, 1, 1, 1);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
  };
}
