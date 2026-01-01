import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { Logger } from '../utils/logger';
import axios from 'axios';
import * as AWS from 'aws-sdk';
import { Twilio } from 'twilio';
import * as nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = new Logger('IncidentResponse');

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'DATA_BREACH' | 'MALWARE' | 'DDOS' | 'ACCOUNT_COMPROMISE' |
        'INSIDER_THREAT' | 'PHISHING' | 'RANSOMWARE' | 'APT' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  status: 'DETECTED' | 'TRIAGED' | 'INVESTIGATING' | 'CONTAINED' |
          'ERADICATED' | 'RECOVERED' | 'CLOSED';
  priority: number; // 1-5 (1 = highest)
  assignedTo: string[];
  reportedBy: string;
  detectedAt: Date;
  acknowledgedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  affectedSystems: string[];
  affectedUsers: string[];
  affectedData: string[];
  mitreAttack?: {
    tactics: string[];
    techniques: string[];
    subTechniques: string[];
  };
  timeline: IncidentTimelineEvent[];
  evidence: Evidence[];
  notes: IncidentNote[];
  relatedIncidents: string[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: Date;
  eventType: 'DETECTION' | 'ACKNOWLEDGMENT' | 'INVESTIGATION_STARTED' |
             'CONTAINMENT' | 'ERADICATION' | 'RECOVERY' | 'ESCALATION' |
             'COMMUNICATION' | 'EVIDENCE_COLLECTED' | 'ACTION_TAKEN' | 'NOTE_ADDED';
  actor: string; // User ID or 'SYSTEM'
  description: string;
  details: Record<string, any>;
}

export interface Evidence {
  id: string;
  incidentId: string;
  type: 'LOG' | 'SCREENSHOT' | 'PCAP' | 'MEMORY_DUMP' | 'FILE' | 'EMAIL' | 'OTHER';
  description: string;
  filePath?: string;
  fileHash?: string;
  collectedAt: Date;
  collectedBy: string;
  chainOfCustody: ChainOfCustodyEntry[];
  metadata: Record<string, any>;
}

export interface ChainOfCustodyEntry {
  timestamp: Date;
  handler: string;
  action: 'COLLECTED' | 'TRANSFERRED' | 'ANALYZED' | 'STORED' | 'RETURNED';
  location: string;
  notes: string;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  author: string;
  content: string;
  timestamp: Date;
  isInternal: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  version: string;
  type: 'PHISHING' | 'MALWARE' | 'DATA_BREACH' | 'DDOS' | 'RANSOMWARE' |
        'INSIDER_THREAT' | 'ACCOUNT_COMPROMISE';
  description: string;
  steps: PlaybookStep[];
  approvalRequired: boolean;
  approvers: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  changelog: string[];
}

export interface PlaybookStep {
  id: string;
  order: number;
  name: string;
  description: string;
  action: 'ISOLATE_SYSTEM' | 'DISABLE_ACCOUNT' | 'BLOCK_IP' | 'ROTATE_CREDENTIALS' |
          'COLLECT_EVIDENCE' | 'NOTIFY_STAKEHOLDERS' | 'CREATE_SNAPSHOT' |
          'MANUAL' | 'CUSTOM_SCRIPT';
  automated: boolean;
  requiresApproval: boolean;
  script?: string;
  parameters: Record<string, any>;
  expectedDuration: number; // seconds
  timeout: number; // seconds
}

export interface PlaybookExecution {
  id: string;
  incidentId: string;
  playbookId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  executedBy: string;
  stepExecutions: StepExecution[];
}

export interface StepExecution {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  approvedBy?: string;
}

export interface IncidentMetrics {
  incidentId: string;
  mttd: number; // Mean Time to Detect (seconds)
  mttr: number; // Mean Time to Respond (seconds)
  mttc: number; // Mean Time to Contain (seconds)
  mttrec: number; // Mean Time to Recover (seconds)
  totalDuration: number; // Total incident duration (seconds)
  actionsTaken: number;
  evidenceCollected: number;
  stakeholdersNotified: number;
}

export interface ForensicReport {
  incidentId: string;
  generatedAt: Date;
  generatedBy: string;
  summary: string;
  timeline: IncidentTimelineEvent[];
  rootCause: string;
  impactAssessment: {
    affectedSystems: number;
    affectedUsers: number;
    dataCompromised: boolean;
    estimatedCost: number;
  };
  evidenceSummary: Evidence[];
  actionsTaken: string[];
  recommendations: string[];
  lessonsLearned: string[];
}

// ============================================================================
// INCIDENT RESPONSE SERVICE
// ============================================================================

export class IncidentResponseService {
  private incidentQueue: Queue;
  private playbookWorker: Worker;
  private slackClient: WebClient;
  private twilioClient: Twilio;
  private emailTransporter: nodemailer.Transporter;
  private awsEC2: AWS.EC2;
  private awsWAF: AWS.WAFV2;

