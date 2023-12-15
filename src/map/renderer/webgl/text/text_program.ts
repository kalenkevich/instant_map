import { WebGlTextBufferredGroup } from './text';
import TextShaders from './text_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';

export class TextProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  drawObjectGroup(objectGroup: WebGlTextBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.vertecies.buffer as Float32Array, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.color.buffer as Float32Array, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
