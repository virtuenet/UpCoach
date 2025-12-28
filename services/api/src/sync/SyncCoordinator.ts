/**
 * Server-side sync coordination and conflict detection
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface SyncRequest {
  tenantId: string;
  userId: string;
  clientVersion: number;
  lastSyncTime?: Date;
  changes: SyncChange[];
}

export interface SyncChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: Date;
  version: number;
}

export interface SyncResponse {
  success: boolean;
  serverVersion: number;
  conflicts: SyncConflict[];
  serverChanges: SyncChange[];
  appliedChanges: string[]; // IDs of successfully applied changes
  failedChanges: Array<{ id: string; error: string }>;
  nextSyncToken?: string;
}

export interface SyncConflict {
  changeId: string;
  entityType: string;
  entityId: string;
  clientData: Record<string, any>;
  serverData: Record<string, any>;
  clientVersion: number;
  serverVersion: number;
}

export interface VersionVector {
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  version: number;
  lastModified: Date;
  modifiedBy: string;
  checksum?: string;
}

export class SyncCoordinator extends EventEmitter {
  private static instance: SyncCoordinator;
  private versionVectors: Map<string, VersionVector> = new Map();
  private syncTokens: Map<string, SyncTokenData> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): SyncCoordinator {
    if (!SyncCoordinator.instance) {
      SyncCoordinator.instance = new SyncCoordinator();
    }
    return SyncCoordinator.instance;
  }

  /**
   * Process sync request from client
   */
  async processSyncRequest(request: SyncRequest): Promise<SyncResponse> {
    console.log(`[SyncCoordinator] Processing sync for user ${request.userId}`);

    const appliedChanges: string[] = [];
    const failedChanges: Array<{ id: string; error: string }> = [];
    const conflicts: SyncConflict[] = [];

    // Process each change from client
    for (const change of request.changes) {
      try {
        const result = await this.applyChange(request.tenantId, request.userId, change);

        if (result.conflict) {
          conflicts.push(result.conflict);
        } else if (result.success) {
          appliedChanges.push(change.id);
        } else {
          failedChanges.push({ id: change.id, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
        failedChanges.push({ id: change.id, error: error.message });
      }
    }

    // Get server changes since last sync
    const serverChanges = await this.getServerChanges(
      request.tenantId,
      request.userId,
      request.lastSyncTime
    );

    // Generate sync token for next sync
    const nextSyncToken = this.generateSyncToken(request.tenantId, request.userId);

    const response: SyncResponse = {
      success: failedChanges.length === 0 && conflicts.length === 0,
      serverVersion: Date.now(), // Use timestamp as version
      conflicts,
      serverChanges,
      appliedChanges,
      failedChanges,
      nextSyncToken,
    };

    this.emit('sync:processed', {
      userId: request.userId,
      appliedCount: appliedChanges.length,
      conflictCount: conflicts.length,
      failedCount: failedChanges.length,
    });

    return response;
  }

  /**
   * Apply a single change from client
   */
  private async applyChange(
    tenantId: string,
    userId: string,
    change: SyncChange
  ): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    const versionKey = this.getVersionKey(tenantId, change.entityType, change.entityId);
    const serverVersion = this.versionVectors.get(versionKey);

    // Check for conflicts
    if (serverVersion && serverVersion.version >= change.version) {
      // Server has newer or equal version - conflict detected
      const conflict: SyncConflict = {
        changeId: change.id,
        entityType: change.entityType,
        entityId: change.entityId,
        clientData: change.data,
        serverData: await this.getEntityData(tenantId, change.entityType, change.entityId),
        clientVersion: change.version,
        serverVersion: serverVersion.version,
      };

      console.log(
        `[SyncCoordinator] Conflict detected: ${change.entityType}:${change.entityId} (client v${change.version} vs server v${serverVersion.version})`
      );

      return { success: false, conflict };
    }

    try {
      // Apply change to database
      await this.persistChange(tenantId, userId, change);

      // Update version vector
      const newVersion: VersionVector = {
        tenantId,
        userId,
        entityType: change.entityType,
        entityId: change.entityId,
        version: change.version,
        lastModified: new Date(),
        modifiedBy: userId,
        checksum: this.calculateChecksum(change.data),
      };

      this.versionVectors.set(versionKey, newVersion);

      console.log(
        `[SyncCoordinator] Applied ${change.operation} on ${change.entityType}:${change.entityId}`
      );

      return { success: true };
    } catch (error: any) {
      console.error(`[SyncCoordinator] Error applying change:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get server changes since last sync
   */
  private async getServerChanges(
    tenantId: string,
    userId: string,
    since?: Date
  ): Promise<SyncChange[]> {
    // TODO: Query database for changes since lastSyncTime
    // This would be implemented based on your data model

    const changes: SyncChange[] = [];

    // Filter version vectors modified after lastSyncTime
    const sinceTime = since || new Date(0);

    for (const [key, vector] of this.versionVectors.entries()) {
      if (
        vector.tenantId === tenantId &&
        vector.lastModified > sinceTime &&
        vector.modifiedBy !== userId // Don't return user's own changes
      ) {
        const data = await this.getEntityData(tenantId, vector.entityType, vector.entityId);

        changes.push({
          id: crypto.randomUUID(),
          entityType: vector.entityType,
          entityId: vector.entityId,
          operation: 'update',
          data,
          timestamp: vector.lastModified,
          version: vector.version,
        });
      }
    }

    console.log(`[SyncCoordinator] Found ${changes.length} server changes since ${sinceTime}`);
    return changes;
  }

  /**
   * Persist change to database
   */
  private async persistChange(tenantId: string, userId: string, change: SyncChange): Promise<void> {
    // TODO: Implement actual database persistence
    // This would use your data access layer

    console.log(`[SyncCoordinator] Persisting ${change.operation} for ${change.entityType}`);

    // Simulated database operation
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Get entity data from database
   */
  private async getEntityData(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<Record<string, any>> {
    // TODO: Implement actual database fetch
    // This would query your database based on entity type

    console.log(`[SyncCoordinator] Fetching ${entityType}:${entityId}`);

    // Simulated data
    return {
      id: entityId,
      type: entityType,
      data: {},
    };
  }

  /**
   * Generate sync token for pagination
   */
  private generateSyncToken(tenantId: string, userId: string): string {
    const token = crypto.randomUUID();
    const tokenData: SyncTokenData = {
      token,
      tenantId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };

    this.syncTokens.set(token, tokenData);

    return token;
  }

  /**
   * Validate sync token
   */
  async validateSyncToken(token: string): Promise<boolean> {
    const tokenData = this.syncTokens.get(token);

    if (!tokenData) return false;
    if (tokenData.expiresAt < new Date()) {
      this.syncTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Batch sync - process multiple entities at once
   */
  async batchSync(requests: SyncRequest[]): Promise<SyncResponse[]> {
    console.log(`[SyncCoordinator] Processing batch sync: ${requests.length} requests`);

    const responses = await Promise.all(requests.map((req) => this.processSyncRequest(req)));

    return responses;
  }

  /**
   * Resolve conflict with strategy
   */
  async resolveConflict(
    conflict: SyncConflict,
    strategy: 'client-wins' | 'server-wins' | 'merge'
  ): Promise<void> {
    console.log(`[SyncCoordinator] Resolving conflict with ${strategy}`);

    const versionKey = this.getVersionKey('', conflict.entityType, conflict.entityId); // TODO: Add tenantId

    switch (strategy) {
      case 'client-wins':
        // Update server with client data
        this.versionVectors.set(versionKey, {
          tenantId: '',
          userId: '',
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          version: conflict.clientVersion + 1,
          lastModified: new Date(),
          modifiedBy: '',
          checksum: this.calculateChecksum(conflict.clientData),
        });
        break;

      case 'server-wins':
        // Client should accept server data (no action needed)
        break;

      case 'merge':
        // Merge both datasets
        const merged = { ...conflict.serverData, ...conflict.clientData };
        this.versionVectors.set(versionKey, {
          tenantId: '',
          userId: '',
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          version: Math.max(conflict.clientVersion, conflict.serverVersion) + 1,
          lastModified: new Date(),
          modifiedBy: '',
          checksum: this.calculateChecksum(merged),
        });
        break;
    }

    this.emit('conflict:resolved', { conflict, strategy });
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: Record<string, any>): string {
    const json = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Get version key
   */
  private getVersionKey(tenantId: string, entityType: string, entityId: string): string {
    return `${tenantId}:${entityType}:${entityId}`;
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): SyncStats {
    const activeVectors = Array.from(this.versionVectors.values());
    const recentSyncs = activeVectors.filter(
      (v) => v.lastModified > new Date(Date.now() - 3600000)
    );

    return {
      totalEntities: this.versionVectors.size,
      activeSyncTokens: this.syncTokens.size,
      recentSyncs: recentSyncs.length,
      oldestSync: activeVectors.reduce(
        (oldest, v) => (v.lastModified < oldest ? v.lastModified : oldest),
        new Date()
      ),
      newestSync: activeVectors.reduce(
        (newest, v) => (v.lastModified > newest ? v.lastModified : newest),
        new Date(0)
      ),
    };
  }

  /**
   * Clear expired sync tokens
   */
  clearExpiredTokens(): void {
    const now = new Date();
    let cleared = 0;

    for (const [token, data] of this.syncTokens.entries()) {
      if (data.expiresAt < now) {
        this.syncTokens.delete(token);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[SyncCoordinator] Cleared ${cleared} expired sync tokens`);
    }
  }
}

interface SyncTokenData {
  token: string;
  tenantId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

interface SyncStats {
  totalEntities: number;
  activeSyncTokens: number;
  recentSyncs: number;
  oldestSync: Date;
  newestSync: Date;
}

export const syncCoordinator = SyncCoordinator.getInstance();
