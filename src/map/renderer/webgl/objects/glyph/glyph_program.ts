import { WebGlGlyphBufferredGroup } from './glyph';
import GlyphShaders from './glyph_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { GlyphsManager } from '../../../../glyphs/glyphs_manager';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { WebGlTexture, createWebGlTexture } from '../../helpers/weblg_texture';
import { toImageBitmapTextureSource } from '../../../../texture/texture_utils';

export class GlyphProgram extends ObjectProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;

  // Attributes
  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;

  // Textures
  protected currentAtlasTexture?: WebGlTexture;
  protected atlasTextures: Record<string, WebGlTexture> = {};

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly atlasTextureManager: GlyphsManager,
    protected readonly vertexShaderSource: string = GlyphShaders.vertext,
    protected readonly fragmentShaderSource: string = GlyphShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public async onInit(): Promise<void> {
    await this.setupTextures();
  }

  public onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
  }

  public onUnlink() {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  protected async setupTextures() {
    const gl = this.gl;

    const textures = this.atlasTextureManager.getAll();
    for (const textureInfo of textures) {
      this.atlasTextures[textureInfo.name] = createWebGlTexture(gl, {
        name: textureInfo.name,
        width: textureInfo.width,
        height: textureInfo.height,
        unpackPremultiplyAlpha: true,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
        source: await toImageBitmapTextureSource(textureInfo.source),
      });
    }
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 3 });
    this.textcoordBuffer = createWebGlBuffer(this.gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 2, size: 4 });
    this.propertiesBuffer = createWebGlBuffer(this.gl, { location: 3, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.textureUniform = createWebGlUniform(this.gl, { name: 'u_texture', program: this.program });
  }

  protected setCurrentTexture(textureName: string) {
    this.currentAtlasTexture = this.atlasTextures[textureName];
    this.textureUniform.setInteger(this.atlasTextures[textureName].index);
  }

  drawObjectGroup(objectGroup: WebGlGlyphBufferredGroup, options?: DrawObjectGroupOptions): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    if (!this.currentAtlasTexture || this.currentAtlasTexture.name !== objectGroup.atlas) {
      this.setCurrentTexture(objectGroup.atlas);
    }

    this.currentAtlasTexture?.bind();
    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(objectGroup.textcoords.buffer);
    this.propertiesBuffer.bufferData(objectGroup.properties.buffer);
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.color.buffer,
    );

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    this.currentAtlasTexture?.unbind();
    gl.bindVertexArray(null);
  }
}
