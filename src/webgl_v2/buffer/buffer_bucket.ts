export interface BucketPointer {
  bucket: BufferBucket;
  offset: number;
  size: number;
}

export class BufferBucket {
  private arrayData: number[] = [];
  private currentBucketOffset = 0;
  private buffer?: Float32Array;

  write(data: number[] | Float32Array): BucketPointer {
    const size = data.length;

    for (let i = 0; i < data.length; i++) {
      this.arrayData.push(data[i]);
    }

    const ptr = {
      bucket: this,
      offset: this.currentBucketOffset,
      size,
    };

    this.currentBucketOffset += size;

    return ptr;
  }

  release(): Float32Array {
    if (this.buffer) {
      return this.buffer;
    }

    return (this.buffer = new Float32Array(this.arrayData));
  }

  private _sharedBuffer?: SharedArrayBuffer;
  releaseShared(): SharedArrayBuffer {
    if (this._sharedBuffer) {
      return this._sharedBuffer;
    }

    const n = this.arrayData.length;
    const size = this.arrayData.length * Float32Array.BYTES_PER_ELEMENT;
    const sharedBuffer = new SharedArrayBuffer(size);
    const buffer = new Float32Array(sharedBuffer);

    for (let i = 0; i < n; i++) {
      buffer[i] = this.arrayData[i];
    }

    return (this._sharedBuffer = sharedBuffer);
  }
}
