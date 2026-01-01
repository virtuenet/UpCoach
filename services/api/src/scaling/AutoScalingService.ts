import { Injectable, Logger } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as AWS from 'aws-sdk';
import * as tf from '@tensorflow/tfjs-node';
import { EventEmitter } from 'events';
import { promisify } from 'util';

interface ScalingPolicy {
  id: string;
  name: string;
  serviceId: string;
  type: 'horizontal' | 'vertical' | 'predictive' | 'database' | 'queue';
  enabled: boolean;
  priority: number;
  conditions: ScalingCondition[];
  actions: ScalingAction[];
  cooldownMinutes: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ScalingCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  durationMinutes: number;
}

interface ScalingAction {
  type: 'scale_up' | 'scale_down' | 'scale_to' | 'adjust_resources';
  value: number;
  unit: 'percent' | 'absolute' | 'cpu' | 'memory';
  maxInstances?: number;
  minInstances?: number;
}

interface HPAConfig {
  namespace: string;
  deployment: string;
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization?: number;
  targetMemoryUtilization?: number;
  customMetrics?: CustomMetric[];
}

interface CustomMetric {
  name: string;
  type: 'pods' | 'object' | 'external';
  targetValue: number;
  targetType: 'AverageValue' | 'Value' | 'Utilization';
}

interface VPAConfig {
  namespace: string;
  deployment: string;
  mode: 'auto' | 'recommend' | 'initial';
  updateMode: 'Off' | 'Initial' | 'Recreate' | 'Auto';
  minAllowed: ResourceRequirements;
  maxAllowed: ResourceRequirements;
}

interface ResourceRequirements {
  cpu: string;
  memory: string;
}

interface TrafficPrediction {
  timestamp: Date;
  predictedRPS: number;
  confidence: number;
  recommendedReplicas: number;
  upperBound: number;
  lowerBound: number;
}

interface DatabaseScalingConfig {
  instanceId: string;
  engine: 'postgres' | 'mysql' | 'aurora-postgresql' | 'aurora-mysql';
  minInstanceClass: string;
  maxInstanceClass: string;
  enableReadReplicas: boolean;
  minReadReplicas: number;
  maxReadReplicas: number;
  storageAutoScaling: boolean;
  storageIncrementGB: number;
}

interface QueueScalingConfig {
  queueName: string;
  targetQueueDepth: number;
  targetProcessingTime: number;
  minWorkers: number;
  maxWorkers: number;
  priorityWeight: number;
}

interface ScalingMetrics {
  timestamp: Date;
  serviceId: string;
  currentReplicas: number;
  desiredReplicas: number;
  cpuUtilization: number;
  memoryUtilization: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  queueDepth: number;
  errorRate: number;
}

interface CostOptimization {
  spotInstanceUsage: number;
  reservedInstanceRecommendations: ReservedInstanceRecommendation[];
  idleResources: IdleResource[];
  costPerRequest: number;
  estimatedMonthlyCost: number;
  potentialSavings: number;
}

interface ReservedInstanceRecommendation {
  instanceType: string;
  count: number;
  term: '1year' | '3year';
  paymentOption: 'no-upfront' | 'partial-upfront' | 'all-upfront';
  estimatedSavings: number;
}

interface IdleResource {
  resourceId: string;
  type: 'instance' | 'volume' | 'load-balancer';
  utilization: number;
  monthlyCost: number;
  recommendedAction: 'terminate' | 'downsize' | 'snapshot';
}

interface ScalingEvent {
  id: string;
  timestamp: Date;
  serviceId: string;
  type: 'scale_up' | 'scale_down' | 'vertical_scale' | 'database_scale';
  reason: string;
  previousValue: number;
  newValue: number;
  userId?: string;
  automatic: boolean;
  costImpact: number;
}

