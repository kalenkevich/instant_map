import { WebGlTextTextureBufferredGroup } from './text_texture';
import TextShaders from './text_texture_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';
import { WebGlTexture, createTexture } from '../../utils/weblg_texture';
import { FontManager } from '../../../../font/font_manager';
import { TextureFontAtlas } from '../../../../font/font_config';

export class TextTextureProgram extends ObjectProgram {
  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

  protected fontTextures: WebGlTexture[] = [];
  protected u_textureLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly fontManager: FontManager,
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
    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas;

    for (const [key, source] of Object.entries(fontAtlas.sources)) {
      this.fontTextures.push(
        createTexture(gl, {
          name: 'text_atlas_' + key,
          width: source.source.width,
          height: source.source.height,
          unpackPremultiplyAlpha: true,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          minFilter: gl.NEAREST,
          magFilter: gl.NEAREST,
          source: source.source,
        })
      );
    }
  }

  drawObjectGroup(textGroup: WebGlTextTextureBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    const texture = this.fontTextures[textGroup.textureIndex];
    gl.uniform1i(this.u_textureLocation, texture.index);
    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(textGroup.textcoords.buffer);
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? textGroup.selectionColor.buffer : textGroup.color.buffer
    );

    gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

    gl.bindVertexArray(null);
  }
}
