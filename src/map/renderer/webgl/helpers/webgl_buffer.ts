import { ExtendedWebGLRenderingContext } from '../webgl_context';

export interface CreateWebGlBufferParams {
  location: number;
  size: GLint;
  type?: GLenum;
  normalized?: GLboolean;
  stride?: GLsizei;
  offset?: GLintptr;
}

export interface WebGlBuffer {
  buffer: WebGLBuffer;
  location: number;
  bufferData(data: Float32Array): void;
}

/**
 * Create instance of WebglBuffer. Usually web buffer definition and initialzation is a boilerplate.
 * This function helps to create a facade object API to cover it.
 */
export function createWebGlBuffer(gl: ExtendedWebGLRenderingContext, params: CreateWebGlBufferParams): WebGlBuffer {
  const buffer = gl.createBuffer();
  let currentBufferedDataLength = 0;

  gl.enableVertexAttribArray(params.location);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    params.location,
    params.size,
    params.type || gl.FLOAT,
    params.normalized || false,
    params.stride || 0,
    params.offset || 0,
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    buffer,
    location: params.location,
    bufferData(data: Float32Array) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      if (currentBufferedDataLength > data.length) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      } else {
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        currentBufferedDataLength = data.length;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },
  };
}
