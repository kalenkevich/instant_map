import { vec2 } from 'gl-matrix';
import { MapFeatureType, PointMapFeature } from '../../../../tile/feature';
import { WebGlPointBufferredGroup } from './point';
import { WebGlObjectAttributeType } from '../object/object';
import { SceneCamera } from '../../../renderer';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export class PointGroupBuilder extends ObjectGroupBuilder<PointMapFeature, WebGlPointBufferredGroup> {
  build(camera: SceneCamera, name: string, zIndex = 0): WebGlPointBufferredGroup {
    const vertecies: number[] = [];
    const borderVertecies: number[] = [];
    const colorBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    for (const point of this.objects) {
      const scaledRadius = this.scalarScale(point.radius, camera.distance);
      const scaledBorderWidth = this.scalarScale(point.borderWidth, camera.distance);
      const numberOfAddedVertecies = verticesFromPoint(vertecies, point.center, scaledRadius, point.components);
      const xTimes = numberOfAddedVertecies / 2;

      verticesFromPoint(borderVertecies, point.center, scaledRadius + scaledBorderWidth, point.components);
      addXTimes(colorBuffer, [...point.color], xTimes);
      addXTimes(borderWidthBuffer, point.borderWidth, xTimes);
      addXTimes(borderColorBuffer, [...point.borderColor], xTimes);
      addXTimes(selectionColorBuffer, integerToVector4(point.id), xTimes);
    }

    return {
      type: MapFeatureType.point,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      borderVertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(borderVertecies),
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
