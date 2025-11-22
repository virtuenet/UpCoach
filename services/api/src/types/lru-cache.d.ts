declare module 'lru-cache' {
  export interface LRUCacheOptions<K, V> {
    max?: number;
    maxSize?: number;
    sizeCalculation?: (value: V) => number;
    ttl?: number;
    updateAgeOnGet?: boolean;
    updateAgeOnHas?: boolean;
    dispose?: (value: V, key: K, reason: string) => void;
  }

  export class LRUCache<K, V> {
    constructor(options: LRUCacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    clear(): void;
    size: number;
    has(key: K): boolean;
    delete(key: K): boolean;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    purgeStale(): boolean;
  }
}