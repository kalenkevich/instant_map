import VERTEX_SHADER from './text_program_vs.glsl';
import FRAGMENT_SHADER from './text_program_fs.glsl';
import { WebGl2Program } from '../program';

export class WebGl2TextProgram extends WebGl2Program {
  protected positionBuffer: WebGLBuffer;
  protected texCoordBuffer: WebGLBuffer;
  protected indexBuffer: WebGLBuffer;

  // Location index should be in sync with the vertex shader source.
  protected a_positionLocation = 0;
  protected a_texcoordLocation = 1;

  protected u_textureLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: WebGL2RenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  use(): void {
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.depthMask(false);

    this.gl.useProgram(this.program);
    if (this.vao) {
      this.gl.bindVertexArray(this.vao);
    }
  }

  /**
   * Allocates Webgl buffer for the future use.
   */
  allocateBuffer() {
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.a_positionLocation);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, 0);

    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(this.a_texcoordLocation);
    this.gl.vertexAttribPointer(this.a_texcoordLocation, 2, this.gl.FLOAT, true, 0, 0);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), this.gl.STATIC_DRAW);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.gl.bindVertexArray(null);
  }

  locateUniforms() {
    this.u_resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
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
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indeces, this.gl.STATIC_DRAW);
  }

  setTexture(texture: TexImageSource) {
    if (!texture) {
      return;
    }

    const gl = this.gl;
    const textTex = this.gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(this.u_textureLocation, 0);
    gl.activeTexture(gl.TEXTURE0);
  }
}
