import { MapFeatureType, LineMapFeature } from '../../../../tile/feature';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { WebGlShaderLineBufferredGroup } from './line';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export class LineShaiderBuilder extends ObjectGroupBuilder<LineMapFeature, WebGlShaderLineBufferredGroup> {
  build(name: string, zIndex = 0): WebGlShaderLineBufferredGroup[] {
    const vertecies: number[] = [];
    const prevPoint: number[] = [];
    const currPoint: number[] = [];
    const nextPoint: number[] = [];
    // lineWidth, borderWidth
    const properties: number[] = [];
    // fill, cap, join
    const renderStyles: number[] = [];
    const color: number[] = [];
    const borderColor: number[] = [];
    const selectionColor: number[] = [];

    for (const line of this.objects) {
      const idAsVector4 = integerToVector4(line.id);

      for (let i = 1; i < line.vertecies.length; i++) {
        const aPoint = line.vertecies[i - 1];
        const bPoint = line.vertecies[i];
        const cPoint = i + 1 === line.vertecies.length ? line.vertecies[i] : line.vertecies[i + 1];

        vertecies.push(
          0,
          0,
          VERTEX_QUAD_POSITION.TOP_LEFT,
          0,
          0,
          VERTEX_QUAD_POSITION.TOP_RIGHT,
          0,
          0,
          VERTEX_QUAD_POSITION.BOTTOM_LEFT,
          0,
          0,
          VERTEX_QUAD_POSITION.BOTTOM_LEFT,
          0,
          0,
          VERTEX_QUAD_POSITION.TOP_RIGHT,
          0,
          0,
          VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
        );

        addXTimes(prevPoint, [aPoint[0], aPoint[1]], 6);
        addXTimes(currPoint, [bPoint[0], bPoint[1]], 6);
        addXTimes(nextPoint, [cPoint[0], cPoint[1]], 6);
        addXTimes(properties, [line.width, line.borderWidth], 6);
        addXTimes(renderStyles, [line.fill, line.cap, line.join], 6);
        addXTimes(color, line.color, 6);
        addXTimes(borderColor, line.borderColor, 6);
        addXTimes(selectionColor, idAsVector4, 6);
      }
    }

    return [
      {
        type: MapFeatureType.line,
        name,
        zIndex,
        numElements: vertecies.length / 3,
        vertecies: {
          type: WebGlObjectAttributeType.FLOAT,
          size: 3,
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
        properties: {
          type: WebGlObjectAttributeType.FLOAT,
          size: 2,
          buffer: createdSharedArrayBuffer(properties),
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
      },
    ];
  }
}
