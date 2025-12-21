/**
 * Feature Sync Service
 * Handles synchronization of features between server and mobile clients
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { FeatureStore, FeatureVector, RegisteredFeature } from '../FeatureStore';

// ==================== Type Definitions ====================

export interface SyncConfig {
  syncIntervalMs: number;
  batchSize: number;
  compressionEnabled: boolean;
  deltaUpdatesEnabled: boolean;
  maxPendingUpdates: number;
  retryDelayMs: number;
  maxRetries: number;
}

export interface FeatureSyncPacket {
  packetId: string;
  clientId: string;
  entityId: string;
  timestamp: Date;
  features: Record<string, SyncFeatureValue>;
  metadata: SyncMetadata;
}

export interface SyncFeatureValue {
  value: unknown;
  version: number;
  serverTimestamp: Date;
  clientTimestamp?: Date;
  checksum?: string;
}

export interface SyncMetadata {
  packetType: 'full' | 'delta' | 'ack';
  sequenceNumber: number;
  lastKnownSequence: number;
  compressed: boolean;
  clientVersion: string;
}

export interface SyncState {
  clientId: string;
  entityId: string;
  lastSyncTimestamp: Date;
  lastSequenceNumber: number;
  pendingUpdates: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  conflictResolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  conflictedFeatures: string[];
  resolvedAt?: Date;
}

export interface MobileFeatureUpdate {
  featureName: string;
  value: unknown;
  collectedAt: Date;
  deviceId: string;
  sessionId?: string;
  confidence?: number;
}

export interface FeatureSyncResult {
  success: boolean;
  packetId: string;
  syncedFeatures: number;
  conflictedFeatures: string[];
  errors: SyncError[];
}

export interface SyncError {
  featureName: string;
  errorType: 'validation' | 'conflict' | 'network' | 'unknown';
  message: string;
}

// ==================== Feature Sync Service ====================

export class FeatureSyncService extends EventEmitter {
  private featureStore: FeatureStore;
  private config: SyncConfig;
  private syncStates: Map<string, SyncState> = new Map();
  private pendingPackets: Map<string, FeatureSyncPacket[]> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor(featureStore: FeatureStore, config?: Partial<SyncConfig>) {
    super();
    this.featureStore = featureStore;
    this.config = {
      syncIntervalMs: 30000,
      batchSize: 50,
      compressionEnabled: true,
      deltaUpdatesEnabled: true,
      maxPendingUpdates: 100,
      retryDelayMs: 5000,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Register a new client for sync
   */
  public registerClient(clientId: string, entityId: string): void {
    const stateKey = this.getSyncStateKey(clientId, entityId);

    if (!this.syncStates.has(stateKey)) {
      this.syncStates.set(stateKey, {
        clientId,
        entityId,
        lastSyncTimestamp: new Date(0),
        lastSequenceNumber: 0,
        pendingUpdates: 0,
        syncStatus: 'pending',
      });
      this.sequenceCounters.set(stateKey, 0);
      logger.info(`Registered sync client: ${clientId} for entity: ${entityId}`);
    }
  }

  /**
   * Unregister a client
   */
  public unregisterClient(clientId: string, entityId: string): void {
    const stateKey = this.getSyncStateKey(clientId, entityId);
    this.syncStates.delete(stateKey);
    this.pendingPackets.delete(stateKey);
    this.sequenceCounters.delete(stateKey);
    logger.info(`Unregistered sync client: ${clientId}`);
  }

  /**
   * Get sync packet for mobile client
   */
  public async getSyncPacket(
    clientId: string,
    entityId: string,
    lastKnownSequence: number,
    requestedFeatures?: string[]
  ): Promise<FeatureSyncPacket> {
    const stateKey = this.getSyncStateKey(clientId, entityId);
    const state = this.syncStates.get(stateKey);

    if (!state) {
      this.registerClient(clientId, entityId);
    }

    // Determine packet type
    const useDelta =
      this.config.deltaUpdatesEnabled &&
      lastKnownSequence > 0 &&
      state?.lastSyncTimestamp.getTime() > 0;

    // Get features
    const allFeatures = requestedFeatures || this.getMobileRelevantFeatures();
    const featureVector = await this.featureStore.getFeatures(entityId, allFeatures);

    // Build sync features
    const syncFeatures: Record<string, SyncFeatureValue> = {};
    for (const [name, value] of Object.entries(featureVector.features)) {
      if (!value.isNull) {
        syncFeatures[name] = {
          value: value.value,
          version: value.version,
          serverTimestamp: value.timestamp,
          checksum: this.computeChecksum(value.value),
        };
      }
    }

    // Generate packet
    const sequence = this.getNextSequence(stateKey);
    const packet: FeatureSyncPacket = {
      packetId: this.generatePacketId(),
      clientId,
      entityId,
      timestamp: new Date(),
      features: syncFeatures,
      metadata: {
        packetType: useDelta ? 'delta' : 'full',
        sequenceNumber: sequence,
        lastKnownSequence,
        compressed: this.config.compressionEnabled,
        clientVersion: '1.0.0',
      },
    };

    // Update state
    if (state) {
      state.lastSyncTimestamp = new Date();
      state.lastSequenceNumber = sequence;
      state.syncStatus = 'synced';
    }

    this.emit('packet:sent', {
      packetId: packet.packetId,
      clientId,
      entityId,
      featureCount: Object.keys(syncFeatures).length,
    });

    return packet;
  }

  /**
   * Receive feature updates from mobile client
   */
  public async receiveMobileUpdates(
    clientId: string,
    entityId: string,
    updates: MobileFeatureUpdate[]
  ): Promise<FeatureSyncResult> {
    const stateKey = this.getSyncStateKey(clientId, entityId);
    const state = this.syncStates.get(stateKey);

    if (!state) {
      this.registerClient(clientId, entityId);
    }

    const errors: SyncError[] = [];
    const conflictedFeatures: string[] = [];
    const validUpdates: Record<string, unknown> = {};

    for (const update of updates) {
      try {
        // Validate update
        const validation = this.validateUpdate(update);
        if (!validation.valid) {
          errors.push({
            featureName: update.featureName,
            errorType: 'validation',
            message: validation.message || 'Validation failed',
          });
          continue;
        }

        // Check for conflicts
        const existingVector = await this.featureStore.getFeatures(entityId, [update.featureName]);
        const existingValue = existingVector.features[update.featureName];

        if (
          existingValue &&
          !existingValue.isNull &&
          existingValue.timestamp > update.collectedAt
        ) {
          // Server has newer data - potential conflict
          conflictedFeatures.push(update.featureName);

          // Apply conflict resolution
          const resolved = this.resolveConflict(
            update.featureName,
            existingValue.value,
            update.value,
            existingValue.timestamp,
            update.collectedAt
          );

          if (resolved.useClient) {
            validUpdates[update.featureName] = update.value;
          }
        } else {
          validUpdates[update.featureName] = update.value;
        }
      } catch (error) {
        errors.push({
          featureName: update.featureName,
          errorType: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Store valid updates
    if (Object.keys(validUpdates).length > 0) {
      await this.featureStore.setFeatureValues(entityId, validUpdates);
    }

    // Update state
    if (state) {
      state.lastSyncTimestamp = new Date();
      state.pendingUpdates = 0;
      state.syncStatus = conflictedFeatures.length > 0 ? 'conflict' : 'synced';
      if (conflictedFeatures.length > 0) {
        state.conflictResolution = {
          strategy: 'server_wins',
          conflictedFeatures,
          resolvedAt: new Date(),
        };
      }
    }

    const result: FeatureSyncResult = {
      success: errors.length === 0,
      packetId: this.generatePacketId(),
      syncedFeatures: Object.keys(validUpdates).length,
      conflictedFeatures,
      errors,
    };

    this.emit('updates:received', {
      clientId,
      entityId,
      updateCount: updates.length,
      syncedCount: result.syncedFeatures,
      conflictCount: conflictedFeatures.length,
    });

    return result;
  }

  /**
   * Acknowledge sync packet receipt
   */
  public acknowledgeSyncPacket(
    clientId: string,
    entityId: string,
    packetId: string,
    sequenceNumber: number
  ): void {
    const stateKey = this.getSyncStateKey(clientId, entityId);
    const state = this.syncStates.get(stateKey);

    if (state) {
      state.lastSequenceNumber = sequenceNumber;
      state.syncStatus = 'synced';
    }

    this.emit('packet:acknowledged', { clientId, entityId, packetId, sequenceNumber });
  }

  /**
   * Get sync state for a client
   */
  public getSyncState(clientId: string, entityId: string): SyncState | null {
    return this.syncStates.get(this.getSyncStateKey(clientId, entityId)) || null;
  }

  /**
   * Get all sync states
   */
  public getAllSyncStates(): SyncState[] {
    return Array.from(this.syncStates.values());
  }

  /**
   * Get mobile-relevant features
   */
  private getMobileRelevantFeatures(): string[] {
    const features = this.featureStore.listFeatures({ deprecated: false });

    // Filter for mobile-relevant features
    const mobileRelevantTags = [
      'engagement',
      'goals',
      'habits',
      'ai',
      'personalization',
      'churn',
      'social',
    ];

    return features
      .filter((f) => f.tags.some((tag) => mobileRelevantTags.includes(tag)))
      .map((f) => f.name);
  }

  /**
   * Validate mobile update
   */
  private validateUpdate(update: MobileFeatureUpdate): { valid: boolean; message?: string } {
    if (!update.featureName) {
      return { valid: false, message: 'Missing feature name' };
    }

    if (update.value === undefined) {
      return { valid: false, message: 'Missing feature value' };
    }

    if (!update.collectedAt) {
      return { valid: false, message: 'Missing collection timestamp' };
    }

    // Check if feature exists
    const feature = this.featureStore.getFeature(update.featureName);
    if (!feature) {
      return { valid: false, message: `Feature ${update.featureName} not registered` };
    }

    // Type validation
    const expectedType = feature.dataType;
    const actualType = typeof update.value;

    switch (expectedType) {
      case 'integer':
      case 'float':
        if (actualType !== 'number') {
          return { valid: false, message: `Expected number, got ${actualType}` };
        }
        break;
      case 'string':
        if (actualType !== 'string') {
          return { valid: false, message: `Expected string, got ${actualType}` };
        }
        break;
      case 'boolean':
        if (actualType !== 'boolean') {
          return { valid: false, message: `Expected boolean, got ${actualType}` };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Resolve feature conflicts
   */
  private resolveConflict(
    featureName: string,
    serverValue: unknown,
    clientValue: unknown,
    serverTimestamp: Date,
    clientTimestamp: Date
  ): { useClient: boolean; mergedValue?: unknown } {
    // Default strategy: server wins for older client data
    // Could be extended with more sophisticated merging

    // For numeric values, could use averaging or max
    if (
      typeof serverValue === 'number' &&
      typeof clientValue === 'number'
    ) {
      // Use client if it's significantly different (might be more recent local data)
      const diff = Math.abs(serverValue - clientValue);
      const threshold = Math.abs(serverValue) * 0.1; // 10% threshold
      if (diff > threshold) {
        return { useClient: true };
      }
    }

    // Default: server wins
    return { useClient: false };
  }

  /**
   * Compute checksum for sync verification
   */
  private computeChecksum(value: unknown): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate unique packet ID
   */
  private generatePacketId(): string {
    return `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get sync state key
   */
  private getSyncStateKey(clientId: string, entityId: string): string {
    return `${clientId}:${entityId}`;
  }

  /**
   * Get next sequence number
   */
  private getNextSequence(stateKey: string): number {
    const current = this.sequenceCounters.get(stateKey) || 0;
    const next = current + 1;
    this.sequenceCounters.set(stateKey, next);
    return next;
  }
}

// Export factory function
export const createFeatureSyncService = (
  featureStore: FeatureStore,
  config?: Partial<SyncConfig>
): FeatureSyncService => {
  return new FeatureSyncService(featureStore, config);
};
