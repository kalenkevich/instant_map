import { ProgramInfo } from 'twgl.js';
import { GlProgram, GlProgramProps } from './program';
import { v2 } from '../types';

export interface GlLineProps extends GlProgramProps {
  p1: v2;
  p2: v2;
}

export interface GlLineStripProps extends GlProgramProps {
  points: v2[];
}

export class WebGlLine extends GlProgram {
  line: WebGlNativeLine | WebGlLineStrip;

  constructor(props: GlLineProps) {
    super(props);

    if (props.lineWidth && props.lineWidth > 1) {
      this.line = new WebGlLineStrip({
        points: [props.p1, props.p2],
        color: props.color,
        rotationInRadians: props.rotationInRadians,
        origin: props.origin,
        translation: props.translation,
        scale: props.scale,
        lineWidth: props.lineWidth,
      });
    } else {
      this.line = new WebGlNativeLine(props);
    }
  }

  public setRotationInRadians(rotationInRadians: number) {
    this.rotationInRadians = rotationInRadians;
    this.line.setRotationInRadians(rotationInRadians);
  }

  public setOrigin(origin: v2) {
    this.origin = origin;
    this.line.setOrigin(origin);
  }

  public setTranslation(translation: v2) {
    this.translation = translation;
    this.line.setTranslation(translation);
  }

  public setScale(scale: v2) {
    this.scale = scale;
    this.line.setScale(scale);
  }

  public draw(gl: WebGLRenderingContext) {
    return this.line.draw(gl);
  }

  public getBufferAttrs(): Record<string, any> {
    return this.line.getBufferAttrs();
  }
}

/**
 * Class to render Lines using default WebGL API.
 * It support only lineWidth = 1.
 */
export class WebGlNativeLine extends GlProgram {
  protected p1: v2;
  protected p2: v2;

  constructor(props: GlLineProps) {
    super(props);

    this.p1 = props.p1;
    this.p2 = props.p2;
  }

  public getPrimitiveType(gl: WebGLRenderingContext): GLenum {
    return gl.LINES;
  }

  public getBufferAttrs(): Record<string, any> {
    const p1 = this.p1;
    const p2 = this.p2;
    const p3 = [p1[0], p1[1]];
    const p4 = [p2[0], p2[1]];

    return {
      a_position: {
        numComponents: 2,
        data: [...p1, ...p2, ...p3, ...p3, ...p2, ...p4],
      },
    };
  }
}

/**
 * Class to render LineStrips using default WebGL API.
 * It support only lineWidth = 1.
 */
export class WebGlNativeLineStrip extends GlProgram {
  protected points: v2[];

  constructor(props: GlLineStripProps) {
    super(props);
    this.points = props.points;
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  public getPrimitiveType(gl: WebGLRenderingContext): GLenum {
    return gl.LINE_STRIP;
  }

  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, any> {
    return {
      a_position: {
        numComponents: 2,
        data: this.points.flatMap(p => p),
      },
    };
  }
}

/**
 * Class to render Lines using 2 triangles.
 * Check out more here: https://wwwtyro.net/2019/11/18/instanced-lines.html
 */
export class WebGlLineStrip extends GlProgram {
  protected points: v2[];

  protected segmentInstanceGeometry = [
    [0, -0.5],
    [1, -0.5],
    [1, 0.5],
    [0, -0.5],
    [1, 0.5],
    [0, 0.5],
  ];

  constructor(props: GlLineStripProps) {
    super(props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  // Render basic lines with triangles.
  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 a_position;
      attribute vec2 point_a, point_b;
      uniform float u_width;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      void main() {
        vec2 xBasis = point_b - point_a;
        vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
        vec2 point = point_a + xBasis * a_position.x + yBasis * u_width * a_position.y;

        // Apply tranlation, rotation and scale.
        vec2 position = (u_matrix * vec3(point, 1)).xy;
        
        // Apply resolution.
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;
  }

  public getBufferAttrs(): Record<string, any> {
    const points = this.points.flatMap(p => p);

    return {
      a_position: {
        numComponents: 2,
        data: this.segmentInstanceGeometry.flatMap(p => p),
        divisor: 0,
      },
      point_a: {
        numComponents: 2,
        data: points,
        divisor: 1,
      },
      point_b: {
        numComponents: 2,
        data: points,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
    };
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number } {
    return {
      offset: 0, // offset
      vertexCount: this.segmentInstanceGeometry.length, // num vertices per instance
      instanceCount: this.points.length - 1, // num instances
    };
  }
}
