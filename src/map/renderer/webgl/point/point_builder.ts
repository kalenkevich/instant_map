import { vec2 } from 'gl-matrix';
import { WebGlPoint, WebGlPointBufferredGroup, WebGlObjectAttributeType } from '../webgl_map_object';
import { MapTileFeatureType } from '../../../tile/tile';

export class PointGroupBuilder {
  private objects: Array<[WebGlPoint, number]> = [];
  private vertecies: number[] = [];

  addPoint(point: WebGlPoint) {
    const objectSize = verticesFromPoint(this.vertecies, point.center, point.radius, point.components);

    this.objects.push([point, objectSize]);
  }

  isEmpty(): boolean {
    return this.objects.length === 0;
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

  for (let i = 0; i <= 360; i += step) {
    result.push(center[0]);
    result.push(center[1]);

    let j1 = (i * Math.PI) / 180;
    result.push(center[0] + Math.sin(j1) * radius);
    result.push(center[1] + Math.cos(j1) * radius);

    let j2 = ((i + step) * Math.PI) / 180;
    result.push(center[0] + Math.sin(j2) * radius);
    result.push(center[1] + Math.cos(j2) * radius);
  }

  return result.length - start;
}
