import { WebGlText } from './text';
import { WebGlTextBufferredGroup, TextMapping } from './text';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { MapTileFeatureType } from '../../../tile/tile';
import { TextureAtlas } from '../../../atlas/atlas_config';

export async function buildTextCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  width: number,
  height: number,
  mappings: TextMapping[]
) {
  const canvasCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D = canvas.getContext('2d');
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.strokeStyle = 'red';
  canvasCtx.fillStyle = 'black';

  for (const textMapping of mappings) {
    canvasCtx.font = `${textMapping.fontSize}px sans-serif`;
    canvasCtx.fillText(textMapping.text, textMapping.x, textMapping.y + textMapping.height);
    canvasCtx.strokeRect(textMapping.x, textMapping.y, textMapping.width, textMapping.height);
  }
}

/**
 * Builds canvas texture containing all the text, followed one by one, pushed by `addTextToCanvas` method.
 */
export class DynamicTextCanvas {
  private cursor = { row: 0, x: 0, y: 0 };
  private rowsHeight: number[] = [0];
  private canvas: OffscreenCanvas;
  private canvasCtx: OffscreenCanvasRenderingContext2D;
  private height: number = 0;
  private mappings: TextMapping[] = [];

  constructor(private readonly width: number, startHeight: number, private readonly pixelRatio: number) {
    this.canvas = new OffscreenCanvas(width, startHeight);
    this.height = startHeight;
    this.canvasCtx = this.canvas.getContext('2d');
    this.canvasCtx.clearRect(0, 0, width, startHeight);
  }

  addTextToCanvas(text: string, font: string, fontSize: number): TextMapping {
    this.canvasCtx.font = `${fontSize}px sans-serif`;
    const textMetrics = this.canvasCtx.measureText(text);
    const widthPadding = 10;
    const heightPadding = 20;
    const width = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft + widthPadding;
    const height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent + heightPadding;

    this.rowsHeight[this.cursor.row] = Math.max(this.rowsHeight[this.cursor.row], height);
    if (this.cursor.x + width > this.canvas.width) {
      this.cursor.x = 0;
      this.cursor.y += this.rowsHeight[this.cursor.row];

      this.cursor.row++;
      this.rowsHeight.push(height);
    }

    const mapping = {
      text,
      font,
      fontSize,
      x: this.cursor.x + widthPadding / 2,
      y: this.cursor.y + heightPadding / 2,
      width: width,
      height: height,
      widthPadding,
      heightPadding,
    };
    this.cursor.x += width;
    this.height = Math.max(this.height, this.cursor.y + height);

    this.mappings.push(mapping);

    return mapping;
  }

  async getTexture(): Promise<TextureAtlas> {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, this.width, this.height);
    canvasCtx.fillStyle = 'white';

    for (const textMapping of this.mappings) {
      canvasCtx.font = `${textMapping.fontSize}px sans-serif`;
      // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
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
    this.objects.push([text, 0]);
  }

  async build(): Promise<WebGlTextBufferredGroup> {
    const size = this.objects.length;
    const dynamicTextCanvas = new DynamicTextCanvas(this.canvasWidth, this.canvasHeight, this.pixelRatio);
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const textMappings: Array<[WebGlText, TextMapping]> = [];

    for (const [text] of this.objects) {
      textMappings.push([text, dynamicTextCanvas.addTextToCanvas(text.text, text.font, text.fontSize)]);
    }

    const texture = await dynamicTextCanvas.getTexture();

    for (const [text, textMapping] of textMappings) {
      const textScaledWidth = this.scalarScale(textMapping.width);
      const textScaledHeight = this.scalarScale(textMapping.height);

      // vertex coordinates
      let [x1, y1] = this.projection.fromLngLat([text.center[0], text.center[1]]);
      x1 = x1 - textScaledWidth / 2;
      y1 = y1 - textScaledHeight / 2;
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
      // colorBuffer.push(...getRgbRandomColor());
    }

    return {
      type: MapTileFeatureType.text,
      size,
      numElements: size,
      texture,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: new Float32Array(verteciesBuffer),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: new Float32Array(texcoordBuffer),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: new Float32Array(colorBuffer),
      },
    };
  }
}
