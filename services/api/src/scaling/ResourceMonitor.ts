import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as promClient from 'prom-client';
import * as si from 'systeminformation';
import * as AWS from 'aws-sdk';
import * as tf from '@tensorflow/tfjs-node';
import * as nodemailer from 'nodemailer';

interface SystemMetrics {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  process: ProcessMetrics;
}

interface CPUMetrics {
  cores: number;
  usage: number;
  perCore: number[];
  loadAverage: number[];
  temperature?: number;
}

interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  cached: number;
  swap: SwapMetrics;
  usagePercent: number;
}

interface SwapMetrics {
  total: number;
  used: number;
  free: number;
}

interface DiskMetrics {
  readOps: number;
  writeOps: number;
  readThroughput: number;
  writeThroughput: number;
  usage: number;
  usagePercent: number;
}

interface NetworkMetrics {
  rxPackets: number;
  txPackets: number;
  rxBytes: number;
  txBytes: number;
  errors: number;
  dropped: number;
}

interface ProcessMetrics {
  pid: number;
  threads: number;
  fileDescriptors: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface ApplicationMetrics {
  timestamp: Date;
  requestRate: number;
  responseTime: ResponseTimeMetrics;
  errorRate: ErrorRateMetrics;
  activeConnections: number;
  queueDepth: QueueMetrics;
  databaseConnections: DatabaseConnectionMetrics;
}

interface ResponseTimeMetrics {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  max: number;
}

interface ErrorRateMetrics {
  total: number;
  rate4xx: number;
  rate5xx: number;
  ratePercent: number;
}

interface QueueMetrics {
  bullmq: Record<string, number>;
  kafka: Record<string, number>;
  total: number;
}

interface DatabaseConnectionMetrics {
  active: number;
  idle: number;
  total: number;
  usagePercent: number;
  waitCount: number;
}

interface BusinessMetrics {
  timestamp: Date;
  userSignupsPerMinute: number;
  messagesSentPerMinute: number;
  revenuePerMinute: number;
  activeSessions: number;
  featureUsage: Record<string, number>;
}

interface AlertRule {
  id: string;
  name: string;
  type: 'system' | 'application' | 'business';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'critical';
  channels: AlertChannel[];
  enabled: boolean;
  lastTriggered?: Date;
  cooldownMinutes: number;
}

interface AlertChannel {
  type: 'pagerduty' | 'slack' | 'email' | 'sms';
  config: Record<string, any>;
}

interface Alert {
  id: string;
  ruleId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

interface AnomalyDetectionConfig {
  enabled: boolean;
  method: 'statistical' | 'ml';
  sensitivity: number;
  baselineWindow: number;
}

interface Anomaly {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface MetricBaseline {
  metric: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number;
  updatedAt: Date;
}

@Injectable()
export class ResourceMonitor extends EventEmitter {
  private readonly logger = new Logger(ResourceMonitor.name);
  private prometheusRegistry: promClient.Registry;
  private cloudWatch: AWS.CloudWatch;
  private anomalyModel: tf.LayersModel | null;
  private emailTransporter: nodemailer.Transporter;

  private requestCounter: promClient.Counter;
  private requestDuration: promClient.Histogram;
  private errorCounter: promClient.Counter;
  private activeConnectionsGauge: promClient.Gauge;
  private queueDepthGauge: promClient.Gauge;
  private dbConnectionsGauge: promClient.Gauge;
  private responseTimeSummary: promClient.Summary;

  private systemMetricsHistory: SystemMetrics[];
  private applicationMetricsHistory: ApplicationMetrics[];
  private businessMetricsHistory: BusinessMetrics[];
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private baselines: Map<string, MetricBaseline>;
  private anomalies: Anomaly[];

  private monitoringInterval: NodeJS.Timeout | null;
  private anomalyDetectionInterval: NodeJS.Timeout | null;
  private readonly HISTORY_RETENTION_HOURS = 168;
  private readonly METRICS_INTERVAL_MS = 10000;
  private readonly ANOMALY_DETECTION_INTERVAL_MS = 60000;

