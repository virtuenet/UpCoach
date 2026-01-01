/**
 * Endpoint Detection and Response (EDR) System
 *
 * Cross-platform endpoint security with process, file, network, and memory monitoring
 * Supports Windows, macOS, Linux, and mobile platforms
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as tf from '@tensorflow/tfjs-node';
import { createHash } from 'crypto';
import axios from 'axios';
import WebSocket from 'ws';

const execAsync = promisify(exec);

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Endpoint {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
  osVersion: string;
  agentVersion: string;
  status: 'online' | 'offline' | 'isolated' | 'quarantined';
  lastSeen: Date;
  riskScore: number;
  tags: string[];
  users: string[];
  installedSoftware?: Software[];
  networkConnections?: NetworkConnection[];
}

export interface Software {
  name: string;
  version: string;
  vendor: string;
  installDate: Date;
  cve?: string[];
}

export interface ProcessEvent {
  id: string;
  endpointId: string;
  timestamp: Date;
  processId: number;
  parentProcessId: number;
  processName: string;
  commandLine: string;
  user: string;
  executable: string;
  hash: string;
  action: 'create' | 'terminate' | 'inject' | 'hollow';
  integrity: 'system' | 'high' | 'medium' | 'low';
  isSigned: boolean;
  signer?: string;
  networkActivity: boolean;
  fileActivity: boolean;
  registryActivity: boolean;
  suspicious: boolean;
  suspicionReasons?: string[];
}

export interface FileEvent {
  id: string;
  endpointId: string;
  timestamp: Date;
  filePath: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  action: 'create' | 'modify' | 'delete' | 'rename' | 'read';
  processName: string;
  user: string;
  previousHash?: string;
  isEncrypted?: boolean;
  isMalware?: boolean;
  yaraMatches?: string[];
  suspicious: boolean;
  suspicionReasons?: string[];
}

export interface NetworkConnection {
  id: string;
  endpointId: string;
  timestamp: Date;
  processName: string;
  processId: number;
  protocol: 'tcp' | 'udp' | 'icmp';
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  direction: 'inbound' | 'outbound';
  bytesIn: number;
  bytesOut: number;
  state: 'established' | 'listening' | 'closed';
  duration: number;
  isC2?: boolean;
  isExfiltration?: boolean;
  geoLocation?: string;
  reputation?: 'malicious' | 'suspicious' | 'unknown' | 'trusted';
}

export interface RegistryEvent {
  id: string;
  endpointId: string;
  timestamp: Date;
  action: 'create' | 'modify' | 'delete';
  keyPath: string;
  valueName?: string;
  valueType?: string;
  valueData?: string;
  processName: string;
  user: string;
  isPersistence?: boolean;
  isPrivilegeEscalation?: boolean;
  suspicious: boolean;
  suspicionReasons?: string[];
}

export interface MemoryEvent {
  id: string;
  endpointId: string;
  timestamp: Date;
  processId: number;
  processName: string;
  action: 'allocation' | 'protection' | 'injection' | 'scan';
  address: string;
  size: number;
  protection: string;
  hasShellcode?: boolean;
  hasRootkit?: boolean;
  suspicious: boolean;
  suspicionReasons?: string[];
}

export interface YaraRule {
  id: string;
  name: string;
  description: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  enabled: boolean;
}

export interface ThreatDetection {
  id: string;
  endpointId: string;
  timestamp: Date;
  type: 'process' | 'file' | 'network' | 'registry' | 'memory';
  severity: 'critical' | 'high' | 'medium' | 'low';
  name: string;
  description: string;
  mitreAttack?: string[];
  indicators: Array<ProcessEvent | FileEvent | NetworkConnection | RegistryEvent | MemoryEvent>;
  riskScore: number;
  status: 'active' | 'investigating' | 'remediated' | 'false_positive';
  recommendedActions: string[];
}

export interface ResponseAction {
  id: string;
  endpointId: string;
  timestamp: Date;
  action: 'isolate' | 'unisolate' | 'kill_process' | 'quarantine_file' | 'delete_file' | 'collect_forensics' | 'block_network';
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  executedBy: string;
}

export interface ForensicData {
  endpointId: string;
  timestamp: Date;
  processListing: ProcessInfo[];
  networkConnections: NetworkConnection[];
  loadedDrivers: DriverInfo[];
  startupPrograms: StartupInfo[];
  scheduledTasks: TaskInfo[];
  openFiles: string[];
  memoryDump?: string; // Path to memory dump
  diskImage?: string; // Path to disk image
}

export interface ProcessInfo {
  pid: number;
  name: string;
  path: string;
  commandLine: string;
  user: string;
  parentPid: number;
  cpuUsage: number;
  memoryUsage: number;
  threadCount: number;
}

export interface DriverInfo {
  name: string;
  path: string;
  version: string;
  isSigned: boolean;
  signer?: string;
}

export interface StartupInfo {
  name: string;
  command: string;
  location: string;
  user: string;
}

export interface TaskInfo {
  name: string;
  command: string;
  schedule: string;
  enabled: boolean;
  user: string;
}

export interface EDRMetrics {
  totalEndpoints: number;
  onlineEndpoints: number;
  isolatedEndpoints: number;
  activeThreats: number;
  threatsBlocked24h: number;
  avgResponseTime: number;
  processingQueueSize: number;
  platformDistribution: Record<string, number>;
}

// ============================================================================
// EDR Engine
// ============================================================================

export class EDREngine extends EventEmitter {
  private endpoints: Map<string, Endpoint> = new Map();
  private threats: Map<string, ThreatDetection> = new Map();
  private yaraRules: Map<string, YaraRule> = new Map();
  private responseActions: Map<string, ResponseAction> = new Map();
  private agentConnections: Map<string, WebSocket> = new Map();
  private behavioralModel: tf.LayersModel | null = null;
  private processTree: Map<string, ProcessEvent[]> = new Map();
  private fileIntegrityBaseline: Map<string, Map<string, string>> = new Map();
  private networkBaseline: Map<string, Set<string>> = new Map();
  private metrics: EDRMetrics = {
    totalEndpoints: 0,
    onlineEndpoints: 0,
    isolatedEndpoints: 0,
    activeThreats: 0,
    threatsBlocked24h: 0,
    avgResponseTime: 0,
    processingQueueSize: 0,
    platformDistribution: {}
  };

  constructor() {
    super();
    this.initializeYaraRules();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      console.log('Initializing EDR Engine...');

      // Initialize behavioral analysis model
      await this.initializeBehavioralModel();

      // Start background jobs
      this.startThreatHunting();
      this.startHealthMonitoring();
      this.startMetricsCollection();
      this.startBaselineLearning();

      console.log('EDR Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EDR Engine:', error);
      throw error;
    }
  }

  private async initializeBehavioralModel(): Promise<void> {
    try {
      // Create neural network for behavioral analysis
      const inputDim = 50;

      this.behavioralModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [inputDim], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.behavioralModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      console.log('Initialized behavioral analysis model');
    } catch (error) {
      console.error('Failed to initialize behavioral model:', error);
    }
  }

  private initializeYaraRules(): void {
    const defaultRules: YaraRule[] = [
      {
        id: 'yara-001',
        name: 'Mimikatz Detection',
        description: 'Detects Mimikatz credential dumping tool',
        rule: 'rule Mimikatz { strings: $s1="sekurlsa" $s2="lsadump" $s3="kerberos" condition: 2 of them }',
        severity: 'critical',
        tags: ['credential-theft', 'mimikatz'],
        enabled: true
      },
      {
        id: 'yara-002',
        name: 'Ransomware Indicators',
        description: 'Detects common ransomware patterns',
        rule: 'rule Ransomware { strings: $s1=".encrypted" $s2=".locked" $s3="README" condition: all of them }',
        severity: 'critical',
        tags: ['ransomware', 'encryption'],
        enabled: true
      },
      {
        id: 'yara-003',
        name: 'PowerShell Empire',
        description: 'Detects PowerShell Empire C2 framework',
        rule: 'rule PowerShellEmpire { strings: $s1="Invoke-Empire" $s2="Get-Keystrokes" condition: any of them }',
        severity: 'high',
        tags: ['c2', 'powershell'],
        enabled: true
      },
      {
        id: 'yara-004',
        name: 'Cobalt Strike Beacon',
        description: 'Detects Cobalt Strike beacon',
        rule: 'rule CobaltStrike { strings: $s1="ReflectiveLoader" $s2="beacon.dll" condition: any of them }',
        severity: 'critical',
        tags: ['c2', 'cobalt-strike'],
        enabled: true
      },
      {
        id: 'yara-005',
        name: 'Web Shell',
        description: 'Detects web shell backdoors',
        rule: 'rule WebShell { strings: $s1="eval(base64_decode" $s2="system($_GET" condition: any of them }',
        severity: 'high',
        tags: ['backdoor', 'webshell'],
        enabled: true
      }
    ];

    defaultRules.forEach(rule => this.yaraRules.set(rule.id, rule));
    console.log(`Initialized ${defaultRules.length} YARA rules`);
  }

  // ============================================================================
  // Endpoint Management
  // ============================================================================

  async registerEndpoint(endpoint: Omit<Endpoint, 'id' | 'lastSeen' | 'status' | 'riskScore'>): Promise<Endpoint> {
    const id = createHash('sha256')
      .update(`${endpoint.hostname}-${endpoint.macAddress}`)
      .digest('hex')
      .substring(0, 16);

    const newEndpoint: Endpoint = {
      ...endpoint,
      id,
      lastSeen: new Date(),
      status: 'online',
      riskScore: 0
    };

    this.endpoints.set(id, newEndpoint);
    this.metrics.totalEndpoints++;
    this.metrics.onlineEndpoints++;

    // Initialize baseline for endpoint
    this.fileIntegrityBaseline.set(id, new Map());
    this.networkBaseline.set(id, new Set());

    this.emit('endpoint:registered', newEndpoint);
    console.log(`Registered endpoint: ${endpoint.hostname} (${id})`);

    return newEndpoint;
  }

  async updateEndpointStatus(endpointId: string, status: Endpoint['status']): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) throw new Error('Endpoint not found');

    const oldStatus = endpoint.status;
    endpoint.status = status;
    endpoint.lastSeen = new Date();

    // Update metrics
    if (oldStatus === 'online' && status !== 'online') {
      this.metrics.onlineEndpoints--;
    } else if (oldStatus !== 'online' && status === 'online') {
      this.metrics.onlineEndpoints++;
    }

    if (status === 'isolated') {
      this.metrics.isolatedEndpoints++;
    } else if (oldStatus === 'isolated') {
      this.metrics.isolatedEndpoints--;
    }

    this.emit('endpoint:status_changed', { endpointId, oldStatus, newStatus: status });
  }

  getEndpoint(endpointId: string): Endpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  getAllEndpoints(): Endpoint[] {
    return Array.from(this.endpoints.values());
  }

  // ============================================================================
  // Process Monitoring
  // ============================================================================

  async monitorProcessEvent(event: ProcessEvent): Promise<void> {
    try {
      // Add to process tree
      const key = `${event.endpointId}-${event.parentProcessId}`;
      if (!this.processTree.has(key)) {
        this.processTree.set(key, []);
      }
      this.processTree.get(key)!.push(event);

      // Check for suspicious patterns
      await this.analyzeProcessEvent(event);

      // Emit event
      this.emit('process:event', event);
    } catch (error) {
      console.error('Failed to monitor process event:', error);
    }
  }

  private async analyzeProcessEvent(event: ProcessEvent): Promise<void> {
    const suspicionReasons: string[] = [];
    let suspicious = false;

    // Check for process injection
    if (event.action === 'inject') {
      suspicionReasons.push('Process injection detected');
      suspicious = true;
    }

    // Check for process hollowing
    if (event.action === 'hollow') {
      suspicionReasons.push('Process hollowing detected');
      suspicious = true;
    }

    // Check for unsigned executables
    if (!event.isSigned && event.integrity === 'system') {
      suspicionReasons.push('Unsigned process running with system privileges');
      suspicious = true;
    }

    // Check for suspicious parent-child relationships
    if (await this.isSuspiciousParentChild(event)) {
      suspicionReasons.push('Suspicious parent-child process relationship');
      suspicious = true;
    }

    // Check for known malicious hashes
    if (await this.isKnownMalware(event.hash)) {
      suspicionReasons.push('Known malware hash detected');
      suspicious = true;
      await this.createThreat({
        endpointId: event.endpointId,
        type: 'process',
        severity: 'critical',
        name: 'Known Malware Execution',
        description: `Detected execution of known malware: ${event.processName}`,
        mitreAttack: ['T1059'],
        indicators: [event]
      });
    }

    // Check for privilege escalation
    if (event.integrity === 'system' && event.parentProcessId > 0) {
      const parent = await this.getParentProcess(event.endpointId, event.parentProcessId);
      if (parent && parent.integrity !== 'system') {
        suspicionReasons.push('Potential privilege escalation');
        suspicious = true;
      }
    }

    // Check for suspicious command lines
    if (this.hasSuspiciousCommandLine(event.commandLine)) {
      suspicionReasons.push('Suspicious command line arguments');
      suspicious = true;
    }

    // Behavioral analysis
    if (this.behavioralModel) {
      const features = this.extractProcessFeatures(event);
      const prediction = await this.predictMalicious(features);
      if (prediction > 0.8) {
        suspicionReasons.push(`Behavioral analysis score: ${(prediction * 100).toFixed(1)}%`);
        suspicious = true;
      }
    }

    if (suspicious) {
      event.suspicious = true;
      event.suspicionReasons = suspicionReasons;

      await this.createThreat({
        endpointId: event.endpointId,
        type: 'process',
        severity: suspicionReasons.length > 2 ? 'high' : 'medium',
        name: 'Suspicious Process Activity',
        description: `Suspicious process detected: ${event.processName}`,
        mitreAttack: this.getMitreAttackTactics(event),
        indicators: [event]
      });
    }
  }

  private async isSuspiciousParentChild(event: ProcessEvent): Promise<boolean> {
    // Check for suspicious parent-child relationships
    const suspiciousPairs = [
      { parent: 'winword.exe', child: 'powershell.exe' },
      { parent: 'excel.exe', child: 'cmd.exe' },
      { parent: 'outlook.exe', child: 'powershell.exe' },
      { parent: 'svchost.exe', child: 'cmd.exe' },
      { parent: 'explorer.exe', child: 'powershell.exe' }
    ];

    const parent = await this.getParentProcess(event.endpointId, event.parentProcessId);
    if (!parent) return false;

    return suspiciousPairs.some(pair =>
      parent.processName.toLowerCase().includes(pair.parent.toLowerCase()) &&
      event.processName.toLowerCase().includes(pair.child.toLowerCase())
    );
  }

  private async getParentProcess(endpointId: string, parentPid: number): Promise<ProcessEvent | null> {
    for (const processes of this.processTree.values()) {
      const parent = processes.find(p => p.endpointId === endpointId && p.processId === parentPid);
      if (parent) return parent;
    }
    return null;
  }

  private hasSuspiciousCommandLine(commandLine: string): boolean {
    const suspiciousPatterns = [
      /powershell.*-enc.*[A-Za-z0-9+\/=]{50,}/, // Encoded PowerShell
      /Invoke-Expression.*downloadstring/i,
      /IEX.*Net\.WebClient/i,
      /bypass.*executionpolicy/i,
      /hidden.*windowstyle/i,
      /vssadmin.*delete.*shadows/i,
      /wmic.*process.*call.*create/i,
      /reg.*add.*run/i,
      /schtasks.*\/create/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(commandLine));
  }

  private extractProcessFeatures(event: ProcessEvent): number[] {
    const features = new Array(50).fill(0);

    // Basic features
    features[0] = event.isSigned ? 1 : 0;
    features[1] = event.networkActivity ? 1 : 0;
    features[2] = event.fileActivity ? 1 : 0;
    features[3] = event.registryActivity ? 1 : 0;

    // Integrity level encoding
    const integrityLevels = ['low', 'medium', 'high', 'system'];
    const integrityIndex = integrityLevels.indexOf(event.integrity);
    if (integrityIndex >= 0) features[4 + integrityIndex] = 1;

    // Action encoding
    const actions = ['create', 'terminate', 'inject', 'hollow'];
    const actionIndex = actions.indexOf(event.action);
    if (actionIndex >= 0) features[8 + actionIndex] = 1;

    // Command line features
    features[12] = event.commandLine.length / 1000; // Normalized length
    features[13] = (event.commandLine.match(/\s/g) || []).length / 50; // Word count
    features[14] = event.commandLine.includes('powershell') ? 1 : 0;
    features[15] = event.commandLine.includes('cmd') ? 1 : 0;
    features[16] = /[A-Za-z0-9+\/=]{50,}/.test(event.commandLine) ? 1 : 0; // Base64

    // Time features
    const hour = event.timestamp.getHours();
    features[17] = hour / 24;
    features[18] = event.timestamp.getDay() / 7;

    // Process name features
    features[19] = event.processName.toLowerCase().includes('powershell') ? 1 : 0;
    features[20] = event.processName.toLowerCase().includes('cmd') ? 1 : 0;
    features[21] = event.processName.toLowerCase().includes('wscript') ? 1 : 0;

    return features;
  }

  private async predictMalicious(features: number[]): Promise<number> {
    if (!this.behavioralModel) return 0;

    try {
      const inputTensor = tf.tensor2d([features]);
      const prediction = this.behavioralModel.predict(inputTensor) as tf.Tensor;
      const value = (await prediction.data())[0];

      inputTensor.dispose();
      prediction.dispose();

      return value;
    } catch (error) {
      console.error('Prediction failed:', error);
      return 0;
    }
  }

  // ============================================================================
  // File Monitoring
  // ============================================================================

  async monitorFileEvent(event: FileEvent): Promise<void> {
    try {
      // Check file integrity
      await this.checkFileIntegrity(event);

      // Check for ransomware patterns
      await this.detectRansomware(event);

      // Run YARA rules
      await this.runYaraRules(event);

      // Emit event
      this.emit('file:event', event);
    } catch (error) {
      console.error('Failed to monitor file event:', error);
    }
  }

  private async checkFileIntegrity(event: FileEvent): Promise<void> {
    const baseline = this.fileIntegrityBaseline.get(event.endpointId);
    if (!baseline) return;

    if (event.action === 'create') {
      baseline.set(event.filePath, event.fileHash);
    } else if (event.action === 'modify') {
      const originalHash = baseline.get(event.filePath);
      if (originalHash && originalHash !== event.fileHash) {
        event.suspicious = true;
        event.suspicionReasons = event.suspicionReasons || [];
        event.suspicionReasons.push('File integrity violation');

        await this.createThreat({
          endpointId: event.endpointId,
          type: 'file',
          severity: 'medium',
          name: 'File Integrity Violation',
          description: `File modified: ${event.filePath}`,
          mitreAttack: ['T1565'],
          indicators: [event]
        });
      }
      baseline.set(event.filePath, event.fileHash);
    } else if (event.action === 'delete') {
      baseline.delete(event.filePath);
    }
  }

  private async detectRansomware(event: FileEvent): Promise<void> {
    const suspicionReasons: string[] = [];
    let isRansomware = false;

    // Check for rapid encryption
    if (event.isEncrypted && event.action === 'modify') {
      const recentEvents = await this.getRecentFileEvents(event.endpointId, 60000); // Last minute
      const encryptionEvents = recentEvents.filter(e => e.isEncrypted && e.action === 'modify');

      if (encryptionEvents.length > 50) {
        suspicionReasons.push(`Rapid file encryption detected: ${encryptionEvents.length} files in 1 minute`);
        isRansomware = true;
      }
    }

    // Check for ransomware file extensions
    const ransomwareExtensions = /\.(encrypted|locked|crypto|crypt|cerber|locky|zepto|thor)$/i;
    if (ransomwareExtensions.test(event.fileName)) {
      suspicionReasons.push('Ransomware file extension detected');
      isRansomware = true;
    }

    // Check for ransom notes
    if (event.fileName.toLowerCase().includes('readme') && event.action === 'create') {
      suspicionReasons.push('Potential ransom note created');
      isRansomware = true;
    }

    if (isRansomware) {
      event.suspicious = true;
      event.suspicionReasons = suspicionReasons;

      await this.createThreat({
        endpointId: event.endpointId,
        type: 'file',
        severity: 'critical',
        name: 'Ransomware Activity Detected',
        description: `Ransomware activity detected on endpoint`,
        mitreAttack: ['T1486'],
        indicators: [event]
      });

      // Auto-isolate endpoint
      await this.isolateEndpoint(event.endpointId, 'Automatic isolation due to ransomware detection');
    }
  }

  private async runYaraRules(event: FileEvent): Promise<void> {
    for (const rule of this.yaraRules.values()) {
      if (!rule.enabled) continue;

      // Simplified YARA matching - in production, use actual YARA engine
      if (await this.matchesYaraRule(event, rule)) {
        event.isMalware = true;
        event.yaraMatches = event.yaraMatches || [];
        event.yaraMatches.push(rule.name);

        await this.createThreat({
          endpointId: event.endpointId,
          type: 'file',
          severity: rule.severity,
          name: `YARA Match: ${rule.name}`,
          description: rule.description,
          mitreAttack: ['T1204'],
          indicators: [event]
        });
      }
    }
  }

  private async matchesYaraRule(event: FileEvent, rule: YaraRule): Promise<boolean> {
    // Simplified matching - in production, use yara-nodejs or similar
    const rulePatterns = rule.rule.match(/\$\w+="([^"]+)"/g);
    if (!rulePatterns) return false;

    const patterns = rulePatterns.map(p => p.match(/"([^"]+)"/)?.[1]).filter(Boolean);
    const content = `${event.fileName} ${event.filePath}`.toLowerCase();

    return patterns.some(pattern => pattern && content.includes(pattern.toLowerCase()));
  }

  private async getRecentFileEvents(endpointId: string, timeWindowMs: number): Promise<FileEvent[]> {
    // In production, query from database
    return [];
  }

  // ============================================================================
  // Network Monitoring
  // ============================================================================

  async monitorNetworkConnection(connection: NetworkConnection): Promise<void> {
    try {
      // Check for C2 beaconing
      await this.detectC2Beaconing(connection);

      // Check for data exfiltration
      await this.detectDataExfiltration(connection);

      // Check reputation
      await this.checkNetworkReputation(connection);

      // Update baseline
      this.updateNetworkBaseline(connection);

      // Emit event
      this.emit('network:connection', connection);
    } catch (error) {
      console.error('Failed to monitor network connection:', error);
    }
  }

  private async detectC2Beaconing(connection: NetworkConnection): Promise<void> {
    const baseline = this.networkBaseline.get(connection.endpointId);
    if (!baseline) return;

    const connectionKey = `${connection.remoteIp}:${connection.remotePort}`;

    // Check for regular connection patterns (beaconing)
    const recentConnections = await this.getRecentNetworkConnections(connection.endpointId, connectionKey, 3600000);

    if (recentConnections.length >= 10) {
      // Analyze intervals
      const intervals = this.calculateConnectionIntervals(recentConnections);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Low variance indicates regular beaconing
      if (stdDev < avgInterval * 0.2) {
        connection.isC2 = true;

        await this.createThreat({
          endpointId: connection.endpointId,
          type: 'network',
          severity: 'critical',
          name: 'C2 Beaconing Detected',
          description: `Regular network beaconing to ${connection.remoteIp}`,
          mitreAttack: ['T1071', 'T1095'],
          indicators: [connection]
        });
      }
    }
  }

  private async detectDataExfiltration(connection: NetworkConnection): Promise<void> {
    // Check for large outbound transfers
    if (connection.direction === 'outbound' && connection.bytesOut > 100 * 1024 * 1024) { // >100MB
      connection.isExfiltration = true;

      await this.createThreat({
        endpointId: connection.endpointId,
        type: 'network',
        severity: 'high',
        name: 'Potential Data Exfiltration',
        description: `Large outbound transfer detected: ${(connection.bytesOut / 1024 / 1024).toFixed(2)} MB to ${connection.remoteIp}`,
        mitreAttack: ['T1041', 'T1048'],
        indicators: [connection]
      });
    }
  }

  private async checkNetworkReputation(connection: NetworkConnection): Promise<void> {
    // Check against threat intelligence
    const knownMaliciousIPs = new Set(['192.0.2.1', '198.51.100.1']);

    if (knownMaliciousIPs.has(connection.remoteIp)) {
      connection.reputation = 'malicious';

      await this.createThreat({
        endpointId: connection.endpointId,
        type: 'network',
        severity: 'critical',
        name: 'Connection to Known Malicious IP',
        description: `Connection to known malicious IP: ${connection.remoteIp}`,
        mitreAttack: ['T1071'],
        indicators: [connection]
      });
    }
  }

  private updateNetworkBaseline(connection: NetworkConnection): void {
    const baseline = this.networkBaseline.get(connection.endpointId);
    if (!baseline) return;

    const connectionKey = `${connection.remoteIp}:${connection.remotePort}`;
    baseline.add(connectionKey);
  }

  private async getRecentNetworkConnections(endpointId: string, connectionKey: string, timeWindowMs: number): Promise<NetworkConnection[]> {
    // In production, query from database
    return [];
  }

  private calculateConnectionIntervals(connections: NetworkConnection[]): number[] {
    const timestamps = connections.map(c => c.timestamp.getTime()).sort();
    const intervals: number[] = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    return intervals;
  }

  // ============================================================================
  // Registry Monitoring (Windows)
  // ============================================================================

  async monitorRegistryEvent(event: RegistryEvent): Promise<void> {
    try {
      // Check for persistence mechanisms
      await this.detectPersistence(event);

      // Check for privilege escalation
      await this.detectPrivilegeEscalation(event);

      // Emit event
      this.emit('registry:event', event);
    } catch (error) {
      console.error('Failed to monitor registry event:', error);
    }
  }

  private async detectPersistence(event: RegistryEvent): Promise<void> {
    const persistenceKeys = [
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunServices',
      'SYSTEM\\CurrentControlSet\\Services'
    ];

    if (persistenceKeys.some(key => event.keyPath.includes(key))) {
      event.isPersistence = true;
      event.suspicious = true;
      event.suspicionReasons = ['Registry persistence mechanism'];

      await this.createThreat({
        endpointId: event.endpointId,
        type: 'registry',
        severity: 'medium',
        name: 'Registry Persistence Detected',
        description: `Registry persistence key modified: ${event.keyPath}`,
        mitreAttack: ['T1547'],
        indicators: [event]
      });
    }
  }

  private async detectPrivilegeEscalation(event: RegistryEvent): Promise<void> {
    const privEscKeys = [
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System',
      'SYSTEM\\CurrentControlSet\\Control\\Lsa'
    ];

    if (privEscKeys.some(key => event.keyPath.includes(key))) {
      event.isPrivilegeEscalation = true;
      event.suspicious = true;
      event.suspicionReasons = event.suspicionReasons || [];
      event.suspicionReasons.push('Registry privilege escalation');

      await this.createThreat({
        endpointId: event.endpointId,
        type: 'registry',
        severity: 'high',
        name: 'Registry Privilege Escalation',
        description: `Privilege escalation registry key modified: ${event.keyPath}`,
        mitreAttack: ['T1548'],
        indicators: [event]
      });
    }
  }

  // ============================================================================
  // Memory Analysis
  // ============================================================================

  async monitorMemoryEvent(event: MemoryEvent): Promise<void> {
    try {
      // Check for shellcode
      if (event.action === 'scan' && event.hasShellcode) {
        await this.createThreat({
          endpointId: event.endpointId,
          type: 'memory',
          severity: 'critical',
          name: 'Shellcode Detected in Memory',
          description: `Shellcode detected in process ${event.processName}`,
          mitreAttack: ['T1055'],
          indicators: [event]
        });
      }

      // Check for rootkit
      if (event.hasRootkit) {
        await this.createThreat({
          endpointId: event.endpointId,
          type: 'memory',
          severity: 'critical',
          name: 'Rootkit Detected',
          description: `Rootkit detected in process ${event.processName}`,
          mitreAttack: ['T1014'],
          indicators: [event]
        });
      }

      // Check for injection
      if (event.action === 'injection') {
        await this.createThreat({
          endpointId: event.endpointId,
          type: 'memory',
          severity: 'high',
          name: 'Memory Injection Detected',
          description: `Memory injection in process ${event.processName}`,
          mitreAttack: ['T1055'],
          indicators: [event]
        });
      }

      this.emit('memory:event', event);
    } catch (error) {
      console.error('Failed to monitor memory event:', error);
    }
  }

  // ============================================================================
  // Threat Management
  // ============================================================================

  private async createThreat(data: Omit<ThreatDetection, 'id' | 'timestamp' | 'riskScore' | 'status' | 'recommendedActions'>): Promise<void> {
    const threat: ThreatDetection = {
      ...data,
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      riskScore: this.calculateThreatRiskScore(data.severity, data.indicators.length),
      status: 'active',
      recommendedActions: this.generateRecommendedActions(data.type, data.severity)
    };

    this.threats.set(threat.id, threat);
    this.metrics.activeThreats++;
    this.metrics.threatsBlocked24h++;

    // Update endpoint risk score
    const endpoint = this.endpoints.get(data.endpointId);
    if (endpoint) {
      endpoint.riskScore = Math.min(endpoint.riskScore + threat.riskScore, 100);
    }

    this.emit('threat:detected', threat);
    console.log(`Threat detected: ${threat.name} on ${data.endpointId}`);
  }

  private calculateThreatRiskScore(severity: string, indicatorCount: number): number {
    const baseScores = { critical: 90, high: 70, medium: 50, low: 30 };
    const baseScore = baseScores[severity as keyof typeof baseScores] || 50;
    return Math.min(baseScore + (indicatorCount * 5), 100);
  }

  private generateRecommendedActions(type: string, severity: string): string[] {
    const actions: string[] = [];

    if (severity === 'critical') {
      actions.push('Isolate endpoint immediately');
      actions.push('Collect forensic data');
    }

    switch (type) {
      case 'process':
        actions.push('Kill suspicious process');
        actions.push('Analyze process memory');
        break;
      case 'file':
        actions.push('Quarantine file');
        actions.push('Run full malware scan');
        break;
      case 'network':
        actions.push('Block network connection');
        actions.push('Analyze network traffic');
        break;
      case 'registry':
        actions.push('Revert registry changes');
        actions.push('Scan for persistence mechanisms');
        break;
      case 'memory':
        actions.push('Create memory dump');
        actions.push('Terminate process');
        break;
    }

    actions.push('Investigate related events');
    actions.push('Update detection rules');

    return actions;
  }

  getThreat(threatId: string): ThreatDetection | undefined {
    return this.threats.get(threatId);
  }

  getAllThreats(): ThreatDetection[] {
    return Array.from(this.threats.values());
  }

  async updateThreatStatus(threatId: string, status: ThreatDetection['status']): Promise<void> {
    const threat = this.threats.get(threatId);
    if (!threat) throw new Error('Threat not found');

    threat.status = status;

    if (status === 'remediated' || status === 'false_positive') {
      this.metrics.activeThreats--;
    }

    this.emit('threat:status_changed', { threatId, status });
  }

  // ============================================================================
  // Response Actions
  // ============================================================================

  async isolateEndpoint(endpointId: string, reason: string): Promise<ResponseAction> {
    const action = await this.executeResponseAction({
      endpointId,
      action: 'isolate',
      target: endpointId,
      executedBy: 'system'
    });

    await this.updateEndpointStatus(endpointId, 'isolated');
    console.log(`Isolated endpoint ${endpointId}: ${reason}`);

    return action;
  }

  async unisolateEndpoint(endpointId: string): Promise<ResponseAction> {
    const action = await this.executeResponseAction({
      endpointId,
      action: 'unisolate',
      target: endpointId,
      executedBy: 'system'
    });

    await this.updateEndpointStatus(endpointId, 'online');
    console.log(`Unisolated endpoint ${endpointId}`);

    return action;
  }

  async killProcess(endpointId: string, processId: number): Promise<ResponseAction> {
    return this.executeResponseAction({
      endpointId,
      action: 'kill_process',
      target: processId.toString(),
      executedBy: 'system'
    });
  }

  async quarantineFile(endpointId: string, filePath: string): Promise<ResponseAction> {
    return this.executeResponseAction({
      endpointId,
      action: 'quarantine_file',
      target: filePath,
      executedBy: 'system'
    });
  }

  async deleteFile(endpointId: string, filePath: string): Promise<ResponseAction> {
    return this.executeResponseAction({
      endpointId,
      action: 'delete_file',
      target: filePath,
      executedBy: 'system'
    });
  }

  async collectForensics(endpointId: string): Promise<ForensicData> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) throw new Error('Endpoint not found');

    console.log(`Collecting forensic data from ${endpointId}...`);

    // In production, this would trigger actual forensic collection on the endpoint
    const forensicData: ForensicData = {
      endpointId,
      timestamp: new Date(),
      processListing: await this.collectProcessListing(endpointId),
      networkConnections: [],
      loadedDrivers: [],
      startupPrograms: [],
      scheduledTasks: [],
      openFiles: [],
      memoryDump: `/forensics/${endpointId}/memory-${Date.now()}.dmp`,
      diskImage: `/forensics/${endpointId}/disk-${Date.now()}.dd`
    };

    this.emit('forensics:collected', forensicData);
    return forensicData;
  }

  private async executeResponseAction(data: Omit<ResponseAction, 'id' | 'timestamp' | 'status'>): Promise<ResponseAction> {
    const action: ResponseAction = {
      ...data,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending'
    };

    this.responseActions.set(action.id, action);

    // Send command to agent
    const ws = this.agentConnections.get(data.endpointId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      action.status = 'in_progress';
      ws.send(JSON.stringify({
        type: 'command',
        action: data.action,
        target: data.target
      }));

      // Simulate completion
      setTimeout(() => {
        action.status = 'completed';
        action.result = 'Action completed successfully';
        this.emit('action:completed', action);
      }, 2000);
    } else {
      action.status = 'failed';
      action.result = 'Endpoint not connected';
    }

    return action;
  }

  private async collectProcessListing(endpointId: string): Promise<ProcessInfo[]> {
    // In production, collect from actual endpoint
    return [];
  }

  // ============================================================================
  // Integration with osquery
  // ============================================================================

  async queryOsquery(endpointId: string, query: string): Promise<any[]> {
    try {
      // In production, send query to osquery agent
      console.log(`Running osquery on ${endpointId}: ${query}`);
      return [];
    } catch (error) {
      console.error('Failed to query osquery:', error);
      throw error;
    }
  }

  // ============================================================================
  // Malware Detection
  // ============================================================================

  private async isKnownMalware(hash: string): Promise<boolean> {
    // Check against malware hash database
    const knownMalwareHashes = new Set([
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // Example
    ]);

    return knownMalwareHashes.has(hash);
  }

  private getMitreAttackTactics(event: ProcessEvent): string[] {
    const tactics: string[] = [];

    if (event.action === 'inject') tactics.push('T1055');
    if (event.action === 'hollow') tactics.push('T1055.012');
    if (event.commandLine.includes('powershell')) tactics.push('T1059.001');
    if (event.commandLine.includes('vssadmin')) tactics.push('T1490');
    if (event.integrity === 'system') tactics.push('T1068');

    return tactics;
  }

  // ============================================================================
  // Background Jobs
  // ============================================================================

  private startThreatHunting(): void {
    setInterval(async () => {
      try {
        console.log('Starting automated threat hunting...');
        // Implement threat hunting logic
      } catch (error) {
        console.error('Threat hunting failed:', error);
      }
    }, 3600000); // Every hour
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      for (const [id, endpoint] of this.endpoints.entries()) {
        const lastSeenAge = Date.now() - endpoint.lastSeen.getTime();
        if (lastSeenAge > 300000 && endpoint.status === 'online') { // 5 minutes
          this.updateEndpointStatus(id, 'offline');
        }
      }
    }, 60000); // Every minute
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 10000); // Every 10 seconds
  }

  private startBaselineLearning(): void {
    setInterval(async () => {
      console.log('Learning behavioral baselines...');
      // Implement baseline learning logic
    }, 86400000); // Every 24 hours
  }

  private updateMetrics(): void {
    this.metrics.platformDistribution = {};

    for (const endpoint of this.endpoints.values()) {
      this.metrics.platformDistribution[endpoint.platform] =
        (this.metrics.platformDistribution[endpoint.platform] || 0) + 1;
    }

    this.metrics.processingQueueSize = this.eventBuffer.length;
  }

  private eventBuffer: any[] = [];

  getMetrics(): EDRMetrics {
    return { ...this.metrics };
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down EDR Engine...');

      // Close agent connections
      for (const ws of this.agentConnections.values()) {
        ws.close();
      }

      console.log('EDR Engine shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

export default EDREngine;
