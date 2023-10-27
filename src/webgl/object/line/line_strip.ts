import { GlProgram, GlProgramProps, GlProgramType, ProgramCache, GlUniforms } from '../program';
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

  protected segmentInstanceGeometry = [
    [0, -0.5],
    [1, -0.5],
    [1, 0.5],
    [0, -0.5],
    [1, 0.5],
    [0, 0.5],
  ];

  constructor(props: GlLineStripProps) {
    super(props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  public getBufferAttrs(): Record<string, any> {
    const points = this.points.flatMap(p => p);

    return {
      a_position: {
        numComponents: 2,
        data: this.segmentInstanceGeometry.flatMap(p => p),
        divisor: 0,
      },
      point_a: {
        numComponents: 2,
        data: points,
        divisor: 1,
      },
      point_b: {
        numComponents: 2,
        data: points,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
    };
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number } {
    return {
      offset: 0, // offset
      vertexCount: this.segmentInstanceGeometry.length, // num vertices per instance
      instanceCount: this.points.length - 1, // num instances
    };
  }
}
