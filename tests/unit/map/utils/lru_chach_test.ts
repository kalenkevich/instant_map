import { describe, expect, it } from '@jest/globals';
import { LRUCache } from '../../../../src/map/utils/lru_cache';

describe('LRUCache', () => {
  it('should set and get item to cache.', () => {
    const cache = new LRUCache<string, number>(1);

    cache.set('1', 1);

    expect(cache.get('1')).toBe(1);
  });

  it('should return size of the cache.', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('1', 1);
    cache.set('2', 2);
    cache.set('3', 3);

    expect(cache.size()).toBe(3);
  });

  it('should return if item eist in the cache.', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('1', 1);
    cache.set('2', 2);
    cache.set('3', 3);

    expect(cache.has('1')).toBe(true);
    expect(cache.has('2')).toBe(true);
    expect(cache.has('3')).toBe(true);
  });

  it('should limit size of the cache in case it upto capacity.', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('1', 1);
    cache.set('2', 2);
    cache.set('3', 3);
    cache.set('4', 4);
    cache.set('5', 5);

    expect(cache.size()).toBe(3);
    expect(cache.has('1')).toBe(false);
    expect(cache.has('2')).toBe(false);
    expect(cache.has('3')).toBe(true);
    expect(cache.has('4')).toBe(true);
    expect(cache.has('5')).toBe(true);
  });

  it('should behave correctly if capacity is 1.', () => {
    const cache = new LRUCache<string, number>(1);

    cache.set('1', 1);
    cache.set('2', 2);
    cache.set('3', 3);

    expect(cache.size()).toBe(1);
    expect(cache.get('1')).toBeUndefined();
    expect(cache.get('2')).toBeUndefined();
    expect(cache.has('3')).toBe(true);
  });
});
