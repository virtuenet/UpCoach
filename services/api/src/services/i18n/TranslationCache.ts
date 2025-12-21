/**
 * Translation Cache Service
 *
 * Redis-based caching for translations with:
 * - Bundle caching with versioning
 * - Cache invalidation on updates
 * - Multi-level caching (L1 memory, L2 Redis)
 * - Cache warming and preloading
 * - Statistics and monitoring
 */

import { EventEmitter } from 'events';
import { TranslationBundle, TranslationNamespace } from './TranslationService';

// Types
export interface CacheEntry<T> {
  data: T;
  version: string;
  cachedAt: Date;
  expiresAt: Date;
  hits: number;
  locale: string;
  namespace?: TranslationNamespace;
}

export interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
  avgAccessTime: number;
  invalidations: number;
  warmups: number;
}

export interface CacheConfig {
  l1MaxSize: number;
  l1TtlMs: number;
  l2TtlMs: number;
  l2KeyPrefix: string;
  enableL2: boolean;
  enableCompression: boolean;
  compressionThreshold: number;
  warmOnStart: boolean;
  warmLocales: string[];
  warmNamespaces: TranslationNamespace[];
}

export interface CacheKey {
  locale: string;
  namespace?: TranslationNamespace;
  key?: string;
}

// L1 Cache (in-memory)
class L1Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);
    entry.hits++;

    return entry.data;
  }

  set(key: string, data: T, version: string, locale: string, namespace?: TranslationNamespace): void {
    // Evict if at capacity
    while (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      version,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.ttlMs),
      hits: 0,
      locale,
      namespace,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  invalidateByLocale(locale: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.locale === locale) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        count++;
      }
    }
    return count;
  }

  invalidateByNamespace(namespace: TranslationNamespace): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.namespace === namespace) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        count++;
      }
    }
    return count;
  }

  size(): number {
    return this.cache.size;
  }

  entries(): IterableIterator<[string, CacheEntry<T>]> {
    return this.cache.entries();
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Simulated L2 Cache (Redis-like)
class L2Cache {
  private store: Map<string, { data: string; expiresAt: number }> = new Map();
  private keyPrefix: string;

  constructor(keyPrefix: string) {
    this.keyPrefix = keyPrefix;
  }

  async get(key: string): Promise<string | null> {
    const fullKey = this.keyPrefix + key;
    const entry = this.store.get(fullKey);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(fullKey);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: string, ttlMs: number): Promise<void> {
    const fullKey = this.keyPrefix + key;
    this.store.set(fullKey, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.keyPrefix + key;
    return this.store.delete(fullKey);
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + this.keyPrefix + pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + this.keyPrefix + pattern.replace('*', '.*'));
    const result: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        result.push(key.substring(this.keyPrefix.length));
      }
    }

    return result;
  }

  async clear(): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(this.keyPrefix)) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
let instance: TranslationCache | null = null;

/**
 * Translation Cache implementation
 */
