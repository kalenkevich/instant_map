import { WebGlTextPolygonBufferredGroup } from '../text_texture/text';
import { MapFeatureFlags } from '../../../flags';
import TextShaders from './text_polygon_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
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

  onInit(): void {}

  onLink(): void {}

  onUnlink(): void {}

  drawObjectGroup(textGroup: WebGlTextPolygonBufferredGroup, options: DrawObjectGroupOptions): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.colorBuffer.bufferData(options.readPixelRenderMode ? textGroup.selectionColor.buffer : textGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

    gl.bindVertexArray(null);
  }
}
