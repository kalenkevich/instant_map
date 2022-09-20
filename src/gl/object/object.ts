export type v3 = [number, number, number];
export type v4 = [number, number, number, number];
export type GlColor = string | v3 | v4;

export interface GlObjectConfig {
  color: GlColor;
}

export abstract class GlObject {
  private color: v4;

  constructor({ color }: GlObjectConfig) {
    this.color = this.normalizeColor(color);
  }

  public abstract getVertexShaderSource(...args: any[]): string;
  public abstract getFragmentShaderSource(...args: any[]): string;

  public normalizeColor(color: GlColor): v4 {
    const typeErrorMessage = 'Color should be one of type string or rgb/rgba array';

    if (Array.isArray(color)) {
      if (color.length === 4) {
        return color as v4;
      }

      if (color.length === 3) {
        return [...color, 1.0] as v4;
      }

      throw new Error(typeErrorMessage);
    }

    if (typeof color === 'string') {

    }

    throw new Error(typeErrorMessage);
  }
}