export class TranslationCache extends EventEmitter {
  private config: CacheConfig;
  private l1: L1Cache<any>;
  private l2: L2Cache;
  private stats: CacheStats;
  private accessTimes: number[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = {
      l1MaxSize: 1000,
      l1TtlMs: 5 * 60 * 1000, // 5 minutes
      l2TtlMs: 60 * 60 * 1000, // 1 hour
      l2KeyPrefix: 'translations:',
      enableL2: true,
      enableCompression: true,
      compressionThreshold: 1024, // bytes
      warmOnStart: false,
      warmLocales: ['en', 'es', 'fr', 'de'],
      warmNamespaces: ['common', 'auth', 'errors'],
      ...config,
    };

    this.l1 = new L1Cache(this.config.l1MaxSize, this.config.l1TtlMs);
    this.l2 = new L2Cache(this.config.l2KeyPrefix);

    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0,
      avgAccessTime: 0,
      invalidations: 0,
      warmups: 0,
    };
  }

  /**
   * Generate cache key
   */
  private generateKey(cacheKey: CacheKey): string {
    const parts = [cacheKey.locale];

    if (cacheKey.namespace) {
      parts.push(cacheKey.namespace);
    }

    if (cacheKey.key) {
      parts.push(cacheKey.key);
    }

    return parts.join(':');
  }

  /**
   * Get from cache
   */
  async get<T>(cacheKey: CacheKey): Promise<T | null> {
    const key = this.generateKey(cacheKey);
    const startTime = Date.now();

    try {
      // Try L1 first
      const l1Result = this.l1.get(key);
      if (l1Result !== null) {
        this.stats.l1Hits++;
        this.recordAccessTime(startTime);
        return l1Result as T;
      }

      this.stats.l1Misses++;

      // Try L2
      if (this.config.enableL2) {
        const l2Result = await this.l2.get(key);
        if (l2Result !== null) {
          this.stats.l2Hits++;

          // Parse and promote to L1
          const data = this.decompress(l2Result);
          const parsed = JSON.parse(data);
          this.l1.set(key, parsed, parsed.version || '1', cacheKey.locale, cacheKey.namespace);

          this.recordAccessTime(startTime);
          return parsed as T;
        }

        this.stats.l2Misses++;
      }

      this.recordAccessTime(startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set in cache
   */
  async set<T extends { version?: string }>(
    cacheKey: CacheKey,
    data: T,
    options: { ttlMs?: number } = {}
  ): Promise<void> {
    const key = this.generateKey(cacheKey);
    const version = data.version || Date.now().toString();

    try {
      // Set in L1
      this.l1.set(key, data, version, cacheKey.locale, cacheKey.namespace);

      // Set in L2
      if (this.config.enableL2) {
        const serialized = JSON.stringify(data);
        const compressed = this.compress(serialized);
        const ttl = options.ttlMs || this.config.l2TtlMs;
        await this.l2.set(key, compressed, ttl);
      }

      this.updateStats();
      this.emit('cache:set', { key, locale: cacheKey.locale, namespace: cacheKey.namespace });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(cacheKey: CacheKey): Promise<boolean> {
    const key = this.generateKey(cacheKey);

    try {
      const l1Deleted = this.l1.delete(key);
      let l2Deleted = false;

      if (this.config.enableL2) {
        l2Deleted = await this.l2.delete(key);
      }

      if (l1Deleted || l2Deleted) {
        this.stats.invalidations++;
        this.emit('cache:delete', { key });
      }

      return l1Deleted || l2Deleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate by locale
   */
  async invalidateLocale(locale: string): Promise<number> {
    try {
      const l1Count = this.l1.invalidateByLocale(locale);
      let l2Count = 0;

      if (this.config.enableL2) {
        l2Count = await this.l2.deletePattern(`${locale}:*`);
      }

      const total = l1Count + l2Count;
      this.stats.invalidations += total;

      this.emit('cache:invalidate', { locale, count: total });
      return total;
    } catch (error) {
      console.error('Cache invalidate locale error:', error);
      return 0;
    }
  }

  /**
   * Invalidate by namespace
   */
  async invalidateNamespace(namespace: TranslationNamespace): Promise<number> {
    try {
      const l1Count = this.l1.invalidateByNamespace(namespace);
      let l2Count = 0;

      if (this.config.enableL2) {
        l2Count = await this.l2.deletePattern(`*:${namespace}:*`);
      }

      const total = l1Count + l2Count;
      this.stats.invalidations += total;

      this.emit('cache:invalidate', { namespace, count: total });
      return total;
    } catch (error) {
      console.error('Cache invalidate namespace error:', error);
      return 0;
    }
  }

  /**
   * Invalidate single translation
   */
  async invalidateTranslation(locale: string, keyName: string): Promise<boolean> {
    const [namespace] = keyName.split('.') as [TranslationNamespace];
    return this.delete({ locale, namespace, key: keyName });
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.l1.clear();

      if (this.config.enableL2) {
        await this.l2.clear();
      }

      this.stats.invalidations++;
      this.emit('cache:clear');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cache a translation bundle
   */
  async cacheBundle(bundle: TranslationBundle): Promise<void> {
    await this.set(
      { locale: bundle.locale, namespace: bundle.namespace },
      bundle
    );
  }

  /**
   * Get cached bundle
   */
  async getBundle(locale: string, namespace: TranslationNamespace): Promise<TranslationBundle | null> {
    return this.get<TranslationBundle>({ locale, namespace });
  }

  /**
   * Warm cache with specified locales and namespaces
   */
  async warmCache(
    bundleGenerator: (locale: string, namespace: TranslationNamespace) => Promise<TranslationBundle>,
    locales?: string[],
    namespaces?: TranslationNamespace[]
  ): Promise<{ warmed: number; failed: number }> {
    const targetLocales = locales || this.config.warmLocales;
    const targetNamespaces = namespaces || this.config.warmNamespaces;

    let warmed = 0;
    let failed = 0;

    for (const locale of targetLocales) {
      for (const namespace of targetNamespaces) {
        try {
          const bundle = await bundleGenerator(locale, namespace);
          await this.cacheBundle(bundle);
          warmed++;
        } catch (error) {
          console.error(`Failed to warm cache for ${locale}:${namespace}:`, error);
          failed++;
        }
      }
    }

    this.stats.warmups++;
    this.emit('cache:warm', { warmed, failed });

    return { warmed, failed };
  }

  /**
   * Compress data if above threshold
   */
  private compress(data: string): string {
    if (!this.config.enableCompression || data.length < this.config.compressionThreshold) {
      return data;
    }

    // Simple compression (in production, use zlib or similar)
    // For now, just return as-is since this is a demo
    return data;
  }

  /**
   * Decompress data
   */
  private decompress(data: string): string {
    // In production, detect and decompress if needed
    return data;
  }

  /**
   * Record access time for stats
   */
  private recordAccessTime(startTime: number): void {
    const accessTime = Date.now() - startTime;
    this.accessTimes.push(accessTime);

    // Keep last 1000 access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes.shift();
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.l1.size();

    const totalRequests = this.stats.l1Hits + this.stats.l1Misses;
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    this.stats.hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    if (this.accessTimes.length > 0) {
      this.stats.avgAccessTime = this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;
    }

    // Estimate memory usage (rough approximation)
    let memoryBytes = 0;
    for (const [, entry] of this.l1.entries()) {
      memoryBytes += JSON.stringify(entry.data).length * 2; // UTF-16
    }
    this.stats.memoryUsage = memoryBytes;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      hitRate: 0,
      totalEntries: this.l1.size(),
      memoryUsage: 0,
      avgAccessTime: 0,
      invalidations: 0,
      warmups: 0,
    };
    this.accessTimes = [];
  }

  /**
   * Check cache health
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    l1Status: string;
    l2Status: string;
    details: Record<string, any>;
  }> {
    const stats = this.getStats();

    // Check L1
    const l1Healthy = stats.totalEntries < this.config.l1MaxSize * 0.9;
    const l1Status = l1Healthy ? 'healthy' : 'near_capacity';

    // Check L2 (simulated)
    const l2Healthy = true;
    const l2Status = this.config.enableL2 ? 'healthy' : 'disabled';

    // Check hit rate
    const hitRateHealthy = stats.hitRate > 50 || (stats.l1Hits + stats.l1Misses) < 100;

    return {
      healthy: l1Healthy && (l2Healthy || !this.config.enableL2) && hitRateHealthy,
      l1Status,
      l2Status,
      details: {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        entries: stats.totalEntries,
        maxSize: this.config.l1MaxSize,
        avgAccessTime: `${stats.avgAccessTime.toFixed(2)}ms`,
        memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)}KB`,
      },
    };
  }

  /**
   * Get cached keys
   */
  async getKeys(pattern?: string): Promise<string[]> {
    const keys: string[] = [];

    for (const [key] of this.l1.entries()) {
      if (!pattern || key.includes(pattern)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Preload translations for a user session
   */
  async preloadForUser(
    locale: string,
    namespaces: TranslationNamespace[],
    bundleGenerator: (locale: string, namespace: TranslationNamespace) => Promise<TranslationBundle>
  ): Promise<void> {
    const promises = namespaces.map(async (namespace) => {
      const cached = await this.getBundle(locale, namespace);
      if (!cached) {
        const bundle = await bundleGenerator(locale, namespace);
        await this.cacheBundle(bundle);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get cache entry metadata
   */
  async getEntryMetadata(cacheKey: CacheKey): Promise<{
    exists: boolean;
    cachedAt?: Date;
    expiresAt?: Date;
    hits?: number;
    version?: string;
  } | null> {
    const key = this.generateKey(cacheKey);

    for (const [k, entry] of this.l1.entries()) {
      if (k === key) {
        return {
          exists: true,
          cachedAt: entry.cachedAt,
          expiresAt: entry.expiresAt,
          hits: entry.hits,
          version: entry.version,
        };
      }
    }

    return { exists: false };
  }
}

/**
 * Get singleton instance
 */
export function getTranslationCache(config?: Partial<CacheConfig>): TranslationCache {
  if (!instance) {
    instance = new TranslationCache(config);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetTranslationCache(): void {
  instance = null;
}
