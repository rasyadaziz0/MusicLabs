import { DominantColors } from './types';

export class LRUColorCache {
  private map = new Map<string, DominantColors>();
  private maxCache: number;

  constructor(maxCache = 64) {
    this.maxCache = maxCache;
  }

  get(key: string): DominantColors | undefined {
    const val = this.map.get(key);
    if (val) {
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: string, val: DominantColors): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    if (this.map.size > this.maxCache) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
