/**
 * Feature Store
 * Centralized feature management for ML models
 * Provides feature versioning, point-in-time lookups, and materialization
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

export interface FeatureDefinition {
  name: string;
  description: string;
  dataType: FeatureDataType;
  featureGroup: string;
  computationLogic: string;
  sourceTable?: string;
  sourceColumn?: string;
  aggregation?: AggregationType;
  windowSize?: string;
  fillValue?: unknown;
  tags: string[];
  owner: string;
  deprecated: boolean;
}

export type FeatureDataType = 'float' | 'integer' | 'string' | 'boolean' | 'array' | 'embedding';

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'last' | 'first' | 'stddev';

export interface RegisteredFeature extends FeatureDefinition {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  statistics?: FeatureStatistics;
}

export interface FeatureStatistics {
  count: number;
  nullCount: number;
  uniqueCount?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  histogram?: HistogramBucket[];
  lastUpdated: Date;
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export interface FeatureVector {
  entityId: string;
  timestamp: Date;
  features: Record<string, FeatureValue>;
  metadata?: {
    source: string;
    version: number;
    latencyMs?: number;
  };
}

export interface FeatureValue {
  value: unknown;
  timestamp: Date;
  version: number;
  isNull: boolean;
}

export interface FeatureGroupConfig {
  name: string;
  description: string;
  entityType: EntityType;
  features: string[];
  ttl?: number;
  owner: string;
  schema: FeatureGroupSchema;
}

export type EntityType = 'user' | 'coach' | 'session' | 'goal' | 'subscription';

export interface FeatureGroupSchema {
  primaryKey: string;
  eventTimestamp: string;
  features: SchemaFeature[];
}

export interface SchemaFeature {
  name: string;
  type: FeatureDataType;
  required: boolean;
}

export interface RegisteredFeatureGroup {
  id: string;
  config: FeatureGroupConfig;
  featureCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMaterialized?: Date;
  status: 'active' | 'materializing' | 'error';
}

export interface MaterializationJob {
  id: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  rowsProcessed: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface OnlineStore {
  get(entityId: string, features: string[]): Promise<Record<string, FeatureValue>>;
  set(entityId: string, features: Record<string, unknown>, timestamp: Date): Promise<void>;
  delete(entityId: string): Promise<void>;
}

export interface OfflineStore {
  getHistorical(entityId: string, features: string[], timestamp: Date): Promise<Record<string, FeatureValue>>;
  getRange(entityId: string, features: string[], startTime: Date, endTime: Date): Promise<FeatureVector[]>;
  materialize(groupId: string, data: FeatureVector[]): Promise<void>;
}

// ==================== Feature Store ====================

export class FeatureStore extends EventEmitter {
  private features: Map<string, RegisteredFeature> = new Map();
  private featureGroups: Map<string, RegisteredFeatureGroup> = new Map();
  private onlineData: Map<string, Map<string, FeatureValue>> = new Map();
  private offlineData: Map<string, FeatureVector[]> = new Map();
  private materializationJobs: Map<string, MaterializationJob> = new Map();

  constructor() {
    super();
    this.initializeDefaultFeatures();
  }

  /**
   * Initialize coaching-specific features
   */
  private initializeDefaultFeatures(): void {
    const defaultFeatures: FeatureDefinition[] = [
      // User engagement features
      {
        name: 'user_session_count_7d',
        description: 'Number of coaching sessions in last 7 days',
        dataType: 'integer',
        featureGroup: 'user_engagement',
        computationLogic: 'COUNT(sessions) WHERE date >= NOW() - 7 days',
        sourceTable: 'sessions',
        aggregation: 'count',
        windowSize: '7d',
        tags: ['engagement', 'sessions'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_session_count_30d',
        description: 'Number of coaching sessions in last 30 days',
        dataType: 'integer',
        featureGroup: 'user_engagement',
        computationLogic: 'COUNT(sessions) WHERE date >= NOW() - 30 days',
        sourceTable: 'sessions',
        aggregation: 'count',
        windowSize: '30d',
        tags: ['engagement', 'sessions'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_avg_session_duration',
        description: 'Average session duration in minutes (30-day)',
        dataType: 'float',
        featureGroup: 'user_engagement',
        computationLogic: 'AVG(session_duration_minutes) WHERE date >= NOW() - 30 days',
        sourceTable: 'sessions',
        aggregation: 'avg',
        windowSize: '30d',
        tags: ['engagement', 'sessions', 'duration'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_goal_completion_rate',
        description: 'Percentage of goals completed',
        dataType: 'float',
        featureGroup: 'user_goals',
        computationLogic: 'SUM(completed_goals) / COUNT(goals)',
        sourceTable: 'goals',
        aggregation: 'avg',
        tags: ['goals', 'completion'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_days_since_last_session',
        description: 'Days since last coaching session',
        dataType: 'integer',
        featureGroup: 'user_engagement',
        computationLogic: 'DATEDIFF(NOW(), MAX(session_date))',
        sourceTable: 'sessions',
        aggregation: 'last',
        tags: ['engagement', 'recency'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_login_frequency_7d',
        description: 'Number of logins in last 7 days',
        dataType: 'integer',
        featureGroup: 'user_engagement',
        computationLogic: 'COUNT(DISTINCT login_date) WHERE date >= NOW() - 7 days',
        sourceTable: 'user_logins',
        aggregation: 'count',
        windowSize: '7d',
        tags: ['engagement', 'logins'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_ai_chat_count_7d',
        description: 'Number of AI chat interactions in last 7 days',
        dataType: 'integer',
        featureGroup: 'user_ai_usage',
        computationLogic: 'COUNT(ai_chats) WHERE date >= NOW() - 7 days',
        sourceTable: 'ai_interactions',
        aggregation: 'count',
        windowSize: '7d',
        tags: ['ai', 'engagement'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_payment_failures_90d',
        description: 'Number of payment failures in last 90 days',
        dataType: 'integer',
        featureGroup: 'user_financial',
        computationLogic: 'COUNT(failed_payments) WHERE date >= NOW() - 90 days',
        sourceTable: 'payments',
        aggregation: 'count',
        windowSize: '90d',
        tags: ['financial', 'churn_risk'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'user_subscription_tenure_days',
        description: 'Days since subscription started',
        dataType: 'integer',
        featureGroup: 'user_financial',
        computationLogic: 'DATEDIFF(NOW(), subscription_start_date)',
        sourceTable: 'subscriptions',
        tags: ['financial', 'tenure'],
        owner: 'ml-team',
        deprecated: false,
      },
      // Coach features
      {
        name: 'coach_avg_rating',
        description: 'Average rating from clients (1-5)',
        dataType: 'float',
        featureGroup: 'coach_performance',
        computationLogic: 'AVG(rating)',
        sourceTable: 'session_ratings',
        aggregation: 'avg',
        tags: ['coach', 'ratings'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'coach_session_count_30d',
        description: 'Number of sessions conducted in last 30 days',
        dataType: 'integer',
        featureGroup: 'coach_performance',
        computationLogic: 'COUNT(sessions) WHERE date >= NOW() - 30 days',
        sourceTable: 'sessions',
        aggregation: 'count',
        windowSize: '30d',
        tags: ['coach', 'sessions'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'coach_client_retention_rate',
        description: 'Percentage of clients retained over 3 months',
        dataType: 'float',
        featureGroup: 'coach_performance',
        computationLogic: 'SUM(retained_clients) / COUNT(total_clients)',
        sourceTable: 'coach_clients',
        aggregation: 'avg',
        tags: ['coach', 'retention'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'coach_avg_response_time_hours',
        description: 'Average response time to client messages in hours',
        dataType: 'float',
        featureGroup: 'coach_performance',
        computationLogic: 'AVG(response_time_hours)',
        sourceTable: 'messages',
        aggregation: 'avg',
        tags: ['coach', 'responsiveness'],
        owner: 'ml-team',
        deprecated: false,
      },
      // Session features
      {
        name: 'session_time_of_day',
        description: 'Hour of the day (0-23) when session occurs',
        dataType: 'integer',
        featureGroup: 'session_context',
        computationLogic: 'HOUR(session_time)',
        tags: ['session', 'timing'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'session_day_of_week',
        description: 'Day of week (0-6, 0=Sunday)',
        dataType: 'integer',
        featureGroup: 'session_context',
        computationLogic: 'DAYOFWEEK(session_date)',
        tags: ['session', 'timing'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'session_is_first',
        description: 'Whether this is the first session for the client',
        dataType: 'boolean',
        featureGroup: 'session_context',
        computationLogic: 'session_number = 1',
        tags: ['session', 'onboarding'],
        owner: 'ml-team',
        deprecated: false,
      },
      // Goal features
      {
        name: 'goal_progress_velocity',
        description: 'Rate of progress per week (0-1)',
        dataType: 'float',
        featureGroup: 'goal_metrics',
        computationLogic: 'progress_delta / weeks_elapsed',
        tags: ['goal', 'progress'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'goal_days_remaining',
        description: 'Days until target completion date',
        dataType: 'integer',
        featureGroup: 'goal_metrics',
        computationLogic: 'DATEDIFF(target_date, NOW())',
        tags: ['goal', 'deadline'],
        owner: 'ml-team',
        deprecated: false,
      },
      {
        name: 'goal_milestone_completion_rate',
        description: 'Percentage of milestones completed',
        dataType: 'float',
        featureGroup: 'goal_metrics',
        computationLogic: 'completed_milestones / total_milestones',
        tags: ['goal', 'milestones'],
        owner: 'ml-team',
        deprecated: false,
      },
    ];

    for (const def of defaultFeatures) {
      const id = this.generateFeatureId(def.name);
      const feature: RegisteredFeature = {
        id,
        ...def,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.features.set(def.name, feature);
    }

    // Create default feature groups
    this.createDefaultFeatureGroups();

    logger.info(`Initialized ${defaultFeatures.length} default features`);
  }

  /**
   * Create default feature groups
   */
  private createDefaultFeatureGroups(): void {
    const groups: FeatureGroupConfig[] = [
      {
        name: 'user_engagement',
        description: 'User engagement and activity features',
        entityType: 'user',
        features: [
          'user_session_count_7d',
          'user_session_count_30d',
          'user_avg_session_duration',
          'user_days_since_last_session',
          'user_login_frequency_7d',
        ],
        ttl: 86400,
        owner: 'ml-team',
        schema: {
          primaryKey: 'user_id',
          eventTimestamp: 'updated_at',
          features: [
            { name: 'user_session_count_7d', type: 'integer', required: true },
            { name: 'user_session_count_30d', type: 'integer', required: true },
            { name: 'user_avg_session_duration', type: 'float', required: false },
            { name: 'user_days_since_last_session', type: 'integer', required: true },
            { name: 'user_login_frequency_7d', type: 'integer', required: true },
          ],
        },
      },
      {
        name: 'user_financial',
        description: 'User financial and subscription features',
        entityType: 'user',
        features: ['user_payment_failures_90d', 'user_subscription_tenure_days'],
        ttl: 86400,
        owner: 'ml-team',
        schema: {
          primaryKey: 'user_id',
          eventTimestamp: 'updated_at',
          features: [
            { name: 'user_payment_failures_90d', type: 'integer', required: true },
            { name: 'user_subscription_tenure_days', type: 'integer', required: true },
          ],
        },
      },
      {
        name: 'user_goals',
        description: 'User goal-related features',
        entityType: 'user',
        features: ['user_goal_completion_rate'],
        ttl: 86400,
        owner: 'ml-team',
        schema: {
          primaryKey: 'user_id',
          eventTimestamp: 'updated_at',
          features: [{ name: 'user_goal_completion_rate', type: 'float', required: true }],
        },
      },
      {
        name: 'coach_performance',
        description: 'Coach performance and metrics',
        entityType: 'coach',
        features: [
          'coach_avg_rating',
          'coach_session_count_30d',
          'coach_client_retention_rate',
          'coach_avg_response_time_hours',
        ],
        ttl: 3600,
        owner: 'ml-team',
        schema: {
          primaryKey: 'coach_id',
          eventTimestamp: 'updated_at',
          features: [
            { name: 'coach_avg_rating', type: 'float', required: true },
            { name: 'coach_session_count_30d', type: 'integer', required: true },
            { name: 'coach_client_retention_rate', type: 'float', required: false },
            { name: 'coach_avg_response_time_hours', type: 'float', required: false },
          ],
        },
      },
      {
        name: 'goal_metrics',
        description: 'Goal progress and tracking features',
        entityType: 'goal',
        features: ['goal_progress_velocity', 'goal_days_remaining', 'goal_milestone_completion_rate'],
        ttl: 3600,
        owner: 'ml-team',
        schema: {
          primaryKey: 'goal_id',
          eventTimestamp: 'updated_at',
          features: [
            { name: 'goal_progress_velocity', type: 'float', required: true },
            { name: 'goal_days_remaining', type: 'integer', required: true },
            { name: 'goal_milestone_completion_rate', type: 'float', required: false },
          ],
        },
      },
    ];

    for (const config of groups) {
      const id = this.generateGroupId(config.name);
      const group: RegisteredFeatureGroup = {
        id,
        config,
        featureCount: config.features.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      };
      this.featureGroups.set(config.name, group);
    }
  }

  // ==================== Feature Registration ====================

  /**
   * Register a new feature
   */
  public registerFeature(definition: FeatureDefinition): string {
    if (this.features.has(definition.name)) {
      throw new Error(`Feature ${definition.name} already exists`);
    }

    const id = this.generateFeatureId(definition.name);
    const feature: RegisteredFeature = {
      id,
      ...definition,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.features.set(definition.name, feature);
    this.emit('feature:registered', { featureId: id, name: definition.name });
    logger.info(`Registered feature: ${definition.name}`);

    return id;
  }

  /**
   * Get feature definition
   */
  public getFeature(name: string): RegisteredFeature | null {
    return this.features.get(name) || null;
  }

  /**
   * List all features
   */
  public listFeatures(options?: {
    featureGroup?: string;
    tags?: string[];
    deprecated?: boolean;
  }): RegisteredFeature[] {
    let features = Array.from(this.features.values());

    if (options?.featureGroup) {
      features = features.filter((f) => f.featureGroup === options.featureGroup);
    }

    if (options?.tags && options.tags.length > 0) {
      features = features.filter((f) => options.tags!.some((tag) => f.tags.includes(tag)));
    }

    if (options?.deprecated !== undefined) {
      features = features.filter((f) => f.deprecated === options.deprecated);
    }

    return features;
  }

  /**
   * Update feature definition
   */
  public updateFeature(name: string, updates: Partial<FeatureDefinition>): void {
    const feature = this.features.get(name);
    if (!feature) {
      throw new Error(`Feature ${name} not found`);
    }

    Object.assign(feature, updates);
    feature.version++;
    feature.updatedAt = new Date();

    this.emit('feature:updated', { featureId: feature.id, updates });
  }

  /**
   * Deprecate a feature
   */
  public deprecateFeature(name: string): void {
    const feature = this.features.get(name);
    if (!feature) {
      throw new Error(`Feature ${name} not found`);
    }

    feature.deprecated = true;
    feature.updatedAt = new Date();

    this.emit('feature:deprecated', { featureId: feature.id });
    logger.warn(`Feature ${name} deprecated`);
  }

  // ==================== Feature Retrieval ====================

  /**
   * Get current feature values for an entity
   */
  public async getFeatures(entityId: string, featureNames: string[]): Promise<FeatureVector> {
    const startTime = Date.now();
    const features: Record<string, FeatureValue> = {};

    const entityData = this.onlineData.get(entityId);

    for (const name of featureNames) {
      const featureDef = this.features.get(name);
      if (!featureDef) {
        logger.warn(`Feature ${name} not found in registry`);
        continue;
      }

      if (entityData?.has(name)) {
        features[name] = entityData.get(name)!;
      } else {
        // Return null value with fill value if configured
        features[name] = {
          value: featureDef.fillValue ?? null,
          timestamp: new Date(),
          version: featureDef.version,
          isNull: true,
        };
      }
    }

    return {
      entityId,
      timestamp: new Date(),
      features,
      metadata: {
        source: 'online_store',
        version: 1,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Get historical feature values at a specific point in time
   */
  public async getHistoricalFeatures(
    entityId: string,
    featureNames: string[],
    timestamp: Date
  ): Promise<FeatureVector> {
    const startTime = Date.now();
    const features: Record<string, FeatureValue> = {};

    const entityHistory = this.offlineData.get(entityId) || [];

    // Find the closest vector before or at the timestamp
    const relevantVectors = entityHistory
      .filter((v) => v.timestamp <= timestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    for (const name of featureNames) {
      const featureDef = this.features.get(name);
      if (!featureDef) continue;

      // Find the most recent value for this feature
      let found = false;
      for (const vector of relevantVectors) {
        if (vector.features[name]) {
          features[name] = vector.features[name];
          found = true;
          break;
        }
      }

      if (!found) {
        features[name] = {
          value: featureDef.fillValue ?? null,
          timestamp,
          version: featureDef.version,
          isNull: true,
        };
      }
    }

    return {
      entityId,
      timestamp,
      features,
      metadata: {
        source: 'offline_store',
        version: 1,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Get point-in-time features (prevents data leakage)
   */
  public async getPointInTimeFeatures(
    entityId: string,
    timestamp: Date
  ): Promise<FeatureVector> {
    // This ensures we only use data that was available at the given timestamp
    // Critical for training to prevent future data leakage
    const allFeatureNames = Array.from(this.features.keys());
    return this.getHistoricalFeatures(entityId, allFeatureNames, timestamp);
  }

  /**
   * Get feature values for multiple entities
   */
  public async getBatchFeatures(
    entityIds: string[],
    featureNames: string[]
  ): Promise<FeatureVector[]> {
    const results: FeatureVector[] = [];

    for (const entityId of entityIds) {
      const vector = await this.getFeatures(entityId, featureNames);
      results.push(vector);
    }

    return results;
  }

  // ==================== Feature Groups ====================

  /**
   * Create a feature group
   */
  public createFeatureGroup(config: FeatureGroupConfig): string {
    if (this.featureGroups.has(config.name)) {
      throw new Error(`Feature group ${config.name} already exists`);
    }

    // Validate all features exist
    for (const featureName of config.features) {
      if (!this.features.has(featureName)) {
        throw new Error(`Feature ${featureName} not found`);
      }
    }

    const id = this.generateGroupId(config.name);
    const group: RegisteredFeatureGroup = {
      id,
      config,
      featureCount: config.features.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    this.featureGroups.set(config.name, group);
    this.emit('group:created', { groupId: id, name: config.name });
    logger.info(`Created feature group: ${config.name}`);

    return id;
  }

  /**
   * Get feature group
   */
  public getFeatureGroup(name: string): RegisteredFeatureGroup | null {
    return this.featureGroups.get(name) || null;
  }

  /**
   * List all feature groups
   */
  public listFeatureGroups(): RegisteredFeatureGroup[] {
    return Array.from(this.featureGroups.values());
  }

  /**
   * Get all features in a group
   */
  public getGroupFeatures(groupName: string): RegisteredFeature[] {
    const group = this.featureGroups.get(groupName);
    if (!group) return [];

    return group.config.features
      .map((name) => this.features.get(name))
      .filter((f): f is RegisteredFeature => f !== undefined);
  }

  // ==================== Materialization ====================

  /**
   * Materialize features for a group
   */
  public async materializeFeatures(
    groupName: string,
    startDate: Date,
    endDate: Date
  ): Promise<MaterializationJob> {
    const group = this.featureGroups.get(groupName);
    if (!group) {
      throw new Error(`Feature group ${groupName} not found`);
    }

    const jobId = this.generateJobId();
    const job: MaterializationJob = {
      id: jobId,
      groupId: group.id,
      startDate,
      endDate,
      status: 'pending',
      progress: 0,
      rowsProcessed: 0,
    };

    this.materializationJobs.set(jobId, job);
    group.status = 'materializing';

    // Start async materialization
    this.runMaterialization(job, group).catch((error) => {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      group.status = 'error';
    });

    this.emit('materialization:started', { jobId, groupId: group.id });
    return job;
  }

  /**
   * Run materialization job
   */
  private async runMaterialization(
    job: MaterializationJob,
    group: RegisteredFeatureGroup
  ): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date();

    try {
      // Simulate materialization process
      const totalRows = 1000; // Placeholder
      for (let i = 0; i < totalRows; i += 100) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        job.rowsProcessed = Math.min(i + 100, totalRows);
        job.progress = (job.rowsProcessed / totalRows) * 100;
      }

      job.status = 'completed';
      job.completedAt = new Date();
      group.status = 'active';
      group.lastMaterialized = new Date();

      this.emit('materialization:completed', { jobId: job.id, rowsProcessed: job.rowsProcessed });
      logger.info(`Materialization completed for group ${group.config.name}: ${job.rowsProcessed} rows`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      group.status = 'error';
      throw error;
    }
  }

  /**
   * Get materialization job status
   */
  public getMaterializationJob(jobId: string): MaterializationJob | null {
    return this.materializationJobs.get(jobId) || null;
  }

  /**
   * List materialization jobs
   */
  public listMaterializationJobs(groupId?: string): MaterializationJob[] {
    const jobs = Array.from(this.materializationJobs.values());
    if (groupId) {
      return jobs.filter((j) => j.groupId === groupId);
    }
    return jobs;
  }

  // ==================== Online Store Operations ====================

  /**
   * Set feature values in online store
   */
  public async setFeatureValues(
    entityId: string,
    features: Record<string, unknown>,
    timestamp: Date = new Date()
  ): Promise<void> {
    let entityData = this.onlineData.get(entityId);
    if (!entityData) {
      entityData = new Map();
      this.onlineData.set(entityId, entityData);
    }

    for (const [name, value] of Object.entries(features)) {
      const featureDef = this.features.get(name);
      if (!featureDef) {
        logger.warn(`Feature ${name} not found, skipping`);
        continue;
      }

      const featureValue: FeatureValue = {
        value,
        timestamp,
        version: featureDef.version,
        isNull: value === null || value === undefined,
      };

      entityData.set(name, featureValue);
    }

    // Also store in offline for history
    this.appendToOfflineStore(entityId, features, timestamp);

    this.emit('features:updated', { entityId, featureCount: Object.keys(features).length });
  }

  /**
   * Append to offline store
   */
  private appendToOfflineStore(
    entityId: string,
    features: Record<string, unknown>,
    timestamp: Date
  ): void {
    const history = this.offlineData.get(entityId) || [];

    const featureValues: Record<string, FeatureValue> = {};
    for (const [name, value] of Object.entries(features)) {
      const featureDef = this.features.get(name);
      if (featureDef) {
        featureValues[name] = {
          value,
          timestamp,
          version: featureDef.version,
          isNull: value === null || value === undefined,
        };
      }
    }

    history.push({
      entityId,
      timestamp,
      features: featureValues,
    });

    // Keep last 1000 entries per entity
    if (history.length > 1000) {
      history.shift();
    }

    this.offlineData.set(entityId, history);
  }

  /**
   * Delete entity data from online store
   */
  public async deleteEntityData(entityId: string): Promise<void> {
    this.onlineData.delete(entityId);
    this.emit('entity:deleted', { entityId });
  }

  // ==================== Feature Statistics ====================

  /**
   * Compute and update feature statistics
   */
  public computeStatistics(featureName: string): FeatureStatistics | null {
    const feature = this.features.get(featureName);
    if (!feature) return null;

    const values: number[] = [];
    const nullCount = 0;

    // Collect values from all entities
    for (const [, entityData] of this.onlineData) {
      const featureValue = entityData.get(featureName);
      if (featureValue && !featureValue.isNull && typeof featureValue.value === 'number') {
        values.push(featureValue.value);
      }
    }

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);

    // Create histogram
    const bucketCount = 10;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bucketWidth = (max - min) / bucketCount || 1;
    const histogram: HistogramBucket[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bucketMin = min + i * bucketWidth;
      const bucketMax = min + (i + 1) * bucketWidth;
      const count = values.filter((v) => v >= bucketMin && (i === bucketCount - 1 ? v <= bucketMax : v < bucketMax)).length;
      histogram.push({ min: bucketMin, max: bucketMax, count });
    }

    const stats: FeatureStatistics = {
      count: values.length,
      nullCount,
      uniqueCount: new Set(values).size,
      mean,
      std: Math.sqrt(variance),
      min,
      max,
      histogram,
      lastUpdated: new Date(),
    };

    feature.statistics = stats;
    return stats;
  }

  /**
   * Get feature statistics
   */
  public getStatistics(featureName: string): FeatureStatistics | null {
    const feature = this.features.get(featureName);
    return feature?.statistics || null;
  }

  // ==================== Helper Methods ====================

  private generateFeatureId(name: string): string {
    return `feat_${name}_${Date.now().toString(36)}`;
  }

  private generateGroupId(name: string): string {
    return `grp_${name}_${Date.now().toString(36)}`;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get store statistics
   */
  public getStats(): FeatureStoreStats {
    let totalFeatureValues = 0;
    for (const entityData of this.onlineData.values()) {
      totalFeatureValues += entityData.size;
    }

    return {
      totalFeatures: this.features.size,
      totalFeatureGroups: this.featureGroups.size,
      entitiesInOnlineStore: this.onlineData.size,
      totalFeatureValues,
      deprecatedFeatures: Array.from(this.features.values()).filter((f) => f.deprecated).length,
      activeMaterializationJobs: Array.from(this.materializationJobs.values()).filter(
        (j) => j.status === 'running'
      ).length,
    };
  }
}

// ==================== Additional Types ====================

export interface FeatureStoreStats {
  totalFeatures: number;
  totalFeatureGroups: number;
  entitiesInOnlineStore: number;
  totalFeatureValues: number;
  deprecatedFeatures: number;
  activeMaterializationJobs: number;
}

// Export singleton instance
export const featureStore = new FeatureStore();

// Export factory function
export const createFeatureStore = (): FeatureStore => {
  return new FeatureStore();
};
