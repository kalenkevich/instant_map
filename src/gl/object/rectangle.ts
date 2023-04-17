import { GlProgram, GlProgramProps } from "./program";
import { v2 } from './types';

export interface GlRectangleProps extends GlProgramProps {
  p: v2;
  width: number;
  height: number;
}

export class GlRectangle extends GlProgram {
  protected p: v2;
  protected width: number;
  protected height: number;

  constructor(gl: WebGLRenderingContext, props: GlRectangleProps) {
    super(gl, props);

    this.p = props.p;
    this.width = props.width;
    this.height = props.height;
  }

  public getBufferAttrs(): Record<string, any> {
    const p1 = this.p;
    const p2 = [p1[0] + this.width, p1[1]];
    const p3 = [p1[0], p1[1] + this.height];
    const p4 = [p1[0] + this.width, p1[1] + this.height];

    return {
      a_position: {
        numComponents: 2,
        data: [
          ...p1,
          ...p2,
          ...p3,
          ...p3,
          ...p2,
          ...p4,
        ],
      },
    };
  }
}