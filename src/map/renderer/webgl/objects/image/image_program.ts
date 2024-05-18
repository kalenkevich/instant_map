import { WebGlImageBufferredGroup } from './image';
import ImageShaiders from './image_shader';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { WebGlTexture, createWebGlTexture } from '../../helpers/weblg_texture';

export class ImageProgram extends ObjectProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;

  // Attributes
  protected textcoordBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;

  // Textures
  protected texture: WebGlTexture;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = ImageShaiders.vertext,
    protected readonly fragmentShaderSource: string = ImageShaiders.fragment,
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

    this.positionBuffer = createWebGlBuffer(gl, { location: 0, size: 3 });
    this.textcoordBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.propertiesBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 3, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.textureUniform = createWebGlUniform(this.gl, { name: 'u_texture', program: this.program });
  }

  async setupTextures() {
    const gl = this.gl;

    this.texture = createWebGlTexture(gl, {
      name: 'image',
      width: 0,
      height: 0,
      flipY: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });
  }

  drawObjectGroup(imageGroup: WebGlImageBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.textureUniform.setInteger(this.texture.index);
    this.texture.setSource(imageGroup.texture);
    this.texture.bind();

    this.positionBuffer.bufferData(imageGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageGroup.textcoords.buffer);
    this.propertiesBuffer.bufferData(imageGroup.properties.buffer);
    this.colorBuffer.bufferData(imageGroup.selectionColor.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, imageGroup.numElements);

    this.texture.unbind();
    gl.bindVertexArray(null);
  }
}
