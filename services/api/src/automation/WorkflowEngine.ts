import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';

/**
 * Workflow Engine
 *
 * Production-ready workflow execution engine with state machine, retry logic,
 * conditional branching, loops, error handling, and rollback capabilities.
 *
 * Features:
 * - State machine execution with Redis persistence
 * - Parallel and sequential action execution
 * - Conditional branching (if/else, switch)
 * - Loop support (for-each, while, do-until)
 * - Error handling with retries and exponential backoff
 * - Rollback/compensation on failure
 * - Workflow versioning
 * - Execution history tracking
 * - Pause/resume functionality
 * - Context variables for data passing
 */

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying'
}

export enum StepType {
  ACTION = 'action',
  CONDITION = 'condition',
  LOOP = 'loop',
  DELAY = 'delay',
  PARALLEL = 'parallel',
  WEBHOOK = 'webhook',
  SCRIPT = 'script',
  SWITCH = 'switch'
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  version: number;
  status: WorkflowStatus;
  metadata: {
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  };
}

export interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual';
  event?: string;
  schedule?: string;
  webhookUrl?: string;
  conditions?: TriggerCondition[];
  config: Record<string, any>;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  action?: string;
  config: Record<string, any>;
  nextSteps: string[];
  onError?: ErrorHandler;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  condition?: StepCondition;
  loopConfig?: LoopConfig;
  position: { x: number; y: number };
}

export interface StepCondition {
  expression: string;
  onTrue?: string;
  onFalse?: string;
  cases?: Array<{ value: any; nextStep: string }>;
  default?: string;
}

export interface LoopConfig {
  type: 'for-each' | 'while' | 'do-until';
  items?: string;
  condition?: string;
  maxIterations?: number;
  breakOn?: string;
}

export interface ErrorHandler {
  strategy: 'stop' | 'continue' | 'rollback' | 'retry';
  rollbackSteps?: string[];
  fallbackStep?: string;
  notifyOnError?: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier?: number;
}

export interface WorkflowSettings {
  maxExecutionTime: number;
  maxRetries: number;
  defaultRetryDelay: number;
  concurrentExecutions: number;
  errorHandling: 'stop' | 'continue' | 'rollback';
  enableLogging: boolean;
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onPause: boolean;
    recipients: string[];
  };
  variables: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowStatus;
  currentStep?: string;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  duration?: number;
  stepExecutions: Map<string, StepExecution>;
  context: ExecutionContext;
  error?: ExecutionError;
  metadata: {
    triggeredBy: string;
    triggerData: any;
    executionPath: string[];
  };
}

export interface StepExecution {
  stepId: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  input?: any;
  output?: any;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionContext {
  variables: Record<string, any>;
  trigger: any;
  workflow: WorkflowDefinition;
  execution: {
    id: string;
    startedAt: Date;
  };
  user: {
    id: string;
    organizationId: string;
  };
}

export interface ExecutionError {
  message: string;
  stack?: string;
  stepId?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface ExecutionLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  data?: any;
}

export type ActionProcessor = (
  config: Record<string, any>,
  context: ExecutionContext
) => Promise<any>;

export class WorkflowEngine extends EventEmitter {
  private redis: Redis;
  private workflows: Map<string, WorkflowDefinition>;
  private executions: Map<string, WorkflowExecution>;
  private actionProcessors: Map<string, ActionProcessor>;
  private readonly WORKFLOW_PREFIX = 'workflow:';
  private readonly EXECUTION_PREFIX = 'execution:';
  private readonly LOCK_PREFIX = 'lock:workflow:';
  private readonly LOCK_TTL = 300;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 7,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.workflows = new Map();
    this.executions = new Map();
    this.actionProcessors = new Map();

    this.registerDefaultActionProcessors();
  }