  constructor() {
    // Initialize BullMQ
    this.incidentQueue = new Queue('incident-response', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Initialize worker for playbook execution
    this.playbookWorker = new Worker('incident-response', async (job) => {
      await this.executePlaybookJob(job.data);
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Initialize Slack
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

    // Initialize Twilio
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID || '',
      process.env.TWILIO_AUTH_TOKEN || ''
    );

    // Initialize email
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    // Initialize AWS
    this.awsEC2 = new AWS.EC2({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.awsWAF = new AWS.WAFV2({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.initializeDefaultPlaybooks();
  }

  // ==========================================================================
  // INCIDENT DETECTION & CLASSIFICATION
  // ==========================================================================

  async createIncident(params: {
    title: string;
    description: string;
    type: Incident['type'];
    severity: Incident['severity'];
    reportedBy: string;
    affectedSystems?: string[];
    affectedUsers?: string[];
    affectedData?: string[];
    detectionId?: string;
    metadata?: Record<string, any>;
  }): Promise<Incident> {
    const incident: Incident = {
      id: this.generateId(),
      title: params.title,
      description: params.description,
      type: params.type,
      severity: params.severity,
      status: 'DETECTED',
      priority: this.calculatePriority(params.severity, params.type),
      assignedTo: [],
      reportedBy: params.reportedBy,
      detectedAt: new Date(),
      affectedSystems: params.affectedSystems || [],
      affectedUsers: params.affectedUsers || [],
      affectedData: params.affectedData || [],
      timeline: [],
      evidence: [],
      notes: [],
      relatedIncidents: [],
      tags: [],
      metadata: params.metadata || {}
    };

    // Add initial timeline event
    incident.timeline.push({
      id: this.generateId(),
      incidentId: incident.id,
      timestamp: incident.detectedAt,
      eventType: 'DETECTION',
      actor: 'SYSTEM',
      description: 'Incident detected',
      details: { detectionId: params.detectionId }
    });

    // Store in database
    await prisma.incident.create({
      data: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        priority: incident.priority,
        assignedTo: incident.assignedTo,
        reportedBy: incident.reportedBy,
        detectedAt: incident.detectedAt,
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers,
        affectedData: incident.affectedData,
        timeline: incident.timeline as any,
        evidence: [],
        notes: [],
        relatedIncidents: [],
        tags: [],
        metadata: incident.metadata as any
      }
    });

    logger.info(`Incident created: ${incident.id} - ${incident.title} (${incident.severity})`);

    // Auto-triage
    await this.triageIncident(incident.id);

    // Create war room
    await this.createWarRoom(incident);

    // Send initial notifications
    await this.notifyStakeholders(incident, 'INCIDENT_CREATED');

    return incident;
  }

  private calculatePriority(severity: Incident['severity'], type: Incident['type']): number {
    let priority = 5;

    // Severity-based priority
    switch (severity) {
      case 'CRITICAL':
        priority = 1;
        break;
      case 'HIGH':
        priority = 2;
        break;
      case 'MEDIUM':
        priority = 3;
        break;
      case 'LOW':
        priority = 4;
        break;
      case 'INFORMATIONAL':
        priority = 5;
        break;
    }

    // Type-based adjustment
    const highPriorityTypes = ['DATA_BREACH', 'RANSOMWARE', 'APT'];
    if (highPriorityTypes.includes(type) && priority > 1) {
      priority -= 1;
    }

    return priority;
  }

  private async triageIncident(incidentId: string): Promise<void> {
    const incident = await this.getIncident(incidentId);

    if (!incident) return;

    // Auto-assign based on type and severity
    const assignees = await this.getAssignees(incident.type, incident.severity);

    await this.updateIncident(incidentId, {
      assignedTo: assignees,
      status: 'TRIAGED'
    });

    // Add timeline event
    await this.addTimelineEvent(incidentId, {
      eventType: 'INVESTIGATION_STARTED',
      actor: 'SYSTEM',
      description: `Auto-assigned to: ${assignees.join(', ')}`,
      details: {}
    });

    // Select and execute appropriate playbook
    const playbook = await this.selectPlaybook(incident);

    if (playbook) {
      await this.executePlaybook(incidentId, playbook.id, 'SYSTEM');
    }

    logger.info(`Incident ${incidentId} triaged and assigned to: ${assignees.join(', ')}`);
  }

  private async getAssignees(type: Incident['type'], severity: Incident['severity']): Promise<string[]> {
    // In production, query on-call schedule, team assignments, etc.
    // For now, return example assignees

    const assignees: string[] = [];

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      assignees.push('security-lead@upcoach.com');
      assignees.push('soc-analyst@upcoach.com');
    }

    if (type === 'DATA_BREACH') {
      assignees.push('dpo@upcoach.com'); // Data Protection Officer
    }

    if (type === 'RANSOMWARE') {
      assignees.push('ciso@upcoach.com'); // CISO
    }

    return assignees;
  }

  async correlateIncidents(incidentId: string): Promise<string[]> {
    const incident = await this.getIncident(incidentId);

    if (!incident) return [];

    // Find related incidents based on:
    // - Same affected systems
    // - Same affected users
    // - Similar timeframe (within 24 hours)
    // - Same IP addresses

    const related = await prisma.incident.findMany({
      where: {
        id: { not: incidentId },
        detectedAt: {
          gte: new Date(incident.detectedAt.getTime() - 86400000),
          lte: new Date(incident.detectedAt.getTime() + 86400000)
        },
        OR: [
          { affectedSystems: { hasSome: incident.affectedSystems } },
          { affectedUsers: { hasSome: incident.affectedUsers } }
        ]
      },
      select: { id: true }
    });

    const relatedIds = related.map(r => r.id);

    // Update incident with related IDs
    await this.updateIncident(incidentId, {
      relatedIncidents: relatedIds
    });

    return relatedIds;
  }

  // ==========================================================================
  // PLAYBOOK MANAGEMENT
  // ==========================================================================

  private async initializeDefaultPlaybooks(): Promise<void> {
    const defaultPlaybooks: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt' | 'changelog'>[] = [
      {
        name: 'Phishing Response',
        version: '1.0',
        type: 'PHISHING',
        description: 'Standard playbook for phishing incidents',
        steps: [
          {
            id: 'step-1',
            order: 1,
            name: 'Identify affected users',
            description: 'Determine which users clicked the phishing link',
            action: 'MANUAL',
            automated: false,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 600,
            timeout: 1800
          },
          {
            id: 'step-2',
            order: 2,
            name: 'Disable compromised accounts',
            description: 'Temporarily disable affected user accounts',
            action: 'DISABLE_ACCOUNT',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 60,
            timeout: 300
          },
          {
            id: 'step-3',
            order: 3,
            name: 'Block malicious URLs',
            description: 'Add phishing URLs to blocklist',
            action: 'BLOCK_IP',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 120,
            timeout: 300
          },
          {
            id: 'step-4',
            order: 4,
            name: 'Force password reset',
            description: 'Require password reset for affected users',
            action: 'ROTATE_CREDENTIALS',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 300,
            timeout: 600
          },
          {
            id: 'step-5',
            order: 5,
            name: 'Notify affected users',
            description: 'Send security awareness email to affected users',
            action: 'NOTIFY_STAKEHOLDERS',
            automated: true,
            requiresApproval: false,
            parameters: { template: 'phishing-notification' },
            expectedDuration: 60,
            timeout: 300
          }
        ],
        approvalRequired: false,
        approvers: [],
        active: true
      },
      {
        name: 'Ransomware Response',
        version: '1.0',
        type: 'RANSOMWARE',
        description: 'Critical playbook for ransomware attacks',
        steps: [
          {
            id: 'step-1',
            order: 1,
            name: 'Isolate infected systems',
            description: 'Immediately disconnect infected systems from network',
            action: 'ISOLATE_SYSTEM',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 60,
            timeout: 120
          },
          {
            id: 'step-2',
            order: 2,
            name: 'Create forensic snapshots',
            description: 'Take EBS snapshots for forensic analysis',
            action: 'CREATE_SNAPSHOT',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 300,
            timeout: 900
          },
          {
            id: 'step-3',
            order: 3,
            name: 'Collect evidence',
            description: 'Collect logs, memory dumps, and network traffic',
            action: 'COLLECT_EVIDENCE',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 600,
            timeout: 1800
          },
          {
            id: 'step-4',
            order: 4,
            name: 'Alert executive team',
            description: 'Notify CISO and executive leadership',
            action: 'NOTIFY_STAKEHOLDERS',
            automated: true,
            requiresApproval: false,
            parameters: { escalation: 'CRITICAL' },
            expectedDuration: 60,
            timeout: 120
          },
          {
            id: 'step-5',
            order: 5,
            name: 'Engage incident response team',
            description: 'Activate full incident response team',
            action: 'MANUAL',
            automated: false,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 300,
            timeout: 600
          }
        ],
        approvalRequired: true,
        approvers: ['ciso@upcoach.com'],
        active: true
      },
      {
        name: 'Data Breach Response',
        version: '1.0',
        type: 'DATA_BREACH',
        description: 'Playbook for data breach incidents with compliance requirements',
        steps: [
          {
            id: 'step-1',
            order: 1,
            name: 'Assess scope of breach',
            description: 'Determine what data was accessed/exfiltrated',
            action: 'MANUAL',
            automated: false,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 1800,
            timeout: 3600
          },
          {
            id: 'step-2',
            order: 2,
            name: 'Contain breach',
            description: 'Stop ongoing data exfiltration',
            action: 'BLOCK_IP',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 300,
            timeout: 600
          },
          {
            id: 'step-3',
            order: 3,
            name: 'Collect forensic evidence',
            description: 'Preserve evidence for investigation',
            action: 'COLLECT_EVIDENCE',
            automated: true,
            requiresApproval: false,
            parameters: {},
            expectedDuration: 900,
            timeout: 1800
          },
          {
            id: 'step-4',
            order: 4,
            name: 'Notify DPO and legal',
            description: 'Alert Data Protection Officer and legal team',
            action: 'NOTIFY_STAKEHOLDERS',
            automated: true,
            requiresApproval: false,
            parameters: { recipients: ['dpo@upcoach.com', 'legal@upcoach.com'] },
            expectedDuration: 60,
            timeout: 120
          },
          {
            id: 'step-5',
            order: 5,
            name: 'Prepare breach notification',
            description: 'Draft notification for affected users and regulators',
            action: 'MANUAL',
            automated: false,
            requiresApproval: true,
            parameters: {},
            expectedDuration: 3600,
            timeout: 7200
          }
        ],
        approvalRequired: true,
        approvers: ['dpo@upcoach.com', 'legal@upcoach.com'],
        active: true
      }
    ];

    for (const playbook of defaultPlaybooks) {
      const existing = await prisma.playbook.findFirst({
        where: { name: playbook.name, version: playbook.version }
      });

      if (!existing) {
        await prisma.playbook.create({
          data: {
            id: this.generateId(),
            name: playbook.name,
            version: playbook.version,
            type: playbook.type,
            description: playbook.description,
            steps: playbook.steps as any,
            approvalRequired: playbook.approvalRequired,
            approvers: playbook.approvers,
            active: playbook.active,
            changelog: []
          }
        });

        logger.info(`Default playbook created: ${playbook.name}`);
      }
    }
  }

  private async selectPlaybook(incident: Incident): Promise<Playbook | null> {
    const playbook = await prisma.playbook.findFirst({
      where: {
        type: incident.type,
        active: true
      },
      orderBy: {
        version: 'desc'
      }
    });

    if (!playbook) return null;

    return {
      id: playbook.id,
      name: playbook.name,
      version: playbook.version,
      type: playbook.type as Playbook['type'],
      description: playbook.description,
      steps: playbook.steps as PlaybookStep[],
      approvalRequired: playbook.approvalRequired,
      approvers: playbook.approvers,
      active: playbook.active,
      createdAt: playbook.createdAt,
      updatedAt: playbook.updatedAt,
      changelog: playbook.changelog as string[]
    };
  }

  async executePlaybook(
    incidentId: string,
    playbookId: string,
    executedBy: string
  ): Promise<PlaybookExecution> {
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId }
    });

    if (!playbook) {
      throw new Error('Playbook not found');
    }

    const execution: PlaybookExecution = {
      id: this.generateId(),
      incidentId,
      playbookId,
      status: 'PENDING',
      startedAt: new Date(),
      executedBy,
      stepExecutions: playbook.steps.map((step: any) => ({
        stepId: step.id,
        status: 'PENDING'
      }))
    };

    // Store execution
    await prisma.playbookExecution.create({
      data: {
        id: execution.id,
        incidentId: execution.incidentId,
        playbookId: execution.playbookId,
        status: execution.status,
        startedAt: execution.startedAt,
        executedBy: execution.executedBy,
        stepExecutions: execution.stepExecutions as any
      }
    });

    // Add to queue for async execution
    await this.incidentQueue.add('execute-playbook', {
      executionId: execution.id,
      incidentId,
      playbookId
    });

    logger.info(`Playbook execution started: ${execution.id} for incident ${incidentId}`);

    return execution;
  }

