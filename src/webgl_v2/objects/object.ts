import { m3 } from '../../webgl/utils/m3';
import { WebGl2ProgramType, WebGl2ProgramUniforms } from '../programs/program';
import { GlColor, Mat3, Vector2 } from '../types';

export enum PrimitiveType {
  POINTS = 0x0000,
  LINES = 0x0001,
  LINE_LOOP = 0x0002,
  LINE_STRIP = 0x0003,
  TRIANGLES = 0x0004,
  TRIANGLE_STRIP = 0x0005,
  TRIANGLE_FAN = 0x0006,
}

export enum WebGl2ObjectDrawType {
  ARRAYS,
  ARRAYS_INSTANCED,
  ELEMENTS,
  ELEMENTS_INSTANCED,
}

export interface WebGl2ObjectAttributes {
  color: GlColor;
}

export interface WebGl2ObjectDrawAttrs {
  /** Specifies Webgl primitive type. */
  primitiveType: PrimitiveType;
  drawType: WebGl2ObjectDrawType;
  numElements: number;
  instanceCount?: number;
  indexes?: number[];
}

/**
 * Base class interface for the Webgl2 objects.
 * Describes draw primitive type, object attributes, uniforms and buffers to operate.
 * */
export abstract class WebGl2Object<AttributesType extends WebGl2ObjectAttributes = WebGl2ObjectAttributes> {
  /**
   * WebGl2 Program type.
   * Specifies program which responsible to draw the object, like `Default` or `Image`.
   * */
  abstract programType: WebGl2ProgramType;

  constructor(public readonly attributes: AttributesType) {}

  /**
   * @returns Uniform values for current object.
   */
  getUniforms(): WebGl2ProgramUniforms {
    return {
      u_color: this.attributes.color,
    };
  }

  abstract getIndexBuffer(): Uint16Array | undefined;

  /** Populate buffer bucket with object data based on attrubutes. */
  abstract getDataBuffer(): number[];

  getTexture(): TexImageSource | undefined {
    return undefined;
  }

  /**
   * Returns Webgl2 specific information.
   * Should be in sync with `drawType` property.
   * */
  abstract getDrawAttributes(): WebGl2ObjectDrawAttrs;
}
