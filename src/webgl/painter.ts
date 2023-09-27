import { addExtensionsToContext, resizeCanvasToDisplaySize } from 'twgl.js';
import { GlProgram } from './object/program';

export class WebGlPainter {
  private readonly gl: WebGLRenderingContext;
  private programs: GlProgram[];

  constructor(gl: WebGLRenderingContext, programs?: GlProgram[]) {
    this.gl = gl;
    this.programs = programs || [];
  }

  public init() {
    addExtensionsToContext(this.gl);
  }

  public setPrograms(programs: GlProgram[]) {
    this.programs = programs;
  }

  public addProgram(program: GlProgram) {
    this.programs.push(program);
  }

  public clear() {
    // Clear the canvas.
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public draw(): void {
    const gl = this.gl;

    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    for (const program of this.programs) {
      program.draw(gl);
    }
  }
}
