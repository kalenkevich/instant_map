export function createdSharedArrayBuffer(array: number[]): Float32Array {
  const sharedMemory = new SharedArrayBuffer(array.length * Float32Array.BYTES_PER_ELEMENT);
  const arrayBuffer = new Float32Array(sharedMemory);

  arrayBuffer.set(array, 0);

  return arrayBuffer;
}
