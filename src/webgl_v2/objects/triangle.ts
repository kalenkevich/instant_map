import { WebGl2ProgramType } from '../programs/program';
import { Vector2 } from '../types';
import {
  WebGl2Object,
  PrimitiveType,
  WebGl2ObjectAttributes,
  WebGl2ObjectDrawType,
  WebGl2ObjectDrawAttrs,
} from './object';

export interface WebGl2TriangleAttributes extends WebGl2ObjectAttributes {
  p1: Vector2;
  p2: Vector2;
  p3: Vector2;
}

export class WebGl2Triangle extends WebGl2Object<WebGl2TriangleAttributes> {
  programType = WebGl2ProgramType.default;

  protected computeDataBuffer(): number[] {
    return [...this.attributes.p1, ...this.attributes.p2, ...this.attributes.p3];
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ARRAYS,
      numElements: 3,
    };
  }
}
