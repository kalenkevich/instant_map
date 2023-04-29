import { GlProgram, GlProgramProps } from "./program";
import { v2 } from '../types';

export interface GlCircleProps extends GlProgramProps {
  p: v2;
  radius: number;
  components?: number;
}

export class GlCircle extends GlProgram {
  protected p: v2;
  protected radius: number;
  protected components: number;

  constructor(gl: WebGLRenderingContext, props: GlCircleProps) {
    super(gl, props);

    this.p = props.p;
    this.radius = props.radius;
    this.components = props.components || 360;
  }

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLE_STRIP;
  }

  public getBufferAttrs(...args: any[]): Record<string, any> {
    const data = [] as number[];
    for (let i = 0; i <= 360; i += 360 / this.components) {
      let j = i * Math.PI / 180;
      
      data.push(
        Math.sin(j) * this.radius,
        Math.cos(j) * this.radius,
        this.p[0],
        this.p[1],
      );
    }

    return {
      a_position: {
        numComponents: 2,
        data,
      },
    };
  }
}