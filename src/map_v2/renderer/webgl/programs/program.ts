import { mat3, vec4 } from 'gl-matrix';

export type ExtendedWebGLRenderingContext = WebGLRenderingContext & {
  vertexAttribDivisor(index: number, divisor: number): void;
  drawArraysInstanced(primitiveType: number, offset: number, numElements: number, instanceCount: number): void;
  createVertexArray(): WebGLVertexArrayObjectOES;
  bindVertexArray(vao: WebGLVertexArrayObjectOES): void;
};

export interface WebGlProgram {
  init(): void;

  link(): void;

  setMatrix(matrix: mat3): void;

  setColor(color: vec4): void;

  bindBuffer(
    buffer: Float32Array,
    size?: number,
    type?: number,
    normalize?: boolean,
    stride?: number,
    offset?: number
  ): void;

  draw(primitiveType: number, offest: number, numElements: number): void;
}
