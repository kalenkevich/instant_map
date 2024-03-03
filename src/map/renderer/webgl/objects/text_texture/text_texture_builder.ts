import { vec4 } from 'gl-matrix';
import { WebGlText } from './text';
import { WebGlTextTextureBufferredGroup, TextMapping } from './text';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { MapTileFeatureType } from '../../../../tile/tile';
import { TextureAtlas } from '../../../../atlas/atlas_config';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';

function webglColorToHex(color: vec4 | [number, number, number, number]) {
  const [r, g, b, a] = color;

  return '#' + ((1 << 24) | ((r * 255) << 16) | ((g * 255) << 8) | (b * 255)).toString(16).slice(1);
}

/**
 * Builds canvas texture containing all the text, followed one by one, pushed by `addTextToCanvas` method.
 */
export class DynamicTextCanvas {
  private cursor = { row: 0, x: 0, y: 0 };
  private canvas: OffscreenCanvas;
  private canvasCtx: OffscreenCanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private mappings: TextMapping[] = [];

  constructor() {
    this.canvas = new OffscreenCanvas(0, 0);
    this.width = 0;
    this.height = 0;
    this.canvasCtx = this.canvas.getContext('2d');
  }

  addTextToCanvas(text: WebGlText): TextMapping {
    this.canvasCtx.font = `${text.fontSize}px sans-serif`;
    const textMetrics = this.canvasCtx.measureText(text.text);
    const widthPadding = 10;
    const heightPadding = 20;
    const width = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft + widthPadding;
    const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent + heightPadding;

    if (this.width === 0) {
      this.width = width;
    }

    const mapping = {
      text: text.text,
      font: text.font,
      color: text.color,
      borderColor: text.borderColor,
      fontSize: text.fontSize,
      x: this.cursor.x,
      y: this.cursor.y,
      width: width,
      height: height,
      widthPadding,
      heightPadding,
    };
    this.cursor.x = 0;
    this.cursor.y += height;
    this.cursor.row++;
    this.height = Math.max(this.height, this.cursor.y + height);
    this.width = Math.max(width, this.width);

    this.mappings.push(mapping);

    return mapping;
  }

  async getTexture(): Promise<TextureAtlas> {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, this.width, this.height);

    for (const textMapping of this.mappings) {
      canvasCtx.font = `${textMapping.fontSize}px sans-serif`;
      canvasCtx.strokeStyle = webglColorToHex(textMapping.borderColor);
      canvasCtx.lineWidth = textMapping.fontSize / 5;
      canvasCtx.strokeText(
        textMapping.text,
        textMapping.x,
        textMapping.y + textMapping.height - textMapping.heightPadding
      );
      canvasCtx.fillStyle = webglColorToHex(textMapping.color);
      canvasCtx.fillText(
        textMapping.text,
        textMapping.x,
        textMapping.y + textMapping.height - textMapping.heightPadding
      );
    }

    return {
      width: this.width,
      height: this.height,
      source: await createImageBitmap(canvas, { premultiplyAlpha: 'premultiply' }),
    };
  }
}

export class TextTextureGroupBuilder extends ObjectGroupBuilder<WebGlText> {
  addObject(text: WebGlText): void {
    if (!text.text || text.text === ' ') {
      return;
    }

    this.objects.push([text, 0]);
  }

  async build(): Promise<WebGlTextTextureBufferredGroup> {
    const size = this.objects.length;
    const dynamicTextCanvas = new DynamicTextCanvas();
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    const textMappings: Array<[WebGlText, TextMapping]> = [];

    for (const [text] of this.objects) {
      textMappings.push([text, dynamicTextCanvas.addTextToCanvas(text)]);
    }

    const texture = await dynamicTextCanvas.getTexture();

    for (const [text, textMapping] of textMappings) {
      const textScaledWidth = this.scalarScale(textMapping.width / this.pixelRatio);
      const textScaledHeight = this.scalarScale(textMapping.height / this.pixelRatio);
      const marginTop = this.scalarScale((text.margin?.top || 0) / this.pixelRatio);
      const marginLeft = this.scalarScale((text.margin?.left || 0) / this.pixelRatio);

      // vertex coordinates
      let [x1, y1] = this.projection.fromLngLat([text.center[0], text.center[1]]);
      x1 = x1 - textScaledWidth / 2 + marginLeft;
      y1 = y1 - textScaledHeight / 2 + marginTop;
      const x2 = x1 + textScaledWidth;
      const y2 = y1 + textScaledHeight;

      // texture coordinates
      const u1 = textMapping.x / texture.width;
      const v1 = textMapping.y / texture.height;
      const u2 = (textMapping.x + textMapping.width) / texture.width;
      const v2 = (textMapping.y + textMapping.height) / texture.height;

      // first triangle
      verteciesBuffer.push(x1, y1, x2, y1, x1, y2);
      texcoordBuffer.push(u1, v1, u2, v1, u1, v2);

      // second triangle
      verteciesBuffer.push(x1, y2, x2, y1, x2, y2);
      texcoordBuffer.push(u1, v2, u2, v1, u2, v2);

      colorBuffer.push(...text.color);
      selectionColorBuffer.push(...integerToVector4(text.id));
    }

    return {
      type: MapTileFeatureType.text,
      size,
      numElements: size,
      texture,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(verteciesBuffer),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(texcoordBuffer),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColorBuffer),
      },
    };
  }
}
