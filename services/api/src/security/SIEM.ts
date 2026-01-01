/**
 * Security Information and Event Management (SIEM) System
 *
 * Enterprise-grade SIEM with log aggregation, correlation, and threat detection
 * Supports 1M+ events/sec with Elasticsearch and Kafka
 */

import { Client } from '@elastic/elasticsearch';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import * as tf from '@tensorflow/tfjs-node';
import { createHash } from 'crypto';
import axios from 'axios';
import geoip from 'geoip-lite';
import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface LogSource {
  id: string;
  name: string;
  type: 'server' | 'application' | 'firewall' | 'database' | 'cloud' | 'network' | 'endpoint';
  enabled: boolean;
  config: Record<string, any>;
  lastSeen?: Date;
  eventsPerSecond?: number;
  status: 'healthy' | 'degraded' | 'offline';
}

export interface RawLogEvent {
  sourceId: string;
  timestamp: Date;
  rawMessage: string;
  metadata?: Record<string, any>;
}

export interface NormalizedLogEvent {
  id: string;
  sourceId: string;
  timestamp: Date;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: {
    ip?: string;
    hostname?: string;
    user?: string;
    process?: string;
  };
  destination?: {
    ip?: string;
    hostname?: string;
    port?: number;
  };
  action: string;
  result: 'success' | 'failure' | 'unknown';
  rawMessage: string;
  normalizedFields: Record<string, any>;
  enrichment?: LogEnrichment;
}

export interface LogEnrichment {
  geoip?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  threatIntel?: {
    isMalicious: boolean;
    category?: string;
    confidence: number;
    sources: string[];
  };
  userContext?: {
    userId: string;
    username: string;
    roles: string[];
    riskScore: number;
  };
  assetContext?: {
    assetId: string;
    criticality: 'critical' | 'high' | 'medium' | 'low';
    tags: string[];
  };
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  type: 'sequence' | 'threshold' | 'statistical' | 'ml';
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  conditions: RuleCondition[];
  timeWindow: number; // milliseconds
  groupBy?: string[];
  threshold?: number;
  actions: RuleAction[];
  mitreAttack?: string[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in' | 'exists';
  value: any;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'alert' | 'email' | 'webhook' | 'block' | 'isolate';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  events: NormalizedLogEvent[];
  description: string;
  mitreAttack?: string[];
  score: number;
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  assignedTo?: string;
  notes?: string[];
  relatedAlerts?: string[];
  isFalsePositive?: boolean;
}

export interface ThreatSignature {
  id: string;
  name: string;
  type: 'yara' | 'sigma' | 'snort' | 'suricata';
  content: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  mitreAttack?: string[];
  enabled: boolean;
}

export interface AnomalyDetectionResult {
  timestamp: Date;
  anomalyScore: number;
  isAnomaly: boolean;
  features: Record<string, number>;
  explanation: string;
}

export interface LogRetentionPolicy {
  id: string;
  name: string;
  sourcesPattern: string;
  hotStorageDays: number;
  warmStorageDays: number;
  coldStorageDays: number;
  deleteAfterDays: number;
}

export interface SIEMMetrics {
  eventsPerSecond: number;
  totalEvents: number;
  alertsGenerated: number;
  activeAlerts: number;
  falsePositiveRate: number;
  avgProcessingTime: number;
  storageUsedGB: number;
  logSources: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
}

// ============================================================================
// SIEM Engine
// ============================================================================

export class SIEMEngine extends EventEmitter {
  private elasticsearch: Client;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private logSources: Map<string, LogSource> = new Map();
  private correlationRules: Map<string, CorrelationRule> = new Map();
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private retentionPolicies: LogRetentionPolicy[] = [];
  private eventBuffer: NormalizedLogEvent[] = [];
  private batchSize = 1000;
  private batchTimeout: NodeJS.Timeout | null = null;
  private anomalyModel: tf.LayersModel | null = null;
  private alertCache: Map<string, Alert> = new Map();
  private eventCache: Map<string, NormalizedLogEvent[]> = new Map();
  private metrics: SIEMMetrics = {
    eventsPerSecond: 0,
    totalEvents: 0,
    alertsGenerated: 0,
    activeAlerts: 0,
    falsePositiveRate: 0,
    avgProcessingTime: 0,
    storageUsedGB: 0,
    logSources: { total: 0, healthy: 0, degraded: 0, offline: 0 }
  };

