export class LRUCache<K, V> {
  private readonly hashmap = new Map<K, V>();

  constructor(private readonly capacity: number) {}

  public has(key: K): boolean {
    return this.hashmap.has(key);
  }

  public get(key: K): V | undefined {
    return this.hashmap.get(key);
  }

  public set(key: K, value: V) {
    if (this.hashmap.has(key)) {
      this.hashmap.delete(key);
    }

    if (this.hashmap.size === this.capacity) {
      this.pruneLeastValue();
    }

    this.hashmap.set(key, value);
  }

  public delete(key: K) {
    this.hashmap.delete(key);
  }

  public size(): number {
    return this.hashmap.size;
  }

  private pruneLeastValue() {
    const key = this.getFirstKey();

    if (key) {
      this.delete(key);
    }
  }

  private getFirstKey(): K | undefined {
    if (this.hashmap.size === 0) {
      return;
    }

    return this.hashmap.keys().next().value;
  }
}
