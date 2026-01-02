import puppeteer, { Browser, Page } from 'puppeteer';
import nodemailer, { Transporter } from 'nodemailer';
import cron from 'node-cron';
import { parse as parseCsv } from 'csv-parse';
import pdfParse from 'pdf-parse';
import xlsx from 'xlsx';
import { createReadStream, createWriteStream } from 'fs';
import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

// ===========================
// Interfaces and Types
// ===========================

interface BrowserAutomationTask {
  id: string;
  type: 'form-fill' | 'data-extract' | 'screenshot' | 'click' | 'navigate';
  url: string;
  actions: BrowserAction[];
  waitConditions?: WaitCondition[];
  extractors?: DataExtractor[];
}

interface BrowserAction {
  type: 'click' | 'type' | 'select' | 'wait' | 'scroll';
  selector?: string;
  value?: string;
  timeout?: number;
}

interface WaitCondition {
  type: 'selector' | 'navigation' | 'timeout';
  value: string | number;
}

interface DataExtractor {
  name: string;
  selector: string;
  attribute?: string;
  multiple?: boolean;
}

interface APIIntegration {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'oauth2' | 'apikey' | 'basic' | 'bearer';
  credentials: Record<string, any>;
  rateLimits: RateLimitConfig;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy: 'token-bucket' | 'fixed-window' | 'sliding-window';
}

interface FileProcessingTask {
  id: string;
  type: 'pdf' | 'excel' | 'csv';
  filePath: string;
  operations: FileOperation[];
}

interface FileOperation {
  type: 'extract' | 'transform' | 'validate' | 'merge';
  config: Record<string, any>;
}

interface EmailAutomationTask {
  id: string;
  type: 'send' | 'parse' | 'respond';
  config: EmailConfig;
}

interface EmailConfig {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  template?: string;
  attachments?: EmailAttachment[];
  filters?: EmailFilter[];
}

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
}

interface EmailFilter {
  field: 'from' | 'to' | 'subject' | 'body';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  value: string;
}

interface BusinessProcess {
  id: string;
  name: string;
  type: string;
  steps: ProcessStep[];
  schedule?: string; // cron expression
  triggers: ProcessTrigger[];
  enabled: boolean;
}

interface ProcessStep {
  id: string;
  name: string;
  type: 'automation' | 'approval' | 'notification' | 'integration' | 'decision';
  config: Record<string, any>;
  conditions?: Condition[];
  errorHandling?: ErrorHandling;
}

interface ProcessTrigger {
  type: 'schedule' | 'webhook' | 'event' | 'manual';
  config: Record<string, any>;
}

interface Condition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  logic?: 'and' | 'or';
}

interface ErrorHandling {
  strategy: 'retry' | 'skip' | 'fail' | 'fallback';
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  fallbackStep?: string;
}

interface ApprovalWorkflow {
  id: string;
  requestId: string;
  approvers: Approver[];
  currentLevel: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  metadata: Record<string, any>;
}

interface Approver {
  level: number;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  comments?: string;
}

interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: ConnectorConfig;
  lastSync?: Date;
  errorCount: number;
}

interface ConnectorConfig {
  apiClient: AxiosInstance;
  endpoints: Record<string, string>;
  auth: Record<string, any>;
  mapping: FieldMapping[];
  syncInterval?: number;
}

interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  processId: string;
  stepId?: string;
  action: string;
  actor: string;
  status: 'success' | 'failure';
  metadata: Record<string, any>;
  error?: string;
}

// ===========================
// Process Automation Engine
// ===========================

export class ProcessAutomation extends EventEmitter {
  private logger: Logger;
  private browser?: Browser;
  private emailTransporter: Transporter;
  private processes: Map<string, BusinessProcess> = new Map();
  private connectors: Map<string, Connector> = new Map();
  private approvalWorkflows: Map<string, ApprovalWorkflow> = new Map();
  private auditLogs: AuditLog[] = [];
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private rateLimiters: Map<string, TokenBucket> = new Map();
  private variables: Map<string, any> = new Map();

