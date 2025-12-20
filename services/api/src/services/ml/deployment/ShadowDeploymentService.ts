/**
 * Shadow Deployment Service
 *
 * Enables testing new model versions in production without affecting
 * actual predictions. Shadow mode mirrors traffic to new models for
 * performance comparison.
 *
 * Features:
 * - Mirror production traffic to shadow models
 * - Compare shadow vs production predictions
 * - No impact on production responses
 * - Detailed comparison metrics
 * - Drift detection between versions
 */

import { EventEmitter } from 'events';
import { modelServingService, PredictionRequest, PredictionResponse } from './ModelServingService';

// Types
export type ShadowStatus = 'active' | 'paused' | 'completed' | 'error';
export type ComparisonType = 'exact' | 'similarity' | 'threshold' | 'custom';

export interface ShadowConfig {
  modelId: string;
  shadowVersion: string;
  productionVersion: string;
  sampleRate: number; // 0-100, percentage of traffic to shadow
  comparisonType: ComparisonType;
  comparisonThreshold: number;
  maxDuration: number; // minutes
  minSamples: number;
  storeResults: boolean;
  async: boolean; // Run shadow predictions asynchronously
}

export interface ShadowDeployment {
  id: string;
  config: ShadowConfig;
  status: ShadowStatus;
  startedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  metrics: ShadowMetrics;
  comparisons: ComparisonResult[];
  divergences: DivergenceRecord[];
}

export interface ShadowMetrics {
  totalRequests: number;
  shadowedRequests: number;
  matchingPredictions: number;
  divergentPredictions: number;
  shadowErrors: number;
  productionErrors: number;
  shadowLatencyAvg: number;
  shadowLatencyP95: number;
  productionLatencyAvg: number;
  productionLatencyP95: number;
  matchRate: number;
  latencyOverhead: number;
}

export interface ComparisonResult {
  requestId: string;
  timestamp: Date;
  request: PredictionRequest;
  productionResponse: PredictionResponse;
  shadowResponse: PredictionResponse | null;
  shadowError?: string;
  match: boolean;
  similarity: number;
  latencyDiff: number;
  details?: Record<string, unknown>;
}

export interface DivergenceRecord {
  id: string;
  timestamp: Date;
  request: PredictionRequest;
  productionOutput: Record<string, unknown>;
  shadowOutput: Record<string, unknown>;
  divergenceType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export interface ShadowAnalysis {
  deploymentId: string;
  modelId: string;
  analysisDate: Date;
  totalSamples: number;
  matchRate: number;
  avgSimilarity: number;
  latencyComparison: {
    shadowFaster: number;
    productionFaster: number;
    avgDifferenceMs: number;
  };
  divergencePatterns: {
    pattern: string;
    count: number;
    examples: DivergenceRecord[];
  }[];
  recommendation: 'promote' | 'investigate' | 'reject';
  confidence: number;
}

export interface ShadowStats {
  activeDeployments: number;
  completedDeployments: number;
  totalShadowedRequests: number;
  overallMatchRate: number;
  avgLatencyOverhead: number;
}

/**
 * Shadow Deployment Service
 */
export class ShadowDeploymentService extends EventEmitter {
  private deployments: Map<string, ShadowDeployment> = new Map();
  private shadowLatencies: Map<string, number[]> = new Map();
  private productionLatencies: Map<string, number[]> = new Map();
  private durationTimers: Map<string, NodeJS.Timeout> = new Map();

  private isRunning = false;
  private analysisInterval: NodeJS.Timeout | null = null;

  // Statistics
  private totalShadowedRequests = 0;

  // Configuration
  private readonly config = {
    analysisIntervalMs: 60000,
    maxComparisonHistory: 1000,
    maxDivergenceHistory: 500,
    defaultSampleRate: 10,
    defaultComparisonThreshold: 0.95,
  };

  constructor() {
    super();
  }

