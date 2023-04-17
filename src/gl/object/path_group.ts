import { GlProgram, GlObjectProps } from "./program";
import { v2 } from './types';

export interface GlPathGroupProps extends GlObjectProps {
  paths: v2[][];
}

export class GlPathGroup extends GlProgram {
  protected paths: v2[][];

  constructor(gl: WebGLRenderingContext, props: GlPathGroupProps) {
    super(gl, props);

    this.paths = props.paths;
  }

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLES;
  }

  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec3 a_position;
      attribute vec2 point_a, point_b, point_c;
      uniform float u_width;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      
      void main() {
        // Apply tranlation, rotation and scale.
        vec3 position = (u_matrix * a_position);
        
        // Apply resolution.
        vec3 zeroToOne = position / vec3(u_resolution, 1);
        vec3 zeroToTwo = zeroToOne * 2.0;
        vec3 clipSpace = zeroToTwo - 1.0;

        vec4 projection = vec4(clipSpace * vec3(1, -1, 1), 1);

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

        vec2 point = point_b + position.x * p0 + position.y * p1 + position.z * p2;
        gl_Position = projection * vec4(point, 0, 1);
      }
    `;
  }

  public getBufferAttrs(): Record<string, any> {
    const instanceMiterJoin = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    let points = [];

    for (const path of this.paths) {
      for (let i = 1; i < path.length; i++) {
        points.push(path[i - 1]);
        points.push(path[i]);
      }
    }
    points = points.flatMap(p => p);

    return {
      a_position: {
        numComponents: 3,
        data: instanceMiterJoin,
      },
      point_a: {
        numComponents: 2,
        data: points,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0
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
}
