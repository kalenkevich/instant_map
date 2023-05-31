import { Point } from './point';

/*
 * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
 * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
 * the reverse.
 *
 * @example
 *
 * ```ts
 * const transformation = transformation(2, 5, -1, 10);
 * const p = new Point(1, 2),
 * const p2 = transformation.transform(p), // Point(7, 8)
 * const p3 = transformation.untransform(p2); // Point(1, 2)
 * ```
 */
export class Transformation {
  a: number;
  b: number;
  c: number;
  d: number;

  constructor(a: number, b: number, c: number, d: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  // Returns a transformed point, optionally multiplied by the given scale.
  // Only accepts actual `L.Point` instances, not arrays.
  transform(point: Point, scale?: number): Point {
    return new Point(scale * (this.a * point.x + this.b), scale * (this.c * point.y + this.d));
  }

  // Returns the reverse transformation of the given point, optionally divided
  // by the given scale. Only accepts actual `L.Point` instances, not arrays.
  untransform(point: Point, scale: number = 1): Point {
    return new Point((point.x / scale - this.b) / this.a, (point.y / scale - this.d) / this.c);
  }
}
