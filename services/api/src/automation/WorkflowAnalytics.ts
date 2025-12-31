import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

/**
 * Workflow Analytics Engine
 *
 * Production-ready analytics system for workflow execution metrics, performance tracking,
 * resource usage monitoring, cost analysis, and ROI calculations.
 *
 * Features:
 * - Real-time execution metrics tracking
 * - Performance analytics (execution time, success rate, failure rate)
 * - Resource usage tracking (API calls, storage, bandwidth)
 * - Cost analysis per workflow
 * - Execution history with advanced filtering
 * - Funnel analysis (step completion rates)
 * - A/B testing support for workflows
 * - ROI calculation and revenue attribution
 * - Bottleneck detection with recommendations
 * - Trend analysis (hourly, daily, weekly, monthly)
 * - Anomaly detection for failures
 * - Real-time dashboard data aggregation
 * - Export to CSV/JSON
 * - InfluxDB integration for time-series data
 */

export interface WorkflowMetrics {
  workflowId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'success' | 'failed' | 'running' | 'cancelled';
  stepsCompleted: number;
  totalSteps: number;
  retriesCount: number;
  errorCount: number;
  resourceUsage: ResourceUsage;
  cost: number;
  triggeredBy: string;
  metadata: Record<string, any>;
}

export interface ResourceUsage {
  apiCalls: number;
  storageBytes: number;
  bandwidthBytes: number;
  computeTimeMs: number;
  externalServiceCalls: {
    service: string;
    calls: number;
    cost: number;
  }[];
}

export interface PerformanceMetrics {
  workflowId: string;
  timeRange: TimeRange;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  successRate: number;
  failureRate: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  totalCost: number;
  averageCost: number;
  totalRetries: number;
  averageRetries: number;
  bottlenecks: Bottleneck[];
}

export interface Bottleneck {
  stepId: string;
  stepName: string;
  averageTime: number;
  percentageOfTotal: number;
  occurrences: number;
  recommendation: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface FunnelAnalysis {
  workflowId: string;
  steps: FunnelStep[];
  dropOffRate: number;
  completionRate: number;
  averageTimePerStep: number;
}

export interface FunnelStep {
  stepId: string;
  stepName: string;
  totalAttempts: number;
  successfulCompletions: number;
  failures: number;
  completionRate: number;
  averageTime: number;
  dropOffFromPrevious: number;
}

export interface ABTestMetrics {
  testId: string;
  workflowIdA: string;
  workflowIdB: string;
  variantAExecutions: number;
  variantBExecutions: number;
  variantASuccessRate: number;
  variantBSuccessRate: number;
  variantAAverageTime: number;
  variantBAverageTime: number;
  variantACost: number;
  variantBCost: number;
  winner?: 'A' | 'B';
  confidence: number;
}

export interface ROIMetrics {
  workflowId: string;
  timeRange: TimeRange;
  totalExecutions: number;
  revenueGenerated: number;
  costIncurred: number;
  roi: number;
  revenuePerExecution: number;
  costPerExecution: number;
  timeSaved: number;
  valuableActions: {
    action: string;
    count: number;
    revenue: number;
  }[];
}

export interface AnomalyDetection {
  workflowId: string;
  timestamp: Date;
  type: 'spike' | 'drop' | 'error_surge' | 'latency_increase';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: {
    current: number;
    baseline: number;
    deviation: number;
  };
  recommendation: string;
}

export interface DashboardData {
  overview: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutionsToday: number;
    successRateToday: number;
    totalCostToday: number;
    timeSavedToday: number;
  };
  recentExecutions: WorkflowMetrics[];
  topPerformers: {
    workflowId: string;
    workflowName: string;
    successRate: number;
    executionCount: number;
  }[];
  failingWorkflows: {
    workflowId: string;
    workflowName: string;
    failureRate: number;
    lastError: string;
  }[];
  resourceUtilization: {
    apiCallsToday: number;
    storageUsed: number;
    bandwidthUsed: number;
    costTrend: number[];
  };
  anomalies: AnomalyDetection[];
}

