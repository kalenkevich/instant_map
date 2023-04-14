import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays } from "twgl.js";
import { m3 } from '../utils/m3';

export type v2 = [number, number];
export type v3 = [number, number, number];
export type v4 = [number, number, number, number];
export type GlColor = string | v3 | v4;

export interface GlObjectProps {
  color: GlColor;
  rotationInRadians?: number;
  translation?: v2;
  scale?: v2;
  lineWidth?: number;
}

export abstract class GlProgram {
  public requireExt: boolean = false;
  protected gl: WebGLRenderingContext;
  protected programInfo: ProgramInfo;
  private compiled: boolean = false;

  /** Color of the object to be painted. HSL format. */
  public color: v4;
  public lineWidth?: number;

  public rotationInRadians: number;
  public translation: v2;
  public scale: v2;

  protected constructor(gl: WebGLRenderingContext, props: GlObjectProps) {
    this.gl = gl;
    this.programInfo = null;
    this.color = this.normalizeColor(props.color);
    this.lineWidth = props.lineWidth;
    this.rotationInRadians = props.rotationInRadians || 0;
    this.translation = props.translation || [0, 0];
    this.scale = props.scale || [1, 1];
  }

  public compile(): ProgramInfo {
    if (this.compiled) {
      return this.programInfo;
    }

    this.programInfo = createProgramInfo(this.gl, [
      this.getVertexShaderSource(),
      this.getFragmentShaderSource(),
    ]);

    this.compiled = true;

    return this.programInfo;
  }

  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      void main() {
        vec2 position = (u_matrix * vec3(a_position, 1)).xy;
          
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;
  }

  public getFragmentShaderSource(): string {
    return `
      precision mediump float;
      uniform vec4 u_color;

      void main() {
        gl_FragColor = u_color;
      }
    `;
  };

  public abstract getBufferAttrs(): Record<string, any>;

  public getProgramInfo(): ProgramInfo {
    return this.programInfo;
  }

  public getBufferInfo(): BufferInfo {
    return createBufferInfoFromArrays(this.gl, this.getBufferAttrs());
  }

  public getUniforms(): Record<string, any> {
    const gl = this.gl;

    return {
      u_color: this.color,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_matrix: this.getMatrix(),
    };
  }

  public getMatrix() {
    const translationMatrix = m3.translation(this.translation[0], this.translation[1]);
    const rotationMatrix = m3.rotation(this.rotationInRadians);
    const scaleMatrix = m3.scaling(this.scale[0], this.scale[1]);
    const matrix = m3.multiply(translationMatrix, rotationMatrix);

    return m3.multiply(matrix, scaleMatrix);
  }

  public drawWithExt(...args: any[]) {}

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLES;
  }

  protected normalizeColor(color: GlColor): v4 {
    const typeErrorMessage = 'Color should be one of type string or rgb/rgba array';

    if (Array.isArray(color)) {
      if (color.length === 4) {
        return color as v4;
      }

      if (color.length === 3) {
        return [...color, 1.0] as v4;
      }

      throw new Error(typeErrorMessage);
    }

    if (typeof color === 'string') {

    }

    throw new Error(typeErrorMessage);
  }
}