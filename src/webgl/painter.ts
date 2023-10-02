import { addExtensionsToContext, resizeCanvasToDisplaySize } from 'twgl.js';
import { GlProgram } from './object/program';

export class WebGlPainter {
  private readonly gl: WebGLRenderingContext;

  constructor(canvas: HTMLCanvasElement, private readonly devicePixelRatio: number) {
    this.gl = canvas.getContext('webgl', {
      powerPreference: 'high-performance',
    });
  }

  public init() {
    addExtensionsToContext(this.gl);
    this.clear();
  }

  public destroy() {
    // this.gl.getExtension('WEBGL_lose_context').loseContext();
  }

  public setWidth(w: number) {}

  public setHeight(h: number) {}

  public clear() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public draw(programs: GlProgram[]): void {
    const gl = this.gl;

    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, this.devicePixelRatio);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    for (const program of programs) {
      program.draw(gl);
    }
  }
}
