export function toSharedArrayBuffer(array: number[]): Float32Array {
  const sharedMemory = new SharedArrayBuffer(array.length * Float32Array.BYTES_PER_ELEMENT);
  const arrayBuffer = new Float32Array(sharedMemory);

  arrayBuffer.set(array, 0);

  return arrayBuffer;
}

export function createSharedArrayBuffer(size: number): Float32Array {
  const sharedMemory = new SharedArrayBuffer(size * Float32Array.BYTES_PER_ELEMENT);
  const arrayBuffer = new Float32Array(sharedMemory);

  return arrayBuffer;
}
