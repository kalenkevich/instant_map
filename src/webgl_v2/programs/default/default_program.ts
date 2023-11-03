import VERTEX_SHADER from './default_program_vs.glsl';
import FRAGMENT_SHADER from './default_program_fs.glsl';
import { WebGl2Program } from '../program';

export class WebGl2DefaultProgram extends WebGl2Program {
  protected positionBuffer: WebGLBuffer;

  // Location index should be in sync with the vertex shader source.
  protected a_positionLocation = 0;

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
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  setBuffer(data: Float32Array) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, 0);

    // const vao = this.gl.createVertexArray();
    // this.gl.bindVertexArray(vao);
  }
}