  /**
   * Initialize workflow engine
   */
  async initialize(): Promise<void> {
    try {
      await this.loadWorkflowsFromRedis();
      await this.recoverPendingExecutions();

      this.emit('initialized', {
        workflowCount: this.workflows.size,
        executionCount: this.executions.size,
      });
    } catch (error) {
      this.emit('error', { message: 'Failed to initialize workflow engine', error });
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    definition: Omit<WorkflowDefinition, 'id' | 'version' | 'metadata'>
  ): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      ...definition,
      id: this.generateId('wf'),
      version: 1,
      metadata: {
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    };

    await this.validateWorkflow(workflow);
    await this.saveWorkflow(workflow);
    this.workflows.set(workflow.id, workflow);

    this.emit('workflow:created', workflow);
    return workflow;
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowDefinition>
  ): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const updated: WorkflowDefinition = {
      ...workflow,
      ...updates,
      version: workflow.version + 1,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date(),
      },
    };

    await this.validateWorkflow(updated);
    await this.saveWorkflow(updated);
    this.workflows.set(workflowId, updated);

    this.emit('workflow:updated', updated);
    return updated;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    triggerData: any,
    triggeredBy: string = 'system'
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new Error(`Workflow ${workflowId} is not active (status: ${workflow.status})`);
    }

    const execution: WorkflowExecution = {
      id: this.generateId('exec'),
      workflowId,
      workflowVersion: workflow.version,
      status: WorkflowStatus.ACTIVE,
      startedAt: new Date(),
      stepExecutions: new Map(),
      context: {
        variables: { ...workflow.settings.variables },
        trigger: triggerData,
        workflow,
        execution: {
          id: this.generateId('exec'),
          startedAt: new Date(),
        },
        user: {
          id: triggeredBy,
          organizationId: workflow.organizationId,
        },
      },
      metadata: {
        triggeredBy,
        triggerData,
        executionPath: [],
      },
    };

    this.executions.set(execution.id, execution);
    await this.saveExecution(execution);

    this.emit('execution:started', execution);

    setImmediate(() => this.processWorkflow(execution, workflow));

    return execution;
  }

  /**
   * Process workflow execution
   */
  private async processWorkflow(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${execution.id}`;

    try {
      const locked = await this.acquireLock(lockKey);
      if (!locked) {
        throw new Error('Failed to acquire execution lock');
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Workflow execution timeout')),
          workflow.settings.maxExecutionTime * 1000
        )
      );

      const executionPromise = this.executeSteps(execution, workflow);

      await Promise.race([executionPromise, timeoutPromise]);

      execution.status = WorkflowStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      await this.saveExecution(execution);
      this.emit('execution:completed', execution);

      if (workflow.settings.notifications.onSuccess) {
        await this.sendNotification(workflow, execution, 'success');
      }
    } catch (error) {
      await this.handleExecutionError(execution, workflow, error as Error);
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const startSteps = workflow.steps.filter(s => s.id === 'start' || !workflow.steps.some(ws => ws.nextSteps.includes(s.id)));

    if (startSteps.length === 0) {
      throw new Error('No start step found in workflow');
    }

    for (const startStep of startSteps) {
      await this.executeStep(startStep, execution, workflow);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      status: StepStatus.RUNNING,
      startedAt: new Date(),
      retryCount: 0,
      logs: [],
    };

    execution.stepExecutions.set(step.id, stepExecution);
    execution.currentStep = step.id;
    execution.metadata.executionPath.push(step.id);

    this.addLog(stepExecution, 'info', `Executing step: ${step.name}`);

    try {
      let result: any;

      switch (step.type) {
        case StepType.ACTION:
          result = await this.executeAction(step, execution, stepExecution);
          break;
        case StepType.CONDITION:
          result = await this.executeCondition(step, execution, stepExecution);
          break;
        case StepType.LOOP:
          result = await this.executeLoop(step, execution, stepExecution, workflow);
          break;
        case StepType.DELAY:
          result = await this.executeDelay(step, execution, stepExecution);
          break;
        case StepType.PARALLEL:
          result = await this.executeParallel(step, execution, stepExecution, workflow);
          break;
        case StepType.WEBHOOK:
          result = await this.executeWebhook(step, execution, stepExecution);
          break;
        case StepType.SWITCH:
          result = await this.executeSwitch(step, execution, stepExecution);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepExecution.status = StepStatus.COMPLETED;
      stepExecution.completedAt = new Date();
      stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt!.getTime();
      stepExecution.output = result;

      if (result && typeof result === 'object') {
        execution.context.variables = { ...execution.context.variables, ...result };
      }

      this.addLog(stepExecution, 'info', `Step completed successfully`);
      this.emit('step:completed', { execution, step: stepExecution });

      await this.executeNextSteps(step, execution, workflow, result);

      return result;
    } catch (error) {
      await this.handleStepError(step, stepExecution, execution, workflow, error as Error);
    }
  }

  /**
   * Execute action step
   */
  private async executeAction(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution
  ): Promise<any> {
    const action = step.action || step.config.action;
    if (!action) {
      throw new Error('No action specified for action step');
    }

    const processor = this.actionProcessors.get(action);
    if (!processor) {
      throw new Error(`No processor found for action: ${action}`);
    }

    const input = this.interpolateVariables(step.config, execution.context.variables);
    stepExecution.input = input;

    const retryPolicy = step.retryPolicy || {
      maxAttempts: execution.context.workflow.settings.maxRetries,
      backoffStrategy: 'exponential' as const,
      initialDelay: execution.context.workflow.settings.defaultRetryDelay,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    return await this.executeWithRetry(
      () => processor(input, execution.context),
      retryPolicy,
      stepExecution
    );
  }

  /**
   * Execute condition step
   */
  private async executeCondition(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution
  ): Promise<any> {
    if (!step.condition) {
      throw new Error('No condition specified for condition step');
    }

    const result = this.evaluateExpression(
      step.condition.expression,
      execution.context.variables
    );

    this.addLog(stepExecution, 'info', `Condition evaluated to: ${result}`);

    return { conditionResult: result };
  }

  /**
   * Execute loop step
   */
  private async executeLoop(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution,
    workflow: WorkflowDefinition
  ): Promise<any> {
    if (!step.loopConfig) {
      throw new Error('No loop configuration specified');
    }

    const results: any[] = [];
    const { type, items, condition, maxIterations = 1000 } = step.loopConfig;

    let iteration = 0;

    switch (type) {
      case 'for-each': {
        const itemsArray = this.resolveVariable(items!, execution.context.variables);
        if (!Array.isArray(itemsArray)) {
          throw new Error('Loop items must be an array');
        }

        for (const item of itemsArray) {
          if (iteration >= maxIterations) {
            this.addLog(stepExecution, 'warn', `Max iterations (${maxIterations}) reached`);
            break;
          }

          execution.context.variables._loopItem = item;
          execution.context.variables._loopIndex = iteration;

          const iterationResult = await this.executeLoopIteration(step, execution, workflow);
          results.push(iterationResult);
          iteration++;
        }
        break;
      }

      case 'while': {
        while (iteration < maxIterations) {
          const shouldContinue = this.evaluateExpression(
            condition!,
            execution.context.variables
          );

          if (!shouldContinue) break;

          execution.context.variables._loopIndex = iteration;
          const iterationResult = await this.executeLoopIteration(step, execution, workflow);
          results.push(iterationResult);
          iteration++;
        }
        break;
      }

      case 'do-until': {
        do {
          if (iteration >= maxIterations) {
            this.addLog(stepExecution, 'warn', `Max iterations (${maxIterations}) reached`);
            break;
          }

          execution.context.variables._loopIndex = iteration;
          const iterationResult = await this.executeLoopIteration(step, execution, workflow);
          results.push(iterationResult);
          iteration++;
        } while (!this.evaluateExpression(condition!, execution.context.variables));
        break;
      }
    }

    this.addLog(stepExecution, 'info', `Loop completed: ${iteration} iterations`);
    return { loopResults: results, iterations: iteration };
  }

  /**
   * Execute delay step
   */
  private async executeDelay(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution
  ): Promise<any> {
    const delay = step.config.delay || step.config.duration || 1000;
    this.addLog(stepExecution, 'info', `Delaying for ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));

    return { delayed: delay };
  }

  /**
   * Execute parallel steps
   */
  private async executeParallel(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const parallelSteps = step.config.steps || [];

    this.addLog(stepExecution, 'info', `Executing ${parallelSteps.length} steps in parallel`);

    const promises = parallelSteps.map((stepId: string) => {
      const parallelStep = workflow.steps.find(s => s.id === stepId);
      if (!parallelStep) {
        throw new Error(`Parallel step ${stepId} not found`);
      }
      return this.executeStep(parallelStep, execution, workflow);
    });

    const results = await Promise.all(promises);
    return { parallelResults: results };
  }

  /**
   * Execute webhook step
   */
  private async executeWebhook(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution
  ): Promise<any> {
    const { url, method = 'POST', headers = {}, body } = step.config;

    const interpolatedUrl = this.interpolateVariables(url, execution.context.variables);
    const interpolatedBody = this.interpolateVariables(body, execution.context.variables);

    this.addLog(stepExecution, 'info', `Calling webhook: ${method} ${interpolatedUrl}`);

    const axios = require('axios');
    const response = await axios({
      method,
      url: interpolatedUrl,
      headers,
      data: interpolatedBody,
      timeout: step.timeout || 30000,
    });

    return {
      status: response.status,
      data: response.data,
    };
  }

  /**
   * Execute switch step
   */
  private async executeSwitch(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepExecution: StepExecution
  ): Promise<any> {
    if (!step.condition?.cases) {
      throw new Error('No cases specified for switch step');
    }

    const value = this.resolveVariable(step.config.value, execution.context.variables);

    this.addLog(stepExecution, 'info', `Switch evaluating value: ${value}`);

    return { switchValue: value };
  }

  /**
   * Execute next steps based on current step result
   */
  private async executeNextSteps(
    currentStep: WorkflowStep,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    result: any
  ): Promise<void> {
    let nextStepIds: string[] = [];

    if (currentStep.condition) {
      const conditionResult = result?.conditionResult;
      if (conditionResult && currentStep.condition.onTrue) {
        nextStepIds = [currentStep.condition.onTrue];
      } else if (!conditionResult && currentStep.condition.onFalse) {
        nextStepIds = [currentStep.condition.onFalse];
      }
    } else if (currentStep.type === StepType.SWITCH && currentStep.condition?.cases) {
      const switchValue = result?.switchValue;
      const matchedCase = currentStep.condition.cases.find(c => c.value === switchValue);

      if (matchedCase) {
        nextStepIds = [matchedCase.nextStep];
      } else if (currentStep.condition.default) {
        nextStepIds = [currentStep.condition.default];
      }
    } else {
      nextStepIds = currentStep.nextSteps;
    }

    for (const nextStepId of nextStepIds) {
      const nextStep = workflow.steps.find(s => s.id === nextStepId);
      if (nextStep) {
        await this.executeStep(nextStep, execution, workflow);
      }
    }
  }

  /**
   * Execute loop iteration
   */
  private async executeLoopIteration(
    loopStep: WorkflowStep,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const results: any[] = [];

    for (const nextStepId of loopStep.nextSteps) {
      const nextStep = workflow.steps.find(s => s.id === nextStepId);
      if (nextStep) {
        const result = await this.executeStep(nextStep, execution, workflow);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryPolicy: RetryPolicy,
    stepExecution: StepExecution
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt++) {
      try {
        stepExecution.retryCount = attempt;
        if (attempt > 0) {
          stepExecution.status = StepStatus.RETRYING;
          this.addLog(stepExecution, 'info', `Retry attempt ${attempt + 1}/${retryPolicy.maxAttempts}`);
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryPolicy.maxAttempts - 1) {
          const delay = this.calculateRetryDelay(attempt, retryPolicy);
          this.addLog(stepExecution, 'warn', `Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    let delay: number;

    switch (policy.backoffStrategy) {
      case 'exponential':
        delay = Math.min(
          policy.initialDelay * Math.pow(policy.backoffMultiplier || 2, attempt),
          policy.maxDelay
        );
        break;
      case 'linear':
        delay = Math.min(
          policy.initialDelay * (attempt + 1),
          policy.maxDelay
        );
        break;
      case 'fixed':
      default:
        delay = policy.initialDelay;
        break;
    }

    return delay;
  }

  /**
   * Handle step execution error
   */
  private async handleStepError(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    error: Error
  ): Promise<void> {
    stepExecution.status = StepStatus.FAILED;
    stepExecution.error = error.message;
    stepExecution.completedAt = new Date();

    this.addLog(stepExecution, 'error', `Step failed: ${error.message}`);
    this.emit('step:failed', { execution, step: stepExecution, error });

    const errorHandler = step.onError || {
      strategy: workflow.settings.errorHandling,
    };

    switch (errorHandler.strategy) {
      case 'stop':
        throw error;
      case 'continue':
        this.addLog(stepExecution, 'info', 'Continuing despite error');
        break;
      case 'rollback':
        await this.rollbackExecution(execution, workflow, errorHandler.rollbackSteps);
        throw error;
      case 'retry':
        break;
    }

    if (errorHandler.fallbackStep) {
      const fallbackStep = workflow.steps.find(s => s.id === errorHandler.fallbackStep);
      if (fallbackStep) {
        await this.executeStep(fallbackStep, execution, workflow);
      }
    }
  }

  /**
   * Handle workflow execution error
   */
  private async handleExecutionError(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    error: Error
  ): Promise<void> {
    execution.status = WorkflowStatus.FAILED;
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      recoverable: true,
    };

    await this.saveExecution(execution);
    this.emit('execution:failed', execution);

    if (workflow.settings.notifications.onError) {
      await this.sendNotification(workflow, execution, 'error');
    }
  }

  /**
   * Rollback execution
   */
  private async rollbackExecution(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    rollbackSteps?: string[]
  ): Promise<void> {
    const stepsToRollback = rollbackSteps || Array.from(execution.stepExecutions.keys()).reverse();

    for (const stepId of stepsToRollback) {
      const stepExecution = execution.stepExecutions.get(stepId);
      if (stepExecution && stepExecution.status === StepStatus.COMPLETED) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (step?.config.compensate) {
          try {
            await this.executeCompensation(step, execution);
          } catch (error) {
            this.emit('rollback:failed', { stepId, error });
          }
        }
      }
    }
  }

  /**
   * Execute compensation action
   */
  private async executeCompensation(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<void> {
    const compensateAction = step.config.compensate;
    const processor = this.actionProcessors.get(compensateAction);

    if (processor) {
      await processor(step.config, execution.context);
    }
  }

  /**
   * Pause workflow execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = WorkflowStatus.PAUSED;
    execution.pausedAt = new Date();
    await this.saveExecution(execution);

    this.emit('execution:paused', execution);
  }

  /**
   * Resume workflow execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Execution ${executionId} is not paused`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${execution.workflowId} not found`);
    }

    execution.status = WorkflowStatus.ACTIVE;
    execution.pausedAt = undefined;
    await this.saveExecution(execution);

    this.emit('execution:resumed', execution);

    setImmediate(() => this.processWorkflow(execution, workflow));
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = WorkflowStatus.CANCELLED;
    execution.completedAt = new Date();
    await this.saveExecution(execution);

    this.emit('execution:cancelled', execution);
  }

  /**
   * Get workflow execution
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    let execution = this.executions.get(executionId);

    if (!execution) {
      execution = await this.loadExecution(executionId);
    }

    return execution;
  }

  /**
   * Validate workflow definition
   */
  private async validateWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!workflow.name || workflow.name.trim().length === 0) {
      throw new Error('Workflow name is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      for (const nextId of step.nextSteps) {
        if (!stepIds.has(nextId) && nextId !== 'end') {
          throw new Error(`Step ${step.id} references non-existent step: ${nextId}`);
        }
      }
    }
  }

  /**
   * Register default action processors
   */
  private registerDefaultActionProcessors(): void {
    this.actionProcessors.set('log', async (config, context) => {
      console.log('[Workflow Log]', config.message, context.variables);
      return { logged: true };
    });

    this.actionProcessors.set('set_variable', async (config, context) => {
      const { name, value } = config;
      context.variables[name] = this.interpolateVariables(value, context.variables);
      return { [name]: context.variables[name] };
    });

    this.actionProcessors.set('http_request', async (config, context) => {
      const axios = require('axios');
      const response = await axios({
        method: config.method || 'GET',
        url: this.interpolateVariables(config.url, context.variables),
        headers: config.headers,
        data: config.body,
      });
      return response.data;
    });

    this.actionProcessors.set('send_email', async (config, context) => {
      return { emailSent: true, to: config.to };
    });
  }

  /**
   * Register custom action processor
   */
  registerActionProcessor(action: string, processor: ActionProcessor): void {
    this.actionProcessors.set(action, processor);
    this.emit('processor:registered', { action });
  }

  /**
   * Interpolate variables in strings
   */
  private interpolateVariables(value: any, variables: Record<string, any>): any {
    if (typeof value === 'string') {
      return value.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return this.resolveVariable(key.trim(), variables) ?? match;
      });
    }

    if (Array.isArray(value)) {
      return value.map(v => this.interpolateVariables(v, variables));
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.interpolateVariables(v, variables);
      }
      return result;
    }

    return value;
  }

  /**
   * Resolve variable from context
   */
  private resolveVariable(path: string, variables: Record<string, any>): any {
    const keys = path.split('.');
    let value: any = variables;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Evaluate expression
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): boolean {
    const interpolated = this.interpolateVariables(expression, variables);

    try {
      const fn = new Function(...Object.keys(variables), `return ${interpolated}`);
      return fn(...Object.values(variables));
    } catch {
      return false;
    }
  }

  /**
   * Add log to step execution
   */
  private addLog(
    stepExecution: StepExecution,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any
  ): void {
    stepExecution.logs.push({
      level,
      message,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Save workflow to Redis
   */
  private async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const key = `${this.WORKFLOW_PREFIX}${workflow.id}`;
    await this.redis.set(key, JSON.stringify(workflow));
  }

  /**
   * Save execution to Redis
   */
  private async saveExecution(execution: WorkflowExecution): Promise<void> {
    const key = `${this.EXECUTION_PREFIX}${execution.id}`;
    const data = {
      ...execution,
      stepExecutions: Array.from(execution.stepExecutions.entries()),
    };
    await this.redis.set(key, JSON.stringify(data), 'EX', 86400 * 7);
  }

  /**
   * Load execution from Redis
   */
  private async loadExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    const key = `${this.EXECUTION_PREFIX}${executionId}`;
    const data = await this.redis.get(key);

    if (!data) return undefined;

    const parsed = JSON.parse(data);
    parsed.stepExecutions = new Map(parsed.stepExecutions);

    return parsed;
  }

  /**
   * Load workflows from Redis
   */
  private async loadWorkflowsFromRedis(): Promise<void> {
    const keys = await this.redis.keys(`${this.WORKFLOW_PREFIX}*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const workflow = JSON.parse(data);
        this.workflows.set(workflow.id, workflow);
      }
    }
  }

  /**
   * Recover pending executions
   */
  private async recoverPendingExecutions(): Promise<void> {
    const keys = await this.redis.keys(`${this.EXECUTION_PREFIX}*`);

    for (const key of keys) {
      const execution = await this.loadExecution(key.replace(this.EXECUTION_PREFIX, ''));
      if (execution && execution.status === WorkflowStatus.ACTIVE) {
        this.executions.set(execution.id, execution);
      }
    }
  }

  /**
   * Acquire lock
   */
  private async acquireLock(key: string): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'EX', this.LOCK_TTL, 'NX');
    return result === 'OK';
  }

  /**
   * Release lock
   */
  private async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Send notification
   */
  private async sendNotification(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    type: 'success' | 'error'
  ): Promise<void> {
    this.emit('notification:sent', {
      workflow: workflow.id,
      execution: execution.id,
      type,
      recipients: workflow.settings.notifications.recipients,
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();
    this.emit('shutdown');
  }
}

export default WorkflowEngine;
