import VERTEX_SHADER from './line_program_vs.glsl';
import FRAGMENT_SHADER from '../default/default_program_fs.glsl';
import { WebGl2Program, WebGl2ProgramUniforms } from '../program';

export interface WebGl2ProgramLineUniforms extends WebGl2ProgramUniforms {
  u_line_width: number;
}

const POSITION_BUFFER = new Float32Array([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);

export class WebGl2LineProgram extends WebGl2Program {
  protected u_line_widthLocation: WebGLUniformLocation;

  protected a_positionBuffer: WebGLBuffer;
  protected point_aBuffer: WebGLBuffer;
  protected point_bBuffer: WebGLBuffer;

  // Location index should be in sync with the vertex shader source.
  protected a_positionLocation = 0;
  protected point_aLocation = 1;
  protected point_bLocation = 2;

  constructor(
    protected readonly gl: WebGL2RenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  /**
   * Allocates Webgl buffer for the future use.
   */
  allocateBuffer() {
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    this.a_positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.a_positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, POSITION_BUFFER, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 0, 0);

    this.point_aBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_aLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.vertexAttribPointer(this.point_aLocation, 2, this.gl.FLOAT, true, 0, 0);
    this.gl.vertexAttribDivisor(this.point_aLocation, 1);

    this.point_bBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_bLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    this.gl.vertexAttribPointer(this.point_bLocation, 2, this.gl.FLOAT, true, 0, Float32Array.BYTES_PER_ELEMENT * 2);
    this.gl.vertexAttribDivisor(this.point_bLocation, 1);

    this.gl.bindVertexArray(null);
  }

  /**
   * Locates all the uniforms for vertex and fragment shaiders.
   * Note: program should be alredy compiled, please call `compileProgram` method first.
   */
  locateUniforms() {
    super.locateUniforms();
    this.u_line_widthLocation = this.gl.getUniformLocation(this.program, 'u_line_width');
  }

  setIndexBuffer(indeces: Uint16Array) {
    // do nothing.
  }

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  setDataBuffer(data: Float32Array) {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }

  /**
   * Bind all uniform values to webgl2 program.
   * @param uniforms all programm uniform values
   */
  setUniforms(uniforms: WebGl2ProgramLineUniforms) {
    super.setUniforms(uniforms);
    this.gl.uniform1f(this.u_line_widthLocation, uniforms.u_line_width);
  }
}
