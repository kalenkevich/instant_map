export function integerToVector4(int: number): [number, number, number, number] {
  const vector: [number, number, number, number] = [0, 0, 0, 0];

  // Extract bytes in reverse order (least significant to most significant)
  for (let i = 0; i < 4; i++) {
    vector[i] = ((int >> (i * 8)) & 0xff) / 255;
  }

  return vector;
}

export function vector4ToInteger(vector: [number, number, number, number] | Uint8Array | Float32Array): number {
  let integer = 0;

  // Combine bytes in order (most significant to least significant)
  for (let i = 0; i < 4; i++) {
    integer |= (vector[i] * 255) << (i * 8);
  }

  return integer;
}
