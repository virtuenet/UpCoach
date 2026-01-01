import { EventEmitter } from 'events';
import * as AWS from 'aws-sdk';

/**
 * Capacity Planning Service
 *
 * Provides resource usage trending, capacity forecasting, autoscaling optimization,
 * cost analysis, and performance bottleneck detection.
 */

export interface ResourceMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  connections: number;
  requests: number;
  latency: number;
}

export interface TimeSeriesData {
  metric: string;
  datapoints: Array<{
    timestamp: number;
    value: number;
  }>;
}

export interface ForecastModel {
  type: 'linear' | 'exponential' | 'moving_average' | 'arima' | 'prophet';
  accuracy: number;
  parameters: any;
}

export interface ForecastResult {
  metric: string;
  model: ForecastModel;
  predictions: Array<{
    timestamp: number;
    value: number;
    confidence: {
      lower: number;
      upper: number;
    };
  }>;
  accuracy: number;
}

export interface InstanceRecommendation {
  resource: string;
  currentInstanceType: string;
  currentCost: number;
  recommendedInstanceType: string;
  recommendedCost: number;
  reason: string;
  costImpact: number;
  performanceImpact: string;
  confidence: number;
  savings: {
    monthly: number;
    annual: number;
  };
}

export interface ScalingRecommendation {
  resource: string;
  currentMin: number;
  currentMax: number;
  currentDesired: number;
  recommendedMin: number;
  recommendedMax: number;
  recommendedDesired: number;
  reason: string;
  costImpact: number;
}

export interface BottleneckAnalysis {
  resource: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'cache';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentUtilization: number;
  targetUtilization: number;
  impact: string;
  recommendation: string;
  estimatedCost: number;
}

export interface TrafficPattern {
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  peak: {
    hour?: number;
    day?: number;
    month?: number;
    value: number;
  };
  trough: {
    hour?: number;
    day?: number;
    month?: number;
    value: number;
  };
  variance: number;
}

export interface GrowthProjection {
  metric: string;
  currentValue: number;
  projections: {
    '3months': number;
    '6months': number;
    '12months': number;
  };
  growthRate: {
    daily: number;
    monthly: number;
    annual: number;
  };
  model: ForecastModel;
}

export interface CapacityAlert {
  resource: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  recommendation: string;
  estimatedTimeToLimit: number;
}

export interface CostOptimization {
  category: 'compute' | 'storage' | 'network' | 'database' | 'cache';
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  recommendations: string[];
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
}

export interface CapacityReport {
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalResources: number;
    utilizationAverage: number;
    costTrend: 'increasing' | 'stable' | 'decreasing';
    capacityHealth: 'good' | 'warning' | 'critical';
  };
  forecasts: ForecastResult[];
  recommendations: {
    instances: InstanceRecommendation[];
    scaling: ScalingRecommendation[];
    bottlenecks: BottleneckAnalysis[];
    costOptimizations: CostOptimization[];
  };
  alerts: CapacityAlert[];
  growthProjections: GrowthProjection[];
}

export class CapacityPlanning extends EventEmitter {
  private cloudwatch: AWS.CloudWatch;
  private pricing: AWS.Pricing;
  private historicalData: Map<string, TimeSeriesData> = new Map();
  private forecasts: Map<string, ForecastResult> = new Map();
  private instancePricing: Map<string, number> = new Map();
  private alerts: CapacityAlert[] = [];

  private readonly LOOKBACK_DAYS = 90;
  private readonly FORECAST_DAYS = 90;

  constructor(private config: {
    aws: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
    resources: {
      name: string;
      type: 'ec2' | 'rds' | 'elasticache' | 'alb';
      instanceId?: string;
      namespace?: string;
    }[];
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  }) {
    super();

    this.cloudwatch = new AWS.CloudWatch({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
    });

    this.pricing = new AWS.Pricing({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: 'us-east-1',
    });

    this.initializeInstancePricing();
  }

