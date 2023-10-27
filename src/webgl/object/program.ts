import {
  Arrays,
  BufferInfo,
  ProgramInfo,
  createProgramInfo,
  createBufferInfoFromArrays,
  setUniforms,
  drawBufferInfo,
  setBuffersAndAttributes,
} from 'twgl.js';
import { m3 } from '../utils/m3';
import { GlColor, v2, v4 } from '../types';
import { GL_COLOR_BLACK } from '../colors';

export interface GlProgramProps {
  color?: GlColor;
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
  u_is_line: boolean;
}

export enum GlProgramType {
  DEFAULT = 0,
  TRIANGLE = DEFAULT,
  CIRCLE = DEFAULT,
  RECTANGLE = DEFAULT,
  LINE = DEFAULT,
  LINE_STRIP = DEFAULT,
  AREA = DEFAULT,
  TEXT = DEFAULT,
  MITER_LINE_CAP = 10,
  IMAGE = 11,
}

export type ProgramCache = {
  programs: {
    [key in GlProgramType]?: ProgramInfo;
  };
  currentProgram?: ProgramInfo;
  currentProgramType?: GlProgramType;
};

export abstract class GlProgram {
  public requireExt: boolean = false;

  /** Color of the object to be painted. HSL format. */
  protected color: v4;
  protected lineWidth?: number;
  protected rotationInRadians: number;
  protected origin: v2;
  protected translation: v2;
  protected scale: v2;

  protected uniformsCache?: GlUniforms;
  protected bufferInfoCache?: BufferInfo;

  abstract type: GlProgramType;

  protected constructor(props: GlProgramProps) {
    this.color = props.color ? this.normalizeColor(props.color) : (GL_COLOR_BLACK as v4);
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
    if (this.rotationInRadians === rotationInRadians) {
      return;
    }

    this.rotationInRadians = rotationInRadians;
    this.pruneCache();
  }

  public setOrigin(origin: v2) {
    if (this.origin[0] === origin[0] && this.origin[1] === origin[1]) {
      return;
    }

    this.origin = origin;
    this.pruneCache();
  }

  public setTranslation(translation: v2) {
    if (this.translation[0] === translation[0] && this.translation[1] === translation[1]) {
      return;
    }

    this.translation = translation;
    this.pruneCache();
  }

  public setScale(scale: v2) {
    if (this.scale[0] === scale[0] && this.scale[1] === scale[1]) {
      return;
    }

    this.scale = scale;
    this.pruneCache();
  }

  public getPrimitiveType(gl: WebGLRenderingContext): GLenum {
    return gl.TRIANGLES;
  }

  public pruneCache() {
    this.uniformsCache = undefined;
  }

  // Combute buffer info and uniforms
  public preheat(gl: WebGLRenderingContext) {
    this.getBufferInfo(gl);
    this.getUniforms(gl);
  }

  public draw(gl: WebGLRenderingContext, cache: ProgramCache) {
    const programInfo = this.getProgramInfo(gl, cache);
    const buffer = this.getBufferInfo(gl);
    const uniforms = this.getUniforms(gl);

    if (this.type !== cache.currentProgramType) {
      gl.useProgram(programInfo.program);
      cache.currentProgramType = this.type;
    }

    setBuffersAndAttributes(gl, programInfo, buffer);

    setUniforms(programInfo, uniforms);

    const { offset, vertexCount, instanceCount } = this.getDrawBufferInfoOptions();
    drawBufferInfo(gl, buffer, this.getPrimitiveType(gl), vertexCount, offset, instanceCount);
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number } {
    return {
      offset: undefined, // offset
      vertexCount: undefined, // num vertices per instance
      instanceCount: undefined, // num instances
    };
  }

  public getVertexShaderSource(...args: any[]): string {
    return `
      precision mediump float;
      attribute vec2 a_position;
      attribute vec2 point_a;
      attribute vec2 point_b;
      uniform bool u_is_line;
      uniform float u_width;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;

      vec2 get_position() {
        if (!u_is_line) {
          return a_position;
        }

        vec2 xBasis = point_b - point_a;
        vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

        return point_a + xBasis * a_position.x + yBasis * u_width * a_position.y;
      }

      void main() {
        vec2 pos = get_position();

        // Apply tranlation, rotation and scale.
        vec2 position = (u_matrix * vec3(pos, 1)).xy;
        
        // Apply resolution.
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
  }

  public getProgramInfo(gl: WebGLRenderingContext, cache: ProgramCache): ProgramInfo {
    if (cache.programs[this.type]) {
      return cache.programs[this.type];
    }

    return (cache.programs[this.type] = createProgramInfo(gl, [
      this.getVertexShaderSource(),
      this.getFragmentShaderSource(),
    ]));
  }

  public abstract getBufferAttrs(gl: WebGLRenderingContext): Arrays;

  public getBufferInfo(gl: WebGLRenderingContext): BufferInfo {
    if (this.bufferInfoCache) {
      return this.bufferInfoCache;
    }

    return (this.bufferInfoCache = createBufferInfoFromArrays(gl, this.getBufferAttrs(gl)));
  }

  public getUniforms(gl: WebGLRenderingContext): GlUniforms {
    if (this.uniformsCache) {
      return this.uniformsCache;
    }

    return (this.uniformsCache = {
      u_width: this.lineWidth,
      u_color: this.color,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_matrix: this.getMatrix(),
      u_is_line: false,
    });
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
