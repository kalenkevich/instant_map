import { ProgramInfo } from "twgl.js";
import { GlProgram, GlProgramProps } from "./program";
import { v2 } from '../types';

export interface GlAreaPorps extends GlProgramProps {
  points: v2[];
}

export class GlArea extends GlProgram {
  constructor(gl: WebGLRenderingContext, props: GlAreaPorps) {
    super(gl, props);
  }

  public getBufferAttrs(): Record<string, any> {
    throw new Error("Method not implemented.");
  }
}