import { mat3, vec4 } from 'gl-matrix';
import { WebGlProgram, ExtendedWebGLRenderingContext } from './program';
import { createShader, createProgram } from './program_utils';

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;

  uniform mat3 u_matrix;

  void main() {
    vec2 position = (u_matrix * vec3(a_position, 1)).xy;

    gl_Position = vec4(position, 0, 1);
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
  }

  protected setupBuffer() {
    this.a_positionBuffer = this.gl.createBuffer();
  }

  protected setupUniforms() {
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.u_colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
  }

  link() {
    this.gl.useProgram(this.program);
  }

  setMatrix(matrix: mat3) {
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, matrix);
  }

  setColor(color: vec4): void {
    this.gl.uniform4fv(this.u_colorLocation, color);
  }

  bindBuffer(
    buffer: Float32Array,
    size: number = 0,
    type: number = this.gl.FLOAT,
    normalize: boolean = false,
    stride: number = 0,
    offset: number = 0
  ) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    gl.vertexAttribPointer(this.a_positionAttributeLocation, size, type, normalize, stride, offset);
  }

  draw(primitiveType: number = this.gl.TRIANGLES, offset: number = 0, numElements: number) {
    this.gl.drawArrays(primitiveType, offset, numElements);
  }
}
