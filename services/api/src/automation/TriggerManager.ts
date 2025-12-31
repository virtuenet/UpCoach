import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import * as cron from 'node-cron';
import crypto from 'crypto';
import { Request, Response } from 'express';

/**
 * Trigger Manager
 *
 * Production-ready trigger system for workflows with event-based, scheduled,
 * webhook, and manual triggers. Includes rate limiting, debouncing, and
 * trigger condition evaluation.
 *
 * Features:
 * - Event subscriptions with filters
 * - Cron-based scheduling
 * - Webhook endpoints with signature verification
 * - Manual triggers
 * - Trigger conditions with comparison operators
 * - Multi-trigger support (AND/OR logic)
 * - Rate limiting and throttling
 * - Debouncing
 * - Trigger history and logs
 * - Redis-based trigger registry
 */

export enum TriggerType {
  EVENT = 'event',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  MANUAL = 'manual'
}

export enum TriggerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error'
}

export interface TriggerDefinition {
  id: string;
  workflowId: string;
  organizationId: string;
  type: TriggerType;
  name: string;
  description: string;
  status: TriggerStatus;
  config: TriggerConfig;
  conditions: TriggerCondition[];
  settings: TriggerSettings;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastTriggeredAt?: Date;
    triggerCount: number;
  };
}

export interface TriggerConfig {
  event?: string;
  eventPattern?: string;
  schedule?: string;
  timezone?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  filters?: Record<string, any>;
  payload?: Record<string, any>;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' |
           'less_than' | 'greater_or_equal' | 'less_or_equal' | 'in' | 'not_in' |
           'exists' | 'not_exists' | 'matches' | 'starts_with' | 'ends_with';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface TriggerSettings {
  enabled: boolean;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  debounceMs?: number;
  throttleMs?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  batchSize?: number;
  batchWindowMs?: number;
}

export interface EventSubscription {
  id: string;
  triggerId: string;
  workflowId: string;
  event: string;
  eventPattern?: RegExp;
  filters: Record<string, any>;
  conditions: TriggerCondition[];
  createdAt: Date;
}

export interface ScheduledJob {
  id: string;
  triggerId: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  job: cron.ScheduledTask;
  nextRun?: Date;
  lastRun?: Date;
  createdAt: Date;
}

export interface WebhookTrigger {
  id: string;
  triggerId: string;
  workflowId: string;
  url: string;
  secret: string;
  signatureHeader: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface TriggerExecution {
  id: string;
  triggerId: string;
  workflowId: string;
  executionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  triggerData: any;
  conditionsMatched: boolean;
  timestamp: Date;
  processingTime?: number;
  error?: string;
}

export interface TriggerLog {
  id: string;
  triggerId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: Date;
}

export interface RateLimitState {
  triggerId: string;
  minuteCount: number;
  hourCount: number;
  lastReset: Date;
}

export class TriggerManager extends EventEmitter {
  private redis: Redis;
  private subscriptions: Map<string, EventSubscription>;
  private scheduledJobs: Map<string, ScheduledJob>;
  private webhooks: Map<string, WebhookTrigger>;
  private triggers: Map<string, TriggerDefinition>;
  private rateLimitStates: Map<string, RateLimitState>;
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private throttleTimers: Map<string, number>;
  private batchQueues: Map<string, any[]>;

  private readonly TRIGGER_PREFIX = 'trigger:';
  private readonly EXECUTION_PREFIX = 'trigger:execution:';
  private readonly RATE_LIMIT_PREFIX = 'trigger:ratelimit:';
  private readonly WEBHOOK_PREFIX = '/api/webhooks/';

  constructor(private workflowEngine: any) {
    super();

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 8,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.subscriptions = new Map();
    this.scheduledJobs = new Map();
    this.webhooks = new Map();
    this.triggers = new Map();
    this.rateLimitStates = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.batchQueues = new Map();
  }

