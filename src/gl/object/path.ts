import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlPathProps extends GlObjectProps {
  points: v2[];
  width: number;
}

export class GlPath extends GlProgram {
  protected points: v2[];
  protected width: number;

  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.points = props.points;
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

  public get primitiveType(): GLenum {
    return this.gl.LINES;
  }

  public getBufferAttrs(): Record<string, any> {
    return {
      position: {
        numComponents: 2,
        data: this.points.flatMap(p => p),
      },
    };
  }
}
