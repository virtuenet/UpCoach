/**
 * Canary Deployment Service
 *
 * Implements gradual rollout for new model versions with automatic
 * rollback on performance degradation.
 *
 * Features:
 * - Progressive traffic shifting
 * - Automatic rollback on errors
 * - Performance comparison metrics
 * - Deployment stages (canary -> partial -> full)
 * - Audit logging
 */

import { EventEmitter } from 'events';
import { modelServingService, LoadedModel, PredictionRequest } from './ModelServingService';

// Types
export type DeploymentStage = 'canary' | 'partial' | 'full' | 'rollback' | 'completed';
export type DeploymentStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'rolled_back';

export interface CanaryConfig {
  modelId: string;
  newVersion: string;
  oldVersion: string;
  stages: DeploymentStageConfig[];
  rollbackThreshold: RollbackThreshold;
  autoPromote: boolean;
  maxDuration: number; // minutes
  minSampleSize: number;
  warmupRequests: number;
}

export interface DeploymentStageConfig {
  stage: DeploymentStage;
  trafficPercentage: number;
  durationMinutes: number;
  successCriteria: SuccessCriteria;
}

export interface SuccessCriteria {
  maxErrorRate: number;
  maxLatencyP95Ms: number;
  minSuccessRate: number;
}

export interface RollbackThreshold {
  errorRateIncrease: number; // percentage points
  latencyIncrease: number; // percentage
  consecutiveFailures: number;
}

export interface CanaryDeployment {
  id: string;
  config: CanaryConfig;
  status: DeploymentStatus;
  currentStage: DeploymentStage;
  currentTrafficPercentage: number;
  startedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  metrics: DeploymentMetrics;
  stageHistory: StageTransition[];
  rollbackReason?: string;
}

export interface DeploymentMetrics {
  canaryRequests: number;
  canarySuccesses: number;
  canaryErrors: number;
  canaryLatencyAvg: number;
  canaryLatencyP95: number;
  baselineRequests: number;
  baselineSuccesses: number;
  baselineErrors: number;
  baselineLatencyAvg: number;
  baselineLatencyP95: number;
}

export interface StageTransition {
  fromStage: DeploymentStage | null;
  toStage: DeploymentStage;
  timestamp: Date;
  reason: string;
  metrics: DeploymentMetrics;
}

export interface DeploymentDecision {
  action: 'promote' | 'rollback' | 'continue';
  reason: string;
  confidence: number;
  metrics: {
    errorRateDiff: number;
    latencyDiff: number;
    successRateDiff: number;
  };
}

export interface CanaryStats {
  activeDeployments: number;
  completedDeployments: number;
  failedDeployments: number;
  rolledBackDeployments: number;
  avgDeploymentDuration: number;
  successRate: number;
}

/**
 * Canary Deployment Service
 */
export class CanaryDeploymentService extends EventEmitter {
  private deployments: Map<string, CanaryDeployment> = new Map();
  private deploymentTimers: Map<string, NodeJS.Timeout> = new Map();
  private canaryLatencies: Map<string, number[]> = new Map();
  private baselineLatencies: Map<string, number[]> = new Map();

  private isRunning = false;
  private evaluationInterval: NodeJS.Timeout | null = null;

  // Statistics
  private totalDeployments = 0;
  private completedDeployments = 0;
  private failedDeployments = 0;
  private rolledBackDeployments = 0;

  // Configuration
  private readonly config = {
    evaluationIntervalMs: 10000,
    minEvaluationSamples: 100,
    defaultStages: [
      { stage: 'canary' as const, trafficPercentage: 5, durationMinutes: 10, successCriteria: { maxErrorRate: 0.01, maxLatencyP95Ms: 200, minSuccessRate: 0.99 } },
      { stage: 'partial' as const, trafficPercentage: 25, durationMinutes: 15, successCriteria: { maxErrorRate: 0.01, maxLatencyP95Ms: 200, minSuccessRate: 0.99 } },
      { stage: 'full' as const, trafficPercentage: 100, durationMinutes: 30, successCriteria: { maxErrorRate: 0.01, maxLatencyP95Ms: 200, minSuccessRate: 0.99 } },
    ],
    defaultRollbackThreshold: {
      errorRateIncrease: 5, // 5 percentage points
      latencyIncrease: 50, // 50% increase
      consecutiveFailures: 3,
    },
  };

  constructor() {
    super();
  }

