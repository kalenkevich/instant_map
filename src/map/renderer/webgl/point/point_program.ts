import { WebGlPointBufferredGroup } from './point';
import PointShaders from './point_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';

export class PointProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = PointShaders.vertext,
    protected readonly fragmentShaderSource: string = PointShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  drawObjectGroup(objectGroup: WebGlPointBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.color.buffer, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
