import earcut from 'earcut';
import { GlProgram, GlProgramProps, GlProgramType, BufferAttrs } from './program';
import { v2 } from '../types';

export interface GlAreaPorps extends GlProgramProps {
  points: v2[];
}

export class WebGlArea extends GlProgram {
  type = GlProgramType.AREA;

  protected points: v2[];

  constructor(props: GlAreaPorps) {
    super(props);
    this.points = props.points;
  }

  public getType(): GlProgramType {
    return GlProgramType.AREA;
  }

  getPoints(): v2[] {
    return this.points;
  }

  setPoints(points: v2[]) {
    this.points = points;
  }

  public getBufferAttrs(gl: WebGLRenderingContext) {
    const points = this.points.flatMap(p => p);
    // Magic here! This function returns the indexes of the coordinates for triangle from the source point array.
    const indexes = earcut(points);
    const data = new Float32Array(indexes.length * 2);

    let offset = 0;
    for (const index of indexes) {
      data.set([points[index * 2], points[index * 2 + 1]], offset);
      offset += 2;
    }

    return {
      a_position: {
        numComponents: 2,
        data: data,
      },
    };
  }

  public supportV2Draw: boolean = true;
  public getBufferAttrsV2(gl: WebGLRenderingContext): BufferAttrs {
    const points = this.points.flatMap(p => p);
    // Magic here! This function returns the indexes of the coordinates for triangle from the source point array.
    const indexes = earcut(points);
    const data = new Float32Array(indexes.length * 2);

    let offset = 0;
    for (const index of indexes) {
      data.set([points[index * 2], points[index * 2 + 1]], offset);
      offset += 2;
    }

    return {
      type: 'arrays',
      a_position: {
        numComponents: 2,
        data: data,
      },
      numElements: indexes.length,
    };
  }
}
