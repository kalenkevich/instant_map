import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays, setUniforms, drawBufferInfo, setBuffersAndAttributes } from 'twgl.js';
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

export interface GlUniforms {
  u_width: number;
  u_color: v4;
  u_resolution: [number, number];
  u_matrix: number[];
}

export enum GlProgramType {
  PROGRAM = 'PROGRAM',
  TRIANGLE = 'TRIANGLE',
  AREA = 'AREA',
  CIRCLE = 'CIRCLE',
  LINE = 'LINE',
  PATH = 'PATH',
  RECTANGLE = 'RECTANGLE'
}

let usedProgram: ProgramInfo | undefined;

export abstract class GlProgram {
  public requireExt: boolean = false;
  protected gl: WebGLRenderingContext;

  /** Color of the object to be painted. HSL format. */
  protected color: v4;
  protected lineWidth?: number;
  protected rotationInRadians: number;
  protected origin: v2;
  protected translation: v2;
  protected scale: v2;

  private uniformsCache?: GlUniforms; 

  protected constructor(props: GlProgramProps) {
    this.color = this.normalizeColor(props.color);
    this.lineWidth = props.lineWidth;
    this.rotationInRadians = props.rotationInRadians || 0;
    this.origin = props.origin || [0, 0];
    this.translation = props.translation || [0, 0];
    this.scale = props.scale || [1, 1];
  }

  public getColor(): v4 {
    return this.color;
  }

  public getLineWidth(): number {
    return this.lineWidth;
  }

  public getRotationInRadians(): number {
    return this.rotationInRadians;
  }

  public getOrigin(): v2 {
    return this.origin;
  }

  public getTranslation(): v2 {
    return this.translation;
  }

  public getScale(): v2 {
    return this.scale;
  }

  public setRotationInRadians(rotationInRadians: number) {
    this.rotationInRadians = rotationInRadians;
    this.uniformsCache = undefined;
  }

  public setOrigin(origin: v2) {
    this.origin = origin;
    this.uniformsCache = undefined;
  }

  public setTranslation(translation: v2) {
    this.translation = translation;
    this.uniformsCache = undefined;
  }

  public setScale(scale: v2) {
    this.scale = scale;
    this.uniformsCache = undefined;
  }

  public getPrimitiveType(gl: WebGLRenderingContext): GLenum {
    return gl.TRIANGLES;
  }

  public getType(): GlProgramType {
    return GlProgramType.PROGRAM;
  }

  public draw(gl: WebGLRenderingContext) {
    const programInfo = this.getProgramInfoInstance(gl);
    const buffer = this.getBufferInfo(gl);
    const uniforms = this.getUniforms(gl);

    if (programInfo !== usedProgram) {
      gl.useProgram(programInfo.program);
      this.consoleGlError(gl, 'Use program');
      usedProgram = programInfo;
    }

    setBuffersAndAttributes(gl, programInfo, buffer);
    this.consoleGlError(gl, 'setBuffersAndAttributes');

    setUniforms(programInfo, uniforms);
    this.consoleGlError(gl, 'setUniforms');

    const { offset, vertexCount, instanceCount } = this.getDrawBufferInfoOptions();
    drawBufferInfo(gl, buffer, this.getPrimitiveType(gl), vertexCount, offset, instanceCount);
    this.consoleGlError(gl, 'Draw');
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number } {
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
    if (this.programInfo) {
      return this.programInfo;
    }

    this.programInfo = createProgramInfo(gl, [this.getVertexShaderSource(), this.getFragmentShaderSource()]);

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
  }

  public static getProgramInfo(gl: WebGLRenderingContext): ProgramInfo {
    return this.programInfo;
  }

  public abstract getBufferAttrs(gl: WebGLRenderingContext): Record<string, any>;

  public getBufferInfo(gl: WebGLRenderingContext): BufferInfo {
    return createBufferInfoFromArrays(gl, this.getBufferAttrs(gl));
  }

  public getUniforms(gl: WebGLRenderingContext): GlUniforms {
    if (this.uniformsCache) {
      return this.uniformsCache;
    }

    return this.uniformsCache = {
      u_width: this.lineWidth,
      u_color: this.color,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_matrix: this.getMatrix(),
    };
  }

  public getMatrix(): number[] {
    const moveOriginMatrix = m3.translation(this.origin[0], this.origin[1]);
    const translationMatrix = m3.translation(this.translation[0], this.translation[1]);
    const rotationMatrix = m3.rotation(this.rotationInRadians);
    const scaleMatrix = m3.scaling(this.scale[0], this.scale[1]);
    const matrix = m3.multiply(translationMatrix, rotationMatrix);
    const scaledMatrix = m3.multiply(matrix, scaleMatrix);

    return m3.multiply(scaledMatrix, moveOriginMatrix);
  }

  public drawWithExt(...args: any[]) {}

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

  public consoleGlError(gl: WebGLRenderingContext, stage: string) {
    const glError = gl.getError();

    switch (glError) {
      case gl.NO_ERROR:
        return;
      case gl.INVALID_ENUM:
        return console.log(`GL stage: '${stage}', error: INVALID_ENUM`);
      case gl.INVALID_VALUE:
        return console.log(`GL stage: '${stage}', error: INVALID_VALUE`);
      case gl.INVALID_OPERATION:
        return console.log(`GL stage: '${stage}', error: INVALID_OPERATION`);
      case gl.OUT_OF_MEMORY:
        return console.log(`GL stage: '${stage}', error: OUT_OF_MEMORY`);
      case gl.CONTEXT_LOST_WEBGL:
        return console.log(`GL stage: '${stage}', error: CONTEXT_LOST_WEBGL`);
    }
  }
}