  /**
   * Start the shadow deployment service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start analysis loop
    this.analysisInterval = setInterval(
      () => this.runPeriodicAnalysis(),
      this.config.analysisIntervalMs
    );

    this.emit('started');
    console.log('[ShadowDeployment] Service started');
  }

  /**
   * Stop the shadow deployment service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    // Clear all duration timers
    for (const timer of this.durationTimers.values()) {
      clearTimeout(timer);
    }
    this.durationTimers.clear();

    this.emit('stopped');
    console.log('[ShadowDeployment] Service stopped');
  }

  /**
   * Start a new shadow deployment
   */
  async startShadow(config: Partial<ShadowConfig> & {
    modelId: string;
    shadowVersion: string;
    productionVersion: string;
  }): Promise<ShadowDeployment> {
    const deploymentId = `shadow-${config.modelId}-${Date.now()}`;

    // Validate versions
    const shadowModel = modelServingService.getModel(config.modelId, config.shadowVersion);
    const prodModel = modelServingService.getModel(config.modelId, config.productionVersion);

    if (!shadowModel) {
      throw new Error(`Shadow version ${config.shadowVersion} not found for model ${config.modelId}`);
    }

    if (!prodModel) {
      throw new Error(`Production version ${config.productionVersion} not found for model ${config.modelId}`);
    }

    const fullConfig: ShadowConfig = {
      modelId: config.modelId,
      shadowVersion: config.shadowVersion,
      productionVersion: config.productionVersion,
      sampleRate: config.sampleRate ?? this.config.defaultSampleRate,
      comparisonType: config.comparisonType || 'similarity',
      comparisonThreshold: config.comparisonThreshold ?? this.config.defaultComparisonThreshold,
      maxDuration: config.maxDuration || 60,
      minSamples: config.minSamples || 1000,
      storeResults: config.storeResults ?? true,
      async: config.async ?? true,
    };

    const deployment: ShadowDeployment = {
      id: deploymentId,
      config: fullConfig,
      status: 'active',
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      metrics: this.createEmptyMetrics(),
      comparisons: [],
      divergences: [],
    };

    this.deployments.set(deploymentId, deployment);
    this.shadowLatencies.set(deploymentId, []);
    this.productionLatencies.set(deploymentId, []);

    // Set duration timer
    const timer = setTimeout(
      () => this.completeShadow(deploymentId, 'Max duration reached'),
      fullConfig.maxDuration * 60 * 1000
    );
    this.durationTimers.set(deploymentId, timer);

    this.emit('shadowStarted', deployment);
    console.log(`[ShadowDeployment] Started shadow ${deploymentId}: ${fullConfig.productionVersion} -> ${fullConfig.shadowVersion}`);

    return deployment;
  }

  /**
   * Process a request through shadow comparison
   */
  async processRequest(
    modelId: string,
    request: PredictionRequest,
    productionResponse: PredictionResponse
  ): Promise<ComparisonResult | null> {
    // Find active shadow deployment
    const deployment = Array.from(this.deployments.values()).find(
      d => d.config.modelId === modelId && d.status === 'active'
    );

    if (!deployment) return null;

    deployment.metrics.totalRequests++;
    deployment.lastUpdatedAt = new Date();

    // Check sample rate
    if (Math.random() * 100 > deployment.config.sampleRate) {
      return null;
    }

    deployment.metrics.shadowedRequests++;
    this.totalShadowedRequests++;

    // Record production latency
    const prodLatencies = this.productionLatencies.get(deployment.id) || [];
    prodLatencies.push(productionResponse.latencyMs);
    if (prodLatencies.length > 10000) prodLatencies.shift();
    this.productionLatencies.set(deployment.id, prodLatencies);

    const comparison: ComparisonResult = {
      requestId: `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      request,
      productionResponse,
      shadowResponse: null,
      match: false,
      similarity: 0,
      latencyDiff: 0,
    };

    // Run shadow prediction
    if (deployment.config.async) {
      // Run asynchronously (don't block production)
      this.runShadowPrediction(deployment, request, comparison);
    } else {
      // Run synchronously
      await this.runShadowPrediction(deployment, request, comparison);
    }

    return comparison;
  }

  /**
   * Stop a shadow deployment
   */
  stopShadow(deploymentId: string, reason: string = 'Manual stop'): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'active') return false;

    this.completeShadow(deploymentId, reason);
    return true;
  }

  /**
   * Pause a shadow deployment
   */
  pauseShadow(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'active') return false;

    deployment.status = 'paused';
    deployment.lastUpdatedAt = new Date();

    this.emit('shadowPaused', deployment);
    console.log(`[ShadowDeployment] Paused shadow ${deploymentId}`);

    return true;
  }

  /**
   * Resume a paused shadow deployment
   */
  resumeShadow(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'paused') return false;

    deployment.status = 'active';
    deployment.lastUpdatedAt = new Date();

    this.emit('shadowResumed', deployment);
    console.log(`[ShadowDeployment] Resumed shadow ${deploymentId}`);

    return true;
  }

  /**
   * Get shadow deployment by ID
   */
  getShadow(deploymentId: string): ShadowDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all shadow deployments for a model
   */
  getModelShadows(modelId: string): ShadowDeployment[] {
    return Array.from(this.deployments.values())
      .filter(d => d.config.modelId === modelId);
  }

  /**
   * Get active shadow deployments
   */
  getActiveShadows(): ShadowDeployment[] {
    return Array.from(this.deployments.values())
      .filter(d => d.status === 'active');
  }

  /**
   * Get all shadow deployments
   */
  getAllShadows(): ShadowDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Analyze a shadow deployment
   */
  analyzeShadow(deploymentId: string): ShadowAnalysis {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Shadow deployment ${deploymentId} not found`);
    }

