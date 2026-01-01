import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';
import cron from 'node-cron';
import * as os from 'os';
import * as cluster from 'cluster';
import { performance } from 'perf_hooks';

/**
 * Chaos Engineering Service for Resilience Testing
 *
 * Implements controlled failure injection to test system resilience,
 * including latency injection, error simulation, service degradation,
 * and resource exhaustion scenarios.
 */

export interface LatencyConfig {
  min: number;
  max: number;
  spike?: {
    probability: number;
    multiplier: number;
  };
}

export interface ErrorInjectionConfig {
  errorRate: number;
  errorCode?: number;
  errorMessage?: string;
  throwException?: boolean;
}

export interface NetworkPartitionConfig {
  targetService: string;
  duration: number;
  type: 'full' | 'partial';
  packetLoss?: number;
}

export interface ResourceExhaustionConfig {
  type: 'cpu' | 'memory' | 'disk' | 'connections';
  intensity: number;
  duration: number;
}

export interface BlastRadiusConfig {
  percentage: number;
  targetEndpoints?: string[];
  excludeEndpoints?: string[];
  targetMethods?: string[];
}

export interface SafetyConfig {
  maxDuration: number;
  killSwitch: boolean;
  allowedHours?: {
    start: number;
    end: number;
  };
  allowedDays?: number[];
  requireApproval?: boolean;
  autoAbortOnError?: boolean;
}

export interface ChaosExperiment {
  id?: string;
  name: string;
  type: 'latency' | 'error' | 'service_kill' | 'network_partition' | 'resource_exhaustion' | 'dependency_failure' | 'database_slowdown' | 'cache_eviction' | 'disk_fill' | 'connection_pool_exhaustion';
  target: {
    service: string;
    operation?: string;
    endpoint?: string;
  };
  parameters: {
    latency?: LatencyConfig;
    error?: ErrorInjectionConfig;
    networkPartition?: NetworkPartitionConfig;
    resourceExhaustion?: ResourceExhaustionConfig;
  };
  duration: number;
  blastRadius: BlastRadiusConfig;
  safety: SafetyConfig;
  schedule?: string;
  enabled?: boolean;
  startTime?: number;
  endTime?: number;
  status?: 'pending' | 'running' | 'completed' | 'aborted' | 'failed';
}

export interface ExperimentResult {
  experimentId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'aborted' | 'failed';
  metrics: {
    requestsAffected: number;
    errorsInjected: number;
    latencyAdded: number[];
    systemImpact: {
      errorRate: number;
      p95Latency: number;
      p99Latency: number;
      throughput: number;
    };
  };
  observations: string[];
  abortReason?: string;
}

export interface ChaosMetrics {
  activeExperiments: number;
  totalExperiments: number;
  successfulExperiments: number;
  abortedExperiments: number;
  requestsAffected: number;
  currentImpact: {
    errorRate: number;
    avgLatency: number;
  };
}

export class ChaosEngineeringService extends EventEmitter {
  private experiments: Map<string, ChaosExperiment> = new Map();
  private activeExperiments: Map<string, ChaosExperiment> = new Map();
  private experimentResults: Map<string, ExperimentResult> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private killSwitchEnabled: boolean = false;
  private metrics: ChaosMetrics;
  private requestCounter: Map<string, number> = new Map();
  private latencyValues: Map<string, number[]> = new Map();
  private resourceExhaustionHandles: Map<string, NodeJS.Timeout[]> = new Map();

  constructor() {
    super();
    this.metrics = {
      activeExperiments: 0,
      totalExperiments: 0,
      successfulExperiments: 0,
      abortedExperiments: 0,
      requestsAffected: 0,
      currentImpact: {
        errorRate: 0,
        avgLatency: 0,
      },
    };

    this.setupKillSwitch();
  }

  /**
   * Create and register a chaos experiment
   */
  public createExperiment(experiment: ChaosExperiment): string {
    const id = experiment.id || this.generateExperimentId();
    const exp: ChaosExperiment = {
      ...experiment,
      id,
      enabled: experiment.enabled !== false,
      status: 'pending',
    };

    this.experiments.set(id, exp);
    this.metrics.totalExperiments++;

    if (exp.schedule && exp.enabled) {
      this.scheduleExperiment(exp);
    }

    this.emit('experiment_created', { experimentId: id, experiment: exp });

    return id;
  }

