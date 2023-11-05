export interface Painter {
  init(...args: any[]): void;

  destroy(...args: any[]): void;

  draw(...args: any[]): void;

  clear(): void;

  preheat(...args: any[]): void;

  resize(w: number, h: number): void;
}
