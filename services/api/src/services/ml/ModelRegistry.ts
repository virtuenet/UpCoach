/**
 * Model Registry
 * Version control and metadata storage for ML models
 * Provides centralized model management with lineage tracking
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

export interface ModelMetadata {
  name: string;
  description: string;
  modelType: ModelType;
  framework: MLFramework;
  owner: string;
  tags: string[];
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
  customMetadata?: Record<string, unknown>;
}

export type ModelType =
  | 'classification'
  | 'regression'
  | 'clustering'
  | 'recommendation'
  | 'time_series'
  | 'nlp'
  | 'anomaly_detection';

export type MLFramework =
  | 'tensorflow'
  | 'pytorch'
  | 'scikit-learn'
  | 'xgboost'
  | 'lightgbm'
  | 'custom'
  | 'rule_based';

export type ModelStage = 'development' | 'staging' | 'production' | 'archived';

export interface SchemaDefinition {
  fields: FieldDefinition[];
  version: string;
}

export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  min?: number;
  max?: number;
  enum?: (string | number)[];
  pattern?: string;
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  stage: ModelStage;
  artifactPath: string;
  metrics: ModelMetrics;
  parameters: Record<string, unknown>;
  trainingDataHash: string;
  parentVersionId?: string;
  createdAt: Date;
  createdBy: string;
  description?: string;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  latencyP50Ms?: number;
  latencyP99Ms?: number;
  throughputPerSecond?: number;
  customMetrics?: Record<string, number>;
}

export interface ModelArtifact {
  id: string;
  modelId: string;
  versionId: string;
  type: ArtifactType;
  path: string;
  size: number;
  checksum: string;
  createdAt: Date;
}

export type ArtifactType =
  | 'model_weights'
  | 'model_config'
  | 'preprocessor'
  | 'postprocessor'
  | 'feature_transformer'
  | 'training_data_sample'
  | 'evaluation_report';

export interface ModelLineage {
  modelId: string;
  trainingDataSources: DataSource[];
  parentModels: ParentModelRef[];
  featureDefinitions: string[];
  trainingConfig: TrainingConfig;
  evaluationDatasets: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'file' | 'api' | 'stream';
  location: string;
  schema?: string;
  samplingStrategy?: string;
  dateRange?: { start: Date; end: Date };
}

export interface ParentModelRef {
  modelId: string;
  versionId: string;
  relationship: 'fine_tuned' | 'ensemble_member' | 'distilled_from';
}

export interface TrainingConfig {
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  trainingDuration?: number;
  computeResources?: string;
  randomSeed?: number;
}

export interface RegisteredModel {
  id: string;
  metadata: ModelMetadata;
  currentVersion?: string;
  latestVersions: Record<ModelStage, string | null>;
  status: 'active' | 'deprecated' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelSearchCriteria {
  name?: string;
  modelType?: ModelType;
  framework?: MLFramework;
  tags?: string[];
  owner?: string;
  stage?: ModelStage;
  status?: 'active' | 'deprecated' | 'archived';
}

// ==================== Model Registry ====================

export class ModelRegistry extends EventEmitter {
  private models: Map<string, RegisteredModel> = new Map();
  private versions: Map<string, ModelVersion[]> = new Map();
  private artifacts: Map<string, ModelArtifact[]> = new Map();
  private lineage: Map<string, ModelLineage> = new Map();

  constructor() {
    super();
    this.initializeDefaultModels();
  }

  /**
   * Initialize with default coaching-specific models
   */
  private initializeDefaultModels(): void {
    const defaultModels: Array<{ id: string; metadata: ModelMetadata }> = [
      {
        id: 'churn-predictor',
        metadata: {
          name: 'Client Churn Predictor',
          description: 'Predicts probability of client subscription cancellation',
          modelType: 'classification',
          framework: 'custom',
          owner: 'ml-team',
          tags: ['churn', 'retention', 'client'],
          inputSchema: {
            version: '1.0',
            fields: [
              { name: 'userId', type: 'string', required: true },
              { name: 'sessionCount30d', type: 'number', required: true },
              { name: 'engagementScore', type: 'number', required: true },
              { name: 'daysSinceLastSession', type: 'number', required: true },
              { name: 'paymentFailures', type: 'number', required: false },
            ],
          },
          outputSchema: {
            version: '1.0',
            fields: [
              { name: 'churnProbability', type: 'number', required: true },
              { name: 'riskLevel', type: 'string', required: true },
              { name: 'topRiskFactors', type: 'array', required: true },
            ],
          },
        },
      },
      {
        id: 'coach-performance',
        metadata: {
          name: 'Coach Performance Predictor',
          description: 'Predicts coach performance for client matching',
          modelType: 'regression',
          framework: 'custom',
          owner: 'ml-team',
          tags: ['coach', 'matching', 'performance'],
          inputSchema: {
            version: '1.0',
            fields: [
              { name: 'coachId', type: 'string', required: true },
              { name: 'clientProfile', type: 'object', required: true },
              { name: 'specializations', type: 'array', required: true },
            ],
          },
          outputSchema: {
            version: '1.0',
            fields: [
              { name: 'compatibilityScore', type: 'number', required: true },
              { name: 'predictedSatisfaction', type: 'number', required: true },
            ],
          },
        },
      },
      {
        id: 'session-outcome',
        metadata: {
          name: 'Session Outcome Predictor',
          description: 'Predicts coaching session success probability',
          modelType: 'classification',
          framework: 'custom',
          owner: 'ml-team',
          tags: ['session', 'outcome', 'coaching'],
          inputSchema: {
            version: '1.0',
            fields: [
              { name: 'coachId', type: 'string', required: true },
              { name: 'clientId', type: 'string', required: true },
              { name: 'sessionTime', type: 'string', required: true },
              { name: 'sessionType', type: 'string', required: true },
            ],
          },
          outputSchema: {
            version: '1.0',
            fields: [
              { name: 'successProbability', type: 'number', required: true },
              { name: 'recommendedActions', type: 'array', required: true },
            ],
          },
        },
      },
      {
        id: 'goal-completion',
        metadata: {
          name: 'Goal Completion Forecaster',
          description: 'Forecasts goal completion timeline and probability',
          modelType: 'time_series',
          framework: 'custom',
          owner: 'ml-team',
          tags: ['goal', 'forecasting', 'completion'],
          inputSchema: {
            version: '1.0',
            fields: [
              { name: 'goalId', type: 'string', required: true },
              { name: 'progressHistory', type: 'array', required: true },
              { name: 'targetDate', type: 'string', required: false },
            ],
          },
          outputSchema: {
            version: '1.0',
            fields: [
              { name: 'completionProbability', type: 'number', required: true },
              { name: 'estimatedCompletionDate', type: 'string', required: true },
              { name: 'confidenceInterval', type: 'object', required: true },
            ],
          },
        },
      },
      {
        id: 'engagement-optimizer',
        metadata: {
          name: 'Engagement Optimizer',
          description: 'Optimizes timing and content for user engagement',
          modelType: 'recommendation',
          framework: 'custom',
          owner: 'ml-team',
          tags: ['engagement', 'notification', 'optimization'],
          inputSchema: {
            version: '1.0',
            fields: [
              { name: 'userId', type: 'string', required: true },
              { name: 'activityPattern', type: 'object', required: true },
              { name: 'notificationHistory', type: 'array', required: false },
            ],
          },
          outputSchema: {
            version: '1.0',
            fields: [
              { name: 'optimalTimes', type: 'array', required: true },
              { name: 'recommendedContent', type: 'array', required: true },
              { name: 'expectedEngagement', type: 'number', required: true },
            ],
          },
        },
      },
    ];

    for (const { id, metadata } of defaultModels) {
      const model: RegisteredModel = {
        id,
        metadata,
        latestVersions: {
          development: null,
          staging: null,
          production: null,
          archived: null,
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.models.set(id, model);
      this.versions.set(id, []);
      this.artifacts.set(id, []);
    }

    logger.info(`Initialized ${defaultModels.length} default models in registry`);
  }

  // ==================== Model Registration ====================

  /**
   * Register a new model in the registry
   */
  public register(metadata: ModelMetadata): string {
    const id = this.generateModelId(metadata.name);

    if (this.models.has(id)) {
      throw new Error(`Model with ID ${id} already exists`);
    }

    const model: RegisteredModel = {
      id,
      metadata,
      latestVersions: {
        development: null,
        staging: null,
        production: null,
        archived: null,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.models.set(id, model);
    this.versions.set(id, []);
    this.artifacts.set(id, []);

    this.emit('model:registered', { modelId: id, metadata });
    logger.info(`Registered model: ${metadata.name} (${id})`);

    return id;
  }

  /**
   * Get model by ID
   */
  public getModel(modelId: string): RegisteredModel | null {
    return this.models.get(modelId) || null;
  }

  /**
   * Update model metadata
   */
  public updateModel(modelId: string, updates: Partial<ModelMetadata>): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.metadata = { ...model.metadata, ...updates };
    model.updatedAt = new Date();

    this.emit('model:updated', { modelId, updates });
  }

  /**
   * Search models by criteria
   */
  public searchModels(criteria: ModelSearchCriteria): RegisteredModel[] {
    const results: RegisteredModel[] = [];

    for (const model of this.models.values()) {
      if (this.matchesCriteria(model, criteria)) {
        results.push(model);
      }
    }

    return results;
  }

  /**
   * List all models
   */
  public listModels(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  // ==================== Version Management ====================

  /**
   * Create a new version for a model
   */
  public createVersion(
    modelId: string,
    versionData: Omit<ModelVersion, 'id' | 'modelId' | 'createdAt'>
  ): string {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const versionId = this.generateVersionId();
    const version: ModelVersion = {
      id: versionId,
      modelId,
      ...versionData,
      createdAt: new Date(),
    };

    const versions = this.versions.get(modelId) || [];
    versions.push(version);
    this.versions.set(modelId, versions);

    // Update latest version for stage
    model.latestVersions[version.stage] = versionId;
    if (version.stage === 'production') {
      model.currentVersion = versionId;
    }
    model.updatedAt = new Date();

    this.emit('version:created', { modelId, versionId, version });
    logger.info(`Created version ${version.version} for model ${modelId}`);

    return versionId;
  }

  /**
   * Get a specific version
   */
  public getVersion(modelId: string, versionIdOrNumber: string): ModelVersion | null {
    const versions = this.versions.get(modelId);
    if (!versions) return null;

    return (
      versions.find((v) => v.id === versionIdOrNumber || v.version === versionIdOrNumber) || null
    );
  }

  /**
   * List all versions for a model
   */
  public listVersions(modelId: string): ModelVersion[] {
    return this.versions.get(modelId) || [];
  }

  /**
   * Get latest version for a specific stage
   */
  public getLatestVersion(modelId: string, stage: ModelStage): ModelVersion | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const versionId = model.latestVersions[stage];
    if (!versionId) return null;

    return this.getVersion(modelId, versionId);
  }

  /**
   * Transition version to a new stage
   */
  public transitionStage(modelId: string, versionId: string, newStage: ModelStage): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const versions = this.versions.get(modelId);
    const version = versions?.find((v) => v.id === versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const oldStage = version.stage;
    version.stage = newStage;
    model.latestVersions[newStage] = versionId;

    if (newStage === 'production') {
      model.currentVersion = versionId;
    }

    model.updatedAt = new Date();

    this.emit('version:stage_changed', { modelId, versionId, oldStage, newStage });
    logger.info(`Transitioned version ${versionId} from ${oldStage} to ${newStage}`);
  }

  /**
   * Compare two versions
   */
  public compareVersions(
    modelId: string,
    versionId1: string,
    versionId2: string
  ): VersionComparison | null {
    const v1 = this.getVersion(modelId, versionId1);
    const v2 = this.getVersion(modelId, versionId2);

    if (!v1 || !v2) return null;

    const metricsDiff: Record<string, { v1: number; v2: number; diff: number }> = {};

    const allMetrics = new Set([
      ...Object.keys(v1.metrics),
      ...Object.keys(v2.metrics),
    ]);

    for (const metric of allMetrics) {
      const val1 = (v1.metrics as Record<string, number>)[metric] || 0;
      const val2 = (v2.metrics as Record<string, number>)[metric] || 0;
      metricsDiff[metric] = {
        v1: val1,
        v2: val2,
        diff: val2 - val1,
      };
    }

    return {
      version1: v1,
      version2: v2,
      metricsDiff,
      parametersDiff: this.diffObjects(v1.parameters, v2.parameters),
      recommendation: this.generateComparisonRecommendation(metricsDiff),
    };
  }

  // ==================== Artifact Management ====================

  /**
   * Store an artifact for a model version
   */
  public storeArtifact(
    modelId: string,
    versionId: string,
    artifactData: Omit<ModelArtifact, 'id' | 'modelId' | 'versionId' | 'createdAt'>
  ): string {
    const version = this.getVersion(modelId, versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found for model ${modelId}`);
    }

    const artifactId = this.generateArtifactId();
    const artifact: ModelArtifact = {
      id: artifactId,
      modelId,
      versionId,
      ...artifactData,
      createdAt: new Date(),
    };

    const artifacts = this.artifacts.get(modelId) || [];
    artifacts.push(artifact);
    this.artifacts.set(modelId, artifacts);

    this.emit('artifact:stored', { modelId, versionId, artifactId });
    logger.info(`Stored artifact ${artifactId} for version ${versionId}`);

    return artifactId;
  }

  /**
   * Load an artifact
   */
  public loadArtifact(modelId: string, artifactId: string): ModelArtifact | null {
    const artifacts = this.artifacts.get(modelId);
    return artifacts?.find((a) => a.id === artifactId) || null;
  }

  /**
   * List artifacts for a version
   */
  public listArtifacts(modelId: string, versionId?: string): ModelArtifact[] {
    const artifacts = this.artifacts.get(modelId) || [];
    if (versionId) {
      return artifacts.filter((a) => a.versionId === versionId);
    }
    return artifacts;
  }

  // ==================== Lineage Tracking ====================

  /**
   * Set lineage for a model
   */
  public setLineage(modelId: string, lineageData: Omit<ModelLineage, 'modelId'>): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const lineage: ModelLineage = {
      modelId,
      ...lineageData,
    };

    this.lineage.set(modelId, lineage);
    this.emit('lineage:updated', { modelId, lineage });
  }

  /**
   * Get lineage for a model
   */
  public getLineage(modelId: string): ModelLineage | null {
    return this.lineage.get(modelId) || null;
  }

  /**
   * Get downstream models (models that depend on this one)
   */
  public getDownstreamModels(modelId: string): string[] {
    const downstream: string[] = [];

    for (const [id, lineage] of this.lineage.entries()) {
      if (lineage.parentModels.some((p) => p.modelId === modelId)) {
        downstream.push(id);
      }
    }

    return downstream;
  }

  // ==================== Deprecation & Archival ====================

  /**
   * Deprecate a model
   */
  public deprecateModel(modelId: string, reason?: string): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.status = 'deprecated';
    model.updatedAt = new Date();

    this.emit('model:deprecated', { modelId, reason });
    logger.warn(`Model ${modelId} deprecated: ${reason || 'No reason provided'}`);
  }

  /**
   * Archive a model
   */
  public archiveModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.status = 'archived';
    model.updatedAt = new Date();

    // Move all versions to archived
    const versions = this.versions.get(modelId) || [];
    for (const version of versions) {
      if (version.stage !== 'archived') {
        version.stage = 'archived';
      }
    }

    this.emit('model:archived', { modelId });
    logger.info(`Model ${modelId} archived`);
  }

  // ==================== Helper Methods ====================

  private generateModelId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateArtifactId(): string {
    return `art_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private matchesCriteria(model: RegisteredModel, criteria: ModelSearchCriteria): boolean {
    if (criteria.name && !model.metadata.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      return false;
    }
    if (criteria.modelType && model.metadata.modelType !== criteria.modelType) {
      return false;
    }
    if (criteria.framework && model.metadata.framework !== criteria.framework) {
      return false;
    }
    if (criteria.owner && model.metadata.owner !== criteria.owner) {
      return false;
    }
    if (criteria.status && model.status !== criteria.status) {
      return false;
    }
    if (criteria.tags && criteria.tags.length > 0) {
      const hasAllTags = criteria.tags.every((tag) => model.metadata.tags.includes(tag));
      if (!hasAllTags) return false;
    }
    return true;
  }

  private diffObjects(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff[key] = { old: obj1[key], new: obj2[key] };
      }
    }

    return diff;
  }

  private generateComparisonRecommendation(
    metricsDiff: Record<string, { v1: number; v2: number; diff: number }>
  ): string {
    const improvements: string[] = [];
    const regressions: string[] = [];

    for (const [metric, { diff }] of Object.entries(metricsDiff)) {
      // Higher is better for most metrics except error metrics
      const isErrorMetric = metric.toLowerCase().includes('error') ||
        metric.toLowerCase().includes('loss') ||
        metric === 'rmse' ||
        metric === 'mae';

      if (isErrorMetric) {
        if (diff < 0) improvements.push(metric);
        else if (diff > 0) regressions.push(metric);
      } else {
        if (diff > 0) improvements.push(metric);
        else if (diff < 0) regressions.push(metric);
      }
    }

    if (regressions.length === 0 && improvements.length > 0) {
      return 'Version 2 shows improvements across all measured metrics. Recommended for promotion.';
    } else if (improvements.length === 0 && regressions.length > 0) {
      return 'Version 2 shows regressions. Consider investigating before promotion.';
    } else if (improvements.length > regressions.length) {
      return `Version 2 shows net improvement (${improvements.length} better, ${regressions.length} worse). Review regressions before promotion.`;
    } else {
      return 'Mixed results. Detailed analysis recommended before promotion decision.';
    }
  }

  /**
   * Get registry statistics
   */
  public getStats(): RegistryStats {
    let totalVersions = 0;
    let productionModels = 0;

    for (const [, versions] of this.versions.entries()) {
      totalVersions += versions.length;
    }

    for (const model of this.models.values()) {
      if (model.currentVersion) productionModels++;
    }

    return {
      totalModels: this.models.size,
      totalVersions,
      productionModels,
      modelsByType: this.countByType(),
      modelsByFramework: this.countByFramework(),
    };
  }

  private countByType(): Record<ModelType, number> {
    const counts: Record<string, number> = {};
    for (const model of this.models.values()) {
      counts[model.metadata.modelType] = (counts[model.metadata.modelType] || 0) + 1;
    }
    return counts as Record<ModelType, number>;
  }

  private countByFramework(): Record<MLFramework, number> {
    const counts: Record<string, number> = {};
    for (const model of this.models.values()) {
      counts[model.metadata.framework] = (counts[model.metadata.framework] || 0) + 1;
    }
    return counts as Record<MLFramework, number>;
  }
}

// ==================== Additional Types ====================

export interface VersionComparison {
  version1: ModelVersion;
  version2: ModelVersion;
  metricsDiff: Record<string, { v1: number; v2: number; diff: number }>;
  parametersDiff: Record<string, { old: unknown; new: unknown }>;
  recommendation: string;
}

export interface RegistryStats {
  totalModels: number;
  totalVersions: number;
  productionModels: number;
  modelsByType: Record<ModelType, number>;
  modelsByFramework: Record<MLFramework, number>;
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

// Export factory function
export const createModelRegistry = (): ModelRegistry => {
  return new ModelRegistry();
};
