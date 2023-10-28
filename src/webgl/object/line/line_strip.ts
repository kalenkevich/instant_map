import { GlProgram, GlProgramProps, GlProgramType, BufferAttrs } from '../program';
import { v2 } from '../../types';

export interface GlLineStripProps extends GlProgramProps {
  points: v2[];
}
/**
 * Class to render Lines using 2 triangles.
 * Check out more here: https://wwwtyro.net/2019/11/18/instanced-lines.html
 */
export class WebGlLineStrip extends GlProgram {
  type = GlProgramType.LINE_STRIP;

  protected isLine = true;

  protected points: v2[];

  protected positionBuffer: Float32Array;

  constructor(props: GlLineStripProps) {
    super(props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;

    this.positionBuffer = new Float32Array(12);
    this.positionBuffer.set([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  protected a_positionLocation = 0;
  protected point_aLocation = 1;
  protected point_bLocation = 2;
  protected setBuffers(gl: WebGLRenderingContext, buffers: BufferAttrs) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_position.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionLocation);
    gl.vertexAttribPointer(
      this.a_positionLocation,
      buffers.a_position.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.a_position.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.a_positionLocation, buffers.a_position.divisor || 0);
    }

    const pointABuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointABuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.point_a.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.point_aLocation);
    gl.vertexAttribPointer(
      this.point_aLocation,
      buffers.point_a.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.point_a.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.point_aLocation, buffers.point_a.divisor || 0);
    }

    const pointBBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.point_b.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.point_bLocation);
    gl.vertexAttribPointer(
      this.point_bLocation,
      buffers.point_b.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.point_b.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.point_bLocation, buffers.point_b.divisor || 0);
    }
  }

  public getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs {
    const pointsBuffer = new Float32Array(this.points.length * 2);

    let offset = 0;
    for (const p of this.points) {
      pointsBuffer.set(p, offset);
      offset += 2;
    }

    return {
      type: 'arrays',
      a_position: {
        numComponents: 2,
        data: this.positionBuffer,
      },
      point_a: {
        numComponents: 2,
        data: pointsBuffer,
        divisor: 1,
      },
      point_b: {
        numComponents: 2,
        data: pointsBuffer,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
        divisor: 1,
      },
      numElements: 6,
      instanceCount: this.points.length - 1,
    };
  }
}