  /**
   * Start the canary deployment service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start evaluation loop
    this.evaluationInterval = setInterval(
      () => this.evaluateAllDeployments(),
      this.config.evaluationIntervalMs
    );

    this.emit('started');
    console.log('[CanaryDeployment] Service started');
  }

  /**
   * Stop the canary deployment service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }

    // Clear all deployment timers
    for (const timer of this.deploymentTimers.values()) {
      clearTimeout(timer);
    }
    this.deploymentTimers.clear();

    this.emit('stopped');
    console.log('[CanaryDeployment] Service stopped');
  }

  /**
   * Start a new canary deployment
   */
  async startDeployment(config: Partial<CanaryConfig> & { modelId: string; newVersion: string; oldVersion: string }): Promise<CanaryDeployment> {
    const deploymentId = `canary-${config.modelId}-${Date.now()}`;

    // Validate versions exist
    const newModel = modelServingService.getModel(config.modelId, config.newVersion);
    const oldModel = modelServingService.getModel(config.modelId, config.oldVersion);

    if (!newModel) {
      throw new Error(`New version ${config.newVersion} not found for model ${config.modelId}`);
    }

    if (!oldModel) {
      throw new Error(`Old version ${config.oldVersion} not found for model ${config.modelId}`);
    }

    const fullConfig: CanaryConfig = {
      modelId: config.modelId,
      newVersion: config.newVersion,
      oldVersion: config.oldVersion,
      stages: config.stages || this.config.defaultStages,
      rollbackThreshold: config.rollbackThreshold || this.config.defaultRollbackThreshold,
      autoPromote: config.autoPromote ?? true,
      maxDuration: config.maxDuration || 120,
      minSampleSize: config.minSampleSize || 100,
      warmupRequests: config.warmupRequests || 10,
    };

    const deployment: CanaryDeployment = {
      id: deploymentId,
      config: fullConfig,
      status: 'in_progress',
      currentStage: 'canary',
      currentTrafficPercentage: fullConfig.stages[0].trafficPercentage,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      metrics: this.createEmptyMetrics(),
      stageHistory: [{
        fromStage: null,
        toStage: 'canary',
        timestamp: new Date(),
        reason: 'Deployment started',
        metrics: this.createEmptyMetrics(),
      }],
    };

    this.deployments.set(deploymentId, deployment);
    this.canaryLatencies.set(deploymentId, []);
    this.baselineLatencies.set(deploymentId, []);
    this.totalDeployments++;

    // Run warmup
    if (fullConfig.warmupRequests > 0) {
      await this.runWarmup(deploymentId, fullConfig);
    }

    // Set max duration timer
    const maxTimer = setTimeout(
      () => this.handleMaxDuration(deploymentId),
      fullConfig.maxDuration * 60 * 1000
    );
    this.deploymentTimers.set(`${deploymentId}-max`, maxTimer);

    // Set first stage timer
    const stageTimer = setTimeout(
      () => this.evaluateStageCompletion(deploymentId),
      fullConfig.stages[0].durationMinutes * 60 * 1000
    );
    this.deploymentTimers.set(`${deploymentId}-stage`, stageTimer);

    this.emit('deploymentStarted', deployment);
    console.log(`[CanaryDeployment] Started deployment ${deploymentId}: ${fullConfig.oldVersion} -> ${fullConfig.newVersion}`);

    return deployment;
  }

  /**
   * Route a prediction request through canary logic
   */
  routeRequest(modelId: string, request: PredictionRequest): { version: string; isCanary: boolean; deploymentId?: string } {
    // Find active deployment for this model
    const deployment = Array.from(this.deployments.values()).find(
      d => d.config.modelId === modelId && d.status === 'in_progress'
    );

    if (!deployment) {
      // No active canary, use latest version
      return { version: 'latest', isCanary: false };
    }

    // Route based on traffic percentage
    const random = Math.random() * 100;
    const isCanary = random < deployment.currentTrafficPercentage;

    return {
      version: isCanary ? deployment.config.newVersion : deployment.config.oldVersion,
      isCanary,
      deploymentId: deployment.id,
    };
  }

