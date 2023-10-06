export interface Painter {
  init(...args: any[]): void;

  destroy(...args: any[]): void;

  draw(...args: any[]): void;

  preheat(...args: any[]): void;

  setWidth(w: number): void;

  setHeight(h: number): void;
}