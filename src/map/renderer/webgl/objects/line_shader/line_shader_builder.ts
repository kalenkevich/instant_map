import { MapFeatureType, LineMapFeature } from '../../../../tile/feature';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlShaderLineBufferredGroup } from './line';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

const getBbox = (p1: [number, number], p2: [number, number]): [number, number, number, number] => {
  const minX = Math.min(p1[0], p2[0]);
  const minY = Math.min(p1[1], p2[1]);
  const maxX = Math.max(p1[0], p2[0]);
  const maxY = Math.max(p1[1], p2[1]);

  return [minX, minY, maxX, maxY];
};

export class LineShaiderBuilder extends ObjectGroupBuilder<LineMapFeature, WebGlShaderLineBufferredGroup> {
  build(distance: number, name: string, zIndex = 0): WebGlShaderLineBufferredGroup {
    const vertecies: number[] = [];
    const prevPoint: number[] = [];
    const currPoint: number[] = [];
    const nextPoint: number[] = [];
    // angle, width, borderWidth,
    const lineProps: number[] = [];
    // fill, cap, join
    const renderStyles: number[] = [];
    const color: number[] = [];
    const borderColor: number[] = [];
    const selectionColor: number[] = [];

    for (const line of this.objects) {
      const halfWidth = (line.borderWidth + line.width) / distance / 2;
      const idAsVector4 = integerToVector4(line.id);

      for (let i = 1; i < line.vertecies.length; i++) {
        const aPoint = line.vertecies[i - 1];
        const bPoint = line.vertecies[i];
        const cPoint = i + 1 === line.vertecies.length ? line.vertecies[i] : line.vertecies[i + 1];
        const [minx, miny, maxx, maxy] = getBbox(aPoint, bPoint);

        const x1 = minx - halfWidth;
        const y1 = maxy + halfWidth;

        const x2 = maxx + halfWidth;
        const y2 = maxy + halfWidth;

        const x3 = minx - halfWidth;
        const y3 = miny - halfWidth;

        const x4 = maxx + halfWidth;
        const y4 = miny - halfWidth;

        vertecies.push(
          // first triangle
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          // second triangle
          x3,
          y3,
          x2,
          y2,
          x4,
          y4,
        );

        addXTimes(prevPoint, [aPoint[0], aPoint[1]], 6);
        addXTimes(currPoint, [bPoint[0], bPoint[1]], 6);
        addXTimes(nextPoint, [cPoint[0], cPoint[1]], 6);
        addXTimes(lineProps, [0, line.width, line.borderWidth], 6);
        addXTimes(renderStyles, [line.fill, line.cap, line.join], 6);
        addXTimes(color, [line.color[0], line.color[1], line.color[2], line.color[3]], 6);
        addXTimes(borderColor, [line.borderColor[0], line.borderColor[1], line.borderColor[2], line.borderColor[3]], 6);
        addXTimes(selectionColor, idAsVector4, 6);
      }
    }

    return {
      type: MapFeatureType.line,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      prevPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(prevPoint),
      },
      currPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(currPoint),
      },
      nextPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(nextPoint),
      },
      lineProps: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(lineProps),
      },
      renderStyles: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(renderStyles),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(color),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(borderColor),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColor),
      },
    };
  }
}
