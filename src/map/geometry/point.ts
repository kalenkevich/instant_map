export class Point {
  x: number;
  y: number;
  z: number;

  [0]: number;
  [1]: number;
  [2]: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this[0] = this.x = x;
    this[1] = this.y = y;
    this[2] = this.z = z;
  }
}
