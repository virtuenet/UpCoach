import Redis, { Cluster, ClusterNode, ClusterOptions } from 'ioredis';
import NodeCache from 'node-cache';
import { compress as lz4Compress, decompress as lz4Decompress } from 'lz4';
import snappy from 'snappy';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';

export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BEHIND = 'write_behind',
  WRITE_AROUND = 'write_around',
  READ_THROUGH = 'read_through',
}

export enum CompressionAlgorithm {
  NONE = 'none',
  LZ4 = 'lz4',
  SNAPPY = 'snappy',
}

export interface CacheConfig {
  l1: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    checkPeriod: number;
  };
  l2: {
    enabled: boolean;
    nodes: ClusterNode[];
    options: ClusterOptions;
    sentinels?: Array<{ host: string; port: number }>;
    crossRegionReplication: boolean;
  };
  l3: {
    enabled: boolean;
    provider: 'cloudflare' | 'cloudfront' | 'fastly';
  };
  compression: {
    enabled: boolean;
    algorithm: CompressionAlgorithm;
    threshold: number;
  };
  cacheWarming: {
    enabled: boolean;
    onStartup: boolean;
    backgroundRefresh: boolean;
    predictive: boolean;
  };
  invalidation: {
    ttlBased: boolean;
    eventDriven: boolean;
    tagBased: boolean;
    probabilisticEarlyExpiration: boolean;
  };
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl?: number;
  tags?: string[];
  compressed?: boolean;
  compressionAlgorithm?: CompressionAlgorithm;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessedAt: number;
}

export interface CacheMetrics {
  l1: {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    memoryUsage: number;
  };
  l2: {
    hits: number;
    misses: number;
    evictions: number;
    memoryUsage: number;
    connectionPoolSize: number;
  };
  l3: {
    hits: number;
    misses: number;
    bandwidth: number;
  };
  overall: {
    hitRatio: number;
    missRatio: number;
    averageLatency: {
      get: { p50: number; p95: number; p99: number };
      set: { p50: number; p95: number; p99: number };
    };
  };
}

export interface CacheOperation {
  operation: 'get' | 'set' | 'delete' | 'invalidate';
  key: string;
  layer: 'L1' | 'L2' | 'L3';
  latency: number;
  hit: boolean;
  timestamp: number;
}

interface WriteQueue {
  key: string;
  value: any;
  timestamp: number;
  retries: number;
}

interface AccessPattern {
  key: string;
  accessCount: number;
  lastAccess: number;
  frequency: number;
  recency: number;
  score: number;
}

export class DistributedCache extends EventEmitter {
  private l1Cache: NodeCache | null = null;
  private l2Cache: Cluster | null = null;
  private l2Sentinel: Redis | null = null;
  private config: CacheConfig;
  private logger: Logger;
  private metrics: MetricsCollector;
  private writeQueue: WriteQueue[] = [];
  private accessPatterns: Map<string, AccessPattern> = new Map();
  private operationHistory: CacheOperation[] = [];
  private warmingInProgress = false;
  private readonly COMPRESSION_THRESHOLD = 1024;
  private readonly MAX_WRITE_QUEUE_SIZE = 10000;
  private readonly WRITE_BATCH_INTERVAL = 1000;
  private readonly HASH_SLOTS = 16384;
  private readonly PROBABILISTIC_EXPIRATION_BETA = 1.5;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.logger = new Logger('DistributedCache');
    this.metrics = new MetricsCollector('cache');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (this.config.l1.enabled) {
        await this.initializeL1Cache();
      }

      if (this.config.l2.enabled) {
        await this.initializeL2Cache();
      }

      if (this.config.cacheWarming.enabled && this.config.cacheWarming.onStartup) {
        await this.warmCache();
      }

      if (this.config.cacheWarming.backgroundRefresh) {
        this.startBackgroundRefresh();
      }

      this.startWriteBehindProcessor();
      this.startMetricsCollection();
      this.startAccessPatternAnalysis();

