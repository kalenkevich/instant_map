import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { SceneCamera } from '../../../renderer';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { LineJoinStyle, WebGlLine, WebGlLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../../tile/tile';
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

export class LineGroupBuilder extends ObjectGroupBuilder<WebGlLine> {
  build(camera: SceneCamera, name: string, zIndex = 0): WebGlLineBufferredGroup {
    const vertecies: number[] = [];
    const colorBuffer: number[] = [];
    const widthBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    for (const line of this.objects) {
      const numberOfAddedVertecies = this.verticesFromLine(camera, vertecies, line.vertecies, line.width, line.join);
      const xTimes = numberOfAddedVertecies / 2;

      addXTimes(colorBuffer, [...line.color], xTimes);
      addXTimes(widthBuffer, line.width, xTimes);
      addXTimes(borderWidthBuffer, line.borderWidth, xTimes);
      addXTimes(borderColorBuffer, [...line.borderColor], xTimes);
      addXTimes(selectionColorBuffer, integerToVector4(line.id), xTimes);
    }

    return {
      type: MapTileFeatureType.line,
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
    camera: SceneCamera,
    result: number[],
    coordinates: Array<[number, number] | vec2>,
    lineWidth: number,
    joinStyle?: LineJoinStyle
  ): number {
    const start = result.length;

    this.lineToTriangles(camera, result, coordinates[0], coordinates[1], lineWidth);
    for (let i = 2; i < coordinates.length; i++) {
      if (joinStyle === LineJoinStyle.round) {
        this.roundJoinToTriangles(camera, result, coordinates[i - 1], lineWidth);
      }

      this.lineToTriangles(camera, result, coordinates[i - 1], coordinates[i], lineWidth);
    }

    return result.length - start;
  }

  lineToTriangles(
    camera: SceneCamera,
    result: number[],
    p1: [number, number] | vec2,
    p2: [number, number] | vec2,
    lineWidth: number
  ) {
    const scaledLineWidth = this.scalarScale(lineWidth, camera.distance);
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
        yBasis[1] * scaledLineWidth * linePos[1]
      );

      const resultPosition = vec2.create();
      vec2.add(resultPosition, p1Projected, scaledXBasis);
      vec2.add(resultPosition, resultPosition, scaledYBasis);

      result.push(...resultPosition);
    }
  }

  roundJoinToTriangles(
    camera: SceneCamera,
    result: number[],
    center: [number, number] | vec2,
    lineWidth: number,
    componets = 16
  ) {
    const scaledLineWidth = this.scalarScale(lineWidth, camera.distance);
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

export function getRoundJoinPositions(componets = 16): vec2[] {
  const positions: vec2[] = [
    vec2.fromValues(0, 0),
    vec2.fromValues(0.5, 0),
    vec2.fromValues(0.5 * Math.cos((2 * Math.PI * 1) / componets), 0.5 * Math.sin((2 * Math.PI * 1) / componets)),
  ];

  for (let wedge = 2; wedge <= componets; wedge++) {
    const theta = (2 * Math.PI * wedge) / componets;
    const next = vec2.fromValues(0.5 * Math.cos(theta), 0.5 * Math.sin(theta));
    const prev = positions[positions.length - 1];

    positions.push(vec2.fromValues(0, 0));
    positions.push(prev);
    positions.push(next);
  }

  return positions.map(v => [v[0], v[1]]);
}