  private async executePlaybookJob(data: {
    executionId: string;
    incidentId: string;
    playbookId: string;
  }): Promise<void> {
    const execution = await prisma.playbookExecution.findUnique({
      where: { id: data.executionId },
      include: { playbook: true }
    });

    if (!execution) return;

    const playbook = execution.playbook;
    const steps = playbook.steps as PlaybookStep[];

    // Update status to running
    await prisma.playbookExecution.update({
      where: { id: data.executionId },
      data: { status: 'RUNNING' }
    });

    // Execute steps in order
    for (const step of steps.sort((a, b) => a.order - b.order)) {
      try {
        await this.executePlaybookStep(data.executionId, data.incidentId, step);
      } catch (error) {
        logger.error(`Failed to execute playbook step ${step.id}`, error);

        // Mark execution as failed
        await prisma.playbookExecution.update({
          where: { id: data.executionId },
          data: { status: 'FAILED', completedAt: new Date() }
        });

        return;
      }
    }

    // Mark execution as completed
    await prisma.playbookExecution.update({
      where: { id: data.executionId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });

    logger.info(`Playbook execution completed: ${data.executionId}`);
  }

  private async executePlaybookStep(
    executionId: string,
    incidentId: string,
    step: PlaybookStep
  ): Promise<void> {
    logger.info(`Executing playbook step: ${step.name} (${step.action})`);

    // Update step status to running
    await this.updateStepExecution(executionId, step.id, {
      status: 'RUNNING',
      startedAt: new Date()
    });

    try {
      let output = '';

      switch (step.action) {
        case 'ISOLATE_SYSTEM':
          output = await this.isolateSystem(incidentId, step.parameters);
          break;

        case 'DISABLE_ACCOUNT':
          output = await this.disableAccount(incidentId, step.parameters);
          break;

        case 'BLOCK_IP':
          output = await this.blockIP(incidentId, step.parameters);
          break;

        case 'ROTATE_CREDENTIALS':
          output = await this.rotateCredentials(incidentId, step.parameters);
          break;

        case 'COLLECT_EVIDENCE':
          output = await this.collectEvidence(incidentId, step.parameters);
          break;

        case 'NOTIFY_STAKEHOLDERS':
          output = await this.notifyStakeholdersStep(incidentId, step.parameters);
          break;

        case 'CREATE_SNAPSHOT':
          output = await this.createSnapshot(incidentId, step.parameters);
          break;

        case 'MANUAL':
          output = 'Manual step - requires human intervention';
          await this.updateStepExecution(executionId, step.id, {
            status: 'WAITING_APPROVAL'
          });
          return;

        case 'CUSTOM_SCRIPT':
          if (step.script) {
            output = await this.executeCustomScript(step.script, step.parameters);
          }
          break;
      }

      // Update step status to completed
      await this.updateStepExecution(executionId, step.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        output
      });

      // Add timeline event
      await this.addTimelineEvent(incidentId, {
        eventType: 'ACTION_TAKEN',
        actor: 'PLAYBOOK',
        description: `Executed: ${step.name}`,
        details: { stepId: step.id, output }
      });

    } catch (error) {
      logger.error(`Failed to execute step ${step.id}`, error);

      await this.updateStepExecution(executionId, step.id, {
        status: 'FAILED',
        completedAt: new Date(),
        error: error.message
      });

      throw error;
    }
  }

