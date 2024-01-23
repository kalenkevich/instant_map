import { WebGlLineBufferredGroup } from './line';
import LineShaders from './line_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';
import { MapFeatureFlags } from '../../../flags';

export class LineProgram extends ObjectProgram {
  protected point_aBuffer: WebGLBuffer;
  protected point_aAttributeLocation: number = 0;

  protected a_colorBuffer: WebGLBuffer;
  protected a_colorAttributeLocation: number = 1;

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

    this.point_aBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_aAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.vertexAttribPointer(this.point_aAttributeLocation, 2, this.gl.FLOAT, true, 0, 0);

    this.a_colorBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.vertexAttribPointer(this.a_colorAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  link() {
    this.gl.useProgram(this.program);
    this.setFeatureFlags();

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  drawObjectGroup(lineGroup: WebGlLineBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, lineGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineGroup.color.buffer as Float32Array, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, lineGroup.numElements);

    gl.bindVertexArray(null);
  }
}
