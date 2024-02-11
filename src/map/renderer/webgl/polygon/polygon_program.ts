import { WebGlPolygonBufferredGroup } from './polygon';
import PolygonShaders from './polygon_shaders';
import { ObjectProgram, ExtendedWebGLRenderingContext } from '../object/object_program';
import { MapFeatureFlags } from '../../../flags';

export class PolygonProgram extends ObjectProgram {
  protected program: WebGLProgram;
  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = PolygonShaders.vertext,
    protected readonly fragmentShaderSource: string = PolygonShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  drawObjectGroup(objectGroup: WebGlPolygonBufferredGroup) {
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
