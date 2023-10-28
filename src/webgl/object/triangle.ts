import { BufferAttrs, GlProgram, GlProgramProps, GlProgramType } from './program';
import { v2 } from '../types';

export interface GlTriangleProps extends GlProgramProps {
  p1: v2;
  p2: v2;
  p3: v2;
}

export class WebGlTriangle extends GlProgram {
  type = GlProgramType.TRIANGLE;

  protected p1: v2;
  protected p2: v2;
  protected p3: v2;

  private buffer: Float32Array;

  constructor(props: GlTriangleProps) {
    super(props);

    this.p1 = props.p1;
    this.p2 = props.p2;
    this.p3 = props.p3;

    this.buffer = new Float32Array(6);
    this.buffer.set(this.p1, 0);
    this.buffer.set(this.p2, 2);
    this.buffer.set(this.p3, 4);
  }

  public getBufferAttrs() {
    return {
      a_position: {
        numComponents: 2,
        data: [...this.p1, ...this.p2, ...this.p3],
      },
    };
  }

  public supportV2Draw = true;
  public getBufferAttrsV2(): BufferAttrs {
    return {
      type: 'arrays',
      a_position: {
        numComponents: 2,
        data: this.buffer,
      },
      numElements: 6,
    };
  }
}
