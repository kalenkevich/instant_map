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

export interface WebGl2TriangleAttributes extends WebGl2ObjectAttributes {
  p1: Vector2;
  p2: Vector2;
  p3: Vector2;
}

export class WebGl2Triangle extends WebGl2Object<WebGl2TriangleAttributes> {
  primitiveType = PrimitiveType.TRIANGLES;

  programType = WebGl2ProgramType.default;

  drawType = WebGl2ObjectDrawType.ARRAYS;

  bufferDataToBucket(bufferBucket: BufferBucket): BucketPointer {
    return bufferBucket.writeAndCommit([...this.attributes.p1, ...this.attributes.p2, ...this.attributes.p3]);
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      numElements: 3,
    };
  }
}
