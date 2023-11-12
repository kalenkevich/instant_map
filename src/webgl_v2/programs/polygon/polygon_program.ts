import { WebGl2DefaultProgram } from '../default/default_program';

export class WebGl2PolygonProgram extends WebGl2DefaultProgram {
  protected indexBuffer: WebGLBuffer;

  /**
   * Allocates Webgl buffer for the future use.
   */
  allocateBuffer() {
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    this.positionBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.a_positionLocation, 2, this.gl.FLOAT, true, 8, 0);
    this.gl.enableVertexAttribArray(this.a_positionLocation);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

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
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indeces, this.gl.STATIC_DRAW);
  }

  setTexture(texture: TexImageSource): void {
    // do nothing.
  }
}
