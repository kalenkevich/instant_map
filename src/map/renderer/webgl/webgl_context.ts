/**
 * Extended WebGL 1.0 context API with extensions. Mimic WebGL 2.0 context API.
 * */
export type ExtendedWebGLRenderingContext = WebGLRenderingContext & {
  vertexAttribDivisor(index: number, divisor: number): void;
  drawArraysInstanced(primitiveType: number, offset: number, numElements: number, instanceCount: number): void;
  createVertexArray(): WebGLVertexArrayObjectOES;
  bindVertexArray(vao: WebGLVertexArrayObjectOES): void;
  drawBuffers(buffers: Array<GLenum>): void;
};