  /**
   * Initialize trigger manager
   */
  async initialize(): Promise<void> {
    await this.loadTriggersFromRedis();
    await this.restoreSubscriptions();
    await this.restoreScheduledJobs();
    await this.restoreWebhooks();

    this.emit('initialized', {
      triggerCount: this.triggers.size,
      subscriptionCount: this.subscriptions.size,
      scheduledJobCount: this.scheduledJobs.size,
      webhookCount: this.webhooks.size,
    });
  }

  /**
   * Create trigger
   */
  async createTrigger(
    trigger: Omit<TriggerDefinition, 'id' | 'metadata'>
  ): Promise<TriggerDefinition> {
    const triggerDef: TriggerDefinition = {
      ...trigger,
      id: this.generateId('trg'),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        triggerCount: 0,
      },
    };

    await this.validateTrigger(triggerDef);
    await this.saveTrigger(triggerDef);
    this.triggers.set(triggerDef.id, triggerDef);

    await this.activateTrigger(triggerDef);

    this.emit('trigger:created', triggerDef);
    return triggerDef;
  }

  /**
   * Update trigger
   */
  async updateTrigger(
    triggerId: string,
    updates: Partial<TriggerDefinition>
  ): Promise<TriggerDefinition> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    await this.deactivateTrigger(trigger);

    const updated: TriggerDefinition = {
      ...trigger,
      ...updates,
      metadata: {
        ...trigger.metadata,
        updatedAt: new Date(),
      },
    };

    await this.validateTrigger(updated);
    await this.saveTrigger(updated);
    this.triggers.set(triggerId, updated);

    if (updated.status === TriggerStatus.ACTIVE) {
      await this.activateTrigger(updated);
    }

    this.emit('trigger:updated', updated);
    return updated;
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    await this.deactivateTrigger(trigger);
    this.triggers.delete(triggerId);
    await this.redis.del(`${this.TRIGGER_PREFIX}${triggerId}`);

    this.emit('trigger:deleted', { triggerId });
  }

  /**
   * Activate trigger based on type
   */
  private async activateTrigger(trigger: TriggerDefinition): Promise<void> {
    if (trigger.status !== TriggerStatus.ACTIVE) {
      return;
    }

    switch (trigger.type) {
      case TriggerType.EVENT:
        await this.registerEventTrigger(trigger);
        break;
      case TriggerType.SCHEDULE:
        await this.registerScheduleTrigger(trigger);
        break;
      case TriggerType.WEBHOOK:
        await this.registerWebhookTrigger(trigger);
        break;
      case TriggerType.MANUAL:
        break;
    }

    this.emit('trigger:activated', trigger);
  }

  /**
   * Deactivate trigger
   */
  private async deactivateTrigger(trigger: TriggerDefinition): Promise<void> {
    switch (trigger.type) {
      case TriggerType.EVENT:
        await this.unregisterEventTrigger(trigger.id);
        break;
      case TriggerType.SCHEDULE:
        await this.unregisterScheduleTrigger(trigger.id);
        break;
      case TriggerType.WEBHOOK:
        await this.unregisterWebhookTrigger(trigger.id);
        break;
    }

    this.emit('trigger:deactivated', trigger);
  }

