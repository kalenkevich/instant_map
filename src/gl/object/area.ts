import { ProgramInfo } from "twgl.js";
import { GlProgram, GlProgramProps } from "./program";
import { v2 } from '../types';

export interface GlAreaPorps extends GlProgramProps {
  points: v2[];
}

export class GlArea extends GlProgram {
  protected points: v2[];

  constructor(gl: WebGLRenderingContext, props: GlAreaPorps) {
    super(gl, props);
    this.points = props.points;
  }

  public getBufferAttrs(): Record<string, any> {
    const data = [];
    const n = this.points.length;

    for (let i = 1; i < n; i++) {
      data.push(
        this.points[i - 1],
        this.points[i],
        this.points[n - 1],
      );
    }

    return {
      a_position: {
        numComponents: 2,
        data: data.flatMap(p => p),
      },
    };
  }
}