import { GlProgram, GlObjectProps } from "./program";
import { v2 } from './types';

export interface GlPathProps extends GlObjectProps {
  points: v2[];
}

export class GlPath extends GlProgram {
  protected points: v2[];

  constructor(gl: WebGLRenderingContext, props: GlPathProps) {
    super(gl, props);

    this.points = props.points;
  }

  public get primitiveType(): GLenum {
    return this.gl.TRIANGLES;
    //return this.gl.TRIANGLE_STRIP;
    //return this.gl.LINE_STRIP;
  }

  // public getBufferAttrs(): Record<string, any> {
  //   const points = [];
  //   for (let i = 1; i < this.points.length; i++) {
  //     points.push(this.points[i - 1]);
  //     points.push(this.points[i]);
  //   }
  //   return {
  //     a_position: {
  //       numComponents: 2,
  //       data: points.flatMap(p => p),
  //     },
  //   };
  // }

  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 a_position;
      attribute vec3 a_miter_position;
      attribute vec2 point_a, point_b, point_c;
      uniform float u_width;
      uniform vec2 u_resolution;
      uniform mat3 u_matrix;
      uniform mat4 u_projection;
      
      void main() {
        // // Apply tranlation, rotation and scale.
        // // vec3 position = (u_matrix * a_position);
        // vec2 position = (u_matrix * vec3(a_position, 1)).xy;
        // // vec3 position = (u_matrix * a_position);
        
        // // Apply resolution.
        // vec2 zeroToOne = position / u_resolution;
        // vec2 zeroToTwo = zeroToOne * 2.0;
        // vec2 clipSpace = zeroToTwo - 1.0;

        // gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        // // gl_Position = u_projection * vec4(position, 1);

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

        vec2 point = point_b + a_miter_position.x * p0 + a_miter_position.y * p1 + a_miter_position.z * p2;
        gl_Position = u_projection * vec4(point, 0, 1);
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

    for (let i = 1; i < this.points.length; i++) {
      points.push(this.points[i - 1]);
      points.push(this.points[i]);
    }
    points = points.flatMap(p => p);

    return {
      a_position: {
        numComponents: 2,
        data: points,
      },
      a_miter_position: {
        numComponents: 3,
        data: instanceMiterJoin,
        divisor: 0,
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
      },
      //count: instanceMiterJoin.length,
    };
  }
}