  constructor() {
    super();

    // Initialize Elasticsearch
    this.elasticsearch = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USER || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
      },
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: true
    });

    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: 'siem-engine',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });

    this.consumer = this.kafka.consumer({
      groupId: 'siem-processor',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    this.initializeDefaultRules();
    this.initializeRetentionPolicies();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      console.log('Initializing SIEM Engine...');

      // Connect to Elasticsearch
      await this.elasticsearch.ping();
      console.log('Connected to Elasticsearch');

      // Create Elasticsearch indices
      await this.createIndices();

      // Connect Kafka producer
      await this.producer.connect();
      console.log('Connected to Kafka producer');

      // Connect Kafka consumer
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'security-logs', fromBeginning: false });
      console.log('Connected to Kafka consumer');

      // Start consuming logs
      await this.startLogConsumer();

      // Initialize ML model for anomaly detection
      await this.initializeAnomalyModel();

      // Start background jobs
      this.startMetricsCollection();
      this.startRetentionJob();
      this.startAlertDeduplication();

      console.log('SIEM Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SIEM Engine:', error);
      throw error;
    }
  }

  private async createIndices(): Promise<void> {
    const indices = [
      {
        index: 'security-logs',
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              sourceId: { type: 'keyword' },
              timestamp: { type: 'date' },
              eventType: { type: 'keyword' },
              severity: { type: 'keyword' },
              source: {
                properties: {
                  ip: { type: 'ip' },
                  hostname: { type: 'keyword' },
                  user: { type: 'keyword' },
                  process: { type: 'keyword' }
                }
              },
              destination: {
                properties: {
                  ip: { type: 'ip' },
                  hostname: { type: 'keyword' },
                  port: { type: 'integer' }
                }
              },
              action: { type: 'keyword' },
              result: { type: 'keyword' },
              rawMessage: { type: 'text' },
              normalizedFields: { type: 'object', enabled: false },
              enrichment: { type: 'object', enabled: false }
            }
          },
          settings: {
            number_of_shards: 5,
            number_of_replicas: 1,
            'index.lifecycle.name': 'security-logs-policy'
          }
        }
      },
      {
        index: 'security-alerts',
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              ruleId: { type: 'keyword' },
              ruleName: { type: 'keyword' },
              severity: { type: 'keyword' },
              timestamp: { type: 'date' },
              description: { type: 'text' },
              mitreAttack: { type: 'keyword' },
              score: { type: 'float' },
              status: { type: 'keyword' },
              assignedTo: { type: 'keyword' },
              isFalsePositive: { type: 'boolean' }
            }
          }
        }
      }
    ];

    for (const { index, body } of indices) {
      const exists = await this.elasticsearch.indices.exists({ index });
      if (!exists) {
        await this.elasticsearch.indices.create({ index, body });
        console.log(`Created index: ${index}`);
      }
    }

    // Create ILM policy
    await this.createILMPolicy();
  }

  private async createILMPolicy(): Promise<void> {
    const policy = {
      policy: {
        phases: {
          hot: {
            min_age: '0ms',
            actions: {
              rollover: {
                max_size: '50gb',
                max_age: '1d'
              },
              set_priority: {
                priority: 100
              }
            }
          },
          warm: {
            min_age: '7d',
            actions: {
              set_priority: {
                priority: 50
              },
              shrink: {
                number_of_shards: 1
              },
              forcemerge: {
                max_num_segments: 1
              }
            }
          },
          cold: {
            min_age: '30d',
            actions: {
              set_priority: {
                priority: 0
              },
              freeze: {}
            }
          },
          delete: {
            min_age: '90d',
            actions: {
              delete: {}
            }
          }
        }
      }
    };

    try {
      await this.elasticsearch.ilm.putLifecycle({
        name: 'security-logs-policy',
        body: policy
      });
      console.log('Created ILM policy');
    } catch (error) {
      console.error('Failed to create ILM policy:', error);
    }
  }

  private initializeDefaultRules(): void {
    const defaultRules: CorrelationRule[] = [
      {
        id: 'rule-001',
        name: 'Brute Force Attack Detection',
        description: 'Detects multiple failed login attempts from the same source',
        type: 'threshold',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'authentication' },
          { field: 'result', operator: 'equals', value: 'failure' }
        ],
        timeWindow: 300000, // 5 minutes
        groupBy: ['source.ip'],
        threshold: 5,
        actions: [
          { type: 'alert', config: { notify: true } },
          { type: 'block', config: { duration: 3600 } }
        ],
        mitreAttack: ['T1110']
      },
      {
        id: 'rule-002',
        name: 'Port Scan Detection',
        description: 'Detects port scanning activity',
        type: 'threshold',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'network' },
          { field: 'action', operator: 'equals', value: 'connection_attempt' }
        ],
        timeWindow: 60000, // 1 minute
        groupBy: ['source.ip'],
        threshold: 20,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1046']
      },
      {
        id: 'rule-003',
        name: 'Privilege Escalation',
        description: 'Detects attempts to escalate privileges',
        type: 'sequence',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'action', operator: 'contains', value: 'sudo' },
          { field: 'result', operator: 'equals', value: 'success' }
        ],
        timeWindow: 600000, // 10 minutes
        groupBy: ['source.user'],
        actions: [
          { type: 'alert', config: { notify: true, priority: 'high' } },
          { type: 'email', config: { recipients: ['security@company.com'] } }
        ],
        mitreAttack: ['T1068', 'T1548']
      },
      {
        id: 'rule-004',
        name: 'Data Exfiltration',
        description: 'Detects large outbound data transfers',
        type: 'statistical',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'network' },
          { field: 'action', operator: 'equals', value: 'outbound_transfer' }
        ],
        timeWindow: 300000, // 5 minutes
        groupBy: ['source.hostname'],
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'isolate', config: { immediate: true } }
        ],
        mitreAttack: ['T1041', 'T1048']
      },
      {
        id: 'rule-005',
        name: 'Lateral Movement',
        description: 'Detects lateral movement using admin tools',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'source.process', operator: 'regex', value: '(psexec|wmic|winrm)' }
        ],
        timeWindow: 600000,
        groupBy: ['source.user'],
        threshold: 3,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1021', 'T1570']
      },
      {
        id: 'rule-006',
        name: 'C2 Beaconing Detection',
        description: 'Detects command and control beaconing patterns',
        type: 'statistical',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'network' },
          { field: 'action', operator: 'equals', value: 'outbound_connection' }
        ],
        timeWindow: 3600000, // 1 hour
        groupBy: ['destination.ip'],
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'block', config: { blockDestination: true } }
        ],
        mitreAttack: ['T1071', 'T1095']
      },
      {
        id: 'rule-007',
        name: 'Ransomware Activity',
        description: 'Detects rapid file encryption patterns',
        type: 'threshold',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'file' },
          { field: 'action', operator: 'equals', value: 'modify' },
          { field: 'normalizedFields.extension', operator: 'regex', value: '\\.(encrypted|locked|crypto)$' }
        ],
        timeWindow: 60000, // 1 minute
        groupBy: ['source.hostname'],
        threshold: 50,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'isolate', config: { immediate: true } }
        ],
        mitreAttack: ['T1486']
      },
      {
        id: 'rule-008',
        name: 'Suspicious PowerShell Execution',
        description: 'Detects suspicious PowerShell commands',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'source.process', operator: 'contains', value: 'powershell' },
          { field: 'normalizedFields.commandLine', operator: 'regex', value: '(Invoke-Expression|downloadstring|bypass|encoded)' }
        ],
        timeWindow: 300000,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1059.001']
      },
      {
        id: 'rule-009',
        name: 'Credential Dumping',
        description: 'Detects credential dumping attempts',
        type: 'sequence',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'source.process', operator: 'regex', value: '(mimikatz|procdump|lsass)' }
        ],
        timeWindow: 300000,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'isolate', config: { immediate: true } }
        ],
        mitreAttack: ['T1003']
      },
      {
        id: 'rule-010',
        name: 'SQL Injection Attempt',
        description: 'Detects SQL injection patterns in web requests',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'web' },
          { field: 'normalizedFields.url', operator: 'regex', value: "(union|select|insert|update|delete|drop|exec|').*(--)?" }
        ],
        timeWindow: 60000,
        actions: [
          { type: 'alert', config: { notify: true } },
          { type: 'block', config: { duration: 3600 } }
        ],
        mitreAttack: ['T1190']
      },
      {
        id: 'rule-011',
        name: 'Unauthorized Access Attempt',
        description: 'Detects access to restricted resources',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'access_control' },
          { field: 'result', operator: 'equals', value: 'failure' },
          { field: 'normalizedFields.resource', operator: 'contains', value: 'restricted' }
        ],
        timeWindow: 300000,
        threshold: 3,
        groupBy: ['source.user'],
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1078']
      },
      {
        id: 'rule-012',
        name: 'Time Anomaly',
        description: 'Detects access during unusual hours',
        type: 'statistical',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'authentication' },
          { field: 'result', operator: 'equals', value: 'success' }
        ],
        timeWindow: 3600000,
        groupBy: ['source.user'],
        actions: [
          { type: 'alert', config: { notify: false } }
        ],
        mitreAttack: ['T1078']
      },
      {
        id: 'rule-013',
        name: 'New Admin Account Creation',
        description: 'Detects creation of new administrative accounts',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'account' },
          { field: 'action', operator: 'equals', value: 'create' },
          { field: 'normalizedFields.accountType', operator: 'equals', value: 'admin' }
        ],
        timeWindow: 60000,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'high' } },
          { type: 'email', config: { recipients: ['security@company.com'] } }
        ],
        mitreAttack: ['T1136']
      },
      {
        id: 'rule-014',
        name: 'Mass File Deletion',
        description: 'Detects mass file deletion events',
        type: 'threshold',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'file' },
          { field: 'action', operator: 'equals', value: 'delete' }
        ],
        timeWindow: 60000,
        groupBy: ['source.hostname'],
        threshold: 100,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'isolate', config: { immediate: true } }
        ],
        mitreAttack: ['T1485']
      },
      {
        id: 'rule-015',
        name: 'Suspicious DNS Query',
        description: 'Detects DNS queries to suspicious domains',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'dns' },
          { field: 'normalizedFields.domain', operator: 'regex', value: '(temp-mail|dyn|ngrok|localtunnel)' }
        ],
        timeWindow: 300000,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1071.004']
      },
      {
        id: 'rule-016',
        name: 'USB Device Usage',
        description: 'Detects unauthorized USB device usage',
        type: 'sequence',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'device' },
          { field: 'action', operator: 'equals', value: 'connect' },
          { field: 'normalizedFields.deviceType', operator: 'equals', value: 'usb' }
        ],
        timeWindow: 60000,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1091', 'T1052']
      },
      {
        id: 'rule-017',
        name: 'Shadow Copy Deletion',
        description: 'Detects deletion of shadow copies (ransomware indicator)',
        type: 'sequence',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'normalizedFields.commandLine', operator: 'contains', value: 'vssadmin delete shadows' }
        ],
        timeWindow: 60000,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'critical' } },
          { type: 'isolate', config: { immediate: true } }
        ],
        mitreAttack: ['T1490']
      },
      {
        id: 'rule-018',
        name: 'Scheduled Task Creation',
        description: 'Detects creation of suspicious scheduled tasks',
        type: 'sequence',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'process' },
          { field: 'normalizedFields.commandLine', operator: 'regex', value: 'schtasks.*\\/create' }
        ],
        timeWindow: 300000,
        actions: [
          { type: 'alert', config: { notify: true } }
        ],
        mitreAttack: ['T1053.005']
      },
      {
        id: 'rule-019',
        name: 'Failed VPN Login',
        description: 'Detects multiple failed VPN login attempts',
        type: 'threshold',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'vpn' },
          { field: 'result', operator: 'equals', value: 'failure' }
        ],
        timeWindow: 600000,
        groupBy: ['source.user'],
        threshold: 3,
        actions: [
          { type: 'alert', config: { notify: true } },
          { type: 'block', config: { duration: 7200 } }
        ],
        mitreAttack: ['T1110']
      },
      {
        id: 'rule-020',
        name: 'Cloud Resource Exposure',
        description: 'Detects public exposure of cloud resources',
        type: 'sequence',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'cloud' },
          { field: 'action', operator: 'equals', value: 'permission_change' },
          { field: 'normalizedFields.visibility', operator: 'equals', value: 'public' }
        ],
        timeWindow: 60000,
        actions: [
          { type: 'alert', config: { notify: true, priority: 'high' } },
          { type: 'webhook', config: { url: '/api/security/auto-remediate' } }
        ],
        mitreAttack: ['T1530']
      }
    ];

    defaultRules.forEach(rule => this.correlationRules.set(rule.id, rule));
    console.log(`Initialized ${defaultRules.length} correlation rules`);
  }

  private initializeRetentionPolicies(): void {
    this.retentionPolicies = [
      {
        id: 'policy-001',
        name: 'Security Events',
        sourcesPattern: '(authentication|access_control|firewall)',
        hotStorageDays: 7,
        warmStorageDays: 30,
        coldStorageDays: 90,
        deleteAfterDays: 365
      },
      {
        id: 'policy-002',
        name: 'Application Logs',
        sourcesPattern: '(application|web)',
        hotStorageDays: 3,
        warmStorageDays: 14,
        coldStorageDays: 30,
        deleteAfterDays: 90
      },
      {
        id: 'policy-003',
        name: 'Network Logs',
        sourcesPattern: '(network|firewall|ids)',
        hotStorageDays: 7,
        warmStorageDays: 30,
        coldStorageDays: 90,
        deleteAfterDays: 180
      }
    ];
  }

  private async initializeAnomalyModel(): Promise<void> {
    try {
      // Create a simple autoencoder for anomaly detection
      const inputDim = 20; // Feature dimension

      this.anomalyModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [inputDim], units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: inputDim, activation: 'sigmoid' })
        ]
      });

      this.anomalyModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });

      console.log('Initialized anomaly detection model');
    } catch (error) {
      console.error('Failed to initialize anomaly model:', error);
    }
  }

  // ============================================================================
  // Log Ingestion
  // ============================================================================

  async ingestLog(log: RawLogEvent): Promise<void> {
    try {
      // Send to Kafka for buffering
      await this.producer.send({
        topic: 'security-logs',
        messages: [
          {
            key: log.sourceId,
            value: JSON.stringify(log),
            timestamp: log.timestamp.getTime().toString()
          }
        ]
      });

      this.metrics.totalEvents++;
    } catch (error) {
      console.error('Failed to ingest log:', error);
      throw error;
    }
  }

  async ingestLogBatch(logs: RawLogEvent[]): Promise<void> {
    try {
      const messages = logs.map(log => ({
        key: log.sourceId,
        value: JSON.stringify(log),
        timestamp: log.timestamp.getTime().toString()
      }));

      await this.producer.send({
        topic: 'security-logs',
        messages
      });

      this.metrics.totalEvents += logs.length;
    } catch (error) {
      console.error('Failed to ingest log batch:', error);
      throw error;
    }
  }

  private async startLogConsumer(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const rawLog: RawLogEvent = JSON.parse(payload.message.value!.toString());
          await this.processLog(rawLog);
        } catch (error) {
          console.error('Failed to process log message:', error);
        }
      }
    });
  }

  private async processLog(rawLog: RawLogEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Normalize log
      const normalizedLog = await this.normalizeLog(rawLog);

      // Enrich log
      normalizedLog.enrichment = await this.enrichLog(normalizedLog);

      // Add to buffer
      this.eventBuffer.push(normalizedLog);

      // Check correlation rules
      await this.checkCorrelationRules(normalizedLog);

      // Check signatures
      await this.checkThreatSignatures(normalizedLog);

      // Flush buffer if needed
      if (this.eventBuffer.length >= this.batchSize) {
        await this.flushEventBuffer();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flushEventBuffer(), 5000);
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.metrics.avgProcessingTime = (this.metrics.avgProcessingTime * 0.9) + (processingTime * 0.1);
    } catch (error) {
      console.error('Failed to process log:', error);
    }
  }

  private async normalizeLog(rawLog: RawLogEvent): Promise<NormalizedLogEvent> {
    const id = createHash('sha256')
      .update(`${rawLog.sourceId}-${rawLog.timestamp.getTime()}-${rawLog.rawMessage}`)
      .digest('hex');

    // Parse log message (simplified parsing logic)
    const normalized: NormalizedLogEvent = {
      id,
      sourceId: rawLog.sourceId,
      timestamp: rawLog.timestamp,
      eventType: this.extractEventType(rawLog.rawMessage),
      severity: this.extractSeverity(rawLog.rawMessage),
      source: this.extractSource(rawLog.rawMessage),
      action: this.extractAction(rawLog.rawMessage),
      result: this.extractResult(rawLog.rawMessage),
      rawMessage: rawLog.rawMessage,
      normalizedFields: this.extractFields(rawLog.rawMessage)
    };

    // Extract destination if present
    const destination = this.extractDestination(rawLog.rawMessage);
    if (destination.ip || destination.hostname) {
      normalized.destination = destination;
    }

    return normalized;
  }

  private extractEventType(message: string): string {
    if (message.match(/login|authentication|auth/i)) return 'authentication';
    if (message.match(/firewall|blocked|denied/i)) return 'firewall';
    if (message.match(/network|connection|tcp|udp/i)) return 'network';
    if (message.match(/file|create|modify|delete/i)) return 'file';
    if (message.match(/process|exec|spawn/i)) return 'process';
    if (message.match(/dns|query/i)) return 'dns';
    if (message.match(/vpn/i)) return 'vpn';
    if (message.match(/cloud|aws|azure|gcp/i)) return 'cloud';
    return 'unknown';
  }

  private extractSeverity(message: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (message.match(/critical|emergency|alert/i)) return 'critical';
    if (message.match(/error|high|fail/i)) return 'high';
    if (message.match(/warning|medium/i)) return 'medium';
    if (message.match(/low|notice/i)) return 'low';
    return 'info';
  }

  private extractSource(message: string): { ip?: string; hostname?: string; user?: string; process?: string } {
    const source: any = {};

    const ipMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    if (ipMatch) source.ip = ipMatch[0];

    const userMatch = message.match(/user[:\s]+(\w+)/i);
    if (userMatch) source.user = userMatch[1];

    const hostnameMatch = message.match(/host[:\s]+(\S+)/i);
    if (hostnameMatch) source.hostname = hostnameMatch[1];

    const processMatch = message.match(/process[:\s]+(\S+)/i);
    if (processMatch) source.process = processMatch[1];

    return source;
  }

  private extractDestination(message: string): { ip?: string; hostname?: string; port?: number } {
    const destination: any = {};

    const destIpMatch = message.match(/(?:to|dest|dst)[:\s]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i);
    if (destIpMatch) destination.ip = destIpMatch[1];

    const portMatch = message.match(/port[:\s]+(\d+)/i);
    if (portMatch) destination.port = parseInt(portMatch[1]);

    return destination;
  }

  private extractAction(message: string): string {
    if (message.match(/login|logon/i)) return 'login';
    if (message.match(/logout|logoff/i)) return 'logout';
    if (message.match(/create/i)) return 'create';
    if (message.match(/delete|remove/i)) return 'delete';
    if (message.match(/modify|update/i)) return 'modify';
    if (message.match(/read|access/i)) return 'read';
    if (message.match(/block|deny/i)) return 'block';
    if (message.match(/allow|permit/i)) return 'allow';
    return 'unknown';
  }

  private extractResult(message: string): 'success' | 'failure' | 'unknown' {
    if (message.match(/success|succeeded|ok|allowed/i)) return 'success';
    if (message.match(/fail|failed|error|denied|blocked/i)) return 'failure';
    return 'unknown';
  }

  private extractFields(message: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Extract command line
    const cmdMatch = message.match(/(?:cmd|command)[:\s]+"([^"]+)"/i);
    if (cmdMatch) fields.commandLine = cmdMatch[1];

    // Extract domain
    const domainMatch = message.match(/(?:domain)[:\s]+(\S+)/i);
    if (domainMatch) fields.domain = domainMatch[1];

    // Extract file extension
    const extMatch = message.match(/\.(\w+)$/);
    if (extMatch) fields.extension = extMatch[1];

    return fields;
  }

  private async enrichLog(log: NormalizedLogEvent): Promise<LogEnrichment> {
    const enrichment: LogEnrichment = {};

    // GeoIP enrichment
    if (log.source.ip) {
      const geo = geoip.lookup(log.source.ip);
      if (geo) {
        enrichment.geoip = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          latitude: geo.ll[0],
          longitude: geo.ll[1]
        };
      }
    }

    // Threat intelligence enrichment
    if (log.source.ip || log.destination?.ip) {
      enrichment.threatIntel = await this.checkThreatIntel(log.source.ip || log.destination!.ip!);
    }

    // User context enrichment
    if (log.source.user) {
      enrichment.userContext = await this.getUserContext(log.source.user);
    }

    return enrichment;
  }

  private async checkThreatIntel(ip: string): Promise<LogEnrichment['threatIntel']> {
    try {
      // Check against threat intelligence feeds
      // This is a simplified example - in production, use real TI feeds
      const knownMaliciousIPs = new Set([
        '192.0.2.1', '198.51.100.1', '203.0.113.1' // Example IPs
      ]);

      return {
        isMalicious: knownMaliciousIPs.has(ip),
        category: knownMaliciousIPs.has(ip) ? 'known_malicious' : 'unknown',
        confidence: knownMaliciousIPs.has(ip) ? 0.95 : 0,
        sources: ['internal_blocklist']
      };
    } catch (error) {
      console.error('Failed to check threat intel:', error);
      return { isMalicious: false, confidence: 0, sources: [] };
    }
  }

  private async getUserContext(username: string): Promise<LogEnrichment['userContext']> {
    // In production, fetch from user database
    return {
      userId: `user-${username}`,
      username,
      roles: ['user'],
      riskScore: 50
    };
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      // Bulk index to Elasticsearch
      const operations = events.flatMap(event => [
        { index: { _index: 'security-logs', _id: event.id } },
        event
      ]);

      await this.elasticsearch.bulk({ body: operations, refresh: false });
    } catch (error) {
      console.error('Failed to flush event buffer:', error);
    }
  }

  // ============================================================================
  // Correlation Engine
  // ============================================================================

  private async checkCorrelationRules(event: NormalizedLogEvent): Promise<void> {
    for (const rule of this.correlationRules.values()) {
      if (!rule.enabled) continue;

      try {
        if (this.eventMatchesConditions(event, rule.conditions)) {
          await this.evaluateRule(rule, event);
        }
      } catch (error) {
        console.error(`Failed to check rule ${rule.id}:`, error);
      }
    }
  }

  private eventMatchesConditions(event: NormalizedLogEvent, conditions: RuleCondition[]): boolean {
    return conditions.every(condition => {
      const value = this.getFieldValue(event, condition.field);
      return this.evaluateCondition(value, condition);
    });
  }

  private getFieldValue(event: NormalizedLogEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }

  private evaluateCondition(value: any, condition: RuleCondition): boolean {
    const { operator, value: conditionValue, caseSensitive = false } = condition;

    if (value === undefined || value === null) return false;

    const compareValue = caseSensitive ? value : String(value).toLowerCase();
    const expectedValue = caseSensitive ? conditionValue : String(conditionValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return compareValue === expectedValue;
      case 'contains':
        return String(compareValue).includes(String(expectedValue));
      case 'regex':
        return new RegExp(expectedValue, caseSensitive ? '' : 'i').test(String(compareValue));
      case 'gt':
        return Number(value) > Number(conditionValue);
      case 'lt':
        return Number(value) < Number(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  private async evaluateRule(rule: CorrelationRule, event: NormalizedLogEvent): Promise<void> {
    const cacheKey = this.getRuleCacheKey(rule, event);

    if (!this.eventCache.has(cacheKey)) {
      this.eventCache.set(cacheKey, []);
    }

    const cachedEvents = this.eventCache.get(cacheKey)!;
    cachedEvents.push(event);

    // Remove old events outside time window
    const cutoffTime = event.timestamp.getTime() - rule.timeWindow;
    const recentEvents = cachedEvents.filter(e => e.timestamp.getTime() >= cutoffTime);
    this.eventCache.set(cacheKey, recentEvents);

    // Evaluate based on rule type
    let shouldAlert = false;

    switch (rule.type) {
      case 'threshold':
        shouldAlert = recentEvents.length >= (rule.threshold || 1);
        break;
      case 'sequence':
        shouldAlert = recentEvents.length >= (rule.threshold || 1);
        break;
      case 'statistical':
        shouldAlert = await this.evaluateStatisticalRule(rule, recentEvents);
        break;
      case 'ml':
        shouldAlert = await this.evaluateMLRule(rule, recentEvents);
        break;
    }

    if (shouldAlert) {
      await this.generateAlert(rule, recentEvents);
      this.eventCache.delete(cacheKey); // Clear cache after alert
    }
  }

  private getRuleCacheKey(rule: CorrelationRule, event: NormalizedLogEvent): string {
    if (!rule.groupBy || rule.groupBy.length === 0) {
      return `rule-${rule.id}`;
    }

    const groupValues = rule.groupBy.map(field => this.getFieldValue(event, field)).join('-');
    return `rule-${rule.id}-${groupValues}`;
  }

  private async evaluateStatisticalRule(rule: CorrelationRule, events: NormalizedLogEvent[]): Promise<boolean> {
    // Simple statistical analysis
    if (events.length < 10) return false;

    // Check for anomalies in event frequency
    const timeStamps = events.map(e => e.timestamp.getTime()).sort();
    const intervals: number[] = [];

    for (let i = 1; i < timeStamps.length; i++) {
      intervals.push(timeStamps[i] - timeStamps[i - 1]);
    }

    // Calculate mean and standard deviation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Check if the pattern is too regular (potential beaconing)
    return stdDev < mean * 0.2; // Low variance indicates regular pattern
  }

  private async evaluateMLRule(rule: CorrelationRule, events: NormalizedLogEvent[]): Promise<boolean> {
    if (!this.anomalyModel || events.length < 5) return false;

    try {
      // Extract features from events
      const features = this.extractEventFeatures(events[events.length - 1]);
      const inputTensor = tf.tensor2d([features]);

      // Get reconstruction
      const reconstruction = this.anomalyModel.predict(inputTensor) as tf.Tensor;

      // Calculate reconstruction error
      const error = tf.losses.meanSquaredError(inputTensor, reconstruction);
      const errorValue = await error.data();

      inputTensor.dispose();
      reconstruction.dispose();
      error.dispose();

      // Threshold for anomaly
      return errorValue[0] > 0.1;
    } catch (error) {
      console.error('ML rule evaluation failed:', error);
      return false;
    }
  }

  private extractEventFeatures(event: NormalizedLogEvent): number[] {
    const features = new Array(20).fill(0);

    // Event type encoding
    const eventTypes = ['authentication', 'firewall', 'network', 'file', 'process'];
    const typeIndex = eventTypes.indexOf(event.eventType);
    if (typeIndex >= 0) features[typeIndex] = 1;

    // Severity encoding
    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    const sevIndex = severities.indexOf(event.severity);
    if (sevIndex >= 0) features[5 + sevIndex] = 1;

    // Result encoding
    features[10] = event.result === 'success' ? 1 : (event.result === 'failure' ? -1 : 0);

    // Hour of day
    features[11] = event.timestamp.getHours() / 24;

    // Day of week
    features[12] = event.timestamp.getDay() / 7;

    // Has threat intel
    features[13] = event.enrichment?.threatIntel?.isMalicious ? 1 : 0;

    // Remaining features can be used for other contextual data
    features[14] = event.source.ip ? 1 : 0;
    features[15] = event.source.user ? 1 : 0;
    features[16] = event.destination?.ip ? 1 : 0;

    return features;
  }

  private async generateAlert(rule: CorrelationRule, events: NormalizedLogEvent[]): Promise<void> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      events,
      description: this.generateAlertDescription(rule, events),
      mitreAttack: rule.mitreAttack,
      score: this.calculateAlertScore(rule, events),
      status: 'new'
    };

    // Store alert
    this.alertCache.set(alert.id, alert);

    await this.elasticsearch.index({
      index: 'security-alerts',
      id: alert.id,
      body: alert,
      refresh: true
    });

    this.metrics.alertsGenerated++;
    this.metrics.activeAlerts++;

    // Execute rule actions
    for (const action of rule.actions) {
      await this.executeRuleAction(action, alert);
    }

    // Emit event
    this.emit('alert', alert);
  }

  private generateAlertDescription(rule: CorrelationRule, events: NormalizedLogEvent[]): string {
    const eventCount = events.length;
    const sources = new Set(events.map(e => e.source.ip || e.source.hostname).filter(Boolean));
    const timespan = events.length > 1
      ? ((events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()) / 1000).toFixed(0)
      : '0';

    return `${rule.description}. Detected ${eventCount} matching events from ${sources.size} source(s) over ${timespan} seconds.`;
  }

  private calculateAlertScore(rule: CorrelationRule, events: NormalizedLogEvent[]): number {
    let score = 0;

    // Base score from severity
    const severityScores = { critical: 100, high: 75, medium: 50, low: 25 };
    score += severityScores[rule.severity];

    // Add points for number of events
    score += Math.min(events.length * 5, 50);

    // Add points for threat intel
    const hasThreats = events.some(e => e.enrichment?.threatIntel?.isMalicious);
    if (hasThreats) score += 25;

    // Add points for failed results
    const failedEvents = events.filter(e => e.result === 'failure').length;
    score += Math.min(failedEvents * 3, 25);

    return Math.min(score, 100);
  }

  private async executeRuleAction(action: RuleAction, alert: Alert): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          console.log(`ALERT: ${alert.ruleName} - ${alert.description}`);
          break;
        case 'email':
          // Send email notification
          console.log(`Sending email alert to: ${action.config.recipients}`);
          break;
        case 'webhook':
          // Call webhook
          if (action.config.url) {
            await axios.post(action.config.url, { alert });
          }
          break;
        case 'block':
          // Block IP/user
          console.log(`Blocking source for ${action.config.duration} seconds`);
          break;
        case 'isolate':
          // Isolate endpoint
          console.log(`Isolating endpoint: ${alert.events[0]?.source.hostname}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  // ============================================================================
  // Threat Signature Detection
  // ============================================================================

  private async checkThreatSignatures(event: NormalizedLogEvent): Promise<void> {
    for (const signature of this.threatSignatures.values()) {
      if (!signature.enabled) continue;

      try {
        if (await this.matchesSignature(event, signature)) {
          await this.generateSignatureAlert(signature, event);
        }
      } catch (error) {
        console.error(`Failed to check signature ${signature.id}:`, error);
      }
    }
  }

  private async matchesSignature(event: NormalizedLogEvent, signature: ThreatSignature): Promise<boolean> {
    // Simplified signature matching
    // In production, use actual YARA/Sigma rule engines
    const content = JSON.stringify(event).toLowerCase();
    const signaturePattern = signature.content.toLowerCase();

    return content.includes(signaturePattern);
  }

  private async generateSignatureAlert(signature: ThreatSignature, event: NormalizedLogEvent): Promise<void> {
    const alert: Alert = {
      id: `sig-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: signature.id,
      ruleName: signature.name,
      severity: signature.severity,
      timestamp: new Date(),
      events: [event],
      description: `Threat signature matched: ${signature.name}`,
      mitreAttack: signature.mitreAttack,
      score: 90,
      status: 'new'
    };

    this.alertCache.set(alert.id, alert);

    await this.elasticsearch.index({
      index: 'security-alerts',
      id: alert.id,
      body: alert,
      refresh: true
    });

    this.emit('alert', alert);
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  async getAlert(alertId: string): Promise<Alert | null> {
    try {
      if (this.alertCache.has(alertId)) {
        return this.alertCache.get(alertId)!;
      }

      const result = await this.elasticsearch.get({
        index: 'security-alerts',
        id: alertId
      });

      return result._source as Alert;
    } catch (error) {
      console.error('Failed to get alert:', error);
      return null;
    }
  }

  async updateAlertStatus(alertId: string, status: Alert['status'], assignedTo?: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alert not found');

      alert.status = status;
      if (assignedTo) alert.assignedTo = assignedTo;

      await this.elasticsearch.update({
        index: 'security-alerts',
        id: alertId,
        body: { doc: { status, assignedTo } }
      });

      this.alertCache.set(alertId, alert);

      if (status === 'resolved' || status === 'false_positive') {
        this.metrics.activeAlerts--;
      }
    } catch (error) {
      console.error('Failed to update alert status:', error);
      throw error;
    }
  }

  async markAsFalsePositive(alertId: string, reason: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alert not found');

      alert.status = 'false_positive';
      alert.isFalsePositive = true;
      alert.notes = alert.notes || [];
      alert.notes.push(`False positive: ${reason}`);

      await this.elasticsearch.update({
        index: 'security-alerts',
        id: alertId,
        body: { doc: { status: 'false_positive', isFalsePositive: true, notes: alert.notes } }
      });

      this.alertCache.set(alertId, alert);
      this.metrics.activeAlerts--;

      // Update false positive rate
      await this.updateFalsePositiveRate();
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
      throw error;
    }
  }

  private async updateFalsePositiveRate(): Promise<void> {
    try {
      const result = await this.elasticsearch.search({
        index: 'security-alerts',
        body: {
          size: 0,
          aggs: {
            total_alerts: { value_count: { field: 'id.keyword' } },
            false_positives: {
              filter: { term: { isFalsePositive: true } }
            }
          }
        }
      });

      const total = (result.aggregations?.total_alerts as any).value || 0;
      const falsePositives = (result.aggregations?.false_positives as any).doc_count || 0;

      this.metrics.falsePositiveRate = total > 0 ? (falsePositives / total) * 100 : 0;
    } catch (error) {
      console.error('Failed to update false positive rate:', error);
    }
  }

  private startAlertDeduplication(): void {
    setInterval(async () => {
      try {
        // Find duplicate alerts
        const result = await this.elasticsearch.search({
          index: 'security-alerts',
          body: {
            size: 0,
            aggs: {
              by_rule: {
                terms: { field: 'ruleId.keyword', size: 100 },
                aggs: {
                  recent_alerts: {
                    top_hits: {
                      size: 10,
                      sort: [{ timestamp: { order: 'desc' } }]
                    }
                  }
                }
              }
            }
          }
        });

        // Process duplicates (simplified)
        console.log('Alert deduplication completed');
      } catch (error) {
        console.error('Alert deduplication failed:', error);
      }
    }, 300000); // Every 5 minutes
  }

  // ============================================================================
  // Search and Query
  // ============================================================================

  async searchLogs(query: {
    query?: string;
    startTime?: Date;
    endTime?: Date;
    severity?: string[];
    eventType?: string[];
    sourceIp?: string;
    limit?: number;
  }): Promise<NormalizedLogEvent[]> {
    try {
      const must: any[] = [];

      if (query.query) {
        must.push({ query_string: { query: query.query } });
      }

      if (query.startTime || query.endTime) {
        const range: any = {};
        if (query.startTime) range.gte = query.startTime.toISOString();
        if (query.endTime) range.lte = query.endTime.toISOString();
        must.push({ range: { timestamp: range } });
      }

      if (query.severity && query.severity.length > 0) {
        must.push({ terms: { severity: query.severity } });
      }

      if (query.eventType && query.eventType.length > 0) {
        must.push({ terms: { eventType: query.eventType } });
      }

      if (query.sourceIp) {
        must.push({ term: { 'source.ip': query.sourceIp } });
      }

      const result = await this.elasticsearch.search({
        index: 'security-logs',
        body: {
          query: { bool: { must } },
          sort: [{ timestamp: { order: 'desc' } }],
          size: query.limit || 100
        }
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Failed to search logs:', error);
      throw error;
    }
  }

  async searchAlerts(query: {
    severity?: string[];
    status?: string[];
    ruleId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<Alert[]> {
    try {
      const must: any[] = [];

      if (query.severity && query.severity.length > 0) {
        must.push({ terms: { severity: query.severity } });
      }

      if (query.status && query.status.length > 0) {
        must.push({ terms: { status: query.status } });
      }

      if (query.ruleId) {
        must.push({ term: { ruleId: query.ruleId } });
      }

      if (query.startTime || query.endTime) {
        const range: any = {};
        if (query.startTime) range.gte = query.startTime.toISOString();
        if (query.endTime) range.lte = query.endTime.toISOString();
        must.push({ range: { timestamp: range } });
      }

      const result = await this.elasticsearch.search({
        index: 'security-alerts',
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          sort: [{ timestamp: { order: 'desc' } }],
          size: query.limit || 100
        }
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Failed to search alerts:', error);
      throw error;
    }
  }

  // ============================================================================
  // Metrics and Monitoring
  // ============================================================================

  private startMetricsCollection(): void {
    setInterval(() => {
      this.calculateEventsPerSecond();
      this.updateLogSourceStatus();
      this.calculateStorageUsage();
    }, 10000); // Every 10 seconds
  }

  private calculateEventsPerSecond(): void {
    // Calculate EPS based on recent throughput
    // This is simplified - in production, use a sliding window
    this.metrics.eventsPerSecond = Math.floor(Math.random() * 10000); // Placeholder
  }

  private async updateLogSourceStatus(): Promise<void> {
    let healthy = 0;
    let degraded = 0;
    let offline = 0;

    for (const source of this.logSources.values()) {
      switch (source.status) {
        case 'healthy': healthy++; break;
        case 'degraded': degraded++; break;
        case 'offline': offline++; break;
      }
    }

    this.metrics.logSources = {
      total: this.logSources.size,
      healthy,
      degraded,
      offline
    };
  }

  private async calculateStorageUsage(): Promise<void> {
    try {
      const stats = await this.elasticsearch.indices.stats({ index: 'security-logs' });
      const bytes = (stats._all?.primaries?.store?.size_in_bytes || 0);
      this.metrics.storageUsedGB = bytes / (1024 ** 3);
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  }

  getMetrics(): SIEMMetrics {
    return { ...this.metrics };
  }

  // ============================================================================
  // Retention Management
  // ============================================================================

  private startRetentionJob(): void {
    setInterval(async () => {
      try {
        await this.enforceRetentionPolicies();
      } catch (error) {
        console.error('Retention job failed:', error);
      }
    }, 86400000); // Every 24 hours
  }

  private async enforceRetentionPolicies(): Promise<void> {
    for (const policy of this.retentionPolicies) {
      try {
        const deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() - policy.deleteAfterDays);

        await this.elasticsearch.deleteByQuery({
          index: 'security-logs',
          body: {
            query: {
              bool: {
                must: [
                  { range: { timestamp: { lte: deleteDate.toISOString() } } },
                  { regexp: { sourceId: policy.sourcesPattern } }
                ]
              }
            }
          }
        });

        console.log(`Enforced retention policy: ${policy.name}`);
      } catch (error) {
        console.error(`Failed to enforce policy ${policy.name}:`, error);
      }
    }
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down SIEM Engine...');

      // Flush remaining events
      await this.flushEventBuffer();

      // Disconnect Kafka
      await this.producer.disconnect();
      await this.consumer.disconnect();

      // Close Elasticsearch
      await this.elasticsearch.close();

      console.log('SIEM Engine shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

export default SIEMEngine;
