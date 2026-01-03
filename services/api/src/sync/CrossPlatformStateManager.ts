import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import * as zstd from 'zstd-codec';
import Queue from 'bull';
import crypto from 'crypto';

interface StateLayer {
  type: 'global' | 'user' | 'session' | 'device';
  priority: number;
  ttl: number;
}

interface NormalizedState {
  id: string;
  entityType: string;
  entityId: string;
  data: any;
  version: number;
  timestamp: number;
  checksum: string;
  layer: StateLayer['type'];
}

interface StateVersion {
  version: number;
  state: any;
  timestamp: number;
  author: string;
  changes: StateChange[];
  parent?: number;
}

interface StateChange {
  path: string;
  op: 'add' | 'remove' | 'replace';
  oldValue?: any;
  newValue?: any;
}

interface StateSubscription {
  id: string;
  entityType: string;
  entityId: string;
  deviceId: string;
  channel: 'ws' | 'sse';
  filters?: string[];
  transform?: (state: any) => any;
}

interface CacheEntry {
  key: string;
  value: any;
  layer: 1 | 2 | 3;
  size: number;
  accessCount: number;
  lastAccess: number;
  dependencies: string[];
}

interface StateDiff {
  added: Record<string, any>;
  modified: Record<string, { old: any; new: any }>;
  removed: Record<string, any>;
}

interface HydrationStrategy {
  mode: 'full' | 'progressive' | 'lazy';
  priority: string[];
  batchSize: number;
}

interface StateSnapshot {
  id: string;
  entityId: string;
  version: number;
  state: any;
  timestamp: number;
  compressed: boolean;
  immutable: boolean;
}

