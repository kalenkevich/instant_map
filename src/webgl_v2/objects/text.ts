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
import { getVerticiesFromText } from '../../webgl/object/text/text_utils';

export interface WebGl2TextAttributes extends WebGl2ObjectAttributes {
  center: Vector2;
  text: string;
  font: Font;
  fontSize: number;
}

export class WebGl2Text extends WebGl2Object<WebGl2TextAttributes> {
  programType = WebGl2ProgramType.polygon;

  indices?: Uint16Array;

  getIndexBuffer(): Uint16Array | undefined {
    return this.indices;
  }

  getDataBuffer(): number[] {
    const { indices, vertices: buffer } = getVerticiesFromText(
      this.attributes.font,
      this.attributes.text,
      this.attributes.center,
      this.attributes.fontSize
    );
    this.indices = new Uint16Array(indices);

    return [...buffer];
  }

  getDrawAttributes(): WebGl2ObjectDrawAttrs {
    return {
      primitiveType: PrimitiveType.TRIANGLES,
      drawType: WebGl2ObjectDrawType.ELEMENTS,
      numElements: this.indices.length,
    };
  }
}
