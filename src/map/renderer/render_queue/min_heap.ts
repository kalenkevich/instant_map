interface HeapNode<HeapValue> {
  index: number;
  value: HeapValue | null;
}

export class MinHeap<HeapValue> {
  private heap: HeapValue[];
  private valueGetter: (val: HeapValue) => number;

  constructor(arr: HeapValue[], valueGetter: (val: HeapValue) => number) {
    this.valueGetter = valueGetter;
    this.heap = this.buildHeap(arr);
  }

  private swap(index1: number, index2: number) {
    const t = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = t;
  }

  private getNode(nodeIndex: number): HeapNode<HeapValue> {
    if (nodeIndex < 0 || nodeIndex >= this.heap.length) {
      return {
        value: null,
        index: -1,
      }
    }

    return {
      value: this.heap[nodeIndex],
      index: nodeIndex,
    };
  }

  private getParentNode(childIndex: number): HeapNode<HeapValue> {
    if (childIndex === 0) {
      return {
        value: null,
        index: -1,
      };
    }

    const index = Math.floor((childIndex - 1) / 2);
    const value = this.heap[index];

    return {
      value,
      index,
    };
  }

  private getChildNodes(parentIndex: number): {
    left: HeapNode<HeapValue>;
    right: HeapNode<HeapValue>;
  } {
    let leftIndex = parentIndex * 2 + 1;
    let rightIndex = parentIndex * 2 + 2;
    let leftValue = null;
    let rightValue = null;

    if (leftIndex >= this.heap.length) {
      leftIndex = -1;
    } else {
      leftValue = this.heap[leftIndex];
    }

    if (rightIndex >= this.heap.length) {
      rightIndex = -1;
    } else {
      rightValue = this.heap[rightIndex];
    }

    return {
      left: {
        index: leftIndex,
        value: leftValue,
      },
      right: {
        index: rightIndex,
        value: rightValue,
      },
    };
  }

  private buildHeap(arr: HeapValue[]): HeapValue[] {
    if (!arr) {
      return;
    }

    this.heap = arr;

    if (this.heap.length === 0) {
      return this.heap;
    }

    const parentsIndex = Math.floor((this.heap.length - 1) / 2);

    for (let i = parentsIndex; i >= 0; i--) {
      this.siftDown(i);
    }

    return this.heap;
  }

  private siftDown(index: number): void {
    if (!this.heap) {
      return;
    }

    let nodeIndex = index;

    while (true) {
      const currentNode = this.getNode(nodeIndex);
      const kids = this.getChildNodes(nodeIndex);

      if (kids.left.index === -1 && kids.right.index === -1) {
        break;
      }

      let minChildNode;

      if (kids.left.index === -1) {
        minChildNode = kids.right;
      } else if (kids.right.index === -1) {
        minChildNode = kids.left;
      } else {
        minChildNode = this.valueGetter(kids.left.value) < this.valueGetter(kids.right.value) ? kids.left : kids.right;
      }

      if (this.valueGetter(currentNode.value) > this.valueGetter(minChildNode.value)) {
        this.swap(nodeIndex, minChildNode.index);

        nodeIndex = minChildNode.index;
      } else {
        break;
      }
    }
  }

  private siftUp(index: number): void {
    if (!this.heap) {
      return;
    }

    let nodeIndex = index;

    while (true) {
      const parent = this.getParentNode(nodeIndex);
      const currentNode = this.getNode(nodeIndex);

      if (parent.index === -1) {
        break;
      }

      if (this.valueGetter(parent.value) > this.valueGetter(currentNode.value)) {
        this.swap(nodeIndex, parent.index);

        nodeIndex = parent.index;
      } else {
        break;
      }
    }
  }

  public peek(): HeapValue | undefined {
    if (!this.heap) {
      return null;
    }

    if (this.heap.length === 0) {
      return null;
    }

    return this.heap[0];
  }

  public pop(): HeapValue | undefined {
    if (!this.heap) {
      return;
    }

    if (this.heap.length === 0) {
      return;
    }

    this.swap(0, this.heap.length - 1);
    const result = this.heap.pop();
    this.siftDown(0);

    return result;
  }

  public push(value: HeapValue): void {
    if (!this.heap) {
      return;
    }

    this.heap.push(value);

    this.siftUp(this.heap.length - 1);
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public size(): number {
    return this.heap.length;
  }
}