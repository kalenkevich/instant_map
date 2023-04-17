import { GlProgram, GlProgramProps } from './program';

/** 
 * Multiprogram object. This is a wrapper to render objects which require different programms to be fully painted.
 * Store list of programs called subprograms. 
 * When `draw` is called then it just loops by each subprogram and call `draw` for subprogram instance. 
 * */
export abstract class GlMultiProgram extends GlProgram {
  /** 
   * List of subprograms to be invoked while complex object draw.
   * Note: order is important here.
   */
  protected subPrograms: GlProgram[];

  constructor(gl: WebGLRenderingContext, props: GlProgramProps) {
    super(gl, props);
  }

  public draw(gl: WebGLRenderingContext) {
    for (const subprogram of this.subPrograms) {
      subprogram.draw(gl);
    }
  }

  /**
   * Return dummy state as the real state will be handled by sub programs.
   */
  public getBufferAttrs(): Record<string, any> {

    return {};
  }
}