import { mat3 } from 'gl-matrix';
import { MapFeatureFlags } from '../../../../flags';
import { getVerticiesFromChar } from './text_vector_utils';
import { WebGlText } from '../text/text';
import { WebGlTextVectorBufferredGroup } from './text_vector';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { FontManager } from '../../../../font/font_manager';
import { VectorFontAtlas } from '../../../../font/font_config';
import { MapTileFeatureType } from '../../../../tile/tile';
import { Projection } from '../../../../geo/projection/projection';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';

interface CharVerticesData {
  vertices: number[];
  width: number;
  height: number;
}

interface TextVerteciesData {
  chars: CharVerticesData[];
  width: number;
  height: number;
}

const FONT_CHAR_CACHE: Record<string, Record<string, CharVerticesData>> = {};

export class TextVectorBuilder extends ObjectGroupBuilder<WebGlText> {
  constructor(
    protected readonly projectionViewMat: mat3,
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly pixelRatio: number,
    protected readonly zoom: number,
    protected readonly minZoom: number,
    protected readonly maxZoom: number,
    protected readonly tileSize: number,
    protected readonly projection: Projection,
    protected readonly featureFlags: MapFeatureFlags,
    private readonly fontManager: FontManager
  ) {
    super(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      pixelRatio,
      zoom,
      minZoom,
      maxZoom,
      tileSize,
      projection,
      featureFlags
    );
  }

  addObject(text: WebGlText) {
    const objectSize = this.verticesFromText(this.vertecies, this.fontManager, text);

    this.objects.push([text, objectSize]);
  }

  build(): WebGlTextVectorBufferredGroup {
    const numElements = this.vertecies.length / 2;
    const colorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    let currentObjectIndex = 0;
    let currentObject: WebGlText = this.objects[currentObjectIndex][0];
    let currentOffset = this.objects[currentObjectIndex][1];

    for (let i = 0; i < numElements; i++) {
      if (i > currentOffset) {
        currentObjectIndex++;
        currentObject = this.objects[currentObjectIndex][0];
        currentOffset += this.objects[currentObjectIndex][1];
      }

      colorBuffer.push(...currentObject.color);
      selectionColorBuffer.push(...integerToVector4(currentObject.id));
    }

    return {
      type: MapTileFeatureType.text,
      size: this.objects.length,
      numElements,
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
      },
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(this.vertecies),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColorBuffer),
      },
    };
  }

  verticesFromText(result: number[], fontManager: FontManager, text: WebGlText): number {
    const start = result.length;

    if (!text.text) {
      return 0;
    }

    const fontAtlas = fontManager.getFontAtlas(text.font) as VectorFontAtlas;
    const point = text.center as [number, number];

    if (!FONT_CHAR_CACHE[text.font]) {
      FONT_CHAR_CACHE[text.font] = {};
    }
    const textData: TextVerteciesData = {
      chars: [],
      width: 0,
      height: 0,
    };
    const textVerticies: number[] = [];

    for (const char of text.text) {
      const charVerticiesData = FONT_CHAR_CACHE[text.font][char] || getCharVerticies(fontAtlas, char);
      if (!FONT_CHAR_CACHE[text.font][char]) {
        FONT_CHAR_CACHE[text.font][char] = charVerticiesData;
      }

      textData.chars.push(charVerticiesData);
      textData.width += charVerticiesData.width;
      textData.height = Math.max(textData.height, charVerticiesData.height);
    }

    const scaledHeight = this.scalarScale(textData.height / this.tileSize) * text.fontSize;

    let scaledTextWidth = 0;
    for (const { vertices: charVertices, width } of textData.chars) {
      const scaledWidth = this.scalarScale(width / this.tileSize) * text.fontSize;
      let minX = Infinity;
      let maxX = -Infinity;

      for (let i = 0; i < charVertices.length; i += 2) {
        const scaledX = charVertices[i] * scaledWidth;
        const scaledY = charVertices[i + 1] * scaledHeight;

        minX = Math.min(minX, scaledX);
        maxX = Math.max(maxX, scaledX);

        textVerticies.push(point[0] + scaledX + scaledTextWidth);
        textVerticies.push(point[1] + scaledY);
      }

      // 1.3 for space
      scaledTextWidth += (maxX - minX) * 1.3;
    }

    // Center the text
    const halfWidthSize = scaledTextWidth / 2;
    for (let i = 0; i < textVerticies.length; i += 2) {
      result.push(textVerticies[i] - halfWidthSize);
      result.push(textVerticies[i + 1]);
    }

    return result.length - start;
  }
}

export function getCharVerticies(fontAtlas: VectorFontAtlas, char: string) {
  const charVertices: number[] = [];
  const { vertices, indices, width, height } = getVerticiesFromChar(fontAtlas, char, true);

  for (const index of indices) {
    const x = vertices[index * 2];
    const y = vertices[index * 2 + 1];

    charVertices.push(x, y);
  }

  return { vertices: charVertices, width, height };
}
