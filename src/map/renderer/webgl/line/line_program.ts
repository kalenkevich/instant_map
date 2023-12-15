import { WebGlLineBufferredGroup } from '../webgl_map_object';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';

const POSITION_BUFFER = new Float32Array([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);

const VERTEX_SHADER_SOURCE = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  uniform mat3 u_matrix;
  uniform float u_zoom;

  attribute vec2 a_position;
  attribute vec3 point_a;
  attribute vec3 point_b;
  attribute vec4 a_color;
  attribute float a_width;

  varying vec4 v_color;

  float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
  }

  float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(QUARTER_PI + (lat * PI) / 360.0)))) / 360.0;
  }

  vec2 mercatorProject(vec3 lngLat) {
    float x = mercatorXfromLng(lngLat.x);
    float y = mercatorYfromLat(lngLat.y);

    return vec2(x, y);
  }

  vec2 clipSpace(vec2 position) {
    return vec2(-1.0 + position.x * 2.0, 1.0 - position.y * 2.0);
  }

  vec2 applyMatrix(vec2 position) {
    return (u_matrix * vec3(position, 1)).xy;
  }

  void main() {
    if (point_a.z == -1.0) {
      // trasparent
      v_color = vec4(0, 0, 0, 0);
    } else {
      v_color = a_color;
    }

    vec2 point_a_projected = mercatorProject(point_a);
    vec2 point_b_projected = mercatorProject(point_b);
    vec2 xBasis = point_b_projected - point_a_projected;
    vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
    vec2 pos = point_a_projected + xBasis * a_position.x + yBasis * a_width * a_position.y;

    gl_Position = vec4(applyMatrix(clipSpace(pos)), 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

export class LineProgram extends ObjectProgram {
  // buffers
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  protected point_aBuffer: WebGLBuffer;
  protected point_aAttributeLocation: number = 1;

  protected point_bBuffer: WebGLBuffer;
  protected point_bAttributeLocation: number = 2;

  protected a_colorBuffer: WebGLBuffer;
  protected a_colorAttributeLocation: number = 3;

  protected a_widthBuffer: WebGLBuffer;
  protected a_widthAttributeLocation: number = 4;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER_SOURCE,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER_SOURCE
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer(): void {
    const gl = this.gl;

    this.gl.bindVertexArray(this.vao);

    this.a_positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.a_positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, POSITION_BUFFER, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, true, 0, 0);
    this.gl.vertexAttribDivisor(this.a_positionAttributeLocation, 0);

    this.point_aBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_aAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.vertexAttribPointer(this.point_aAttributeLocation, 3, this.gl.FLOAT, true, 0, 0);
    this.gl.vertexAttribDivisor(this.point_aAttributeLocation, 1);

    this.point_bBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.point_bAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    this.gl.vertexAttribPointer(
      this.point_bAttributeLocation,
      3,
      this.gl.FLOAT,
      true,
      0,
      Float32Array.BYTES_PER_ELEMENT * 3
    );
    this.gl.vertexAttribDivisor(this.point_bAttributeLocation, 1);

    this.a_colorBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.vertexAttribPointer(this.a_colorAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(this.a_colorAttributeLocation, 1);

    this.a_widthBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_widthAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_widthBuffer);
    gl.vertexAttribPointer(this.a_widthAttributeLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(this.a_widthAttributeLocation, 1);

    this.gl.bindVertexArray(null);
  }

  link() {
    this.gl.useProgram(this.program);

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  drawObjectGroup(lineGroup: WebGlLineBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, lineGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, lineGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineGroup.color.buffer as Float32Array, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_widthBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineGroup.width.buffer as Float32Array, gl.STATIC_DRAW);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, POSITION_BUFFER.length / 2, lineGroup.numElements - 1);

    gl.bindVertexArray(null);
  }
}
