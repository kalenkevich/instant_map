import { GlProgram, GlProgramProps } from './program';
import { v2 } from '../types';

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

  constructor(props: GlProgramProps) {
    super(props);
  }

  public draw(gl: WebGLRenderingContext) {
    for (const subprogram of this.subPrograms) {
      subprogram.draw(gl);
    }
  }

  public setRotationInRadians(rotationInRadians: number) {
    this.rotationInRadians = rotationInRadians;

    for (const subprogram of this.subPrograms) {
      subprogram.setRotationInRadians(rotationInRadians);
    }
  }

  public setOrigin(origin: v2) {
    this.origin = origin;

    for (const subprogram of this.subPrograms) {
      subprogram.setOrigin(origin);
    }
  }

  public setTranslation(translation: v2) {
    this.translation = translation;

    for (const subprogram of this.subPrograms) {
      subprogram.setTranslation(translation);
    }
  }

  public setScale(scale: v2) {
    this.scale = scale;

    for (const subprogram of this.subPrograms) {
      subprogram.setScale(scale);
    }
  }

  /**
   * Return dummy state as the real state will be handled by sub programs.
   */
  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, any> {
    return {};
  }
}
