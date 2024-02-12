import { WebGlTextBufferredGroup } from './text';
import TextShaders from './text_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';
import { MapFeatureFlags } from '../../../flags';

const TEXTURE_INDEX = 5;

export class TextProgram extends ObjectProgram {
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  protected a_textcoordBuffer: WebGLBuffer;
  protected a_textcoordAttributeLocation: number = 1;

  protected a_colorBuffer: WebGLBuffer;
  protected a_colorAttributeLocation: number = 2;

  protected u_textureLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
  }

  onUnlink(): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.a_positionBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.a_textcoordBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_textcoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_textcoordBuffer);
    gl.vertexAttribPointer(this.a_textcoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.a_colorBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.vertexAttribPointer(this.a_colorAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  setTexture(source: TexImageSource) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(this.u_textureLocation, TEXTURE_INDEX);
  }

  drawObjectGroup(textGroup: WebGlTextBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.setTexture(textGroup.texture.source);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_textcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textGroup.textcoords.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textGroup.color.buffer, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

    gl.bindVertexArray(null);
  }
}
