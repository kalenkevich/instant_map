import { vec2 } from 'gl-matrix';
import { MapFeatureType, LineMapFeature, LineJoinStyle } from '../../../../tile/feature';
import { WebGlLineBufferredGroup } from './line';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

const LINE_POSITION: Array<[number, number]> = [
  [0, -0.5],
  [1, -0.5],
  [1, 0.5],
  [0, -0.5],
  [1, 0.5],
  [0, 0.5],
];

const ROUND_JOIN_POSITION: Array<[number, number]> = [
  [0, 0],
  [0.5, 0],
  [0.4619397521018982, 0.19134171307086945],
  [0, 0],
  [0.4619397521018982, 0.19134171307086945],
  [0.3535533845424652, 0.3535533845424652],
  [0, 0],
  [0.3535533845424652, 0.3535533845424652],
  [0.19134171307086945, 0.4619397521018982],
  [0, 0],
  [0.19134171307086945, 0.4619397521018982],
  [3.0616171314629196e-17, 0.5],
  [0, 0],
  [3.0616171314629196e-17, 0.5],
  [-0.19134171307086945, 0.4619397521018982],
  [0, 0],
  [-0.19134171307086945, 0.4619397521018982],
  [-0.3535533845424652, 0.3535533845424652],
  [0, 0],
  [-0.3535533845424652, 0.3535533845424652],
  [-0.4619397521018982, 0.19134171307086945],
  [0, 0],
  [-0.4619397521018982, 0.19134171307086945],
  [-0.5, 6.123234262925839e-17],
  [0, 0],
  [-0.5, 6.123234262925839e-17],
  [-0.4619397521018982, -0.19134171307086945],
  [0, 0],
  [-0.4619397521018982, -0.19134171307086945],
  [-0.3535533845424652, -0.3535533845424652],
  [0, 0],
  [-0.3535533845424652, -0.3535533845424652],
  [-0.19134171307086945, -0.4619397521018982],
  [0, 0],
  [-0.19134171307086945, -0.4619397521018982],
  [-9.184850732644269e-17, -0.5],
  [0, 0],
  [-9.184850732644269e-17, -0.5],
  [0.19134171307086945, -0.4619397521018982],
  [0, 0],
  [0.19134171307086945, -0.4619397521018982],
  [0.3535533845424652, -0.3535533845424652],
  [0, 0],
  [0.3535533845424652, -0.3535533845424652],
  [0.4619397521018982, -0.19134171307086945],
  [0, 0],
  [0.4619397521018982, -0.19134171307086945],
  [0.5, -1.2246468525851679e-16],
];

export class LineGroupBuilder extends ObjectGroupBuilder<LineMapFeature, WebGlLineBufferredGroup> {
  build(distance: number, name: string, zIndex = 0): WebGlLineBufferredGroup {
    const vertecies: number[] = [];
    const colorBuffer: number[] = [];
    const widthBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    for (const line of this.objects) {
      const numberOfAddedVertecies = this.verticesFromLine(distance, vertecies, line.vertecies, line.width, line.join);
      const xTimes = numberOfAddedVertecies / 2;

      addXTimes(colorBuffer, [...line.color], xTimes);
      addXTimes(widthBuffer, line.width, xTimes);
      addXTimes(borderWidthBuffer, line.borderWidth, xTimes);
      addXTimes(borderColorBuffer, [...line.borderColor], xTimes);
      addXTimes(selectionColorBuffer, integerToVector4(line.id), xTimes);
    }

    return {
      type: MapFeatureType.line,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
      },
      width: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: createdSharedArrayBuffer(widthBuffer),
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

  verticesFromLine(
    distance: number,
    result: number[],
    coordinates: Array<[number, number]>,
    lineWidth: number,
    joinStyle?: LineJoinStyle,
  ): number {
    const start = result.length;

    this.lineToTriangles(distance, result, coordinates[0], coordinates[1], lineWidth);
    for (let i = 2; i < coordinates.length; i++) {
      if (joinStyle === LineJoinStyle.round) {
        this.roundJoinToTriangles(distance, result, coordinates[i - 1], lineWidth);
      }

      this.lineToTriangles(distance, result, coordinates[i - 1], coordinates[i], lineWidth);
    }

    return result.length - start;
  }

  lineToTriangles(distance: number, result: number[], p1: [number, number], p2: [number, number], lineWidth: number) {
    const scaledLineWidth = lineWidth / distance;
    const p1Projected = vec2.fromValues(p1[0], p1[1]);
    const p2Projected = vec2.fromValues(p2[0], p2[1]);

    const xBasis = vec2.create();
    vec2.subtract(xBasis, p2Projected, p1Projected);
    const yBasis = vec2.create();
    vec2.normalize(yBasis, vec2.fromValues(-xBasis[1], xBasis[0]));

    for (const linePos of LINE_POSITION) {
      const scaledXBasis = vec2.fromValues(xBasis[0] * linePos[0], xBasis[1] * linePos[0]);
      const scaledYBasis = vec2.fromValues(
        yBasis[0] * scaledLineWidth * linePos[1],
        yBasis[1] * scaledLineWidth * linePos[1],
      );

      const resultPosition = vec2.create();
      vec2.add(resultPosition, p1Projected, scaledXBasis);
      vec2.add(resultPosition, resultPosition, scaledYBasis);

      result.push(...resultPosition);
    }
  }

  roundJoinToTriangles(distance: number, result: number[], center: [number, number], lineWidth: number) {
    const scaledLineWidth = lineWidth / distance;
    const centerVec = vec2.fromValues(center[0], center[1]);

    for (const pos of ROUND_JOIN_POSITION) {
      const res = vec2.create();
      const vecPos = vec2.fromValues(pos[0], pos[1]);

      vec2.scale(vecPos, vecPos, scaledLineWidth);
      vec2.add(res, centerVec, vecPos);

      result.push(...res);
    }
  }
}
