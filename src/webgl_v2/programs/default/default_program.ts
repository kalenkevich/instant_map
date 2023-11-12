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
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, 0);

    this.gl.bindVertexArray(null);
  }

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  setDataBuffer(data: Float32Array) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }

  setPointerOffset(offset: number) {
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, offset);
  }

  setIndexBuffer(indeces: Uint16Array) {
    // do nothing.
  }

  setTexture(texture: TexImageSource): void {
    // do nothing.
  }
}
