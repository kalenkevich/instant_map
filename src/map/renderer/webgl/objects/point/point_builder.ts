import { MapFeatureType, PointMapFeature } from '../../../../tile/feature';
import { WebGlPointBufferredGroup } from './point';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export class PointGroupBuilder extends ObjectGroupBuilder<PointMapFeature, WebGlPointBufferredGroup> {
  build(name: string, zIndex = 0): WebGlPointBufferredGroup {
    const vertecies: number[] = [];
    const colorBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    const propertiesBuffer: number[] = [];

    for (const point of this.objects) {
      const colorId = integerToVector4(point.id);
      const [x1, y1] = point.center;

      vertecies.push(
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_RIGHT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_RIGHT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
      );
      addXTimes(propertiesBuffer, [point.radius, point.borderWidth], 6);
      addXTimes(colorBuffer, point.color, 6);
      addXTimes(borderWidthBuffer, point.borderWidth, 6);
      addXTimes(borderColorBuffer, point.borderColor, 6);
      addXTimes(selectionColorBuffer, colorId, 6);
    }

    return {
      type: MapFeatureType.point,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 3,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      properties: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(propertiesBuffer),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
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
  center: [number, number],
  radius = 0.0001,
  components = 32,
): number {
  const start = result.length;
  const step = 360 / components;
  const [x, y] = center;

  for (let i = 0; i <= 360; i += step) {
    result.push(x);
    result.push(y);

    const j1 = (i * Math.PI) / 180;
    result.push(x + Math.sin(j1) * radius);
    result.push(y + Math.cos(j1) * radius);

    const j2 = ((i + step) * Math.PI) / 180;
    result.push(x + Math.sin(j2) * radius);
    result.push(y + Math.cos(j2) * radius);
  }

  return result.length - start;
}
