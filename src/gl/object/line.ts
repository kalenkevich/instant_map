import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlLineProps extends GlObjectProps {
  p1: v2;
  p2: v2;
  width: number;
}

export class GlLine extends GlProgram {
  protected p1: v2;
  protected p2: v2;
  protected width: number;

  constructor(gl: WebGLRenderingContext, props: GlLineProps) {
    super(gl, props);

    this.p1 = props.p1;
    this.p2 = props.p2;
    this.width = props.width;
  }

  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 position;
      uniform vec2 resolution;
      
      void main() {
         vec2 zeroToOne = position / resolution;
         vec2 zeroToTwo = zeroToOne * 2.0;
         vec2 clipSpace = zeroToTwo - 1.0;
         gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;
  }

  public getBufferAttrs(): Record<string, any> {
    const p1 = this.p1;
    const p2 = this.p2;
    const p3 = [p1[0] + this.width, p1[1]];
    const p4 = [p2[0] + this.width, p2[1]];

    return {
      position: {
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