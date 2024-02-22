import { WebGlPointBufferredGroup } from './point';
import PointShaders from './point_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { MapFeatureFlags } from '../../../flags';

export class PointProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = PointShaders.vertext,
    protected readonly fragmentShaderSource: string = PointShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  onInit(): void {}

  onLink(): void {}

  onUnlink(): void {}

  drawObjectGroup(objectGroup: WebGlPointBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.colorBuffer.bufferData(objectGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
