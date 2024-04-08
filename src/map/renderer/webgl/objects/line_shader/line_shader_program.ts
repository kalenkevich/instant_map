import { WebGlShaderLineBufferredGroup } from './line';
import ShaderLineShaders from './line_shader_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';

export class LineShaderProgram extends ObjectProgram {
  protected vertecies: WebGlBuffer;
  protected prevPoint: WebGlBuffer;
  protected currPoint: WebGlBuffer;
  protected nextPoint: WebGlBuffer;
  protected properties: WebGlBuffer;
  protected renderStyles: WebGlBuffer;
  protected color: WebGlBuffer;
  protected borderColor: WebGlBuffer;

  protected u_renderType: WebGLUniformLocation;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = ShaderLineShaders.vertext,
    protected readonly fragmentShaderSource: string = ShaderLineShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer(): void {
    const gl = this.gl;

    this.gl.bindVertexArray(this.vao);

    this.vertecies = createWebGlBuffer(gl, { location: 0, size: 3 });
    this.prevPoint = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.currPoint = createWebGlBuffer(gl, { location: 2, size: 2 });
    this.nextPoint = createWebGlBuffer(gl, { location: 3, size: 2 });
    this.properties = createWebGlBuffer(gl, { location: 4, size: 2 });
    this.renderStyles = createWebGlBuffer(gl, { location: 5, size: 3 });
    this.color = createWebGlBuffer(gl, { location: 6, size: 4 });
    this.borderColor = createWebGlBuffer(gl, { location: 7, size: 4 });

    this.gl.bindVertexArray(null);
  }

  public async onInit(): Promise<void> {}

  public onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public onUnlink() {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_renderType = this.gl.getUniformLocation(this.program, 'u_renderType');
  }

  drawObjectGroup(lineGroup: WebGlShaderLineBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.vertecies.bufferData(lineGroup.vertecies.buffer);
    this.prevPoint.bufferData(lineGroup.prevPoint.buffer);
    this.currPoint.bufferData(lineGroup.currPoint.buffer);
    this.nextPoint.bufferData(lineGroup.nextPoint.buffer);
    this.properties.bufferData(lineGroup.properties.buffer);
    this.renderStyles.bufferData(lineGroup.renderStyles.buffer);
    this.color.bufferData(options?.readPixelRenderMode ? lineGroup.selectionColor.buffer : lineGroup.color.buffer);
    this.borderColor.bufferData(
      options?.readPixelRenderMode ? lineGroup.selectionColor.buffer : lineGroup.borderColor.buffer,
    );

    // draw line
    gl.uniform1f(this.u_renderType, 0);
    gl.drawArrays(gl.TRIANGLES, 0, lineGroup.numElements);

    gl.bindVertexArray(null);
  }
}
