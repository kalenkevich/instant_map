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

    this.arrayData.push(...data);

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
}