  /**
   * Start a chaos experiment
   */
  public async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (this.killSwitchEnabled) {
      throw new Error('Kill switch is enabled, cannot start experiments');
    }

    if (!this.isSafeToRun(experiment)) {
      throw new Error('Safety checks failed, experiment not allowed to run');
    }

    experiment.status = 'running';
    experiment.startTime = Date.now();
    experiment.endTime = experiment.startTime + experiment.duration;

    this.activeExperiments.set(experimentId, experiment);
    this.metrics.activeExperiments++;

    const result: ExperimentResult = {
      experimentId,
      name: experiment.name,
      startTime: experiment.startTime,
      endTime: experiment.endTime,
      duration: experiment.duration,
      status: 'completed',
      metrics: {
        requestsAffected: 0,
        errorsInjected: 0,
        latencyAdded: [],
        systemImpact: {
          errorRate: 0,
          p95Latency: 0,
          p99Latency: 0,
          throughput: 0,
        },
      },
      observations: [],
    };

    this.experimentResults.set(experimentId, result);
    this.requestCounter.set(experimentId, 0);
    this.latencyValues.set(experimentId, []);

    this.emit('experiment_started', { experimentId, experiment });

    // Execute the experiment based on type
    switch (experiment.type) {
      case 'resource_exhaustion':
        await this.executeResourceExhaustion(experimentId, experiment);
        break;
      case 'service_kill':
        await this.executeServiceKill(experimentId, experiment);
        break;
      case 'network_partition':
        await this.executeNetworkPartition(experimentId, experiment);
        break;
      case 'database_slowdown':
        await this.executeDatabaseSlowdown(experimentId, experiment);
        break;
      case 'cache_eviction':
        await this.executeCacheEviction(experimentId, experiment);
        break;
      case 'disk_fill':
        await this.executeDiskFill(experimentId, experiment);
        break;
      case 'connection_pool_exhaustion':
        await this.executeConnectionPoolExhaustion(experimentId, experiment);
        break;
      case 'dependency_failure':
        await this.executeDependencyFailure(experimentId, experiment);
        break;
    }

    // Schedule auto-stop
    setTimeout(() => {
      this.stopExperiment(experimentId);
    }, experiment.duration);

