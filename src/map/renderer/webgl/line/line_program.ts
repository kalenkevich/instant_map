import { WebGlLineBufferredGroup } from './line';
import LineShaders from './line_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';

const POSITION_BUFFER = new Float32Array([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);

export class LineProgram extends ObjectProgram {
  // buffers
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  protected point_aBuffer: WebGLBuffer;
  protected point_aAttributeLocation: number = 1;

  protected point_bBuffer: WebGLBuffer;
  protected point_bAttributeLocation: number = 2;

  protected a_colorBuffer: WebGLBuffer;
  protected a_colorAttributeLocation: number = 3;

  protected a_line_widthBuffer: WebGLBuffer;
  protected a_line_widthAttributeLocation: number = 4;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = LineShaders.vertext,
    protected readonly fragmentShaderSource: string = LineShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer(): void {
    const gl = this.gl;

    this.gl.bindVertexArray(this.vao);

    this.a_positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.a_positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, POSITION_BUFFER, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, true, 0, 0);
    this.gl.vertexAttribDivisor(this.a_positionAttributeLocation, 0);

    this.point_aBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_aAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.vertexAttribPointer(this.point_aAttributeLocation, 3, this.gl.FLOAT, true, 0, 0);
    this.gl.vertexAttribDivisor(this.point_aAttributeLocation, 1);

    this.point_bBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_bAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    this.gl.vertexAttribPointer(
      this.point_bAttributeLocation,
      3,
      this.gl.FLOAT,
      true,
      0,
      Float32Array.BYTES_PER_ELEMENT * 3
    );
    this.gl.vertexAttribDivisor(this.point_bAttributeLocation, 1);

    this.a_colorBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.vertexAttribPointer(this.a_colorAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(this.a_colorAttributeLocation, 1);

    this.a_line_widthBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_line_widthAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_line_widthBuffer);
    gl.vertexAttribPointer(this.a_line_widthAttributeLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(this.a_line_widthAttributeLocation, 1);

    this.gl.bindVertexArray(null);
  }

  link() {
    this.gl.useProgram(this.program);

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  drawObjectGroup(lineGroup: WebGlLineBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, lineGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, lineGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineGroup.color.buffer as Float32Array, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_line_widthBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineGroup.width.buffer as Float32Array, gl.STATIC_DRAW);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, POSITION_BUFFER.length / 2, lineGroup.numElements - 1);

    gl.bindVertexArray(null);
  }
}
