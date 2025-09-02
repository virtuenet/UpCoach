/**
 * Unified Cache Service - Consolidates all caching functionality
 * Combines features from cacheService.ts, ai/CacheService.ts, and cache/CacheService.ts
 */
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    namespace?: string;
    prefix?: string;
    fallbackToMemory?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
    memoryHits: number;
    memoryMisses: number;
    compressionRatio: number;
}
export declare class UnifiedCacheService {
    private redis;
    private inMemoryCache;
    private stats;
    private readonly defaultTTL;
    private readonly maxRetries;
    private readonly compressionThreshold;
    private readonly memoryMaxSize;
    private readonly defaultPrefix;
    private cleanupInterval;
    private tagIndex;
    constructor(options?: {
        defaultTTL?: number;
        maxRetries?: number;
        compressionThreshold?: number;
        memoryMaxSize?: number;
        defaultPrefix?: string;
        redisUrl?: string;
    });
    private initializeRedis;
    private generateKey;
    private compressValue;
    private decompressValue;
    private updateCompressionRatio;
    private updateHitRate;
    private cleanupMemoryCache;
    private startMemoryCleanup;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    del(key: string, options?: CacheOptions): Promise<void>;
    invalidate(pattern: string, namespace?: string): Promise<number>;
    invalidateByTags(tags: string[]): Promise<number>;
    private addToTags;
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    ttl(key: string, options?: CacheOptions): Promise<number>;
    flush(): Promise<void>;
    getStats(): CacheStats;
    disconnect(): Promise<void>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>;
    getCachedResponse<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>;
}
export declare function getCacheService(): UnifiedCacheService;
export default UnifiedCacheService;
//# sourceMappingURL=UnifiedCacheService.d.ts.map