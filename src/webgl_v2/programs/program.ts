import { Mat3, Vector2, Vector4 } from '../types';

/** Base interface for ProgramUniforms. */
export interface WebGl2ProgramUniforms {
  u_color: Vector4;
  u_resolution: Vector2;
  u_matrix: Mat3;
}

export enum WebGl2ProgramType {
  default = 0,
  image = 1,
  text = 2,
}

/**
 * Base Webgl2 programm wrapper class.
 * All programs should extends from this class and implement programm specific methods like `setBuffer`, `setUniforms`.
 */
export abstract class WebGl2Program {
  protected program?: WebGLProgram;

  static ProgramType: WebGl2ProgramType;

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
  abstract locateUniforms(): void;

  /**
   * Allocates Webgl buffer for the future use.
   */
  abstract allocateBuffer(): void;

  use(): void {
    this.gl.useProgram(this.program);
  }

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  abstract setBuffer(bufferData: Float32Array): void;

  /**
   * Bind all uniform values to gl program.
   * @param uniforms all programm uniform values
   */
  abstract setUniforms(uniforms: WebGl2ProgramUniforms): void;

  public consoleGlError(stage: string) {
    const gl = this.gl;
    const glError = gl.getError();

    switch (glError) {
      case gl.NO_ERROR:
        return;
      case gl.INVALID_ENUM:
        return console.log(`GL stage: '${stage}', error: INVALID_ENUM`);
      case gl.INVALID_VALUE:
        return console.log(`GL stage: '${stage}', error: INVALID_VALUE`);
      case gl.INVALID_OPERATION:
        return console.log(`GL stage: '${stage}', error: INVALID_OPERATION`);
      case gl.OUT_OF_MEMORY:
        return console.log(`GL stage: '${stage}', error: OUT_OF_MEMORY`);
      case gl.CONTEXT_LOST_WEBGL:
        return console.log(`GL stage: '${stage}', error: CONTEXT_LOST_WEBGL`);
    }
  }
}
