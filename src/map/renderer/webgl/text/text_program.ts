import { WebGlTextBufferredGroup } from './text';
import TextShaders from './text_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { MapFeatureFlags } from '../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../utils/webgl_buffer';

const TEXTURE_INDEX = 5;

export class TextProgram extends ObjectProgram {
  textcoordBuffer: WebGlBuffer;
  colorBuffer: WebGlBuffer;

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

    this.positionBuffer = createWebGlBuffer(gl, { location: 0, size: 2 });
    this.textcoordBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });

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

    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(textGroup.textcoords.buffer);
    this.colorBuffer.bufferData(textGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

    gl.bindVertexArray(null);
  }
}
