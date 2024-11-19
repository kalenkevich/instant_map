import { WebGlImageBufferredGroup } from './image';
import ImageShaiders from './image_shader';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { WebGlTexture, createWebGlTexture } from '../../helpers/weblg_texture';
import { LRUCache, LRUCacheEvents } from '../../../../utils/lru_cache';
import { TextureSource, TextureSourceType } from '../../../../texture/texture';

export class ImageProgram extends ObjectProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;

  // Attributes
  protected positionBuffer: WebGlBuffer;
  protected textcoordBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

  // Textures
  protected textures;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = ImageShaiders.vertext,
    protected readonly fragmentShaderSource: string = ImageShaiders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
    this.textures = new LRUCache<number, WebGlTexture>(16);
    this.textures.on(LRUCacheEvents.removed, this.onTexturePrunedFromCache);
  }

  public destroy() {
    for (const t of this.textures.values()) {
      t.destroy();
    }
  }

  onTexturePrunedFromCache = (event: LRUCacheEvents, t: WebGlTexture) => {
    t.destroy();
  };

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

  protected setupBuffers() {
    const gl = this.gl;

    this.positionBuffer = createWebGlBuffer(gl, { location: 0, size: 3 });
    this.textcoordBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.propertiesBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 3, size: 4 });
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.textureUniform = createWebGlUniform(this.gl, { name: 'u_texture', program: this.program });
  }

  async setupTextures() {}

  private createTexture(source: TextureSource) {
    const gl = this.gl;

    if (source.type === TextureSourceType.IMAGE_BITMAP) {
      return createWebGlTexture(gl, {
        name: 'image',
        width: source.width,
        height: source.height,
        flipY: true,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        source,
      });
    }

    return createWebGlTexture(gl, {
      name: 'image',
      width: source.width,
      height: source.height,
      flipY: false,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      pixels: source.data,
    });
  }

  drawObjectGroup(imageGroup: WebGlImageBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    let texture: WebGlTexture;
    const textureKey = imageGroup.texture.id;
    if (this.textures.has(textureKey)) {
      texture = this.textures.get(textureKey);
    } else {
      texture = this.createTexture(imageGroup.texture);
      this.textures.set(textureKey, texture);
    }

    this.textureUniform.setInteger(texture.index);
    texture.bind();

    this.positionBuffer.bufferData(imageGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageGroup.textcoords.buffer);
    this.propertiesBuffer.bufferData(imageGroup.properties.buffer);
    this.colorBuffer.bufferData(imageGroup.selectionColor.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, imageGroup.numElements);

    texture.unbind();
    gl.bindVertexArray(null);
  }
}
