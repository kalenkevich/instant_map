import { ObjectProgram } from '../objects/object/object_program';
import FramebufferShareds from './framebuffer_shaders';
import { ExtendedWebGLRenderingContext } from '../webgl_context';
import { MapFeatureFlags } from '../../../flags';
import { WebGlTexture } from '../helpers/weblg_texture';
import { WebGlBuffer, createWebGlBuffer } from '../helpers/webgl_buffer';

const POSITION_DATA = new Float32Array([-1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1, -1]);
const TEXTURE_DATA = new Float32Array([0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1]);

export class FramebufferProgram extends ObjectProgram {
  protected positionBuffer: WebGlBuffer;
  protected textcoordBuffer: WebGlBuffer;

  protected u_textureLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = FramebufferShareds.vertext,
    protected readonly fragmentShaderSource: string = FramebufferShareds.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
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

  public async onInit(): Promise<void> {}

  onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
  }

  onUnlink(): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  drawObjectGroup(): void {}

  draw(texture: WebGlTexture) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    texture.bind();
    this.gl.uniform1i(this.u_textureLocation, texture.index);
    this.positionBuffer.bufferData(POSITION_DATA);
    this.textcoordBuffer.bufferData(TEXTURE_DATA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    texture.unbind();

    gl.bindVertexArray(null);
  }
}
