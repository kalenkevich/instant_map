import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlPathProps extends GlObjectProps {
  points: v2[];
}

export class GlPath extends GlProgram {
  protected points: v2[];
  protected width: number;

  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.points = props.points;
  }

  public get primitiveType(): GLenum {
    return this.gl.LINES;
  }

  public getBufferAttrs(): Record<string, any> {
    const points = [];

    for (let i = 1; i < this.points.length; i++) {
      points.push(this.points[i - 1]);
      points.push(this.points[i]);
    }

    return {
      a_position: {
        numComponents: 2,
        data: points.flatMap(p => p),
      },
    };
  }
}
