import { vec2 } from 'gl-matrix';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlLine, WebGlLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../tile/tile';

export class LineGroupBuilder extends ObjectGroupBuilder<WebGlLine> {
  addObject(line: WebGlLine) {
    const objectSize = verticesFromLine(this.vertecies, line.vertecies);

    this.objects.push([line, objectSize]);
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
}

function verticesFromLine(result: number[], coordinates: number[][] | vec2[]): number {
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
