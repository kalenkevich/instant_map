import { vec2 } from 'gl-matrix';
import earcut from 'earcut';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlPolygon, WebGlPolygonBufferredGroup } from './polygon';
import { MapTileFeatureType } from '../../../../tile/tile';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';

export class PolygonGroupBuilder extends ObjectGroupBuilder<WebGlPolygon> {
  addObject(polygon: WebGlPolygon) {
    const objectSize = verticesFromPolygon(this.vertecies, polygon.vertecies);

    this.objects.push([polygon, objectSize]);
  }

  build(): WebGlPolygonBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const colorBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    let currentObjectIndex = 0;
    let currentObject: WebGlPolygon = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.push(...(currentObject.color || [0, 0, 0, 1]));
      borderWidthBuffer.push(currentObject.borderWidth);
      borderColorBuffer.push(...currentObject.borderColor);
      selectionColorBuffer.push(...integerToVector4(currentObject.id));
    }

    return {
      type: MapTileFeatureType.polygon,
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