    const { metrics, comparisons, divergences } = deployment;

    // Calculate latency comparison
    const shadowLatencies = this.shadowLatencies.get(deploymentId) || [];
    const prodLatencies = this.productionLatencies.get(deploymentId) || [];

    let shadowFaster = 0;
    let productionFaster = 0;
    let totalDiff = 0;

    for (const comparison of comparisons) {
      if (comparison.shadowResponse) {
        const diff = comparison.shadowResponse.latencyMs - comparison.productionResponse.latencyMs;
        totalDiff += diff;
        if (diff < 0) shadowFaster++;
        else productionFaster++;
      }
    }

    // Identify divergence patterns
    const patternMap = new Map<string, DivergenceRecord[]>();
    for (const div of divergences) {
      const pattern = div.divergenceType;
      const existing = patternMap.get(pattern) || [];
      existing.push(div);
      patternMap.set(pattern, existing);
    }

    const divergencePatterns = Array.from(patternMap.entries())
      .map(([pattern, records]) => ({
        pattern,
        count: records.length,
        examples: records.slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count);

    // Determine recommendation
    let recommendation: 'promote' | 'investigate' | 'reject';
    let confidence: number;

    if (metrics.matchRate >= 0.99 && metrics.latencyOverhead <= 10) {
      recommendation = 'promote';
      confidence = 0.95;
    } else if (metrics.matchRate >= 0.95 || divergencePatterns.length <= 2) {
      recommendation = 'investigate';
      confidence = 0.7;
    } else {
      recommendation = 'reject';
      confidence = 0.85;
    }

    return {
      deploymentId,
      modelId: deployment.config.modelId,
      analysisDate: new Date(),
      totalSamples: metrics.shadowedRequests,
      matchRate: metrics.matchRate,
      avgSimilarity: comparisons.length > 0
        ? comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length
        : 0,
      latencyComparison: {
        shadowFaster,
        productionFaster,
        avgDifferenceMs: comparisons.length > 0 ? totalDiff / comparisons.length : 0,
      },
      divergencePatterns,
      recommendation,
      confidence,
    };
  }

  /**
   * Get service statistics
   */
  getStats(): ShadowStats {
    const deployments = Array.from(this.deployments.values());
    const completed = deployments.filter(d => d.status === 'completed');

    const totalMatchRate = completed.length > 0
      ? completed.reduce((sum, d) => sum + d.metrics.matchRate, 0) / completed.length
      : 0;

    const avgOverhead = completed.length > 0
      ? completed.reduce((sum, d) => sum + d.metrics.latencyOverhead, 0) / completed.length
      : 0;

    return {
      activeDeployments: deployments.filter(d => d.status === 'active').length,
      completedDeployments: completed.length,
      totalShadowedRequests: this.totalShadowedRequests,
      overallMatchRate: totalMatchRate,
      avgLatencyOverhead: avgOverhead,
    };
  }

  // Private methods

  private createEmptyMetrics(): ShadowMetrics {
    return {
      totalRequests: 0,
      shadowedRequests: 0,
      matchingPredictions: 0,
      divergentPredictions: 0,
      shadowErrors: 0,
      productionErrors: 0,
      shadowLatencyAvg: 0,
      shadowLatencyP95: 0,
      productionLatencyAvg: 0,
      productionLatencyP95: 0,
      matchRate: 0,
      latencyOverhead: 0,
    };
  }

  private async runShadowPrediction(
    deployment: ShadowDeployment,
    request: PredictionRequest,
    comparison: ComparisonResult
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const shadowResponse = await modelServingService.predict({
        ...request,
        modelVersion: deployment.config.shadowVersion,
      });

      comparison.shadowResponse = shadowResponse;
      comparison.latencyDiff = shadowResponse.latencyMs - comparison.productionResponse.latencyMs;

      // Record shadow latency
      const shadowLatencies = this.shadowLatencies.get(deployment.id) || [];
      shadowLatencies.push(shadowResponse.latencyMs);
      if (shadowLatencies.length > 10000) shadowLatencies.shift();
      this.shadowLatencies.set(deployment.id, shadowLatencies);

      // Compare outputs
      const { match, similarity } = this.compareOutputs(
        comparison.productionResponse.outputs,
        shadowResponse.outputs,
        deployment.config.comparisonType,
        deployment.config.comparisonThreshold
      );

      comparison.match = match;
      comparison.similarity = similarity;

      if (match) {
        deployment.metrics.matchingPredictions++;
      } else {
        deployment.metrics.divergentPredictions++;

        // Record divergence
        const divergence = this.createDivergenceRecord(
          request,
          comparison.productionResponse.outputs,
          shadowResponse.outputs,
          similarity
        );
        deployment.divergences.push(divergence);

        // Trim divergences
        if (deployment.divergences.length > this.config.maxDivergenceHistory) {
          deployment.divergences.shift();
        }
      }

      // Store comparison
      if (deployment.config.storeResults) {
        deployment.comparisons.push(comparison);
        if (deployment.comparisons.length > this.config.maxComparisonHistory) {
          deployment.comparisons.shift();
        }
      }

      // Update metrics
      this.updateMetrics(deployment);

    } catch (error) {
      deployment.metrics.shadowErrors++;
      comparison.shadowError = error instanceof Error ? error.message : String(error);
      this.updateMetrics(deployment);
    }

    // Check if ready to complete
    if (deployment.metrics.shadowedRequests >= deployment.config.minSamples) {
      // Don't auto-complete, but emit event
      this.emit('minSamplesReached', deployment);
    }
  }

