import { WebGlPolygonBufferredGroup } from './polygon';
import PolygonShaders from './polygon_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
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

  onInit(): void {}

  onLink(): void {}

  onUnlink(): void {}

  drawObjectGroup(objectGroup: WebGlPolygonBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.colorBuffer.bufferData(objectGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
