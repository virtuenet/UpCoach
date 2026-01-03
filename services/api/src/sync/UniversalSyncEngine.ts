import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import WebSocket from 'ws';
import * as LZ4 from 'lz4';
import { EventEmitter } from 'events';
import crypto from 'crypto';

interface SyncOperation {
  id: string;
  type: 'insert' | 'delete' | 'update' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  clientId: string;
  vectorClock: VectorClock;
  checksum: string;
}

interface VectorClock {
  [clientId: string]: number;
}

interface CRDTElement {
  id: string;
  value: any;
  timestamp: number;
  clientId: string;
  tombstone?: boolean;
}

interface GSet {
  type: 'g-set';
  elements: Set<string>;
}

interface LWWRegister {
  type: 'lww-register';
  value: any;
  timestamp: number;
  clientId: string;
}

interface ORSet {
  type: 'or-set';
  elements: Map<string, CRDTElement[]>;
  tombstones: Set<string>;
}

interface ConflictResolutionStrategy {
  type: 'last-write-wins' | 'semantic-merge' | 'manual-review';
  resolver?: (local: any, remote: any) => any;
}

interface SyncPayload {
  operations: SyncOperation[];
  vectorClock: VectorClock;
  deviceId: string;
  userId: string;
  entityType: string;
  entityId: string;
  compressed: boolean;
  checksum: string;
}

interface DeltaSync {
  lastSyncVector: VectorClock;
  operations: SyncOperation[];
  compressed: boolean;
}

interface OptimisticUpdate {
  id: string;
  operation: SyncOperation;
  localState: any;
  timestamp: number;
  reconciled: boolean;
}

interface SyncQueueItem {
  id: string;
  payload: SyncPayload;
  priority: number;
  bandwidth: number;
  retryCount: number;
  timestamp: number;
}

interface DeviceFingerprint {
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  capabilities: string[];
  lastSeen: number;
  publicKey: string;
}

