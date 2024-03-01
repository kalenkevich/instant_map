import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { LineJoinStyle, WebGlLine, WebGlLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../tile/tile';
import { createdSharedArrayBuffer } from '../utils/array_buffer';
import { integerToVector4 } from '../utils/number2vec';

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
  addObject(line: WebGlLine) {
    const objectSize = this.verticesFromLine(this.vertecies, line.vertecies, line.width, line.join);

    this.objects.push([line, objectSize]);
  }

  build(): WebGlLineBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const colorBuffer: number[] = [];
    const widthBuffer: number[] = [];
    const borderWidthBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    let currentObjectIndex = 0;
    let currentObject: WebGlLine = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.push(...(currentObject.color || [0, 0, 0, 1]));
      widthBuffer.push(currentObject.width);
      borderWidthBuffer.push(currentObject.borderWidth);
      borderColorBuffer.push(...currentObject.borderColor);
      selectionColorBuffer.push(...integerToVector4(currentObject.id));
    }

    return {
      type: MapTileFeatureType.line,
      size: this.objects.length,
      numElements,
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
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
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

  verticesFromLine(
    result: number[],
    coordinates: Array<[number, number] | vec2>,
    lineWidth: number,
    joinStyle?: LineJoinStyle
  ): number {
    const start = result.length;

    this.lineToTriangles(result, coordinates[0], coordinates[1], lineWidth);
    for (let i = 2; i < coordinates.length; i++) {
      if (joinStyle === LineJoinStyle.round) {
        this.roundJoinToTriangles(result, coordinates[i - 1], lineWidth);
      }

      this.lineToTriangles(result, coordinates[i - 1], coordinates[i], lineWidth);
    }

    return result.length - start;
  }

  lineToTriangles(result: number[], p1: [number, number] | vec2, p2: [number, number] | vec2, lineWidth: number) {
    const scaledLineWidth = this.scalarScale(lineWidth);
    const p1Projected = vec2.fromValues(...this.projection.fromLngLat(p1));
    const p2Projected = vec2.fromValues(...this.projection.fromLngLat(p2));

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

  roundJoinToTriangles(result: number[], center: [number, number] | vec2, lineWidth: number, componets = 16) {
    const scaledLineWidth = this.scalarScale(lineWidth);
    const centerVec = vec2.fromValues(...this.projection.fromLngLat(center));

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
