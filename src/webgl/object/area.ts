import earcut from 'earcut';
import { GlProgram, GlProgramProps, GlProgramType } from './program';
import { v2 } from '../types';

export interface GlAreaPorps extends GlProgramProps {
  points: v2[];
}

export class WebGlArea extends GlProgram {
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

  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, any> {
    const points = this.points.flatMap(p => p);
    // Magic here! This function returns the indexes of the coordinates for triangle from the source point array.
    const indexes = earcut(points);
    const data = [];

    for (const index of indexes) {
      data.push(points[index * 2], points[index * 2 + 1]);
    }

    return {
      a_position: {
        numComponents: 2,
        data: data,
      },
    };
  }
}