  /**
   * Record a prediction result for canary metrics
   */
  recordResult(
    deploymentId: string,
    isCanary: boolean,
    success: boolean,
    latencyMs: number
  ): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'in_progress') return;

    if (isCanary) {
      deployment.metrics.canaryRequests++;
      if (success) {
        deployment.metrics.canarySuccesses++;
      } else {
        deployment.metrics.canaryErrors++;
      }

      const latencies = this.canaryLatencies.get(deploymentId) || [];
      latencies.push(latencyMs);
      if (latencies.length > 10000) latencies.shift();
      this.canaryLatencies.set(deploymentId, latencies);

      deployment.metrics.canaryLatencyAvg = this.calculateAverage(latencies);
      deployment.metrics.canaryLatencyP95 = this.calculatePercentile(latencies, 95);
    } else {
      deployment.metrics.baselineRequests++;
      if (success) {
        deployment.metrics.baselineSuccesses++;
      } else {
        deployment.metrics.baselineErrors++;
      }

      const latencies = this.baselineLatencies.get(deploymentId) || [];
      latencies.push(latencyMs);
      if (latencies.length > 10000) latencies.shift();
      this.baselineLatencies.set(deploymentId, latencies);

      deployment.metrics.baselineLatencyAvg = this.calculateAverage(latencies);
      deployment.metrics.baselineLatencyP95 = this.calculatePercentile(latencies, 95);
    }

    deployment.lastUpdatedAt = new Date();
  }

  /**
   * Pause a deployment
   */
  pauseDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'in_progress') return false;

    deployment.status = 'paused';
    deployment.lastUpdatedAt = new Date();

    // Clear stage timer
    const stageTimer = this.deploymentTimers.get(`${deploymentId}-stage`);
    if (stageTimer) {
      clearTimeout(stageTimer);
      this.deploymentTimers.delete(`${deploymentId}-stage`);
    }

    this.emit('deploymentPaused', deployment);
    console.log(`[CanaryDeployment] Paused deployment ${deploymentId}`);

    return true;
  }

  /**
   * Resume a paused deployment
   */
  resumeDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'paused') return false;

    deployment.status = 'in_progress';
    deployment.lastUpdatedAt = new Date();

    // Set new stage timer
    const currentStageConfig = deployment.config.stages.find(
      s => s.stage === deployment.currentStage
    );
    if (currentStageConfig) {
      const stageTimer = setTimeout(
        () => this.evaluateStageCompletion(deploymentId),
        currentStageConfig.durationMinutes * 60 * 1000
      );
      this.deploymentTimers.set(`${deploymentId}-stage`, stageTimer);
    }

    this.emit('deploymentResumed', deployment);
    console.log(`[CanaryDeployment] Resumed deployment ${deploymentId}`);

    return true;
  }

  /**
   * Manually promote to next stage
   */
  async promoteDeployment(deploymentId: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'in_progress') return false;

    return await this.promoteToNextStage(deploymentId, 'Manual promotion');
  }

  /**
   * Rollback a deployment
   */
  async rollbackDeployment(deploymentId: string, reason: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    return await this.executeRollback(deploymentId, reason);
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId: string): CanaryDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all deployments for a model
   */
  getModelDeployments(modelId: string): CanaryDeployment[] {
    return Array.from(this.deployments.values())
      .filter(d => d.config.modelId === modelId);
  }

  /**
   * Get active deployments
   */
  getActiveDeployments(): CanaryDeployment[] {
    return Array.from(this.deployments.values())
      .filter(d => d.status === 'in_progress' || d.status === 'paused');
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): CanaryDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get service statistics
   */
  getStats(): CanaryStats {
    const deployments = Array.from(this.deployments.values());
    const completed = deployments.filter(d => d.status === 'completed');

    const durations = completed
      .filter(d => d.completedAt)
      .map(d => d.completedAt!.getTime() - d.startedAt.getTime());

    return {
      activeDeployments: deployments.filter(d => d.status === 'in_progress').length,
      completedDeployments: this.completedDeployments,
      failedDeployments: this.failedDeployments,
      rolledBackDeployments: this.rolledBackDeployments,
      avgDeploymentDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length / 60000
        : 0,
      successRate: this.totalDeployments > 0
        ? this.completedDeployments / this.totalDeployments
        : 0,
    };
  }

  /**
   * Make a deployment decision based on current metrics
   */
  evaluateDeployment(deploymentId: string): DeploymentDecision {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      return {
        action: 'continue',
        reason: 'Deployment not found',
        confidence: 0,
        metrics: { errorRateDiff: 0, latencyDiff: 0, successRateDiff: 0 },
      };
    }

    const { metrics, config } = deployment;
    const currentStageConfig = config.stages.find(s => s.stage === deployment.currentStage);
    if (!currentStageConfig) {
      return {
        action: 'rollback',
        reason: 'Invalid stage configuration',
        confidence: 1,
        metrics: { errorRateDiff: 0, latencyDiff: 0, successRateDiff: 0 },
      };
    }

    // Calculate rates
    const canaryErrorRate = metrics.canaryRequests > 0
      ? metrics.canaryErrors / metrics.canaryRequests
      : 0;
    const baselineErrorRate = metrics.baselineRequests > 0
      ? metrics.baselineErrors / metrics.baselineRequests
      : 0;

    const canarySuccessRate = metrics.canaryRequests > 0
      ? metrics.canarySuccesses / metrics.canaryRequests
      : 1;

    const errorRateDiff = (canaryErrorRate - baselineErrorRate) * 100;
    const latencyDiff = metrics.baselineLatencyP95 > 0
      ? ((metrics.canaryLatencyP95 - metrics.baselineLatencyP95) / metrics.baselineLatencyP95) * 100
      : 0;
    const successRateDiff = canarySuccessRate - 1; // vs 100%

    // Check rollback conditions
    if (errorRateDiff > config.rollbackThreshold.errorRateIncrease) {
      return {
        action: 'rollback',
        reason: `Error rate increased by ${errorRateDiff.toFixed(2)}%`,
        confidence: 0.9,
        metrics: { errorRateDiff, latencyDiff, successRateDiff },
      };
    }

    if (latencyDiff > config.rollbackThreshold.latencyIncrease) {
      return {
        action: 'rollback',
        reason: `Latency increased by ${latencyDiff.toFixed(2)}%`,
        confidence: 0.85,
        metrics: { errorRateDiff, latencyDiff, successRateDiff },
      };
    }

    // Check success criteria
    if (canaryErrorRate <= currentStageConfig.successCriteria.maxErrorRate &&
        metrics.canaryLatencyP95 <= currentStageConfig.successCriteria.maxLatencyP95Ms &&
        canarySuccessRate >= currentStageConfig.successCriteria.minSuccessRate &&
        metrics.canaryRequests >= config.minSampleSize) {

      if (deployment.currentStage === 'full') {
        return {
          action: 'promote',
          reason: 'All success criteria met at full rollout',
          confidence: 0.95,
          metrics: { errorRateDiff, latencyDiff, successRateDiff },
        };
      }

      return {
        action: 'promote',
        reason: 'Stage success criteria met',
        confidence: 0.85,
        metrics: { errorRateDiff, latencyDiff, successRateDiff },
      };
    }

    return {
      action: 'continue',
      reason: 'Collecting more samples',
      confidence: 0.5,
      metrics: { errorRateDiff, latencyDiff, successRateDiff },
    };
  }

  // Private methods

  private createEmptyMetrics(): DeploymentMetrics {
    return {
      canaryRequests: 0,
      canarySuccesses: 0,
      canaryErrors: 0,
      canaryLatencyAvg: 0,
      canaryLatencyP95: 0,
      baselineRequests: 0,
      baselineSuccesses: 0,
      baselineErrors: 0,
      baselineLatencyAvg: 0,
      baselineLatencyP95: 0,
    };
  }

  private async runWarmup(deploymentId: string, config: CanaryConfig): Promise<void> {
    console.log(`[CanaryDeployment] Running warmup for ${deploymentId}`);

    for (let i = 0; i < config.warmupRequests; i++) {
      try {
        await modelServingService.predict({
          modelId: config.modelId,
          modelVersion: config.newVersion,
          inputs: { warmup: true },
        });
      } catch {
        // Ignore warmup errors
      }
    }
  }

  private async evaluateAllDeployments(): Promise<void> {
    for (const [deploymentId, deployment] of this.deployments) {
      if (deployment.status !== 'in_progress') continue;

      const decision = this.evaluateDeployment(deploymentId);

      if (decision.action === 'rollback') {
        await this.executeRollback(deploymentId, decision.reason);
      }
    }
  }

  private async evaluateStageCompletion(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'in_progress') return;

    const decision = this.evaluateDeployment(deploymentId);

    if (decision.action === 'rollback') {
      await this.executeRollback(deploymentId, decision.reason);
    } else if (decision.action === 'promote' && deployment.config.autoPromote) {
      await this.promoteToNextStage(deploymentId, decision.reason);
    } else {
      // Set timer for next evaluation
      const currentStageConfig = deployment.config.stages.find(
        s => s.stage === deployment.currentStage
      );
      if (currentStageConfig) {
        const stageTimer = setTimeout(
          () => this.evaluateStageCompletion(deploymentId),
          currentStageConfig.durationMinutes * 60 * 1000
        );
        this.deploymentTimers.set(`${deploymentId}-stage`, stageTimer);
      }
    }
  }

  private async promoteToNextStage(deploymentId: string, reason: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    const stages = deployment.config.stages;
    const currentIndex = stages.findIndex(s => s.stage === deployment.currentStage);

    if (currentIndex === -1) return false;

    if (currentIndex >= stages.length - 1) {
      // Complete deployment
      return await this.completeDeployment(deploymentId, reason);
    }

    // Move to next stage
    const nextStage = stages[currentIndex + 1];
    const previousStage = deployment.currentStage;

    deployment.currentStage = nextStage.stage;
    deployment.currentTrafficPercentage = nextStage.trafficPercentage;
    deployment.lastUpdatedAt = new Date();

    deployment.stageHistory.push({
      fromStage: previousStage,
      toStage: nextStage.stage,
      timestamp: new Date(),
      reason,
      metrics: { ...deployment.metrics },
    });

    // Clear old timer and set new one
    const oldTimer = this.deploymentTimers.get(`${deploymentId}-stage`);
    if (oldTimer) clearTimeout(oldTimer);

    const stageTimer = setTimeout(
      () => this.evaluateStageCompletion(deploymentId),
      nextStage.durationMinutes * 60 * 1000
    );
    this.deploymentTimers.set(`${deploymentId}-stage`, stageTimer);

    this.emit('stagePromoted', {
      deploymentId,
      fromStage: previousStage,
      toStage: nextStage.stage,
      reason,
    });

    console.log(`[CanaryDeployment] Promoted ${deploymentId} from ${previousStage} to ${nextStage.stage}`);

    return true;
  }

  private async completeDeployment(deploymentId: string, reason: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    deployment.status = 'completed';
    deployment.currentStage = 'completed';
    deployment.currentTrafficPercentage = 100;
    deployment.completedAt = new Date();
    deployment.lastUpdatedAt = new Date();

    deployment.stageHistory.push({
      fromStage: 'full',
      toStage: 'completed',
      timestamp: new Date(),
      reason,
      metrics: { ...deployment.metrics },
    });

    // Clear timers
    this.clearDeploymentTimers(deploymentId);

    this.completedDeployments++;

    this.emit('deploymentCompleted', deployment);
    console.log(`[CanaryDeployment] Completed deployment ${deploymentId}`);

    return true;
  }

  private async executeRollback(deploymentId: string, reason: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    const previousStage = deployment.currentStage;
    deployment.status = 'rolled_back';
    deployment.currentStage = 'rollback';
    deployment.currentTrafficPercentage = 0;
    deployment.rollbackReason = reason;
    deployment.completedAt = new Date();
    deployment.lastUpdatedAt = new Date();

    deployment.stageHistory.push({
      fromStage: previousStage,
      toStage: 'rollback',
      timestamp: new Date(),
      reason,
      metrics: { ...deployment.metrics },
    });

    // Clear timers
    this.clearDeploymentTimers(deploymentId);

    this.rolledBackDeployments++;
    this.failedDeployments++;

    this.emit('deploymentRolledBack', { deployment, reason });
    console.log(`[CanaryDeployment] Rolled back deployment ${deploymentId}: ${reason}`);

    return true;
  }

  private handleMaxDuration(deploymentId: string): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'in_progress') return;

    if (deployment.currentStage === 'full') {
      this.completeDeployment(deploymentId, 'Max duration reached at full rollout');
    } else {
      this.executeRollback(deploymentId, 'Max deployment duration exceeded');
    }
  }

  private clearDeploymentTimers(deploymentId: string): void {
    const maxTimer = this.deploymentTimers.get(`${deploymentId}-max`);
    if (maxTimer) {
      clearTimeout(maxTimer);
      this.deploymentTimers.delete(`${deploymentId}-max`);
    }

    const stageTimer = this.deploymentTimers.get(`${deploymentId}-stage`);
    if (stageTimer) {
      clearTimeout(stageTimer);
      this.deploymentTimers.delete(`${deploymentId}-stage`);
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }
}

// Singleton instance
export const canaryDeploymentService = new CanaryDeploymentService();

// Factory function
export function createCanaryDeploymentService(): CanaryDeploymentService {
  return new CanaryDeploymentService();
}
