import { Op, Sequelize, Model, ModelStatic, WhereOptions } from 'sequelize';
import { getSequelize } from '../../config/database';

// Types for sync operations
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data?: Record<string, unknown>;
  version?: number;
  timestamp: string;
}

export interface SyncConflict {
  entityType: string;
  entityId: string;
  localData?: Record<string, unknown>;
  serverData?: Record<string, unknown>;
  localVersion: number;
  serverVersion: number;
  serverTimestamp: string;
}

export interface SyncOperationResult {
  operationId: string;
  success: boolean;
  serverId?: string;
  newVersion?: number;
  error?: string;
  conflict?: SyncConflict;
}

export interface SyncedEntity {
  entityType: string;
  id: string;
  data: Record<string, unknown>;
  version: number;
  isDeleted: boolean;
  updatedAt: string;
}

export interface BatchSyncRequest {
  operations: SyncOperation[];
  clientTimestamp: string;
  lastSyncCursor?: string;
}

export interface BatchSyncResponse {
  success: boolean;
  results: SyncOperationResult[];
  serverChanges: SyncedEntity[];
  nextCursor?: string;
  serverTimestamp: string;
}

export interface DeltaSyncRequest {
  entityType: string;
  since?: string;
  cursor?: string;
  limit?: number;
  includeDeleted?: boolean;
}

export interface DeltaSyncResponse {
  entities: SyncedEntity[];
  hasMore: boolean;
  nextCursor?: string;
  serverTimestamp: string;
  totalChanges: number;
}

// Entity type mappings to Sequelize models
const ENTITY_TYPE_MAP: Record<string, string> = {
  goal: 'Goal',
  habit: 'Habit',
  task: 'Task',
  mood: 'Mood',
  progress: 'ProgressEntry',
};

/**
 * Delta Sync Service for incremental synchronization using Sequelize
 */
export class DeltaSyncService {
  private sequelize: Sequelize | null = null;

  private getSequelizeInstance(): Sequelize {
    if (!this.sequelize) {
      this.sequelize = getSequelize();
    }
    return this.sequelize;
  }

  private getModel(entityType: string): ModelStatic<Model> | null {
    const modelName = ENTITY_TYPE_MAP[entityType];
    if (!modelName) return null;

    const sequelize = this.getSequelizeInstance();
    return sequelize.models[modelName] as ModelStatic<Model> | undefined ?? null;
  }