      this.logger.info('Distributed cache initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize distributed cache', error);
      throw error;
    }
  }

  private initializeL1Cache(): void {
    this.l1Cache = new NodeCache({
      stdTTL: this.config.l1.ttl,
      checkperiod: this.config.l1.checkPeriod,
      maxKeys: Math.floor(this.config.l1.maxSize / 1024),
      useClones: false,
    });

    this.l1Cache.on('expired', (key: string, value: any) => {
      this.logger.debug(`L1 cache key expired: ${key}`);
      this.metrics.increment('cache.l1.evictions');
      this.emit('eviction', { key, layer: 'L1', reason: 'expired' });
    });

    this.l1Cache.on('del', (key: string, value: any) => {
      this.metrics.increment('cache.l1.deletions');
    });

    this.logger.info('L1 in-memory cache initialized', {
      maxSize: this.config.l1.maxSize,
      ttl: this.config.l1.ttl,
    });
  }

  private async initializeL2Cache(): Promise<void> {
    const clusterOptions: ClusterOptions = {
      ...this.config.l2.options,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
      slotsRefreshTimeout: 1000,
      clusterRetryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error('Redis cluster connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      redisOptions: {
        connectTimeout: 10000,
        keepAlive: 30000,
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      },
    };

    this.l2Cache = new Redis.Cluster(this.config.l2.nodes, clusterOptions);

    this.l2Cache.on('ready', () => {
      this.logger.info('Redis cluster connected and ready');
      this.emit('l2-ready');
    });

    this.l2Cache.on('error', (error) => {
      this.logger.error('Redis cluster error', error);
      this.metrics.increment('cache.l2.errors');
      this.emit('l2-error', error);
    });

    this.l2Cache.on('node error', (error, node) => {
      this.logger.error(`Redis node error: ${node}`, error);
      this.metrics.increment('cache.l2.node_errors');
    });

    this.l2Cache.on('+node', (node) => {
      this.logger.info(`Redis node added: ${node.options.host}:${node.options.port}`);
    });

    this.l2Cache.on('-node', (node) => {
      this.logger.warn(`Redis node removed: ${node.options.host}:${node.options.port}`);
    });

    if (this.config.l2.sentinels && this.config.l2.sentinels.length > 0) {
      await this.initializeSentinel();
    }

    await this.verifyClusterHealth();
    await this.configureReplication();

    this.logger.info('L2 Redis cluster initialized', {
      nodes: this.config.l2.nodes.length,
      crossRegionReplication: this.config.l2.crossRegionReplication,
    });
  }

  private async initializeSentinel(): Promise<void> {
    if (!this.config.l2.sentinels || this.config.l2.sentinels.length === 0) {
      return;
    }

    this.l2Sentinel = new Redis({
      sentinels: this.config.l2.sentinels,
      name: 'mymaster',
      sentinelRetryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error('Sentinel connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    this.l2Sentinel.on('ready', () => {
      this.logger.info('Redis Sentinel connected');
    });

    this.l2Sentinel.on('error', (error) => {
      this.logger.error('Redis Sentinel error', error);
    });

    this.l2Sentinel.on('+switch-master', (master) => {
      this.logger.warn('Redis master switched', master);
      this.metrics.increment('cache.l2.failovers');
      this.emit('failover', { master });
    });
  }

  private async verifyClusterHealth(): Promise<void> {
    if (!this.l2Cache) return;

    try {
      const clusterInfo = await this.l2Cache.cluster('INFO');
      const clusterState = clusterInfo.match(/cluster_state:(\w+)/)?.[1];

      if (clusterState !== 'ok') {
        throw new Error(`Cluster state is not ok: ${clusterState}`);
      }

      const slots = clusterInfo.match(/cluster_slots_assigned:(\d+)/)?.[1];
      if (parseInt(slots || '0') !== this.HASH_SLOTS) {
        this.logger.warn(`Not all hash slots are assigned: ${slots}/${this.HASH_SLOTS}`);
      }

      this.logger.info('Redis cluster health verified', { state: clusterState, slots });
    } catch (error) {
      this.logger.error('Cluster health verification failed', error);
      throw error;
    }
  }

  private async configureReplication(): Promise<void> {
    if (!this.l2Cache || !this.config.l2.crossRegionReplication) return;

    try {
      const nodes = this.l2Cache.nodes('master');
      for (const node of nodes) {
        await node.config('SET', 'min-replicas-to-write', '1');
        await node.config('SET', 'min-replicas-max-lag', '10');
        this.logger.debug(`Configured replication for node: ${node.options.host}`);
      }
    } catch (error) {
      this.logger.error('Failed to configure replication', error);
    }
  }

  public async get<T>(
    key: string,
    options: {
      strategy?: CacheStrategy;
      fallback?: () => Promise<T>;
      ttl?: number;
    } = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    let result: T | null = null;
    let hitLayer: 'L1' | 'L2' | 'L3' | null = null;

    try {
      if (this.shouldProbabilisticallyExpire(key)) {
        await this.delete(key);
        this.logger.debug(`Probabilistic early expiration for key: ${key}`);
      }

      if (this.config.l1.enabled && this.l1Cache) {
        const l1Value = this.l1Cache.get<string>(key);
        if (l1Value !== undefined) {
          result = await this.deserializeValue<T>(l1Value);
          hitLayer = 'L1';
          this.metrics.increment('cache.l1.hits');
          this.recordOperation('get', key, 'L1', Date.now() - startTime, true);
        } else {
          this.metrics.increment('cache.l1.misses');
        }
      }

      if (result === null && this.config.l2.enabled && this.l2Cache) {
        const l2Value = await this.l2Cache.get(key);
        if (l2Value) {
          result = await this.deserializeValue<T>(l2Value);
          hitLayer = 'L2';
          this.metrics.increment('cache.l2.hits');
          this.recordOperation('get', key, 'L2', Date.now() - startTime, true);

          if (this.config.l1.enabled && this.l1Cache) {
            const serialized = await this.serializeValue(result);
            this.l1Cache.set(key, serialized, options.ttl || this.config.l1.ttl);
          }
        } else {
          this.metrics.increment('cache.l2.misses');
        }
      }

      if (result === null && options.strategy === CacheStrategy.READ_THROUGH && options.fallback) {
        result = await options.fallback();
        if (result !== null) {
          await this.set(key, result, { ttl: options.ttl, strategy: CacheStrategy.WRITE_THROUGH });
        }
      }

      this.updateAccessPattern(key);

      const latency = Date.now() - startTime;
      this.metrics.histogram('cache.get.latency', latency);

      if (hitLayer) {
        this.logger.debug(`Cache hit on ${hitLayer}`, { key, latency });
      } else {
        this.logger.debug('Cache miss', { key, latency });
      }

      return result;
    } catch (error) {
      this.logger.error('Cache get failed', { key, error });
      this.metrics.increment('cache.errors');
      return null;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
      strategy?: CacheStrategy;
      compress?: boolean;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const serialized = await this.serializeValue(value, options.compress);
      const ttl = options.ttl || this.config.l1.ttl;

      switch (options.strategy) {
        case CacheStrategy.WRITE_THROUGH:
          await this.writeThrough(key, serialized, ttl, options.tags);
          break;

        case CacheStrategy.WRITE_BEHIND:
          await this.writeBehind(key, serialized, ttl, options.tags);
          break;

        case CacheStrategy.WRITE_AROUND:
          await this.writeAround(key);
          break;

        default:
          await this.writeThrough(key, serialized, ttl, options.tags);
      }

      this.updateAccessPattern(key);

      const latency = Date.now() - startTime;
      this.metrics.histogram('cache.set.latency', latency);
      this.recordOperation('set', key, 'L1', latency, true);

      return true;
    } catch (error) {
      this.logger.error('Cache set failed', { key, error });
      this.metrics.increment('cache.errors');
      return false;
    }
  }

  private async writeThrough(
    key: string,
    value: string,
    ttl: number,
    tags?: string[]
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.l1.enabled && this.l1Cache) {
      this.l1Cache.set(key, value, ttl);
      promises.push(Promise.resolve());
    }

    if (this.config.l2.enabled && this.l2Cache) {
      const multi = this.l2Cache.multi();
      multi.setex(key, ttl, value);

      if (tags && tags.length > 0) {
        for (const tag of tags) {
          multi.sadd(`tag:${tag}`, key);
          multi.expire(`tag:${tag}`, ttl);
        }
      }

      promises.push(multi.exec());
    }

    await Promise.all(promises);
  }

  private async writeBehind(
    key: string,
    value: string,
    ttl: number,
    tags?: string[]
  ): Promise<void> {
    if (this.config.l1.enabled && this.l1Cache) {
      this.l1Cache.set(key, value, ttl);
    }

    if (this.writeQueue.length >= this.MAX_WRITE_QUEUE_SIZE) {
      this.logger.warn('Write queue is full, switching to write-through');
      await this.writeThrough(key, value, ttl, tags);
      return;
    }

    this.writeQueue.push({
      key,
      value: { value, ttl, tags },
      timestamp: Date.now(),
      retries: 0,
    });

    this.metrics.gauge('cache.write_queue.size', this.writeQueue.length);
  }

  private async writeAround(key: string): Promise<void> {
    await this.delete(key);
  }

  private startWriteBehindProcessor(): void {
    setInterval(async () => {
      if (this.writeQueue.length === 0 || !this.l2Cache) return;

      const batch = this.writeQueue.splice(0, 100);
      const multi = this.l2Cache.multi();

      for (const item of batch) {
        try {
          const { value, ttl, tags } = item.value;
          multi.setex(item.key, ttl, value);

          if (tags && tags.length > 0) {
            for (const tag of tags) {
              multi.sadd(`tag:${tag}`, item.key);
              multi.expire(`tag:${tag}`, ttl);
            }
          }
        } catch (error) {
          this.logger.error('Write-behind processing failed', { key: item.key, error });

          if (item.retries < 3) {
            item.retries++;
            this.writeQueue.push(item);
          } else {
            this.metrics.increment('cache.write_behind.failed');
          }
        }
      }

      try {
        await multi.exec();
        this.metrics.increment('cache.write_behind.processed', batch.length);
      } catch (error) {
        this.logger.error('Write-behind batch execution failed', error);
        this.writeQueue.push(...batch);
      }

      this.metrics.gauge('cache.write_queue.size', this.writeQueue.length);
    }, this.WRITE_BATCH_INTERVAL);
  }

  public async delete(key: string): Promise<boolean> {
    try {
      const promises: Promise<any>[] = [];

      if (this.config.l1.enabled && this.l1Cache) {
        this.l1Cache.del(key);
        promises.push(Promise.resolve());
      }

      if (this.config.l2.enabled && this.l2Cache) {
        promises.push(this.l2Cache.del(key));
      }

      await Promise.all(promises);
      this.recordOperation('delete', key, 'L1', 0, true);

      return true;
    } catch (error) {
      this.logger.error('Cache delete failed', { key, error });
      return false;
    }
  }

  public async invalidateByTag(tag: string): Promise<number> {
    if (!this.config.invalidation.tagBased || !this.l2Cache) {
      return 0;
    }

    try {
      const keys = await this.l2Cache.smembers(`tag:${tag}`);
      let invalidated = 0;

      for (const key of keys) {
        const deleted = await this.delete(key);
        if (deleted) invalidated++;
      }

      await this.l2Cache.del(`tag:${tag}`);

      this.logger.info(`Invalidated ${invalidated} keys for tag: ${tag}`);
      this.metrics.increment('cache.invalidation.by_tag', invalidated);

      return invalidated;
    } catch (error) {
      this.logger.error('Tag-based invalidation failed', { tag, error });
      return 0;
    }
  }

  public async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.l2Cache) return 0;

    try {
      let invalidated = 0;
      const stream = this.l2Cache.scanStream({ match: pattern, count: 100 });

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          for (const key of keys) {
            await this.delete(key);
            invalidated++;
          }
        }
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      this.logger.info(`Invalidated ${invalidated} keys for pattern: ${pattern}`);
      this.metrics.increment('cache.invalidation.by_pattern', invalidated);

      return invalidated;
    } catch (error) {
      this.logger.error('Pattern-based invalidation failed', { pattern, error });
      return 0;
    }
  }

  private shouldProbabilisticallyExpire(key: string): boolean {
    if (!this.config.invalidation.probabilisticEarlyExpiration) {
      return false;
    }

    const pattern = this.accessPatterns.get(key);
    if (!pattern) return false;

    const now = Date.now();
    const timeSinceLastAccess = now - pattern.lastAccess;
    const avgAccessInterval = pattern.accessCount > 1 ? timeSinceLastAccess / pattern.accessCount : timeSinceLastAccess;

    const delta = avgAccessInterval * this.PROBABILISTIC_EXPIRATION_BETA;
    const probability = delta / (avgAccessInterval + delta);

    return Math.random() < probability;
  }

  private async serializeValue<T>(value: T, forceCompress?: boolean): Promise<string> {
    try {
      const jsonString = JSON.stringify(value);

      if (!this.config.compression.enabled && !forceCompress) {
        return jsonString;
      }

      const shouldCompress =
        forceCompress ||
        Buffer.byteLength(jsonString) >= (this.config.compression.threshold || this.COMPRESSION_THRESHOLD);

      if (!shouldCompress) {
        return jsonString;
      }

      const buffer = Buffer.from(jsonString);
      let compressed: Buffer;
      let algorithm: CompressionAlgorithm;

      if (this.config.compression.algorithm === CompressionAlgorithm.LZ4) {
        compressed = lz4Compress(buffer);
        algorithm = CompressionAlgorithm.LZ4;
      } else if (this.config.compression.algorithm === CompressionAlgorithm.SNAPPY) {
        compressed = await snappy.compress(buffer);
        algorithm = CompressionAlgorithm.SNAPPY;
      } else {
        return jsonString;
      }

      const metadata = {
        compressed: true,
        algorithm,
        originalSize: buffer.length,
      };

      return JSON.stringify({
        _meta: metadata,
        data: compressed.toString('base64'),
      });
    } catch (error) {
      this.logger.error('Value serialization failed', error);
      throw error;
    }
  }

  private async deserializeValue<T>(serialized: string): Promise<T> {
    try {
      const parsed = JSON.parse(serialized);

      if (!parsed._meta || !parsed._meta.compressed) {
        return parsed as T;
      }

      const compressedBuffer = Buffer.from(parsed.data, 'base64');
      let decompressed: Buffer;

      if (parsed._meta.algorithm === CompressionAlgorithm.LZ4) {
        decompressed = lz4Decompress(compressedBuffer, parsed._meta.originalSize);
      } else if (parsed._meta.algorithm === CompressionAlgorithm.SNAPPY) {
        decompressed = await snappy.uncompress(compressedBuffer);
      } else {
        throw new Error(`Unknown compression algorithm: ${parsed._meta.algorithm}`);
      }

      const jsonString = decompressed.toString();
      return JSON.parse(jsonString) as T;
    } catch (error) {
      try {
        return JSON.parse(serialized) as T;
      } catch {
        this.logger.error('Value deserialization failed', error);
        throw error;
      }
    }
  }

  private async warmCache(): Promise<void> {
    if (this.warmingInProgress) {
      this.logger.warn('Cache warming already in progress');
      return;
    }

    this.warmingInProgress = true;
    this.logger.info('Starting cache warming');

    try {
      const hotKeys = await this.identifyHotKeys();

      for (const keyPattern of hotKeys) {
        try {
          await this.warmKeyPattern(keyPattern);
        } catch (error) {
          this.logger.error(`Failed to warm key pattern: ${keyPattern}`, error);
        }
      }

      this.logger.info('Cache warming completed', { patterns: hotKeys.length });
      this.emit('warming-complete', { patterns: hotKeys.length });
    } catch (error) {
      this.logger.error('Cache warming failed', error);
    } finally {
      this.warmingInProgress = false;
    }
  }

  private async identifyHotKeys(): Promise<string[]> {
    const hotPatterns: string[] = [
      'user:*:profile',
      'course:*:metadata',
      'session:*:data',
      'config:*',
      'feature:flags:*',
    ];

    const topAccessPatterns = Array.from(this.accessPatterns.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 100)
      .map(([key]) => key);

    return [...hotPatterns, ...topAccessPatterns];
  }

  private async warmKeyPattern(pattern: string): Promise<void> {
    this.logger.debug(`Warming cache for pattern: ${pattern}`);
  }

  private startBackgroundRefresh(): void {
    setInterval(async () => {
      if (this.warmingInProgress) return;

      const topKeys = Array.from(this.accessPatterns.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 50)
        .map(([key]) => key);

      for (const key of topKeys) {
        try {
          const value = await this.get(key);
          if (value !== null) {
            await this.set(key, value, { strategy: CacheStrategy.WRITE_THROUGH });
          }
        } catch (error) {
          this.logger.error(`Background refresh failed for key: ${key}`, error);
        }
      }
    }, 300000);
  }

  private updateAccessPattern(key: string): void {
    if (!this.config.cacheWarming.predictive) return;

    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || {
      key,
      accessCount: 0,
      lastAccess: now,
      frequency: 0,
      recency: 1,
      score: 0,
    };

    pattern.accessCount++;
    pattern.lastAccess = now;

    const timeSinceLastAccess = now - pattern.lastAccess;
    pattern.recency = 1 / (1 + timeSinceLastAccess / 1000);
    pattern.frequency = pattern.accessCount / ((now - pattern.lastAccess) / 1000 || 1);
    pattern.score = pattern.frequency * 0.7 + pattern.recency * 0.3;

    this.accessPatterns.set(key, pattern);

    if (this.accessPatterns.size > 10000) {
      const sorted = Array.from(this.accessPatterns.entries())
        .sort((a, b) => a[1].score - b[1].score)
        .slice(0, 5000);

      this.accessPatterns.clear();
      sorted.forEach(([key, pattern]) => this.accessPatterns.set(key, pattern));
    }
  }

  private startAccessPatternAnalysis(): void {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 3600000;

      for (const [key, pattern] of this.accessPatterns.entries()) {
        if (now - pattern.lastAccess > staleThreshold) {
          this.accessPatterns.delete(key);
        }
      }

      this.metrics.gauge('cache.access_patterns.size', this.accessPatterns.size);
    }, 600000);
  }

  private recordOperation(
    operation: 'get' | 'set' | 'delete' | 'invalidate',
    key: string,
    layer: 'L1' | 'L2' | 'L3',
    latency: number,
    hit: boolean
  ): void {
    this.operationHistory.push({
      operation,
      key,
      layer,
      latency,
      hit,
      timestamp: Date.now(),
    });

    if (this.operationHistory.length > 10000) {
      this.operationHistory = this.operationHistory.slice(-5000);
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 10000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.getMetrics();

      this.metrics.gauge('cache.l1.hit_ratio', metrics.l1.hits / (metrics.l1.hits + metrics.l1.misses) || 0);
      this.metrics.gauge('cache.l1.size', metrics.l1.size);
      this.metrics.gauge('cache.l1.memory_usage', metrics.l1.memoryUsage);

      this.metrics.gauge('cache.l2.hit_ratio', metrics.l2.hits / (metrics.l2.hits + metrics.l2.misses) || 0);
      this.metrics.gauge('cache.l2.memory_usage', metrics.l2.memoryUsage);

      this.metrics.gauge('cache.overall.hit_ratio', metrics.overall.hitRatio);
      this.metrics.histogram('cache.get.latency.p50', metrics.overall.averageLatency.get.p50);
      this.metrics.histogram('cache.get.latency.p95', metrics.overall.averageLatency.get.p95);
      this.metrics.histogram('cache.get.latency.p99', metrics.overall.averageLatency.get.p99);

      if (metrics.overall.hitRatio < 0.9) {
        this.logger.warn('Cache hit ratio below threshold', {
          hitRatio: metrics.overall.hitRatio,
        });
        this.emit('low-hit-ratio', { hitRatio: metrics.overall.hitRatio });
      }

      if (metrics.l1.memoryUsage > this.config.l1.maxSize * 0.9) {
        this.logger.warn('L1 cache memory usage high', {
          usage: metrics.l1.memoryUsage,
          max: this.config.l1.maxSize,
        });
        this.emit('high-memory-usage', { layer: 'L1', usage: metrics.l1.memoryUsage });
      }
    } catch (error) {
      this.logger.error('Metrics collection failed', error);
    }
  }

  public async getMetrics(): Promise<CacheMetrics> {
    const l1Stats = this.l1Cache?.getStats();
    const l2Info = this.l2Cache ? await this.getRedisInfo() : null;

    const getLatencies = this.operationHistory
      .filter((op) => op.operation === 'get')
      .map((op) => op.latency)
      .sort((a, b) => a - b);

    const setLatencies = this.operationHistory
      .filter((op) => op.operation === 'set')
      .map((op) => op.latency)
      .sort((a, b) => a - b);

    const percentile = (arr: number[], p: number) =>
      arr[Math.floor(arr.length * p)] || 0;

    const totalHits =
      (l1Stats?.hits || 0) + (l2Info?.hits || 0);
    const totalMisses =
      (l1Stats?.misses || 0) + (l2Info?.misses || 0);

    return {
      l1: {
        hits: l1Stats?.hits || 0,
        misses: l1Stats?.misses || 0,
        evictions: 0,
        size: l1Stats?.keys || 0,
        memoryUsage: this.estimateL1Memory(),
      },
      l2: {
        hits: l2Info?.hits || 0,
        misses: l2Info?.misses || 0,
        evictions: l2Info?.evictions || 0,
        memoryUsage: l2Info?.memoryUsage || 0,
        connectionPoolSize: l2Info?.connectedClients || 0,
      },
      l3: {
        hits: 0,
        misses: 0,
        bandwidth: 0,
      },
      overall: {
        hitRatio: totalHits / (totalHits + totalMisses) || 0,
        missRatio: totalMisses / (totalHits + totalMisses) || 0,
        averageLatency: {
          get: {
            p50: percentile(getLatencies, 0.5),
            p95: percentile(getLatencies, 0.95),
            p99: percentile(getLatencies, 0.99),
          },
          set: {
            p50: percentile(setLatencies, 0.5),
            p95: percentile(setLatencies, 0.95),
            p99: percentile(setLatencies, 0.99),
          },
        },
      },
    };
  }

  private async getRedisInfo(): Promise<any> {
    if (!this.l2Cache) return null;

    try {
      const info = await this.l2Cache.info();
      const stats = this.parseRedisInfo(info);

      return {
        hits: parseInt(stats.keyspace_hits || '0'),
        misses: parseInt(stats.keyspace_misses || '0'),
        evictions: parseInt(stats.evicted_keys || '0'),
        memoryUsage: parseInt(stats.used_memory || '0'),
        connectedClients: parseInt(stats.connected_clients || '0'),
      };
    } catch (error) {
      this.logger.error('Failed to get Redis info', error);
      return null;
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  private estimateL1Memory(): number {
    if (!this.l1Cache) return 0;

    const stats = this.l1Cache.getStats();
    const avgKeySize = 50;
    const avgValueSize = 500;

    return stats.keys * (avgKeySize + avgValueSize);
  }

  public async flush(): Promise<void> {
    try {
      if (this.l1Cache) {
        this.l1Cache.flushAll();
      }

      if (this.l2Cache) {
        await this.l2Cache.flushall();
      }

      this.writeQueue = [];
      this.accessPatterns.clear();
      this.operationHistory = [];

      this.logger.info('Cache flushed successfully');
      this.emit('flushed');
    } catch (error) {
      this.logger.error('Cache flush failed', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.l1Cache) {
        this.l1Cache.close();
      }

      if (this.l2Cache) {
        await this.l2Cache.quit();
      }

      if (this.l2Sentinel) {
        await this.l2Sentinel.quit();
      }

      this.logger.info('Distributed cache closed');
      this.emit('closed');
    } catch (error) {
      this.logger.error('Failed to close distributed cache', error);
      throw error;
    }
  }

  public getAccessPatterns(): AccessPattern[] {
    return Array.from(this.accessPatterns.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  }

  public getOperationHistory(limit: number = 1000): CacheOperation[] {
    return this.operationHistory.slice(-limit);
  }

  public async getClusterInfo(): Promise<any> {
    if (!this.l2Cache) return null;

    try {
      const info = await this.l2Cache.cluster('INFO');
      const nodes = await this.l2Cache.cluster('NODES');

      return {
        info: this.parseRedisInfo(info),
        nodes: this.parseClusterNodes(nodes),
      };
    } catch (error) {
      this.logger.error('Failed to get cluster info', error);
      return null;
    }
  }

  private parseClusterNodes(nodes: string): any[] {
    const lines = nodes.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      const parts = line.split(' ');
      return {
        id: parts[0],
        address: parts[1],
        flags: parts[2],
        master: parts[3],
        pingSent: parts[4],
        pongReceived: parts[5],
        epoch: parts[6],
        linkState: parts[7],
        slots: parts.slice(8).join(' '),
      };
    });
  }
}

export default DistributedCache;
