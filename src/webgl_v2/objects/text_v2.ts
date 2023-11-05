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

const textCtx = document.createElement('canvas').getContext('2d');
function makeTextCanvas(attrs: WebGl2Text2Attributes, width: number, height: number) {
  textCtx.canvas.width = width;
  textCtx.canvas.height = height;
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
    return new Uint16Array([0, 1, 2, 2, 1, 3]);
  }

  getDataBuffer(): number[] {
    // const width = 100;
    // const height = 26;
    // return [0, 0, width, 0, 0, height, 0, height, width, 0, width, height];

    const size = 0.5;
    const xOffset = 0;
    const yOffset = 0;
    return [
      xOffset + -1 * size,
      yOffset + -1 * size,
      xOffset + 1 * size,
      yOffset + -1 * size,
      xOffset + -1 * size,
      yOffset + 1 * size,
      xOffset + 1 * size,
      yOffset + 1 * size,
    ];
  }

  getTexture(): TexImageSource {
    return makeTextCanvas(this.attributes, 100, 26);
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ELEMENTS,
      numElements: 6,
    };
  }
}
