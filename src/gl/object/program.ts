import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays } from "twgl.js";

export type v2 = [number, number];
export type v3 = [number, number, number];
export type v4 = [number, number, number, number];
export type GlColor = string | v3 | v4;

export interface GlObjectProps {
  color: GlColor;
}

export abstract class GlProgram {
  public requireExt: boolean = false;
  protected gl: WebGLRenderingContext;
  protected programInfo: ProgramInfo;
  private compiled: boolean = false;

  /** Color of the object to be painted. HSL format. */
  protected color: v4;

  protected constructor(gl: WebGLRenderingContext, props: GlObjectProps) {
    this.gl = gl;
    this.programInfo = null;
    this.color = this.normalizeColor(props.color);
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

  public abstract getVertexShaderSource(): string;

  public getFragmentShaderSource(): string {
    return `
      precision mediump float;
      uniform vec4 color;

      void main() {
        gl_FragColor = color;
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
      color: this.color,
      resolution: [gl.canvas.width, gl.canvas.height],
    };
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