  /**
   * Register event trigger
   */
  private async registerEventTrigger(trigger: TriggerDefinition): Promise<void> {
    const event = trigger.config.event;
    if (!event) {
      throw new Error('Event name required for event trigger');
    }

    const subscription: EventSubscription = {
      id: this.generateId('sub'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      event,
      eventPattern: trigger.config.eventPattern ? new RegExp(trigger.config.eventPattern) : undefined,
      filters: trigger.config.filters || {},
      conditions: trigger.conditions,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);

    const eventHandler = async (data: any) => {
      await this.handleEventTrigger(trigger, subscription, data);
    };

    if (subscription.eventPattern) {
      this.on('event:*', async (eventName: string, data: any) => {
        if (subscription.eventPattern!.test(eventName)) {
          await eventHandler(data);
        }
      });
    } else {
      this.on(`event:${event}`, eventHandler);
    }

    this.emit('subscription:created', subscription);
  }

  /**
   * Unregister event trigger
   */
  private async unregisterEventTrigger(triggerId: string): Promise<void> {
    const subscription = Array.from(this.subscriptions.values()).find(
      s => s.triggerId === triggerId
    );

    if (subscription) {
      this.removeAllListeners(`event:${subscription.event}`);
      this.subscriptions.delete(subscription.id);
    }
  }

  /**
   * Handle event trigger
   */
  private async handleEventTrigger(
    trigger: TriggerDefinition,
    subscription: EventSubscription,
    data: any
  ): Promise<void> {
    const execution: TriggerExecution = {
      id: this.generateId('texec'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      status: 'pending',
      triggerData: data,
      conditionsMatched: false,
      timestamp: new Date(),
    };

    try {
      if (!this.matchesFilters(data, subscription.filters)) {
        execution.status = 'skipped';
        await this.logTriggerExecution(execution);
        return;
      }

      if (!this.evaluateConditions(subscription.conditions, data)) {
        execution.status = 'skipped';
        execution.conditionsMatched = false;
        await this.logTriggerExecution(execution);
        return;
      }

      execution.conditionsMatched = true;

      if (!await this.checkRateLimit(trigger)) {
        execution.status = 'skipped';
        await this.logTriggerExecution(execution);
        this.addLog(trigger.id, 'warn', 'Rate limit exceeded');
        return;
      }

      if (trigger.settings.debounceMs) {
        await this.debounce(trigger, data);
        return;
      }

      if (trigger.settings.throttleMs) {
        if (!this.shouldThrottle(trigger)) {
          execution.status = 'skipped';
          await this.logTriggerExecution(execution);
          return;
        }
      }

      if (trigger.settings.batchSize && trigger.settings.batchWindowMs) {
        await this.addToBatch(trigger, data);
        return;
      }

      await this.executeTrigger(trigger, execution, data);
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      await this.logTriggerExecution(execution);
      this.emit('trigger:error', { trigger, error });
    }
  }

  /**
   * Register scheduled trigger
   */
  private async registerScheduleTrigger(trigger: TriggerDefinition): Promise<void> {
    const cronExpression = trigger.config.schedule;
    if (!cronExpression) {
      throw new Error('Cron expression required for scheduled trigger');
    }

    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const timezone = trigger.config.timezone || 'UTC';

    const job = cron.schedule(
      cronExpression,
      async () => {
        await this.handleScheduledTrigger(trigger);
      },
      {
        timezone,
        scheduled: true,
      }
    );

    const scheduledJob: ScheduledJob = {
      id: this.generateId('sched'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      cronExpression,
      timezone,
      job,
      createdAt: new Date(),
    };

    this.scheduledJobs.set(scheduledJob.id, scheduledJob);
    this.emit('schedule:created', scheduledJob);
  }

  /**
   * Unregister scheduled trigger
   */
  private async unregisterScheduleTrigger(triggerId: string): Promise<void> {
    const scheduledJob = Array.from(this.scheduledJobs.values()).find(
      j => j.triggerId === triggerId
    );

    if (scheduledJob) {
      scheduledJob.job.stop();
      this.scheduledJobs.delete(scheduledJob.id);
    }
  }

  /**
   * Handle scheduled trigger
   */
  private async handleScheduledTrigger(trigger: TriggerDefinition): Promise<void> {
    const execution: TriggerExecution = {
      id: this.generateId('texec'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      status: 'pending',
      triggerData: { timestamp: new Date(), schedule: trigger.config.schedule },
      conditionsMatched: true,
      timestamp: new Date(),
    };

    try {
      if (!await this.checkRateLimit(trigger)) {
        execution.status = 'skipped';
        await this.logTriggerExecution(execution);
        return;
      }

      await this.executeTrigger(trigger, execution, execution.triggerData);
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      await this.logTriggerExecution(execution);
      this.emit('trigger:error', { trigger, error });
    }
  }

  /**
   * Register webhook trigger
   */
  private async registerWebhookTrigger(trigger: TriggerDefinition): Promise<void> {
    const webhookId = this.generateId('wh');
    const secret = trigger.config.webhookSecret || this.generateWebhookSecret();

    const webhook: WebhookTrigger = {
      id: webhookId,
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      url: `${this.WEBHOOK_PREFIX}${webhookId}`,
      secret,
      signatureHeader: 'X-Webhook-Signature',
      createdAt: new Date(),
    };

    this.webhooks.set(webhookId, webhook);
    await this.saveTrigger(trigger);

    this.emit('webhook:created', webhook);
  }

  /**
   * Unregister webhook trigger
   */
  private async unregisterWebhookTrigger(triggerId: string): Promise<void> {
    const webhook = Array.from(this.webhooks.values()).find(
      w => w.triggerId === triggerId
    );

    if (webhook) {
      this.webhooks.delete(webhook.id);
    }
  }

  /**
   * Handle webhook request
   */
  async handleWebhookRequest(webhookId: string, req: Request, res: Response): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    const trigger = this.triggers.get(webhook.triggerId);
    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    const signature = req.headers[webhook.signatureHeader.toLowerCase()] as string;
    const isValid = this.verifyWebhookSignature(req.body, signature, webhook.secret);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      this.addLog(trigger.id, 'warn', 'Invalid webhook signature');
      return;
    }

    const execution: TriggerExecution = {
      id: this.generateId('texec'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      status: 'pending',
      triggerData: req.body,
      conditionsMatched: false,
      timestamp: new Date(),
    };

    try {
      if (!this.evaluateConditions(trigger.conditions, req.body)) {
        execution.status = 'skipped';
        execution.conditionsMatched = false;
        await this.logTriggerExecution(execution);
        res.status(200).json({ status: 'skipped', reason: 'conditions_not_met' });
        return;
      }

      execution.conditionsMatched = true;

      if (!await this.checkRateLimit(trigger)) {
        execution.status = 'skipped';
        await this.logTriggerExecution(execution);
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      await this.executeTrigger(trigger, execution, req.body);
      res.status(200).json({ status: 'accepted', executionId: execution.id });
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      await this.logTriggerExecution(execution);
      res.status(500).json({ error: 'Trigger execution failed' });
    }
  }

  /**
   * Manual trigger execution
   */
  async triggerManually(
    triggerId: string,
    data: any,
    triggeredBy: string
  ): Promise<TriggerExecution> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    if (trigger.type !== TriggerType.MANUAL) {
      throw new Error('Only manual triggers can be triggered manually');
    }

    const execution: TriggerExecution = {
      id: this.generateId('texec'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      status: 'pending',
      triggerData: data,
      conditionsMatched: true,
      timestamp: new Date(),
    };

    await this.executeTrigger(trigger, execution, data, triggeredBy);
    return execution;
  }

  /**
   * Execute trigger
   */
  private async executeTrigger(
    trigger: TriggerDefinition,
    execution: TriggerExecution,
    data: any,
    triggeredBy: string = 'trigger'
  ): Promise<void> {
    const startTime = Date.now();

    try {
      execution.status = 'processing';
      await this.logTriggerExecution(execution);

      const workflowExecution = await this.workflowEngine.executeWorkflow(
        trigger.workflowId,
        data,
        triggeredBy
      );

      execution.executionId = workflowExecution.id;
      execution.status = 'completed';
      execution.processingTime = Date.now() - startTime;

      trigger.metadata.lastTriggeredAt = new Date();
      trigger.metadata.triggerCount++;

      await this.saveTrigger(trigger);
      await this.logTriggerExecution(execution);

      this.emit('trigger:executed', { trigger, execution });
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.processingTime = Date.now() - startTime;

      await this.logTriggerExecution(execution);
      throw error;
    }
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(trigger: TriggerDefinition): Promise<boolean> {
    const { rateLimitPerMinute, rateLimitPerHour } = trigger.settings;

    if (!rateLimitPerMinute && !rateLimitPerHour) {
      return true;
    }

    const key = `${this.RATE_LIMIT_PREFIX}${trigger.id}`;
    const now = Date.now();

    let state = this.rateLimitStates.get(trigger.id);

    if (!state || now - state.lastReset.getTime() >= 60000) {
      state = {
        triggerId: trigger.id,
        minuteCount: 0,
        hourCount: 0,
        lastReset: new Date(),
      };
    }

    if (rateLimitPerMinute && state.minuteCount >= rateLimitPerMinute) {
      return false;
    }

    if (rateLimitPerHour && state.hourCount >= rateLimitPerHour) {
      return false;
    }

    state.minuteCount++;
    state.hourCount++;
    this.rateLimitStates.set(trigger.id, state);

    setTimeout(() => {
      if (state) state.minuteCount = 0;
    }, 60000);

    setTimeout(() => {
      if (state) state.hourCount = 0;
    }, 3600000);

    return true;
  }

  /**
   * Debounce trigger execution
   */
  private async debounce(trigger: TriggerDefinition, data: any): Promise<void> {
    const existingTimer = this.debounceTimers.get(trigger.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      const execution: TriggerExecution = {
        id: this.generateId('texec'),
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        status: 'pending',
        triggerData: data,
        conditionsMatched: true,
        timestamp: new Date(),
      };

      await this.executeTrigger(trigger, execution, data);
      this.debounceTimers.delete(trigger.id);
    }, trigger.settings.debounceMs);

    this.debounceTimers.set(trigger.id, timer);
  }

  /**
   * Check if should throttle
   */
  private shouldThrottle(trigger: TriggerDefinition): boolean {
    const lastExecution = this.throttleTimers.get(trigger.id);
    const now = Date.now();

    if (!lastExecution || now - lastExecution >= trigger.settings.throttleMs!) {
      this.throttleTimers.set(trigger.id, now);
      return true;
    }

    return false;
  }

  /**
   * Add to batch queue
   */
  private async addToBatch(trigger: TriggerDefinition, data: any): Promise<void> {
    let queue = this.batchQueues.get(trigger.id);
    if (!queue) {
      queue = [];
      this.batchQueues.set(trigger.id, queue);

      setTimeout(async () => {
        await this.processBatch(trigger);
      }, trigger.settings.batchWindowMs);
    }

    queue.push(data);

    if (queue.length >= trigger.settings.batchSize!) {
      await this.processBatch(trigger);
    }
  }

  /**
   * Process batch queue
   */
  private async processBatch(trigger: TriggerDefinition): Promise<void> {
    const queue = this.batchQueues.get(trigger.id);
    if (!queue || queue.length === 0) {
      return;
    }

    const batch = [...queue];
    this.batchQueues.delete(trigger.id);

    const execution: TriggerExecution = {
      id: this.generateId('texec'),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      status: 'pending',
      triggerData: { batch, count: batch.length },
      conditionsMatched: true,
      timestamp: new Date(),
    };

    await this.executeTrigger(trigger, execution, execution.triggerData);
  }

  /**
   * Match filters
   */
  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const dataValue = this.getNestedValue(data, key);
      if (dataValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: TriggerCondition[], data: any): boolean {
    if (conditions.length === 0) {
      return true;
    }

    let result = true;
    let lastOperator: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const value = this.getNestedValue(data, condition.field);
      const conditionResult = this.evaluateCondition(condition, value);

      if (lastOperator === 'or') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }

      lastOperator = condition.logicalOperator || 'and';
    }

    return result;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: TriggerCondition, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'greater_or_equal':
        return Number(value) >= Number(condition.value);
      case 'less_or_equal':
        return Number(value) <= Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'not_exists':
        return value === undefined || value === null;
      case 'matches':
        return new RegExp(condition.value).test(String(value));
      case 'starts_with':
        return String(value).startsWith(String(condition.value));
      case 'ends_with':
        return String(value).endsWith(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
    if (!signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate trigger definition
   */
  private async validateTrigger(trigger: TriggerDefinition): Promise<void> {
    if (!trigger.name || trigger.name.trim().length === 0) {
      throw new Error('Trigger name is required');
    }

    if (!trigger.workflowId) {
      throw new Error('Workflow ID is required');
    }

    switch (trigger.type) {
      case TriggerType.EVENT:
        if (!trigger.config.event) {
          throw new Error('Event name is required for event trigger');
        }
        break;
      case TriggerType.SCHEDULE:
        if (!trigger.config.schedule) {
          throw new Error('Schedule is required for scheduled trigger');
        }
        if (!cron.validate(trigger.config.schedule)) {
          throw new Error('Invalid cron expression');
        }
        break;
      case TriggerType.WEBHOOK:
        break;
      case TriggerType.MANUAL:
        break;
    }
  }

  /**
   * Save trigger to Redis
   */
  private async saveTrigger(trigger: TriggerDefinition): Promise<void> {
    const key = `${this.TRIGGER_PREFIX}${trigger.id}`;
    await this.redis.set(key, JSON.stringify(trigger));
  }

  /**
   * Load triggers from Redis
   */
  private async loadTriggersFromRedis(): Promise<void> {
    const keys = await this.redis.keys(`${this.TRIGGER_PREFIX}*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const trigger = JSON.parse(data);
        this.triggers.set(trigger.id, trigger);
      }
    }
  }

  /**
   * Restore subscriptions
   */
  private async restoreSubscriptions(): Promise<void> {
    for (const trigger of this.triggers.values()) {
      if (trigger.type === TriggerType.EVENT && trigger.status === TriggerStatus.ACTIVE) {
        await this.registerEventTrigger(trigger);
      }
    }
  }

  /**
   * Restore scheduled jobs
   */
  private async restoreScheduledJobs(): Promise<void> {
    for (const trigger of this.triggers.values()) {
      if (trigger.type === TriggerType.SCHEDULE && trigger.status === TriggerStatus.ACTIVE) {
        await this.registerScheduleTrigger(trigger);
      }
    }
  }

  /**
   * Restore webhooks
   */
  private async restoreWebhooks(): Promise<void> {
    for (const trigger of this.triggers.values()) {
      if (trigger.type === TriggerType.WEBHOOK && trigger.status === TriggerStatus.ACTIVE) {
        await this.registerWebhookTrigger(trigger);
      }
    }
  }

  /**
   * Log trigger execution
   */
  private async logTriggerExecution(execution: TriggerExecution): Promise<void> {
    const key = `${this.EXECUTION_PREFIX}${execution.id}`;
    await this.redis.set(key, JSON.stringify(execution), 'EX', 86400 * 7);
  }

  /**
   * Add log
   */
  private addLog(
    triggerId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any
  ): void {
    const log: TriggerLog = {
      id: this.generateId('log'),
      triggerId,
      level,
      message,
      data,
      timestamp: new Date(),
    };

    this.emit('log', log);
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  /**
   * Emit event for workflow triggers
   */
  emitEvent(eventName: string, data: any): void {
    this.emit(`event:${eventName}`, data);
    this.emit('event:*', eventName, data);
  }

  /**
   * Get trigger statistics
   */
  async getTriggerStats(triggerId: string): Promise<any> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    const keys = await this.redis.keys(`${this.EXECUTION_PREFIX}*`);
    const executions: TriggerExecution[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const execution = JSON.parse(data);
        if (execution.triggerId === triggerId) {
          executions.push(execution);
        }
      }
    }

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const skippedExecutions = executions.filter(e => e.status === 'skipped').length;

    const avgProcessingTime =
      executions
        .filter(e => e.processingTime)
        .reduce((sum, e) => sum + e.processingTime!, 0) / completedExecutions || 0;

    return {
      trigger,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      skippedExecutions,
      avgProcessingTime,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
    };
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }

    for (const job of this.scheduledJobs.values()) {
      job.job.stop();
    }

    await this.redis.quit();
    this.emit('shutdown');
  }
}

export default TriggerManager;
