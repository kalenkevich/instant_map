import { setUniforms, drawBufferInfo, resizeCanvasToDisplaySize, setBuffersAndAttributes } from "twgl.js";
import { GlProgram } from "../gl/object/program";

export class Painter {
  private readonly gl: WebGLRenderingContext;
  private programs: GlProgram[];

  constructor(gl: WebGLRenderingContext, programs?: GlProgram[]) {
    this.gl = gl;
    this.programs = programs || [];
  }

  public init() {
    const gl = this.gl;

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  public addProgram(program: GlProgram) {
    this.programs.push(program);
  }

  public draw(...args: any[]): void {
    const gl = this.gl;

    for (const program of this.programs) {
      program.compile();

      const programInfo = program.getProgramInfo();
      const buffer = program.getBufferInfo();
      const uniforms = program.getUniforms();

      gl.useProgram(programInfo.program);
      setBuffersAndAttributes(gl, programInfo, buffer);
      setUniforms(programInfo, uniforms);

      if (program.requireExt) {
        program.drawWithExt();
      } else {
        drawBufferInfo(gl, buffer, program.primitiveType);
      }
    }
  }
}