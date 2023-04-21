import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays, setUniforms, drawBufferInfo, setBuffersAndAttributes } from "twgl.js";
import { m3 } from '../utils/m3';
import { GlColor, v2, v4 } from '../types';

export interface GlProgramProps {
  color: GlColor;
  rotationInRadians?: number;
  origin?: v2;
  translation?: v2;
  scale?: v2;
  lineWidth?: number;
}

let usedProgram: ProgramInfo | undefined;

export abstract class GlProgram {
  public requireExt: boolean = false;
  protected gl: WebGLRenderingContext;

  /** Color of the object to be painted. HSL format. */
  public color: v4;
  public lineWidth?: number;

  public rotationInRadians: number;
  public origin: v2;
  public translation: v2;
  public scale: v2;

  protected constructor(gl: WebGLRenderingContext, props: GlProgramProps) {
    this.gl = gl;
    this.color = this.normalizeColor(props.color);
    this.lineWidth = props.lineWidth;
    this.rotationInRadians = props.rotationInRadians || 0;
    this.origin = props.origin || [0, 0];
    this.translation = props.translation || [0, 0];
    this.scale = props.scale || [1, 1];
  }

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLES;
  }

  public draw(gl: WebGLRenderingContext) {
    const programInfo = this.getProgramInfoInstance(gl);
    const buffer = this.getBufferInfo();
    const uniforms = this.getUniforms();

    if (programInfo !== usedProgram) {
      gl.useProgram(programInfo.program);
      usedProgram = programInfo;
    }
    this.consoleGlError('Use program');

    setBuffersAndAttributes(gl, programInfo, buffer);
    this.consoleGlError('setBuffersAndAttributes');

    setUniforms(programInfo, uniforms);
    this.consoleGlError('setUniforms');

    const { offset, vertexCount, instanceCount } = this.getDrawBufferInfoOptions();
    drawBufferInfo(gl, buffer, this.primitiveType, vertexCount, offset, instanceCount);
    this.consoleGlError('Draw');
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number; } {
    return {
      offset: undefined, // offset
      vertexCount: undefined, // num vertices per instance
      instanceCount: undefined, // num instances
    };
  }

  public getProgramInfoInstance(gl: WebGLRenderingContext): ProgramInfo {
    return GlProgram.compile(gl);
  }

  private static programInfo: ProgramInfo;

  public static compile(gl: WebGLRenderingContext): ProgramInfo {
    this.programInfo = createProgramInfo(gl, [
      this.getVertexShaderSource(),
      this.getFragmentShaderSource(),
    ]);

    return this.programInfo;
  }

  public static getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      void main() {
        // Apply tranlation, rotation and scale.
        vec2 position = (u_matrix * vec3(a_position, 1)).xy;
        
        // Apply resolution.
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;
  }

  public static getFragmentShaderSource(): string {
    return `
      precision mediump float;
      uniform vec4 u_color;

      void main() {
        gl_FragColor = u_color;
      }
    `;
  };

  public static getProgramInfo(): ProgramInfo {
    return this.programInfo;
  }

  public abstract getBufferAttrs(): Record<string, any>;

  public getBufferInfo(): BufferInfo {
    return createBufferInfoFromArrays(this.gl, this.getBufferAttrs());
  }

  public getUniforms(): Record<string, any> {
    const gl = this.gl;

    return {
      u_width: this.lineWidth,
      u_color: this.color,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_matrix: this.getMatrix(),
    };
  }

  public getMatrix() {
    const moveOriginMatrix = m3.translation(this.origin[0], this.origin[1]);
    const translationMatrix = m3.translation(this.translation[0], this.translation[1]);
    const rotationMatrix = m3.rotation(this.rotationInRadians);
    const scaleMatrix = m3.scaling(this.scale[0], this.scale[1]);
    const matrix = m3.multiply(translationMatrix, rotationMatrix);
    const scaledMatrix = m3.multiply(matrix, scaleMatrix);

    return m3.multiply(scaledMatrix, moveOriginMatrix)
  }

  public drawWithExt(...args: any[]) { }

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

  public consoleGlError(stage: string) {
    const gl = this.gl;
    const glError = gl.getError();

    switch (glError) {
      case gl.NO_ERROR: return;
      case gl.INVALID_ENUM: return console.log(`GL stage: '${stage}', error: INVALID_ENUM`);
      case gl.INVALID_VALUE: return console.log(`GL stage: '${stage}', error: INVALID_VALUE`);
      case gl.INVALID_OPERATION: return console.log(`GL stage: '${stage}', error: INVALID_OPERATION`);
      case gl.OUT_OF_MEMORY: return console.log(`GL stage: '${stage}', error: OUT_OF_MEMORY`);
      case gl.CONTEXT_LOST_WEBGL: return console.log(`GL stage: '${stage}', error: CONTEXT_LOST_WEBGL`);
    }
  }
}