import { ProgramInfo } from "twgl.js";
import { GlProgram, GlProgramProps } from "./program";
import { GlMultiProgram } from "./multi_program";
import { v2 } from './types';

export interface GlPathProps extends GlProgramProps {
  points: v2[];
}

export class GlPath extends GlMultiProgram {
  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.subPrograms = [
      new LineStripProgram(gl, props),
      new MiterLineCapProgram(gl, props),
    ];
  }
}

export class LineStripProgram extends GlProgram {
  protected points: v2[];

  protected segmentInstanceGeometry = [
    [0, -0.5],
    [1, -0.5],
    [1,  0.5],
    [0, -0.5],
    [1,  0.5],
    [0,  0.5]
  ];

  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  public getProgramInfoInstance(gl: WebGLRenderingContext): ProgramInfo {
    return LineStripProgram.compile(gl);
  }

  // Render basic lines with triangles.
  public static getVertexShaderSource(...args: any[]): string {
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
        offset: Float32Array.BYTES_PER_ELEMENT * 2
      },
    };
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number;} {
    return {
      offset: 0, // offset
      vertexCount: this.segmentInstanceGeometry.length, // num vertices per instance
      instanceCount: this.points.length - 1, // num instances
    };
  }
}

export class MiterLineCapProgram extends GlProgram {
  protected points: v2[];
  protected instanceMiterJoin = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  public getProgramInfoInstance(gl: WebGLRenderingContext): ProgramInfo {
    return MiterLineCapProgram.compile(gl);
  }

  // Render basic lines with triangles.
  public static getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec3 a_position;
      attribute vec2 point_a, point_b, point_c;
      uniform float u_width;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      void main() {
        vec2 tangent = normalize(normalize(point_c - point_b) + normalize(point_b - point_a));
        vec2 miter = vec2(-tangent.y, tangent.x);
        vec2 ab = point_b - point_a;
        vec2 cb = point_b - point_c;
        vec2 abNorm = normalize(vec2(-ab.y, ab.x));
        vec2 cbNorm = -normalize(vec2(-cb.y, cb.x));

        float sigma = sign(dot(ab + cb, miter));

        vec2 p0 = 0.5 * u_width * sigma * (sigma < 0.0 ? abNorm : cbNorm);
        vec2 p1 = 0.5 * miter * sigma * u_width / dot(miter, abNorm);
        vec2 p2 = 0.5 * u_width * sigma * (sigma < 0.0 ? cbNorm : abNorm);

        vec2 point = point_b + a_position.x * p0 + a_position.y * p1 + a_position.z * p2;

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
        numComponents: 3,
        data: this.instanceMiterJoin.flatMap(p => p),
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
        offset: Float32Array.BYTES_PER_ELEMENT * 2
      },
      point_c: {
        numComponents: 2,
        data: points,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4
      }
    };
  }

  public getDrawBufferInfoOptions(): { offset?: number; vertexCount?: number; instanceCount?: number;} {
    return {
      offset: 0, // offset
      vertexCount: this.instanceMiterJoin.length, // num vertices per instance
      instanceCount: this.points.length - 2, // num instances
    };
  }
}