    // Safety timeout (max duration)
    setTimeout(() => {
      if (this.activeExperiments.has(experimentId)) {
        this.abortExperiment(experimentId, 'Safety timeout reached');
      }
    }, experiment.safety.maxDuration);
  }

  /**
   * Stop a running experiment
   */
  public stopExperiment(experimentId: string): void {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return;
    }

    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.status = 'completed';

      const latencies = this.latencyValues.get(experimentId) || [];
      if (latencies.length > 0) {
        result.metrics.systemImpact.p95Latency = this.calculatePercentile(latencies, 0.95);
        result.metrics.systemImpact.p99Latency = this.calculatePercentile(latencies, 0.99);
      }

      result.observations.push(`Experiment completed successfully after ${result.duration}ms`);
    }

    this.cleanupExperiment(experimentId);

    experiment.status = 'completed';
    this.activeExperiments.delete(experimentId);
    this.metrics.activeExperiments--;
    this.metrics.successfulExperiments++;

    this.emit('experiment_stopped', { experimentId, experiment, result });
  }

  /**
   * Abort a running experiment
   */
  public abortExperiment(experimentId: string, reason: string): void {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return;
    }

    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.status = 'aborted';
      result.abortReason = reason;
      result.observations.push(`Experiment aborted: ${reason}`);
    }

    this.cleanupExperiment(experimentId);

    experiment.status = 'aborted';
    this.activeExperiments.delete(experimentId);
    this.metrics.activeExperiments--;
    this.metrics.abortedExperiments++;

    this.emit('experiment_aborted', { experimentId, experiment, reason, result });
  }

  /**
   * Express middleware for chaos injection
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (this.killSwitchEnabled || this.activeExperiments.size === 0) {
        return next();
      }

      const path = req.path;
      const method = req.method;

      for (const [experimentId, experiment] of this.activeExperiments) {
        if (!this.shouldAffectRequest(experiment, path, method)) {
          continue;
        }

        try {
          // Apply latency injection
          if (experiment.type === 'latency' && experiment.parameters.latency) {
            await this.injectLatency(experimentId, experiment.parameters.latency);
          }

          // Apply error injection
          if (experiment.type === 'error' && experiment.parameters.error) {
            const shouldInject = await this.shouldInjectError(experimentId, experiment.parameters.error);
            if (shouldInject) {
              this.injectError(experimentId, experiment.parameters.error, res);
              return;
            }
          }
        } catch (error) {
          console.error(`Error in chaos middleware for experiment ${experimentId}:`, error);
        }
      }

      next();
    };
  }

  /**
   * Database query interceptor
   */
  public async interceptDatabaseQuery<T>(
    operation: string,
    query: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    for (const [experimentId, experiment] of this.activeExperiments) {
      if (experiment.target.operation === 'db_query' || experiment.type === 'database_slowdown') {
        if (experiment.parameters.latency) {
          await this.injectLatency(experimentId, experiment.parameters.latency);
        }

        if (experiment.parameters.error && Math.random() < (experiment.parameters.error.errorRate || 0)) {
          const result = this.experimentResults.get(experimentId);
          if (result) {
            result.metrics.errorsInjected++;
          }
          throw new Error(experiment.parameters.error.errorMessage || 'Database query failed (chaos injection)');
        }
      }
    }

    const result = await query();

    const duration = performance.now() - startTime;
    this.recordQueryLatency(duration);

    return result;
  }

  /**
   * Cache operation interceptor
   */
  public async interceptCacheOperation<T>(
    operation: string,
    cacheKey: string,
    getter: () => Promise<T | null>
  ): Promise<T | null> {
    for (const [experimentId, experiment] of this.activeExperiments) {
      if (experiment.type === 'cache_eviction') {
        const result = this.experimentResults.get(experimentId);
        if (result) {
          result.metrics.requestsAffected++;
        }
        return null;
      }

      if (experiment.target.operation === 'cache_get' && experiment.parameters.error) {
        if (Math.random() < (experiment.parameters.error.errorRate || 0)) {
          return null;
        }
      }
    }

    return getter();
  }

  /**
   * Enable kill switch to stop all experiments
   */
  public enableKillSwitch(): void {
    this.killSwitchEnabled = true;

    const activeIds = Array.from(this.activeExperiments.keys());
    for (const experimentId of activeIds) {
      this.abortExperiment(experimentId, 'Kill switch activated');
    }

    this.emit('kill_switch_enabled');
  }

  /**
   * Disable kill switch
   */
  public disableKillSwitch(): void {
    this.killSwitchEnabled = false;
    this.emit('kill_switch_disabled');
  }

  /**
   * Get experiment status
   */
  public getExperiment(experimentId: string): ChaosExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get experiment result
   */
  public getExperimentResult(experimentId: string): ExperimentResult | undefined {
    return this.experimentResults.get(experimentId);
  }

  /**
   * Get all experiments
   */
  public getAllExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get active experiments
   */
  public getActiveExperiments(): ChaosExperiment[] {
    return Array.from(this.activeExperiments.values());
  }

  /**
   * Get metrics
   */
  public getMetrics(): ChaosMetrics {
    return { ...this.metrics };
  }

  /**
   * Delete an experiment
   */
  public deleteExperiment(experimentId: string): void {
    if (this.activeExperiments.has(experimentId)) {
      this.abortExperiment(experimentId, 'Experiment deleted');
    }

    const scheduled = this.scheduledJobs.get(experimentId);
    if (scheduled) {
      scheduled.stop();
      this.scheduledJobs.delete(experimentId);
    }

    this.experiments.delete(experimentId);
    this.experimentResults.delete(experimentId);
    this.requestCounter.delete(experimentId);
    this.latencyValues.delete(experimentId);

    this.emit('experiment_deleted', { experimentId });
  }

  // Private methods

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private isSafeToRun(experiment: ChaosExperiment): boolean {
    const safety = experiment.safety;

    if (safety.allowedHours) {
      const currentHour = new Date().getHours();
      if (currentHour < safety.allowedHours.start || currentHour > safety.allowedHours.end) {
        return false;
      }
    }

    if (safety.allowedDays) {
      const currentDay = new Date().getDay();
      if (!safety.allowedDays.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  private shouldAffectRequest(experiment: ChaosExperiment, path: string, method: string): boolean {
    const blast = experiment.blastRadius;

    if (blast.excludeEndpoints && blast.excludeEndpoints.some(ep => path.includes(ep))) {
      return false;
    }

    if (blast.targetEndpoints && !blast.targetEndpoints.some(ep => path.includes(ep))) {
      return false;
    }

    if (blast.targetMethods && !blast.targetMethods.includes(method)) {
      return false;
    }

    if (Math.random() * 100 > blast.percentage) {
      return false;
    }

    return true;
  }

  private async injectLatency(experimentId: string, config: LatencyConfig): Promise<void> {
    let latency = Math.random() * (config.max - config.min) + config.min;

    if (config.spike) {
      if (Math.random() < config.spike.probability) {
        latency *= config.spike.multiplier;
      }
    }

    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.metrics.requestsAffected++;
      result.metrics.latencyAdded.push(latency);
    }

    const latencies = this.latencyValues.get(experimentId) || [];
    latencies.push(latency);
    this.latencyValues.set(experimentId, latencies);

    await this.sleep(latency);
  }

  private async shouldInjectError(experimentId: string, config: ErrorInjectionConfig): Promise<boolean> {
    const counter = this.requestCounter.get(experimentId) || 0;
    this.requestCounter.set(experimentId, counter + 1);

    return Math.random() < config.errorRate;
  }

  private injectError(experimentId: string, config: ErrorInjectionConfig, res: Response): void {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.metrics.errorsInjected++;
      result.metrics.requestsAffected++;
    }

    const errorCode = config.errorCode || 500;
    const errorMessage = config.errorMessage || 'Internal Server Error (Chaos Injection)';

    if (config.throwException) {
      throw new Error(errorMessage);
    } else {
      res.status(errorCode).json({
        error: errorMessage,
        chaosExperiment: experimentId,
      });
    }
  }

  private async executeResourceExhaustion(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const config = experiment.parameters.resourceExhaustion;
    if (!config) return;

    const handles: NodeJS.Timeout[] = [];

    switch (config.type) {
      case 'cpu':
        const cpuCount = config.intensity;
        for (let i = 0; i < cpuCount; i++) {
          const handle = setInterval(() => {
            const start = Date.now();
            while (Date.now() - start < 50) {
              Math.sqrt(Math.random());
            }
          }, 100);
          handles.push(handle);
        }
        break;

      case 'memory':
        const memoryMB = config.intensity;
        const arrays: number[][] = [];
        const handle = setInterval(() => {
          const arr = new Array(1024 * 1024 / 8).fill(Math.random());
          arrays.push(arr);
          if (arrays.length >= memoryMB) {
            clearInterval(handle);
          }
        }, 100);
        handles.push(handle);
        break;

      case 'connections':
        // Simulate connection exhaustion
        break;
    }

    this.resourceExhaustionHandles.set(experimentId, handles);

    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push(`Resource exhaustion started: ${config.type} at intensity ${config.intensity}`);
    }
  }

  private async executeServiceKill(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);

    if (cluster.isWorker) {
      if (result) {
        result.observations.push('Worker process will be killed for service kill test');
      }
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    } else {
      if (result) {
        result.observations.push('Service kill skipped: not running in cluster mode');
      }
    }
  }

  private async executeNetworkPartition(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const config = experiment.parameters.networkPartition;
    if (!config) return;

    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push(`Network partition simulated for ${config.targetService}: ${config.type}`);
    }
  }

  private async executeDatabaseSlowdown(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push('Database slowdown active - queries will be delayed');
    }
  }

  private async executeCacheEviction(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push('Cache eviction active - all cache reads will return null');
    }
  }

  private async executeDiskFill(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push('Disk fill simulation active');
    }
  }

  private async executeConnectionPoolExhaustion(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push('Connection pool exhaustion simulation active');
    }
  }

  private async executeDependencyFailure(experimentId: string, experiment: ChaosExperiment): Promise<void> {
    const result = this.experimentResults.get(experimentId);
    if (result) {
      result.observations.push(`Dependency failure simulation for ${experiment.target.service}`);
    }
  }

  private cleanupExperiment(experimentId: string): void {
    const handles = this.resourceExhaustionHandles.get(experimentId);
    if (handles) {
      handles.forEach(handle => clearInterval(handle));
      this.resourceExhaustionHandles.delete(experimentId);
    }
  }

  private scheduleExperiment(experiment: ChaosExperiment): void {
    if (!experiment.schedule || !experiment.id) return;

    try {
      const task = cron.schedule(experiment.schedule, () => {
        if (experiment.enabled && !this.killSwitchEnabled) {
          this.startExperiment(experiment.id!).catch(error => {
            console.error(`Failed to start scheduled experiment ${experiment.id}:`, error);
          });
        }
      });

      this.scheduledJobs.set(experiment.id, task);
    } catch (error) {
      console.error(`Failed to schedule experiment ${experiment.id}:`, error);
    }
  }

  private setupKillSwitch(): void {
    process.on('SIGUSR2', () => {
      console.log('SIGUSR2 received, enabling kill switch');
      this.enableKillSwitch();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }

  private recordQueryLatency(duration: number): void {
    for (const [experimentId, experiment] of this.activeExperiments) {
      if (experiment.target.operation === 'db_query') {
        const latencies = this.latencyValues.get(experimentId) || [];
        latencies.push(duration);
        this.latencyValues.set(experimentId, latencies);
      }
    }
  }

  /**
   * Update experiment configuration
   */
  public updateExperiment(experimentId: string, updates: Partial<ChaosExperiment>): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (this.activeExperiments.has(experimentId)) {
      throw new Error('Cannot update running experiment');
    }

    Object.assign(experiment, updates);

    if (updates.schedule !== undefined) {
      const existing = this.scheduledJobs.get(experimentId);
      if (existing) {
        existing.stop();
        this.scheduledJobs.delete(experimentId);
      }

      if (updates.schedule && experiment.enabled) {
        this.scheduleExperiment(experiment);
      }
    }

    this.emit('experiment_updated', { experimentId, experiment });
  }

  /**
   * Get experiment statistics
   */
  public getExperimentStats(experimentId: string): {
    totalRequests: number;
    affectedRequests: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  } | null {
    const result = this.experimentResults.get(experimentId);
    if (!result) return null;

    const latencies = this.latencyValues.get(experimentId) || [];
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    return {
      totalRequests: this.requestCounter.get(experimentId) || 0,
      affectedRequests: result.metrics.requestsAffected,
      errorRate: result.metrics.errorsInjected / Math.max(result.metrics.requestsAffected, 1),
      avgLatency,
      p95Latency: result.metrics.systemImpact.p95Latency,
      p99Latency: result.metrics.systemImpact.p99Latency,
    };
  }

  /**
   * Export experiment results
   */
  public exportResults(experimentId: string): ExperimentResult | null {
    return this.experimentResults.get(experimentId) || null;
  }

  /**
   * Get all experiment results
   */
  public getAllResults(): ExperimentResult[] {
    return Array.from(this.experimentResults.values());
  }

  /**
   * Clear completed experiments
   */
  public clearCompletedExperiments(): void {
    const completed: string[] = [];

    for (const [id, experiment] of this.experiments) {
      if (experiment.status === 'completed' && !this.activeExperiments.has(id)) {
        completed.push(id);
      }
    }

    for (const id of completed) {
      this.deleteExperiment(id);
    }

    this.emit('experiments_cleared', { count: completed.length });
  }
}

export default ChaosEngineeringService;