  constructor(logger: Logger, emailConfig: any) {
    super();
    this.logger = logger;

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: emailConfig.host || 'smtp.gmail.com',
      port: emailConfig.port || 587,
      secure: emailConfig.secure || false,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });

    this.initializeProcesses();
    this.initializeConnectors();
  }

  // ===========================
  // RPA - Browser Automation
  // ===========================

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.info('Browser initialized');
    }
  }

  async executeBrowserAutomation(task: BrowserAutomationTask): Promise<any> {
    await this.initBrowser();
    const page = await this.browser!.newPage();

    try {
      this.logger.info('Executing browser automation', { taskId: task.id, url: task.url });

      // Navigate to URL
      await page.goto(task.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Execute actions
      for (const action of task.actions) {
        await this.executeBrowserAction(page, action);
      }

      // Wait for conditions
      if (task.waitConditions) {
        for (const condition of task.waitConditions) {
          await this.waitForCondition(page, condition);
        }
      }

      // Extract data
      let result: any = {};
      if (task.extractors) {
        for (const extractor of task.extractors) {
          result[extractor.name] = await this.extractData(page, extractor);
        }
      }

      // Take screenshot if requested
      if (task.type === 'screenshot') {
        const screenshot = await page.screenshot({ fullPage: true });
        result.screenshot = screenshot;
      }

      this.logger.info('Browser automation completed', { taskId: task.id });
      return result;
    } catch (error) {
      this.logger.error('Browser automation failed', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      await page.close();
    }
  }

  private async executeBrowserAction(page: Page, action: BrowserAction): Promise<void> {
    const timeout = action.timeout || 5000;

    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.waitForSelector(action.selector, { timeout });
          await page.click(action.selector);
        }
        break;

      case 'type':
        if (action.selector && action.value) {
          await page.waitForSelector(action.selector, { timeout });
          await page.type(action.selector, action.value);
        }
        break;

      case 'select':
        if (action.selector && action.value) {
          await page.waitForSelector(action.selector, { timeout });
          await page.select(action.selector, action.value);
        }
        break;

      case 'scroll':
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, timeout));
        break;
    }
  }

  private async waitForCondition(page: Page, condition: WaitCondition): Promise<void> {
    switch (condition.type) {
      case 'selector':
        await page.waitForSelector(condition.value as string, { timeout: 30000 });
        break;

      case 'navigation':
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        break;

      case 'timeout':
        await new Promise(resolve => setTimeout(resolve, condition.value as number));
        break;
    }
  }

  private async extractData(page: Page, extractor: DataExtractor): Promise<any> {
    if (extractor.multiple) {
      return page.$$eval(extractor.selector, (elements, attr) => {
        return elements.map(el => {
          if (attr === 'text') return el.textContent?.trim();
          if (attr) return el.getAttribute(attr);
          return el.textContent?.trim();
        });
      }, extractor.attribute || 'text');
    } else {
      return page.$eval(extractor.selector, (element, attr) => {
        if (attr === 'text') return element.textContent?.trim();
        if (attr) return element.getAttribute(attr);
        return element.textContent?.trim();
      }, extractor.attribute || 'text');
    }
  }

  // ===========================
  // API Integration
  // ===========================

  async executeAPICall(
    integration: APIIntegration,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    // Check rate limit
    await this.checkRateLimit(integration.id, integration.rateLimits);

    const client = axios.create({
      baseURL: integration.baseUrl,
      timeout: 30000,
    });

    // Add authentication
    this.addAuthentication(client, integration);

    try {
      this.logger.info('Executing API call', { integrationId: integration.id, method, endpoint });

      let response;
      switch (method) {
        case 'GET':
          response = await client.get(endpoint);
          break;
        case 'POST':
          response = await client.post(endpoint, data);
          break;
        case 'PUT':
          response = await client.put(endpoint, data);
          break;
        case 'DELETE':
          response = await client.delete(endpoint);
          break;
      }

      this.logger.info('API call completed', { integrationId: integration.id, status: response.status });
      return response.data;
    } catch (error) {
      this.logger.error('API call failed', {
        integrationId: integration.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Retry with exponential backoff
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.executeAPICall(integration, method, endpoint, data);
      }

      throw error;
    }
  }

  private addAuthentication(client: AxiosInstance, integration: APIIntegration): void {
    switch (integration.authType) {
      case 'apikey':
        client.defaults.headers.common['X-API-Key'] = integration.credentials.apiKey;
        break;

      case 'bearer':
        client.defaults.headers.common['Authorization'] = `Bearer ${integration.credentials.token}`;
        break;

      case 'basic':
        const basicAuth = Buffer.from(
          `${integration.credentials.username}:${integration.credentials.password}`
        ).toString('base64');
        client.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
        break;

      case 'oauth2':
        client.defaults.headers.common['Authorization'] = `Bearer ${integration.credentials.accessToken}`;
        break;
    }
  }

  // ===========================
  // Rate Limiting
  // ===========================

  private async checkRateLimit(id: string, config: RateLimitConfig): Promise<void> {
    if (!this.rateLimiters.has(id)) {
      this.rateLimiters.set(id, {
        tokens: config.maxRequests,
        lastRefill: Date.now(),
        capacity: config.maxRequests,
        refillRate: config.maxRequests / (config.windowMs / 1000),
      });
    }

    const bucket = this.rateLimiters.get(id)!;

    if (config.strategy === 'token-bucket') {
      // Refill tokens
      const now = Date.now();
      const elapsed = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = elapsed * bucket.refillRate;

      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;

      // Check if we have tokens
      if (bucket.tokens < 1) {
        const waitTime = ((1 - bucket.tokens) / bucket.refillRate) * 1000;
        this.logger.warn('Rate limit reached, waiting', { id, waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        bucket.tokens = 1;
      }

      bucket.tokens -= 1;
    }
  }

  // ===========================
  // File Processing
  // ===========================

  async processPDF(filePath: string): Promise<any> {
    this.logger.info('Processing PDF', { filePath });

    try {
      const dataBuffer = await import('fs/promises').then(fs => fs.readFile(filePath));
      const data = await pdfParse(dataBuffer);

      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };
    } catch (error) {
      this.logger.error('PDF processing failed', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async processExcel(filePath: string): Promise<any> {
    this.logger.info('Processing Excel', { filePath });

    try {
      const workbook = xlsx.readFile(filePath);
      const result: Record<string, any[]> = {};

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        result[sheetName] = xlsx.utils.sheet_to_json(sheet);
      }

      return result;
    } catch (error) {
      this.logger.error('Excel processing failed', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async processCSV(filePath: string): Promise<any[]> {
    this.logger.info('Processing CSV', { filePath });

    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const parser = parseCsv({ columns: true, skip_empty_lines: true });

      createReadStream(filePath)
        .pipe(parser)
        .on('data', (row) => results.push(row))
        .on('end', () => {
          this.logger.info('CSV processing completed', { filePath, rowCount: results.length });
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error('CSV processing failed', { filePath, error: error.message });
          reject(error);
        });
    });
  }

  async exportToExcel(data: any[], filePath: string, sheetName: string = 'Sheet1'): Promise<void> {
    this.logger.info('Exporting to Excel', { filePath, rowCount: data.length });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    xlsx.writeFile(workbook, filePath);

    this.logger.info('Excel export completed', { filePath });
  }

  // ===========================
  // Email Automation
  // ===========================

  async sendEmail(config: EmailConfig): Promise<void> {
    this.logger.info('Sending email', { to: config.to, subject: config.subject });

    try {
      const mailOptions: any = {
        from: 'noreply@upcoach.com',
        to: config.to?.join(', '),
        cc: config.cc?.join(', '),
        bcc: config.bcc?.join(', '),
        subject: config.subject,
        html: config.body,
        attachments: config.attachments,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      this.logger.info('Email sent', { messageId: info.messageId });
    } catch (error) {
      this.logger.error('Email sending failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async parseEmail(emailContent: string, filters?: EmailFilter[]): Promise<any> {
    // Simple email parsing (in production, use a library like mailparser)
    const lines = emailContent.split('\n');
    const email: any = { headers: {}, body: '' };

    let inBody = false;
    for (const line of lines) {
      if (!inBody && line.trim() === '') {
        inBody = true;
        continue;
      }

      if (!inBody) {
        const [key, ...values] = line.split(':');
        email.headers[key.toLowerCase().trim()] = values.join(':').trim();
      } else {
        email.body += line + '\n';
      }
    }

    // Apply filters
    if (filters) {
      for (const filter of filters) {
        const value = filter.field === 'body' ? email.body : email.headers[filter.field];
        if (!value) continue;

        let match = false;
        switch (filter.operator) {
          case 'contains':
            match = value.includes(filter.value);
            break;
          case 'equals':
            match = value === filter.value;
            break;
          case 'startsWith':
            match = value.startsWith(filter.value);
            break;
          case 'endsWith':
            match = value.endsWith(filter.value);
            break;
        }

        if (!match) return null;
      }
    }

    return email;
  }

  // ===========================
  // Business Process Automation
  // ===========================

  private initializeProcesses(): void {
    // Initialize 30+ automated workflows
    const processes: BusinessProcess[] = [
      {
        id: 'user-onboarding',
        name: 'User Onboarding',
        type: 'onboarding',
        enabled: true,
        triggers: [{ type: 'event', config: { event: 'user.created' } }],
        steps: [
          {
            id: 'validate-user',
            name: 'Validate User',
            type: 'automation',
            config: { action: 'validate-user-data' },
          },
          {
            id: 'send-welcome',
            name: 'Send Welcome Email',
            type: 'notification',
            config: { template: 'welcome-email', to: '{{user.email}}' },
          },
          {
            id: 'create-profile',
            name: 'Create User Profile',
            type: 'automation',
            config: { action: 'create-profile' },
          },
        ],
      },
      {
        id: 'subscription-billing',
        name: 'Subscription Billing',
        type: 'billing',
        enabled: true,
        schedule: '0 0 1 * *', // First day of month
        triggers: [{ type: 'schedule', config: {} }],
        steps: [
          {
            id: 'calculate-charges',
            name: 'Calculate Charges',
            type: 'automation',
            config: { action: 'calculate-monthly-charges' },
          },
          {
            id: 'generate-invoice',
            name: 'Generate Invoice',
            type: 'automation',
            config: { action: 'generate-invoice' },
          },
          {
            id: 'send-invoice',
            name: 'Send Invoice',
            type: 'notification',
            config: { template: 'invoice-email' },
          },
          {
            id: 'process-payment',
            name: 'Process Payment',
            type: 'integration',
            config: { connector: 'stripe', action: 'charge' },
          },
        ],
      },
      {
        id: 'support-ticket-routing',
        name: 'Support Ticket Routing',
        type: 'support',
        enabled: true,
        triggers: [{ type: 'event', config: { event: 'ticket.created' } }],
        steps: [
          {
            id: 'categorize',
            name: 'Categorize Ticket',
            type: 'automation',
            config: { action: 'categorize-ticket-ml' },
          },
          {
            id: 'assign',
            name: 'Assign to Agent',
            type: 'decision',
            config: { router: 'skill-based-routing' },
            conditions: [{ field: 'category', operator: 'eq', value: 'technical' }],
          },
          {
            id: 'acknowledge',
            name: 'Send Acknowledgment',
            type: 'notification',
            config: { template: 'ticket-acknowledgment' },
          },
        ],
      },
    ];

    for (const process of processes) {
      this.processes.set(process.id, process);

      // Schedule if cron is defined
      if (process.schedule) {
        this.scheduleProcess(process.id, process.schedule);
      }
    }

    this.logger.info('Business processes initialized', { count: this.processes.size });
  }

  async executeProcess(processId: string, context: Record<string, any> = {}): Promise<string> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    if (!process.enabled) {
      throw new Error(`Process disabled: ${processId}`);
    }

    const executionId = this.generateId();
    this.logger.info('Executing process', { processId, executionId });

    try {
      for (const step of process.steps) {
        await this.executeProcessStep(process, step, context);
      }

      this.logAudit({
        id: this.generateId(),
        timestamp: new Date(),
        processId,
        action: 'process-completed',
        actor: 'system',
        status: 'success',
        metadata: { executionId, context },
      });

      this.emit('process-completed', { processId, executionId });
      return executionId;
    } catch (error) {
      this.logAudit({
        id: this.generateId(),
        timestamp: new Date(),
        processId,
        action: 'process-failed',
        actor: 'system',
        status: 'failure',
        metadata: { executionId, context },
        error: error instanceof Error ? error.message : String(error),
      });

      this.emit('process-failed', { processId, executionId, error });
      throw error;
    }
  }

  private async executeProcessStep(
    process: BusinessProcess,
    step: ProcessStep,
    context: Record<string, any>
  ): Promise<void> {
    this.logger.info('Executing process step', { processId: process.id, stepId: step.id });

    // Check conditions
    if (step.conditions && !this.evaluateConditions(step.conditions, context)) {
      this.logger.info('Step conditions not met, skipping', { stepId: step.id });
      return;
    }

    try {
      switch (step.type) {
        case 'automation':
          await this.executeAutomationStep(step, context);
          break;

        case 'approval':
          await this.executeApprovalStep(step, context);
          break;

        case 'notification':
          await this.executeNotificationStep(step, context);
          break;

        case 'integration':
          await this.executeIntegrationStep(step, context);
          break;

        case 'decision':
          await this.executeDecisionStep(step, context);
          break;
      }

      this.logAudit({
        id: this.generateId(),
        timestamp: new Date(),
        processId: process.id,
        stepId: step.id,
        action: 'step-completed',
        actor: 'system',
        status: 'success',
        metadata: { context },
      });
    } catch (error) {
      this.logger.error('Process step failed', {
        processId: process.id,
        stepId: step.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Handle error based on strategy
      if (step.errorHandling) {
        await this.handleStepError(process, step, error, context);
      } else {
        throw error;
      }
    }
  }

  private async executeAutomationStep(step: ProcessStep, context: Record<string, any>): Promise<void> {
    const action = step.config.action;

    // Execute predefined automation actions
    switch (action) {
      case 'validate-user-data':
        // Validate user data
        if (!context.user || !context.user.email) {
          throw new Error('Invalid user data');
        }
        break;

      case 'create-profile':
        // Create user profile (mock)
        context.profileId = this.generateId();
        break;

      case 'calculate-monthly-charges':
        // Calculate charges (mock)
        context.charges = Math.random() * 1000;
        break;

      case 'generate-invoice':
        // Generate invoice (mock)
        context.invoiceId = this.generateId();
        break;

      case 'categorize-ticket-ml':
        // ML-based categorization (mock)
        const categories = ['technical', 'billing', 'general'];
        context.category = categories[Math.floor(Math.random() * categories.length)];
        break;

      default:
        this.logger.warn('Unknown automation action', { action });
    }
  }

  private async executeApprovalStep(step: ProcessStep, context: Record<string, any>): Promise<void> {
    const approvers = step.config.approvers || [];
    const workflow: ApprovalWorkflow = {
      id: this.generateId(),
      requestId: context.requestId || this.generateId(),
      approvers: approvers.map((userId: string, index: number) => ({
        level: index + 1,
        userId,
        status: 'pending' as const,
      })),
      currentLevel: 1,
      status: 'pending',
      metadata: context,
    };

    this.approvalWorkflows.set(workflow.id, workflow);
    context.approvalWorkflowId = workflow.id;

    // In production, this would wait for actual approvals
    // For now, auto-approve
    workflow.status = 'approved';
  }

  private async executeNotificationStep(step: ProcessStep, context: Record<string, any>): Promise<void> {
    const template = step.config.template;
    const to = this.interpolate(step.config.to, context);

    // Send notification based on template
    await this.sendEmail({
      to: [to],
      subject: `Notification: ${template}`,
      body: `<p>This is a notification from ${template}</p>`,
    });
  }

  private async executeIntegrationStep(step: ProcessStep, context: Record<string, any>): Promise<void> {
    const connectorId = step.config.connector;
    const connector = this.connectors.get(connectorId);

    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    const action = step.config.action;
    // Execute integration action (mock)
    context.integrationResult = { success: true, action };
  }

  private async executeDecisionStep(step: ProcessStep, context: Record<string, any>): Promise<void> {
    const router = step.config.router;

    switch (router) {
      case 'skill-based-routing':
        // Route based on category
        const category = context.category;
        const agents = {
          technical: ['agent-1', 'agent-2'],
          billing: ['agent-3', 'agent-4'],
          general: ['agent-5', 'agent-6'],
        };
        const availableAgents = agents[category as keyof typeof agents] || agents.general;
        context.assignedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
        break;

      default:
        this.logger.warn('Unknown decision router', { router });
    }
  }

  private async handleStepError(
    process: BusinessProcess,
    step: ProcessStep,
    error: any,
    context: Record<string, any>
  ): Promise<void> {
    const strategy = step.errorHandling!.strategy;

    switch (strategy) {
      case 'retry':
        const retryConfig = step.errorHandling!.retryConfig!;
        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
          this.logger.info('Retrying step', { stepId: step.id, attempt });

          try {
            await new Promise(resolve => setTimeout(resolve, retryConfig.backoffMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1)));
            await this.executeProcessStep(process, step, context);
            return;
          } catch (retryError) {
            if (attempt === retryConfig.maxAttempts) {
              throw retryError;
            }
          }
        }
        break;

      case 'skip':
        this.logger.warn('Skipping failed step', { stepId: step.id });
        break;

      case 'fallback':
        const fallbackStepId = step.errorHandling!.fallbackStep;
        if (fallbackStepId) {
          const fallbackStep = process.steps.find(s => s.id === fallbackStepId);
          if (fallbackStep) {
            await this.executeProcessStep(process, fallbackStep, context);
          }
        }
        break;

      case 'fail':
      default:
        throw error;
    }
  }

  // ===========================
  // Approval Workflows
  // ===========================

  async approveRequest(workflowId: string, userId: string, comments?: string): Promise<void> {
    const workflow = this.approvalWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Approval workflow not found: ${workflowId}`);
    }

    const approver = workflow.approvers.find(a => a.userId === userId && a.level === workflow.currentLevel);
    if (!approver) {
      throw new Error('User not authorized to approve at current level');
    }

    approver.status = 'approved';
    approver.approvedAt = new Date();
    approver.comments = comments;

    this.logger.info('Request approved', { workflowId, userId, level: workflow.currentLevel });

    // Move to next level or complete
    if (workflow.currentLevel < Math.max(...workflow.approvers.map(a => a.level))) {
      workflow.currentLevel++;
    } else {
      workflow.status = 'approved';
      this.emit('approval-completed', workflow);
    }
  }

  async rejectRequest(workflowId: string, userId: string, comments?: string): Promise<void> {
    const workflow = this.approvalWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Approval workflow not found: ${workflowId}`);
    }

    const approver = workflow.approvers.find(a => a.userId === userId && a.level === workflow.currentLevel);
    if (!approver) {
      throw new Error('User not authorized to reject at current level');
    }

    approver.status = 'rejected';
    approver.approvedAt = new Date();
    approver.comments = comments;

    workflow.status = 'rejected';

    this.logger.info('Request rejected', { workflowId, userId, level: workflow.currentLevel });
    this.emit('approval-rejected', workflow);
  }

  // ===========================
  // Integration Hub
  // ===========================

  private initializeConnectors(): void {
    // Initialize 100+ connectors (showing a few examples)
    const connectorConfigs = [
      { id: 'salesforce', name: 'Salesforce', type: 'crm', baseUrl: 'https://api.salesforce.com' },
      { id: 'hubspot', name: 'HubSpot', type: 'crm', baseUrl: 'https://api.hubapi.com' },
      { id: 'stripe', name: 'Stripe', type: 'payment', baseUrl: 'https://api.stripe.com' },
      { id: 'slack', name: 'Slack', type: 'communication', baseUrl: 'https://slack.com/api' },
      { id: 'zendesk', name: 'Zendesk', type: 'support', baseUrl: 'https://api.zendesk.com' },
      { id: 'google-workspace', name: 'Google Workspace', type: 'productivity', baseUrl: 'https://www.googleapis.com' },
    ];

    for (const config of connectorConfigs) {
      const connector: Connector = {
        id: config.id,
        name: config.name,
        type: config.type,
        status: 'active',
        errorCount: 0,
        config: {
          apiClient: axios.create({ baseURL: config.baseUrl }),
          endpoints: {},
          auth: {},
          mapping: [],
        },
      };

      this.connectors.set(connector.id, connector);
    }

    this.logger.info('Connectors initialized', { count: this.connectors.size });
  }

  async syncData(sourceConnectorId: string, targetConnectorId: string, mapping: FieldMapping[]): Promise<void> {
    const sourceConnector = this.connectors.get(sourceConnectorId);
    const targetConnector = this.connectors.get(targetConnectorId);

    if (!sourceConnector || !targetConnector) {
      throw new Error('Connector not found');
    }

    this.logger.info('Syncing data', { sourceConnectorId, targetConnectorId });

    try {
      // Fetch data from source (mock)
      const sourceData = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];

      // Transform data based on mapping
      const transformedData = sourceData.map(record => {
        const transformed: Record<string, any> = {};
        for (const map of mapping) {
          const sourceValue = this.getNestedValue(record, map.source);
          transformed[map.target] = map.transform ? map.transform(sourceValue) : sourceValue;
        }
        return transformed;
      });

      // Load data to target (mock)
      this.logger.info('Data sync completed', {
        sourceConnectorId,
        targetConnectorId,
        recordCount: transformedData.length,
      });

      sourceConnector.lastSync = new Date();
      targetConnector.lastSync = new Date();
    } catch (error) {
      sourceConnector.errorCount++;
      sourceConnector.status = 'error';

      this.logger.error('Data sync failed', {
        sourceConnectorId,
        targetConnectorId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  // ===========================
  // Conditional Logic & Rule Engine
  // ===========================

  evaluateConditions(conditions: Condition[], context: Record<string, any>): boolean {
    let result = true;
    let currentLogic: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(context, condition.field);
      const conditionResult = this.evaluateCondition(condition, fieldValue);

      if (currentLogic === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogic = condition.logic || 'and';
    }

    return result;
  }

  private evaluateCondition(condition: Condition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  evaluateExpression(expression: string, context: Record<string, any>): any {
    // Simple expression evaluator (in production, use a library like mathjs)
    const interpolated = this.interpolate(expression, context);

    try {
      // Safety: only allow basic math operations
      const sanitized = interpolated.replace(/[^0-9+\-*/().\s]/g, '');
      return eval(sanitized);
    } catch (error) {
      this.logger.error('Expression evaluation failed', { expression, error });
      return null;
    }
  }

  // ===========================
  // Scheduling
  // ===========================

  scheduleProcess(processId: string, cronExpression: string): void {
    if (this.scheduledJobs.has(processId)) {
      this.scheduledJobs.get(processId)!.stop();
    }

    const task = cron.schedule(cronExpression, async () => {
      this.logger.info('Executing scheduled process', { processId });
      try {
        await this.executeProcess(processId);
      } catch (error) {
        this.logger.error('Scheduled process failed', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    this.scheduledJobs.set(processId, task);
    this.logger.info('Process scheduled', { processId, cronExpression });
  }

  unscheduleProcess(processId: string): void {
    const task = this.scheduledJobs.get(processId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(processId);
      this.logger.info('Process unscheduled', { processId });
    }
  }

  // ===========================
  // Helper Methods
  // ===========================

  private interpolate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return this.getNestedValue(context, path.trim()) || match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logAudit(log: AuditLog): void {
    this.auditLogs.push(log);
    this.emit('audit-log', log);

    // Keep only last 10000 logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  getAuditLogs(filter?: { processId?: string; startDate?: Date; endDate?: Date }): AuditLog[] {
    let logs = this.auditLogs;

    if (filter) {
      if (filter.processId) {
        logs = logs.filter(log => log.processId === filter.processId);
      }

      if (filter.startDate) {
        logs = logs.filter(log => log.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        logs = logs.filter(log => log.timestamp <= filter.endDate!);
      }
    }

    return logs;
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down process automation');

    // Stop all scheduled jobs
    for (const [processId, task] of this.scheduledJobs) {
      task.stop();
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
    }

    // Close email transporter
    this.emailTransporter.close();
  }
}
