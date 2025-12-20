/**
 * Model Manager
 * Handles the complete lifecycle of ML models including deployment,
 * versioning, rollback, and health monitoring
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import {
  ModelRegistry,
  modelRegistry,
  ModelVersion,
  ModelStage,
  RegisteredModel,
} from './ModelRegistry';

// ==================== Type Definitions ====================

export interface ModelConfig {
  modelId: string;
  versionId?: string;
  environment: DeploymentEnvironment;
  replicas?: number;
  resources?: ResourceConfig;
  autoscaling?: AutoscalingConfig;
  healthCheck?: HealthCheckConfig;
}

export type DeploymentEnvironment = 'development' | 'staging' | 'production';

export interface ResourceConfig {
  cpu: string;
  memory: string;
  gpu?: string;
}

export interface AutoscalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization: number;
  targetMemoryUtilization?: number;
  scaleDownDelay?: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  path: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  failureThreshold: number;
  successThreshold: number;
}

export interface DeploymentStatus {
  modelId: string;
  versionId: string;
  environment: DeploymentEnvironment;
  status: DeploymentState;
  replicas: {
    desired: number;
    ready: number;
    available: number;
  };
  conditions: DeploymentCondition[];
  lastUpdated: Date;
  endpoint?: string;
}

export type DeploymentState =
  | 'pending'
  | 'deploying'
  | 'running'
  | 'degraded'
  | 'failed'
  | 'terminating'
  | 'terminated';

export interface DeploymentCondition {
  type: 'Available' | 'Progressing' | 'ReplicaFailure' | 'HealthCheckFailed';
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime: Date;
}

export interface ModelHealth {
  modelId: string;
  versionId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  metrics: HealthMetrics;
  lastCheck: Date;
  issues: HealthIssue[];
}

export interface HealthMetrics {
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  requestsPerSecond: number;
  errorRate: number;
  successRate: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
}

export interface HealthIssue {
  severity: 'warning' | 'error' | 'critical';
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  detectedAt: Date;
}

export interface CanaryDeployment {
  modelId: string;
  baseVersionId: string;
  canaryVersionId: string;
  trafficPercentage: number;
  status: 'active' | 'promoting' | 'rolling_back' | 'completed';
  metrics: CanaryMetrics;
  startedAt: Date;
  completedAt?: Date;
}

export interface CanaryMetrics {
  baseMetrics: HealthMetrics;
  canaryMetrics: HealthMetrics;
  comparison: MetricComparison[];
}

export interface MetricComparison {
  metric: string;
  baseValue: number;
  canaryValue: number;
  difference: number;
  differencePercent: number;
  significant: boolean;
}

export interface ShadowDeployment {
  modelId: string;
  productionVersionId: string;
  shadowVersionId: string;
  status: 'active' | 'stopped';
  predictions: {
    total: number;
    divergent: number;
    divergenceRate: number;
  };
  startedAt: Date;
}

export interface RollbackInfo {
  modelId: string;
  fromVersionId: string;
  toVersionId: string;
  reason: string;
  performedBy: string;
  performedAt: Date;
  success: boolean;
  error?: string;
}

export interface LatencyMetrics {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
  sampleCount: number;
  timeWindow: string;
}

// ==================== Model Manager ====================

export class ModelManager extends EventEmitter {
  private registry: ModelRegistry;
  private deployments: Map<string, DeploymentStatus> = new Map();
  private canaryDeployments: Map<string, CanaryDeployment> = new Map();
  private shadowDeployments: Map<string, ShadowDeployment> = new Map();
  private healthCache: Map<string, ModelHealth> = new Map();
  private rollbackHistory: RollbackInfo[] = [];
  private latencyHistory: Map<string, number[]> = new Map();

  constructor(registry?: ModelRegistry) {
    super();
    this.registry = registry || modelRegistry;
    this.startHealthMonitoring();
  }

  // ==================== Deployment ====================

  /**
   * Deploy a model version to an environment
   */
  public async deployModel(config: ModelConfig): Promise<DeploymentStatus> {
    const { modelId, environment } = config;

    const model = this.registry.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Get version to deploy
    const versionId = config.versionId || this.getVersionForEnvironment(model, environment);
    if (!versionId) {
      throw new Error(`No version available for deployment to ${environment}`);
    }

    const version = this.registry.getVersion(modelId, versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Validate deployment
    this.validateDeployment(model, version, environment);

    const deploymentKey = this.getDeploymentKey(modelId, environment);

    // Create deployment status
    const status: DeploymentStatus = {
      modelId,
      versionId,
      environment,
      status: 'deploying',
      replicas: {
        desired: config.replicas || 1,
        ready: 0,
        available: 0,
      },
      conditions: [
        {
          type: 'Progressing',
          status: 'True',
          reason: 'DeploymentStarted',
          message: 'Deployment is in progress',
          lastTransitionTime: new Date(),
        },
      ],
      lastUpdated: new Date(),
    };

    this.deployments.set(deploymentKey, status);
    this.emit('deployment:started', { modelId, versionId, environment });

    // Simulate deployment process
    await this.simulateDeployment(status, config);

    return this.deployments.get(deploymentKey)!;
  }

  /**
   * Canary deployment - gradually shift traffic to new version
   */
  public async canaryDeploy(
    modelId: string,
    canaryVersionId: string,
    trafficPercentage: number = 10
  ): Promise<CanaryDeployment> {
    const model = this.registry.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.currentVersion) {
      throw new Error(`Model ${modelId} has no production version for canary comparison`);
    }

    const canaryVersion = this.registry.getVersion(modelId, canaryVersionId);
    if (!canaryVersion) {
      throw new Error(`Canary version ${canaryVersionId} not found`);
    }

    const canary: CanaryDeployment = {
      modelId,
      baseVersionId: model.currentVersion,
      canaryVersionId,
      trafficPercentage: Math.min(Math.max(trafficPercentage, 1), 100),
      status: 'active',
      metrics: {
        baseMetrics: this.generateMockHealthMetrics(),
        canaryMetrics: this.generateMockHealthMetrics(),
        comparison: [],
      },
      startedAt: new Date(),
    };

    // Calculate metric comparisons
    canary.metrics.comparison = this.compareHealthMetrics(
      canary.metrics.baseMetrics,
      canary.metrics.canaryMetrics
    );

    this.canaryDeployments.set(modelId, canary);
    this.emit('canary:started', { modelId, canaryVersionId, trafficPercentage });

    logger.info(`Started canary deployment for ${modelId}: ${trafficPercentage}% to ${canaryVersionId}`);

    return canary;
  }

  /**
   * Update canary traffic percentage
   */
  public async updateCanaryTraffic(modelId: string, newPercentage: number): Promise<CanaryDeployment> {
    const canary = this.canaryDeployments.get(modelId);
    if (!canary) {
      throw new Error(`No active canary deployment for model ${modelId}`);
    }

    const oldPercentage = canary.trafficPercentage;
    canary.trafficPercentage = Math.min(Math.max(newPercentage, 1), 100);

    this.emit('canary:traffic_updated', { modelId, oldPercentage, newPercentage });
    logger.info(`Updated canary traffic for ${modelId}: ${oldPercentage}% -> ${newPercentage}%`);

    return canary;
  }

  /**
   * Promote canary to full production
   */
  public async promoteCanary(modelId: string): Promise<void> {
    const canary = this.canaryDeployments.get(modelId);
    if (!canary) {
      throw new Error(`No active canary deployment for model ${modelId}`);
    }

    canary.status = 'promoting';

    // Promote version in registry
    this.registry.transitionStage(modelId, canary.canaryVersionId, 'production');

    canary.status = 'completed';
    canary.completedAt = new Date();

    this.emit('canary:promoted', { modelId, versionId: canary.canaryVersionId });
    logger.info(`Promoted canary version ${canary.canaryVersionId} to production for ${modelId}`);
  }

  /**
   * Rollback canary deployment
   */
  public async rollbackCanary(modelId: string, reason: string): Promise<void> {
    const canary = this.canaryDeployments.get(modelId);
    if (!canary) {
      throw new Error(`No active canary deployment for model ${modelId}`);
    }

    canary.status = 'rolling_back';

    // Remove canary traffic
    canary.trafficPercentage = 0;
    canary.status = 'completed';
    canary.completedAt = new Date();

    this.emit('canary:rolled_back', { modelId, reason });
    logger.warn(`Rolled back canary deployment for ${modelId}: ${reason}`);
  }

  /**
   * Shadow deployment - run new version in parallel without affecting users
   */
  public async shadowDeploy(modelId: string, shadowVersionId: string): Promise<ShadowDeployment> {
    const model = this.registry.getModel(modelId);
    if (!model || !model.currentVersion) {
      throw new Error(`Model ${modelId} not found or has no production version`);
    }

    const shadow: ShadowDeployment = {
      modelId,
      productionVersionId: model.currentVersion,
      shadowVersionId,
      status: 'active',
      predictions: {
        total: 0,
        divergent: 0,
        divergenceRate: 0,
      },
      startedAt: new Date(),
    };

    this.shadowDeployments.set(modelId, shadow);
    this.emit('shadow:started', { modelId, shadowVersionId });

    logger.info(`Started shadow deployment for ${modelId}: ${shadowVersionId}`);

    return shadow;
  }

  /**
   * Record shadow prediction result
   */
  public recordShadowPrediction(
    modelId: string,
    productionResult: unknown,
    shadowResult: unknown
  ): void {
    const shadow = this.shadowDeployments.get(modelId);
    if (!shadow || shadow.status !== 'active') return;

    shadow.predictions.total++;

    // Compare predictions
    const isDivergent = JSON.stringify(productionResult) !== JSON.stringify(shadowResult);
    if (isDivergent) {
      shadow.predictions.divergent++;
    }

    shadow.predictions.divergenceRate =
      shadow.predictions.divergent / shadow.predictions.total;
  }

  /**
   * Stop shadow deployment
   */
  public stopShadowDeployment(modelId: string): ShadowDeployment | null {
    const shadow = this.shadowDeployments.get(modelId);
    if (!shadow) return null;

    shadow.status = 'stopped';
    this.emit('shadow:stopped', { modelId, stats: shadow.predictions });

    return shadow;
  }

  // ==================== Rollback ====================

  /**
   * Rollback to a previous version
   */
  public async rollbackVersion(
    modelId: string,
    targetVersionId: string,
    reason: string,
    performedBy: string
  ): Promise<RollbackInfo> {
    const model = this.registry.getModel(modelId);
    if (!model || !model.currentVersion) {
      throw new Error(`Model ${modelId} not found or has no current version`);
    }

    const targetVersion = this.registry.getVersion(modelId, targetVersionId);
    if (!targetVersion) {
      throw new Error(`Target version ${targetVersionId} not found`);
    }

    const rollback: RollbackInfo = {
      modelId,
      fromVersionId: model.currentVersion,
      toVersionId: targetVersionId,
      reason,
      performedBy,
      performedAt: new Date(),
      success: false,
    };

    try {
      // Transition target version to production
      this.registry.transitionStage(modelId, targetVersionId, 'production');

      rollback.success = true;
      this.rollbackHistory.push(rollback);

      this.emit('rollback:completed', rollback);
      logger.info(`Rolled back ${modelId} from ${rollback.fromVersionId} to ${targetVersionId}`);

      // Update deployment status
      const deploymentKey = this.getDeploymentKey(modelId, 'production');
      const deployment = this.deployments.get(deploymentKey);
      if (deployment) {
        deployment.versionId = targetVersionId;
        deployment.lastUpdated = new Date();
      }
    } catch (error) {
      rollback.error = error instanceof Error ? error.message : 'Unknown error';
      this.rollbackHistory.push(rollback);
      throw error;
    }

    return rollback;
  }

  /**
   * Get rollback history for a model
   */
  public getRollbackHistory(modelId: string): RollbackInfo[] {
    return this.rollbackHistory.filter((r) => r.modelId === modelId);
  }

  // ==================== Health Monitoring ====================

  /**
   * Get model health status
   */
  public getModelHealth(modelId: string): ModelHealth | null {
    return this.healthCache.get(modelId) || null;
  }

  /**
   * Get prediction latency metrics
   */
  public getPredictionLatency(modelId: string): LatencyMetrics | null {
    const history = this.latencyHistory.get(modelId);
    if (!history || history.length === 0) return null;

    const sorted = [...history].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      mean: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      sampleCount: sorted.length,
      timeWindow: '1h',
    };
  }

  /**
   * Record prediction latency
   */
  public recordLatency(modelId: string, latencyMs: number): void {
    const history = this.latencyHistory.get(modelId) || [];
    history.push(latencyMs);

    // Keep last 10000 samples
    if (history.length > 10000) {
      history.shift();
    }

    this.latencyHistory.set(modelId, history);
  }

  /**
   * Check if model meets SLA
   */
  public checkSLA(modelId: string, sla: SLAConfig): SLAStatus {
    const health = this.healthCache.get(modelId);
    const latency = this.getPredictionLatency(modelId);

    const violations: string[] = [];

    if (health) {
      if (health.metrics.errorRate > sla.maxErrorRate) {
        violations.push(`Error rate ${(health.metrics.errorRate * 100).toFixed(2)}% exceeds ${sla.maxErrorRate * 100}%`);
      }
    }

    if (latency) {
      if (latency.p99 > sla.maxLatencyP99Ms) {
        violations.push(`P99 latency ${latency.p99}ms exceeds ${sla.maxLatencyP99Ms}ms`);
      }
    }

    return {
      modelId,
      meetsSLA: violations.length === 0,
      violations,
      checkedAt: new Date(),
    };
  }

  // ==================== Deployment Status ====================

  /**
   * Get deployment status for a model in an environment
   */
  public getDeploymentStatus(modelId: string, environment: DeploymentEnvironment): DeploymentStatus | null {
    const key = this.getDeploymentKey(modelId, environment);
    return this.deployments.get(key) || null;
  }

  /**
   * List all deployments
   */
  public listDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get all canary deployments
   */
  public listCanaryDeployments(): CanaryDeployment[] {
    return Array.from(this.canaryDeployments.values());
  }

  /**
   * Get all shadow deployments
   */
  public listShadowDeployments(): ShadowDeployment[] {
    return Array.from(this.shadowDeployments.values());
  }

  // ==================== Helper Methods ====================

  private getDeploymentKey(modelId: string, environment: DeploymentEnvironment): string {
    return `${modelId}:${environment}`;
  }

  private getVersionForEnvironment(model: RegisteredModel, environment: DeploymentEnvironment): string | null {
    const stageMap: Record<DeploymentEnvironment, ModelStage> = {
      development: 'development',
      staging: 'staging',
      production: 'production',
    };

    const stage = stageMap[environment];
    return model.latestVersions[stage] || null;
  }

  private validateDeployment(
    model: RegisteredModel,
    version: ModelVersion,
    environment: DeploymentEnvironment
  ): void {
    if (model.status === 'archived') {
      throw new Error(`Cannot deploy archived model ${model.id}`);
    }

    if (environment === 'production') {
      if (version.stage !== 'staging' && version.stage !== 'production') {
        throw new Error(`Version ${version.id} must be in staging before production deployment`);
      }

      // Check for required metrics
      if (!version.metrics.accuracy && !version.metrics.precision) {
        logger.warn(`Version ${version.id} deployed without evaluation metrics`);
      }
    }
  }

  private async simulateDeployment(status: DeploymentStatus, config: ModelConfig): Promise<void> {
    const replicas = config.replicas || 1;

    // Simulate gradual replica availability
    for (let i = 1; i <= replicas; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      status.replicas.ready = i;
      status.replicas.available = i;
    }

    status.status = 'running';
    status.endpoint = `https://ml.upcoach.app/v1/models/${config.modelId}/predict`;
    status.conditions = [
      {
        type: 'Available',
        status: 'True',
        reason: 'MinimumReplicasAvailable',
        message: `Deployment has ${replicas} available replicas`,
        lastTransitionTime: new Date(),
      },
      {
        type: 'Progressing',
        status: 'True',
        reason: 'NewReplicaSetAvailable',
        message: 'Deployment completed successfully',
        lastTransitionTime: new Date(),
      },
    ];
    status.lastUpdated = new Date();

    this.emit('deployment:completed', {
      modelId: config.modelId,
      versionId: status.versionId,
      environment: config.environment,
    });
  }

  private generateMockHealthMetrics(): HealthMetrics {
    return {
      latencyP50Ms: 20 + Math.random() * 30,
      latencyP95Ms: 80 + Math.random() * 40,
      latencyP99Ms: 150 + Math.random() * 100,
      requestsPerSecond: 100 + Math.random() * 200,
      errorRate: Math.random() * 0.02,
      successRate: 0.98 + Math.random() * 0.02,
      memoryUsageMB: 256 + Math.random() * 512,
      cpuUsagePercent: 20 + Math.random() * 40,
    };
  }

  private compareHealthMetrics(base: HealthMetrics, canary: HealthMetrics): MetricComparison[] {
    const comparisons: MetricComparison[] = [];

    const metrics: (keyof HealthMetrics)[] = [
      'latencyP50Ms',
      'latencyP95Ms',
      'latencyP99Ms',
      'errorRate',
      'successRate',
    ];

    for (const metric of metrics) {
      const baseValue = base[metric];
      const canaryValue = canary[metric];
      const difference = canaryValue - baseValue;
      const differencePercent = baseValue !== 0 ? (difference / baseValue) * 100 : 0;

      comparisons.push({
        metric,
        baseValue,
        canaryValue,
        difference,
        differencePercent,
        significant: Math.abs(differencePercent) > 5,
      });
    }

    return comparisons;
  }

  private startHealthMonitoring(): void {
    // Update health cache periodically
    setInterval(() => {
      for (const [key, deployment] of this.deployments.entries()) {
        if (deployment.status === 'running') {
          const health = this.generateHealth(deployment);
          this.healthCache.set(deployment.modelId, health);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private generateHealth(deployment: DeploymentStatus): ModelHealth {
    const metrics = this.generateMockHealthMetrics();
    const issues: HealthIssue[] = [];

    // Check for issues
    if (metrics.errorRate > 0.01) {
      issues.push({
        severity: metrics.errorRate > 0.05 ? 'critical' : 'warning',
        message: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%`,
        metric: 'errorRate',
        threshold: 0.01,
        currentValue: metrics.errorRate,
        detectedAt: new Date(),
      });
    }

    if (metrics.latencyP99Ms > 200) {
      issues.push({
        severity: metrics.latencyP99Ms > 500 ? 'error' : 'warning',
        message: `P99 latency is ${metrics.latencyP99Ms.toFixed(0)}ms`,
        metric: 'latencyP99Ms',
        threshold: 200,
        currentValue: metrics.latencyP99Ms,
        detectedAt: new Date(),
      });
    }

    let status: ModelHealth['status'] = 'healthy';
    if (issues.some((i) => i.severity === 'critical')) {
      status = 'unhealthy';
    } else if (issues.some((i) => i.severity === 'error')) {
      status = 'degraded';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    return {
      modelId: deployment.modelId,
      versionId: deployment.versionId,
      status,
      metrics,
      lastCheck: new Date(),
      issues,
    };
  }

  /**
   * Get manager statistics
   */
  public getStats(): ManagerStats {
    let runningDeployments = 0;
    let activeCanaries = 0;
    let activeShadows = 0;

    for (const d of this.deployments.values()) {
      if (d.status === 'running') runningDeployments++;
    }

    for (const c of this.canaryDeployments.values()) {
      if (c.status === 'active') activeCanaries++;
    }

    for (const s of this.shadowDeployments.values()) {
      if (s.status === 'active') activeShadows++;
    }

    return {
      totalDeployments: this.deployments.size,
      runningDeployments,
      activeCanaries,
      activeShadows,
      rollbacksLast24h: this.rollbackHistory.filter(
        (r) => r.performedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
    };
  }
}

// ==================== Additional Types ====================

export interface SLAConfig {
  maxErrorRate: number;
  maxLatencyP99Ms: number;
  minAvailability: number;
}

export interface SLAStatus {
  modelId: string;
  meetsSLA: boolean;
  violations: string[];
  checkedAt: Date;
}

export interface ManagerStats {
  totalDeployments: number;
  runningDeployments: number;
  activeCanaries: number;
  activeShadows: number;
  rollbacksLast24h: number;
}

// Export singleton instance
export const modelManager = new ModelManager();

// Export factory function
export const createModelManager = (registry?: ModelRegistry): ModelManager => {
  return new ModelManager(registry);
};
