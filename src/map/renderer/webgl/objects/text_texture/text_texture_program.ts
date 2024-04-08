import { WebGlTextTextureBufferredGroup } from './text_texture';
import TextShaders from './text_texture_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';
import { WebGlTexture, createTexture } from '../../utils/weblg_texture';
import { FontManager } from '../../../../font/font_manager';
import { TextureFontAtlas } from '../../../../font/font_config';
import { toImageBitmapTexture } from '../../../../texture/texture_utils';

export class TextTextureProgram extends ObjectProgram {
  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;
  protected textPropertiesBuffer: WebGlBuffer;

  protected fontTextures: WebGlTexture[] = [];
  protected u_textureLocation: WebGLUniformLocation;
  protected u_sfdLocation: WebGLUniformLocation;
  protected u_border_widthLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly fontManager: FontManager,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public async onInit(): Promise<void> {
    await this.setupTexture();
  }

  onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

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
    this.colorBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });
    this.textPropertiesBuffer = createWebGlBuffer(gl, { location: 3, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
    this.u_sfdLocation = this.gl.getUniformLocation(this.program, 'u_is_sfd_mode');
    this.u_border_widthLocation = this.gl.getUniformLocation(this.program, 'u_border_width');
  }

  protected async setupTexture() {
    const gl = this.gl;
    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas | undefined;

    for (const source of Object.values(fontAtlas?.sources || {})) {
      this.fontTextures.push(
        createTexture(gl, {
          name: 'text_atlas_' + source.name,
          width: source.source.width,
          height: source.source.height,
          unpackPremultiplyAlpha: true,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          source: await toImageBitmapTexture(source.source),
        }),
      );
    }
  }

  drawObjectGroup(textGroup: WebGlTextTextureBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    const texture = this.fontTextures[textGroup.textureIndex];
    texture.bind();
    gl.uniform1i(this.u_textureLocation, texture.index);
    gl.uniform1i(this.u_sfdLocation, textGroup.sfdTexture ? 1 : 0);

    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(textGroup.textcoords.buffer);
    this.textPropertiesBuffer.bufferData(textGroup.textProperties.buffer);

    if (options?.readPixelRenderMode) {
      this.colorBuffer.bufferData(textGroup.selectionColor.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);
    } else {
      // draw text border
      gl.uniform1f(this.u_border_widthLocation, 0.6);
      this.colorBuffer.bufferData(textGroup.borderColor.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

      // draw text
      gl.uniform1f(this.u_border_widthLocation, 0.75);
      this.colorBuffer.bufferData(textGroup.color.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);
    }

    texture.unbind();
    gl.bindVertexArray(null);
  }
}
