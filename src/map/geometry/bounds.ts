import { Point } from './point';

export class Bounds {
  min: Point;
  max: Point;

  constructor(a: Point, b: Point) {
    this.extend(a);
    this.extend(b);
  }

  // Extends the bounds to contain the given point | bound.
  extend(obj: Point | Bounds) {
    let min2, max2;

    if (obj instanceof Point) {
      min2 = max2 = obj;
    } else if (obj instanceof Bounds) {
      min2 = obj.min;
      max2 = obj.max;

      if (!min2 || !max2) {
        return this;
      }
    }

    // @property min: Point
    // The top left corner of the rectangle.
    // @property max: Point
    // The bottom right corner of the rectangle.
    if (!this.min && !this.max) {
      this.min = min2.clone();
      this.max = max2.clone();
    } else {
      this.min.x = Math.min(min2.x, this.min.x);
      this.max.x = Math.max(max2.x, this.max.x);
      this.min.y = Math.min(min2.y, this.min.y);
      this.max.y = Math.max(max2.y, this.max.y);
    }
    return this;
  }

  // @method getCenter(round?: Boolean): Point
  // Returns the center point of the bounds.
  getCenter(round?: boolean): Point {
    return new Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round);
  }

  // Returns the bottom-left point of the bounds.
  getBottomLeft(): Point {
    return new Point(this.min.x, this.max.y);
  }

  // @method getTopRight(): Point
  // Returns the top-right point of the bounds.
  getTopRight(): Point {
    return new Point(this.max.x, this.min.y);
  }

  // Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
  getTopLeft(): Point {
    return this.min;
  }

  // Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
  getBottomRight(): Point {
    return this.max;
  }

  // Returns the size of the given bounds
  getSize() {
    return this.max.subtract(this.min);
  }

  // Returns `true` if the rectangle contains the given one.
  // @alternative
  // @method contains(point: Point): Boolean
  // Returns `true` if the rectangle contains the given point.
  contains(obj: Point | Bounds) {
    let min, max;

    if (obj instanceof Bounds) {
      min = obj.min;
      max = obj.max;
    } else {
      min = max = obj;
    }

    return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
  }

  // Returns `true` if the rectangle intersects the given bounds. Two bounds
  // intersect if they have at least one point in common.
  intersects(bounds: Bounds): boolean {
    const min = this.min;
    const max = this.max;
    const min2 = bounds.min;
    const max2 = bounds.max;
    const xIntersects = max2.x >= min.x && min2.x <= max.x;
    const yIntersects = max2.y >= min.y && min2.y <= max.y;

    return xIntersects && yIntersects;
  }

  // Returns `true` if the rectangle overlaps the given bounds. Two bounds
  // overlap if their intersection is an area.
  overlaps(bounds: Bounds): boolean {
    const min = this.min;
    const max = this.max;
    const min2 = bounds.min;
    const max2 = bounds.max;
    const xOverlaps = max2.x > min.x && min2.x < max.x;
    const yOverlaps = max2.y > min.y && min2.y < max.y;

    return xOverlaps && yOverlaps;
  }

  // Returns `true` if the bounds are properly initialized.
  isValid(): boolean {
    return !!(this.min && this.max);
  }

  // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
  // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
  // Negative values will retract the bounds.
  pad(bufferRatio: number): Bounds {
    const min = this.min;
    const max = this.max;
    const heightBuffer = Math.abs(min.x - max.x) * bufferRatio;
    const widthBuffer = Math.abs(min.y - max.y) * bufferRatio;

    return new Bounds(new Point(min.x - heightBuffer, min.y - widthBuffer), new Point(max.x + heightBuffer, max.y + widthBuffer));
  }

  // Returns `true` if the rectangle is equivalent to the given bounds.
  equals(bounds: Bounds): boolean {
    return this.min.equals(bounds.getTopLeft()) && this.max.equals(bounds.getBottomRight());
  }
}
