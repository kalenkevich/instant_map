export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number, round?: boolean) {
    this.x = round ? Math.round(x) : x;
    this.y = round ? Math.round(y) : y;
  }

  // Returns a copy of the current point.
  clone(): Point {
    return new Point(this.x, this.y);
  }

  // Returns the result of addition of the current and the given points.
  add(point: Point): Point {
    return new Point(this.x + point.x, this.y + point.y);
  }

  // Returns the result of subtraction of the given point from the current.
  subtract(point: Point): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  // Returns the result of multiplication of the current point by the given number.
  multiplyBy(num: number): Point {
    return new Point(this.x * num, this.y * num);
  }

  // Returns the result of division of the current point by the given number.
  divideBy(num: number): Point {
    return new Point(this.x / num, this.y / num);
  }

  // Multiply each coordinate of the current point by each coordinate of
  // `scale`. In linear algebra terms, multiply the point by the
  // [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
  // defined by `scale`.
  scaleBy(point: Point): Point {
    return new Point(this.x * point.x, this.y * point.y);
  }

  // Inverse of `scaleBy`. Divide each coordinate of the current point by
  // each coordinate of `scale`.
  unscaleBy(point: Point): Point {
    return new Point(this.x / point.x, this.y / point.y);
  }

  // Returns a copy of the current point with rounded coordinates.
  round(): Point {
    return new Point(Math.round(this.x), Math.round(this.y));
  }

  // Returns a copy of the current point with floored coordinates (rounded down).
  floor(): Point {
    return new Point(Math.floor(this.x), Math.floor(this.y));
  }

  // Returns a copy of the current point with ceiled coordinates (rounded up).
  ceil(): Point {
    return new Point(Math.ceil(this.x), Math.ceil(this.y));
  }

  // Returns a copy of the current point with truncated coordinates (rounded towards zero).
  trunc() {
    return new Point(Math.trunc(this.x), Math.trunc(this.y));
  }

  // Returns the cartesian distance between the current and the given points.
  distanceTo(point: Point) {
    const x = point.x - this.x;
    const y = point.y - this.y;

    return Math.sqrt(x * x + y * y);
  }

  // Returns `true` if the given point has the same coordinates.
  equals(point: Point) {
    return point.x === this.x && point.y === this.y;
  }

  // Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
  contains(point: Point) {
    return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
  }

  // Returns a string representation of the point for debugging purposes.
  toString(): String {
    return `Point(${this.x}, ${this.y})`;
  }
}
