import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../../flags';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';
import { WebGlUniform, createWebGlUniform } from '../../helpers/weblg_uniform';
import { WebGlBuffer, createWebGlBuffer } from '../../helpers/webgl_buffer';
import { createProgram } from '../../helpers/webgl_program';

export interface DrawObjectGroupOptions {
  readPixelRenderMode?: boolean;
}

export abstract class ObjectProgram {
  protected program: WebGLProgram;

  // Uniforms
  protected matrixUniform: WebGlUniform;
  protected widthUniform: WebGlUniform;
  protected heightUniform: WebGlUniform;
  protected distanceUniform: WebGlUniform;
  protected devicePixelRatioUniform: WebGlUniform;
  protected isReadPixelRenderModeUniform: WebGlUniform;
  protected featureFlagsUnifroms: Record<string, WebGlUniform>;

  // Attribures
  protected positionBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;

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
    await this.setupTextures();
    return this.onInit();
  }

  public destroy() {}

  protected setupProgram() {
    this.program = createProgram(this.gl, this.vertexShaderSource, this.fragmentShaderSource);
    this.vao = this.gl.createVertexArray();
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, { location: 0, size: 2 });
    this.colorBuffer = createWebGlBuffer(this.gl, { location: 1, size: 4 });

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    this.matrixUniform = createWebGlUniform(this.gl, { name: 'u_matrix', program: this.program });
    this.widthUniform = createWebGlUniform(this.gl, { name: 'u_width', program: this.program });
    this.heightUniform = createWebGlUniform(this.gl, { name: 'u_height', program: this.program });
    this.distanceUniform = createWebGlUniform(this.gl, { name: 'u_distance', program: this.program });
    this.devicePixelRatioUniform = createWebGlUniform(this.gl, {
      name: 'u_device_pixel_ratio',
      program: this.program,
    });
    this.isReadPixelRenderModeUniform = createWebGlUniform(this.gl, {
      name: 'u_is_read_pixel_render_mode',
      program: this.program,
    });

    this.featureFlagsUnifroms = {};
    for (const name of Object.keys(this.featureFlags)) {
      this.featureFlagsUnifroms[name] = createWebGlUniform(this.gl, {
        name: `u_feature_flags.${name}`,
        program: this.program,
      });
    }
  }

  protected async setupTextures() {}

  link() {
    this.gl.useProgram(this.program);
    this.setFeatureFlags();
    this.onLink();
  }

  unlink() {
    this.onUnlink();
  }

  onInit(): Promise<void> {
    return Promise.resolve();
  }

  onLink() {}

  onUnlink() {}

  setMatrix(matrix: [number, number, number, number, number, number, number, number, number]) {
    this.matrixUniform.setMatrix3(matrix);
  }

  setWidth(width: number) {
    this.widthUniform.setFloat(width);
  }

  setHeight(height: number) {
    this.heightUniform.setFloat(height);
  }

  setDistance(distance: number) {
    this.distanceUniform.setFloat(distance);
  }

  setDevicePixelRation(devicePixelRatio: number) {
    this.devicePixelRatioUniform.setFloat(devicePixelRatio);
  }

  setReadPixelRenderMode(isReadPixelRenderMode: boolean) {
    this.isReadPixelRenderModeUniform.setBoolean(isReadPixelRenderMode);
  }

  setFeatureFlags() {
    for (const [name, value] of Object.entries(this.featureFlags)) {
      this.featureFlagsUnifroms[name].setBoolean(value);
    }
  }

  abstract drawObjectGroup(objectGroup: WebGlObjectBufferredGroup, options?: DrawObjectGroupOptions): void;
}
