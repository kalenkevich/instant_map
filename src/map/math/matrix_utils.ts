// Checkout more https://github.com/toji/gl-matrix/

const EPSILON = 0.000001;

export type Vector2 = [number, number];

export type Vector3 = [number, number, number];

export type Matrix3 = [number, number, number, number, number, number, number, number, number];

export type Matrix4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export function createMatrix3(): Matrix3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

export function createMatrix4(): Matrix4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
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

export function translateMatrix4(a: Matrix4, v: Vector3): Matrix4 {
  const x = v[0];
  const y = v[1];
  const z = v[2];

  a[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
  a[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
  a[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
  a[15] = a[3] * x + a[7] * y + a[11] * z + a[15];

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

export function multiplyMatrix4(a: Matrix4, b: Matrix4): Matrix4 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];
  const a30 = a[12];
  const a31 = a[13];
  const a32 = a[14];
  const a33 = a[15];

  // Cache only the current line of the second matrix
  let b0 = b[0];
  let b1 = b[1];
  let b2 = b[2];
  let b3 = b[3];
  a[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  a[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  a[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  a[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  a[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  a[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  a[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  a[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  a[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  a[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  a[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  a[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  a[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  a[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  a[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  a[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

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

export function scaleMatrix4(a: Matrix4, v: Vector3): Matrix4 {
  const x = v[0];
  const y = v[1];
  const z = v[2];

  a[0] = a[0] * x;
  a[1] = a[1] * x;
  a[2] = a[2] * x;
  a[3] = a[3] * x;
  a[4] = a[4] * y;
  a[5] = a[5] * y;
  a[6] = a[6] * y;
  a[7] = a[7] * y;
  a[8] = a[8] * z;
  a[9] = a[9] * z;
  a[10] = a[10] * z;
  a[11] = a[11] * z;

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

export function rotateMatrix4(a: Matrix4, rad: number, axis: Vector3): Matrix4 {
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  let len = Math.sqrt(x * x + y * y + z * z);

  if (len < EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const t = 1 - c;

  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];

  // Construct the elements of the rotation matrix
  const b00 = x * x * t + c;
  const b01 = y * x * t + z * s;
  const b02 = z * x * t - y * s;
  const b10 = x * y * t - z * s;
  const b11 = y * y * t + c;
  const b12 = z * y * t + x * s;
  const b20 = x * z * t + y * s;
  const b21 = y * z * t - x * s;
  const b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  a[0] = a00 * b00 + a10 * b01 + a20 * b02;
  a[1] = a01 * b00 + a11 * b01 + a21 * b02;
  a[2] = a02 * b00 + a12 * b01 + a22 * b02;
  a[3] = a03 * b00 + a13 * b01 + a23 * b02;
  a[4] = a00 * b10 + a10 * b11 + a20 * b12;
  a[5] = a01 * b10 + a11 * b11 + a21 * b12;
  a[6] = a02 * b10 + a12 * b11 + a22 * b12;
  a[7] = a03 * b10 + a13 * b11 + a23 * b12;
  a[8] = a00 * b20 + a10 * b21 + a20 * b22;
  a[9] = a01 * b20 + a11 * b21 + a21 * b22;
  a[10] = a02 * b20 + a12 * b21 + a22 * b22;
  a[11] = a03 * b20 + a13 * b21 + a23 * b22;

  return a;
}

export function rotateXMatrix4(a: Matrix4, rad: number): Matrix4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];

  // Perform axis-specific matrix multiplication
  a[4] = a10 * c + a20 * s;
  a[5] = a11 * c + a21 * s;
  a[6] = a12 * c + a22 * s;
  a[7] = a13 * c + a23 * s;
  a[8] = a20 * c - a10 * s;
  a[9] = a21 * c - a11 * s;
  a[10] = a22 * c - a12 * s;
  a[11] = a23 * c - a13 * s;

  return a;
}

export function rotateYMatrix4(a: Matrix4, rad: number): Matrix4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];

  // Perform axis-specific matrix multiplication
  a[0] = a00 * c - a20 * s;
  a[1] = a01 * c - a21 * s;
  a[2] = a02 * c - a22 * s;
  a[3] = a03 * c - a23 * s;
  a[8] = a00 * s + a20 * c;
  a[9] = a01 * s + a21 * c;
  a[10] = a02 * s + a22 * c;
  a[11] = a03 * s + a23 * c;

  return a;
}

export function rotateZMatrix4(a: Matrix4, rad: number): Matrix4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];

  // Perform axis-specific matrix multiplication
  a[0] = a00 * c + a10 * s;
  a[1] = a01 * c + a11 * s;
  a[2] = a02 * c + a12 * s;
  a[3] = a03 * c + a13 * s;
  a[4] = a10 * c - a00 * s;
  a[5] = a11 * c - a01 * s;
  a[6] = a12 * c - a02 * s;
  a[7] = a13 * c - a03 * s;

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

export function invertMatrix4(a: Matrix4): Matrix4 {
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];
  const a30 = a[12];
  const a31 = a[13];
  const a32 = a[14];
  const a33 = a[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  a[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  a[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  a[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  a[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  a[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  a[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  a[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  a[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  a[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  a[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  a[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  a[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  a[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  a[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  a[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  a[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

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

export function transformVector3Matrix4(a: Vector3, m: Matrix4): Vector3 {
  const x = a[0];
  const y = a[1];
  const z = a[2];
  let w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;

  a[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  a[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  a[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

  return a;
}

export function lookAt(eye: Vector3, center: Vector3, up: Vector3): Matrix4 {
  const out = createMatrix4();
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  const eyex = eye[0];
  const eyey = eye[1];
  const eyez = eye[2];
  const upx = up[0];
  const upy = up[1];
  const upz = up[2];
  const centerx = center[0];
  const centery = center[1];
  const centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identityMatrix4(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

export function identityMatrix4(a: Matrix4): Matrix4 {
  a[0] = 1;
  a[1] = 0;
  a[2] = 0;
  a[3] = 0;
  a[4] = 0;
  a[5] = 1;
  a[6] = 0;
  a[7] = 0;
  a[8] = 0;
  a[9] = 0;
  a[10] = 1;
  a[11] = 0;
  a[12] = 0;
  a[13] = 0;
  a[14] = 0;
  a[15] = 1;

  return a;
}

export function perspectiveMatrix4(fovy: number, aspect: number, near: number, far: number): Matrix4 {
  const out = createMatrix4();
  const f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
