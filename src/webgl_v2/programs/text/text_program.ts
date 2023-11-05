import VERTEX_SHADER from './text_program_vs.glsl';
import FRAGMENT_SHADER from './text_program_fs.glsl';
import { WebGl2Program, WebGl2ProgramUniforms } from '../program';

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

  /**
   * Allocates Webgl buffer for the future use.
   */
  allocateBuffer() {
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 0, 0);

    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(this.a_texcoordLocation);
    this.gl.vertexAttribPointer(this.a_texcoordLocation, 2, this.gl.FLOAT, true, 0, 0);

    this.gl.bindVertexArray(null);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  }

  locateUniforms() {
    super.locateUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  setUniforms(uniforms: WebGl2ProgramUniforms): void {
    super.setUniforms(uniforms);
    this.gl.uniform1i(this.u_textureLocation, 0);
  }

  /**
   * Bind buffer to the webgl2 program.
   * @param bufferData buffer data to be binded.
   */
  setDataBuffer(data: Float32Array) {
    this.gl.bindVertexArray(this.vao);
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

  setTexture(texture: TexImageSource): void {
    const textTex = this.gl.createTexture();
    // this.gl.bindTexture(this.gl.TEXTURE_2D, textTex);
    // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    // this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    // this.gl.generateMipmap(this.gl.TEXTURE_2D);
    // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    // this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);

    this.gl.bindTexture(this.gl.TEXTURE_2D, textTex);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);
  }
}
