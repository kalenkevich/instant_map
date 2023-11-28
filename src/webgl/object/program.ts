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
  u_color?: GlUniform<[number, number, number, number]>;
  u_resolution: GlUniform<[number, number]>;
  u_matrix: GlUniform<number[]>;
  u_line_width: GlUniform<number>;
  u_is_line: GlUniform<boolean>;
  u_image: GlUniform<number>;
}

export interface GlUniform<T> {
  value: T;
  location: WebGLUniformLocation;
}

export interface BufferAttrs {
  type: 'arrays' | 'elements';
  a_position: {
    numComponents: number;
    data: Float32Array;
    offset?: number;
    divisor?: number;
  };
  point_a?: {
    numComponents: number;
    data: Float32Array;
    offset?: number;
    divisor?: number;
  };
  point_b?: {
    numComponents: number;
    data: Float32Array;
    offset?: number;
    divisor?: number;
  };
  point_c?: {
    numComponents: number;
    data: Float32Array;
    offset?: number;
    divisor?: number;
  };
  a_texCoord?: {
    numComponents: number;
    data: Float32Array;
    offset?: number;
    divisor?: number;
  };
  numElements: number;
  indices?: number[];
  offset?: number;
  instanceCount?: number;
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
    [key in GlProgramType]?: WebGLProgram;
  };
  currentProgram?: WebGLProgram;
  currentProgramType?: GlProgramType;
};

export abstract class GlProgram {
  /** Color of the object to be painted. HSL format. */
  protected color: v4;
  protected lineWidth?: number;
  protected rotationInRadians: number;
  protected origin: v2;
  protected translation: v2;
  protected scale: v2;

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
    this.bufferAttrsCache = undefined;
  }

  // Combute buffer info and uniforms
  public preheat(gl: WebGLRenderingContext, cache: ProgramCache) {
    const program = this.getProgram(gl, cache);

    this.bufferAttrsCache = this.getBufferAttrs(gl);
    this.getUniforms(gl, program);
  }

  protected bufferAttrsCache?: BufferAttrs;
  public draw(gl: WebGLRenderingContext, cache: ProgramCache) {
    const program = this.getProgram(gl, cache);
    if (this.type !== cache.currentProgramType) {
      gl.useProgram(program);
      cache.currentProgramType = this.type;
    }

    const bufferAttrs = this.bufferAttrsCache || this.getBufferAttrs(gl);
    if (!this.bufferAttrsCache) {
      this.bufferAttrsCache = bufferAttrs;
    }
    this.setBuffers(gl, bufferAttrs);
    this.setUniforms(gl, program);

    const primitiveType = this.getPrimitiveType(gl);
    const offset = bufferAttrs.offset || 0;

    if (bufferAttrs.type === 'arrays') {
      if (bufferAttrs.instanceCount) {
        // @ts-ignore
        gl.drawArraysInstanced(primitiveType, offset, bufferAttrs.numElements, bufferAttrs.instanceCount);
      } else {
        gl.drawArrays(primitiveType, offset, bufferAttrs.numElements);
      }
    } else {
      if (bufferAttrs.instanceCount) {
        // @ts-ignore
        gl.drawElementsInstanced(
          primitiveType,
          bufferAttrs.numElements,
          gl.UNSIGNED_SHORT,
          offset,
          bufferAttrs.instanceCount
        );
      } else {
        gl.drawElements(primitiveType, bufferAttrs.numElements, gl.UNSIGNED_SHORT, offset);
      }
    }
    // gl.flush();
  }

  public vertexShaderSource = `
    precision mediump float;

    attribute vec2 a_position;
    attribute vec2 point_a;
    attribute vec2 point_b;
    uniform bool u_is_line;
    uniform float u_line_width;
    uniform vec2 u_resolution;
    uniform mat3 u_matrix;

    vec2 get_position() {
      if (!u_is_line) {
        return a_position;
      }

      vec2 xBasis = point_b - point_a;
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

      return point_a + xBasis * a_position.x + yBasis * u_line_width * a_position.y;
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

  public fragmentShaderSource = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
  `;

  public getProgram(gl: WebGLRenderingContext, cache: ProgramCache): WebGLProgram {
    if (cache.programs[this.type]) {
      return cache.programs[this.type];
    }

    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, this.vertexShaderSource);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, this.fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    return (cache.programs[this.type] = program);
  }

  public abstract getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs;

  protected a_positionLocation = 0;
  protected point_aLocation = 1;
  protected point_bLocation = 2;
  protected setBuffers(gl: WebGLRenderingContext, buffers: BufferAttrs) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_position.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionLocation);
    gl.vertexAttribPointer(this.a_positionLocation, buffers.a_position.numComponents, gl.FLOAT, true, 8, 0);
  }

  protected isLine = false;
  protected u_colorLocation?: WebGLUniformLocation;
  protected u_resolutionLocation?: WebGLUniformLocation;
  protected u_matrixLocation?: WebGLUniformLocation;
  protected u_line_widthLocation?: WebGLUniformLocation;
  protected u_is_lineLocation?: WebGLUniformLocation;
  protected u_imageLocation?: WebGLUniformLocation;

  protected getUniforms(gl: WebGLRenderingContext, program: WebGLProgram): GlUniforms {
    if (!this.u_colorLocation) {
      this.u_colorLocation = gl.getUniformLocation(program, 'u_color');
    }
    if (!this.u_resolutionLocation) {
      this.u_resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    }
    if (!this.u_matrixLocation) {
      this.u_matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    }
    if (!this.u_line_widthLocation) {
      this.u_line_widthLocation = gl.getUniformLocation(program, 'u_line_width');
    }
    if (!this.u_is_lineLocation) {
      this.u_is_lineLocation = gl.getUniformLocation(program, 'u_is_line');
    }
    if (!this.u_imageLocation) {
      this.u_imageLocation = gl.getUniformLocation(program, 'u_image');
    }

    return {
      u_color: {
        value: this.color,
        location: this.u_colorLocation,
      },
      u_resolution: {
        value: [gl.canvas.width, gl.canvas.height],
        location: this.u_resolutionLocation,
      },
      u_matrix: {
        value: this.getMatrix(),
        location: this.u_matrixLocation,
      },
      u_line_width: {
        value: this.lineWidth,
        location: this.u_line_widthLocation,
      },
      u_is_line: {
        value: this.isLine,
        location: this.u_is_lineLocation,
      },
      u_image: {
        value: 0,
        location: this.u_imageLocation,
      },
    };
  }

  protected setUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
    const uniforms = this.getUniforms(gl, program);

    gl.uniform4fv(uniforms.u_color.location, uniforms.u_color.value);
    gl.uniform2fv(uniforms.u_resolution.location, uniforms.u_resolution.value);
    gl.uniformMatrix3fv(uniforms.u_matrix.location, false, uniforms.u_matrix.value);
    gl.uniform1f(uniforms.u_line_width.location, uniforms.u_line_width.value);
    gl.uniform1i(uniforms.u_is_line.location, uniforms.u_is_line.value ? 1 : 0);
    gl.uniform1i(uniforms.u_image.location, uniforms.u_image.value);
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
