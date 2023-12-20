import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlPoint, WebGlPointBufferredGroup } from './point';
import { MapTileFeatureType } from '../../../tile/tile';

export class PointGroupBuilder extends ObjectGroupBuilder<WebGlPoint> {
  addObject(point: WebGlPoint) {
    const objectSize = verticesFromPoint(
      this.vertecies,
      this.projection.fromLngLat([point.center[0], point.center[1]]),
      point.radius,
      point.components
    );

    this.objects.push([point, objectSize]);
  }

  build(): WebGlPointBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const verteciesBuffer = new Float32Array(this.vertecies);

    const colorBuffer = new Float32Array(numElements * 4);
    let colorBufferOffset = 0;
    const borderWidthBuffer = new Float32Array(numElements);
    let borderWidthBufferOffset = 0;
    const borderColorBuffer = new Float32Array(numElements * 4);
    let borderColorBufferOffset = 0;

    let currentObjectIndex = 0;
    let currentObject: WebGlPoint = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.set(currentObject.color, colorBufferOffset);
      colorBufferOffset += 4;

      borderWidthBuffer.set([currentObject.borderWidth], i);
      borderWidthBufferOffset += 1;

      borderColorBuffer.set(currentObject.borderColor, borderColorBufferOffset);
      borderColorBufferOffset += 4;
    }

    return {
      type: MapTileFeatureType.point,
      size: this.objects.length,
      numElements,
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: colorBuffer,
      },
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: verteciesBuffer,
      },
      borderWidth: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: borderWidthBuffer,
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: borderColorBuffer,
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