  private compareOutputs(
    production: Record<string, unknown>,
    shadow: Record<string, unknown>,
    comparisonType: ComparisonType,
    threshold: number
  ): { match: boolean; similarity: number } {
    switch (comparisonType) {
      case 'exact':
        const exactMatch = JSON.stringify(production) === JSON.stringify(shadow);
        return { match: exactMatch, similarity: exactMatch ? 1 : 0 };

      case 'threshold':
        // Compare numeric outputs with threshold
        const prodValues = this.extractNumericValues(production);
        const shadowValues = this.extractNumericValues(shadow);
        const thresholdSimilarity = this.calculateNumericSimilarity(prodValues, shadowValues, threshold);
        return { match: thresholdSimilarity >= threshold, similarity: thresholdSimilarity };

      case 'similarity':
      default:
        const similarity = this.calculateOutputSimilarity(production, shadow);
        return { match: similarity >= threshold, similarity };
    }
  }

  private extractNumericValues(obj: Record<string, unknown>): number[] {
    const values: number[] = [];

    function extract(val: unknown): void {
      if (typeof val === 'number') {
        values.push(val);
      } else if (Array.isArray(val)) {
        val.forEach(extract);
      } else if (typeof val === 'object' && val !== null) {
        Object.values(val).forEach(extract);
      }
    }

    extract(obj);
    return values;
  }

  private calculateNumericSimilarity(a: number[], b: number[], _threshold: number): number {
    if (a.length !== b.length) return 0;
    if (a.length === 0) return 1;

    let totalDiff = 0;
    for (let i = 0; i < a.length; i++) {
      const maxVal = Math.max(Math.abs(a[i]), Math.abs(b[i]), 1);
      const diff = Math.abs(a[i] - b[i]) / maxVal;
      totalDiff += diff;
    }

    return Math.max(0, 1 - (totalDiff / a.length));
  }

