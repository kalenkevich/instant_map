import { GlObject } from "./object";

export class GlPoint extends GlObject {
  public getFragmentShaderSource(...args: any[]): string {
    return undefined;
  }

  public getVertexShaderSource(...args: any[]): string {
    return undefined;
  }
}