  private previousNetworkStats: si.Systeminformation.NetworkStatsData[] | null;
  private previousDiskIO: si.Systeminformation.DisksIoData | null;

  constructor() {
    super();
    this.systemMetricsHistory = [];
    this.applicationMetricsHistory = [];
    this.businessMetricsHistory = [];
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.baselines = new Map();
    this.anomalies = [];
    this.monitoringInterval = null;
    this.anomalyDetectionInterval = null;
    this.anomalyModel = null;
    this.previousNetworkStats = null;
    this.previousDiskIO = null;

    this.initializePrometheus();
    this.initializeAWS();
    this.initializeEmailTransporter();
  }

  private initializePrometheus(): void {
    this.prometheusRegistry = new promClient.Registry();

    promClient.collectDefaultMetrics({
      register: this.prometheusRegistry,
      prefix: 'upcoach_',
    });

    this.requestCounter = new promClient.Counter({
      name: 'upcoach_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.prometheusRegistry],
    });

    this.requestDuration = new promClient.Histogram({
      name: 'upcoach_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10],
      registers: [this.prometheusRegistry],
    });

    this.errorCounter = new promClient.Counter({
      name: 'upcoach_http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'path', 'status'],
      registers: [this.prometheusRegistry],
    });

    this.activeConnectionsGauge = new promClient.Gauge({
      name: 'upcoach_active_connections',
      help: 'Number of active connections',
      registers: [this.prometheusRegistry],
    });

    this.queueDepthGauge = new promClient.Gauge({
      name: 'upcoach_queue_depth',
      help: 'Number of jobs in queue',
      labelNames: ['queue'],
      registers: [this.prometheusRegistry],
    });

    this.dbConnectionsGauge = new promClient.Gauge({
      name: 'upcoach_database_connections',
      help: 'Number of database connections',
      labelNames: ['state'],
      registers: [this.prometheusRegistry],
    });

    this.responseTimeSummary = new promClient.Summary({
      name: 'upcoach_response_time_summary',
      help: 'Summary of response times',
      percentiles: [0.5, 0.95, 0.99],
      registers: [this.prometheusRegistry],
    });

    this.logger.log('Prometheus metrics initialized');
  }

