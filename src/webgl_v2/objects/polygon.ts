import earcut from 'earcut';
import { BucketPointer, BufferBucket } from '../buffer/buffer_bucket';
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
  primitiveType = PrimitiveType.TRIANGLES;

  programType = WebGl2ProgramType.default;

  private numElements: number = 0;

  bufferDataToBucket(bufferBucket: BufferBucket): BucketPointer {
    const points = this.attributes.points.flatMap(p => p);
    // Magic here! This function returns the indexes of the coordinates for triangle from the source point array.
    const indexes = earcut(points);
    const data = new Array(indexes.length * 2);

    let offset = 0;
    for (const index of indexes) {
      data[offset++] = points[index * 2];
      data[offset++] = points[index * 2 + 1];
    }

    this.numElements = indexes.length;

    return bufferBucket.write(data);
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      drawType: WebGl2ObjectDrawType.ARRAYS,
      numElements: this.numElements,
    };
  }
}
