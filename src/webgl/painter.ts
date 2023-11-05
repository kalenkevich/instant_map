import { addExtensionsToContext } from 'twgl.js';
import { GlProgram, ProgramCache } from './object/program';

export class WebGlPainter {
  private readonly gl: WebGLRenderingContext;
  private programInfoCache: ProgramCache = {
    programs: {},
  };

  constructor(private readonly canvas: HTMLCanvasElement, private readonly devicePixelRatio: number) {
    this.gl = canvas.getContext('webgl', {
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
  }

  public init() {
    const gl = this.gl;

    addExtensionsToContext(gl);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.clear();
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
  }

  public destroy() {}

  public resize(w: number, h: number) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  public clear() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public preheat(program: GlProgram) {
    program.preheat(this.gl, this.programInfoCache);
  }

  public draw(programs: GlProgram[]): void {
    const gl = this.gl;

    for (const program of programs) {
      program.draw(gl, this.programInfoCache);
    }
  }
}
