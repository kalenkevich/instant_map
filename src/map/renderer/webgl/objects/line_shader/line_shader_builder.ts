import { MapFeatureType, LineMapFeature } from '../../../../tile/feature';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, ObjectGroupBuilderOptions, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { WebGlShaderLineBufferredGroup } from './line';
import { toSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export const getLineFeatureGroups: ObjectGroupBuilder<LineMapFeature, WebGlShaderLineBufferredGroup> = (
  objects: LineMapFeature[],
  name: string,
  zIndex = 0,
  options: ObjectGroupBuilderOptions,
) => {
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

  for (const line of objects) {
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
      addXTimes(properties, [line.width * options.devicePixelRatio, line.borderWidth * options.devicePixelRatio], 6);
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
        buffer: toSharedArrayBuffer(vertecies),
      },
      prevPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: toSharedArrayBuffer(prevPoint),
      },
      currPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: toSharedArrayBuffer(currPoint),
      },
      nextPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: toSharedArrayBuffer(nextPoint),
      },
      properties: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: toSharedArrayBuffer(properties),
      },
      renderStyles: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: toSharedArrayBuffer(renderStyles),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(color),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(borderColor),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: toSharedArrayBuffer(selectionColor),
      },
    },
  ];
};
