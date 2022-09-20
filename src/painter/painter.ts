import { setUniforms, drawBufferInfo, resizeCanvasToDisplaySize } from "twgl.js";
import { GlProgram } from "../gl/program/program";

export class Painter {
  private readonly gl: WebGLRenderingContext;
  private programs: GlProgram[];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.programs = [];
  }

  public init() {
    const gl = this.gl;

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  public draw(time: number): void {
    const gl = this.gl;

    const uniforms = {
      time: time * 0.001,
      resolution: [gl.canvas.width, gl.canvas.height],
    };

    for (const program of this.programs) {
      setUniforms(program.getProgramInfo(), uniforms);
      drawBufferInfo(gl, program.getBufferInfo());
    }
  }
}