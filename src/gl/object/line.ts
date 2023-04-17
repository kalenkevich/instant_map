import { GlProgram, GlObjectProps } from "./program";
import { v2 } from './types';

export interface GlLineProps extends GlObjectProps {
  p1: v2;
  p2: v2;
}

export class GlLine extends GlProgram {
  protected p1: v2;
  protected p2: v2;

  constructor(gl: WebGLRenderingContext, props: GlLineProps) {
    super(gl, props);

    this.p1 = props.p1;
    this.p2 = props.p2;
  }

  public get primitiveType(): GLenum {
    return this.gl.LINES;
  }

  public getBufferAttrs(): Record<string, any> {
    const p1 = this.p1;
    const p2 = this.p2;
    const p3 = [p1[0], p1[1]];
    const p4 = [p2[0], p2[1]];

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