import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlCircleProps extends GlObjectProps {
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

  public getVertexShaderSource(...args: any[]): string {
    return `
      uniform vec2 resolution;
      attribute vec2 position;
      attribute vec2 center;
      attribute float radius;
      varying vec2 v_center;
      varying vec2 v_resolution;
      varying float v_radius;

      void main() {
        vec2 clipspace = position / resolution * 2.0 - 1.0;
        gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);
    
        v_radius = radius;
        v_center = center;
        v_resolution = resolution;
      }
    `;
  }

  public getFragmentShaderSource(): string {
    return `
      precision mediump float;
      uniform vec4 color;
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
          gl_FragColor = color;
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
      numElements: 3,
      position: {
        numComponents: 2,
        data,
      },
      center: {
        numComponents: 2,
        data: this.p,
      },
      radius: {
        numComponents: 1,
        data: this.radius,
      },
    };
  }
}