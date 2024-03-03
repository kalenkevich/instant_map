import { WebGlImageBufferredGroup } from './image';
import ImageShaiders from './image_shader';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';
import { WebGlTexture, createTexture } from '../../utils/weblg_texture';

export class ImageProgram extends ObjectProgram {
  protected texture: WebGlTexture;
  protected u_textureLocation: WebGLUniformLocation;
  protected textcoordBuffer: WebGlBuffer;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = ImageShaiders.vertext,
    protected readonly fragmentShaderSource: string = ImageShaiders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  onInit(): void {
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

  setupTexture() {
    const gl = this.gl;

    this.texture = createTexture(gl, {
      name: 'image',
      width: 0,
      height: 0,
      unpackPremultiplyAlpha: false,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });
  }

  drawObjectGroup(imageGroup: WebGlImageBufferredGroup, options?: DrawObjectGroupOptions): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.uniform1i(this.u_textureLocation, this.texture.index);
    this.texture.setSource(imageGroup.texture.source);
    this.texture.bind();

    this.positionBuffer.bufferData(imageGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageGroup.textcoords.buffer);
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? imageGroup.selectionColor.buffer : imageGroup.color.buffer
    );

    gl.drawArrays(gl.TRIANGLES, 0, imageGroup.numElements);

    this.texture.unbind();
    gl.bindVertexArray(null);
  }
}
