export interface BucketPointer {
  offset: number;
  size: number;
  bucket: Float32Array;
}

export class BufferBucket {
  private arrayData: number[] = [];
  private currentBucketOffset = 0;

  write(data: number[]): BucketPointer {
    const size = data.length;

    this.arrayData.push(...data);

    const ptr = {
      offset: this.currentBucketOffset,
      size,
      bucket: new Float32Array(data),
    };

    this.currentBucketOffset += size;

    return ptr;
  }

  release(): Float32Array {
    return new Float32Array(this.arrayData);
  }
}
