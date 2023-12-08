import { mat3, vec4 } from 'gl-matrix';
import { WebGlProgram, ExtendedWebGLRenderingContext } from './program';
import { createShader, createProgram } from './program_utils';

const VERTEX_SHADER_SOURCE = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  attribute vec2 a_position;

  uniform mat3 u_matrix;
  uniform float u_zoom;

  float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
  }

  float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(QUARTER_PI + (lat * PI) / 360.0)))) / 360.0;
  }

  vec2 mercatorProject(vec2 lngLat) {
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
    gl_Position = vec4(applyMatrix(clipSpace(mercatorProject(a_position))), 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

export class PolygonProgram implements WebGlProgram {
  protected program: WebGLProgram;

  // buffers
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  // uniform locations
  protected u_matrixLocation: WebGLUniformLocation;
  protected u_colorLocation: WebGLUniformLocation;
  protected u_zoomLocation: WebGLUniformLocation;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER_SOURCE,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER_SOURCE
  ) {}

  init() {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.setupProgram();
    this.setupBuffer();
    this.setupUniforms();
  }

  protected setupProgram() {
    const gl = this.gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.vao = this.gl.createVertexArray();
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);
    this.a_positionBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.u_colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    this.u_zoomLocation = this.gl.getUniformLocation(this.program, 'u_zoom');
  }

  link() {
    this.gl.useProgram(this.program);
    this.gl.disable(this.gl.BLEND);
  }

  setMatrix(matrix: mat3) {
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, matrix);
  }

  setColor(color: vec4): void {
    this.gl.uniform4fv(this.u_colorLocation, color);
  }

  setZoom(zoom: number) {
    this.gl.uniform1f(this.u_zoomLocation, zoom);
  }

  bindBuffer(buffer: Float32Array) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.a_positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
  }

  draw(primitiveType: number = this.gl.TRIANGLES, offset: number = 0, numElements: number) {
    this.gl.bindVertexArray(this.vao);

    this.gl.drawArrays(primitiveType, offset, numElements);

    this.gl.bindVertexArray(null);
  }
}