export class CrossPlatformStateManager extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private redisSubscriber: Redis;
  private wss: WebSocket.Server;
  private zstdCodec: any;
  private jobQueue: Queue.Queue;
  private l1Cache: Map<string, CacheEntry>;
  private subscriptions: Map<string, StateSubscription[]>;
  private stateVersions: Map<string, StateVersion[]>;
  private wsConnections: Map<string, WebSocket>;
  private l1MaxSize: number;
  private l1MaxEntries: number;
  private compressionLevel: number;
  private snapshotInterval: number;

  constructor(wsPort: number = 8081) {
    super();
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.redisSubscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.wss = new WebSocket.Server({ port: wsPort });

    this.jobQueue = new Queue('state-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.l1Cache = new Map();
    this.subscriptions = new Map();
    this.stateVersions = new Map();
    this.wsConnections = new Map();
    this.l1MaxSize = 100 * 1024 * 1024;
    this.l1MaxEntries = 1000;
    this.compressionLevel = 3;
    this.snapshotInterval = 300000;

    this.initializeZstd();
    this.initializeWebSocket();
    this.initializeSubscriptions();
    this.initializeJobProcessors();
    this.startSnapshotScheduler();
  }

  private async initializeZstd(): Promise<void> {
    return new Promise((resolve) => {
      zstd.ZstdCodec.run((zstdCodec) => {
        this.zstdCodec = new zstdCodec.Streaming();
        resolve();
      });
    });
  }

  private initializeWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const deviceId = this.extractDeviceId(req.url || '');

      if (!deviceId) {
        ws.close(1008, 'Device ID required');
        return;
      }

      this.wsConnections.set(deviceId, ws);

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(deviceId, message);
        } catch (error) {
          this.sendError(deviceId, error as Error);
        }
      });

      ws.on('close', () => {
        this.wsConnections.delete(deviceId);
        this.cleanupSubscriptions(deviceId);
      });

      this.sendAck(deviceId, { status: 'connected' });
    });
  }

  private extractDeviceId(url: string): string | null {
    const match = url.match(/deviceId=([^&]+)/);
    return match ? match[1] : null;
  }

  private initializeSubscriptions(): void {
    this.redisSubscriber.psubscribe('state:*', (error) => {
      if (error) {
        console.error('Subscription error:', error);
      }
    });

    this.redisSubscriber.on('pmessage', async (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        await this.broadcastStateUpdate(channel, data);
      } catch (error) {
        console.error('Message broadcast error:', error);
      }
    });
  }

  private initializeJobProcessors(): void {
    this.jobQueue.process('normalize-state', async (job) => {
      return this.processNormalization(job.data);
    });

    this.jobQueue.process('hydrate-state', async (job) => {
      return this.processHydration(job.data);
    });

    this.jobQueue.process('compress-state', async (job) => {
      return this.processCompression(job.data);
    });

    this.jobQueue.process('invalidate-cache', async (job) => {
      return this.processInvalidation(job.data);
    });

    this.jobQueue.on('completed', (job) => {
      this.emit('job:completed', job);
    });

    this.jobQueue.on('failed', (job, error) => {
      this.emit('job:failed', { job, error });
    });
  }

  public async normalizeState(
    entityType: string,
    entityId: string,
    data: any,
    layer: StateLayer['type']
  ): Promise<NormalizedState> {
    try {
      const canonical = this.canonicalize(data);
      const version = await this.getNextVersion(entityId);
      const timestamp = Date.now();
      const checksum = this.computeChecksum(canonical);

      const normalized: NormalizedState = {
        id: crypto.randomUUID(),
        entityType,
        entityId,
        data: canonical,
        version,
        timestamp,
        checksum,
        layer,
      };

      await this.persistNormalizedState(normalized);

      this.emit('state:normalized', normalized);

      return normalized;
    } catch (error) {
      throw new Error(`State normalization failed: ${(error as Error).message}`);
    }
  }

  private canonicalize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.canonicalize(item));
    }

    const sorted: any = {};
    const keys = Object.keys(data).sort();

    for (const key of keys) {
      sorted[key] = this.canonicalize(data[key]);
    }

    return sorted;
  }

  private async getNextVersion(entityId: string): Promise<number> {
    const versions = this.stateVersions.get(entityId) || [];
    return versions.length > 0 ? versions[versions.length - 1].version + 1 : 1;
  }

  private computeChecksum(data: any): string {
    const serialized = JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  private async persistNormalizedState(state: NormalizedState): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO normalized_states (
          id, entity_type, entity_id, data, version,
          timestamp, checksum, layer
        ) VALUES (
          ${state.id}, ${state.entityType}, ${state.entityId},
          ${JSON.stringify(state.data)}, ${state.version},
          ${new Date(state.timestamp)}, ${state.checksum}, ${state.layer}
        )
      `;

      await this.setL2Cache(`state:${state.entityId}`, state, 3600);
    } catch (error) {
      throw new Error(`Failed to persist state: ${(error as Error).message}`);
    }
  }

  public async getState(
    entityId: string,
    layer: StateLayer['type']
  ): Promise<NormalizedState | null> {
    try {
      const l1State = this.getL1Cache(`state:${entityId}:${layer}`);
      if (l1State) {
        return l1State.value;
      }

      const l2State = await this.getL2Cache(`state:${entityId}:${layer}`);
      if (l2State) {
        this.setL1Cache(`state:${entityId}:${layer}`, l2State, []);
        return l2State;
      }

      const l3State = await this.getL3State(entityId, layer);
      if (l3State) {
        await this.setL2Cache(`state:${entityId}:${layer}`, l3State, 3600);
        this.setL1Cache(`state:${entityId}:${layer}`, l3State, []);
        return l3State;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get state: ${(error as Error).message}`);
    }
  }

  private getL1Cache(key: string): CacheEntry | null {
    const entry = this.l1Cache.get(key);

    if (entry) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
      this.l1Cache.set(key, entry);
      return entry;
    }

    return null;
  }

  private setL1Cache(key: string, value: any, dependencies: string[]): void {
    const size = this.estimateSize(value);
    const currentSize = this.getL1CacheSize();

    if (currentSize + size > this.l1MaxSize || this.l1Cache.size >= this.l1MaxEntries) {
      this.evictL1Cache(size);
    }

    const entry: CacheEntry = {
      key,
      value,
      layer: 1,
      size,
      accessCount: 1,
      lastAccess: Date.now(),
      dependencies,
    };

    this.l1Cache.set(key, entry);
  }

  private getL1CacheSize(): number {
    let total = 0;
    for (const entry of this.l1Cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private evictL1Cache(requiredSize: number): void {
    const entries = Array.from(this.l1Cache.values());

    entries.sort((a, b) => {
      const scoreA = a.accessCount / (Date.now() - a.lastAccess);
      const scoreB = b.accessCount / (Date.now() - b.lastAccess);
      return scoreA - scoreB;
    });

    let freedSize = 0;

    for (const entry of entries) {
      if (freedSize >= requiredSize && this.getL1CacheSize() < this.l1MaxSize * 0.8) {
        break;
      }

      this.l1Cache.delete(entry.key);
      freedSize += entry.size;
    }
  }

  private async getL2Cache(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error('L2 cache read error:', error);
      return null;
    }
  }

  private async setL2Cache(key: string, value: any, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error('L2 cache write error:', error);
    }
  }

  private async getL3State(
    entityId: string,
    layer: StateLayer['type']
  ): Promise<NormalizedState | null> {
    try {
      const result = await this.prisma.$queryRaw<NormalizedState[]>`
        SELECT * FROM normalized_states
        WHERE entity_id = ${entityId} AND layer = ${layer}
        ORDER BY version DESC
        LIMIT 1
      `;

      if (result.length > 0) {
        return result[0];
      }

      return null;
    } catch (error) {
      console.error('L3 state read error:', error);
      return null;
    }
  }

  private estimateSize(obj: any): number {
    const serialized = JSON.stringify(obj);
    return Buffer.byteLength(serialized, 'utf8');
  }

  public async createVersion(
    entityId: string,
    state: any,
    author: string,
    changes: StateChange[]
  ): Promise<StateVersion> {
    try {
      const versions = this.stateVersions.get(entityId) || [];
      const version = versions.length + 1;
      const parentVersion = versions.length > 0 ? versions[versions.length - 1].version : undefined;

      const stateVersion: StateVersion = {
        version,
        state,
        timestamp: Date.now(),
        author,
        changes,
        parent: parentVersion,
      };

      versions.push(stateVersion);
      this.stateVersions.set(entityId, versions);

      await this.persistVersion(entityId, stateVersion);

      this.emit('version:created', { entityId, version: stateVersion });

      return stateVersion;
    } catch (error) {
      throw new Error(`Version creation failed: ${(error as Error).message}`);
    }
  }

  private async persistVersion(entityId: string, version: StateVersion): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO state_versions (
          entity_id, version, state, timestamp, author, changes, parent
        ) VALUES (
          ${entityId}, ${version.version}, ${JSON.stringify(version.state)},
          ${new Date(version.timestamp)}, ${version.author},
          ${JSON.stringify(version.changes)}, ${version.parent || null}
        )
      `;
    } catch (error) {
      throw new Error(`Failed to persist version: ${(error as Error).message}`);
    }
  }

  public async rollbackToVersion(
    entityId: string,
    targetVersion: number
  ): Promise<StateVersion> {
    try {
      const versions = this.stateVersions.get(entityId) || [];
      const target = versions.find((v) => v.version === targetVersion);

      if (!target) {
        const dbVersion = await this.prisma.$queryRaw<StateVersion[]>`
          SELECT * FROM state_versions
          WHERE entity_id = ${entityId} AND version = ${targetVersion}
          LIMIT 1
        `;

        if (dbVersion.length === 0) {
          throw new Error(`Version ${targetVersion} not found`);
        }

        return dbVersion[0];
      }

      await this.invalidateCache(entityId);

      this.emit('version:rollback', { entityId, targetVersion });

      return target;
    } catch (error) {
      throw new Error(`Rollback failed: ${(error as Error).message}`);
    }
  }

  public async subscribe(subscription: StateSubscription): Promise<void> {
    try {
      const key = `${subscription.entityType}:${subscription.entityId}`;
      const existing = this.subscriptions.get(key) || [];
      existing.push(subscription);
      this.subscriptions.set(key, existing);

      await this.redis.sadd(
        `subscriptions:${key}`,
        subscription.id
      );

      this.emit('subscription:added', subscription);
    } catch (error) {
      throw new Error(`Subscription failed: ${(error as Error).message}`);
    }
  }

  public async unsubscribe(subscriptionId: string): Promise<void> {
    try {
      for (const [key, subs] of this.subscriptions) {
        const filtered = subs.filter((s) => s.id !== subscriptionId);

        if (filtered.length !== subs.length) {
          this.subscriptions.set(key, filtered);
          await this.redis.srem(`subscriptions:${key}`, subscriptionId);
          this.emit('subscription:removed', subscriptionId);
          break;
        }
      }
    } catch (error) {
      throw new Error(`Unsubscribe failed: ${(error as Error).message}`);
    }
  }

  private async broadcastStateUpdate(channel: string, data: any): Promise<void> {
    const key = channel.replace('state:', '');
    const subscriptions = this.subscriptions.get(key) || [];

    for (const sub of subscriptions) {
      try {
        let payload = data;

        if (sub.filters) {
          payload = this.applyFilters(data, sub.filters);
        }

        if (sub.transform) {
          payload = sub.transform(payload);
        }

        if (sub.channel === 'ws') {
          this.sendWebSocketUpdate(sub.deviceId, payload);
        }

        this.emit('state:broadcast', { subscription: sub, payload });
      } catch (error) {
        console.error('Broadcast error:', error);
      }
    }
  }

  private applyFilters(data: any, filters: string[]): any {
    const filtered: any = {};

    for (const filter of filters) {
      const value = this.getNestedValue(data, filter);
      if (value !== undefined) {
        this.setNestedValue(filtered, filter, value);
      }
    }

    return filtered;
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  private sendWebSocketUpdate(deviceId: string, data: any): void {
    const ws = this.wsConnections.get(deviceId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'state:update', data }));
    }
  }

  private cleanupSubscriptions(deviceId: string): void {
    for (const [key, subs] of this.subscriptions) {
      const filtered = subs.filter((s) => s.deviceId !== deviceId);

      if (filtered.length !== subs.length) {
        this.subscriptions.set(key, filtered);
      }
    }
  }

  public async invalidateCache(entityId: string): Promise<void> {
    try {
      const keys = Array.from(this.l1Cache.keys()).filter((k) =>
        k.includes(entityId)
      );

      for (const key of keys) {
        this.l1Cache.delete(key);
      }

      const pattern = `state:${entityId}*`;
      const l2Keys = await this.redis.keys(pattern);

      if (l2Keys.length > 0) {
        await this.redis.del(...l2Keys);
      }

      await this.invalidateDependencies(entityId);

      this.emit('cache:invalidated', entityId);
    } catch (error) {
      throw new Error(`Cache invalidation failed: ${(error as Error).message}`);
    }
  }

  private async invalidateDependencies(entityId: string): Promise<void> {
    const toInvalidate: string[] = [];

    for (const [key, entry] of this.l1Cache) {
      if (entry.dependencies.includes(entityId)) {
        toInvalidate.push(key);
      }
    }

    for (const key of toInvalidate) {
      this.l1Cache.delete(key);

      const l2Key = key.replace(/^l1:/, '');
      await this.redis.del(l2Key);
    }
  }

  public async hydrateState(
    entityId: string,
    strategy: HydrationStrategy
  ): Promise<any> {
    try {
      if (strategy.mode === 'full') {
        return this.fullHydration(entityId);
      } else if (strategy.mode === 'progressive') {
        return this.progressiveHydration(entityId, strategy);
      } else {
        return this.lazyHydration(entityId, strategy);
      }
    } catch (error) {
      throw new Error(`Hydration failed: ${(error as Error).message}`);
    }
  }

  private async fullHydration(entityId: string): Promise<any> {
    const layers: StateLayer['type'][] = ['global', 'user', 'session', 'device'];
    const states: any = {};

    for (const layer of layers) {
      const state = await this.getState(entityId, layer);
      if (state) {
        states[layer] = state.data;
      }
    }

    return this.mergeStates(states);
  }

  private async progressiveHydration(
    entityId: string,
    strategy: HydrationStrategy
  ): Promise<any> {
    const states: any = {};

    for (const layer of strategy.priority as StateLayer['type'][]) {
      const state = await this.getState(entityId, layer);
      if (state) {
        states[layer] = state.data;
      }

      if (Object.keys(states).length >= strategy.batchSize) {
        break;
      }
    }

    return this.mergeStates(states);
  }

  private async lazyHydration(
    entityId: string,
    strategy: HydrationStrategy
  ): Promise<any> {
    const primaryLayer = strategy.priority[0] as StateLayer['type'];
    const state = await this.getState(entityId, primaryLayer);

    return state ? state.data : {};
  }

  private mergeStates(states: Record<string, any>): any {
    const layers: StateLayer['type'][] = ['global', 'user', 'session', 'device'];
    let merged: any = {};

    for (const layer of layers) {
      if (states[layer]) {
        merged = { ...merged, ...states[layer] };
      }
    }

    return merged;
  }

  public computeDiff(oldState: any, newState: any): StateDiff {
    const diff: StateDiff = {
      added: {},
      modified: {},
      removed: {},
    };

    const allKeys = new Set([
      ...Object.keys(oldState || {}),
      ...Object.keys(newState || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldState?.[key];
      const newValue = newState?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        diff.added[key] = newValue;
      } else if (oldValue !== undefined && newValue === undefined) {
        diff.removed[key] = oldValue;
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff.modified[key] = { old: oldValue, new: newValue };
      }
    }

    return diff;
  }

  public async compressState(state: any): Promise<Buffer> {
    try {
      const serialized = JSON.stringify(state);
      const input = Buffer.from(serialized);

      if (!this.zstdCodec) {
        await this.initializeZstd();
      }

      const compressed = this.zstdCodec.compress(
        input,
        this.compressionLevel
      );

      return Buffer.from(compressed);
    } catch (error) {
      throw new Error(`Compression failed: ${(error as Error).message}`);
    }
  }

  public async decompressState(compressed: Buffer): Promise<any> {
    try {
      if (!this.zstdCodec) {
        await this.initializeZstd();
      }

      const decompressed = this.zstdCodec.decompress(compressed);
      const serialized = Buffer.from(decompressed).toString();

      return JSON.parse(serialized);
    } catch (error) {
      throw new Error(`Decompression failed: ${(error as Error).message}`);
    }
  }

  public async createSnapshot(
    entityId: string,
    state: any,
    version: number
  ): Promise<StateSnapshot> {
    try {
      const compressed = await this.compressState(state);

      const snapshot: StateSnapshot = {
        id: crypto.randomUUID(),
        entityId,
        version,
        state: compressed,
        timestamp: Date.now(),
        compressed: true,
        immutable: true,
      };

      await this.persistSnapshot(snapshot);

      this.emit('snapshot:created', snapshot);

      return snapshot;
    } catch (error) {
      throw new Error(`Snapshot creation failed: ${(error as Error).message}`);
    }
  }

  private async persistSnapshot(snapshot: StateSnapshot): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO state_snapshots (
          id, entity_id, version, state, timestamp, compressed, immutable
        ) VALUES (
          ${snapshot.id}, ${snapshot.entityId}, ${snapshot.version},
          ${snapshot.state}, ${new Date(snapshot.timestamp)},
          ${snapshot.compressed}, ${snapshot.immutable}
        )
      `;
    } catch (error) {
      throw new Error(`Failed to persist snapshot: ${(error as Error).message}`);
    }
  }

  private startSnapshotScheduler(): void {
    setInterval(async () => {
      try {
        await this.createScheduledSnapshots();
      } catch (error) {
        console.error('Snapshot scheduler error:', error);
      }
    }, this.snapshotInterval);
  }

  private async createScheduledSnapshots(): Promise<void> {
    const entities = await this.prisma.$queryRaw<Array<{ entity_id: string }>>`
      SELECT DISTINCT entity_id
      FROM normalized_states
      WHERE timestamp > NOW() - INTERVAL '5 minutes'
    `;

    for (const entity of entities) {
      const state = await this.getState(entity.entity_id, 'global');
      if (state) {
        await this.createSnapshot(entity.entity_id, state.data, state.version);
      }
    }
  }

  private async processNormalization(data: any): Promise<any> {
    const { entityType, entityId, rawData, layer } = data;
    return this.normalizeState(entityType, entityId, rawData, layer);
  }

  private async processHydration(data: any): Promise<any> {
    const { entityId, strategy } = data;
    return this.hydrateState(entityId, strategy);
  }

  private async processCompression(data: any): Promise<any> {
    const { state } = data;
    return this.compressState(state);
  }

  private async processInvalidation(data: any): Promise<void> {
    const { entityId } = data;
    await this.invalidateCache(entityId);
  }

  private async handleWebSocketMessage(deviceId: string, message: any): Promise<void> {
    switch (message.type) {
      case 'subscribe':
        await this.subscribe({
          ...message.subscription,
          deviceId,
          channel: 'ws',
        });
        break;

      case 'unsubscribe':
        await this.unsubscribe(message.subscriptionId);
        break;

      case 'get-state':
        const state = await this.getState(message.entityId, message.layer);
        this.sendWebSocketUpdate(deviceId, { type: 'state', state });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private sendAck(deviceId: string, data: any): void {
    const ws = this.wsConnections.get(deviceId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ack', data }));
    }
  }

  private sendError(deviceId: string, error: Error): void {
    const ws = this.wsConnections.get(deviceId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  }

  public async shutdown(): Promise<void> {
    try {
      for (const ws of this.wsConnections.values()) {
        ws.close(1000, 'Server shutdown');
      }

      this.wss.close();
      await this.jobQueue.close();
      await this.redis.quit();
      await this.redisSubscriber.quit();
      await this.prisma.$disconnect();

      this.emit('shutdown');
    } catch (error) {
      console.error('Shutdown error:', error);
      throw error;
    }
  }
}
