import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlRectangleProps extends GlObjectProps {
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
    const p1 = this.p;
    const p2 = [p1[0] + this.width, p1[1]];
    const p3 = [p1[0], p1[1] + this.height];
    const p4 = [p1[0] + this.width, p1[1] + this.height];

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