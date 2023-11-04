import { Mat3, Vector2, Vector4 } from '../types';

/** Base interface for ProgramUniforms. */
export interface WebGl2ProgramUniforms {
  u_color: Vector4;
  u_resolution: Vector2;
  u_matrix: Mat3;
}

export enum WebGl2ProgramType {
  default = 0,
  line = 1,
  polygon = 2,
  image = 3,
  text = 4,
}

/**
 * Base Webgl2 programm wrapper class.
 * All programs should extends from this class and implement programm specific methods like `setBuffer`, `setUniforms`.
 */
export abstract class WebGl2Program {
  protected program?: WebGLProgram;
  protected vao: WebGLVertexArrayObject;

  static ProgramType: WebGl2ProgramType;

  protected u_colorLocation: WebGLUniformLocation;
  protected u_resolutionLocation: WebGLUniformLocation;
  protected u_matrixLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: WebGL2RenderingContext,
    protected readonly vertexShaderSource: string,
    protected readonly fragmentShaderSource: string
  ) {}

  init() {
    this.compileProgram();
    this.locateUniforms();
    this.allocateBuffer();
  }

  /**
   * Compiles source code for vertex and fragment shaiders.
   * Note: to link program to the context please check `link` method.
   */
  protected compileProgram() {
    const gl = this.gl;
    this.program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, this.vertexShaderSource);
    gl.compileShader(vertexShader);
    gl.attachShader(this.program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, this.fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(this.program, fragmentShader);

    gl.linkProgram(this.program);
  }

  /**
   * Locates all the uniforms for vertex and fragment shaiders.
   * Note: program should be alredy compiled, please call `compileProgram` method first.
   */
  locateUniforms() {
    this.u_colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    this.u_resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
  }

  /**
   * Allocates Webgl buffer for the future use.
   */
  abstract allocateBuffer(): void;

  use(): void {
    this.gl.useProgram(this.program);
  }

  abstract setIndexBuffer(bufferData?: Uint16Array): void;

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  abstract setDataBuffer(bufferData: Float32Array): void;

  /**
   * Bind all uniform values to webgl2 program.
   * @param uniforms all programm uniform values
   */
  setUniforms(uniforms: WebGl2ProgramUniforms) {
    this.gl.uniform4fv(this.u_colorLocation, uniforms.u_color);
    this.gl.uniform2f(this.u_resolutionLocation, uniforms.u_resolution[0], uniforms.u_resolution[1]);
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, uniforms.u_matrix);
  }
}
