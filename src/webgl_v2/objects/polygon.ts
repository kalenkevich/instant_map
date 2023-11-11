import earcut from 'earcut';
import { WebGl2ProgramType } from '../programs/program';
import { Vector2 } from '../types';
import {
  WebGl2Object,
  PrimitiveType,
  WebGl2ObjectAttributes,
  WebGl2ObjectDrawType,
  WebGl2ObjectDrawAttrs,
} from './object';

export interface WebGl2CircleAttributes extends WebGl2ObjectAttributes {
  points: Vector2[];
}

export class WebGl2Polygon extends WebGl2Object<WebGl2CircleAttributes> {
  programType = WebGl2ProgramType.polygon;

  private numElements: number = 0;

  private flatPoints: number[] = [];

  getIndexBuffer(): Uint16Array {
    const indexes = earcut(this.flatPoints);
    this.numElements = indexes.length;

    return new Uint16Array(indexes);
  }

  protected computeDataBuffer(): number[] {
    return (this.flatPoints = this.attributes.points.flatMap(p => p));
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ELEMENTS,
      numElements: this.numElements,
    };
  }
}