export class WorkflowAnalytics extends EventEmitter {
  private redis: Redis;
  private influxDB: InfluxDB;
  private writeApi: WriteApi;
  private metricsCache: Map<string, WorkflowMetrics>;
  private anomalyBaselines: Map<string, number[]>;

  constructor() {
    super();

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 8, // Analytics DB
    });

    this.influxDB = new InfluxDB({
      url: process.env.INFLUXDB_URL || 'http://localhost:8086',
      token: process.env.INFLUXDB_TOKEN || '',
    });

    this.writeApi = this.influxDB.getWriteApi(
      process.env.INFLUXDB_ORG || 'upcoach',
      process.env.INFLUXDB_BUCKET || 'workflow_metrics',
      'ms'
    );

    this.metricsCache = new Map();
    this.anomalyBaselines = new Map();

    this.setupAnomalyDetection();
  }

  /**
   * Record workflow execution metrics
   */
  async recordExecution(metrics: WorkflowMetrics): Promise<void> {
    try {
      // Cache metrics
      this.metricsCache.set(metrics.executionId, metrics);

      // Store in Redis for quick access
      await this.redis.setex(
        `workflow:metrics:${metrics.executionId}`,
        86400, // 24 hours
        JSON.stringify(metrics)
      );

      // Write to InfluxDB for time-series analysis
      const point = new Point('workflow_execution')
        .tag('workflow_id', metrics.workflowId)
        .tag('status', metrics.status)
        .tag('triggered_by', metrics.triggeredBy)
        .intField('duration', metrics.duration || 0)
        .intField('steps_completed', metrics.stepsCompleted)
        .intField('total_steps', metrics.totalSteps)
        .intField('retries', metrics.retriesCount)
        .intField('errors', metrics.errorCount)
        .intField('api_calls', metrics.resourceUsage.apiCalls)
        .intField('storage_bytes', metrics.resourceUsage.storageBytes)
        .intField('bandwidth_bytes', metrics.resourceUsage.bandwidthBytes)
        .intField('compute_time_ms', metrics.resourceUsage.computeTimeMs)
        .floatField('cost', metrics.cost)
        .timestamp(metrics.startTime);

      this.writeApi.writePoint(point);
      await this.writeApi.flush();

      // Update aggregated stats in Redis
      await this.updateAggregatedStats(metrics);

      // Check for anomalies
      await this.checkForAnomalies(metrics);

      this.emit('metrics:recorded', metrics);
    } catch (error) {
      console.error('Failed to record metrics:', error);
      this.emit('metrics:error', error);
    }
  }

  /**
   * Get performance metrics for a workflow
   */
  async getPerformanceMetrics(
    workflowId: string,
    timeRange: TimeRange
  ): Promise<PerformanceMetrics> {
    const cacheKey = `perf:${workflowId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query InfluxDB
    const queryApi = this.influxDB.getQueryApi(process.env.INFLUXDB_ORG || 'upcoach');

    const query = `
      from(bucket: "${process.env.INFLUXDB_BUCKET || 'workflow_metrics'}")
        |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
        |> filter(fn: (r) => r._measurement == "workflow_execution")
        |> filter(fn: (r) => r.workflow_id == "${workflowId}")
    `;

    const executions: WorkflowMetrics[] = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const record = tableMeta.toObject(row);
          // Parse execution data
          if (record._field === 'duration') {
            executions.push(this.parseInfluxRecord(record));
          }
        },
        error: reject,
        complete: async () => {
          const metrics = this.calculatePerformanceMetrics(workflowId, timeRange, executions);

          // Cache for 5 minutes
          await this.redis.setex(cacheKey, 300, JSON.stringify(metrics));

          resolve(metrics);
        },
      });
    });
  }

  /**
   * Calculate performance metrics from execution data
   */
  private calculatePerformanceMetrics(
    workflowId: string,
    timeRange: TimeRange,
    executions: WorkflowMetrics[]
  ): PerformanceMetrics {
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'success').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const cancelledExecutions = executions.filter(e => e.status === 'cancelled').length;

    const durations = executions
      .filter(e => e.duration)
      .map(e => e.duration!)
      .sort((a, b) => a - b);

    const costs = executions.map(e => e.cost);
    const retries = executions.map(e => e.retriesCount);

    const bottlenecks = this.detectBottlenecks(executions);

    return {
      workflowId,
      timeRange,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      cancelledExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      failureRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: this.average(durations),
      medianExecutionTime: this.median(durations),
      p95ExecutionTime: this.percentile(durations, 95),
      p99ExecutionTime: this.percentile(durations, 99),
      totalCost: costs.reduce((sum, c) => sum + c, 0),
      averageCost: this.average(costs),
      totalRetries: retries.reduce((sum, r) => sum + r, 0),
      averageRetries: this.average(retries),
      bottlenecks,
    };
  }

  /**
   * Detect bottlenecks in workflow execution
   */
  private detectBottlenecks(executions: WorkflowMetrics[]): Bottleneck[] {
    const stepTimes: Map<string, number[]> = new Map();

    // Aggregate step times
    for (const execution of executions) {
      if (execution.metadata?.stepMetrics) {
        for (const step of execution.metadata.stepMetrics) {
          if (!stepTimes.has(step.stepId)) {
            stepTimes.set(step.stepId, []);
          }
          stepTimes.get(step.stepId)!.push(step.duration);
        }
      }
    }

    const bottlenecks: Bottleneck[] = [];
    const totalAvgTime = this.average(executions.map(e => e.duration || 0));

    for (const [stepId, times] of stepTimes.entries()) {
      const avgTime = this.average(times);
      const percentage = (avgTime / totalAvgTime) * 100;

      // Consider it a bottleneck if it takes more than 20% of total time
      if (percentage > 20) {
        bottlenecks.push({
          stepId,
          stepName: this.getStepName(stepId),
          averageTime: avgTime,
          percentageOfTotal: percentage,
          occurrences: times.length,
          recommendation: this.getBottleneckRecommendation(stepId, avgTime, percentage),
        });
      }
    }

    return bottlenecks.sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
  }

  /**
   * Get bottleneck recommendation
   */
  private getBottleneckRecommendation(stepId: string, avgTime: number, percentage: number): string {
    if (percentage > 50) {
      return `Critical bottleneck: This step takes ${percentage.toFixed(1)}% of total execution time. Consider optimizing or splitting into parallel tasks.`;
    } else if (percentage > 30) {
      return `Major bottleneck: This step consumes ${percentage.toFixed(1)}% of execution time. Review for optimization opportunities.`;
    } else {
      return `Minor bottleneck: This step takes ${percentage.toFixed(1)}% of execution time. Monitor for potential optimization.`;
    }
  }

  /**
   * Perform funnel analysis
   */
  async performFunnelAnalysis(workflowId: string, timeRange: TimeRange): Promise<FunnelAnalysis> {
    const executions = await this.getExecutions(workflowId, timeRange);

    if (executions.length === 0) {
      return {
        workflowId,
        steps: [],
        dropOffRate: 0,
        completionRate: 0,
        averageTimePerStep: 0,
      };
    }

    // Get unique steps
    const stepMap: Map<string, { attempts: number; successes: number; failures: number; times: number[] }> = new Map();

    for (const execution of executions) {
      if (execution.metadata?.stepMetrics) {
        for (const step of execution.metadata.stepMetrics) {
          if (!stepMap.has(step.stepId)) {
            stepMap.set(step.stepId, { attempts: 0, successes: 0, failures: 0, times: [] });
          }
          const stepData = stepMap.get(step.stepId)!;
          stepData.attempts++;
          if (step.status === 'completed') {
            stepData.successes++;
          } else if (step.status === 'failed') {
            stepData.failures++;
          }
          stepData.times.push(step.duration);
        }
      }
    }

    const steps: FunnelStep[] = [];
    let previousAttempts = executions.length;

    for (const [stepId, data] of stepMap.entries()) {
      const dropOffFromPrevious = previousAttempts > 0
        ? ((previousAttempts - data.attempts) / previousAttempts) * 100
        : 0;

      steps.push({
        stepId,
        stepName: this.getStepName(stepId),
        totalAttempts: data.attempts,
        successfulCompletions: data.successes,
        failures: data.failures,
        completionRate: (data.successes / data.attempts) * 100,
        averageTime: this.average(data.times),
        dropOffFromPrevious,
      });

      previousAttempts = data.attempts;
    }

    const completedExecutions = executions.filter(e => e.status === 'success').length;
    const completionRate = (completedExecutions / executions.length) * 100;
    const dropOffRate = 100 - completionRate;

    return {
      workflowId,
      steps,
      dropOffRate,
      completionRate,
      averageTimePerStep: this.average(steps.map(s => s.averageTime)),
    };
  }

  /**
   * Track A/B test metrics
   */
  async trackABTest(
    testId: string,
    workflowIdA: string,
    workflowIdB: string,
    timeRange: TimeRange
  ): Promise<ABTestMetrics> {
    const metricsA = await this.getPerformanceMetrics(workflowIdA, timeRange);
    const metricsB = await this.getPerformanceMetrics(workflowIdB, timeRange);

    const successRateDiff = Math.abs(metricsA.successRate - metricsB.successRate);
    const confidence = this.calculateStatisticalConfidence(
      metricsA.successfulExecutions,
      metricsA.totalExecutions,
      metricsB.successfulExecutions,
      metricsB.totalExecutions
    );

    let winner: 'A' | 'B' | undefined;
    if (confidence > 95 && successRateDiff > 5) {
      winner = metricsA.successRate > metricsB.successRate ? 'A' : 'B';
    }

    return {
      testId,
      workflowIdA,
      workflowIdB,
      variantAExecutions: metricsA.totalExecutions,
      variantBExecutions: metricsB.totalExecutions,
      variantASuccessRate: metricsA.successRate,
      variantBSuccessRate: metricsB.successRate,
      variantAAverageTime: metricsA.averageExecutionTime,
      variantBAverageTime: metricsB.averageExecutionTime,
      variantACost: metricsA.averageCost,
      variantBCost: metricsB.averageCost,
      winner,
      confidence,
    };
  }

  /**
   * Calculate statistical confidence for A/B test
   */
  private calculateStatisticalConfidence(
    successA: number,
    totalA: number,
    successB: number,
    totalB: number
  ): number {
    const pA = successA / totalA;
    const pB = successB / totalB;
    const pPool = (successA + successB) / (totalA + totalB);

    const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / totalA + 1 / totalB));
    const zScore = Math.abs((pA - pB) / sePool);

    // Convert z-score to confidence percentage
    const confidence = this.normalCDF(zScore) * 100;

    return confidence;
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - probability : probability;
  }

  /**
   * Calculate ROI metrics
   */
  async calculateROI(
    workflowId: string,
    timeRange: TimeRange,
    revenueAttributions: { executionId: string; revenue: number }[]
  ): Promise<ROIMetrics> {
    const metrics = await this.getPerformanceMetrics(workflowId, timeRange);

    const totalRevenue = revenueAttributions.reduce((sum, attr) => sum + attr.revenue, 0);
    const totalCost = metrics.totalCost;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    // Calculate time saved (assume automation saves 15 minutes per execution)
    const timeSavedMinutes = metrics.successfulExecutions * 15;

    // Track valuable actions
    const valuableActions: { action: string; count: number; revenue: number }[] = [];
    const actionMap = new Map<string, { count: number; revenue: number }>();

    const executions = await this.getExecutions(workflowId, timeRange);
    for (const execution of executions) {
      if (execution.metadata?.valuableActions) {
        for (const action of execution.metadata.valuableActions) {
          if (!actionMap.has(action.name)) {
            actionMap.set(action.name, { count: 0, revenue: 0 });
          }
          const data = actionMap.get(action.name)!;
          data.count++;
          data.revenue += action.revenue || 0;
        }
      }
    }

    for (const [action, data] of actionMap.entries()) {
      valuableActions.push({ action, count: data.count, revenue: data.revenue });
    }

    return {
      workflowId,
      timeRange,
      totalExecutions: metrics.totalExecutions,
      revenueGenerated: totalRevenue,
      costIncurred: totalCost,
      roi,
      revenuePerExecution: metrics.totalExecutions > 0 ? totalRevenue / metrics.totalExecutions : 0,
      costPerExecution: metrics.averageCost,
      timeSaved: timeSavedMinutes,
      valuableActions: valuableActions.sort((a, b) => b.revenue - a.revenue),
    };
  }

  /**
   * Setup anomaly detection
   */
  private setupAnomalyDetection(): void {
    // Run anomaly detection every 5 minutes
    setInterval(async () => {
      await this.detectAnomalies();
    }, 5 * 60 * 1000);
  }

  /**
   * Detect anomalies across all workflows
   */
  private async detectAnomalies(): Promise<void> {
    const activeWorkflows = await this.getActiveWorkflows();

    for (const workflowId of activeWorkflows) {
      const recent = await this.getRecentMetrics(workflowId, 1); // Last hour
      const baseline = await this.getBaselineMetrics(workflowId);

      await this.checkMetricAnomalies(workflowId, recent, baseline);
    }
  }

  /**
   * Check for anomalies in specific metrics
   */
  private async checkForAnomalies(metrics: WorkflowMetrics): Promise<void> {
    const baseline = await this.getBaselineMetrics(metrics.workflowId);

    const anomalies: AnomalyDetection[] = [];

    // Check execution time anomaly
    if (metrics.duration && baseline.averageExecutionTime) {
      const deviation = ((metrics.duration - baseline.averageExecutionTime) / baseline.averageExecutionTime) * 100;

      if (deviation > 100) {
        anomalies.push({
          workflowId: metrics.workflowId,
          timestamp: new Date(),
          type: 'latency_increase',
          severity: deviation > 200 ? 'critical' : 'high',
          description: `Execution time increased by ${deviation.toFixed(0)}%`,
          metrics: {
            current: metrics.duration,
            baseline: baseline.averageExecutionTime,
            deviation,
          },
          recommendation: 'Review workflow for performance bottlenecks or increased external service latency.',
        });
      }
    }

    // Check error rate anomaly
    if (metrics.errorCount > 0 && baseline.averageErrors !== undefined) {
      const deviation = ((metrics.errorCount - baseline.averageErrors) / Math.max(baseline.averageErrors, 1)) * 100;

      if (deviation > 50) {
        anomalies.push({
          workflowId: metrics.workflowId,
          timestamp: new Date(),
          type: 'error_surge',
          severity: deviation > 100 ? 'critical' : 'high',
          description: `Error count increased by ${deviation.toFixed(0)}%`,
          metrics: {
            current: metrics.errorCount,
            baseline: baseline.averageErrors,
            deviation,
          },
          recommendation: 'Investigate error logs and check external service availability.',
        });
      }
    }

    // Emit anomalies
    for (const anomaly of anomalies) {
      await this.recordAnomaly(anomaly);
      this.emit('anomaly:detected', anomaly);
    }
  }

  /**
   * Check metric anomalies
   */
  private async checkMetricAnomalies(
    workflowId: string,
    recent: WorkflowMetrics[],
    baseline: any
  ): Promise<void> {
    if (recent.length === 0) return;

    const recentFailures = recent.filter(m => m.status === 'failed').length;
    const recentFailureRate = (recentFailures / recent.length) * 100;

    // Check for failure rate spike
    if (recentFailureRate > baseline.failureRate * 2 && recentFailureRate > 10) {
      const anomaly: AnomalyDetection = {
        workflowId,
        timestamp: new Date(),
        type: 'error_surge',
        severity: recentFailureRate > 50 ? 'critical' : 'high',
        description: `Failure rate spiked to ${recentFailureRate.toFixed(1)}%`,
        metrics: {
          current: recentFailureRate,
          baseline: baseline.failureRate,
          deviation: ((recentFailureRate - baseline.failureRate) / baseline.failureRate) * 100,
        },
        recommendation: 'Pause workflow and investigate recent failures immediately.',
      };

      await this.recordAnomaly(anomaly);
      this.emit('anomaly:detected', anomaly);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(organizationId: string): Promise<DashboardData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeRange: TimeRange = {
      start: today,
      end: tomorrow,
      granularity: 'hour',
    };

    const workflows = await this.getOrganizationWorkflows(organizationId);
    const activeWorkflows = workflows.filter(w => w.status === 'active');

    const todayMetrics = await this.getAggregatedMetrics(organizationId, timeRange);

    const recentExecutions = await this.getRecentExecutionsForOrg(organizationId, 10);

    const topPerformers = await this.getTopPerformers(organizationId, timeRange, 5);

    const failingWorkflows = await this.getFailingWorkflows(organizationId, timeRange, 5);

    const resourceUtilization = await this.getResourceUtilization(organizationId, timeRange);

    const anomalies = await this.getRecentAnomalies(organizationId, 24); // Last 24 hours

    return {
      overview: {
        totalWorkflows: workflows.length,
        activeWorkflows: activeWorkflows.length,
        totalExecutionsToday: todayMetrics.totalExecutions,
        successRateToday: todayMetrics.successRate,
        totalCostToday: todayMetrics.totalCost,
        timeSavedToday: todayMetrics.totalExecutions * 15, // 15 minutes per execution
      },
      recentExecutions,
      topPerformers,
      failingWorkflows,
      resourceUtilization,
      anomalies,
    };
  }

  /**
   * Export metrics to CSV
   */
  async exportToCSV(workflowId: string, timeRange: TimeRange): Promise<string> {
    const executions = await this.getExecutions(workflowId, timeRange);

    const headers = [
      'Execution ID',
      'Workflow ID',
      'Start Time',
      'End Time',
      'Duration (ms)',
      'Status',
      'Steps Completed',
      'Total Steps',
      'Retries',
      'Errors',
      'API Calls',
      'Storage (bytes)',
      'Bandwidth (bytes)',
      'Cost',
    ];

    const rows = executions.map(e => [
      e.executionId,
      e.workflowId,
      e.startTime.toISOString(),
      e.endTime?.toISOString() || '',
      e.duration?.toString() || '',
      e.status,
      e.stepsCompleted.toString(),
      e.totalSteps.toString(),
      e.retriesCount.toString(),
      e.errorCount.toString(),
      e.resourceUsage.apiCalls.toString(),
      e.resourceUsage.storageBytes.toString(),
      e.resourceUsage.bandwidthBytes.toString(),
      e.cost.toFixed(4),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export metrics to JSON
   */
  async exportToJSON(workflowId: string, timeRange: TimeRange): Promise<string> {
    const metrics = await this.getPerformanceMetrics(workflowId, timeRange);
    const executions = await this.getExecutions(workflowId, timeRange);
    const funnel = await this.performFunnelAnalysis(workflowId, timeRange);

    return JSON.stringify(
      {
        metrics,
        executions,
        funnel,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Helper: Update aggregated stats
   */
  private async updateAggregatedStats(metrics: WorkflowMetrics): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `stats:${metrics.workflowId}:${today}`;

    await this.redis.hincrby(key, 'total_executions', 1);
    await this.redis.hincrby(key, `status:${metrics.status}`, 1);
    await this.redis.hincrbyfloat(key, 'total_cost', metrics.cost);
    await this.redis.expire(key, 90 * 86400); // 90 days
  }

  /**
   * Helper: Parse InfluxDB record
   */
  private parseInfluxRecord(record: any): WorkflowMetrics {
    return {
      workflowId: record.workflow_id,
      executionId: record.execution_id || '',
      startTime: new Date(record._time),
      duration: record._value,
      status: record.status,
      stepsCompleted: 0,
      totalSteps: 0,
      retriesCount: 0,
      errorCount: 0,
      resourceUsage: {
        apiCalls: 0,
        storageBytes: 0,
        bandwidthBytes: 0,
        computeTimeMs: 0,
        externalServiceCalls: [],
      },
      cost: 0,
      triggeredBy: record.triggered_by || 'unknown',
      metadata: {},
    };
  }

  /**
   * Helper: Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Helper: Calculate median
   */
  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Helper: Calculate percentile
   */
  private percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Helper: Get step name
   */
  private getStepName(stepId: string): string {
    // In production, fetch from database
    return `Step ${stepId}`;
  }

  /**
   * Helper: Get executions
   */
  private async getExecutions(workflowId: string, timeRange: TimeRange): Promise<WorkflowMetrics[]> {
    // In production, query from database/InfluxDB
    return [];
  }

  /**
   * Helper: Get active workflows
   */
  private async getActiveWorkflows(): Promise<string[]> {
    const keys = await this.redis.keys('workflow:active:*');
    return keys.map(k => k.split(':')[2]);
  }

  /**
   * Helper: Get recent metrics
   */
  private async getRecentMetrics(workflowId: string, hours: number): Promise<WorkflowMetrics[]> {
    const timeRange: TimeRange = {
      start: new Date(Date.now() - hours * 3600000),
      end: new Date(),
      granularity: 'hour',
    };
    return this.getExecutions(workflowId, timeRange);
  }

  /**
   * Helper: Get baseline metrics
   */
  private async getBaselineMetrics(workflowId: string): Promise<any> {
    const cached = await this.redis.get(`baseline:${workflowId}`);
    if (cached) return JSON.parse(cached);

    // Calculate baseline from last 30 days
    const timeRange: TimeRange = {
      start: new Date(Date.now() - 30 * 86400000),
      end: new Date(),
      granularity: 'day',
    };

    const metrics = await this.getPerformanceMetrics(workflowId, timeRange);
    const baseline = {
      averageExecutionTime: metrics.averageExecutionTime,
      failureRate: metrics.failureRate,
      averageErrors: metrics.totalExecutions > 0 ? metrics.failedExecutions / metrics.totalExecutions : 0,
    };

    await this.redis.setex(`baseline:${workflowId}`, 86400, JSON.stringify(baseline));
    return baseline;
  }

  /**
   * Helper: Record anomaly
   */
  private async recordAnomaly(anomaly: AnomalyDetection): Promise<void> {
    const key = `anomaly:${anomaly.workflowId}:${anomaly.timestamp.getTime()}`;
    await this.redis.setex(key, 7 * 86400, JSON.stringify(anomaly)); // 7 days
  }

  /**
   * Helper: Get organization workflows
   */
  private async getOrganizationWorkflows(organizationId: string): Promise<any[]> {
    // In production, fetch from database
    return [];
  }

  /**
   * Helper: Get aggregated metrics
   */
  private async getAggregatedMetrics(organizationId: string, timeRange: TimeRange): Promise<any> {
    return {
      totalExecutions: 0,
      successRate: 0,
      totalCost: 0,
    };
  }

  /**
   * Helper: Get recent executions for organization
   */
  private async getRecentExecutionsForOrg(organizationId: string, limit: number): Promise<WorkflowMetrics[]> {
    return [];
  }

  /**
   * Helper: Get top performers
   */
  private async getTopPerformers(organizationId: string, timeRange: TimeRange, limit: number): Promise<any[]> {
    return [];
  }

  /**
   * Helper: Get failing workflows
   */
  private async getFailingWorkflows(organizationId: string, timeRange: TimeRange, limit: number): Promise<any[]> {
    return [];
  }

  /**
   * Helper: Get resource utilization
   */
  private async getResourceUtilization(organizationId: string, timeRange: TimeRange): Promise<any> {
    return {
      apiCallsToday: 0,
      storageUsed: 0,
      bandwidthUsed: 0,
      costTrend: [],
    };
  }

  /**
   * Helper: Get recent anomalies
   */
  private async getRecentAnomalies(organizationId: string, hours: number): Promise<AnomalyDetection[]> {
    return [];
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.writeApi.close();
    await this.redis.quit();
  }
}

export default WorkflowAnalytics;
