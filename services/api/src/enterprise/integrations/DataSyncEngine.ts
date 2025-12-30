import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';

export enum SyncDirection {
  BIDIRECTIONAL = 'bidirectional',
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ConflictResolution {
  SOURCE_WINS = 'source_wins',
  DESTINATION_WINS = 'destination_wins',
  NEWEST_WINS = 'newest_wins',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export enum ChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface SyncConfig {
  id: string;
  organizationId: string;
  integrationId: string;
  name: string;
  direction: SyncDirection;
  enabled: boolean;
  schedule?: {
    frequency: number; // minutes
    nextRun?: Date;
  };
  fieldMappings: Record<string, string>;
  filters?: {
    sourceFilters?: Record<string, any>;
    destinationFilters?: Record<string, any>;
  };
  conflictResolution: ConflictResolution;
  options: {
    incrementalSync: boolean;
    batchSize: number;
    continueOnError: boolean;
    deleteOrphaned: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastSyncAt?: Date;
    lastSuccessAt?: Date;
  };
}

export interface SyncJob {
  id: string;
  configId: string;
  organizationId: string;
  status: SyncStatus;
  direction: SyncDirection;
  startedAt: Date;
  completedAt?: Date;
  stats: {
    totalRecords: number;
    processedRecords: number;
    createdRecords: number;
    updatedRecords: number;
    deletedRecords: number;
    failedRecords: number;
    skippedRecords: number;
  };
  errors: Array<{
    recordId: string;
    error: string;
    data?: any;
  }>;
  conflicts: Array<{
    recordId: string;
    sourceData: any;
    destinationData: any;
    resolution?: 'source' | 'destination' | 'merged';
  }>;
}

export interface ChangeRecord {
  id: string;
  entityType: string;
  entityId: string;
  changeType: ChangeType;
  data: any;
  timestamp: Date;
  checksum: string;
}

export interface SyncMapping {
  sourceField: string;
  destinationField: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

class DataSyncEngine extends EventEmitter {
  private redis: Redis;
  private syncConfigs: Map<string, SyncConfig>;
  private activeSyncJobs: Map<string, SyncJob>;
  private scheduleIntervals: Map<string, NodeJS.Timeout>;
  private readonly CACHE_PREFIX = 'sync:';
  private readonly CONFIG_PREFIX = 'sync:config:';
  private readonly JOB_PREFIX = 'sync:job:';
  private readonly CHANGE_PREFIX = 'sync:change:';
  private readonly CHECKPOINT_PREFIX = 'sync:checkpoint:';

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.syncConfigs = new Map();
    this.activeSyncJobs = new Map();
    this.scheduleIntervals = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadConfigsFromCache();
      await this.scheduleAllSyncs();
      this.emit('engine:initialized');
    } catch (error) {
      this.emit('engine:error', { error: 'Failed to initialize sync engine', details: error });
      throw error;
    }
  }

  private async loadConfigsFromCache(): Promise<void> {
    const keys = await this.redis.keys(`${this.CONFIG_PREFIX}*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const config = JSON.parse(data);
        this.syncConfigs.set(config.id, config);
      }
    }
  }

  public async createSyncConfig(
    organizationId: string,
    integrationId: string,
    name: string,
    direction: SyncDirection,
    fieldMappings: Record<string, string>,
    options?: Partial<SyncConfig>
  ): Promise<SyncConfig> {
    const config: SyncConfig = {
      id: crypto.randomUUID(),
      organizationId,
      integrationId,
      name,
      direction,
      enabled: true,
      schedule: options?.schedule,
      fieldMappings,
      filters: options?.filters,
      conflictResolution: options?.conflictResolution || ConflictResolution.NEWEST_WINS,
      options: {
        incrementalSync: options?.options?.incrementalSync ?? true,
        batchSize: options?.options?.batchSize || 100,
        continueOnError: options?.options?.continueOnError ?? true,
        deleteOrphaned: options?.options?.deleteOrphaned ?? false
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    this.syncConfigs.set(config.id, config);
    await this.saveConfigToCache(config);

    if (config.enabled && config.schedule) {
      await this.scheduleSync(config);
    }

    this.emit('config:created', { configId: config.id });
    return config;
  }

  public async updateSyncConfig(configId: string, updates: Partial<SyncConfig>): Promise<SyncConfig> {
    const config = this.syncConfigs.get(configId);
    if (!config) {
      throw new Error('Sync config not found');
    }

    const wasEnabled = config.enabled;
    Object.assign(config, updates);
    config.metadata.updatedAt = new Date();

    await this.saveConfigToCache(config);

    if (wasEnabled !== config.enabled || updates.schedule) {
      if (config.enabled && config.schedule) {
        await this.scheduleSync(config);
      } else {
        this.unscheduleSync(config.id);
      }
    }

    this.emit('config:updated', { configId });
    return config;
  }

  public async deleteSyncConfig(configId: string): Promise<void> {
    const config = this.syncConfigs.get(configId);
    if (!config) {
      throw new Error('Sync config not found');
    }

    this.unscheduleSync(configId);
    this.syncConfigs.delete(configId);
    await this.redis.del(`${this.CONFIG_PREFIX}${configId}`);

    this.emit('config:deleted', { configId });
  }

  private async scheduleSync(config: SyncConfig): Promise<void> {
    this.unscheduleSync(config.id);

    if (!config.schedule || !config.enabled) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await this.startSync(config.id);
      } catch (error) {
        this.emit('sync:schedule:error', { configId: config.id, error });
      }
    }, config.schedule.frequency * 60 * 1000);

    this.scheduleIntervals.set(config.id, interval);

    if (!config.schedule.nextRun) {
      config.schedule.nextRun = new Date(Date.now() + config.schedule.frequency * 60 * 1000);
      await this.saveConfigToCache(config);
    }
  }

  private unscheduleSync(configId: string): void {
    const interval = this.scheduleIntervals.get(configId);
    if (interval) {
      clearInterval(interval);
      this.scheduleIntervals.delete(configId);
    }
  }

  private async scheduleAllSyncs(): Promise<void> {
    for (const config of this.syncConfigs.values()) {
      if (config.enabled && config.schedule) {
        await this.scheduleSync(config);
      }
    }
  }

  public async startSync(configId: string, options?: { force?: boolean }): Promise<SyncJob> {
    const config = this.syncConfigs.get(configId);
    if (!config) {
      throw new Error('Sync config not found');
    }

    if (!config.enabled && !options?.force) {
      throw new Error('Sync config is disabled');
    }

    const activeJob = Array.from(this.activeSyncJobs.values()).find(
      job => job.configId === configId && job.status === SyncStatus.IN_PROGRESS
    );

    if (activeJob) {
      throw new Error('Sync already in progress for this config');
    }

    const job: SyncJob = {
      id: crypto.randomUUID(),
      configId,
      organizationId: config.organizationId,
      status: SyncStatus.IN_PROGRESS,
      direction: config.direction,
      startedAt: new Date(),
      stats: {
        totalRecords: 0,
        processedRecords: 0,
        createdRecords: 0,
        updatedRecords: 0,
        deletedRecords: 0,
        failedRecords: 0,
        skippedRecords: 0
      },
      errors: [],
      conflicts: []
    };

    this.activeSyncJobs.set(job.id, job);
    await this.saveJobToCache(job);

    this.emit('sync:started', { jobId: job.id, configId });

    this.executeSync(config, job).catch(error => {
      this.emit('sync:error', { jobId: job.id, error });
    });

    return job;
  }

  private async executeSync(config: SyncConfig, job: SyncJob): Promise<void> {
    try {
      const checkpoint = await this.getCheckpoint(config.id);

      if (config.direction === SyncDirection.INBOUND || config.direction === SyncDirection.BIDIRECTIONAL) {
        await this.syncInbound(config, job, checkpoint);
      }

      if (config.direction === SyncDirection.OUTBOUND || config.direction === SyncDirection.BIDIRECTIONAL) {
        await this.syncOutbound(config, job, checkpoint);
      }

      job.status = SyncStatus.COMPLETED;
      job.completedAt = new Date();

      config.metadata.lastSyncAt = new Date();
      if (job.errors.length === 0) {
        config.metadata.lastSuccessAt = new Date();
      }

      if (config.schedule) {
        config.schedule.nextRun = new Date(Date.now() + config.schedule.frequency * 60 * 1000);
      }

      await this.saveConfigToCache(config);
      await this.saveCheckpoint(config.id, new Date());

      this.emit('sync:completed', { jobId: job.id, stats: job.stats });
    } catch (error) {
      job.status = SyncStatus.FAILED;
      job.completedAt = new Date();
      job.errors.push({
        recordId: 'N/A',
        error: error instanceof Error ? error.message : String(error)
      });

      this.emit('sync:failed', { jobId: job.id, error });
    } finally {
      await this.saveJobToCache(job);
      this.activeSyncJobs.delete(job.id);
    }
  }

  private async syncInbound(config: SyncConfig, job: SyncJob, checkpoint?: Date): Promise<void> {
    const sourceRecords = await this.fetchSourceRecords(config, checkpoint);
    job.stats.totalRecords += sourceRecords.length;

    for (let i = 0; i < sourceRecords.length; i += config.options.batchSize) {
      const batch = sourceRecords.slice(i, i + config.options.batchSize);
      await this.processBatch(config, job, batch, 'inbound');
    }
  }

  private async syncOutbound(config: SyncConfig, job: SyncJob, checkpoint?: Date): Promise<void> {
    const destinationRecords = await this.fetchDestinationRecords(config, checkpoint);
    job.stats.totalRecords += destinationRecords.length;

    for (let i = 0; i < destinationRecords.length; i += config.options.batchSize) {
      const batch = destinationRecords.slice(i, i + config.options.batchSize);
      await this.processBatch(config, job, batch, 'outbound');
    }
  }

  private async processBatch(
    config: SyncConfig,
    job: SyncJob,
    records: any[],
    direction: 'inbound' | 'outbound'
  ): Promise<void> {
    for (const record of records) {
      try {
        const mappedRecord = this.mapFields(record, config.fieldMappings);
        const changeType = await this.detectChangeType(config, mappedRecord, direction);

        if (changeType === ChangeType.CREATE) {
          await this.createRecord(config, mappedRecord, direction);
          job.stats.createdRecords++;
        } else if (changeType === ChangeType.UPDATE) {
          const conflict = await this.detectConflict(config, mappedRecord, direction);

          if (conflict) {
            const resolution = await this.resolveConflict(config, conflict);
            job.conflicts.push({
              recordId: mappedRecord.id,
              sourceData: conflict.sourceData,
              destinationData: conflict.destinationData,
              resolution
            });
          }

          await this.updateRecord(config, mappedRecord, direction);
          job.stats.updatedRecords++;
        } else if (changeType === ChangeType.DELETE && config.options.deleteOrphaned) {
          await this.deleteRecord(config, mappedRecord, direction);
          job.stats.deletedRecords++;
        } else {
          job.stats.skippedRecords++;
        }

        job.stats.processedRecords++;
        await this.trackChange(config, mappedRecord, changeType);

      } catch (error) {
        job.stats.failedRecords++;
        job.errors.push({
          recordId: record.id || 'unknown',
          error: error instanceof Error ? error.message : String(error),
          data: record
        });

        if (!config.options.continueOnError) {
          throw error;
        }
      }

      if (job.stats.processedRecords % 100 === 0) {
        await this.saveJobToCache(job);
        this.emit('sync:progress', {
          jobId: job.id,
          progress: (job.stats.processedRecords / job.stats.totalRecords) * 100,
          stats: job.stats
        });
      }
    }
  }

  private mapFields(record: any, mappings: Record<string, string>): any {
    const mapped: any = {};

    for (const [sourceField, destField] of Object.entries(mappings)) {
      const value = this.getNestedValue(record, sourceField);
      if (value !== undefined) {
        this.setNestedValue(mapped, destField, value);
      }
    }

    return mapped;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  private async detectChangeType(
    config: SyncConfig,
    record: any,
    direction: 'inbound' | 'outbound'
  ): Promise<ChangeType> {
    const existingRecord = await this.findExistingRecord(config, record, direction);

    if (!existingRecord) {
      return ChangeType.CREATE;
    }

    const recordChecksum = this.calculateChecksum(record);
    const existingChecksum = this.calculateChecksum(existingRecord);

    if (recordChecksum !== existingChecksum) {
      return ChangeType.UPDATE;
    }

    return ChangeType.UPDATE; // No change, will be skipped
  }

  private calculateChecksum(data: any): string {
    const sortedData = this.sortObject(data);
    return crypto
      .createHash('md5')
      .update(JSON.stringify(sortedData))
      .digest('hex');
  }

  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = this.sortObject(obj[key]);
        return result;
      }, {});
  }

  private async detectConflict(
    config: SyncConfig,
    record: any,
    direction: 'inbound' | 'outbound'
  ): Promise<{ sourceData: any; destinationData: any } | null> {
    const existingRecord = await this.findExistingRecord(config, record, direction);

    if (!existingRecord) {
      return null;
    }

    const recordTimestamp = new Date(record.updatedAt || record.createdAt);
    const existingTimestamp = new Date(existingRecord.updatedAt || existingRecord.createdAt);

    if (Math.abs(recordTimestamp.getTime() - existingTimestamp.getTime()) < 1000) {
      return null;
    }

    const recordChecksum = this.calculateChecksum(record);
    const existingChecksum = this.calculateChecksum(existingRecord);

    if (recordChecksum !== existingChecksum) {
      return {
        sourceData: direction === 'inbound' ? record : existingRecord,
        destinationData: direction === 'inbound' ? existingRecord : record
      };
    }

    return null;
  }

  private async resolveConflict(
    config: SyncConfig,
    conflict: { sourceData: any; destinationData: any }
  ): Promise<'source' | 'destination' | 'merged'> {
    switch (config.conflictResolution) {
      case ConflictResolution.SOURCE_WINS:
        return 'source';

      case ConflictResolution.DESTINATION_WINS:
        return 'destination';

      case ConflictResolution.NEWEST_WINS: {
        const sourceTime = new Date(conflict.sourceData.updatedAt || conflict.sourceData.createdAt);
        const destTime = new Date(conflict.destinationData.updatedAt || conflict.destinationData.createdAt);
        return sourceTime > destTime ? 'source' : 'destination';
      }

      case ConflictResolution.MERGE:
        return 'merged';

      case ConflictResolution.MANUAL:
        this.emit('conflict:manual', { conflict, configId: config.id });
        return 'source'; // Default to source for now

      default:
        return 'source';
    }
  }

  private async fetchSourceRecords(config: SyncConfig, checkpoint?: Date): Promise<any[]> {
    // This would integrate with the actual source system
    // For now, returning mock data
    this.emit('fetch:source', { configId: config.id, checkpoint });
    return [];
  }

  private async fetchDestinationRecords(config: SyncConfig, checkpoint?: Date): Promise<any[]> {
    // This would integrate with the actual destination system
    // For now, returning mock data
    this.emit('fetch:destination', { configId: config.id, checkpoint });
    return [];
  }

  private async findExistingRecord(config: SyncConfig, record: any, direction: 'inbound' | 'outbound'): Promise<any | null> {
    // This would query the target system for existing records
    this.emit('find:record', { configId: config.id, recordId: record.id, direction });
    return null;
  }

  private async createRecord(config: SyncConfig, record: any, direction: 'inbound' | 'outbound'): Promise<void> {
    this.emit('record:create', { configId: config.id, record, direction });
  }

  private async updateRecord(config: SyncConfig, record: any, direction: 'inbound' | 'outbound'): Promise<void> {
    this.emit('record:update', { configId: config.id, record, direction });
  }

  private async deleteRecord(config: SyncConfig, record: any, direction: 'inbound' | 'outbound'): Promise<void> {
    this.emit('record:delete', { configId: config.id, record, direction });
  }

  private async trackChange(config: SyncConfig, record: any, changeType: ChangeType): Promise<void> {
    const change: ChangeRecord = {
      id: crypto.randomUUID(),
      entityType: record.type || 'unknown',
      entityId: record.id,
      changeType,
      data: record,
      timestamp: new Date(),
      checksum: this.calculateChecksum(record)
    };

    await this.redis.setex(
      `${this.CHANGE_PREFIX}${config.id}:${change.id}`,
      86400, // 24 hours
      JSON.stringify(change)
    );

    this.emit('change:tracked', { configId: config.id, change });
  }

  private async getCheckpoint(configId: string): Promise<Date | undefined> {
    const checkpoint = await this.redis.get(`${this.CHECKPOINT_PREFIX}${configId}`);
    return checkpoint ? new Date(checkpoint) : undefined;
  }

  private async saveCheckpoint(configId: string, timestamp: Date): Promise<void> {
    await this.redis.set(`${this.CHECKPOINT_PREFIX}${configId}`, timestamp.toISOString());
  }

  public async cancelSync(jobId: string): Promise<void> {
    const job = this.activeSyncJobs.get(jobId);
    if (!job) {
      throw new Error('Sync job not found or already completed');
    }

    job.status = SyncStatus.CANCELLED;
    job.completedAt = new Date();

    await this.saveJobToCache(job);
    this.activeSyncJobs.delete(jobId);

    this.emit('sync:cancelled', { jobId });
  }

  public async getSyncJob(jobId: string): Promise<SyncJob | null> {
    let job = this.activeSyncJobs.get(jobId);

    if (!job) {
      const data = await this.redis.get(`${this.JOB_PREFIX}${jobId}`);
      if (data) {
        job = JSON.parse(data);
      }
    }

    return job || null;
  }

  public async getSyncHistory(
    configId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<SyncJob[]> {
    const pattern = `${this.JOB_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    const jobs: SyncJob[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const job = JSON.parse(data);
        if (job.configId === configId) {
          jobs.push(job);
        }
      }
    }

    jobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return jobs.slice(offset, offset + limit);
  }

  private async saveConfigToCache(config: SyncConfig): Promise<void> {
    await this.redis.set(
      `${this.CONFIG_PREFIX}${config.id}`,
      JSON.stringify(config)
    );
  }

  private async saveJobToCache(job: SyncJob): Promise<void> {
    await this.redis.setex(
      `${this.JOB_PREFIX}${job.id}`,
      2592000, // 30 days
      JSON.stringify(job)
    );
  }

  public getSyncConfig(configId: string): SyncConfig | undefined {
    return this.syncConfigs.get(configId);
  }

  public getSyncConfigsByOrganization(organizationId: string): SyncConfig[] {
    return Array.from(this.syncConfigs.values())
      .filter(config => config.organizationId === organizationId);
  }

  public async shutdown(): Promise<void> {
    for (const interval of this.scheduleIntervals.values()) {
      clearInterval(interval);
    }
    this.scheduleIntervals.clear();
    this.removeAllListeners();
    this.emit('engine:shutdown');
  }
}

export default DataSyncEngine;
