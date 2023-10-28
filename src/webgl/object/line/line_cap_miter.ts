import { GlProgram, GlProgramType, BufferAttrs } from '../program';
import { v2 } from '../../types';
import { GlLineStripProps } from './line_strip';

/**
 * Class to render Miter Line Cap
 * Check out more here: https://wwwtyro.net/2019/11/18/instanced-lines.html
 */
export class WebGlMiterLineCap extends GlProgram {
  type = GlProgramType.MITER_LINE_CAP;

  protected points: v2[];
  protected positionBuffer: Float32Array;

  constructor(props: GlLineStripProps) {
    super(props);

    this.lineWidth = props.lineWidth || 2;
    this.points = props.points;

    this.positionBuffer = new Float32Array(18);
    this.positionBuffer.set([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1]);
  }

  public setPoints(points: v2[]) {
    this.points = points;
  }

  public vertexShaderSource = `
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

  public getBufferAttrs(): BufferAttrs {
    const pointsBuffer = new Float32Array(this.points.length * 2);

    let offset = 0;
    for (const p of this.points) {
      pointsBuffer.set(p, offset);
      offset += 2;
    }

    return {
      type: 'arrays',
      a_position: {
        numComponents: 3,
        data: this.positionBuffer,
        divisor: 0,
      },
      point_a: {
        numComponents: 2,
        data: pointsBuffer,
        divisor: 1,
      },
      point_b: {
        numComponents: 2,
        data: pointsBuffer,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
      point_c: {
        numComponents: 2,
        data: pointsBuffer,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4,
      },
      numElements: 18,
      instanceCount: this.points.length - 2,
    };
  }

  protected a_positionLocation = 0;
  protected point_aLocation = 1;
  protected point_bLocation = 2;
  protected point_cLocation = 3;
  protected setBuffers(gl: WebGLRenderingContext, buffers: BufferAttrs) {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_position.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionLocation);
    gl.vertexAttribPointer(
      this.a_positionLocation,
      buffers.a_position.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.a_position.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.a_positionLocation, buffers.a_position.divisor || 0);
    }

    const pointABuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointABuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.point_a.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.point_aLocation);
    gl.vertexAttribPointer(
      this.point_aLocation,
      buffers.point_a.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.point_a.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.point_aLocation, buffers.point_a.divisor || 0);
    }

    const pointBBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.point_b.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.point_bLocation);
    gl.vertexAttribPointer(
      this.point_bLocation,
      buffers.point_b.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.point_b.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.point_bLocation, buffers.point_b.divisor || 0);
    }

    const pointCBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointCBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.point_b.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.point_cLocation);
    gl.vertexAttribPointer(
      this.point_cLocation,
      buffers.point_c.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.point_c.offset || 0
    );
    // @ts-ignore
    if (gl.vertexAttribDivisor) {
      // @ts-ignore
      gl.vertexAttribDivisor(this.point_cLocation, buffers.point_c.divisor || 0);
    }
  }
}
