import { mat3 } from 'gl-matrix';
import { MapFeatureFlags } from '../../../../flags';
import { getVerticiesFromText } from './text_polygon_utils';
import { WebGlText, WebGlTextPolygonBufferredGroup } from '../text_texture/text';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { FontManager } from '../../../../font/font_manager';
import { MapTileFeatureType } from '../../../../tile/tile';
import { Projection } from '../../../../geo/projection/projection';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';

const fontsCache: Record<string, Record<string, number[]>> = {};
export class TextPolygonBuilder extends ObjectGroupBuilder<WebGlText> {
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

  build(): WebGlTextPolygonBufferredGroup {
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

    const font = fontManager.getFont(text.font);
    const point = text.center as [number, number];

    if (!fontsCache[text.font]) {
      fontsCache[text.font] = {};
    }
    const fontSize = text.fontSize / 2;
    const textVerticies: number[] = [];
    const { vertices, indices, width } = getVerticiesFromText(font, text.text, [0, 0], fontSize, true);
    const scaleFactor = width / fontSize;
    const scaledWidth = this.scalarScale(width);
    const scaledHeight = this.scalarScale(fontSize);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const index of indices) {
      const x = vertices[index * 2];
      const y = vertices[index * 2 + 1];
      const scaledX = x * scaledWidth * fontSize;
      const scaledY = y * scaledHeight * fontSize * scaleFactor;

      minX = Math.min(minX, scaledX);
      minY = Math.min(minY, scaledY);
      maxX = Math.max(maxX, scaledX);
      maxY = Math.max(maxY, scaledY);

      textVerticies.push(point[0] + scaledX);
      textVerticies.push(point[1] + scaledY);
    }

    // Center the text
    const halfWidthSize = (maxX - minX) / 2;
    for (let i = 0; i < textVerticies.length; i += 2) {
      result.push(textVerticies[i] - halfWidthSize);
      result.push(textVerticies[i + 1]);
    }

    return result.length - start;
  }
}
