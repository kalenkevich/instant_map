import { WebGl2ProgramType } from '../programs/program';
import { WebGl2ProgramLineUniforms } from '../programs/line/line_program';
import { Vector2 } from '../types';
import {
  PrimitiveType,
  WebGl2Object,
  WebGl2ObjectDrawAttrs,
  WebGl2ObjectDrawType,
  WebGl2ObjectAttributes,
} from './object';

export interface WebGl2LineAttributes extends WebGl2ObjectAttributes {
  points: Vector2[];
  lineWidth: number;
}

export class WebGl2Line extends WebGl2Object<WebGl2LineAttributes> {
  programType = WebGl2ProgramType.line;

  getUniforms(): WebGl2ProgramLineUniforms {
    return {
      ...super.getUniforms(),
      u_line_width: this.attributes.lineWidth,
    };
  }

  getIndexBuffer(): Uint16Array | undefined {
    return undefined;
  }

  getDataBuffer(): Float32Array {
    return new Float32Array(this.attributes.points.flatMap(p => p));
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ARRAYS_INSTANCED,
      numElements: 6,
      instanceCount: this.attributes.points.length - 1,
    };
  }
}
