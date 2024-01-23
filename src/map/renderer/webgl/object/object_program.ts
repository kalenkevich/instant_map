import { mat3 } from 'gl-matrix';
import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../flags';

export type ExtendedWebGLRenderingContext = WebGLRenderingContext & {
  vertexAttribDivisor(index: number, divisor: number): void;
  drawArraysInstanced(primitiveType: number, offset: number, numElements: number, instanceCount: number): void;
  createVertexArray(): WebGLVertexArrayObjectOES;
  bindVertexArray(vao: WebGLVertexArrayObjectOES): void;
};

export abstract class ObjectProgram {
  protected program: WebGLProgram;

  // position buffer
  protected a_positionBuffer: WebGLBuffer;
  protected a_positionAttributeLocation: number = 0;

  // color buffer
  protected a_colorBuffer: WebGLBuffer;
  protected a_colorAttributeLocation: number = 1;

  // uniform locations
  protected u_matrixLocation: WebGLUniformLocation;
  protected u_zoomLocation: WebGLUniformLocation;
  protected u_widthLocation: WebGLUniformLocation;
  protected u_heightLocation: WebGLUniformLocation;
  protected u_tile_sizeLocation: WebGLUniformLocation;
  protected u_feature_flagsLocations: Record<string, WebGLUniformLocation>;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string,
    protected readonly fragmentShaderSource: string
  ) {}

  public init() {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.setupProgram();
    this.setupBuffer();
    this.setupUniforms();
  }

  protected setupProgram() {
    const gl = this.gl;

    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    this.program = this.createProgram(vertexShader, fragmentShader);
    this.vao = this.gl.createVertexArray();
  }

  protected createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;

    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  protected createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const gl = this.gl;

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.a_positionBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.vertexAttribPointer(this.a_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.a_colorBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(this.a_colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.vertexAttribPointer(this.a_colorAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.u_zoomLocation = this.gl.getUniformLocation(this.program, 'u_zoom');
    this.u_widthLocation = this.gl.getUniformLocation(this.program, 'u_width');
    this.u_heightLocation = this.gl.getUniformLocation(this.program, 'u_height');
    this.u_tile_sizeLocation = this.gl.getUniformLocation(this.program, 'u_tile_size');

    this.u_feature_flagsLocations = {};
    for (const name of Object.keys(this.featureFlags)) {
      this.u_feature_flagsLocations[name] = this.gl.getUniformLocation(this.program, `u_feature_flags.${name}`);
    }
  }

  link() {
    this.gl.useProgram(this.program);
    this.setFeatureFlags();
    this.gl.disable(this.gl.BLEND);
  }

  setMatrix(matrix: mat3) {
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, matrix);
  }

  setZoom(zoom: number) {
    this.gl.uniform1f(this.u_zoomLocation, zoom);
  }

  setWidth(width: number) {
    this.gl.uniform1f(this.u_widthLocation, width);
  }

  setHeight(height: number) {
    this.gl.uniform1f(this.u_heightLocation, height);
  }

  setTileSize(tileSize: number) {
    this.gl.uniform1f(this.u_tile_sizeLocation, tileSize);
  }

  setFeatureFlags() {
    for (const [name, value] of Object.entries(this.featureFlags)) {
      this.gl.uniform1i(this.u_feature_flagsLocations[name], value);
    }
  }

  abstract drawObjectGroup(objectGroup: WebGlObjectBufferredGroup): void;
}
