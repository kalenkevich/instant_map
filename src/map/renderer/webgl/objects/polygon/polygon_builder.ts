import earcut from 'earcut';
import { MapFeatureType, PolygonMapFeature } from '../../../../tile/feature';
import { WebGlPolygonBufferredGroup } from './polygon';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export class PolygonGroupBuilder extends ObjectGroupBuilder<PolygonMapFeature, WebGlPolygonBufferredGroup> {
  build(name: string, zIndex = 0): WebGlPolygonBufferredGroup {
    const vertecies: number[] = [];
    const colorBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    for (const polygon of this.objects) {
      const numberOfAddedVertecies = verticesFromPolygon(vertecies, polygon.vertecies);
      const xTimes = numberOfAddedVertecies / 2;

      addXTimes(colorBuffer, [...polygon.color], xTimes);
      addXTimes(borderWidthBuffer, polygon.borderWidth, xTimes);
      addXTimes(borderColorBuffer, [...polygon.borderColor], xTimes);
      addXTimes(borderColorBuffer, integerToVector4(polygon.id), xTimes);
    }

    return {
      type: MapFeatureType.polygon,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
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

export function verticesFromPolygon(result: number[], coordinates: Array<Array<[number, number]>>): number {
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
