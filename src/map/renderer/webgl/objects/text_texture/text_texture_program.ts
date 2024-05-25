import { WebGlTextTextureBufferredGroup } from './text_texture';
import TextShaders from './text_texture_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { WebGlTexture, createWebGlTexture } from '../../helpers/weblg_texture';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { FontManager } from '../../../../font/font_manager';
import { TextureSource, TextureSourceType } from '../../../../texture/texture';

export class TextTextureProgram extends ObjectProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;
  protected propertiesDataUniform: WebGlUniform;
  protected propertiesTextureUniform: WebGlUniform;
  protected isSfdUniform: WebGlUniform;
  protected borderWidthUniform: WebGlUniform;

  // Attributes
  protected positionBuffer: WebGlBuffer;
  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;
  protected textPropertiesBuffer: WebGlBuffer;
  protected objectIndexBuffer: WebGlBuffer;

  // Textures
  protected fontTexture: WebGlTexture;
  protected propertiesTexture: WebGlTexture;
  private currentFontTexture: TextureSource;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly fontManager: FontManager,
    protected readonly vertexShaderSource: string = TextShaders.vertext,
    protected readonly fragmentShaderSource: string = TextShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
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

  public destroy(): void {
    this.fontTexture.destroy();
    this.propertiesTexture.destroy();
  }

  protected setupBuffers() {
    const gl = this.gl;

    this.positionBuffer = createWebGlBuffer(gl, { location: 0, size: 3 });
    this.textcoordBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });
    this.textPropertiesBuffer = createWebGlBuffer(gl, { location: 3, size: 4 });
    this.objectIndexBuffer = createWebGlBuffer(gl, { location: 4, size: 1 });
  }

  protected setupUniforms() {
    super.setupUniforms();

    const gl = this.gl;

    this.textureUniform = createWebGlUniform(gl, { name: 'u_texture', program: this.program });
    this.propertiesDataUniform = createWebGlUniform(gl, { name: 'u_properties_data', program: this.program });
    this.propertiesTextureUniform = createWebGlUniform(gl, { name: 'u_properties', program: this.program });
    this.isSfdUniform = createWebGlUniform(gl, { name: 'u_is_sfd_mode', program: this.program });
    this.borderWidthUniform = createWebGlUniform(gl, { name: 'u_border_width', program: this.program });
  }

  protected async setupTextures() {
    const gl = this.gl;

    this.fontTexture = createWebGlTexture(gl, {
      name: 'text_texture_atlas',
      flipY: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      type: gl.UNSIGNED_BYTE,
      internalFormat: gl.RGBA,
      format: gl.RGBA,
    });
    this.propertiesTexture = createWebGlTexture(gl, {
      name: 'text_properties_texture',
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      // Not texture filterable means they must be used with gl.NEAREST only
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      // Be careful with this config. This one only for Float32 texture source.
      // Сheck more options and combinations here: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D#internalformat
      type: gl.FLOAT,
      internalFormat: gl.RGBA32F,
      format: gl.RGBA,
    });
  }

  drawObjectGroup(textGroup: WebGlTextTextureBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.fontTexture.bind();
    // Change current font texture only when it is really different.
    if (this.currentFontTexture?.id !== textGroup.texture.id) {
      if (textGroup.texture.type === TextureSourceType.IMAGE_BITMAP) {
        this.fontTexture.setSource(textGroup.texture);
      } else {
        this.fontTexture.setPixels(textGroup.texture);
      }
    }
    this.currentFontTexture = textGroup.texture;

    this.textureUniform.setInteger(this.fontTexture.index);
    this.isSfdUniform.setBoolean(textGroup.isSfdTexture);

    this.propertiesTexture.bind();
    this.propertiesTexture.setPixels(textGroup.properties.texture);
    this.propertiesDataUniform.setVector3([
      textGroup.properties.texture.width,
      textGroup.properties.texture.height,
      textGroup.properties.sizeInPixels,
    ]);
    this.propertiesTextureUniform.setInteger(this.propertiesTexture.index);

    this.positionBuffer.bufferData(textGroup.vertecies.buffer);
    this.textcoordBuffer.bufferData(textGroup.textcoords.buffer);
    this.textPropertiesBuffer.bufferData(textGroup.textProperties.buffer);
    this.objectIndexBuffer.bufferData(textGroup.objectIndex.buffer);

    if (options?.readPixelRenderMode) {
      this.colorBuffer.bufferData(textGroup.selectionColor.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);
    } else {
      // draw text border
      this.borderWidthUniform.setFloat(0.6);
      this.colorBuffer.bufferData(textGroup.borderColor.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);

      // draw text
      this.borderWidthUniform.setFloat(0.75);
      this.colorBuffer.bufferData(textGroup.color.buffer);
      gl.drawArrays(gl.TRIANGLES, 0, textGroup.numElements);
    }

    this.fontTexture.unbind();
    this.propertiesTexture.unbind();
    gl.bindVertexArray(null);
  }
}
