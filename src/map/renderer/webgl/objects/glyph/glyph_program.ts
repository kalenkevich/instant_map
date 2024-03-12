import { WebGlGlyphBufferredGroup } from './glyph';
import GlyphShaders from './glyph_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { GlyphsManager } from '../../../../glyphs/glyphs_manager';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';
import { WebGlTexture, createTexture } from '../../utils/weblg_texture';
import { toImageBitmapTexture } from '../../../../texture/texture_utils';

export class GlyphProgram extends ObjectProgram {
  protected u_textureLocation: WebGLUniformLocation;
  protected atlasTextures: Record<string, WebGlTexture> = {};
  protected currentAtlasTexture?: WebGlTexture;

  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly atlasTextureManager: GlyphsManager,
    protected readonly vertexShaderSource: string = GlyphShaders.vertext,
    protected readonly fragmentShaderSource: string = GlyphShaders.fragment
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
      this.atlasTextures[textureInfo.name] = createTexture(gl, {
        name: textureInfo.name,
        width: textureInfo.width,
        height: textureInfo.height,
        unpackPremultiplyAlpha: true,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
        source: await toImageBitmapTexture(textureInfo.source),
      });
    }
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 2 });
    this.textcoordBuffer = createWebGlBuffer(this.gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 2, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  protected setCurrentTexture(textureName: string) {
    this.currentAtlasTexture = this.atlasTextures[textureName];
    this.gl.uniform1i(this.u_textureLocation, this.atlasTextures[textureName].index);
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
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.color.buffer
    );

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    this.currentAtlasTexture?.unbind();
    gl.bindVertexArray(null);
  }
}
