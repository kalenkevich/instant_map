import { PolygonProgram } from './polygon_program';
import { ExtendedWebGLRenderingContext } from './program';

const POSITION_BUFFER = new Float32Array([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);

const VERTEX_SHADER_SOURCE = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  attribute vec2 a_position;
  attribute vec3 point_a;
  attribute vec3 point_b;

  uniform mat3 u_matrix;
  uniform vec4 u_color;
  uniform float u_line_width;

  varying vec4 v_line_color;

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
      v_line_color = vec4(0, 0, 0, 0);
    } else {
      v_line_color = u_color;
    }

    vec2 point_a_projected = mercatorProject(point_a);
    vec2 point_b_projected = mercatorProject(point_b);
    vec2 xBasis = point_b_projected - point_a_projected;
    vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
    vec2 pos = point_a_projected + xBasis * a_position.x + yBasis * u_line_width * a_position.y;

    gl_Position = vec4(applyMatrix(clipSpace(pos)), 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  // uniform vec4 u_color;
  varying vec4 v_line_color;

  void main() {
    gl_FragColor = v_line_color;
  }
`;

export class LineProgram extends PolygonProgram {
  // buffers
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  protected point_aBuffer: WebGLBuffer;
  protected point_aAttributeLocation: number = 1;

  protected point_bBuffer: WebGLBuffer;
  protected point_bAttributeLocation: number = 2;

  // uniform locations
  protected u_line_widthLocation: WebGLUniformLocation;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER_SOURCE,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER_SOURCE
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer(): void {
    this.vao = this.gl.createVertexArray();

    this.gl.bindVertexArray(this.vao);
    this.a_positionBuffer = this.gl.createBuffer();
    this.gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.a_positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, POSITION_BUFFER, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, true, 0, 0);

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
    this.gl.bindVertexArray(null);
  }

  protected setupUniforms(): void {
    super.setupUniforms();
    this.u_line_widthLocation = this.gl.getUniformLocation(this.program, 'u_line_width');
  }

  link() {
    this.gl.useProgram(this.program);

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  setLineWidth(lineWidth: number = 2) {
    this.gl.uniform1f(this.u_line_widthLocation, lineWidth);
  }

  bindBuffer(buffer: Float32Array): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_aBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.point_bBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
  }

  draw(primitiveType: number, offset: number, numElements: number): void {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArraysInstanced(primitiveType, offset, 6, numElements - 1);
    this.gl.bindVertexArray(null);
  }
}
