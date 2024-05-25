import { WebGlPolygonBufferredGroup } from './polygon';
import PolygonShaders from './polygon_shaders';
import { ObjectProgram, DrawObjectGroupOptions } from '../object/object_program';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { MapFeatureFlags } from '../../../../flags';

export class PolygonProgram extends ObjectProgram {
  protected positionBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = PolygonShaders.vertext,
    protected readonly fragmentShaderSource: string = PolygonShaders.fragment,
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  onLink(): void {
    // const gl = this.gl;
    // gl.enable(gl.CULL_FACE);
    // gl.enable(gl.DEPTH_TEST);
  }

  onUnlink(): void {
    // const gl = this.gl;
    // gl.disable(gl.CULL_FACE);
    // gl.disable(gl.DEPTH_TEST);
  }

  protected setupBuffers(): void {
    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 3 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 1, size: 4 });
  }

  drawObjectGroup(objectGroup: WebGlPolygonBufferredGroup, options?: DrawObjectGroupOptions) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(objectGroup.vertecies.buffer);
    this.colorBuffer.bufferData(
      options?.readPixelRenderMode ? objectGroup.selectionColor.buffer : objectGroup.color.buffer,
    );

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
