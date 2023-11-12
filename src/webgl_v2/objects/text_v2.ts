import { Font } from 'opentype.js';
import { WebGl2ProgramType } from '../programs/program';
import { Vector2 } from '../types';
import {
  WebGl2Object,
  PrimitiveType,
  WebGl2ObjectAttributes,
  WebGl2ObjectDrawType,
  WebGl2ObjectDrawAttrs,
} from './object';

export interface WebGl2Text2Attributes extends WebGl2ObjectAttributes {
  center: Vector2;
  text: string;
  font: Font;
  fontSize: number;
}

const canvasEl = document.createElement('canvas');
const textCtx = canvasEl.getContext('2d');

function makeTextCanvas(attrs: WebGl2Text2Attributes, width: number, height: number) {
  textCtx.canvas.width = width;
  textCtx.canvas.height = height;
  canvasEl.style.width = `${width / devicePixelRatio}px`;
  canvasEl.style.height = `${height / devicePixelRatio}px`;
  textCtx.font = `${attrs.fontSize}px monospace`;
  textCtx.textAlign = 'center';
  textCtx.textBaseline = 'middle';
  textCtx.fillStyle = 'black';
  textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
  textCtx.fillText(attrs.text, width / 2, height / 2);

  return textCtx.canvas;
}

export class WebGl2Text extends WebGl2Object<WebGl2Text2Attributes> {
  programType = WebGl2ProgramType.text;

  getIndexBuffer(): Uint16Array | undefined {
    return new Uint16Array([0, 1, 2, 1, 2, 3]);
  }

  protected computeDataBuffer(): number[] {
    const { width, height } = this.getTextDimentions();
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return [
      this.attributes.center[0] - halfWidth,
      this.attributes.center[1] - halfHeight,
      this.attributes.center[0] + halfWidth,
      this.attributes.center[1] - halfHeight,
      this.attributes.center[0] - halfWidth,
      this.attributes.center[1] + halfHeight,
      this.attributes.center[0] + halfWidth,
      this.attributes.center[1] + halfHeight,
    ];
  }

  getTexture(): TexImageSource {
    const { width, height } = this.getTextDimentions();

    return makeTextCanvas(this.attributes, width, height);
  }

  getTextDimentions() {
    return {
      width: this.attributes.text.length * this.attributes.fontSize,
      height: this.attributes.fontSize,
    };
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ELEMENTS,
      numElements: 6,
    };
  }
}
