import { WebGlTextPolygonBufferredGroup } from '../text_texture/text';
import { MapFeatureFlags } from '../../../flags';
import TextShaders from './text_polygon_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';

export class TextPolygonProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  onInit(): void {
  }

  onLink(): void {
  }

  onUnlink(): void {
  }

  drawObjectGroup(objectGroup: WebGlTextPolygonBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.colorBuffer.bufferData(objectGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}