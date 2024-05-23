// Checkout more https://github.com/toji/gl-matrix/

export type Vector2 = [number, number];

export type Vector3 = [number, number, number];

export type Matrix3 = [number, number, number, number, number, number, number, number, number];

export function createMatrix3(): Matrix3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

export function translateMatrix3(a: Matrix3, v: Vector2): Matrix3 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[3];
  const a11 = a[4];
  const a12 = a[5];
  const a20 = a[6];
  const a21 = a[7];
  const a22 = a[8];

  const x = v[0];
  const y = v[1];

  a[0] = a00;
  a[1] = a01;
  a[2] = a02;

  a[3] = a10;
  a[4] = a11;
  a[5] = a12;

  a[6] = x * a00 + y * a10 + a20;
  a[7] = x * a01 + y * a11 + a21;
  a[8] = x * a02 + y * a12 + a22;

  return a;
}

export function multiplyMatrix3(a: Matrix3, b: Matrix3): Matrix3 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[3];
  const a11 = a[4];
  const a12 = a[5];
  const a20 = a[6];
  const a21 = a[7];
  const a22 = a[8];

  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b10 = b[3];
  const b11 = b[4];
  const b12 = b[5];
  const b20 = b[6];
  const b21 = b[7];
  const b22 = b[8];

  a[0] = b00 * a00 + b01 * a10 + b02 * a20;
  a[1] = b00 * a01 + b01 * a11 + b02 * a21;
  a[2] = b00 * a02 + b01 * a12 + b02 * a22;

  a[3] = b10 * a00 + b11 * a10 + b12 * a20;
  a[4] = b10 * a01 + b11 * a11 + b12 * a21;
  a[5] = b10 * a02 + b11 * a12 + b12 * a22;

  a[6] = b20 * a00 + b21 * a10 + b22 * a20;
  a[7] = b20 * a01 + b21 * a11 + b22 * a21;
  a[8] = b20 * a02 + b21 * a12 + b22 * a22;

  return a;
}

export function scaleMatrix3(a: Matrix3, v: Vector2): Matrix3 {
  const x = v[0];
  const y = v[1];

  a[0] = x * a[0];
  a[1] = x * a[1];
  a[2] = x * a[2];

  a[3] = y * a[3];
  a[4] = y * a[4];
  a[5] = y * a[5];

  return a;
}

export function rotateMatrix3(a: Matrix3, rad: number): Matrix3 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[3];
  const a11 = a[4];
  const a12 = a[5];
  const a20 = a[6];
  const a21 = a[7];
  const a22 = a[8];
  const s = Math.sin(rad);
  const c = Math.cos(rad);

  a[0] = c * a00 + s * a10;
  a[1] = c * a01 + s * a11;
  a[2] = c * a02 + s * a12;

  a[3] = c * a10 - s * a00;
  a[4] = c * a11 - s * a01;
  a[5] = c * a12 - s * a02;

  a[6] = a20;
  a[7] = a21;
  a[8] = a22;

  return a;
}

export function invertMatrix3(a: Matrix3): Matrix3 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[3];
  const a11 = a[4];
  const a12 = a[5];
  const a20 = a[6];
  const a21 = a[7];
  const a22 = a[8];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  // Calculate the determinant
  let det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return a;
  }
  det = 1.0 / det;

  a[0] = b01 * det;
  a[1] = (-a22 * a01 + a02 * a21) * det;
  a[2] = (a12 * a01 - a02 * a11) * det;
  a[3] = b11 * det;
  a[4] = (a22 * a00 - a02 * a20) * det;
  a[5] = (-a12 * a00 + a02 * a10) * det;
  a[6] = b21 * det;
  a[7] = (-a21 * a00 + a01 * a20) * det;
  a[8] = (a11 * a00 - a01 * a10) * det;

  return a;
}

export function transformVector2Matrix3(a: Vector2, m: Matrix3): Vector2 {
  const x = a[0];
  const y = a[1];

  a[0] = m[0] * x + m[3] * y + m[6];
  a[1] = m[1] * x + m[4] * y + m[7];

  return a;
}

export function transformVector3Matrix3(a: Vector3, m: Matrix3): Vector3 {
  const x = a[0];
  const y = a[1];
  const z = a[2];

  a[0] = x * m[0] + y * m[3] + z * m[6];
  a[1] = x * m[1] + y * m[4] + z * m[7];
  a[2] = x * m[2] + y * m[5] + z * m[8];

  return a;
}
