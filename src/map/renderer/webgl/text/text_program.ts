import { WebGlTextBufferredGroup } from './text';
import TextShaders from './text_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { MapFeatureFlags } from '../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../utils/webgl_buffer';
import { WebGlTexture, createTexture } from '../utils/weblg_texture';
import { downloadBitmapImage } from '../../../utils/download_utils';

export class TextProgram extends ObjectProgram {
  textcoordBuffer: WebGlBuffer;
  colorBuffer: WebGlBuffer;

  protected u_textureLocation: WebGLUniformLocation;

  protected texture: WebGlTexture;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public onInit(): void {
    this.setupTexture();
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

  protected setupTexture() {
    const gl = this.gl;

    this.texture = createTexture(gl, {
      width: 0,
      height: 0,
      unpackPremultiplyAlpha: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
    });
  }

  drawObjectGroup(textGroup: WebGlTextBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.uniform1i(this.u_textureLocation, this.texture.index);
    this.texture.setSource(textGroup.texture.source);
    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(textGroup.textcoords.buffer);
    this.colorBuffer.bufferData(textGroup.color.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

    gl.bindVertexArray(null);
  }
}
