import { WebGlPointBufferredGroup } from './point';
import PointShaders from './point_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';

export class PointProgram extends ObjectProgram {
  positionBuffer: WebGlBuffer;
  propertiesBuffer: WebGlBuffer;
  colorBuffer: WebGlBuffer;
  borderColorBuffer: WebGlBuffer;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = PointShaders.vertext,
    protected readonly fragmentShaderSource: string = PointShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public async onInit(): Promise<void> {}

  onLink(): void {}

  onUnlink(): void {}

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 3 });
    this.propertiesBuffer = createWebGlBuffer(gl, { location: 1, size: 2 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 2, size: 4 });
    this.borderColorBuffer = createWebGlBuffer(this.gl, { location: 3, size: 4 });

    gl.bindVertexArray(null);
  }

  drawObjectGroup(objectGroup: WebGlPointBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.propertiesBuffer.bufferData(objectGroup.properties.buffer);
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.color.buffer,
    );
    this.borderColorBuffer.bufferData(
      options?.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.borderColor.buffer,
    );
    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
