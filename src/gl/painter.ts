import { addExtensionsToContext } from "twgl.js";
import { GlProgram } from "./object/program";

export class GlPainter {
  private readonly gl: WebGLRenderingContext;
  private programs: GlProgram[];

  constructor(gl: WebGLRenderingContext, programs?: GlProgram[]) {
    this.gl = gl;
    this.programs = programs || [];
  }

  public init() {
    const gl = this.gl;

    addExtensionsToContext(this.gl);

    //resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  public addProgram(program: GlProgram) {
    this.programs.push(program);
  }

  public draw(...args: any[]): void {
    const gl = this.gl;

    for (const program of this.programs) {
        program.draw(gl);
    }
  }
}