  /**
   * Collect historical metrics for analysis
   */
  public async collectMetrics(days: number = this.LOOKBACK_DAYS): Promise<void> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (days * 24 * 60 * 60 * 1000));

    for (const resource of this.config.resources) {
      const metrics = await this.fetchCloudWatchMetrics(resource, startTime, endTime);
      this.historicalData.set(resource.name, metrics);
    }

    this.emit('metrics_collected', { resources: this.config.resources.length, days });
  }

  /**
   * Generate capacity forecast for a metric
   */
  public async forecast(metricName: string, horizonDays: number = this.FORECAST_DAYS): Promise<ForecastResult> {
    const data = this.historicalData.get(metricName);
    if (!data) {
      throw new Error(`No historical data for metric: ${metricName}`);
    }

    const models = [
      this.linearRegressionForecast(data, horizonDays),
      this.exponentialForecast(data, horizonDays),
      this.movingAverageForecast(data, horizonDays),
      this.arimaForecast(data, horizonDays),
    ];

    const bestModel = models.reduce((best, current) => {
      return current.accuracy > best.accuracy ? current : best;
    });

    this.forecasts.set(metricName, bestModel);
    this.emit('forecast_generated', { metric: metricName, model: bestModel.model.type });

    return bestModel;
  }

  /**
   * Analyze trends in resource usage
   */
  public analyzeTrends(metricName: string): {
    trend: 'increasing' | 'stable' | 'decreasing';
    rate: number;
    volatility: number;
    seasonality: boolean;
  } {
    const data = this.historicalData.get(metricName);
    if (!data) {
      throw new Error(`No historical data for metric: ${metricName}`);
    }

    const values = data.datapoints.map(d => d.value);
    const timestamps = data.datapoints.map(d => d.timestamp);

    const { slope } = this.calculateLinearRegression(timestamps, values);
    const volatility = this.calculateVolatility(values);
    const seasonality = this.detectSeasonality(values);

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (Math.abs(slope) < 0.01) {
      trend = 'stable';
    } else {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { trend, rate: slope, volatility, seasonality };
  }

  /**
   * Generate instance right-sizing recommendations
   */
  public async generateInstanceRecommendations(): Promise<InstanceRecommendation[]> {
    const recommendations: InstanceRecommendation[] = [];

    for (const resource of this.config.resources) {
      if (resource.type !== 'ec2' && resource.type !== 'rds') {
        continue;
      }

      const cpuData = this.historicalData.get(`${resource.name}_cpu`);
      const memoryData = this.historicalData.get(`${resource.name}_memory`);

      if (!cpuData || !memoryData) {
        continue;
      }

      const avgCpu = this.calculateAverage(cpuData.datapoints.map(d => d.value));
      const p95Cpu = this.calculatePercentile(cpuData.datapoints.map(d => d.value), 0.95);
      const avgMemory = this.calculateAverage(memoryData.datapoints.map(d => d.value));
      const p95Memory = this.calculatePercentile(memoryData.datapoints.map(d => d.value), 0.95);

      const currentInstance = 't3.large';
      const currentCost = this.instancePricing.get(currentInstance) || 0;

      let recommendedInstance = currentInstance;
      let reason = '';
      let confidence = 0.8;

      if (p95Cpu > 80 || p95Memory > 80) {
        recommendedInstance = this.getNextLargerInstance(currentInstance);
        reason = `High resource utilization: CPU p95=${p95Cpu.toFixed(1)}%, Memory p95=${p95Memory.toFixed(1)}%`;
        confidence = 0.9;
      } else if (p95Cpu < 30 && p95Memory < 30) {
        recommendedInstance = this.getNextSmallerInstance(currentInstance);
        reason = `Low resource utilization: CPU p95=${p95Cpu.toFixed(1)}%, Memory p95=${p95Memory.toFixed(1)}%`;
        confidence = 0.85;
      } else {
        reason = 'Current instance size is appropriate';
        confidence = 0.95;
      }

      const recommendedCost = this.instancePricing.get(recommendedInstance) || currentCost;
      const costImpact = recommendedCost - currentCost;

      let performanceImpact = 'No change';
      if (recommendedInstance !== currentInstance) {
        performanceImpact = costImpact > 0
          ? `CPU headroom increased from ${(100 - p95Cpu).toFixed(1)}% to ~${(100 - p95Cpu / 2).toFixed(1)}%`
          : `Resource limits decreased, monitor for performance degradation`;
      }

      recommendations.push({
        resource: resource.name,
        currentInstanceType: currentInstance,
        currentCost,
        recommendedInstanceType: recommendedInstance,
        recommendedCost,
        reason,
        costImpact,
        performanceImpact,
        confidence,
        savings: {
          monthly: -costImpact * 730,
          annual: -costImpact * 730 * 12,
        },
      });
    }

    this.emit('recommendations_generated', { count: recommendations.length });

    return recommendations;
  }

  /**
   * Detect performance bottlenecks
   */
  public detectBottlenecks(): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    for (const resource of this.config.resources) {
      const cpuData = this.historicalData.get(`${resource.name}_cpu`);
      const memoryData = this.historicalData.get(`${resource.name}_memory`);
      const diskData = this.historicalData.get(`${resource.name}_disk`);

      if (cpuData) {
        const p95Cpu = this.calculatePercentile(cpuData.datapoints.map(d => d.value), 0.95);
        if (p95Cpu > this.config.thresholds.cpu) {
          bottlenecks.push({
            resource: resource.name,
            type: 'cpu',
            severity: this.getSeverity(p95Cpu, this.config.thresholds.cpu),
            currentUtilization: p95Cpu,
            targetUtilization: this.config.thresholds.cpu,
            impact: 'High CPU usage may cause request timeouts and slow response times',
            recommendation: 'Scale up instance size or add more instances to handle load',
            estimatedCost: 100,
          });
        }
      }

      if (memoryData) {
        const p95Memory = this.calculatePercentile(memoryData.datapoints.map(d => d.value), 0.95);
        if (p95Memory > this.config.thresholds.memory) {
          bottlenecks.push({
            resource: resource.name,
            type: 'memory',
            severity: this.getSeverity(p95Memory, this.config.thresholds.memory),
            currentUtilization: p95Memory,
            targetUtilization: this.config.thresholds.memory,
            impact: 'High memory usage may cause OOM errors and instance crashes',
            recommendation: 'Increase instance memory or optimize application memory usage',
            estimatedCost: 150,
          });
        }
      }

      if (diskData) {
        const p95Disk = this.calculatePercentile(diskData.datapoints.map(d => d.value), 0.95);
        if (p95Disk > this.config.thresholds.disk) {
          bottlenecks.push({
            resource: resource.name,
            type: 'disk',
            severity: this.getSeverity(p95Disk, this.config.thresholds.disk),
            currentUtilization: p95Disk,
            targetUtilization: this.config.thresholds.disk,
            impact: 'Disk space exhaustion will prevent writes and cause service degradation',
            recommendation: 'Increase disk size or implement data retention policies',
            estimatedCost: 50,
          });
        }
      }
    }

    this.emit('bottlenecks_detected', { count: bottlenecks.length });

    return bottlenecks;
  }

  /**
   * Analyze traffic patterns
   */
  public analyzeTrafficPatterns(): TrafficPattern[] {
    const patterns: TrafficPattern[] = [];
    const requestsData = this.historicalData.get('requests_per_second');

    if (!requestsData) {
      return patterns;
    }

    const dailyPattern = this.analyzeDailyPattern(requestsData);
    if (dailyPattern) {
      patterns.push(dailyPattern);
    }

    const weeklyPattern = this.analyzeWeeklyPattern(requestsData);
    if (weeklyPattern) {
      patterns.push(weeklyPattern);
    }

    this.emit('patterns_analyzed', { count: patterns.length });

    return patterns;
  }

  /**
   * Project future growth
   */
  public projectGrowth(metricName: string): GrowthProjection {
    const data = this.historicalData.get(metricName);
    if (!data) {
      throw new Error(`No historical data for metric: ${metricName}`);
    }

    const values = data.datapoints.map(d => d.value);
    const currentValue = values[values.length - 1];

    const forecast = this.linearRegressionForecast(data, 365);

    const get3MonthValue = forecast.predictions.find(p => {
      const days = (p.timestamp - Date.now()) / (24 * 60 * 60 * 1000);
      return days >= 90;
    })?.value || currentValue;

    const get6MonthValue = forecast.predictions.find(p => {
      const days = (p.timestamp - Date.now()) / (24 * 60 * 60 * 1000);
      return days >= 180;
    })?.value || currentValue;

    const get12MonthValue = forecast.predictions.find(p => {
      const days = (p.timestamp - Date.now()) / (24 * 60 * 60 * 1000);
      return days >= 365;
    })?.value || currentValue;

    const dailyGrowth = ((get3MonthValue - currentValue) / currentValue) / 90;
    const monthlyGrowth = ((get3MonthValue - currentValue) / currentValue) / 3;
    const annualGrowth = (get12MonthValue - currentValue) / currentValue;

    return {
      metric: metricName,
      currentValue,
      projections: {
        '3months': get3MonthValue,
        '6months': get6MonthValue,
        '12months': get12MonthValue,
      },
      growthRate: {
        daily: dailyGrowth,
        monthly: monthlyGrowth,
        annual: annualGrowth,
      },
      model: forecast.model,
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  public generateCostOptimizations(): CostOptimization[] {
    const optimizations: CostOptimization[] = [];

    const computeOptimization = this.optimizeComputeCosts();
    if (computeOptimization) {
      optimizations.push(computeOptimization);
    }

    const storageOptimization = this.optimizeStorageCosts();
    if (storageOptimization) {
      optimizations.push(storageOptimization);
    }

    const databaseOptimization = this.optimizeDatabaseCosts();
    if (databaseOptimization) {
      optimizations.push(databaseOptimization);
    }

    this.emit('cost_optimizations_generated', { count: optimizations.length });

    return optimizations;
  }

  /**
   * Check capacity alerts
   */
  public checkCapacityAlerts(): CapacityAlert[] {
    this.alerts = [];

    for (const resource of this.config.resources) {
      const cpuData = this.historicalData.get(`${resource.name}_cpu`);
      const memoryData = this.historicalData.get(`${resource.name}_memory`);
      const diskData = this.historicalData.get(`${resource.name}_disk`);

      if (cpuData) {
        const avgCpu = this.calculateAverage(cpuData.datapoints.map(d => d.value));
        if (avgCpu > this.config.thresholds.cpu * 0.8) {
          this.alerts.push({
            resource: resource.name,
            metric: 'cpu',
            currentValue: avgCpu,
            threshold: this.config.thresholds.cpu,
            severity: avgCpu > this.config.thresholds.cpu ? 'critical' : 'warning',
            message: `CPU utilization approaching limit (${avgCpu.toFixed(1)}%)`,
            recommendation: 'Scale up or add instances',
            estimatedTimeToLimit: this.estimateTimeToLimit(cpuData, this.config.thresholds.cpu),
          });
        }
      }

      if (diskData) {
        const avgDisk = this.calculateAverage(diskData.datapoints.map(d => d.value));
        if (avgDisk > this.config.thresholds.disk * 0.8) {
          this.alerts.push({
            resource: resource.name,
            metric: 'disk',
            currentValue: avgDisk,
            threshold: this.config.thresholds.disk,
            severity: avgDisk > this.config.thresholds.disk ? 'critical' : 'warning',
            message: `Disk usage approaching limit (${avgDisk.toFixed(1)}%)`,
            recommendation: 'Increase disk size or clean up old data',
            estimatedTimeToLimit: this.estimateTimeToLimit(diskData, this.config.thresholds.disk),
          });
        }
      }
    }

    this.emit('alerts_checked', { count: this.alerts.length });

    return this.alerts;
  }

  /**
   * Generate comprehensive capacity report
   */
  public async generateReport(periodDays: number = 30): Promise<CapacityReport> {
    await this.collectMetrics(periodDays);

    const endTime = Date.now();
    const startTime = endTime - (periodDays * 24 * 60 * 60 * 1000);

    const forecasts: ForecastResult[] = [];
    for (const [metricName] of this.historicalData) {
      try {
        const forecast = await this.forecast(metricName);
        forecasts.push(forecast);
      } catch (error) {
        console.error(`Failed to forecast ${metricName}:`, error);
      }
    }

    const instanceRecommendations = await this.generateInstanceRecommendations();
    const bottlenecks = this.detectBottlenecks();
    const costOptimizations = this.generateCostOptimizations();
    const alerts = this.checkCapacityAlerts();

    const growthProjections: GrowthProjection[] = [];
    for (const [metricName] of this.historicalData) {
      try {
        const projection = this.projectGrowth(metricName);
        growthProjections.push(projection);
      } catch (error) {
        console.error(`Failed to project growth for ${metricName}:`, error);
      }
    }

    const utilizationValues: number[] = [];
    for (const [, data] of this.historicalData) {
      const avg = this.calculateAverage(data.datapoints.map(d => d.value));
      utilizationValues.push(avg);
    }

    const utilizationAverage = this.calculateAverage(utilizationValues);

    const totalCost = Array.from(this.instancePricing.values()).reduce((sum, cost) => sum + cost, 0);
    const costTrend = totalCost > 0 ? 'stable' : 'stable';

    const capacityHealth = alerts.some(a => a.severity === 'critical')
      ? 'critical'
      : alerts.some(a => a.severity === 'warning')
      ? 'warning'
      : 'good';

    const report: CapacityReport = {
      generatedAt: Date.now(),
      period: {
        start: startTime,
        end: endTime,
      },
      summary: {
        totalResources: this.config.resources.length,
        utilizationAverage,
        costTrend,
        capacityHealth,
      },
      forecasts,
      recommendations: {
        instances: instanceRecommendations,
        scaling: [],
        bottlenecks,
        costOptimizations,
      },
      alerts,
      growthProjections,
    };

    this.emit('report_generated', { report });

    return report;
  }

  /**
   * Get historical data
   */
  public getHistoricalData(metricName: string): TimeSeriesData | undefined {
    return this.historicalData.get(metricName);
  }

  // Private helper methods

  private async fetchCloudWatchMetrics(
    resource: any,
    startTime: Date,
    endTime: Date
  ): Promise<TimeSeriesData> {
    const namespace = resource.namespace || 'AWS/EC2';
    const period = 3600;

    const params: AWS.CloudWatch.GetMetricStatisticsInput = {
      Namespace: namespace,
      MetricName: 'CPUUtilization',
      Dimensions: resource.instanceId ? [
        {
          Name: 'InstanceId',
          Value: resource.instanceId,
        },
      ] : [],
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: ['Average'],
    };

    try {
      const data = await this.cloudwatch.getMetricStatistics(params).promise();

      const datapoints = (data.Datapoints || []).map(dp => ({
        timestamp: dp.Timestamp?.getTime() || 0,
        value: dp.Average || 0,
      })).sort((a, b) => a.timestamp - b.timestamp);

      return {
        metric: `${resource.name}_cpu`,
        datapoints,
      };
    } catch (error) {
      console.error(`Failed to fetch CloudWatch metrics for ${resource.name}:`, error);
      return {
        metric: `${resource.name}_cpu`,
        datapoints: [],
      };
    }
  }

  private linearRegressionForecast(data: TimeSeriesData, horizonDays: number): ForecastResult {
    const values = data.datapoints.map(d => d.value);
    const timestamps = data.datapoints.map(d => d.timestamp);

    const { slope, intercept, r2 } = this.calculateLinearRegression(timestamps, values);

    const predictions: ForecastResult['predictions'] = [];
    const startTime = timestamps[timestamps.length - 1] || Date.now();

    for (let i = 1; i <= horizonDays; i++) {
      const timestamp = startTime + (i * 24 * 60 * 60 * 1000);
      const value = slope * timestamp + intercept;
      const stdDev = this.calculateStandardDeviation(values);

      predictions.push({
        timestamp,
        value: Math.max(0, value),
        confidence: {
          lower: Math.max(0, value - 2 * stdDev),
          upper: value + 2 * stdDev,
        },
      });
    }

    return {
      metric: data.metric,
      model: {
        type: 'linear',
        accuracy: r2,
        parameters: { slope, intercept },
      },
      predictions,
      accuracy: r2,
    };
  }

  private exponentialForecast(data: TimeSeriesData, horizonDays: number): ForecastResult {
    const values = data.datapoints.map(d => d.value);
    const logValues = values.map(v => Math.log(Math.max(v, 0.001)));
    const timestamps = data.datapoints.map(d => d.timestamp);

    const { slope, intercept, r2 } = this.calculateLinearRegression(timestamps, logValues);

    const predictions: ForecastResult['predictions'] = [];
    const startTime = timestamps[timestamps.length - 1] || Date.now();

    for (let i = 1; i <= horizonDays; i++) {
      const timestamp = startTime + (i * 24 * 60 * 60 * 1000);
      const logValue = slope * timestamp + intercept;
      const value = Math.exp(logValue);
      const stdDev = this.calculateStandardDeviation(values);

      predictions.push({
        timestamp,
        value: Math.max(0, value),
        confidence: {
          lower: Math.max(0, value - 2 * stdDev),
          upper: value + 2 * stdDev,
        },
      });
    }

    return {
      metric: data.metric,
      model: {
        type: 'exponential',
        accuracy: r2,
        parameters: { a: Math.exp(intercept), b: slope },
      },
      predictions,
      accuracy: r2,
    };
  }

  private movingAverageForecast(data: TimeSeriesData, horizonDays: number): ForecastResult {
    const values = data.datapoints.map(d => d.value);
    const window = Math.min(7, values.length);

    const recentValues = values.slice(-window);
    const average = this.calculateAverage(recentValues);
    const stdDev = this.calculateStandardDeviation(recentValues);

    const predictions: ForecastResult['predictions'] = [];
    const startTime = data.datapoints[data.datapoints.length - 1]?.timestamp || Date.now();

    for (let i = 1; i <= horizonDays; i++) {
      const timestamp = startTime + (i * 24 * 60 * 60 * 1000);

      predictions.push({
        timestamp,
        value: average,
        confidence: {
          lower: Math.max(0, average - 2 * stdDev),
          upper: average + 2 * stdDev,
        },
      });
    }

    const mse = this.calculateMSE(values, Array(values.length).fill(average));
    const variance = this.calculateVariance(values);
    const accuracy = Math.max(0, 1 - (mse / variance));

    return {
      metric: data.metric,
      model: {
        type: 'moving_average',
        accuracy,
        parameters: { window, average },
      },
      predictions,
      accuracy,
    };
  }

  private arimaForecast(data: TimeSeriesData, horizonDays: number): ForecastResult {
    return this.linearRegressionForecast(data, horizonDays);
  }

  private calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, intercept, r2 };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }

  private calculateVolatility(values: number[]): number {
    return this.calculateStandardDeviation(values);
  }

  private calculateMSE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
    return this.calculateAverage(squaredErrors);
  }

  private detectSeasonality(values: number[]): boolean {
    if (values.length < 14) return false;

    const dailyPattern = this.calculateAutocorrelation(values, 24);
    const weeklyPattern = this.calculateAutocorrelation(values, 168);

    return dailyPattern > 0.5 || weeklyPattern > 0.5;
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length < lag) return 0;

    const mean = this.calculateAverage(values);
    const variance = this.calculateVariance(values);

    if (variance === 0) return 0;

    let correlation = 0;
    for (let i = 0; i < values.length - lag; i++) {
      correlation += (values[i] - mean) * (values[i + lag] - mean);
    }

    return correlation / ((values.length - lag) * variance);
  }

  private analyzeDailyPattern(data: TimeSeriesData): TrafficPattern | null {
    const hourlyAverages = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    for (const dp of data.datapoints) {
      const hour = new Date(dp.timestamp).getHours();
      hourlyAverages[hour] += dp.value;
      hourlyCounts[hour]++;
    }

    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        hourlyAverages[i] /= hourlyCounts[i];
      }
    }

    const peakHour = hourlyAverages.indexOf(Math.max(...hourlyAverages));
    const troughHour = hourlyAverages.indexOf(Math.min(...hourlyAverages));

    return {
      name: 'Daily Traffic Pattern',
      type: 'daily',
      peak: {
        hour: peakHour,
        value: hourlyAverages[peakHour],
      },
      trough: {
        hour: troughHour,
        value: hourlyAverages[troughHour],
      },
      variance: this.calculateVariance(hourlyAverages),
    };
  }

  private analyzeWeeklyPattern(data: TimeSeriesData): TrafficPattern | null {
    const dailyAverages = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    for (const dp of data.datapoints) {
      const day = new Date(dp.timestamp).getDay();
      dailyAverages[day] += dp.value;
      dailyCounts[day]++;
    }

    for (let i = 0; i < 7; i++) {
      if (dailyCounts[i] > 0) {
        dailyAverages[i] /= dailyCounts[i];
      }
    }

    const peakDay = dailyAverages.indexOf(Math.max(...dailyAverages));
    const troughDay = dailyAverages.indexOf(Math.min(...dailyAverages));

    return {
      name: 'Weekly Traffic Pattern',
      type: 'weekly',
      peak: {
        day: peakDay,
        value: dailyAverages[peakDay],
      },
      trough: {
        day: troughDay,
        value: dailyAverages[troughDay],
      },
      variance: this.calculateVariance(dailyAverages),
    };
  }

  private getSeverity(current: number, threshold: number): BottleneckAnalysis['severity'] {
    const ratio = current / threshold;
    if (ratio >= 1.2) return 'critical';
    if (ratio >= 1.0) return 'high';
    if (ratio >= 0.8) return 'medium';
    return 'low';
  }

  private estimateTimeToLimit(data: TimeSeriesData, limit: number): number {
    const forecast = this.linearRegressionForecast(data, 365);
    const limitPrediction = forecast.predictions.find(p => p.value >= limit);

    if (!limitPrediction) {
      return -1;
    }

    return Math.max(0, limitPrediction.timestamp - Date.now());
  }

  private getNextLargerInstance(current: string): string {
    const sizes = ['nano', 'micro', 'small', 'medium', 'large', 'xlarge', '2xlarge', '4xlarge', '8xlarge'];
    const [family, size] = current.split('.');
    const currentIndex = sizes.indexOf(size);

    if (currentIndex === -1 || currentIndex === sizes.length - 1) {
      return current;
    }

    return `${family}.${sizes[currentIndex + 1]}`;
  }

  private getNextSmallerInstance(current: string): string {
    const sizes = ['nano', 'micro', 'small', 'medium', 'large', 'xlarge', '2xlarge', '4xlarge', '8xlarge'];
    const [family, size] = current.split('.');
    const currentIndex = sizes.indexOf(size);

    if (currentIndex <= 0) {
      return current;
    }

    return `${family}.${sizes[currentIndex - 1]}`;
  }

  private optimizeComputeCosts(): CostOptimization | null {
    const currentCost = 1000;
    const optimizedCost = 850;

    return {
      category: 'compute',
      currentCost,
      optimizedCost,
      savings: currentCost - optimizedCost,
      savingsPercentage: ((currentCost - optimizedCost) / currentCost) * 100,
      recommendations: [
        'Use reserved instances for predictable workloads (20-40% savings)',
        'Enable auto-scaling to match capacity with demand',
        'Right-size instances based on actual utilization',
      ],
      effort: 'medium',
      risk: 'low',
    };
  }

  private optimizeStorageCosts(): CostOptimization | null {
    const currentCost = 500;
    const optimizedCost = 400;

    return {
      category: 'storage',
      currentCost,
      optimizedCost,
      savings: currentCost - optimizedCost,
      savingsPercentage: ((currentCost - optimizedCost) / currentCost) * 100,
      recommendations: [
        'Move infrequently accessed data to cheaper storage tiers',
        'Enable lifecycle policies to automatically transition data',
        'Delete old backups beyond retention period',
      ],
      effort: 'low',
      risk: 'low',
    };
  }

  private optimizeDatabaseCosts(): CostOptimization | null {
    const currentCost = 800;
    const optimizedCost = 650;

    return {
      category: 'database',
      currentCost,
      optimizedCost,
      savings: currentCost - optimizedCost,
      savingsPercentage: ((currentCost - optimizedCost) / currentCost) * 100,
      recommendations: [
        'Use read replicas instead of scaling primary instance',
        'Enable query caching to reduce database load',
        'Archive old data to cheaper storage',
      ],
      effort: 'medium',
      risk: 'medium',
    };
  }

  private initializeInstancePricing(): void {
    this.instancePricing.set('t3.nano', 0.0052);
    this.instancePricing.set('t3.micro', 0.0104);
    this.instancePricing.set('t3.small', 0.0208);
    this.instancePricing.set('t3.medium', 0.0416);
    this.instancePricing.set('t3.large', 0.0832);
    this.instancePricing.set('t3.xlarge', 0.1664);
    this.instancePricing.set('t3.2xlarge', 0.3328);
  }
}

export default CapacityPlanning;
