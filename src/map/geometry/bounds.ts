import { Point } from './point';

export class Bounds {
  a: Point;
  b: Point;
  c: Point;
  d: Point;

  constructor(a: Point, d: Point) {
    this.a = a;
    this.b = new Point(d.x, a.y);
    this.c = new Point(a.x, d.y);
    this.d = d;
  }
}