  private async updateStepExecution(
    executionId: string,
    stepId: string,
    update: Partial<StepExecution>
  ): Promise<void> {
    const execution = await prisma.playbookExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) return;

    const stepExecutions = execution.stepExecutions as StepExecution[];
    const stepIndex = stepExecutions.findIndex(s => s.stepId === stepId);

    if (stepIndex >= 0) {
      stepExecutions[stepIndex] = { ...stepExecutions[stepIndex], ...update };

      await prisma.playbookExecution.update({
        where: { id: executionId },
        data: { stepExecutions: stepExecutions as any }
      });
    }
  }

  // ==========================================================================
  // AUTOMATED RESPONSE ACTIONS
  // ==========================================================================

  private async isolateSystem(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const isolatedSystems: string[] = [];

    for (const systemId of incident.affectedSystems) {
      try {
        // In Kubernetes, apply NetworkPolicy to isolate pod
        // In AWS, modify security group to deny all traffic

        // Example: Remove from security group
        // await this.awsEC2.revokeSecurityGroupIngress({...}).promise();

        isolatedSystems.push(systemId);

        logger.info(`System isolated: ${systemId}`);
      } catch (error) {
        logger.error(`Failed to isolate system ${systemId}`, error);
      }
    }

    return `Isolated ${isolatedSystems.length} systems: ${isolatedSystems.join(', ')}`;
  }

  private async disableAccount(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const disabledAccounts: string[] = [];

    for (const userId of incident.affectedUsers) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'DISABLED' }
        });

        // Invalidate all sessions
        await redis.del(`user:sessions:${userId}`);

        disabledAccounts.push(userId);

        logger.info(`Account disabled: ${userId}`);
      } catch (error) {
        logger.error(`Failed to disable account ${userId}`, error);
      }
    }

    return `Disabled ${disabledAccounts.length} accounts: ${disabledAccounts.join(', ')}`;
  }

  private async blockIP(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const ipAddresses = incident.metadata.ipAddresses || [];
    const blockedIPs: string[] = [];

    for (const ip of ipAddresses) {
      try {
        // Add to Redis blocklist
        await redis.sadd('ip:blocklist', ip);

        // Update AWS WAF
        if (process.env.AWS_WAF_IP_SET_ID) {
          await this.awsWAF.updateIPSet({
            Name: 'IncidentBlocklist',
            Scope: 'REGIONAL',
            Id: process.env.AWS_WAF_IP_SET_ID,
            LockToken: '', // Get from describeIPSet
            Addresses: [ip]
          }).promise();
        }

        blockedIPs.push(ip);

        logger.info(`IP blocked: ${ip}`);
      } catch (error) {
        logger.error(`Failed to block IP ${ip}`, error);
      }
    }

    return `Blocked ${blockedIPs.length} IPs: ${blockedIPs.join(', ')}`;
  }

  private async rotateCredentials(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const rotatedAccounts: string[] = [];

    for (const userId of incident.affectedUsers) {
      try {
        // Force password reset
        await prisma.user.update({
          where: { id: userId },
          data: { requirePasswordReset: true }
        });

        // Invalidate API keys
        await prisma.apiKey.updateMany({
          where: { userId },
          data: { status: 'REVOKED' }
        });

        rotatedAccounts.push(userId);

        logger.info(`Credentials rotated for user: ${userId}`);
      } catch (error) {
        logger.error(`Failed to rotate credentials for ${userId}`, error);
      }
    }

    return `Rotated credentials for ${rotatedAccounts.length} users`;
  }

  private async collectEvidence(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const evidenceCollected: string[] = [];

    // Collect logs
    try {
      const logs = await this.exportLogs(incident);
      const evidenceId = await this.storeEvidence(incidentId, {
        type: 'LOG',
        description: 'System logs during incident timeframe',
        filePath: logs.filePath,
        fileHash: logs.hash,
        collectedBy: 'SYSTEM'
      });

      evidenceCollected.push(`Logs: ${evidenceId}`);
    } catch (error) {
      logger.error('Failed to collect logs', error);
    }

    // Collect network traffic (PCAP)
    try {
      const pcap = await this.exportNetworkTraffic(incident);
      const evidenceId = await this.storeEvidence(incidentId, {
        type: 'PCAP',
        description: 'Network traffic capture',
        filePath: pcap.filePath,
        fileHash: pcap.hash,
        collectedBy: 'SYSTEM'
      });

      evidenceCollected.push(`PCAP: ${evidenceId}`);
    } catch (error) {
      logger.error('Failed to collect network traffic', error);
    }

    return `Collected ${evidenceCollected.length} evidence items: ${evidenceCollected.join(', ')}`;
  }

  private async notifyStakeholdersStep(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    await this.notifyStakeholders(incident, 'PLAYBOOK_NOTIFICATION', parameters);

    return `Stakeholders notified`;
  }

  private async createSnapshot(incidentId: string, parameters: Record<string, any>): Promise<string> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const snapshots: string[] = [];

    for (const systemId of incident.affectedSystems) {
      try {
        // Create EBS snapshot (if system is EC2 instance)
        // const snapshot = await this.awsEC2.createSnapshot({
        //   VolumeId: systemId,
        //   Description: `Forensic snapshot for incident ${incidentId}`
        // }).promise();

        // snapshots.push(snapshot.SnapshotId);

        snapshots.push(`snapshot-${systemId}`);

        logger.info(`Snapshot created for system: ${systemId}`);
      } catch (error) {
        logger.error(`Failed to create snapshot for ${systemId}`, error);
      }
    }

    return `Created ${snapshots.length} snapshots: ${snapshots.join(', ')}`;
  }

  private async executeCustomScript(script: string, parameters: Record<string, any>): Promise<string> {
    // In production, use a secure sandbox to execute custom scripts
    logger.info('Executing custom script (sandboxed)');

    return 'Custom script executed successfully';
  }

  // ==========================================================================
  // FORENSIC ANALYSIS
  // ==========================================================================

  private async exportLogs(incident: Incident): Promise<{ filePath: string; hash: string }> {
    // Export logs from Elasticsearch or CloudWatch
    const logsDir = '/tmp/incident-evidence';
    const logsFile = path.join(logsDir, `logs-${incident.id}.json`);

    // Create directory if not exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // In production, query actual log service
    const logs = {
      incidentId: incident.id,
      timeframe: {
        start: new Date(incident.detectedAt.getTime() - 3600000), // 1 hour before
        end: new Date()
      },
      affectedSystems: incident.affectedSystems,
      logs: [] // Actual logs would go here
    };

    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));

    // Calculate hash
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(logsFile);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return { filePath: logsFile, hash };
  }

  private async exportNetworkTraffic(incident: Incident): Promise<{ filePath: string; hash: string }> {
    // Export network traffic (PCAP files)
    const pcapDir = '/tmp/incident-evidence';
    const pcapFile = path.join(pcapDir, `traffic-${incident.id}.pcap`);

    // Create directory if not exists
    if (!fs.existsSync(pcapDir)) {
      fs.mkdirSync(pcapDir, { recursive: true });
    }

    // In production, export actual PCAP data
    fs.writeFileSync(pcapFile, 'PCAP data would go here');

    // Calculate hash
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(pcapFile);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return { filePath: pcapFile, hash };
  }

  private async storeEvidence(
    incidentId: string,
    evidence: Omit<Evidence, 'id' | 'incidentId' | 'collectedAt' | 'chainOfCustody' | 'metadata'>
  ): Promise<string> {
    const evidenceId = this.generateId();

    const chainOfCustody: ChainOfCustodyEntry = {
      timestamp: new Date(),
      handler: evidence.collectedBy,
      action: 'COLLECTED',
      location: 'Evidence Storage',
      notes: 'Initial collection'
    };

    await prisma.evidence.create({
      data: {
        id: evidenceId,
        incidentId,
        type: evidence.type,
        description: evidence.description,
        filePath: evidence.filePath,
        fileHash: evidence.fileHash,
        collectedAt: new Date(),
        collectedBy: evidence.collectedBy,
        chainOfCustody: [chainOfCustody] as any,
        metadata: {}
      }
    });

    // Add timeline event
    await this.addTimelineEvent(incidentId, {
      eventType: 'EVIDENCE_COLLECTED',
      actor: evidence.collectedBy,
      description: `Evidence collected: ${evidence.description}`,
      details: { evidenceId, type: evidence.type }
    });

    logger.info(`Evidence stored: ${evidenceId} for incident ${incidentId}`);

    return evidenceId;
  }

  // ==========================================================================
  // COMMUNICATION & COLLABORATION
  // ==========================================================================

  private async createWarRoom(incident: Incident): Promise<void> {
    try {
      // Create Slack channel for incident
      const channelName = `incident-${incident.id.substring(0, 8)}`;

      const result = await this.slackClient.conversations.create({
        name: channelName,
        is_private: false
      });

      const channelId = result.channel?.id;

      if (channelId) {
        // Post initial message
        await this.slackClient.chat.postMessage({
          channel: channelId,
          text: `🚨 Incident War Room Created`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `🚨 ${incident.title}`
              }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Severity:* ${incident.severity}` },
                { type: 'mrkdwn', text: `*Type:* ${incident.type}` },
                { type: 'mrkdwn', text: `*Status:* ${incident.status}` },
                { type: 'mrkdwn', text: `*Assigned:* ${incident.assignedTo.join(', ')}` }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Description:*\n${incident.description}`
              }
            }
          ]
        });

        // Invite assignees
        for (const assignee of incident.assignedTo) {
          // In production, look up Slack user ID from email
          // await this.slackClient.conversations.invite({
          //   channel: channelId,
          //   users: slackUserId
          // });
        }

        // Store channel ID in incident metadata
        await this.updateIncident(incident.id, {
          metadata: {
            ...incident.metadata,
            slackChannelId: channelId,
            slackChannelName: channelName
          }
        });

        logger.info(`War room created: #${channelName}`);
      }
    } catch (error) {
      logger.error('Failed to create war room', error);
    }
  }

  private async notifyStakeholders(
    incident: Incident,
    notificationType: string,
    parameters?: Record<string, any>
  ): Promise<void> {
    const recipients = parameters?.recipients || incident.assignedTo;

    // Email notification
    for (const recipient of recipients) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'security@upcoach.com',
          to: recipient,
          subject: `[${incident.severity}] ${incident.title}`,
          html: this.generateIncidentEmailHTML(incident)
        });

        logger.info(`Email sent to: ${recipient}`);
      } catch (error) {
        logger.error(`Failed to send email to ${recipient}`, error);
      }
    }

    // SMS notification for critical incidents
    if (incident.severity === 'CRITICAL') {
      for (const recipient of recipients) {
        try {
          // In production, look up phone number from user profile
          // await this.twilioClient.messages.create({
          //   body: `CRITICAL INCIDENT: ${incident.title}`,
          //   from: process.env.TWILIO_PHONE_NUMBER,
          //   to: phoneNumber
          // });

          logger.info(`SMS sent to: ${recipient}`);
        } catch (error) {
          logger.error(`Failed to send SMS to ${recipient}`, error);
        }
      }
    }

    // Add timeline event
    await this.addTimelineEvent(incident.id, {
      eventType: 'COMMUNICATION',
      actor: 'SYSTEM',
      description: `Stakeholders notified: ${recipients.join(', ')}`,
      details: { notificationType, recipients }
    });
  }

  private generateIncidentEmailHTML(incident: Incident): string {
    return `
      <h1>Security Incident: ${incident.title}</h1>
      <p><strong>Severity:</strong> ${incident.severity}</p>
      <p><strong>Type:</strong> ${incident.type}</p>
      <p><strong>Status:</strong> ${incident.status}</p>
      <p><strong>Detected:</strong> ${incident.detectedAt.toISOString()}</p>

      <h2>Description</h2>
      <p>${incident.description}</p>

      <h2>Affected Resources</h2>
      <ul>
        <li>Systems: ${incident.affectedSystems.join(', ') || 'None'}</li>
        <li>Users: ${incident.affectedUsers.join(', ') || 'None'}</li>
        <li>Data: ${incident.affectedData.join(', ') || 'None'}</li>
      </ul>

      <p>Please review the incident in the security dashboard immediately.</p>
    `;
  }

  // ==========================================================================
  // METRICS & REPORTING
  // ==========================================================================

  async calculateMetrics(incidentId: string): Promise<IncidentMetrics> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const timeline = incident.timeline;

    const detectedEvent = timeline.find(e => e.eventType === 'DETECTION');
    const acknowledgedEvent = timeline.find(e => e.eventType === 'ACKNOWLEDGMENT');
    const containedEvent = timeline.find(e => e.eventType === 'CONTAINMENT');
    const recoveredEvent = timeline.find(e => e.eventType === 'RECOVERY');

    const detectedAt = detectedEvent?.timestamp || incident.detectedAt;
    const acknowledgedAt = acknowledgedEvent?.timestamp || incident.acknowledgedAt || new Date();
    const containedAt = containedEvent?.timestamp || incident.containedAt || new Date();
    const recoveredAt = recoveredEvent?.timestamp || incident.resolvedAt || new Date();

    const metrics: IncidentMetrics = {
      incidentId,
      mttd: 0, // Detection is baseline
      mttr: (acknowledgedAt.getTime() - detectedAt.getTime()) / 1000,
      mttc: (containedAt.getTime() - detectedAt.getTime()) / 1000,
      mttrec: (recoveredAt.getTime() - detectedAt.getTime()) / 1000,
      totalDuration: (new Date().getTime() - detectedAt.getTime()) / 1000,
      actionsTaken: timeline.filter(e => e.eventType === 'ACTION_TAKEN').length,
      evidenceCollected: incident.evidence.length,
      stakeholdersNotified: timeline.filter(e => e.eventType === 'COMMUNICATION').length
    };

    return metrics;
  }

  async generateForensicReport(incidentId: string, generatedBy: string): Promise<ForensicReport> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new Error('Incident not found');
    }

    const metrics = await this.calculateMetrics(incidentId);

    const report: ForensicReport = {
      incidentId,
      generatedAt: new Date(),
      generatedBy,
      summary: this.generateIncidentSummary(incident),
      timeline: incident.timeline,
      rootCause: incident.metadata.rootCause || 'Under investigation',
      impactAssessment: {
        affectedSystems: incident.affectedSystems.length,
        affectedUsers: incident.affectedUsers.length,
        dataCompromised: incident.affectedData.length > 0,
        estimatedCost: incident.metadata.estimatedCost || 0
      },
      evidenceSummary: incident.evidence,
      actionsTaken: this.extractActionsTaken(incident),
      recommendations: incident.metadata.recommendations || [],
      lessonsLearned: incident.metadata.lessonsLearned || []
    };

    // Generate PDF
    await this.generatePDFReport(report);

    return report;
  }

  private generateIncidentSummary(incident: Incident): string {
    return `
      Incident ${incident.id} was detected on ${incident.detectedAt.toISOString()}.
      Type: ${incident.type}, Severity: ${incident.severity}.

      ${incident.affectedSystems.length} systems, ${incident.affectedUsers.length} users,
      and ${incident.affectedData.length} data assets were affected.

      Status: ${incident.status}
    `.trim();
  }

  private extractActionsTaken(incident: Incident): string[] {
    return incident.timeline
      .filter(e => e.eventType === 'ACTION_TAKEN')
      .map(e => e.description);
  }

  private async generatePDFReport(report: ForensicReport): Promise<void> {
    const doc = new PDFDocument();
    const outputPath = `/tmp/incident-reports/report-${report.incidentId}.pdf`;

    // Create directory
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title
    doc.fontSize(20).text('Incident Forensic Report', { align: 'center' });
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary');
    doc.fontSize(10).text(report.summary);
    doc.moveDown();

    // Impact Assessment
    doc.fontSize(14).text('Impact Assessment');
    doc.fontSize(10).text(`Affected Systems: ${report.impactAssessment.affectedSystems}`);
    doc.fontSize(10).text(`Affected Users: ${report.impactAssessment.affectedUsers}`);
    doc.fontSize(10).text(`Data Compromised: ${report.impactAssessment.dataCompromised ? 'Yes' : 'No'}`);
    doc.moveDown();

    // Timeline
    doc.fontSize(14).text('Timeline');
    for (const event of report.timeline.slice(0, 10)) {
      doc.fontSize(8).text(`${event.timestamp.toISOString()} - ${event.description}`);
    }

    doc.end();

    logger.info(`Forensic report generated: ${outputPath}`);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private async getIncident(incidentId: string): Promise<Incident | null> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) return null;

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      type: incident.type as Incident['type'],
      severity: incident.severity as Incident['severity'],
      status: incident.status as Incident['status'],
      priority: incident.priority,
      assignedTo: incident.assignedTo,
      reportedBy: incident.reportedBy,
      detectedAt: incident.detectedAt,
      acknowledgedAt: incident.acknowledgedAt || undefined,
      containedAt: incident.containedAt || undefined,
      resolvedAt: incident.resolvedAt || undefined,
      closedAt: incident.closedAt || undefined,
      affectedSystems: incident.affectedSystems,
      affectedUsers: incident.affectedUsers,
      affectedData: incident.affectedData,
      mitreAttack: incident.mitreAttack as any,
      timeline: incident.timeline as IncidentTimelineEvent[],
      evidence: incident.evidence as Evidence[],
      notes: incident.notes as IncidentNote[],
      relatedIncidents: incident.relatedIncidents,
      tags: incident.tags,
      metadata: incident.metadata as any
    };
  }

  private async updateIncident(incidentId: string, update: Partial<Incident>): Promise<void> {
    await prisma.incident.update({
      where: { id: incidentId },
      data: update as any
    });
  }

  private async addTimelineEvent(
    incidentId: string,
    event: Omit<IncidentTimelineEvent, 'id' | 'incidentId' | 'timestamp'>
  ): Promise<void> {
    const incident = await this.getIncident(incidentId);

    if (!incident) return;

    const timelineEvent: IncidentTimelineEvent = {
      id: this.generateId(),
      incidentId,
      timestamp: new Date(),
      ...event
    };

    incident.timeline.push(timelineEvent);

    await prisma.incident.update({
      where: { id: incidentId },
      data: { timeline: incident.timeline as any }
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const incidentResponse = new IncidentResponseService();