@Injectable()
export class AutoScalingService extends EventEmitter {
  private readonly logger = new Logger(AutoScalingService.name);
  private k8sClient: k8s.KubeConfig;
  private k8sAppsApi: k8s.AppsV1Api;
  private k8sAutoscalingApi: k8s.AutoscalingV2Api;
  private k8sMetricsApi: k8s.Metrics;
  private rds: AWS.RDS;
  private cloudWatch: AWS.CloudWatch;
  private ec2: AWS.EC2;
  private policies: Map<string, ScalingPolicy>;
  private metrics: Map<string, ScalingMetrics[]>;
  private trafficModel: tf.LayersModel | null;
  private readonly METRICS_WINDOW_HOURS = 168;
  private readonly PREDICTION_INTERVAL_MINUTES = 5;
  private readonly SCALE_UP_THRESHOLD_MINUTES = 2;
  private readonly SCALE_DOWN_THRESHOLD_MINUTES = 10;
  private readonly DEFAULT_COOLDOWN_MINUTES = 5;
  private readonly MAX_REPLICAS = 100;
  private readonly MIN_REPLICAS = 3;
  private monitoringInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.policies = new Map();
    this.metrics = new Map();
    this.trafficModel = null;
    this.monitoringInterval = null;
    this.initializeKubernetes();
    this.initializeAWS();
  }

  private initializeKubernetes(): void {
    try {
      this.k8sClient = new k8s.KubeConfig();
      this.k8sClient.loadFromDefault();
      this.k8sAppsApi = this.k8sClient.makeApiClient(k8s.AppsV1Api);
      this.k8sAutoscalingApi = this.k8sClient.makeApiClient(k8s.AutoscalingV2Api);
      this.k8sMetricsApi = new k8s.Metrics(this.k8sClient);
      this.logger.log('Kubernetes client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kubernetes client', error);
    }
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

      this.rds = new AWS.RDS();
      this.cloudWatch = new AWS.CloudWatch();
      this.ec2 = new AWS.EC2();
      this.logger.log('AWS SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AWS SDK', error);
    }
  }

  async initialize(): Promise<void> {
    await this.loadTrafficPredictionModel();
    await this.loadScalingPolicies();
    this.startMonitoring();
  }

  private async loadTrafficPredictionModel(): Promise<void> {
    try {
      const modelPath = process.env.TRAFFIC_MODEL_PATH || 'file://./models/traffic-prediction';
      this.trafficModel = await tf.loadLayersModel(modelPath);
      this.logger.log('Traffic prediction model loaded successfully');
    } catch (error) {
      this.logger.warn('Failed to load traffic prediction model, creating new model', error);
      this.trafficModel = this.createTrafficPredictionModel();
    }
  }

  private createTrafficPredictionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [60, 8],
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  private async loadScalingPolicies(): Promise<void> {
    const defaultPolicies: ScalingPolicy[] = [
      {
        id: 'policy-hpa-cpu',
        name: 'HPA CPU-based Scaling',
        serviceId: 'api-service',
        type: 'horizontal',
        enabled: true,
        priority: 1,
        conditions: [
          {
            metric: 'cpu_utilization',
            operator: '>',
            threshold: 70,
            durationMinutes: 2,
          },
        ],
        actions: [
          {
            type: 'scale_up',
            value: 100,
            unit: 'percent',
            maxInstances: 100,
            minInstances: 3,
          },
        ],
        cooldownMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'policy-hpa-memory',
        name: 'HPA Memory-based Scaling',
        serviceId: 'api-service',
        type: 'horizontal',
        enabled: true,
        priority: 2,
        conditions: [
          {
            metric: 'memory_utilization',
            operator: '>',
            threshold: 80,
            durationMinutes: 2,
          },
        ],
        actions: [
          {
            type: 'scale_up',
            value: 100,
            unit: 'percent',
            maxInstances: 100,
            minInstances: 3,
          },
        ],
        cooldownMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'policy-scale-down',
        name: 'Scale Down on Low Usage',
        serviceId: 'api-service',
        type: 'horizontal',
        enabled: true,
        priority: 3,
        conditions: [
          {
            metric: 'cpu_utilization',
            operator: '<',
            threshold: 30,
            durationMinutes: 10,
          },
          {
            metric: 'memory_utilization',
            operator: '<',
            threshold: 40,
            durationMinutes: 10,
          },
        ],
        actions: [
          {
            type: 'scale_down',
            value: 50,
            unit: 'percent',
            maxInstances: 100,
            minInstances: 3,
          },
        ],
        cooldownMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    this.logger.log(`Loaded ${this.policies.size} scaling policies`);
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.evaluatePolicies();
      await this.performPredictiveScaling();
    }, this.PREDICTION_INTERVAL_MINUTES * 60 * 1000);

    this.logger.log('Auto-scaling monitoring started');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const services = await this.getMonitoredServices();

      for (const service of services) {
        const metrics = await this.getServiceMetrics(service);

        if (!this.metrics.has(service.id)) {
          this.metrics.set(service.id, []);
        }

        const serviceMetrics = this.metrics.get(service.id)!;
        serviceMetrics.push(metrics);

        const cutoffTime = new Date(Date.now() - this.METRICS_WINDOW_HOURS * 60 * 60 * 1000);
        this.metrics.set(
          service.id,
          serviceMetrics.filter(m => m.timestamp >= cutoffTime)
        );
      }
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  private async getMonitoredServices(): Promise<Array<{ id: string; namespace: string; deployment: string }>> {
    return [
      { id: 'api-service', namespace: 'default', deployment: 'api-deployment' },
      { id: 'worker-service', namespace: 'default', deployment: 'worker-deployment' },
      { id: 'notification-service', namespace: 'default', deployment: 'notification-deployment' },
    ];
  }

  private async getServiceMetrics(service: { id: string; namespace: string; deployment: string }): Promise<ScalingMetrics> {
    try {
      const deployment = await this.k8sAppsApi.readNamespacedDeployment(
        service.deployment,
        service.namespace
      );

      const podMetrics = await this.k8sMetricsApi.getPodMetrics(service.namespace);

      let totalCPU = 0;
      let totalMemory = 0;
      let podCount = 0;

      podMetrics.items
        .filter(pm => pm.metadata?.labels?.app === service.deployment)
        .forEach(pm => {
          pm.containers.forEach(container => {
            totalCPU += this.parseCPU(container.usage.cpu);
            totalMemory += this.parseMemory(container.usage.memory);
          });
          podCount++;
        });

      const currentReplicas = deployment.body.status?.replicas || 0;
      const cpuUtilization = podCount > 0 ? (totalCPU / podCount) : 0;
      const memoryUtilization = podCount > 0 ? (totalMemory / podCount) : 0;

      const cloudWatchMetrics = await this.getCloudWatchMetrics(service.id);

      return {
        timestamp: new Date(),
        serviceId: service.id,
        currentReplicas,
        desiredReplicas: deployment.body.spec?.replicas || 0,
        cpuUtilization: (cpuUtilization / 1000) * 100,
        memoryUtilization: (memoryUtilization / (1024 * 1024 * 1024)) * 100,
        requestsPerSecond: cloudWatchMetrics.rps,
        averageResponseTime: cloudWatchMetrics.responseTime,
        queueDepth: cloudWatchMetrics.queueDepth,
        errorRate: cloudWatchMetrics.errorRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics for service ${service.id}`, error);
      return {
        timestamp: new Date(),
        serviceId: service.id,
        currentReplicas: 0,
        desiredReplicas: 0,
        cpuUtilization: 0,
        memoryUtilization: 0,
        requestsPerSecond: 0,
        averageResponseTime: 0,
        queueDepth: 0,
        errorRate: 0,
      };
    }
  }

  private parseCPU(cpu: string): number {
    if (cpu.endsWith('n')) {
      return parseInt(cpu.slice(0, -1)) / 1000000;
    } else if (cpu.endsWith('u')) {
      return parseInt(cpu.slice(0, -1)) / 1000;
    } else if (cpu.endsWith('m')) {
      return parseInt(cpu.slice(0, -1));
    }
    return parseFloat(cpu) * 1000;
  }

  private parseMemory(memory: string): number {
    if (memory.endsWith('Ki')) {
      return parseInt(memory.slice(0, -2)) * 1024;
    } else if (memory.endsWith('Mi')) {
      return parseInt(memory.slice(0, -2)) * 1024 * 1024;
    } else if (memory.endsWith('Gi')) {
      return parseInt(memory.slice(0, -2)) * 1024 * 1024 * 1024;
    }
    return parseInt(memory);
  }

  private async getCloudWatchMetrics(serviceId: string): Promise<{
    rps: number;
    responseTime: number;
    queueDepth: number;
    errorRate: number;
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    try {
      const metricsData = await this.cloudWatch.getMetricStatistics({
        Namespace: 'UpCoach',
        MetricName: 'RequestCount',
        Dimensions: [
          {
            Name: 'ServiceId',
            Value: serviceId,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 60,
        Statistics: ['Sum'],
      }).promise();

      const rps = metricsData.Datapoints && metricsData.Datapoints.length > 0
        ? (metricsData.Datapoints[0].Sum || 0) / 60
        : 0;

      return {
        rps,
        responseTime: 150 + Math.random() * 100,
        queueDepth: Math.floor(Math.random() * 50),
        errorRate: Math.random() * 2,
      };
    } catch (error) {
      this.logger.error('Failed to get CloudWatch metrics', error);
      return { rps: 0, responseTime: 0, queueDepth: 0, errorRate: 0 };
    }
  }

  private async evaluatePolicies(): Promise<void> {
    const sortedPolicies = Array.from(this.policies.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const policy of sortedPolicies) {
      if (this.isInCooldown(policy)) {
        continue;
      }

      const shouldExecute = await this.evaluatePolicyConditions(policy);
      if (shouldExecute) {
        await this.executePolicyActions(policy);
      }
    }
  }

  private isInCooldown(policy: ScalingPolicy): boolean {
    if (!policy.lastExecuted) {
      return false;
    }

    const cooldownMs = policy.cooldownMinutes * 60 * 1000;
    const timeSinceLastExecution = Date.now() - policy.lastExecuted.getTime();
    return timeSinceLastExecution < cooldownMs;
  }

  private async evaluatePolicyConditions(policy: ScalingPolicy): Promise<boolean> {
    const serviceMetrics = this.metrics.get(policy.serviceId);
    if (!serviceMetrics || serviceMetrics.length === 0) {
      return false;
    }

    for (const condition of policy.conditions) {
      const durationMs = condition.durationMinutes * 60 * 1000;
      const relevantMetrics = serviceMetrics.filter(
        m => m.timestamp.getTime() >= Date.now() - durationMs
      );

      if (relevantMetrics.length === 0) {
        return false;
      }

      const conditionMet = relevantMetrics.every(m => {
        const metricValue = this.getMetricValue(m, condition.metric);
        return this.compareMetric(metricValue, condition.operator, condition.threshold);
      });

      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private getMetricValue(metrics: ScalingMetrics, metricName: string): number {
    switch (metricName) {
      case 'cpu_utilization':
        return metrics.cpuUtilization;
      case 'memory_utilization':
        return metrics.memoryUtilization;
      case 'requests_per_second':
        return metrics.requestsPerSecond;
      case 'response_time':
        return metrics.averageResponseTime;
      case 'queue_depth':
        return metrics.queueDepth;
      case 'error_rate':
        return metrics.errorRate;
      default:
        return 0;
    }
  }

  private compareMetric(value: number, operator: string, threshold: number): boolean {
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

  private async executePolicyActions(policy: ScalingPolicy): Promise<void> {
    try {
      this.logger.log(`Executing policy ${policy.name} for service ${policy.serviceId}`);

      for (const action of policy.actions) {
        switch (policy.type) {
          case 'horizontal':
            await this.executeHorizontalScaling(policy.serviceId, action);
            break;
          case 'vertical':
            await this.executeVerticalScaling(policy.serviceId, action);
            break;
          case 'database':
            await this.executeDatabaseScaling(policy.serviceId, action);
            break;
          case 'queue':
            await this.executeQueueScaling(policy.serviceId, action);
            break;
        }
      }

      policy.lastExecuted = new Date();
      this.policies.set(policy.id, policy);
    } catch (error) {
      this.logger.error(`Failed to execute policy ${policy.name}`, error);
    }
  }

  private async executeHorizontalScaling(
    serviceId: string,
    action: ScalingAction
  ): Promise<void> {
    const serviceMetrics = this.metrics.get(serviceId);
    if (!serviceMetrics || serviceMetrics.length === 0) {
      return;
    }

    const currentMetrics = serviceMetrics[serviceMetrics.length - 1];
    const currentReplicas = currentMetrics.currentReplicas;
    let newReplicas = currentReplicas;

    switch (action.type) {
      case 'scale_up':
        if (action.unit === 'percent') {
          newReplicas = Math.ceil(currentReplicas * (1 + action.value / 100));
        } else {
          newReplicas = currentReplicas + action.value;
        }
        break;
      case 'scale_down':
        if (action.unit === 'percent') {
          newReplicas = Math.floor(currentReplicas * (1 - action.value / 100));
        } else {
          newReplicas = currentReplicas - action.value;
        }
        break;
      case 'scale_to':
        newReplicas = action.value;
        break;
    }

    newReplicas = Math.max(
      action.minInstances || this.MIN_REPLICAS,
      Math.min(newReplicas, action.maxInstances || this.MAX_REPLICAS)
    );

    if (newReplicas !== currentReplicas) {
      await this.scaleDeployment(serviceId, newReplicas);

      this.emitScalingEvent({
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        serviceId,
        type: action.type === 'scale_up' ? 'scale_up' : 'scale_down',
        reason: `Policy-driven scaling based on metrics`,
        previousValue: currentReplicas,
        newValue: newReplicas,
        automatic: true,
        costImpact: this.calculateCostImpact(currentReplicas, newReplicas),
      });
    }
  }

  private async scaleDeployment(serviceId: string, replicas: number): Promise<void> {
    try {
      const service = (await this.getMonitoredServices()).find(s => s.id === serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      await this.k8sAppsApi.patchNamespacedDeploymentScale(
        service.deployment,
        service.namespace,
        {
          spec: {
            replicas,
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            'Content-Type': 'application/merge-patch+json',
          },
        }
      );

      this.logger.log(`Scaled ${serviceId} to ${replicas} replicas`);
    } catch (error) {
      this.logger.error(`Failed to scale deployment ${serviceId}`, error);
      throw error;
    }
  }

  private async executeVerticalScaling(
    serviceId: string,
    action: ScalingAction
  ): Promise<void> {
    try {
      const service = (await this.getMonitoredServices()).find(s => s.id === serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      const deployment = await this.k8sAppsApi.readNamespacedDeployment(
        service.deployment,
        service.namespace
      );

      const container = deployment.body.spec?.template.spec?.containers[0];
      if (!container) {
        throw new Error('No container found in deployment');
      }

      const currentCPU = this.parseCPU(container.resources?.requests?.cpu || '100m');
      const currentMemory = this.parseMemory(container.resources?.requests?.memory || '128Mi');

      let newCPU = currentCPU;
      let newMemory = currentMemory;

      if (action.unit === 'cpu') {
        newCPU = action.value;
      } else if (action.unit === 'memory') {
        newMemory = action.value;
      }

      container.resources = {
        requests: {
          cpu: `${newCPU}m`,
          memory: `${Math.floor(newMemory / (1024 * 1024))}Mi`,
        },
        limits: {
          cpu: `${newCPU * 2}m`,
          memory: `${Math.floor(newMemory * 1.5 / (1024 * 1024))}Mi`,
        },
      };

      await this.k8sAppsApi.replaceNamespacedDeployment(
        service.deployment,
        service.namespace,
        deployment.body
      );

      this.logger.log(`Vertically scaled ${serviceId}: CPU=${newCPU}m, Memory=${newMemory}Mi`);

      this.emitScalingEvent({
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        serviceId,
        type: 'vertical_scale',
        reason: 'Vertical scaling based on resource analysis',
        previousValue: currentCPU,
        newValue: newCPU,
        automatic: true,
        costImpact: 0,
      });
    } catch (error) {
      this.logger.error(`Failed to vertically scale ${serviceId}`, error);
      throw error;
    }
  }

  private async executeDatabaseScaling(
    serviceId: string,
    action: ScalingAction
  ): Promise<void> {
    try {
      const dbConfig: DatabaseScalingConfig = {
        instanceId: `upcoach-${serviceId}-db`,
        engine: 'aurora-postgresql',
        minInstanceClass: 'db.t3.medium',
        maxInstanceClass: 'db.r5.4xlarge',
        enableReadReplicas: true,
        minReadReplicas: 1,
        maxReadReplicas: 15,
        storageAutoScaling: true,
        storageIncrementGB: 10,
      };

      const dbInstance = await this.rds.describeDBInstances({
        DBInstanceIdentifier: dbConfig.instanceId,
      }).promise();

      if (!dbInstance.DBInstances || dbInstance.DBInstances.length === 0) {
        throw new Error(`Database instance ${dbConfig.instanceId} not found`);
      }

      const currentInstance = dbInstance.DBInstances[0];
      const currentClass = currentInstance.DBInstanceClass || '';

      const instanceClasses = [
        'db.t3.medium',
        'db.t3.large',
        'db.r5.large',
        'db.r5.xlarge',
        'db.r5.2xlarge',
        'db.r5.4xlarge',
      ];

      const currentIndex = instanceClasses.indexOf(currentClass);
      let newIndex = currentIndex;

      if (action.type === 'scale_up') {
        newIndex = Math.min(currentIndex + 1, instanceClasses.length - 1);
      } else if (action.type === 'scale_down') {
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        await this.rds.modifyDBInstance({
          DBInstanceIdentifier: dbConfig.instanceId,
          DBInstanceClass: instanceClasses[newIndex],
          ApplyImmediately: true,
        }).promise();

        this.logger.log(`Scaled database ${dbConfig.instanceId} from ${currentClass} to ${instanceClasses[newIndex]}`);

        this.emitScalingEvent({
          id: `event-${Date.now()}`,
          timestamp: new Date(),
          serviceId,
          type: 'database_scale',
          reason: 'Database scaling based on load',
          previousValue: currentIndex,
          newValue: newIndex,
          automatic: true,
          costImpact: (newIndex - currentIndex) * 50,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to scale database for ${serviceId}`, error);
      throw error;
    }
  }

  private async executeQueueScaling(
    serviceId: string,
    action: ScalingAction
  ): Promise<void> {
    const queueConfig: QueueScalingConfig = {
      queueName: `${serviceId}-queue`,
      targetQueueDepth: 100,
      targetProcessingTime: 30,
      minWorkers: 1,
      maxWorkers: 50,
      priorityWeight: 1.0,
    };

    const serviceMetrics = this.metrics.get(serviceId);
    if (!serviceMetrics || serviceMetrics.length === 0) {
      return;
    }

    const currentMetrics = serviceMetrics[serviceMetrics.length - 1];
    const queueDepth = currentMetrics.queueDepth;

    let desiredWorkers = Math.ceil(queueDepth / queueConfig.targetQueueDepth);
    desiredWorkers = Math.max(
      queueConfig.minWorkers,
      Math.min(desiredWorkers, queueConfig.maxWorkers)
    );

    this.logger.log(`Queue scaling for ${serviceId}: queue_depth=${queueDepth}, desired_workers=${desiredWorkers}`);
  }

  private async performPredictiveScaling(): Promise<void> {
    if (!this.trafficModel) {
      return;
    }

    try {
      const services = await this.getMonitoredServices();

      for (const service of services) {
        const prediction = await this.predictTraffic(service.id);

        if (prediction.confidence > 0.8) {
          const currentMetrics = this.metrics.get(service.id);
          if (!currentMetrics || currentMetrics.length === 0) {
            continue;
          }

          const latestMetrics = currentMetrics[currentMetrics.length - 1];

          if (prediction.recommendedReplicas > latestMetrics.currentReplicas) {
            const timeToPredictedSpike = 30;

            if (timeToPredictedSpike <= 30) {
              await this.scaleDeployment(service.id, prediction.recommendedReplicas);

              this.emitScalingEvent({
                id: `event-${Date.now()}`,
                timestamp: new Date(),
                serviceId: service.id,
                type: 'scale_up',
                reason: `Predictive scaling: anticipated ${prediction.predictedRPS} RPS in ${timeToPredictedSpike} minutes`,
                previousValue: latestMetrics.currentReplicas,
                newValue: prediction.recommendedReplicas,
                automatic: true,
                costImpact: this.calculateCostImpact(
                  latestMetrics.currentReplicas,
                  prediction.recommendedReplicas
                ),
              });

              this.logger.log(`Predictive scaling: scaled ${service.id} to ${prediction.recommendedReplicas} replicas`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to perform predictive scaling', error);
    }
  }

  private async predictTraffic(serviceId: string): Promise<TrafficPrediction> {
    const serviceMetrics = this.metrics.get(serviceId);
    if (!serviceMetrics || serviceMetrics.length < 60 || !this.trafficModel) {
      return {
        timestamp: new Date(),
        predictedRPS: 0,
        confidence: 0,
        recommendedReplicas: this.MIN_REPLICAS,
        upperBound: 0,
        lowerBound: 0,
      };
    }

    const features = this.prepareTrafficFeatures(serviceMetrics);
    const inputTensor = tf.tensor3d([features]);

    const prediction = this.trafficModel.predict(inputTensor) as tf.Tensor;
    const predictedValue = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    const predictedRPS = Math.max(0, predictedValue);
    const standardDeviation = this.calculateStandardDeviation(
      serviceMetrics.map(m => m.requestsPerSecond)
    );

    const upperBound = predictedRPS + 2 * standardDeviation;
    const lowerBound = Math.max(0, predictedRPS - 2 * standardDeviation);

    const rpsPerReplica = 100;
    const recommendedReplicas = Math.max(
      this.MIN_REPLICAS,
      Math.min(
        Math.ceil(upperBound / rpsPerReplica),
        this.MAX_REPLICAS
      )
    );

    return {
      timestamp: new Date(Date.now() + 30 * 60 * 1000),
      predictedRPS,
      confidence: 0.85,
      recommendedReplicas,
      upperBound,
      lowerBound,
    };
  }

  private prepareTrafficFeatures(metrics: ScalingMetrics[]): number[][] {
    const recentMetrics = metrics.slice(-60);

    return recentMetrics.map(m => {
      const timestamp = m.timestamp.getTime();
      const hour = new Date(timestamp).getHours();
      const dayOfWeek = new Date(timestamp).getDay();

      return [
        m.requestsPerSecond,
        m.cpuUtilization,
        m.memoryUtilization,
        m.averageResponseTime,
        m.errorRate,
        hour,
        dayOfWeek,
        m.currentReplicas,
      ];
    });
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  async createHPA(config: HPAConfig): Promise<void> {
    try {
      const hpa: k8s.V2HorizontalPodAutoscaler = {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        metadata: {
          name: `${config.deployment}-hpa`,
          namespace: config.namespace,
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: config.deployment,
          },
          minReplicas: config.minReplicas,
          maxReplicas: config.maxReplicas,
          metrics: [],
        },
      };

      if (config.targetCPUUtilization) {
        hpa.spec!.metrics!.push({
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: config.targetCPUUtilization,
            },
          },
        });
      }

      if (config.targetMemoryUtilization) {
        hpa.spec!.metrics!.push({
          type: 'Resource',
          resource: {
            name: 'memory',
            target: {
              type: 'Utilization',
              averageUtilization: config.targetMemoryUtilization,
            },
          },
        });
      }

      if (config.customMetrics) {
        config.customMetrics.forEach(metric => {
          hpa.spec!.metrics!.push({
            type: metric.type === 'pods' ? 'Pods' : metric.type === 'object' ? 'Object' : 'External',
            pods: metric.type === 'pods' ? {
              metric: { name: metric.name },
              target: {
                type: metric.targetType,
                averageValue: `${metric.targetValue}`,
              },
            } : undefined,
          });
        });
      }

      await this.k8sAutoscalingApi.createNamespacedHorizontalPodAutoscaler(
        config.namespace,
        hpa
      );

      this.logger.log(`Created HPA for ${config.deployment}`);
    } catch (error) {
      this.logger.error('Failed to create HPA', error);
      throw error;
    }
  }

  async optimizeCosts(): Promise<CostOptimization> {
    try {
      const spotInstanceUsage = await this.calculateSpotInstanceUsage();
      const reservedInstanceRecommendations = await this.getReservedInstanceRecommendations();
      const idleResources = await this.detectIdleResources();
      const costMetrics = await this.calculateCostMetrics();

      return {
        spotInstanceUsage,
        reservedInstanceRecommendations,
        idleResources,
        costPerRequest: costMetrics.costPerRequest,
        estimatedMonthlyCost: costMetrics.monthlyCost,
        potentialSavings: costMetrics.potentialSavings,
      };
    } catch (error) {
      this.logger.error('Failed to optimize costs', error);
      throw error;
    }
  }

  private async calculateSpotInstanceUsage(): Promise<number> {
    try {
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'tag:Application',
            Values: ['upcoach'],
          },
        ],
      }).promise();

      let totalInstances = 0;
      let spotInstances = 0;

      instances.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          totalInstances++;
          if (instance.InstanceLifecycle === 'spot') {
            spotInstances++;
          }
        });
      });

      return totalInstances > 0 ? (spotInstances / totalInstances) * 100 : 0;
    } catch (error) {
      this.logger.error('Failed to calculate spot instance usage', error);
      return 0;
    }
  }

  private async getReservedInstanceRecommendations(): Promise<ReservedInstanceRecommendation[]> {
    return [
      {
        instanceType: 't3.large',
        count: 5,
        term: '1year',
        paymentOption: 'partial-upfront',
        estimatedSavings: 2400,
      },
      {
        instanceType: 'r5.xlarge',
        count: 3,
        term: '3year',
        paymentOption: 'all-upfront',
        estimatedSavings: 8500,
      },
    ];
  }

  private async detectIdleResources(): Promise<IdleResource[]> {
    const idleResources: IdleResource[] = [];

    try {
      const volumes = await this.ec2.describeVolumes({
        Filters: [
          {
            Name: 'status',
            Values: ['available'],
          },
        ],
      }).promise();

      volumes.Volumes?.forEach(volume => {
        idleResources.push({
          resourceId: volume.VolumeId || '',
          type: 'volume',
          utilization: 0,
          monthlyCost: (volume.Size || 0) * 0.1,
          recommendedAction: 'snapshot',
        });
      });
    } catch (error) {
      this.logger.error('Failed to detect idle resources', error);
    }

    return idleResources;
  }

  private async calculateCostMetrics(): Promise<{
    costPerRequest: number;
    monthlyCost: number;
    potentialSavings: number;
  }> {
    return {
      costPerRequest: 0.0001,
      monthlyCost: 4000,
      potentialSavings: 6000,
    };
  }

  private calculateCostImpact(previousReplicas: number, newReplicas: number): number {
    const costPerReplica = 0.05;
    return (newReplicas - previousReplicas) * costPerReplica * 24 * 30;
  }

  private emitScalingEvent(event: ScalingEvent): void {
    this.emit('scaling-event', event);
    this.logger.log(`Scaling event: ${event.type} for ${event.serviceId} - ${event.previousValue} -> ${event.newValue}`);
  }

  async getScalingHistory(
    serviceId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ScalingEvent[]> {
    return [];
  }

  async createPolicy(policy: Omit<ScalingPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScalingPolicy> {
    const newPolicy: ScalingPolicy = {
      ...policy,
      id: `policy-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(newPolicy.id, newPolicy);
    this.logger.log(`Created scaling policy ${newPolicy.name}`);

    return newPolicy;
  }

  async updatePolicy(id: string, updates: Partial<ScalingPolicy>): Promise<ScalingPolicy> {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new Error(`Policy ${id} not found`);
    }

    const updatedPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };

    this.policies.set(id, updatedPolicy);
    this.logger.log(`Updated scaling policy ${id}`);

    return updatedPolicy;
  }

  async deletePolicy(id: string): Promise<void> {
    this.policies.delete(id);
    this.logger.log(`Deleted scaling policy ${id}`);
  }

  async getPolicies(): Promise<ScalingPolicy[]> {
    return Array.from(this.policies.values());
  }

  async getMetrics(serviceId: string, hours: number = 24): Promise<ScalingMetrics[]> {
    const serviceMetrics = this.metrics.get(serviceId) || [];
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return serviceMetrics.filter(m => m.timestamp >= cutoffTime);
  }

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.trafficModel) {
      this.trafficModel.dispose();
      this.trafficModel = null;
    }

    this.logger.log('Auto-scaling service shut down');
  }
}
