import { GlProgram, GlProgramProps } from './program';
import { v2 } from '../types';

export interface GlCircleProps extends GlProgramProps {
  p: v2;
  radius: number;
  components?: number;
}

export class WebGlCircle extends GlProgram {
  protected p: v2;
  protected radius: number;
  protected components: number;

  constructor(props: GlCircleProps) {
    super(props);

    this.p = props.p;
    this.radius = props.radius;
    this.components = props.components || 360;
  }

  public getPrimitiveType(gl: WebGLRenderingContext): GLenum {
    return gl.TRIANGLE_STRIP;
  }

  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, any> {
    const data = [] as number[];
    for (let i = 0; i <= 360; i += 360 / this.components) {
      let j = (i * Math.PI) / 180;

      data.push(this.p[0] + Math.sin(j) * this.radius, this.p[1] + Math.cos(j) * this.radius, this.p[0], this.p[1]);
    }

    return {
      a_position: {
        numComponents: 2,
        data,
      },
    };
  }
}
