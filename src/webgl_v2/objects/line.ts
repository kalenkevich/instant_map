import { BufferBucket, BucketPointer } from '../buffer/buffer_bucket';
import { WebGl2ProgramType } from '../programs/program';
import { WebGl2ProgramDefaultUniforms } from '../programs/default/default_program';
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

const POSITION_BUFFER = [0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5];

export class WebGl2Line extends WebGl2Object<WebGl2LineAttributes> {
  primitiveType = PrimitiveType.TRIANGLES;

  programType = WebGl2ProgramType.default;

  drawType = WebGl2ObjectDrawType.ARRAYS_INSTANCED;

  getUniforms(): WebGl2ProgramDefaultUniforms {
    return {
      ...super.getUniforms(),
      // u_line_width: this.attributes.lineWidth,
    };
  }

  bufferDataToBucket(bufferBucket: BufferBucket): BucketPointer {
    throw new Error('Method not implemented.');
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      numElements: 6,
      instanceCount: this.attributes.points.length - 1,
    };
  }
}
