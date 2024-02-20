import { WebGlGlyphBufferredGroup } from './glyph';
import GlyphShaders from './glyph_shaders';
import { ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { AtlasTextureManager } from '../../../atlas/atlas_manager';
import { MapFeatureFlags } from '../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../utils/webgl_buffer';

export interface WebglAtlasTextureConfig {
  name: string;
  texture: WebGLTexture;
  textureIndex: number;
  width: number;
  height: number;
}

export class GlyphProgram extends ObjectProgram {
  protected u_textureLocation: WebGLUniformLocation;
  protected atlasTextures: Record<string, WebglAtlasTextureConfig> = {};
  protected currentTexture?: string;

  protected a_textcoordBuffer: WebGLBuffer;
  protected a_textcoordAttributeLocation: number = 1;

  protected textcoordBuffer: WebGlBuffer;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly atlasTextureManager: AtlasTextureManager,
    protected readonly vertexShaderSource: string = GlyphShaders.vertext,
    protected readonly fragmentShaderSource: string = GlyphShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public init(): void {
    super.init();
    this.setupTextures();
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

  protected setupTextures() {
    const gl = this.gl;

    let textureIndex = 0;
    const textures = this.atlasTextureManager.getAll();
    for (const textureInfo of textures) {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + textureIndex);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureInfo.source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      this.atlasTextures[textureInfo.name] = {
        name: textureInfo.name,
        texture,
        textureIndex,
        width: textureInfo.width,
        height: textureInfo.height,
      };

      textureIndex++;
    }
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 2 });
    this.textcoordBuffer = createWebGlBuffer(this.gl, { location: 1, size: 2 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  protected setCurrentTexture(textureName: string) {
    this.currentTexture = textureName;
    this.gl.uniform1i(this.u_textureLocation, this.atlasTextures[textureName].textureIndex);
  }

  drawObjectGroup(objectGroup: WebGlGlyphBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    if (!this.currentTexture || this.currentTexture !== objectGroup.atlas) {
      this.setCurrentTexture(objectGroup.atlas);
    }

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(objectGroup.textcoords.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
