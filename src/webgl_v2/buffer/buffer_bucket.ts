export interface BucketPointer {
  bucketIndex: number;
  offset: number;
  size: number;
  buffer: Float32Array;
}

export class BufferBucket {
  private buckets: Float32Array[];
  private currentIndex = 0;
  private currentBucketOffset = 0;

  constructor(private readonly sizePerBucket = 100000) {
    this.buckets = [this.createNewBucket()];
  }

  private createNewBucket(): Float32Array {
    return new Float32Array(this.sizePerBucket);
  }

  writeAndCommit(data: number[]): BucketPointer {
    const size = data.length;

    if (size > this.sizePerBucket - this.currentBucketOffset) {
      throw new Error('Buffer size is too small.');
    }

    this.buckets[this.currentIndex].set(data, this.currentBucketOffset);

    const ptr = {
      bucketIndex: this.currentIndex,
      offset: this.currentBucketOffset,
      size,
      buffer: this.buckets[this.currentIndex],
    };

    this.currentBucketOffset += size;

    return ptr;
  }

  getBuffer(): Float32Array {
    return this.buckets[this.currentIndex];
  }
}
