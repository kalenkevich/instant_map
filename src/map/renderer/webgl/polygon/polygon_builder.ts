import { vec2 } from 'gl-matrix';
import earcut from 'earcut';
import { WebGlPolygon, WebGlObjectAttributeType, WebGlPolygonBufferredGroup } from '../webgl_map_object';
import { MapTileFeatureType } from '../../../tile/tile';

export class PolygonGroupBuilder {
  private objects: Array<[WebGlPolygon, number]> = [];
  private vertecies: number[] = [];

  addPolygon(polygon: WebGlPolygon) {
    const objectSize = verticesFromPolygon(this.vertecies, polygon.vertecies);

    this.objects.push([polygon, objectSize]);
  }

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  build(): WebGlPolygonBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const verteciesBuffer = new Float32Array(this.vertecies);

    const colorBuffer = new Float32Array(numElements * 4);
    let colorBufferOffset = 0;
    const borderWidthBuffer = new Float32Array(numElements);
    let borderWidthBufferOffset = 0;
    const borderColorBuffer = new Float32Array(numElements * 4);
    let borderColorBufferOffset = 0;

    let currentObjectIndex = 0;
    let currentObject: WebGlPolygon = this.objects[currentObjectIndex][0];
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
      type: MapTileFeatureType.polygon,
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

export function verticesFromPolygon(result: number[], coordinates: Array<Array<vec2>>): number {
  const start = result.length;
  const data = earcut.flatten(coordinates);
  const triangles = earcut(data.vertices, data.holes, 2);

  for (let i = 0; i < triangles.length; i++) {
    const point = triangles[i];
    result.push(data.vertices[point * 2]);
    result.push(data.vertices[point * 2 + 1]);
  }

  return result.length - start;
}
