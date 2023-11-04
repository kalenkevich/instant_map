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
  resolution: Vector2;
  origin?: Vector2;
  translation?: Vector2;
  scale?: Vector2;
  rotationInRadians?: number;
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
      u_resolution: this.attributes.resolution,
      u_matrix: this.getMatrix(),
    };
  }

  abstract getIndexBuffer(): Uint16Array | undefined;

  /** Populate buffer bucket with object data based on attrubutes. */
  abstract getDataBuffer(): Float32Array;

  /**
   * Returns Webgl2 specific information.
   * Should be in sync with `drawType` property.
   * */
  abstract getDrawAttributes(): WebGl2ObjectDrawAttrs;

  /** Creates transformation matrix for object. */
  protected getMatrix(): Mat3 {
    const { origin = [0, 0], translation = [0, 0], scale = [1, 1], rotationInRadians = 0 } = this.attributes;

    const moveOriginMatrix = m3.translation(origin[0], origin[1]);
    const translationMatrix = m3.translation(translation[0], translation[1]);
    const rotationMatrix = m3.rotation(rotationInRadians);
    const scaleMatrix = m3.scaling(scale[0], scale[1]);
    const matrix = m3.multiply(translationMatrix, rotationMatrix);
    const scaledMatrix = m3.multiply(matrix, scaleMatrix);

    return m3.multiply(scaledMatrix, moveOriginMatrix) as Mat3;
  }
}