  /**
   * Get entities that have changed since a given timestamp or cursor
   */
  async getDeltaChanges(
    userId: string,
    request: DeltaSyncRequest
  ): Promise<DeltaSyncResponse> {
    const { entityType, since, cursor, limit = 100, includeDeleted = true } = request;

    const model = this.getModel(entityType);
    if (!model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Parse cursor for pagination
    let sinceDate: Date | undefined;
    let lastId: string | undefined;

    if (cursor) {
      const parsed = this.parseCursor(cursor);
      sinceDate = parsed.timestamp;
      lastId = parsed.lastId;
    } else if (since) {
      sinceDate = new Date(since);
    }

    // Build where clause
    const where: WhereOptions = { userId };

    if (sinceDate) {
      where.updatedAt = { [Op.gte]: sinceDate };
    }

    if (lastId) {
      where.id = { [Op.gt]: lastId };
    }

    // Query entities
    const entities = await model.findAll({
      where: where as WhereOptions<unknown>,
      order: [
        ['updatedAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: limit + 1, // Fetch one extra to check if there are more
      raw: true,
    });

    const hasMore = entities.length > limit;
    const resultEntities = hasMore ? entities.slice(0, limit) : entities;

    // Transform to SyncedEntity format
    const syncedEntities: SyncedEntity[] = resultEntities.map((entity) => {
      const entityData = entity as unknown as Record<string, unknown>;
      return {
        entityType,
        id: entityData.id as string,
        data: entityData,
        version: (entityData.version as number) || 1,
        isDeleted: entityData.deletedAt != null,
        updatedAt: (entityData.updatedAt as Date)?.toISOString() || new Date().toISOString(),
      };
    });

    // Build next cursor
    let nextCursor: string | undefined;
    if (hasMore && syncedEntities.length > 0) {
      const lastEntity = syncedEntities[syncedEntities.length - 1];
      nextCursor = this.buildCursor(new Date(lastEntity.updatedAt), lastEntity.id);
    }

    return {
      entities: syncedEntities,
      hasMore,
      nextCursor,
      serverTimestamp: new Date().toISOString(),
      totalChanges: syncedEntities.length,
    };
  }

  /**
   * Process a batch of sync operations from the client
   */
  async processBatchSync(
    userId: string,
    request: BatchSyncRequest
  ): Promise<BatchSyncResponse> {
    const results: SyncOperationResult[] = [];
    const serverChanges: SyncedEntity[] = [];

    // Process operations in order
    for (const operation of request.operations) {
      try {
        const result = await this.processOperation(userId, operation);
        results.push(result);
      } catch (error) {
        results.push({
          operationId: operation.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Get server changes since last sync cursor
    if (request.lastSyncCursor) {
      const parsed = this.parseCursor(request.lastSyncCursor);

      for (const entityType of Object.keys(ENTITY_TYPE_MAP)) {
        try {
          const changes = await this.getDeltaChanges(userId, {
            entityType,
            since: parsed.timestamp.toISOString(),
            limit: 1000,
            includeDeleted: true,
          });
          serverChanges.push(...changes.entities);
        } catch {
          // Skip entities that fail to query
        }
      }
    }

    // Build next cursor
    const latestChange =
      serverChanges.length > 0
        ? serverChanges.reduce((latest, current) =>
            new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
          )
        : null;

    return {
      success: results.every((r) => r.success),
      results,
      serverChanges,
      nextCursor: latestChange
        ? this.buildCursor(new Date(latestChange.updatedAt), latestChange.id)
        : request.lastSyncCursor,
      serverTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(
    userId: string,
    operation: SyncOperation
  ): Promise<SyncOperationResult> {
    const model = this.getModel(operation.entityType);
    if (!model) {
      return {
        operationId: operation.id,
        success: false,
        error: `Unknown entity type: ${operation.entityType}`,
      };
    }

    switch (operation.type) {
      case 'create':
        return this.processCreate(userId, operation, model);
      case 'update':
        return this.processUpdate(userId, operation, model);
      case 'delete':
        return this.processDelete(userId, operation, model);
      default:
        return {
          operationId: operation.id,
          success: false,
          error: `Unknown operation type: ${operation.type}`,
        };
    }
  }

  /**
   * Process a create operation
   */
  private async processCreate(
    userId: string,
    operation: SyncOperation,
    model: ModelStatic<Model>
  ): Promise<SyncOperationResult> {
    try {
      // Check if entity already exists (client retry scenario)
      const existing = await model.findOne({
        where: { id: operation.entityId, userId } as WhereOptions<unknown>,
      });

      if (existing) {
        // Entity already exists, treat as update
        return this.processUpdate(userId, operation, model);
      }

      // Create the entity
      const data = {
        ...operation.data,
        id: operation.entityId,
        userId,
        version: 1,
      };

      const created = await model.create(data as unknown as Record<string, unknown>);
      const createdData = created.get({ plain: true }) as Record<string, unknown>;

      return {
        operationId: operation.id,
        success: true,
        serverId: createdData.id as string,
        newVersion: 1,
      };
    } catch (error) {
      return {
        operationId: operation.id,
        success: false,
        error: error instanceof Error ? error.message : 'Create failed',
      };
    }
  }

  /**
   * Process an update operation with conflict detection
   */
  private async processUpdate(
    userId: string,
    operation: SyncOperation,
    model: ModelStatic<Model>
  ): Promise<SyncOperationResult> {
    try {
      // Get current server version
      const existing = await model.findOne({
        where: { id: operation.entityId, userId } as WhereOptions<unknown>,
      });

      if (!existing) {
        return {
          operationId: operation.id,
          success: false,
          error: 'Entity not found',
        };
      }

      const existingData = existing.get({ plain: true }) as Record<string, unknown>;

      // Check for version conflict
      const serverVersion = (existingData.version as number) || 1;
      const clientVersion = operation.version || 0;

      if (clientVersion < serverVersion) {
        // Conflict detected
        return {
          operationId: operation.id,
          success: false,
          conflict: {
            entityType: operation.entityType,
            entityId: operation.entityId,
            localData: operation.data,
            serverData: existingData,
            localVersion: clientVersion,
            serverVersion,
            serverTimestamp: (existingData.updatedAt as Date)?.toISOString() || new Date().toISOString(),
          },
        };
      }

      // Apply update
      const newVersion = serverVersion + 1;
      const updateData = {
        ...operation.data,
        version: newVersion,
      };

      await existing.update(updateData);

      return {
        operationId: operation.id,
        success: true,
        serverId: operation.entityId,
        newVersion,
      };
    } catch (error) {
      return {
        operationId: operation.id,
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Process a delete operation (soft delete)
   */
  private async processDelete(
    userId: string,
    operation: SyncOperation,
    model: ModelStatic<Model>
  ): Promise<SyncOperationResult> {
    try {
      const existing = await model.findOne({
        where: { id: operation.entityId, userId } as WhereOptions<unknown>,
      });

      if (!existing) {
        // Already deleted or never existed - consider success
        return {
          operationId: operation.id,
          success: true,
        };
      }

      const existingData = existing.get({ plain: true }) as Record<string, unknown>;

      // Soft delete with version increment
      const newVersion = ((existingData.version as number) || 1) + 1;
      await existing.update({
        deletedAt: new Date(),
        version: newVersion,
      });

      return {
        operationId: operation.id,
        success: true,
        newVersion,
      };
    } catch (error) {
      return {
        operationId: operation.id,
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Build a cursor from timestamp and ID
   */
  private buildCursor(timestamp: Date, id: string): string {
    return Buffer.from(JSON.stringify({ t: timestamp.toISOString(), i: id })).toString('base64');
  }

  /**
   * Parse a cursor into timestamp and ID
   */
  private parseCursor(cursor: string): { timestamp: Date; lastId?: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      return {
        timestamp: new Date(parsed.t),
        lastId: parsed.i,
      };
    } catch {
      return { timestamp: new Date(0) };
    }
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<{
    lastSync?: string;
    pendingChanges: number;
    entities: Record<string, { count: number; lastUpdate?: string }>;
  }> {
    const entities: Record<string, { count: number; lastUpdate?: string }> = {};

    for (const entityType of Object.keys(ENTITY_TYPE_MAP)) {
      try {
        const stats = await this.getEntityStats(userId, entityType);
        entities[entityType] = stats;
      } catch {
        entities[entityType] = { count: 0 };
      }
    }

    const totalPending = Object.values(entities).reduce((sum, e) => sum + e.count, 0);

    return {
      pendingChanges: totalPending,
      entities,
    };
  }

  /**
   * Get statistics for an entity type
   */
  private async getEntityStats(
    userId: string,
    entityType: string
  ): Promise<{ count: number; lastUpdate?: string }> {
    const model = this.getModel(entityType);
    if (!model) {
      return { count: 0 };
    }

    const count = await model.count({
      where: { userId } as WhereOptions<unknown>,
    });

    const latest = await model.findOne({
      where: { userId } as WhereOptions<unknown>,
      order: [['updatedAt', 'DESC']],
      attributes: ['updatedAt'],
    });

    const latestData = latest?.get({ plain: true }) as Record<string, unknown> | undefined;

    return {
      count,
      lastUpdate: (latestData?.updatedAt as Date)?.toISOString(),
    };
  }
}

// Export singleton instance
export const deltaSyncService = new DeltaSyncService();
