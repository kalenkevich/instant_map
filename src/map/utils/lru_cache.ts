import { Evented, EventListener } from '../evented';

export enum LRUCacheEvents {
  removed = 'removed',
}

export class LRUCache<K, V> extends Map {
  private readonly hashmap = new Map<K, V>();
  private readonly evented = new Evented<LRUCacheEvents>();

  constructor(private readonly capacity: number) {
    super();
  }

  public has(key: K): boolean {
    return this.hashmap.has(key);
  }

  public get(key: K): V | undefined {
    if (!this.hashmap.has(key)) return undefined;

    const val = this.hashmap.get(key);
    this.hashmap.delete(key);
    this.hashmap.set(key, val);

    return val;
  }

  public set(key: K, value: V) {
    this.hashmap.delete(key);

    if (this.hashmap.size === this.capacity) {
      const removedValueKey = this.hashmap.keys().next().value;
      this.evented.fire(LRUCacheEvents.removed, this.hashmap.get(removedValueKey));
      this.hashmap.delete(removedValueKey);
      this.hashmap.set(key, value);
    } else {
      this.hashmap.set(key, value);
    }

    return this;
  }

  public delete(key: K) {
    return this.hashmap.delete(key);
  }

  public get size(): number {
    return this.hashmap.size;
  }

  public clear() {
    return this.hashmap.clear();
  }

  public on(eventType: LRUCacheEvents, handler: EventListener<LRUCacheEvents>): void {
    this.evented.on(eventType, handler);
  }

  public once(eventType: LRUCacheEvents, handler: EventListener<LRUCacheEvents>): void {
    this.evented.once(eventType, handler);
  }

  public off(eventType: LRUCacheEvents, handler: EventListener<LRUCacheEvents>) {
    this.evented.off(eventType, handler);
  }
}
