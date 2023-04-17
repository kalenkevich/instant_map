import { GlProgram, GlObjectProps } from "./program";
import { v2 } from './types';

export interface GlPathProps extends GlObjectProps {
  points: v2[];
}

export class GlPath extends GlProgram {
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

    this.points = props.points;
  }

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLES;
    // return this.gl.TRIANGLE_STRIP;
    // return this.gl.LINE_STRIP;
    // return this.gl.LINES;
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
        data: points.slice(2),
        divisor: 1,
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