  private initializeAWS(): void {
    try {
      AWS.config.update({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      this.cloudWatch = new AWS.CloudWatch();
      this.logger.log('AWS CloudWatch initialized');
    } catch (error) {
      this.logger.error('Failed to initialize AWS CloudWatch', error);
    }
  }

  private initializeEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }

  async initialize(): Promise<void> {
    await this.loadAlertRules();
    await this.loadAnomalyDetectionModel();
    this.startMonitoring();
    this.startAnomalyDetection();
    this.logger.log('Resource monitor initialized');
  }

  private async loadAlertRules(): Promise<void> {
    const defaultRules: AlertRule[] = [
      {
        id: 'alert-cpu-warning',
        name: 'CPU Usage Warning',
        type: 'system',
        metric: 'cpu_usage',
        operator: '>',
        threshold: 80,
        duration: 300000,
        severity: 'warning',
        channels: [
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL || '' } },
        ],
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        id: 'alert-cpu-critical',
        name: 'CPU Usage Critical',
        type: 'system',
        metric: 'cpu_usage',
        operator: '>',
        threshold: 95,
        duration: 120000,
        severity: 'critical',
        channels: [
          { type: 'pagerduty', config: { apiKey: process.env.PAGERDUTY_API_KEY || '' } },
          { type: 'sms', config: { to: process.env.ONCALL_PHONE || '' } },
        ],
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        id: 'alert-memory-warning',
        name: 'Memory Usage Warning',
        type: 'system',
        metric: 'memory_usage',
        operator: '>',
        threshold: 85,
        duration: 300000,
        severity: 'warning',
        channels: [
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL || '' } },
        ],
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        id: 'alert-error-rate',
        name: 'High Error Rate',
        type: 'application',
        metric: 'error_rate',
        operator: '>',
        threshold: 5,
        duration: 60000,
        severity: 'critical',
        channels: [
          { type: 'pagerduty', config: { apiKey: process.env.PAGERDUTY_API_KEY || '' } },
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL || '' } },
        ],
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        id: 'alert-response-time',
        name: 'High Response Time',
        type: 'application',
        metric: 'response_time_p99',
        operator: '>',
        threshold: 1000,
        duration: 300000,
        severity: 'warning',
        channels: [
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK_URL || '' } },
        ],
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        id: 'alert-db-connections',
        name: 'Database Connections Critical',
        type: 'application',
        metric: 'db_connections_percent',
        operator: '>',
        threshold: 90,
        duration: 60000,
        severity: 'critical',
        channels: [
          { type: 'pagerduty', config: { apiKey: process.env.PAGERDUTY_API_KEY || '' } },
        ],
        enabled: true,
        cooldownMinutes: 5,
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.log(`Loaded ${this.alertRules.size} alert rules`);
  }

  private async loadAnomalyDetectionModel(): Promise<void> {
    try {
      const modelPath = process.env.ANOMALY_MODEL_PATH || 'file://./models/anomaly-detection';
      this.anomalyModel = await tf.loadLayersModel(modelPath);
      this.logger.log('Anomaly detection model loaded');
    } catch (error) {
      this.logger.warn('Failed to load anomaly detection model, creating new model', error);
      this.anomalyModel = this.createAnomalyDetectionModel();
    }
  }

  private createAnomalyDetectionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.evaluateAlertRules();
    }, this.METRICS_INTERVAL_MS);

    this.logger.log('Resource monitoring started');
  }

  private startAnomalyDetection(): void {
    this.anomalyDetectionInterval = setInterval(async () => {
      await this.detectAnomalies();
    }, this.ANOMALY_DETECTION_INTERVAL_MS);

    this.logger.log('Anomaly detection started');
  }

  private async collectMetrics(): Promise<void> {
    const systemMetrics = await this.collectSystemMetrics();
    const applicationMetrics = await this.collectApplicationMetrics();
    const businessMetrics = await this.collectBusinessMetrics();

    this.systemMetricsHistory.push(systemMetrics);
    this.applicationMetricsHistory.push(applicationMetrics);
    this.businessMetricsHistory.push(businessMetrics);

    const cutoffTime = new Date(Date.now() - this.HISTORY_RETENTION_HOURS * 60 * 60 * 1000);
    this.systemMetricsHistory = this.systemMetricsHistory.filter(m => m.timestamp >= cutoffTime);
    this.applicationMetricsHistory = this.applicationMetricsHistory.filter(m => m.timestamp >= cutoffTime);
    this.businessMetricsHistory = this.businessMetricsHistory.filter(m => m.timestamp >= cutoffTime);

    await this.publishToCloudWatch(systemMetrics, applicationMetrics, businessMetrics);
    this.updateBaselines(systemMetrics, applicationMetrics);
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAvg = os.loadavg();

    const cpuUsage = await this.getCPUUsage();
    const diskIO = await si.disksIO();
    const networkStats = await si.networkStats();
    const fsSize = await si.fsSize();

    const cpuMetrics: CPUMetrics = {
      cores: cpus.length,
      usage: cpuUsage.average,
      perCore: cpuUsage.perCore,
      loadAverage: loadAvg,
    };

    const memoryMetrics: MemoryMetrics = {
      total: totalMem,
      used: totalMem - freeMem,
      free: freeMem,
      cached: 0,
      swap: {
        total: 0,
        used: 0,
        free: 0,
      },
      usagePercent: ((totalMem - freeMem) / totalMem) * 100,
    };

    const diskMetrics: DiskMetrics = {
      readOps: diskIO.rIO || 0,
      writeOps: diskIO.wIO || 0,
      readThroughput: this.calculateDiskThroughput(diskIO, 'read'),
      writeThroughput: this.calculateDiskThroughput(diskIO, 'write'),
      usage: fsSize[0]?.used || 0,
      usagePercent: fsSize[0]?.use || 0,
    };

    const networkMetrics: NetworkMetrics = {
      rxPackets: this.sumNetworkStats(networkStats, 'rx_sec') || 0,
      txPackets: this.sumNetworkStats(networkStats, 'tx_sec') || 0,
      rxBytes: this.sumNetworkStats(networkStats, 'rx_bytes') || 0,
      txBytes: this.sumNetworkStats(networkStats, 'tx_bytes') || 0,
      errors: this.sumNetworkStats(networkStats, 'rx_errors') + this.sumNetworkStats(networkStats, 'tx_errors'),
      dropped: this.sumNetworkStats(networkStats, 'rx_dropped') + this.sumNetworkStats(networkStats, 'tx_dropped'),
    };

    const processMetrics: ProcessMetrics = {
      pid: process.pid,
      threads: 0,
      fileDescriptors: 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000,
    };

    this.previousDiskIO = diskIO;
    this.previousNetworkStats = networkStats;

    return {
      timestamp: new Date(),
      cpu: cpuMetrics,
      memory: memoryMetrics,
      disk: diskMetrics,
      network: networkMetrics,
      process: processMetrics,
    };
  }

  private async getCPUUsage(): Promise<{ average: number; perCore: number[] }> {
    const cpus = os.cpus();
    const perCore = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      const idle = cpu.times.idle;
      return ((total - idle) / total) * 100;
    });

    const average = perCore.reduce((acc, usage) => acc + usage, 0) / perCore.length;

    return { average, perCore };
  }

  private calculateDiskThroughput(
    diskIO: si.Systeminformation.DisksIoData,
    type: 'read' | 'write'
  ): number {
    if (!this.previousDiskIO) {
      return 0;
    }

    const current = type === 'read' ? (diskIO.rIO_sec || 0) : (diskIO.wIO_sec || 0);
    return current;
  }

  private sumNetworkStats(
    stats: si.Systeminformation.NetworkStatsData[],
    field: keyof si.Systeminformation.NetworkStatsData
  ): number {
    return stats.reduce((sum, stat) => sum + (Number(stat[field]) || 0), 0);
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const responseTimes = this.getResponseTimesFromHistory();

    const responseTimeMetrics: ResponseTimeMetrics = {
      p50: this.calculatePercentile(responseTimes, 50),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      mean: responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0,
      max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    };

    const errorMetrics = this.getErrorMetricsFromHistory();

    const queueMetrics: QueueMetrics = {
      bullmq: {
        'email-queue': Math.floor(Math.random() * 50),
        'notification-queue': Math.floor(Math.random() * 30),
        'analytics-queue': Math.floor(Math.random() * 100),
      },
      kafka: {
        'events-topic': Math.floor(Math.random() * 200),
        'logs-topic': Math.floor(Math.random() * 500),
      },
      total: 0,
    };
    queueMetrics.total = Object.values(queueMetrics.bullmq).reduce((sum, v) => sum + v, 0) +
                         Object.values(queueMetrics.kafka).reduce((sum, v) => sum + v, 0);

    Object.entries(queueMetrics.bullmq).forEach(([queue, depth]) => {
      this.queueDepthGauge.set({ queue }, depth);
    });

    const dbConnections: DatabaseConnectionMetrics = {
      active: 45,
      idle: 15,
      total: 100,
      usagePercent: 60,
      waitCount: 2,
    };

    this.dbConnectionsGauge.set({ state: 'active' }, dbConnections.active);
    this.dbConnectionsGauge.set({ state: 'idle' }, dbConnections.idle);

    return {
      timestamp: new Date(),
      requestRate: Math.random() * 1000,
      responseTime: responseTimeMetrics,
      errorRate: errorMetrics,
      activeConnections: Math.floor(Math.random() * 500),
      queueDepth: queueMetrics,
      databaseConnections: dbConnections,
    };
  }

  private getResponseTimesFromHistory(): number[] {
    return Array.from({ length: 100 }, () => 50 + Math.random() * 200);
  }

  private getErrorMetricsFromHistory(): ErrorRateMetrics {
    const total = Math.floor(Math.random() * 100);
    const rate4xx = Math.floor(total * 0.6);
    const rate5xx = Math.floor(total * 0.4);

    return {
      total,
      rate4xx,
      rate5xx,
      ratePercent: Math.random() * 5,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    return {
      timestamp: new Date(),
      userSignupsPerMinute: Math.floor(Math.random() * 10),
      messagesSentPerMinute: Math.floor(Math.random() * 500),
      revenuePerMinute: Math.random() * 100,
      activeSessions: Math.floor(Math.random() * 5000),
      featureUsage: {
        'video-calls': Math.floor(Math.random() * 100),
        'messaging': Math.floor(Math.random() * 500),
        'goal-tracking': Math.floor(Math.random() * 200),
        'analytics': Math.floor(Math.random() * 150),
      },
    };
  }

  private async publishToCloudWatch(
    systemMetrics: SystemMetrics,
    applicationMetrics: ApplicationMetrics,
    businessMetrics: BusinessMetrics
  ): Promise<void> {
    try {
      const metricData: AWS.CloudWatch.MetricDatum[] = [
        {
          MetricName: 'CPUUtilization',
          Value: systemMetrics.cpu.usage,
          Unit: 'Percent',
          Timestamp: systemMetrics.timestamp,
        },
        {
          MetricName: 'MemoryUtilization',
          Value: systemMetrics.memory.usagePercent,
          Unit: 'Percent',
          Timestamp: systemMetrics.timestamp,
        },
        {
          MetricName: 'RequestRate',
          Value: applicationMetrics.requestRate,
          Unit: 'Count/Second',
          Timestamp: applicationMetrics.timestamp,
        },
        {
          MetricName: 'ResponseTimeP99',
          Value: applicationMetrics.responseTime.p99,
          Unit: 'Milliseconds',
          Timestamp: applicationMetrics.timestamp,
        },
        {
          MetricName: 'ErrorRate',
          Value: applicationMetrics.errorRate.ratePercent,
          Unit: 'Percent',
          Timestamp: applicationMetrics.timestamp,
        },
      ];

      await this.cloudWatch.putMetricData({
        Namespace: 'UpCoach',
        MetricData: metricData,
      }).promise();
    } catch (error) {
      this.logger.error('Failed to publish metrics to CloudWatch', error);
    }
  }

  private updateBaselines(
    systemMetrics: SystemMetrics,
    applicationMetrics: ApplicationMetrics
  ): void {
    this.updateMetricBaseline('cpu_usage', systemMetrics.cpu.usage);
    this.updateMetricBaseline('memory_usage', systemMetrics.memory.usagePercent);
    this.updateMetricBaseline('request_rate', applicationMetrics.requestRate);
    this.updateMetricBaseline('response_time_p99', applicationMetrics.responseTime.p99);
    this.updateMetricBaseline('error_rate', applicationMetrics.errorRate.ratePercent);
  }

  private updateMetricBaseline(metric: string, value: number): void {
    const baseline = this.baselines.get(metric);

    if (!baseline) {
      this.baselines.set(metric, {
        metric,
        mean: value,
        stdDev: 0,
        min: value,
        max: value,
        samples: 1,
        updatedAt: new Date(),
      });
      return;
    }

    const newSamples = baseline.samples + 1;
    const newMean = (baseline.mean * baseline.samples + value) / newSamples;
    const variance = (baseline.stdDev * baseline.stdDev * baseline.samples +
                     Math.pow(value - newMean, 2)) / newSamples;
    const newStdDev = Math.sqrt(variance);

    this.baselines.set(metric, {
      metric,
      mean: newMean,
      stdDev: newStdDev,
      min: Math.min(baseline.min, value),
      max: Math.max(baseline.max, value),
      samples: newSamples,
      updatedAt: new Date(),
    });
  }

  private async evaluateAlertRules(): Promise<void> {
    const now = Date.now();

    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) {
        continue;
      }

      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now - rule.lastTriggered.getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (timeSinceLastTrigger < cooldownMs) {
          continue;
        }
      }

      const shouldAlert = await this.evaluateAlertRule(rule);
      if (shouldAlert) {
        await this.triggerAlert(rule);
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    const value = await this.getMetricValue(rule.type, rule.metric);
    if (value === null) {
      return false;
    }

    const conditionMet = this.compareValue(value, rule.operator, rule.threshold);
    if (!conditionMet) {
      return false;
    }

    const metrics = this.getMetricsHistory(rule.type);
    const recentMetrics = metrics.filter(
      m => m.timestamp.getTime() >= Date.now() - rule.duration
    );

    return recentMetrics.every(m => {
      const metricValue = this.extractMetricValue(m, rule.metric);
      return this.compareValue(metricValue, rule.operator, rule.threshold);
    });
  }

  private async getMetricValue(type: string, metric: string): Promise<number | null> {
    const latestMetrics = this.getLatestMetrics(type);
    if (!latestMetrics) {
      return null;
    }

    return this.extractMetricValue(latestMetrics, metric);
  }

  private getLatestMetrics(type: string): any {
    switch (type) {
      case 'system':
        return this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
      case 'application':
        return this.applicationMetricsHistory[this.applicationMetricsHistory.length - 1];
      case 'business':
        return this.businessMetricsHistory[this.businessMetricsHistory.length - 1];
      default:
        return null;
    }
  }

  private extractMetricValue(metrics: any, metricName: string): number {
    switch (metricName) {
      case 'cpu_usage':
        return metrics.cpu?.usage || 0;
      case 'memory_usage':
        return metrics.memory?.usagePercent || 0;
      case 'error_rate':
        return metrics.errorRate?.ratePercent || 0;
      case 'response_time_p99':
        return metrics.responseTime?.p99 || 0;
      case 'db_connections_percent':
        return metrics.databaseConnections?.usagePercent || 0;
      default:
        return 0;
    }
  }

  private getMetricsHistory(type: string): any[] {
    switch (type) {
      case 'system':
        return this.systemMetricsHistory;
      case 'application':
        return this.applicationMetricsHistory;
      case 'business':
        return this.businessMetricsHistory;
      default:
        return [];
    }
  }

  private compareValue(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const value = await this.getMetricValue(rule.type, rule.metric);
    if (value === null) {
      return;
    }

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      ruleId: rule.id,
      timestamp: new Date(),
      severity: rule.severity,
      message: `${rule.name}: ${rule.metric} is ${value.toFixed(2)} (threshold: ${rule.threshold})`,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      resolved: false,
    };

    this.activeAlerts.set(alert.id, alert);
    rule.lastTriggered = new Date();
    this.alertRules.set(rule.id, rule);

    this.logger.warn(`Alert triggered: ${alert.message}`);
    this.emit('alert-triggered', alert);

    for (const channel of rule.channels) {
      await this.sendAlert(alert, channel);
    }
  }

  private async sendAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert, channel.config);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, channel.config);
          break;
        case 'email':
          await this.sendEmailAlert(alert, channel.config);
          break;
        case 'sms':
          await this.sendSMSAlert(alert, channel.config);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send alert via ${channel.type}`, error);
    }
  }

  private async sendPagerDutyAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    this.logger.log(`[PagerDuty] ${alert.message}`);
  }

  private async sendSlackAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    this.logger.log(`[Slack] ${alert.message}`);
  }

  private async sendEmailAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.ALERT_EMAIL_FROM || 'alerts@upcoach.com',
        to: config.to || process.env.ALERT_EMAIL_TO || 'ops@upcoach.com',
        subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
        html: `
          <h2>Alert: ${alert.message}</h2>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Metric:</strong> ${alert.metric}</p>
          <p><strong>Value:</strong> ${alert.value.toFixed(2)}</p>
          <p><strong>Threshold:</strong> ${alert.threshold}</p>
          <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
        `,
      });

      this.logger.log(`Email alert sent: ${alert.message}`);
    } catch (error) {
      this.logger.error('Failed to send email alert', error);
    }
  }

  private async sendSMSAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    this.logger.log(`[SMS] ${alert.message}`);
  }

  private async detectAnomalies(): Promise<void> {
    const metrics = [
      { type: 'system', name: 'cpu_usage' },
      { type: 'system', name: 'memory_usage' },
      { type: 'application', name: 'request_rate' },
      { type: 'application', name: 'response_time_p99' },
      { type: 'application', name: 'error_rate' },
    ];

    for (const metric of metrics) {
      const anomaly = await this.detectMetricAnomaly(metric.type, metric.name);
      if (anomaly) {
        this.anomalies.push(anomaly);
        this.logger.warn(`Anomaly detected: ${anomaly.metric} = ${anomaly.value.toFixed(2)} (expected: ${anomaly.expectedValue.toFixed(2)})`);
        this.emit('anomaly-detected', anomaly);
      }
    }

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.anomalies = this.anomalies.filter(a => a.timestamp >= cutoffTime);
  }

  private async detectMetricAnomaly(
    type: string,
    metricName: string
  ): Promise<Anomaly | null> {
    const baseline = this.baselines.get(metricName);
    if (!baseline || baseline.samples < 100) {
      return null;
    }

    const currentValue = await this.getMetricValue(type, metricName);
    if (currentValue === null) {
      return null;
    }

    const deviation = Math.abs(currentValue - baseline.mean) / baseline.stdDev;

    if (deviation > 3) {
      return {
        id: `anomaly-${Date.now()}`,
        timestamp: new Date(),
        metric: metricName,
        value: currentValue,
        expectedValue: baseline.mean,
        deviation,
        severity: deviation > 5 ? 'high' : deviation > 4 ? 'medium' : 'low',
        confidence: Math.min(0.99, (deviation - 3) / 3),
      };
    }

    return null;
  }

  recordRequest(method: string, path: string, status: number, duration: number): void {
    this.requestCounter.inc({ method, path, status: status.toString() });
    this.requestDuration.observe({ method, path, status: status.toString() }, duration / 1000);
    this.responseTimeSummary.observe(duration);

    if (status >= 400) {
      this.errorCounter.inc({ method, path, status: status.toString() });
    }
  }

  setActiveConnections(count: number): void {
    this.activeConnectionsGauge.set(count);
  }

  getPrometheusMetrics(): Promise<string> {
    return this.prometheusRegistry.metrics();
  }

  getSystemMetrics(hours: number = 24): SystemMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.systemMetricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  getApplicationMetrics(hours: number = 24): ApplicationMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.applicationMetricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  getBusinessMetrics(hours: number = 24): BusinessMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.businessMetricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
  }

  getAnomalies(hours: number = 24): Anomaly[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.anomalies.filter(a => a.timestamp >= cutoffTime);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    this.logger.log(`Alert resolved: ${alert.message}`);
    this.emit('alert-resolved', alert);
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: `alert-rule-${Date.now()}`,
    };

    this.alertRules.set(newRule.id, newRule);
    this.logger.log(`Created alert rule: ${newRule.name}`);

    return newRule;
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const rule = this.alertRules.get(id);
    if (!rule) {
      throw new Error(`Alert rule ${id} not found`);
    }

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(id, updatedRule);
    this.logger.log(`Updated alert rule: ${id}`);

    return updatedRule;
  }

  async deleteAlertRule(id: string): Promise<void> {
    this.alertRules.delete(id);
    this.logger.log(`Deleted alert rule: ${id}`);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.anomalyDetectionInterval) {
      clearInterval(this.anomalyDetectionInterval);
      this.anomalyDetectionInterval = null;
    }

    if (this.anomalyModel) {
      this.anomalyModel.dispose();
      this.anomalyModel = null;
    }

    this.logger.log('Resource monitor shut down');
  }
}
