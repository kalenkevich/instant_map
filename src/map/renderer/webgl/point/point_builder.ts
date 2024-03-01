import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlPoint, WebGlPointBufferredGroup } from './point';
import { MapTileFeatureType } from '../../../tile/tile';
import { createdSharedArrayBuffer } from '../utils/array_buffer';
import { integerToVector4 } from '../utils/number2vec';

export class PointGroupBuilder extends ObjectGroupBuilder<WebGlPoint> {
  addObject(point: WebGlPoint) {
    const objectSize = verticesFromPoint(
      this.vertecies,
      this.projection.fromLngLat([point.center[0], point.center[1]]),
      this.scalarScale(point.radius),
      point.components
    );

    this.objects.push([point, objectSize]);
  }

  build(): WebGlPointBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const colorBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    let currentObjectIndex = 0;
    let currentObject: WebGlPoint = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.push(...currentObject.color);
      borderWidthBuffer.push(currentObject.borderWidth);
      borderColorBuffer.push(...currentObject.borderColor);
      selectionColorBuffer.push(...integerToVector4(currentObject.id));
    }

    return {
      type: MapTileFeatureType.point,
      size: this.objects.length,
      numElements,
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
      },
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(this.vertecies),
      },
      borderWidth: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: createdSharedArrayBuffer(borderWidthBuffer),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(borderColorBuffer),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColorBuffer),
      },
    };
  }
}

export function verticesFromPoint(
  result: number[],
  center: vec2 | [number, number],
  radius = 0.0001,
  components = 32
): number {
  const start = result.length;
  const step = 360 / components;
  const [x, y] = center;

  for (let i = 0; i <= 360; i += step) {
    result.push(x);
    result.push(y);

    let j1 = (i * Math.PI) / 180;
    result.push(x + Math.sin(j1) * radius);
    result.push(y + Math.cos(j1) * radius);

    let j2 = ((i + step) * Math.PI) / 180;
    result.push(x + Math.sin(j2) * radius);
    result.push(y + Math.cos(j2) * radius);
  }

  return result.length - start;
}