  private calculateOutputSimilarity(a: Record<string, unknown>, b: Record<string, unknown>): number {
    const aStr = JSON.stringify(a);
    const bStr = JSON.stringify(b);

    if (aStr === bStr) return 1;

    // Simple Jaccard similarity on keys
    const aKeys = new Set(Object.keys(a));
    const bKeys = new Set(Object.keys(b));

    const intersection = new Set([...aKeys].filter(k => bKeys.has(k)));
    const union = new Set([...aKeys, ...bKeys]);

    const keySimilarity = intersection.size / union.size;

    // Check value similarity for common keys
    let valueSimilarity = 0;
    for (const key of intersection) {
      const aVal = JSON.stringify(a[key]);
      const bVal = JSON.stringify(b[key]);
      if (aVal === bVal) valueSimilarity += 1;
    }
    valueSimilarity = intersection.size > 0 ? valueSimilarity / intersection.size : 0;

    return (keySimilarity + valueSimilarity) / 2;
  }

  private createDivergenceRecord(
    request: PredictionRequest,
    production: Record<string, unknown>,
    shadow: Record<string, unknown>,
    similarity: number
  ): DivergenceRecord {
    // Determine divergence type and severity
    let divergenceType = 'value_difference';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (Object.keys(production).length !== Object.keys(shadow).length) {
      divergenceType = 'structure_difference';
      severity = 'high';
    } else if (similarity < 0.5) {
      divergenceType = 'major_difference';
      severity = 'critical';
    } else if (similarity < 0.8) {
      divergenceType = 'significant_difference';
      severity = 'medium';
    }

    return {
      id: `div-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      request,
      productionOutput: production,
      shadowOutput: shadow,
      divergenceType,
      severity,
      details: `Similarity: ${(similarity * 100).toFixed(2)}%`,
    };
  }

  private updateMetrics(deployment: ShadowDeployment): void {
    const { metrics } = deployment;

    // Calculate match rate
    const totalComparisons = metrics.matchingPredictions + metrics.divergentPredictions;
    metrics.matchRate = totalComparisons > 0
      ? metrics.matchingPredictions / totalComparisons
      : 0;

    // Calculate latencies
    const shadowLatencies = this.shadowLatencies.get(deployment.id) || [];
    const prodLatencies = this.productionLatencies.get(deployment.id) || [];

    metrics.shadowLatencyAvg = this.calculateAverage(shadowLatencies);
    metrics.shadowLatencyP95 = this.calculatePercentile(shadowLatencies, 95);
    metrics.productionLatencyAvg = this.calculateAverage(prodLatencies);
    metrics.productionLatencyP95 = this.calculatePercentile(prodLatencies, 95);

    // Calculate latency overhead
    metrics.latencyOverhead = metrics.productionLatencyAvg > 0
      ? ((metrics.shadowLatencyAvg - metrics.productionLatencyAvg) / metrics.productionLatencyAvg) * 100
      : 0;

    deployment.lastUpdatedAt = new Date();
  }

  private completeShadow(deploymentId: string, reason: string): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;

    deployment.status = 'completed';
    deployment.completedAt = new Date();
    deployment.lastUpdatedAt = new Date();

    // Clear timer
    const timer = this.durationTimers.get(deploymentId);
    if (timer) {
      clearTimeout(timer);
      this.durationTimers.delete(deploymentId);
    }

    this.emit('shadowCompleted', { deployment, reason });
    console.log(`[ShadowDeployment] Completed shadow ${deploymentId}: ${reason}`);
  }

  private runPeriodicAnalysis(): void {
    for (const deployment of this.deployments.values()) {
      if (deployment.status !== 'active') continue;

      // Emit metrics update
      this.emit('metricsUpdate', {
        deploymentId: deployment.id,
        metrics: deployment.metrics,
      });

      // Check for concerning patterns
      if (deployment.metrics.matchRate < 0.9 && deployment.metrics.shadowedRequests >= 100) {
        this.emit('lowMatchRate', {
          deploymentId: deployment.id,
          matchRate: deployment.metrics.matchRate,
        });
      }
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
export const shadowDeploymentService = new ShadowDeploymentService();

// Factory function
export function createShadowDeploymentService(): ShadowDeploymentService {
  return new ShadowDeploymentService();
}
