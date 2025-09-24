/**
 * LRU (Least Recently Used) Cache implementation
 * Used to prevent memory leaks by limiting cache size
 */
export declare class LRUCache<K, V> {
    private maxSize;
    private cache;
    private accessOrder;
    constructor(maxSize?: number);
    /**
     * Get a value from the cache
     */
    get(key: K): V | undefined;
    /**
     * Set a value in the cache
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists
     */
    has(key: K): boolean;
    /**
     * Delete a key from the cache
     */
    delete(key: K): boolean;
    /**
     * Clear all items from the cache
     */
    clear(): void;
    /**
     * Get the current size of the cache
     */
    get size(): number;
    /**
     * Get all keys in the cache
     */
    keys(): K[];
    /**
     * Get all values in the cache
     */
    values(): V[];
    /**
     * Update access order for a key
     */
    private updateAccessOrder;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        utilization: number;
        oldestKey?: K;
        newestKey?: K;
    };
}
/**
 * Create a TTL (Time To Live) cache with automatic expiration
 */
export declare class TTLCache<K, V> extends LRUCache<K, V> {
    private ttl;
    private timers;
    constructor(maxSize?: number, ttl?: number);
    /**
     * Set a value with automatic expiration
     */
    set(key: K, value: V, customTTL?: number): void;
    /**
     * Delete a key and its timer
     */
    delete(key: K): boolean;
    /**
     * Clear all items and timers
     */
    clear(): void;
    /**
     * Clear timer for a key
     */
    private clearTimer;
    /**
     * Cleanup method to be called on unmount
     */
    destroy(): void;
}
//# sourceMappingURL=lruCache.d.ts.map