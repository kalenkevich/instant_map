import VERTEX_SHADER from './default_program_vs.glsl';
import FRAGMENT_SHADER from './default_program_fs.glsl';
import { WebGl2Program, WebGl2ProgramUniforms } from '../program';

export interface WebGl2ProgramDefaultUniforms extends WebGl2ProgramUniforms {}

export class WebGl2ProgramDefault extends WebGl2Program {
  protected u_colorLocation: WebGLUniformLocation;
  protected u_resolutionLocation: WebGLUniformLocation;
  protected u_matrixLocation: WebGLUniformLocation;
  protected u_object_typeLocation: WebGLUniformLocation;
  protected u_line_widthLocation: WebGLUniformLocation;

  protected positionBuffer: WebGLBuffer;

  // Location index should be in sync with the vertex shaider source.
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
    this.positionBuffer = this.gl.createBuffer();
  }

  /**
   * Locates all the uniforms for vertex and fragment shaiders.
   * Note: program should be alredy compiled, please call `compileProgram` method first.
   */
  locateUniforms() {
    const gl = this.gl;

    this.u_colorLocation = gl.getUniformLocation(this.program, 'u_color');
    this.u_resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    this.u_matrixLocation = gl.getUniformLocation(this.program, 'u_matrix');
  }

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  setBuffer(data: Float32Array) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    // const vao = this.gl.createVertexArray();
    // this.gl.bindVertexArray(vao);
    this.gl.enableVertexAttribArray(this.a_positionLocation);

    // 2D Objects supported only for now.
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, 0);

    // this.gl.bindVertexArray(vao);
  }

  /**
   * Bind all uniform values to webgl2 program.
   * @param uniforms all programm uniform values
   */
  setUniforms(uniforms: WebGl2ProgramDefaultUniforms) {
    this.gl.uniform4fv(this.u_colorLocation, uniforms.u_color);
    this.gl.uniform2f(this.u_resolutionLocation, uniforms.u_resolution[0], uniforms.u_resolution[1]);
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, uniforms.u_matrix);
  }
}
