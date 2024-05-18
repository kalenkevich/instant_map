import { WebGlTextTextureBufferredGroup } from './text_texture';
import TextShaders from './text_texture_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { WebGlTexture, createWebGlTexture } from '../../helpers/weblg_texture';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { FontManager } from '../../../../font/font_manager';
import { TextureFontAtlas } from '../../../../font/font_config';
import { toImageBitmapTextureSource } from '../../../../texture/texture_utils';

export class TextTextureProgram extends ObjectProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;
  protected propertiesDataUniform: WebGlUniform;
  protected propertiesTextureUniform: WebGlUniform;
  protected isSfdUniform: WebGlUniform;
  protected borderWidthUniform: WebGlUniform;

  // Attributes
  protected textcoordBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;
  protected textPropertiesBuffer: WebGlBuffer;
  protected objectIndexBuffer: WebGlBuffer;

  // Textures
  protected fontTextures: WebGlTexture[] = [];
  protected propertiesTexture: WebGlTexture;

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

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(gl, { location: 0, size: 3 });
    this.textcoordBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(gl, { location: 2, size: 4 });
    this.textPropertiesBuffer = createWebGlBuffer(gl, { location: 3, size: 4 });
    this.objectIndexBuffer = createWebGlBuffer(gl, { location: 4, size: 1 });

    gl.bindVertexArray(null);
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

    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas | undefined;

    for (const source of Object.values(fontAtlas?.sources || {})) {
      this.fontTextures.push(
        createWebGlTexture(gl, {
          name: 'text_atlas_' + source.name,
          width: source.source.width,
          height: source.source.height,
          unpackPremultiplyAlpha: true,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          source: await toImageBitmapTextureSource(source.source),
        }),
      );
    }
  }

  drawObjectGroup(textGroup: WebGlTextTextureBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    const texture = this.fontTextures[textGroup.textureIndex];
    texture.bind();

    this.textureUniform.setInteger(texture.index);
    this.isSfdUniform.setBoolean(textGroup.sfdTexture);

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

    texture.unbind();
    this.propertiesTexture.unbind();
    gl.bindVertexArray(null);
  }
}
