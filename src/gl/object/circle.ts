import { ProgramInfo, getTypedArrayTypeForGLType } from "twgl.js";
import { GlProgram, GlProgramProps } from "./program";
import { v2 } from '../types';

export interface GlCircleProps extends GlProgramProps {
  p: v2;
  radius: number;
}

export class GlCircle extends GlProgram {
  protected p: v2;
  protected radius: number;

  constructor(gl: WebGLRenderingContext, props: GlCircleProps) {
    super(gl, props);

    this.p = props.p;
    this.radius = props.radius;
  }

  public getProgramInfoInstance(gl: WebGLRenderingContext): ProgramInfo {
    return GlCircle.compile(gl);
  }

  public static getVertexShaderSource(...args: any[]): string {
    return `
      uniform vec2 u_resolution;
      attribute vec2 a_position;
      attribute vec2 a_center;
      attribute float a_radius;
      varying vec2 v_center;
      varying vec2 v_resolution;
      varying float v_radius;

      void main() {
        vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;
        gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);
    
        v_radius = a_radius;
        v_center = a_center;
        v_resolution = u_resolution;
      }
    `;
  }

  public getFragmentShaderSource(): string {
    return `
      precision mediump float;
      uniform vec4 u_color;
      varying vec2 v_center;
      varying vec2 v_resolution;
      varying float v_radius;

      void main() {
        float x = gl_FragCoord.x;
        float y = v_resolution[1] - gl_FragCoord.y;
    
        float dx = v_center[0] - x;
        float dy = v_center[1] - y;
        float distance = sqrt(dx*dx + dy*dy);
    
        if (distance > v_radius)
          discard;
        else
          gl_FragColor = u_color;
      }
    `;
  }

  public getBufferAttrs(...args: any[]): Record<string, any> {
    const circle = { x: this.p[0], y: this.p[1], r: this.radius };
    const data = [
      circle.x - circle.r,
      circle.y - circle.r,
      circle.x,
      circle.y,
      circle.r,

      circle.x + (1 + Math.sqrt(2)) * circle.r,
      circle.y - circle.r,
      circle.x,
      circle.y,
      circle.r,

      circle.x - circle.r,
      circle.y + (1 + Math.sqrt(2)) * circle.r,
      circle.x,
      circle.y,
      circle.r,
    ];

    return {
      a_position: {
        numComponents: 2,
        data,
      },
      a_center: {
        numComponents: 2,
        data: this.p,
        offset: 8,
      },
      a_radius: {
        numComponents: 1,
        data: [this.radius],
        offset: 16,
      },
    };
  }
}