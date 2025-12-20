/**
 * Model Health Check Service
 *
 * Proactive health monitoring for ML models:
 * - Liveness and readiness probes
 * - Dependency health checks
 * - Self-healing capabilities
 * - Health aggregation across services
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type CheckType = 'liveness' | 'readiness' | 'dependency' | 'performance' | 'custom';
export type HealingAction = 'restart' | 'reload' | 'scale_up' | 'fallback' | 'alert' | 'none';

export interface HealthCheck {
  id: string;
  name: string;
  type: CheckType;
  targetId: string;
  targetType: 'model' | 'service' | 'endpoint' | 'dependency';
  intervalMs: number;
  timeoutMs: number;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
  isEnabled: boolean;
  checkFn?: () => Promise<HealthCheckResult>;
  metadata: Record<string, unknown>;
}

export interface HealthCheckResult {
  checkId: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

export interface ModelHealthStatus {
  modelId: string;
  version: string;
  overallStatus: HealthStatus;
  checks: HealthCheckResult[];
  lastUpdated: Date;
  uptime: number;
  metrics: {
    avgLatencyMs: number;
    successRate: number;
    errorRate: number;
    requestsPerSecond: number;
  };
}

export interface DependencyHealth {
  name: string;
  type: 'database' | 'cache' | 'external_api' | 'storage' | 'queue' | 'ml_service';
  status: HealthStatus;
  latencyMs: number;
  lastChecked: Date;
  details?: Record<string, unknown>;
}

export interface HealingRule {
  id: string;
  name: string;
  targetId: string;
  condition: HealingCondition;
  action: HealingAction;
  cooldownMinutes: number;
  maxAttempts: number;
  isEnabled: boolean;
  metadata: Record<string, unknown>;
}

export interface HealingCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number;
}

export interface HealingEvent {
  id: string;
  ruleId: string;
  targetId: string;
  action: HealingAction;
  reason: string;
  result: 'success' | 'failure' | 'pending';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AggregatedHealth {
  overall: HealthStatus;
  models: ModelHealthStatus[];
  dependencies: DependencyHealth[];
  healingEvents: HealingEvent[];
  lastUpdated: Date;
  summary: {
    totalModels: number;
    healthyModels: number;
    degradedModels: number;
    unhealthyModels: number;
    totalDependencies: number;
    healthyDependencies: number;
  };
}

export interface HealthCheckStats {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgLatencyMs: number;
  checksByType: Record<CheckType, number>;
  checksByStatus: Record<HealthStatus, number>;
}

// ============================================================================
// Model Health Check Service
// ============================================================================

export class ModelHealthCheckService extends EventEmitter {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private checkResults: Map<string, HealthCheckResult> = new Map();
  private modelHealth: Map<string, ModelHealthStatus> = new Map();
  private dependencies: Map<string, DependencyHealth> = new Map();
  private healingRules: Map<string, HealingRule> = new Map();
  private healingEvents: Map<string, HealingEvent> = new Map();
  private healingCooldowns: Map<string, Date> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private consecutiveCounts: Map<string, { successes: number; failures: number }> = new Map();

  constructor() {
    super();
  }

  // ============================================================================
  // Health Check Registration
  // ============================================================================

  registerCheck(config: Omit<HealthCheck, 'id'>): HealthCheck {
    const id = uuidv4();
    const check: HealthCheck = { ...config, id };

    this.healthChecks.set(id, check);
    this.consecutiveCounts.set(id, { successes: 0, failures: 0 });

    if (check.isEnabled) {
      this.startCheck(id);
    }

    this.emit('checkRegistered', check);
    return check;
  }

  unregisterCheck(checkId: string): boolean {
    this.stopCheck(checkId);
    const deleted = this.healthChecks.delete(checkId);
    this.checkResults.delete(checkId);
    this.consecutiveCounts.delete(checkId);
    if (deleted) {
      this.emit('checkUnregistered', { checkId });
    }
    return deleted;
  }

  updateCheck(checkId: string, updates: Partial<HealthCheck>): HealthCheck | null {
    const check = this.healthChecks.get(checkId);
    if (!check) return null;

    const updatedCheck = { ...check, ...updates, id: check.id };
    this.healthChecks.set(checkId, updatedCheck);

    // Restart if interval changed
    if (updates.intervalMs && updates.intervalMs !== check.intervalMs) {
      this.stopCheck(checkId);
      if (updatedCheck.isEnabled) {
        this.startCheck(checkId);
      }
    }

    return updatedCheck;
  }

  // ============================================================================
  // Check Execution
  // ============================================================================

  private startCheck(checkId: string): void {
    const check = this.healthChecks.get(checkId);
    if (!check) return;

    // Run immediately
    this.runCheck(checkId);

    // Schedule periodic runs
    const interval = setInterval(() => {
      this.runCheck(checkId);
    }, check.intervalMs);

    this.checkIntervals.set(checkId, interval);
  }

  private stopCheck(checkId: string): void {
    const interval = this.checkIntervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(checkId);
    }
  }

  async runCheck(checkId: string): Promise<HealthCheckResult> {
    const check = this.healthChecks.get(checkId);
    if (!check) {
      throw new Error(`Health check not found: ${checkId}`);
    }

    const startTime = Date.now();
    let status: HealthStatus = 'unknown';
    let message: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      if (check.checkFn) {
        const customResult = await Promise.race([
          check.checkFn(),
          this.timeout(check.timeoutMs),
        ]);

        if (customResult) {
          status = customResult.status;
          message = customResult.message;
          details = customResult.details;
        } else {
          status = 'unhealthy';
          message = 'Health check timed out';
        }
      } else {
        // Default check based on type
        const result = await this.performDefaultCheck(check);
        status = result.status;
        message = result.message;
        details = result.details;
      }
    } catch (error) {
      status = 'unhealthy';
      message = error instanceof Error ? error.message : 'Unknown error';
    }

    const latencyMs = Date.now() - startTime;
    const counts = this.consecutiveCounts.get(checkId) || { successes: 0, failures: 0 };

    if (status === 'healthy') {
      counts.successes++;
      counts.failures = 0;
    } else {
      counts.failures++;
      counts.successes = 0;
    }

    this.consecutiveCounts.set(checkId, counts);

    const result: HealthCheckResult = {
      checkId,
      status,
      latencyMs,
      message,
      details,
      timestamp: new Date(),
      consecutiveSuccesses: counts.successes,
      consecutiveFailures: counts.failures,
    };

    this.checkResults.set(checkId, result);
    this.updateModelHealth(check.targetId, result);
    this.evaluateHealingRules(check.targetId, result);
    this.emit('checkCompleted', result);

    return result;
  }

  private async performDefaultCheck(check: HealthCheck): Promise<{
    status: HealthStatus;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    // Simulate different check types
    switch (check.type) {
      case 'liveness':
        // Simple liveness - just check if responding
        return {
          status: 'healthy',
          message: 'Service is alive',
          details: { type: 'liveness' },
        };

      case 'readiness':
        // Readiness - check if ready to serve requests
        return {
          status: 'healthy',
          message: 'Service is ready',
          details: { type: 'readiness', warmupComplete: true },
        };

      case 'dependency':
        // Check dependency status
        const dep = this.dependencies.get(check.targetId);
        return {
          status: dep?.status || 'unknown',
          message: `Dependency ${check.targetId} status`,
          details: { dependency: check.targetId },
        };

      case 'performance':
        // Performance check - simulated
        const latency = 20 + Math.random() * 80;
        const status: HealthStatus = latency > 100 ? 'degraded' : 'healthy';
        return {
          status,
          message: `Performance check: ${latency.toFixed(2)}ms latency`,
          details: { latencyMs: latency },
        };

      default:
        return {
          status: 'healthy',
          message: 'Custom check passed',
        };
    }
  }

  private timeout(ms: number): Promise<null> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  // ============================================================================
  // Model Health Management
  // ============================================================================

  private updateModelHealth(targetId: string, result: HealthCheckResult): void {
    let modelHealth = this.modelHealth.get(targetId);

    if (!modelHealth) {
      modelHealth = {
        modelId: targetId,
        version: '1.0.0',
        overallStatus: 'unknown',
        checks: [],
        lastUpdated: new Date(),
        uptime: 100,
        metrics: {
          avgLatencyMs: 0,
          successRate: 100,
          errorRate: 0,
          requestsPerSecond: 0,
        },
      };
    }

    // Update or add check result
    const existingIndex = modelHealth.checks.findIndex(c => c.checkId === result.checkId);
    if (existingIndex >= 0) {
      modelHealth.checks[existingIndex] = result;
    } else {
      modelHealth.checks.push(result);
    }

    // Calculate overall status
    modelHealth.overallStatus = this.calculateOverallStatus(modelHealth.checks);
    modelHealth.lastUpdated = new Date();

    this.modelHealth.set(targetId, modelHealth);
    this.emit('modelHealthUpdated', modelHealth);
  }

  private calculateOverallStatus(checks: HealthCheckResult[]): HealthStatus {
    if (checks.length === 0) return 'unknown';

    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;

    if (unhealthy > 0) return 'unhealthy';
    if (degraded > 0) return 'degraded';

    return 'healthy';
  }

  getModelHealth(modelId: string): ModelHealthStatus | undefined {
    return this.modelHealth.get(modelId);
  }

  getAllModelHealth(): ModelHealthStatus[] {
    return Array.from(this.modelHealth.values());
  }

  // ============================================================================
  // Dependency Health
  // ============================================================================

  registerDependency(config: Omit<DependencyHealth, 'lastChecked'>): DependencyHealth {
    const dependency: DependencyHealth = {
      ...config,
      lastChecked: new Date(),
    };

    this.dependencies.set(config.name, dependency);
    this.emit('dependencyRegistered', dependency);

    return dependency;
  }

  updateDependencyHealth(name: string, status: HealthStatus, latencyMs: number, details?: Record<string, unknown>): void {
    const dependency = this.dependencies.get(name);
    if (dependency) {
      dependency.status = status;
      dependency.latencyMs = latencyMs;
      dependency.lastChecked = new Date();
      dependency.details = details;

      this.emit('dependencyHealthUpdated', dependency);
    }
  }

  getDependencyHealth(name: string): DependencyHealth | undefined {
    return this.dependencies.get(name);
  }

  getAllDependencyHealth(): DependencyHealth[] {
    return Array.from(this.dependencies.values());
  }

  // ============================================================================
  // Self-Healing
  // ============================================================================

  registerHealingRule(config: Omit<HealingRule, 'id'>): HealingRule {
    const id = uuidv4();
    const rule: HealingRule = { ...config, id };

    this.healingRules.set(id, rule);
    this.emit('healingRuleRegistered', rule);

    return rule;
  }

  private evaluateHealingRules(targetId: string, result: HealthCheckResult): void {
    for (const rule of this.healingRules.values()) {
      if (!rule.isEnabled || rule.targetId !== targetId) continue;

      const shouldHeal = this.checkHealingCondition(rule.condition, result);

      if (shouldHeal) {
        const cooldownKey = `${rule.id}:${targetId}`;
        const lastHealing = this.healingCooldowns.get(cooldownKey);
        const now = new Date();

        if (!lastHealing || now.getTime() - lastHealing.getTime() > rule.cooldownMinutes * 60000) {
          this.executeHealing(rule, result);
          this.healingCooldowns.set(cooldownKey, now);
        }
      }
    }
  }

  private checkHealingCondition(condition: HealingCondition, result: HealthCheckResult): boolean {
    let metricValue: number;

    switch (condition.metric) {
      case 'consecutive_failures':
        metricValue = result.consecutiveFailures;
        break;
      case 'latency':
        metricValue = result.latencyMs;
        break;
      case 'status':
        metricValue = result.status === 'unhealthy' ? 1 : 0;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'gt':
        return metricValue > condition.value;
      case 'lt':
        return metricValue < condition.value;
      case 'gte':
        return metricValue >= condition.value;
      case 'lte':
        return metricValue <= condition.value;
      case 'eq':
        return metricValue === condition.value;
      default:
        return false;
    }
  }

  private async executeHealing(rule: HealingRule, trigger: HealthCheckResult): Promise<void> {
    const event: HealingEvent = {
      id: uuidv4(),
      ruleId: rule.id,
      targetId: rule.targetId,
      action: rule.action,
      reason: `Triggered by ${trigger.checkId}: ${trigger.message}`,
      result: 'pending',
      startedAt: new Date(),
    };

    this.healingEvents.set(event.id, event);
    this.emit('healingStarted', event);

    try {
      switch (rule.action) {
        case 'restart':
          await this.performRestart(rule.targetId);
          break;
        case 'reload':
          await this.performReload(rule.targetId);
          break;
        case 'scale_up':
          await this.performScaleUp(rule.targetId);
          break;
        case 'fallback':
          await this.performFallback(rule.targetId);
          break;
        case 'alert':
          await this.performAlert(rule.targetId, trigger);
          break;
        case 'none':
          // Just log, no action
          break;
      }

      event.result = 'success';
      event.completedAt = new Date();
      this.emit('healingCompleted', event);
    } catch (error) {
      event.result = 'failure';
      event.completedAt = new Date();
      event.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('healingFailed', event);
    }
  }

  private async performRestart(_targetId: string): Promise<void> {
    // Simulate restart
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.emit('modelRestarted', { targetId: _targetId });
  }

  private async performReload(_targetId: string): Promise<void> {
    // Simulate reload
    await new Promise(resolve => setTimeout(resolve, 500));
    this.emit('modelReloaded', { targetId: _targetId });
  }

  private async performScaleUp(_targetId: string): Promise<void> {
    // Simulate scale up
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.emit('modelScaledUp', { targetId: _targetId });
  }

  private async performFallback(_targetId: string): Promise<void> {
    // Switch to fallback model
    await new Promise(resolve => setTimeout(resolve, 100));
    this.emit('fallbackActivated', { targetId: _targetId });
  }

  private async performAlert(_targetId: string, trigger: HealthCheckResult): Promise<void> {
    // Send alert
    this.emit('healingAlert', { targetId: _targetId, trigger });
  }

  getHealingEvents(targetId?: string): HealingEvent[] {
    let events = Array.from(this.healingEvents.values());
    if (targetId) {
      events = events.filter(e => e.targetId === targetId);
    }
    return events.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  // ============================================================================
  // Aggregated Health
  // ============================================================================

  getAggregatedHealth(): AggregatedHealth {
    const models = this.getAllModelHealth();
    const dependencies = this.getAllDependencyHealth();
    const healingEvents = this.getHealingEvents();

    const healthyModels = models.filter(m => m.overallStatus === 'healthy').length;
    const degradedModels = models.filter(m => m.overallStatus === 'degraded').length;
    const unhealthyModels = models.filter(m => m.overallStatus === 'unhealthy').length;
    const healthyDependencies = dependencies.filter(d => d.status === 'healthy').length;

    let overall: HealthStatus = 'healthy';
    if (unhealthyModels > 0 || dependencies.some(d => d.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (degradedModels > 0 || dependencies.some(d => d.status === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      models,
      dependencies,
      healingEvents: healingEvents.slice(0, 10),
      lastUpdated: new Date(),
      summary: {
        totalModels: models.length,
        healthyModels,
        degradedModels,
        unhealthyModels,
        totalDependencies: dependencies.length,
        healthyDependencies,
      },
    };
  }

  // ============================================================================
  // Probes (Kubernetes-style)
  // ============================================================================

  async livenessProbe(modelId: string): Promise<{ alive: boolean; latencyMs: number }> {
    const startTime = Date.now();
    const health = this.modelHealth.get(modelId);

    const alive = health ? health.overallStatus !== 'unhealthy' : true;

    return {
      alive,
      latencyMs: Date.now() - startTime,
    };
  }

  async readinessProbe(modelId: string): Promise<{ ready: boolean; latencyMs: number; details?: Record<string, unknown> }> {
    const startTime = Date.now();
    const health = this.modelHealth.get(modelId);

    if (!health) {
      return {
        ready: false,
        latencyMs: Date.now() - startTime,
        details: { reason: 'Model not registered' },
      };
    }

    const ready = health.overallStatus === 'healthy';
    const failedChecks = health.checks.filter(c => c.status !== 'healthy');

    return {
      ready,
      latencyMs: Date.now() - startTime,
      details: {
        status: health.overallStatus,
        failedChecks: failedChecks.map(c => c.checkId),
      },
    };
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(): HealthCheckStats {
    const results = Array.from(this.checkResults.values());

    const stats: HealthCheckStats = {
      totalChecks: results.length,
      successfulChecks: results.filter(r => r.status === 'healthy').length,
      failedChecks: results.filter(r => r.status === 'unhealthy').length,
      avgLatencyMs: results.length > 0
        ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length
        : 0,
      checksByType: {
        liveness: 0,
        readiness: 0,
        dependency: 0,
        performance: 0,
        custom: 0,
      },
      checksByStatus: {
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        unknown: 0,
      },
    };

    for (const result of results) {
      stats.checksByStatus[result.status]++;
    }

    for (const check of this.healthChecks.values()) {
      stats.checksByType[check.type]++;
    }

    return stats;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  startAllChecks(): void {
    for (const check of this.healthChecks.values()) {
      if (check.isEnabled && !this.checkIntervals.has(check.id)) {
        this.startCheck(check.id);
      }
    }
    this.emit('allChecksStarted');
  }

  stopAllChecks(): void {
    for (const checkId of this.checkIntervals.keys()) {
      this.stopCheck(checkId);
    }
    this.emit('allChecksStopped');
  }

  reset(): void {
    this.stopAllChecks();
    this.healthChecks.clear();
    this.checkResults.clear();
    this.modelHealth.clear();
    this.dependencies.clear();
    this.healingRules.clear();
    this.healingEvents.clear();
    this.healingCooldowns.clear();
    this.consecutiveCounts.clear();
    this.emit('reset');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const modelHealthCheckService = new ModelHealthCheckService();
export default modelHealthCheckService;
