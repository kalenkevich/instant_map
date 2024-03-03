import { WebGlLineBufferredGroup } from './line';
import LineShaders from './line_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';

export class LineProgram extends ObjectProgram {
  protected pointABuffer: WebGlBuffer;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = LineShaders.vertext,
    protected readonly fragmentShaderSource: string = LineShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer(): void {
    const gl = this.gl;

    this.gl.bindVertexArray(this.vao);

    this.pointABuffer = createWebGlBuffer(gl, { location: 0, size: 2 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 1, size: 4 });

    this.gl.bindVertexArray(null);
  }

  onInit(): void {}

  public onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public onUnlink() {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  drawObjectGroup(lineGroup: WebGlLineBufferredGroup, options: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.pointABuffer.bufferData(lineGroup.vertecies.buffer);
    this.colorBuffer.bufferData(options.readPixelRenderMode ? lineGroup.selectionColor.buffer : lineGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, lineGroup.numElements);

    gl.bindVertexArray(null);
  }
}
