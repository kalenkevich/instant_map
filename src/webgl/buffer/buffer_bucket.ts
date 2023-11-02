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
  private bucketSize = 100000;

  constructor() {
    this.buckets = [this.createNewBucket()];
  }

  private createNewBucket(): Float32Array {
    return new Float32Array(this.bucketSize);
  }

  write(data: number[]): BucketPointer {
    const size = data.length;

    if (size > this.bucketSize - this.currentBucketOffset) {
      this.buckets.push(this.createNewBucket());
      this.currentIndex++;
      this.currentBucketOffset = 0;
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
}
