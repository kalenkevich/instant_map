import { getVerticiesFromText, getTextRectangleSize } from './text_utils';
import { WebGlText, WebGlTextBufferredGroup } from './text';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { FontManager } from '../../../font_manager/font_manager';
import { MapTileFeatureType } from '../../../tile/tile';

export class TextGroupBuilder extends ObjectGroupBuilder<WebGlText> {
  constructor(private readonly fontManager: FontManager) {
    super();
  }

  addObject(text: WebGlText) {
    const objectSize = verticesFromText(
      this.vertecies,
      text.font,
      text.fontSize,
      this.fontManager,
      text.text,
      text.center as [number, number]
    );

    this.objects.push([text, objectSize]);
  }

  build(): WebGlTextBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const verteciesBuffer = new Float32Array(this.vertecies);

    const colorBuffer = new Float32Array(numElements * 4);
    let colorBufferOffset = 0;
    const borderWidthBuffer = new Float32Array(numElements);
    let borderWidthBufferOffset = 0;
    const borderColorBuffer = new Float32Array(numElements * 4);
    let borderColorBufferOffset = 0;

    let currentObjectIndex = 0;
    let currentObject: WebGlText = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.set(currentObject.color, colorBufferOffset);
      colorBufferOffset += 4;

      borderWidthBuffer.set([currentObject.borderWidth], i);
      borderWidthBufferOffset += 1;

      borderColorBuffer.set(currentObject.borderColor, borderColorBufferOffset);
      borderColorBufferOffset += 4;
    }

    return {
      type: MapTileFeatureType.text,
      size: this.objects.length,
      numElements,
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: colorBuffer,
      },
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
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

const fontsCache: Record<string, Record<string, number[]>> = {};
export function verticesFromText(
  result: number[],
  fontName: string,
  fontSize: number,
  fontManager: FontManager,
  text: string,
  point: [number, number]
): number {
  const start = result.length;

  if (!text) {
    return 0;
  }

  const font = fontManager.getFont(fontName);

  if (!fontsCache[fontName]) {
    fontsCache[fontName] = {};
  }
  const fontCache = fontsCache[fontName];
  const boundaries = getTextRectangleSize(font, 'G', [0, 0], fontSize);
  const upperLetterWidth = boundaries.width;

  let xOffset = 0;
  const textVerticies: number[] = [];
  for (const c of text) {
    if (!fontCache[c]) {
      const charVertecies: number[] = [];

      const { vertices, indices } = getVerticiesFromText(font, c, [0, 0], fontSize, true);
      for (const index of indices) {
        charVertecies.push(vertices[index * 2]);
        charVertecies.push(vertices[index * 2 + 1]);
      }

      fontCache[c] = charVertecies;
    }

    for (let i = 0; i < fontCache[c].length; i += 2) {
      textVerticies.push(point[0] + fontCache[c][i] + xOffset);
      textVerticies.push(point[1] + fontCache[c][i + 1]);
    }

    if (c === ' ') {
      xOffset += upperLetterWidth;
    } else {
      xOffset += getTextRectangleSize(font, c, [0, 0], fontSize).width * 1.3;
    }
  }

  // Center the text
  const halfWidthSize = xOffset / 2;
  for (let i = 0; i < textVerticies.length; i += 2) {
    result.push(textVerticies[i] - halfWidthSize);
    result.push(textVerticies[i + 1]);
  }

  return result.length - start;
}
