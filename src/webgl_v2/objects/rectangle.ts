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

export interface WebGl2Rectanglettributes extends WebGl2ObjectAttributes {
  p: Vector2;
  width: number;
  height: number;
}

export class WebGl2Rectangle extends WebGl2Object<WebGl2Rectanglettributes> {
  primitiveType = PrimitiveType.TRIANGLES;

  programType = WebGl2ProgramType.default;

  drawType = WebGl2ObjectDrawType.ARRAYS;

  bufferDataToBucket(bufferBucket: BufferBucket): BucketPointer {
    const p1 = this.attributes.p;
    const p2 = [p1[0] + this.attributes.width, p1[1]];
    const p3 = [p1[0], p1[1] + this.attributes.height];
    const p4 = [p1[0] + this.attributes.width, p1[1] + this.attributes.height];

    return bufferBucket.writeAndCommit([...p1, ...p2, ...p3, ...p4]);
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      numElements: 6,
    };
  }
}
