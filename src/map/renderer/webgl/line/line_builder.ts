import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { LineJoinStyle, WebGlLine, WebGlLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../tile/tile';

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
    const verteciesBuffer = new Float32Array(this.vertecies);

    const colorBuffer = new Float32Array(numElements * 4);
    let colorBufferOffset = 0;
    const widthBuffer = new Float32Array(numElements);
    let widthBufferOffset = 0;
    const borderWidthBuffer = new Float32Array(numElements);
    let borderWidthBufferOffset = 0;
    const borderColorBuffer = new Float32Array(numElements * 4);
    let borderColorBufferOffset = 0;

    let currentObjectIndex = 0;
    let currentObject: WebGlLine = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.set(currentObject.color, colorBufferOffset);
      colorBufferOffset += 4;

      widthBuffer.set([currentObject.width], i);
      widthBufferOffset += 1;

      borderWidthBuffer.set([currentObject.borderWidth], i);
      borderWidthBufferOffset += 1;

      borderColorBuffer.set(currentObject.borderColor, borderColorBufferOffset);
      borderColorBufferOffset += 4;
    }

    return {
      type: MapTileFeatureType.line,
      size: this.objects.length,
      numElements,
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: colorBuffer,
      },
      width: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: widthBuffer,
      },
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: verteciesBuffer,
      },
      borderWidth: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 1,
        buffer: borderWidthBuffer,
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: borderColorBuffer,
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
