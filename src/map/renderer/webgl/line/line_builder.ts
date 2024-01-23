import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { LineJoinStyle, WebGlLine, WebGlLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../tile/tile';

const LINE_POSITION = [
  [0, -0.5],
  [1, -0.5],
  [1, 0.5],
  [0, -0.5],
  [1, 0.5],
  [0, 0.5],
];

export class LineGroupBuilder extends ObjectGroupBuilder<WebGlLine> {
  addObject(line: WebGlLine) {
    if (this.featureFlags.enableLineV2Rendering) {
      const objectSize = this.verticesFromLine(this.vertecies, line.vertecies, line.width, line.join);

      this.objects.push([line, objectSize]);
    } else {
      const objectSize = verticesFromLine(this.vertecies, line.vertecies, line.join);

      this.objects.push([line, objectSize]);
    }
  }

  build(): WebGlLineBufferredGroup {
    const numElements = this.vertecies.length / 3;
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
        this.roundJoin(result, coordinates[i - 1]);
      }

      this.lineToTriangles(result, coordinates[i - 1], coordinates[i], lineWidth);
    }

    return result.length - start;
  }

  lineToTriangles(result: number[], p1: number[] | vec2, p2: number[] | vec2, lineWidth: number) {
    const p1Projected = this.projection.fromLngLat([p1[0], p1[1]]);
    const p2Projected = this.projection.fromLngLat([p2[0], p2[1]]);

    const p1Vector = vec2.fromValues(p1Projected[0], p1Projected[1]);
    const p2Vector = vec2.fromValues(p2Projected[0], p2Projected[1]);

    console.log('p1Vector', p1Vector);
    console.log('p2Vector', p2Vector);

    const xBasis = vec2.create();
    vec2.subtract(xBasis, p2Vector, p1Vector);
    const yBasis = vec2.create();
    vec2.normalize(yBasis, vec2.fromValues(-xBasis[1], xBasis[0]));

    console.log('xBasis', xBasis);
    console.log('yBasis', yBasis);

    for (const linePos of LINE_POSITION) {
      vec2.scale(xBasis, xBasis, linePos[0]);
      vec2.scale(yBasis, yBasis, this.scalarScale(lineWidth) * linePos[1]);

      console.log('xBasis scaled', xBasis);
      console.log('yBasis scaled', yBasis);

      vec2.add(p1Vector, p1Vector, xBasis);
      vec2.add(p1Vector, p1Vector, yBasis);

      console.log('p1Vector plus', p1Vector);

      const clipped = this.clipSpace([p1Vector[0], p1Vector[1]]);

      console.log('clipped', clipped);

      const projected = this.applyProjectionViewMatrix(clipped);

      console.log('projected', projected);

      result.push(...projected, 0);
    }
  }

  roundJoin(result: number[], center: number[] | vec2, componets = 16) {
    for (let wedge = 0; wedge <= componets; wedge++) {
      const theta = (2 * Math.PI * wedge) / componets;

      const p1 = this.applyProjectionViewMatrix(this.clipSpace([center[0], center[1] * Math.cos(theta)]));
      const p2 = this.applyProjectionViewMatrix(this.clipSpace([center[1] * Math.cos(theta), center[1]]));

      result.push(...p1, 1);
      result.push(...p2, 1);
    }
  }
}

function verticesFromLine(result: number[], coordinates: number[][] | vec2[], joinStyle?: LineJoinStyle): number {
  const start = result.length;
  // Dublicate last point from prev line
  if (result.length) {
    const prevX = result[result.length - 3];
    const prevY = result[result.length - 2];

    result.push(prevX, prevY, -1);
  }

  // Duplicate first point from new line
  result.push(coordinates[0][0], coordinates[0][1], -1);
  result.push(coordinates[0][0], coordinates[0][1], 1);
  result.push(coordinates[1][0], coordinates[1][1], 1);

  for (let i = 2; i < coordinates.length; i++) {
    const prevX = result[result.length - 3];
    const prevY = result[result.length - 2];
    const prevZ = result[result.length - 1];

    result.push(prevX, prevY, prevZ); // duplicate prev coord
    result.push(coordinates[i][0], coordinates[i][1], 1);
  }

  return result.length - start;
}
