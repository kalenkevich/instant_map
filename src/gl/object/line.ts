import { GlObject, GlObjectConfig } from "./object";

export interface GlLineConfig extends GlObjectConfig {

}

export class GlLine extends GlObject {
  constructor(config: GlLineConfig) {
    super(config);
  }

  public getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec4 position;

      void main() {
        gl_Position = position;
      }
    `;
  }

  public getFragmentShaderSource(...args: any[]): string {
    return `
      attribute vec4 color;
      
      void main() {
        gl_FragColor = color;
      }
    `;
  }
}