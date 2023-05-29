import { GlColor } from './types';

export class RGBColor {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toGlColor(): GlColor {
    return [this.r / 256, this.g / 256, this.b / 256, this.a];
  }

  static toGLColor(r: number, g: number, b: number, a: number = 1): GlColor {
    return [r / 256, g / 256, b / 256, a];
  }
}
