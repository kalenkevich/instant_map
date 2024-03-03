import { WebGlPolygonBufferredGroup } from './polygon';
import PolygonShaders from './polygon_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';

export class PolygonProgram extends ObjectProgram {
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

  drawObjectGroup(objectGroup: WebGlPolygonBufferredGroup, options: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.colorBuffer.bufferData(
      options.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.color.buffer
    );

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
