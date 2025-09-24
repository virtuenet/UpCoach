/**
 * LRU (Least Recently Used) Cache implementation
 * Used to prevent memory leaks by limiting cache size
 */
export class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
    }
    /**
     * Get a value from the cache
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.updateAccessOrder(key);
        }
        return value;
    }
    /**
     * Set a value in the cache
     */
    set(key, value) {
        // If key exists, update it
        if (this.cache.has(key)) {
            this.cache.set(key, value);
            this.updateAccessOrder(key);
            return;
        }
        // If at capacity, remove least recently used
        if (this.cache.size >= this.maxSize) {
            const lruKey = this.accessOrder.shift();
            if (lruKey !== undefined) {
                this.cache.delete(lruKey);
            }
        }
        // Add new item
        this.cache.set(key, value);
        this.accessOrder.push(key);
    }
    /**
     * Check if key exists
     */
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Delete a key from the cache
     */
    delete(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        return this.cache.delete(key);
    }
    /**
     * Clear all items from the cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get the current size of the cache
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Get all keys in the cache
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get all values in the cache
     */
    values() {
        return Array.from(this.cache.values());
    }
    /**
     * Update access order for a key
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: (this.cache.size / this.maxSize) * 100,
            oldestKey: this.accessOrder[0],
            newestKey: this.accessOrder[this.accessOrder.length - 1],
        };
    }
}
/**
 * Create a TTL (Time To Live) cache with automatic expiration
 */
export class TTLCache extends LRUCache {
    constructor(maxSize = 100, ttl = 60000) {
        super(maxSize);
        this.ttl = ttl; // Default 1 minute
        this.timers = new Map();
    }
    /**
     * Set a value with automatic expiration
     */
    set(key, value, customTTL) {
        // Clear existing timer if any
        this.clearTimer(key);
        // Set the value
        super.set(key, value);
        // Set expiration timer
        const ttl = customTTL || this.ttl;
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttl);
        this.timers.set(key, timer);
    }
    /**
     * Delete a key and its timer
     */
    delete(key) {
        this.clearTimer(key);
        return super.delete(key);
    }
    /**
     * Clear all items and timers
     */
    clear() {
        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        super.clear();
    }
    /**
     * Clear timer for a key
     */
    clearTimer(key) {
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
    /**
     * Cleanup method to be called on unmount
     */
    destroy() {
        this.clear();
    }
}
//# sourceMappingURL=lruCache.js.map