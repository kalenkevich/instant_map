import earcut from 'earcut';
import { MapFeatureType, PolygonMapFeature } from '../../../../tile/feature';
import { WebGlPolygonBufferredGroup } from './polygon';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { toSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export const getPolygonFeatureGroups: ObjectGroupBuilder<PolygonMapFeature, WebGlPolygonBufferredGroup> = (
  objects: PolygonMapFeature[],
  name: string,
  zIndex = 0,
) => {
  const vertecies: number[] = [];
  const colorBuffer: number[] = [];
  const borderWidthBuffer: number[] = [];
  const borderColorBuffer: number[] = [];
  const selectionColorBuffer: number[] = [];

  for (const polygon of objects) {
    const numberOfAddedVertecies = verticesFromPolygon(vertecies, polygon.vertecies);
    const xTimes = numberOfAddedVertecies / 2;
    const polygonId = integerToVector4(polygon.id);

    addXTimes(colorBuffer, [...polygon.color], xTimes);
    addXTimes(borderWidthBuffer, polygon.borderWidth, xTimes);
    addXTimes(borderColorBuffer, [...polygon.borderColor], xTimes);
    addXTimes(borderColorBuffer, polygonId, xTimes);
  }

  return [
    {
      type: MapFeatureType.polygon,
      name,
      zIndex,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: toSharedArrayBuffer(vertecies),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(colorBuffer),
      },
      borderWidth: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: toSharedArrayBuffer(borderWidthBuffer),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(borderColorBuffer),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(selectionColorBuffer),
      },
    },
  ];
};

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
