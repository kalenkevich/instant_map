import { mat3 } from 'gl-matrix';
import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../../flags';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { WebGlBuffer, createWebGlBuffer } from '../../utils/webgl_buffer';

export interface DrawObjectGroupOptions {
  readPixelRenderMode?: boolean;
}

export abstract class ObjectProgram {
  protected program: WebGLProgram;

  protected positionBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

  // uniform locations
  protected u_matrixLocation: WebGLUniformLocation;
  protected u_widthLocation: WebGLUniformLocation;
  protected u_heightLocation: WebGLUniformLocation;
  protected u_tile_sizeLocation: WebGLUniformLocation;
  protected u_is_read_pixel_render_modeLocation: WebGLUniformLocation;
  protected u_feature_flagsLocations: Record<string, WebGLUniformLocation>;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string,
    protected readonly fragmentShaderSource: string,
  ) {}

  public async init() {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.setupProgram();
    this.setupBuffer();
    this.setupUniforms();
    return this.onInit();
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

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  protected createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const gl = this.gl;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 2 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 1, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    this.u_matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.u_widthLocation = this.gl.getUniformLocation(this.program, 'u_width');
    this.u_heightLocation = this.gl.getUniformLocation(this.program, 'u_height');
    this.u_is_read_pixel_render_modeLocation = this.gl.getUniformLocation(this.program, 'u_is_read_pixel_render_mode');

    this.u_feature_flagsLocations = {};
    for (const name of Object.keys(this.featureFlags)) {
      this.u_feature_flagsLocations[name] = this.gl.getUniformLocation(this.program, `u_feature_flags.${name}`);
    }
  }

  link() {
    this.gl.useProgram(this.program);
    this.setFeatureFlags();
    this.onLink();
  }

  unlink() {
    this.onUnlink();
  }

  abstract onInit(): Promise<void>;

  abstract onLink(): void;

  abstract onUnlink(): void;

  setMatrix(matrix: mat3) {
    this.gl.uniformMatrix3fv(this.u_matrixLocation, false, matrix);
  }

  setWidth(width: number) {
    this.gl.uniform1f(this.u_widthLocation, width);
  }

  setHeight(height: number) {
    this.gl.uniform1f(this.u_heightLocation, height);
  }

  setReadPixelRenderMode(isReadPixelRenderMode: boolean) {
    this.gl.uniform1i(this.u_is_read_pixel_render_modeLocation, isReadPixelRenderMode ? 1 : 0);
  }

  setFeatureFlags() {
    for (const [name, value] of Object.entries(this.featureFlags)) {
      this.gl.uniform1i(this.u_feature_flagsLocations[name], value);
    }
  }

  abstract drawObjectGroup(objectGroup: WebGlObjectBufferredGroup, options?: DrawObjectGroupOptions): void;
}
