import { WebGlIconBufferredGroup } from './icon';
import IconShaders from './icon_shaders';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';
import { AtlasTextureManager } from '../../../atlas/atlas_manager';

export interface WebglAtlasTextureConfig {
  name: string;
  texture: WebGLTexture;
  textureIndex: number;
  width: number;
  height: number;
}

export class IconProgram extends ObjectProgram {
  protected u_textureLocation: WebGLUniformLocation;
  protected atlasTextures: Record<string, WebglAtlasTextureConfig> = {};
  protected currentTexture?: string;

  protected a_textcoordBuffer: WebGLBuffer;
  protected a_textcoordAttributeLocation: number = 1;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly atlasTextureManager: AtlasTextureManager,
    protected readonly vertexShaderSource: string = IconShaders.vertext,
    protected readonly fragmentShaderSource: string = IconShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  public init(): void {
    super.init();
    this.setupTextures();
  }

  public link(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(this.program);
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
      // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
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
    }
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.a_positionBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.a_textcoordBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_textcoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_textcoordBuffer);
    gl.vertexAttribPointer(this.a_textcoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

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

  drawObjectGroup(objectGroup: WebGlIconBufferredGroup): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    if (!this.currentTexture || this.currentTexture !== objectGroup.atlas) {
      this.setCurrentTexture(objectGroup.atlas);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_textcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.textcoords.buffer, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
