import { GlProgram } from "./program";

export class GlPoint extends GlProgram {
  public getFragmentShaderSource(...args: any[]): string {
    return undefined;
  }

  public getVertexShaderSource(...args: any[]): string {
    return undefined;
  }

  getBufferAttrs(...args: any[]): Record<string, any> {
    return {};
  }

  getUniforms(...args: any[]): Record<string, any> {
    return {};
  }
}