import { GlProgram, GlProgramProps, GlProgramType, BufferAttrs } from './program';
import { v2 } from '../types';

export interface GlCircleProps extends GlProgramProps {
  p: v2;
  radius: number;
  components?: number;
}

export class WebGlCircle extends GlProgram {
  type = GlProgramType.CIRCLE;

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

  public getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs {
    const step = 360 / this.components;

    const data = new Float32Array((this.components + 1) * 4);
    let offset = 0;

    for (let i = 0; i <= 360; i += step) {
      let j = (i * Math.PI) / 180;

      data.set(
        [this.p[0] + Math.sin(j) * this.radius, this.p[1] + Math.cos(j) * this.radius, this.p[0], this.p[1]],
        offset
      );
      offset += 4;
    }

    return {
      type: 'arrays',
      a_position: {
        numComponents: 2,
        data,
      },
      numElements: this.components * 2 + 2,
    };
  }
}
