import { BucketPointer, BufferBucket } from '../buffer/buffer_bucket';
import { WebGl2ProgramDefaultUniforms, ProgramObjectType } from '../programs/default/default_program';
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
  center: Vector2;
  radius: number;
  components?: number; // default 32
}

export class WebGl2Circle extends WebGl2Object<WebGl2CircleAttributes> {
  primitiveType = PrimitiveType.TRIANGLE_STRIP;
  programType = WebGl2ProgramType.default;
  drawType = WebGl2ObjectDrawType.ARRAYS;

  getUniforms(): WebGl2ProgramDefaultUniforms {
    return {
      ...super.getUniforms(),
      u_object_type: ProgramObjectType.CIRCLE,
    };
  }

  bufferDataToBucket(bufferBucket: BufferBucket): BucketPointer {
    const { center, radius, components } = this.attributes;
    const step = 360 / components;
    const size = (components + 1) * 4;

    const data = new Array(size);
    let offset = 0;
    for (let i = 0; i <= 360; i += step) {
      let j = (i * Math.PI) / 180;

      data[offset++] = center[0] + Math.sin(j) * radius;
      data[offset++] = center[1] + Math.cos(j) * radius;
      data[offset++] = center[0];
      data[offset++] = center[1];
    }

    return bufferBucket.writeAndCommit(data);
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      numElements: this.attributes.components * 2 + 2,
    };
  }
}