export class UniversalSyncEngine extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private wss: WebSocket.Server;
  private clientConnections: Map<string, WebSocket>;
  private vectorClocks: Map<string, VectorClock>;
  private crdtStates: Map<string, GSet | LWWRegister | ORSet>;
  private operationHistory: Map<string, SyncOperation[]>;
  private optimisticUpdates: Map<string, OptimisticUpdate[]>;
  private syncQueue: SyncQueueItem[];
  private deviceFingerprints: Map<string, DeviceFingerprint>;
  private conflictStrategies: Map<string, ConflictResolutionStrategy>;
  private bandwidthMonitor: Map<string, number[]>;
  private compressionThreshold: number;
  private maxRetries: number;
  private syncInterval: number;

  constructor(port: number = 8080) {
    super();
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    this.wss = new WebSocket.Server({ port });
    this.clientConnections = new Map();
    this.vectorClocks = new Map();
    this.crdtStates = new Map();
    this.operationHistory = new Map();
    this.optimisticUpdates = new Map();
    this.syncQueue = [];
    this.deviceFingerprints = new Map();
    this.conflictStrategies = new Map();
    this.bandwidthMonitor = new Map();
    this.compressionThreshold = 1024;
    this.maxRetries = 3;
    this.syncInterval = 5000;

    this.initializeWebSocket();
    this.startSyncQueueProcessor();
    this.startBandwidthMonitor();
  }

  private initializeWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const deviceId = this.extractDeviceId(req.url || '');

      if (!deviceId) {
        ws.close(1008, 'Device ID required');
        return;
      }

      this.clientConnections.set(deviceId, ws);
      this.emit('device:connected', deviceId);

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const payload = JSON.parse(data.toString());
          await this.handleIncomingSync(deviceId, payload);
        } catch (error) {
          this.handleError(deviceId, error as Error);
        }
      });

      ws.on('close', () => {
        this.clientConnections.delete(deviceId);
        this.emit('device:disconnected', deviceId);
      });

      ws.on('error', (error) => {
        this.handleError(deviceId, error);
      });

      this.sendSyncAck(deviceId, { status: 'connected' });
    });
  }

  private extractDeviceId(url: string): string | null {
    const match = url.match(/deviceId=([^&]+)/);
    return match ? match[1] : null;
  }

  public async registerDevice(fingerprint: DeviceFingerprint): Promise<void> {
    try {
      this.deviceFingerprints.set(fingerprint.deviceId, fingerprint);

      await this.prisma.$executeRaw`
        INSERT INTO device_fingerprints (
          device_id, platform, os_version, app_version,
          capabilities, last_seen, public_key
        ) VALUES (
          ${fingerprint.deviceId}, ${fingerprint.platform},
          ${fingerprint.osVersion}, ${fingerprint.appVersion},
          ${JSON.stringify(fingerprint.capabilities)},
          ${new Date(fingerprint.lastSeen)}, ${fingerprint.publicKey}
        )
        ON CONFLICT (device_id) DO UPDATE SET
          last_seen = EXCLUDED.last_seen,
          app_version = EXCLUDED.app_version
      `;

      await this.redis.setex(
        `device:${fingerprint.deviceId}`,
        3600,
        JSON.stringify(fingerprint)
      );

      this.emit('device:registered', fingerprint.deviceId);
    } catch (error) {
      throw new Error(`Failed to register device: ${(error as Error).message}`);
    }
  }

  public transformOperation(
    op1: SyncOperation,
    op2: SyncOperation
  ): SyncOperation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op2;
      } else if (op1.position > op2.position) {
        return {
          ...op2,
          position: op2.position,
        };
      } else {
        return {
          ...op2,
          position: op2.position + (op1.content?.length || 0),
        };
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return {
          ...op2,
          position: op2.position,
        };
      } else if (op2.position > op1.position + (op1.length || 0)) {
        return {
          ...op2,
          position: op2.position - (op1.length || 0),
        };
      } else {
        return {
          ...op2,
          position: op1.position,
        };
      }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return {
          ...op2,
          position: op2.position,
        };
      } else if (op2.position >= op1.position + (op1.content?.length || 0)) {
        return {
          ...op2,
          position: op2.position + (op1.content?.length || 0),
        };
      } else {
        return {
          ...op2,
          length: (op2.length || 0) + (op1.content?.length || 0),
        };
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return op2;
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        return {
          ...op2,
          position: op2.position - (op1.length || 0),
        };
      } else {
        const offset = Math.min(
          op2.position - op1.position,
          op1.length || 0
        );
        return {
          ...op2,
          position: op1.position,
          length: Math.max(
            0,
            (op2.length || 0) - ((op1.length || 0) - offset)
          ),
        };
      }
    }

    return op2;
  }

  public transformAgainstHistory(
    operation: SyncOperation,
    history: SyncOperation[]
  ): SyncOperation {
    let transformedOp = operation;

    for (const historicalOp of history) {
      if (!this.happensBefore(historicalOp.vectorClock, operation.vectorClock)) {
        transformedOp = this.transformOperation(historicalOp, transformedOp);
      }
    }

    return transformedOp;
  }

  private happensBefore(vc1: VectorClock, vc2: VectorClock): boolean {
    let anyLess = false;

    for (const clientId in vc1) {
      const v1 = vc1[clientId] || 0;
      const v2 = vc2[clientId] || 0;

      if (v1 > v2) {
        return false;
      }
      if (v1 < v2) {
        anyLess = true;
      }
    }

    for (const clientId in vc2) {
      if (!(clientId in vc1) && vc2[clientId] > 0) {
        anyLess = true;
      }
    }

    return anyLess;
  }

  private compareVectorClocks(
    vc1: VectorClock,
    vc2: VectorClock
  ): 'before' | 'after' | 'concurrent' | 'equal' {
    const before = this.happensBefore(vc1, vc2);
    const after = this.happensBefore(vc2, vc1);

    if (before && !after) return 'before';
    if (after && !before) return 'after';
    if (!before && !after) {
      const equal = Object.keys({ ...vc1, ...vc2 }).every(
        (key) => (vc1[key] || 0) === (vc2[key] || 0)
      );
      return equal ? 'equal' : 'concurrent';
    }

    return 'concurrent';
  }

  public createGSet(): GSet {
    return {
      type: 'g-set',
      elements: new Set(),
    };
  }

  public gSetAdd(gset: GSet, element: string): GSet {
    const newSet = new Set(gset.elements);
    newSet.add(element);
    return {
      ...gset,
      elements: newSet,
    };
  }

  public mergeGSet(gset1: GSet, gset2: GSet): GSet {
    const merged = new Set([...gset1.elements, ...gset2.elements]);
    return {
      type: 'g-set',
      elements: merged,
    };
  }

  public createLWWRegister(value: any, timestamp: number, clientId: string): LWWRegister {
    return {
      type: 'lww-register',
      value,
      timestamp,
      clientId,
    };
  }

  public mergeLWWRegister(reg1: LWWRegister, reg2: LWWRegister): LWWRegister {
    if (reg1.timestamp > reg2.timestamp) {
      return reg1;
    } else if (reg2.timestamp > reg1.timestamp) {
      return reg2;
    } else {
      return reg1.clientId > reg2.clientId ? reg1 : reg2;
    }
  }

  public createORSet(): ORSet {
    return {
      type: 'or-set',
      elements: new Map(),
      tombstones: new Set(),
    };
  }

  public orSetAdd(
    orset: ORSet,
    element: string,
    timestamp: number,
    clientId: string
  ): ORSet {
    const elementData: CRDTElement = {
      id: this.generateUniqueId(clientId, timestamp),
      value: element,
      timestamp,
      clientId,
    };

    const existing = orset.elements.get(element) || [];
    const newElements = new Map(orset.elements);
    newElements.set(element, [...existing, elementData]);

    return {
      ...orset,
      elements: newElements,
    };
  }

  public orSetRemove(orset: ORSet, element: string): ORSet {
    const elementData = orset.elements.get(element) || [];
    const newTombstones = new Set(orset.tombstones);

    elementData.forEach((data) => {
      newTombstones.add(data.id);
    });

    return {
      ...orset,
      tombstones: newTombstones,
    };
  }

  public mergeORSet(orset1: ORSet, orset2: ORSet): ORSet {
    const mergedElements = new Map(orset1.elements);

    for (const [key, elements] of orset2.elements) {
      const existing = mergedElements.get(key) || [];
      const combined = [...existing, ...elements];
      const unique = Array.from(
        new Map(combined.map((e) => [e.id, e])).values()
      );
      mergedElements.set(key, unique);
    }

    const mergedTombstones = new Set([
      ...orset1.tombstones,
      ...orset2.tombstones,
    ]);

    const activeElements = new Map();
    for (const [key, elements] of mergedElements) {
      const active = elements.filter((e) => !mergedTombstones.has(e.id));
      if (active.length > 0) {
        activeElements.set(key, active);
      }
    }

    return {
      type: 'or-set',
      elements: activeElements,
      tombstones: mergedTombstones,
    };
  }

  private generateUniqueId(clientId: string, timestamp: number): string {
    return `${clientId}:${timestamp}:${crypto.randomBytes(8).toString('hex')}`;
  }

  public async detectConflicts(
    localState: any,
    remoteState: any,
    vectorClock: VectorClock
  ): Promise<boolean> {
    try {
      const localVC = this.vectorClocks.get(localState.entityId) || {};
      const comparison = this.compareVectorClocks(localVC, vectorClock);

      if (comparison === 'concurrent') {
        const localHash = this.computeChecksum(localState);
        const remoteHash = this.computeChecksum(remoteState);

        if (localHash !== remoteHash) {
          await this.logConflict(localState, remoteState, vectorClock);
          return true;
        }
      }

      return false;
    } catch (error) {
      throw new Error(`Conflict detection failed: ${(error as Error).message}`);
    }
  }

  public async resolveConflict(
    localState: any,
    remoteState: any,
    strategy: ConflictResolutionStrategy
  ): Promise<any> {
    try {
      switch (strategy.type) {
        case 'last-write-wins':
          return this.resolveLastWriteWins(localState, remoteState);

        case 'semantic-merge':
          return this.resolveSemanticMerge(localState, remoteState, strategy.resolver);

        case 'manual-review':
          return this.queueManualReview(localState, remoteState);

        default:
          throw new Error(`Unknown conflict resolution strategy: ${strategy.type}`);
      }
    } catch (error) {
      throw new Error(`Conflict resolution failed: ${(error as Error).message}`);
    }
  }

  private resolveLastWriteWins(localState: any, remoteState: any): any {
    const localTimestamp = localState.timestamp || 0;
    const remoteTimestamp = remoteState.timestamp || 0;

    if (remoteTimestamp > localTimestamp) {
      return remoteState;
    } else if (localTimestamp > remoteTimestamp) {
      return localState;
    } else {
      return localState.clientId > remoteState.clientId ? localState : remoteState;
    }
  }

  private resolveSemanticMerge(
    localState: any,
    remoteState: any,
    resolver?: (local: any, remote: any) => any
  ): any {
    if (resolver) {
      return resolver(localState, remoteState);
    }

    const merged: any = {};
    const allKeys = new Set([
      ...Object.keys(localState),
      ...Object.keys(remoteState),
    ]);

    for (const key of allKeys) {
      if (key === 'timestamp' || key === 'clientId' || key === 'vectorClock') {
        continue;
      }

      const localValue = localState[key];
      const remoteValue = remoteState[key];

      if (localValue === undefined) {
        merged[key] = remoteValue;
      } else if (remoteValue === undefined) {
        merged[key] = localValue;
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        merged[key] = this.deepMerge(localValue, remoteValue);
      } else {
        const localTS = localState.timestamp || 0;
        const remoteTS = remoteState.timestamp || 0;
        merged[key] = remoteTS >= localTS ? remoteValue : localValue;
      }
    }

    merged.timestamp = Math.max(
      localState.timestamp || 0,
      remoteState.timestamp || 0
    );

    return merged;
  }

  private deepMerge(obj1: any, obj2: any): any {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return [...new Set([...obj1, ...obj2])];
    }

    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const merged: any = { ...obj1 };

      for (const key in obj2) {
        if (obj1[key] && typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          merged[key] = this.deepMerge(obj1[key], obj2[key]);
        } else {
          merged[key] = obj2[key];
        }
      }

      return merged;
    }

    return obj2;
  }

  private async queueManualReview(localState: any, remoteState: any): Promise<any> {
    const conflictId = crypto.randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO sync_conflicts (
        id, local_state, remote_state, status, created_at
      ) VALUES (
        ${conflictId}, ${JSON.stringify(localState)},
        ${JSON.stringify(remoteState)}, 'pending', ${new Date()}
      )
    `;

    await this.redis.lpush(
      'conflict:manual-review',
      JSON.stringify({ conflictId, localState, remoteState })
    );

    this.emit('conflict:manual-review', { conflictId, localState, remoteState });

    return localState;
  }

  private async logConflict(
    localState: any,
    remoteState: any,
    vectorClock: VectorClock
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO sync_conflict_log (
          entity_id, local_state, remote_state, vector_clock, detected_at
        ) VALUES (
          ${localState.entityId}, ${JSON.stringify(localState)},
          ${JSON.stringify(remoteState)}, ${JSON.stringify(vectorClock)},
          ${new Date()}
        )
      `;
    } catch (error) {
      console.error('Failed to log conflict:', error);
    }
  }

  public async computeDelta(
    lastSyncVector: VectorClock,
    currentVector: VectorClock,
    entityId: string
  ): Promise<SyncOperation[]> {
    try {
      const operations = this.operationHistory.get(entityId) || [];
      const deltaOps: SyncOperation[] = [];

      for (const op of operations) {
        if (this.isNewOperation(op.vectorClock, lastSyncVector)) {
          deltaOps.push(op);
        }
      }

      return deltaOps;
    } catch (error) {
      throw new Error(`Delta computation failed: ${(error as Error).message}`);
    }
  }

  private isNewOperation(opVector: VectorClock, lastVector: VectorClock): boolean {
    for (const clientId in opVector) {
      const opCount = opVector[clientId] || 0;
      const lastCount = lastVector[clientId] || 0;

      if (opCount > lastCount) {
        return true;
      }
    }

    return false;
  }

  public async applyOptimisticUpdate(
    deviceId: string,
    operation: SyncOperation,
    localState: any
  ): Promise<void> {
    try {
      const update: OptimisticUpdate = {
        id: crypto.randomUUID(),
        operation,
        localState,
        timestamp: Date.now(),
        reconciled: false,
      };

      const updates = this.optimisticUpdates.get(deviceId) || [];
      updates.push(update);
      this.optimisticUpdates.set(deviceId, updates);

      await this.redis.setex(
        `optimistic:${deviceId}:${update.id}`,
        300,
        JSON.stringify(update)
      );

      this.emit('optimistic:applied', { deviceId, update });
    } catch (error) {
      throw new Error(`Optimistic update failed: ${(error as Error).message}`);
    }
  }

  public async reconcileOptimisticUpdates(
    deviceId: string,
    serverState: any
  ): Promise<any> {
    try {
      const updates = this.optimisticUpdates.get(deviceId) || [];
      let reconciledState = serverState;

      for (const update of updates) {
        if (!update.reconciled) {
          const transformedOp = this.transformOperation(
            update.operation,
            { ...update.operation, timestamp: serverState.timestamp }
          );

          reconciledState = this.applyOperation(reconciledState, transformedOp);
          update.reconciled = true;
        }
      }

      const reconciled = updates.filter((u) => u.reconciled);
      this.optimisticUpdates.set(
        deviceId,
        updates.filter((u) => !u.reconciled)
      );

      for (const update of reconciled) {
        await this.redis.del(`optimistic:${deviceId}:${update.id}`);
      }

      return reconciledState;
    } catch (error) {
      throw new Error(`Reconciliation failed: ${(error as Error).message}`);
    }
  }

  private applyOperation(state: any, operation: SyncOperation): any {
    const newState = { ...state };

    switch (operation.type) {
      case 'insert':
        if (typeof newState.content === 'string' && operation.content) {
          newState.content =
            newState.content.slice(0, operation.position) +
            operation.content +
            newState.content.slice(operation.position);
        }
        break;

      case 'delete':
        if (typeof newState.content === 'string' && operation.length) {
          newState.content =
            newState.content.slice(0, operation.position) +
            newState.content.slice(operation.position + operation.length);
        }
        break;

      case 'update':
        if (operation.content) {
          newState.content = operation.content;
        }
        break;
    }

    newState.timestamp = operation.timestamp;
    newState.vectorClock = operation.vectorClock;

    return newState;
  }

  private async enqueueSyncOperation(
    payload: SyncPayload,
    priority: number = 5
  ): Promise<void> {
    try {
      const bandwidth = await this.estimateBandwidth(payload.deviceId);

      const queueItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        payload,
        priority,
        bandwidth,
        retryCount: 0,
        timestamp: Date.now(),
      };

      this.syncQueue.push(queueItem);
      this.syncQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      await this.redis.lpush(
        `sync:queue:${payload.deviceId}`,
        JSON.stringify(queueItem)
      );
    } catch (error) {
      throw new Error(`Failed to enqueue sync: ${(error as Error).message}`);
    }
  }

  private async estimateBandwidth(deviceId: string): Promise<number> {
    const history = this.bandwidthMonitor.get(deviceId) || [];

    if (history.length === 0) {
      return 1000000;
    }

    const sum = history.reduce((acc, val) => acc + val, 0);
    return sum / history.length;
  }

  private startSyncQueueProcessor(): void {
    setInterval(async () => {
      try {
        await this.processSyncQueue();
      } catch (error) {
        console.error('Sync queue processing error:', error);
      }
    }, this.syncInterval);
  }

  private async processSyncQueue(): Promise<void> {
    const batch = this.syncQueue.splice(0, 10);

    for (const item of batch) {
      try {
        await this.executeSyncOperation(item);
      } catch (error) {
        await this.handleSyncFailure(item, error as Error);
      }
    }
  }

  private async executeSyncOperation(item: SyncQueueItem): Promise<void> {
    const { payload } = item;

    const compressed = await this.compressPayload(payload);
    const ws = this.clientConnections.get(payload.deviceId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(compressed));

      await this.prisma.$executeRaw`
        INSERT INTO sync_history (
          id, device_id, user_id, entity_type, entity_id,
          operations_count, synced_at, success
        ) VALUES (
          ${item.id}, ${payload.deviceId}, ${payload.userId},
          ${payload.entityType}, ${payload.entityId},
          ${payload.operations.length}, ${new Date()}, true
        )
      `;

      this.emit('sync:success', item);
    } else {
      throw new Error('WebSocket not available');
    }
  }

  private async handleSyncFailure(item: SyncQueueItem, error: Error): Promise<void> {
    item.retryCount++;

    if (item.retryCount < this.maxRetries) {
      this.syncQueue.push(item);
      await this.redis.lpush(
        `sync:retry:${item.payload.deviceId}`,
        JSON.stringify(item)
      );
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO sync_failures (
          id, device_id, payload, error, failed_at
        ) VALUES (
          ${crypto.randomUUID()}, ${item.payload.deviceId},
          ${JSON.stringify(item.payload)}, ${error.message},
          ${new Date()}
        )
      `;

      this.emit('sync:failed', { item, error });
    }
  }

  private async compressPayload(payload: SyncPayload): Promise<any> {
    const serialized = JSON.stringify(payload);

    if (serialized.length < this.compressionThreshold) {
      return { ...payload, compressed: false };
    }

    const buffer = Buffer.from(serialized);
    const compressed = LZ4.encode(buffer);

    return {
      compressed: true,
      data: compressed.toString('base64'),
      checksum: this.computeChecksum(payload),
    };
  }

  private async decompressPayload(data: any): Promise<SyncPayload> {
    if (!data.compressed) {
      return data as SyncPayload;
    }

    const buffer = Buffer.from(data.data, 'base64');
    const decompressed = LZ4.decode(buffer);
    const payload = JSON.parse(decompressed.toString());

    const checksum = this.computeChecksum(payload);
    if (checksum !== data.checksum) {
      throw new Error('Checksum mismatch');
    }

    return payload;
  }

  private computeChecksum(data: any): string {
    const serialized = JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  private async handleIncomingSync(
    deviceId: string,
    data: any
  ): Promise<void> {
    try {
      const payload = await this.decompressPayload(data);

      const localVC = this.vectorClocks.get(payload.entityId) || {};
      const hasConflict = await this.detectConflicts(
        { entityId: payload.entityId },
        payload,
        payload.vectorClock
      );

      if (hasConflict) {
        const strategy = this.conflictStrategies.get(payload.entityType) || {
          type: 'last-write-wins',
        };
        await this.resolveConflict({ entityId: payload.entityId }, payload, strategy);
      }

      for (const operation of payload.operations) {
        const history = this.operationHistory.get(payload.entityId) || [];
        const transformed = this.transformAgainstHistory(operation, history);
        history.push(transformed);
        this.operationHistory.set(payload.entityId, history);
      }

      const mergedVC = this.mergeVectorClocks(localVC, payload.vectorClock);
      this.vectorClocks.set(payload.entityId, mergedVC);

      await this.persistSyncState(payload);

      this.sendSyncAck(deviceId, {
        status: 'success',
        vectorClock: mergedVC,
      });

      this.emit('sync:received', { deviceId, payload });
    } catch (error) {
      this.sendSyncAck(deviceId, {
        status: 'error',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
    const merged: VectorClock = { ...vc1 };

    for (const clientId in vc2) {
      merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId] || 0);
    }

    return merged;
  }

  private async persistSyncState(payload: SyncPayload): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO sync_state (
          entity_id, entity_type, vector_clock, operations,
          device_id, user_id, updated_at
        ) VALUES (
          ${payload.entityId}, ${payload.entityType},
          ${JSON.stringify(payload.vectorClock)},
          ${JSON.stringify(payload.operations)},
          ${payload.deviceId}, ${payload.userId}, ${new Date()}
        )
        ON CONFLICT (entity_id) DO UPDATE SET
          vector_clock = EXCLUDED.vector_clock,
          operations = EXCLUDED.operations,
          updated_at = EXCLUDED.updated_at
      `;

      await this.redis.setex(
        `sync:state:${payload.entityId}`,
        3600,
        JSON.stringify({
          vectorClock: payload.vectorClock,
          operations: payload.operations,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      throw new Error(`Failed to persist sync state: ${(error as Error).message}`);
    }
  }

  private sendSyncAck(deviceId: string, data: any): void {
    const ws = this.clientConnections.get(deviceId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'sync:ack', data }));
    }
  }

  private startBandwidthMonitor(): void {
    setInterval(() => {
      for (const [deviceId, ws] of this.clientConnections) {
        if (ws.readyState === WebSocket.OPEN) {
          const startTime = Date.now();
          const testData = Buffer.alloc(1024);

          ws.send(testData, () => {
            const duration = Date.now() - startTime;
            const bandwidth = (1024 / duration) * 1000;

            const history = this.bandwidthMonitor.get(deviceId) || [];
            history.push(bandwidth);

            if (history.length > 10) {
              history.shift();
            }

            this.bandwidthMonitor.set(deviceId, history);
          });
        }
      }
    }, 30000);
  }

  private handleError(deviceId: string, error: Error): void {
    console.error(`Error for device ${deviceId}:`, error);
    this.emit('error', { deviceId, error });
  }

  public async shutdown(): Promise<void> {
    try {
      for (const ws of this.clientConnections.values()) {
        ws.close(1000, 'Server shutdown');
      }

      this.wss.close();
      await this.redis.quit();
      await this.prisma.$disconnect();

      this.emit('shutdown');
    } catch (error) {
      console.error('Shutdown error:', error);
      throw error;
    }
  }
}
