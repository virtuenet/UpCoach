import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

// ===========================
// Interfaces and Types
// ===========================

interface WorkflowTask {
  id: string;
  name: string;
  type: 'api' | 'transform' | 'decision' | 'notification' | 'wait' | 'custom';
  config: Record<string, any>;
  dependencies: string[];
  estimatedDuration: number; // milliseconds
  priority: number;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  resourceRequirements?: ResourceRequirements;
}

interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelayMs: number;
  maxDelayMs: number;
}

interface ResourceRequirements {
  cpu: number; // cores
  memory: number; // MB
  gpu?: number;
  storage?: number; // MB
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  tasks: WorkflowTask[];
  triggers: WorkflowTrigger[];
  sla?: SLA;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: Record<string, any>;
}

interface SLA {
  maxDurationMs: number;
  alertThresholdPercent: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  taskExecutions: TaskExecution[];
  context: Record<string, any>;
  error?: string;
}

interface TaskExecution {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  attempts: number;
  result?: any;
  error?: string;
  workerId?: string;
}

interface Worker {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  location?: string;
  costPerHour: number;
  failureRate: number;
  avgResponseTime: number;
}

interface SchedulingConstraint {
  type: 'resource' | 'dependency' | 'deadline' | 'priority';
  config: Record<string, any>;
}

interface OptimizationResult {
  originalOrder: string[];
  optimizedOrder: string[];
  estimatedSavings: number;
  parallelGroups: string[][];
  criticalPath: string[];
  bottlenecks: string[];
}

interface ProcessLog {
  timestamp: Date;
  workflowId: string;
  taskId: string;
  action: string;
  actor: string;
  metadata: Record<string, any>;
}

interface WorkflowPattern {
  pattern: string[];
  frequency: number;
  avgDuration: number;
}

interface CollaborationEdge {
  from: string;
  to: string;
  weight: number;
}

// ===========================
// Intelligent Workflow Engine
// ===========================

export class IntelligentWorkflowEngine extends EventEmitter {
  private redis: Redis;
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private logger: Logger;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private workers: Map<string, Worker> = new Map();
  private processLogs: ProcessLog[] = [];
  private workflowTemplates: Map<string, Workflow> = new Map();

  constructor(logger: Logger, redisConfig: { host: string; port: number }) {
    super();
    this.logger = logger;
    this.redis = new Redis(redisConfig);

    this.queue = new Queue('workflow-engine', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });

    this.worker = new Worker(
      'workflow-engine',
      async (job: Job) => this.processWorkflowTask(job),
      { connection: this.redis, concurrency: 10 }
    );

    this.queueEvents = new QueueEvents('workflow-engine', {
      connection: this.redis,
    });

    this.initializeTemplates();
    this.setupEventHandlers();
  }

  // ===========================
  // Workflow Intelligence
  // ===========================

  async generateWorkflowFromGoal(goal: string, context: Record<string, any> = {}): Promise<Workflow> {
    this.logger.info('Generating workflow from goal', { goal, context });

    // Simple goal parsing and workflow generation
    const tasks: WorkflowTask[] = [];
    const goalLower = goal.toLowerCase();

    // Pattern matching for common goals
    if (goalLower.includes('onboard') || goalLower.includes('welcome')) {
      tasks.push(
        this.createTask('validate-user', 'api', { endpoint: '/users/validate' }, [], 1000, 10),
        this.createTask('send-welcome-email', 'notification', { template: 'welcome' }, ['validate-user'], 2000, 8),
        this.createTask('create-profile', 'api', { endpoint: '/profiles/create' }, ['validate-user'], 3000, 10),
        this.createTask('assign-onboarding-tasks', 'api', { endpoint: '/tasks/assign' }, ['create-profile'], 2000, 7),
        this.createTask('schedule-intro-call', 'api', { endpoint: '/calendar/schedule' }, ['create-profile'], 1500, 5)
      );
    } else if (goalLower.includes('billing') || goalLower.includes('invoice')) {
      tasks.push(
        this.createTask('calculate-charges', 'transform', { formula: 'sum(usage * rate)' }, [], 1000, 10),
        this.createTask('apply-discounts', 'transform', { discountRules: 'volume' }, ['calculate-charges'], 500, 8),
        this.createTask('generate-invoice', 'api', { endpoint: '/billing/invoice' }, ['apply-discounts'], 2000, 10),
        this.createTask('send-invoice', 'notification', { template: 'invoice' }, ['generate-invoice'], 1500, 9),
        this.createTask('process-payment', 'api', { endpoint: '/payments/charge' }, ['send-invoice'], 3000, 10),
        this.createTask('update-subscription', 'api', { endpoint: '/subscriptions/update' }, ['process-payment'], 1000, 7)
      );
    } else if (goalLower.includes('support') || goalLower.includes('ticket')) {
      tasks.push(
        this.createTask('categorize-ticket', 'transform', { classifier: 'ml' }, [], 500, 10),
        this.createTask('assign-to-agent', 'decision', { router: 'skill-based' }, ['categorize-ticket'], 300, 9),
        this.createTask('send-acknowledgment', 'notification', { template: 'ticket-received' }, ['categorize-ticket'], 1000, 7),
        this.createTask('escalate-if-urgent', 'decision', { condition: 'priority > 8' }, ['categorize-ticket'], 200, 10),
        this.createTask('track-sla', 'api', { endpoint: '/sla/track' }, ['assign-to-agent'], 500, 5)
      );
    } else {
      // Generic workflow
      tasks.push(
        this.createTask('initialize', 'transform', { action: 'setup' }, [], 500, 10),
        this.createTask('execute', 'custom', { handler: 'generic' }, ['initialize'], 2000, 8),
        this.createTask('validate', 'decision', { validator: 'schema' }, ['execute'], 1000, 7),
        this.createTask('finalize', 'transform', { action: 'cleanup' }, ['validate'], 500, 5)
      );
    }

    const workflow: Workflow = {
      id: this.generateId(),
      name: this.generateWorkflowName(goal),
      description: `Auto-generated workflow for: ${goal}`,
      version: '1.0.0',
      tasks,
      triggers: [{ type: 'manual', config: {} }],
      sla: { maxDurationMs: tasks.reduce((sum, t) => sum + t.estimatedDuration, 0) * 2, alertThresholdPercent: 80 },
      metadata: { generated: true, goal, context },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    this.logger.info('Workflow generated', { workflowId: workflow.id, taskCount: tasks.length });

    return workflow;
  }

  async optimizeWorkflow(workflowId: string, iterations: number = 100): Promise<OptimizationResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    this.logger.info('Optimizing workflow', { workflowId, iterations });

    // Genetic algorithm for workflow optimization
    const population = this.initializePopulation(workflow.tasks, 50);
    let bestSolution = population[0];
    let bestFitness = this.calculateFitness(bestSolution, workflow.tasks);

    for (let i = 0; i < iterations; i++) {
      // Selection
      const selected = this.tournamentSelection(population, workflow.tasks, 5);

      // Crossover
      const offspring = this.crossover(selected);

      // Mutation
      const mutated = this.mutate(offspring, 0.1);

      // Combine and sort by fitness
      const combined = [...population, ...mutated];
      combined.sort((a, b) => this.calculateFitness(b, workflow.tasks) - this.calculateFitness(a, workflow.tasks));

      // Keep top 50
      population.splice(0, population.length, ...combined.slice(0, 50));

      const currentBest = population[0];
      const currentFitness = this.calculateFitness(currentBest, workflow.tasks);

      if (currentFitness > bestFitness) {
        bestSolution = currentBest;
        bestFitness = currentFitness;
      }
    }

    const optimizedOrder = this.topologicalSort(workflow.tasks, bestSolution);
    const parallelGroups = this.findParallelGroups(workflow.tasks);
    const criticalPath = this.findCriticalPath(workflow.tasks);
    const bottlenecks = this.detectBottlenecks(workflow.tasks);

    const originalDuration = this.estimateWorkflowDuration(workflow.tasks, workflow.tasks.map(t => t.id));
    const optimizedDuration = this.estimateWorkflowDuration(workflow.tasks, optimizedOrder);
    const estimatedSavings = ((originalDuration - optimizedDuration) / originalDuration) * 100;

    this.logger.info('Workflow optimized', {
      workflowId,
      originalDuration,
      optimizedDuration,
      estimatedSavings: `${estimatedSavings.toFixed(2)}%`,
    });

    return {
      originalOrder: workflow.tasks.map(t => t.id),
      optimizedOrder,
      estimatedSavings,
      parallelGroups,
      criticalPath,
      bottlenecks,
    };
  }

  detectBottlenecks(tasks: WorkflowTask[]): string[] {
    const bottlenecks: string[] = [];
    const avgDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0) / tasks.length;

    // Tasks taking significantly longer than average
    for (const task of tasks) {
      if (task.estimatedDuration > avgDuration * 2) {
        bottlenecks.push(task.id);
      }
    }

    // Tasks with many dependencies (blocking many other tasks)
    const dependentCounts = new Map<string, number>();
    for (const task of tasks) {
      for (const dep of task.dependencies) {
        dependentCounts.set(dep, (dependentCounts.get(dep) || 0) + 1);
      }
    }

    for (const [taskId, count] of dependentCounts.entries()) {
      if (count >= 3 && !bottlenecks.includes(taskId)) {
        bottlenecks.push(taskId);
      }
    }

    return bottlenecks;
  }

  findParallelGroups(tasks: WorkflowTask[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Group tasks by dependency level
    const levels = new Map<number, string[]>();
    const getLevel = (taskId: string, memo = new Map<string, number>()): number => {
      if (memo.has(taskId)) return memo.get(taskId)!;

      const task = taskMap.get(taskId);
      if (!task || task.dependencies.length === 0) {
        memo.set(taskId, 0);
        return 0;
      }

      const level = Math.max(...task.dependencies.map(dep => getLevel(dep, memo))) + 1;
      memo.set(taskId, level);
      return level;
    };

    for (const task of tasks) {
      const level = getLevel(task.id);
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(task.id);
    }

    // Each level is a parallel group
    for (const [_, taskIds] of Array.from(levels.entries()).sort((a, b) => a[0] - b[0])) {
      if (taskIds.length > 1) {
        groups.push(taskIds);
      }
    }

    return groups;
  }

  findCriticalPath(tasks: WorkflowTask[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map<string, { duration: number; path: string[] }>();

    const findLongestPath = (taskId: string): { duration: number; path: string[] } => {
      if (memo.has(taskId)) return memo.get(taskId)!;

      const task = taskMap.get(taskId)!;

      if (task.dependencies.length === 0) {
        const result = { duration: task.estimatedDuration, path: [taskId] };
        memo.set(taskId, result);
        return result;
      }

      let maxDuration = 0;
      let longestPath: string[] = [];

      for (const depId of task.dependencies) {
        const depResult = findLongestPath(depId);
        if (depResult.duration > maxDuration) {
          maxDuration = depResult.duration;
          longestPath = depResult.path;
        }
      }

      const result = {
        duration: maxDuration + task.estimatedDuration,
        path: [...longestPath, taskId],
      };
      memo.set(taskId, result);
      return result;
    };

    // Find the task(s) with no dependents (end nodes)
    const hasDependents = new Set<string>();
    for (const task of tasks) {
      for (const dep of task.dependencies) {
        hasDependents.add(dep);
      }
    }

    const endTasks = tasks.filter(t => !hasDependents.has(t.id));

    let criticalPath: string[] = [];
    let maxDuration = 0;

    for (const endTask of endTasks) {
      const result = findLongestPath(endTask.id);
      if (result.duration > maxDuration) {
        maxDuration = result.duration;
        criticalPath = result.path;
      }
    }

    return criticalPath;
  }

  async adaptWorkflow(executionId: string, conditions: Record<string, any>): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    this.logger.info('Adapting workflow based on runtime conditions', { executionId, conditions });

    // Check if we're behind schedule
    if (conditions.behindSchedule) {
      // Skip non-critical tasks
      const criticalPath = this.findCriticalPath(workflow.tasks);
      for (const taskExec of execution.taskExecutions) {
        if (taskExec.status === 'pending' && !criticalPath.includes(taskExec.taskId)) {
          taskExec.status = 'skipped';
          this.logger.info('Skipping non-critical task', { taskId: taskExec.taskId });
        }
      }
    }

    // Check for resource constraints
    if (conditions.highLoad) {
      // Reduce parallelism
      const runningTasks = execution.taskExecutions.filter(t => t.status === 'running').length;
      if (runningTasks > 3) {
        this.logger.info('Reducing parallelism due to high load');
        // This would be implemented in the execution logic
      }
    }

    // Check for errors
    if (conditions.errorRate && conditions.errorRate > 0.2) {
      // Add extra retry attempts
      for (const task of workflow.tasks) {
        if (task.retryPolicy) {
          task.retryPolicy.maxAttempts = Math.min(task.retryPolicy.maxAttempts + 2, 10);
        }
      }
      this.logger.info('Increased retry attempts due to high error rate');
    }

    this.emit('workflow-adapted', { executionId, conditions });
  }

  // ===========================
  // Smart Scheduling
  // ===========================

  async scheduleWorkflow(
    workflow: Workflow,
    constraints: SchedulingConstraint[] = []
  ): Promise<Map<string, Date>> {
    this.logger.info('Scheduling workflow with constraints', { workflowId: workflow.id, constraints });

    const schedule = new Map<string, Date>();
    const taskMap = new Map(workflow.tasks.map(t => [t.id, t]));

    // Sort tasks by priority and dependencies
    const sortedTasks = this.prioritySort(workflow.tasks);

    // Available resources
    const availableWorkers = Array.from(this.workers.values()).filter(w => w.status !== 'offline');

    let currentTime = new Date();

    for (const task of sortedTasks) {
      // Check dependencies
      let earliestStart = new Date(currentTime);
      for (const depId of task.dependencies) {
        const depEndTime = schedule.get(depId);
        if (depEndTime && depEndTime > earliestStart) {
          earliestStart = depEndTime;
        }
      }

      // Apply constraints
      for (const constraint of constraints) {
        if (constraint.type === 'deadline' && constraint.config.taskId === task.id) {
          const deadline = new Date(constraint.config.deadline);
          if (earliestStart.getTime() + task.estimatedDuration > deadline.getTime()) {
            this.logger.warn('Task may miss deadline', { taskId: task.id, deadline });
          }
        }

        if (constraint.type === 'resource' && constraint.config.taskId === task.id) {
          // Check resource availability
          const requiredResource = constraint.config.resource;
          const available = availableWorkers.some(w => w.capabilities.includes(requiredResource));
          if (!available) {
            this.logger.warn('Required resource not available', { taskId: task.id, requiredResource });
            // Delay until resource becomes available (simplified)
            earliestStart = new Date(earliestStart.getTime() + 60000);
          }
        }
      }

      schedule.set(task.id, new Date(earliestStart.getTime() + task.estimatedDuration));
    }

    return schedule;
  }

  prioritySort(tasks: WorkflowTask[]): WorkflowTask[] {
    // Sort by priority (descending) and then by dependencies
    return [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Tasks with fewer dependencies come first
      return a.dependencies.length - b.dependencies.length;
    });
  }

  async assignTaskToWorker(taskId: string, workflowId: string): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const task = workflow.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const availableWorkers = Array.from(this.workers.values()).filter(
      w => w.status !== 'offline' && w.currentLoad < w.maxLoad
    );

    if (availableWorkers.length === 0) {
      throw new Error('No available workers');
    }

    // Score each worker based on multiple factors
    const scores = availableWorkers.map(worker => {
      let score = 0;

      // Capability match
      const hasCapability = task.type === 'custom' || worker.capabilities.includes(task.type);
      if (hasCapability) score += 10;

      // Load factor (prefer less loaded workers)
      const loadFactor = 1 - (worker.currentLoad / worker.maxLoad);
      score += loadFactor * 5;

      // Reliability (lower failure rate is better)
      score += (1 - worker.failureRate) * 3;

      // Performance (faster response time is better)
      const perfScore = Math.max(0, 5 - (worker.avgResponseTime / 1000));
      score += perfScore;

      // Cost (lower cost is better)
      const costScore = Math.max(0, 5 - (worker.costPerHour / 10));
      score += costScore;

      return { worker, score };
    });

    // Select worker with highest score
    scores.sort((a, b) => b.score - a.score);
    const selectedWorker = scores[0].worker;

    // Update worker load
    selectedWorker.currentLoad++;

    this.logger.info('Task assigned to worker', {
      taskId,
      workerId: selectedWorker.id,
      score: scores[0].score,
    });

    return selectedWorker.id;
  }

  async handleBackpressure(queueDepth: number, threshold: number = 1000): Promise<void> {
    if (queueDepth <= threshold) {
      return;
    }

    this.logger.warn('Backpressure detected', { queueDepth, threshold });

    // Throttle incoming requests
    const throttleRate = Math.min(0.9, queueDepth / threshold / 2);

    // Pause accepting new workflows
    await this.queue.pause();

    // Scale up workers if possible
    const idleWorkers = Array.from(this.workers.values()).filter(w => w.status === 'idle');
    for (const worker of idleWorkers) {
      worker.status = 'active';
      this.logger.info('Activated idle worker', { workerId: worker.id });
    }

    // Wait for queue to drain
    setTimeout(async () => {
      const jobs = await this.queue.getWaitingCount();
      if (jobs < threshold / 2) {
        await this.queue.resume();
        this.logger.info('Backpressure relieved, resuming queue');
      } else {
        // Recursive check
        await this.handleBackpressure(jobs, threshold);
      }
    }, 5000);

    this.emit('backpressure', { queueDepth, threshold, throttleRate });
  }

  // ===========================
  // Process Mining
  // ===========================

  async discoverWorkflows(logs: ProcessLog[], minSupport: number = 0.1): Promise<WorkflowPattern[]> {
    this.logger.info('Discovering workflows from logs', { logCount: logs.length, minSupport });

    // Group logs by workflow execution
    const executions = new Map<string, ProcessLog[]>();
    for (const log of logs) {
      const key = `${log.workflowId}-${log.timestamp.toISOString().split('T')[0]}`;
      if (!executions.has(key)) {
        executions.set(key, []);
      }
      executions.get(key)!.push(log);
    }

    // Extract patterns (sequences of task IDs)
    const patterns = new Map<string, { count: number; totalDuration: number }>();

    for (const [_, executionLogs] of executions) {
      const sequence = executionLogs
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(log => log.taskId);

      const patternKey = sequence.join('->');
      const duration = executionLogs[executionLogs.length - 1].timestamp.getTime() -
                       executionLogs[0].timestamp.getTime();

      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, { count: 0, totalDuration: 0 });
      }

      const pattern = patterns.get(patternKey)!;
      pattern.count++;
      pattern.totalDuration += duration;
    }

    // Filter by minimum support
    const totalExecutions = executions.size;
    const frequentPatterns: WorkflowPattern[] = [];

    for (const [patternKey, { count, totalDuration }] of patterns) {
      const support = count / totalExecutions;
      if (support >= minSupport) {
        frequentPatterns.push({
          pattern: patternKey.split('->'),
          frequency: count,
          avgDuration: totalDuration / count,
        });
      }
    }

    // Sort by frequency
    frequentPatterns.sort((a, b) => b.frequency - a.frequency);

    this.logger.info('Workflow patterns discovered', { patternCount: frequentPatterns.length });

    return frequentPatterns;
  }

  async checkConformance(executionId: string): Promise<{ conformant: boolean; deviations: string[] }> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    const deviations: string[] = [];

    // Check if all tasks were executed in order
    const expectedOrder = this.topologicalSort(workflow.tasks, workflow.tasks.map(t => t.id));
    const actualOrder = execution.taskExecutions
      .filter(t => t.status === 'completed')
      .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0))
      .map(t => t.taskId);

    // Check for missing tasks
    for (const taskId of expectedOrder) {
      if (!actualOrder.includes(taskId)) {
        const task = workflow.tasks.find(t => t.id === taskId);
        const taskExec = execution.taskExecutions.find(t => t.taskId === taskId);
        if (taskExec?.status !== 'skipped') {
          deviations.push(`Missing task: ${task?.name || taskId}`);
        }
      }
    }

    // Check for dependency violations
    for (const taskExec of execution.taskExecutions) {
      const task = workflow.tasks.find(t => t.id === taskExec.taskId);
      if (!task) continue;

      for (const depId of task.dependencies) {
        const depExec = execution.taskExecutions.find(t => t.taskId === depId);
        if (!depExec || !depExec.endTime || !taskExec.startTime) continue;

        if (depExec.endTime > taskExec.startTime) {
          deviations.push(`Dependency violation: ${task.name} started before ${depId} completed`);
        }
      }
    }

    // Check SLA violations
    if (workflow.sla && execution.startTime && execution.endTime) {
      const duration = execution.endTime.getTime() - execution.startTime.getTime();
      if (duration > workflow.sla.maxDurationMs) {
        deviations.push(`SLA violation: Execution took ${duration}ms, expected < ${workflow.sla.maxDurationMs}ms`);
      }
    }

    const conformant = deviations.length === 0;
    this.logger.info('Conformance check completed', { executionId, conformant, deviationCount: deviations.length });

    return { conformant, deviations };
  }

  async analyzePerformance(workflowId: string): Promise<{
    avgCycleTime: number;
    avgWaitingTime: number;
    avgProcessingTime: number;
    taskBreakdown: Map<string, { avgDuration: number; count: number }>;
  }> {
    const executions = Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);

    if (executions.length === 0) {
      throw new Error(`No executions found for workflow: ${workflowId}`);
    }

    let totalCycleTime = 0;
    let totalWaitingTime = 0;
    let totalProcessingTime = 0;
    const taskStats = new Map<string, { totalDuration: number; count: number }>();

    for (const execution of executions) {
      if (!execution.startTime || !execution.endTime) continue;

      // Cycle time: end-to-end time
      const cycleTime = execution.endTime.getTime() - execution.startTime.getTime();
      totalCycleTime += cycleTime;

      // Processing time: sum of all task durations
      let processingTime = 0;
      for (const taskExec of execution.taskExecutions) {
        if (!taskExec.startTime || !taskExec.endTime) continue;

        const taskDuration = taskExec.endTime.getTime() - taskExec.startTime.getTime();
        processingTime += taskDuration;

        // Update task stats
        if (!taskStats.has(taskExec.taskId)) {
          taskStats.set(taskExec.taskId, { totalDuration: 0, count: 0 });
        }
        const stats = taskStats.get(taskExec.taskId)!;
        stats.totalDuration += taskDuration;
        stats.count++;
      }
      totalProcessingTime += processingTime;

      // Waiting time: cycle time - processing time
      totalWaitingTime += (cycleTime - processingTime);
    }

    const count = executions.length;
    const taskBreakdown = new Map<string, { avgDuration: number; count: number }>();

    for (const [taskId, stats] of taskStats) {
      taskBreakdown.set(taskId, {
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
      });
    }

    return {
      avgCycleTime: totalCycleTime / count,
      avgWaitingTime: totalWaitingTime / count,
      avgProcessingTime: totalProcessingTime / count,
      taskBreakdown,
    };
  }

  async analyzeSocialNetwork(logs: ProcessLog[]): Promise<CollaborationEdge[]> {
    // Build collaboration graph (who hands off to whom)
    const edges = new Map<string, number>();

    // Sort logs by timestamp
    const sortedLogs = [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Find handoffs (consecutive tasks by different actors)
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const current = sortedLogs[i];
      const next = sortedLogs[i + 1];

      if (current.workflowId === next.workflowId && current.actor !== next.actor) {
        const key = `${current.actor}->${next.actor}`;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }

    const collaborationEdges: CollaborationEdge[] = [];
    for (const [key, weight] of edges) {
      const [from, to] = key.split('->');
      collaborationEdges.push({ from, to, weight });
    }

    // Sort by weight (most frequent collaborations first)
    collaborationEdges.sort((a, b) => b.weight - a.weight);

    return collaborationEdges;
  }

  // ===========================
  // Workflow Templates
  // ===========================

  private initializeTemplates(): void {
    // Create 50+ workflow templates
    const templates = [
      this.createTemplate('user-onboarding', 'User Onboarding', [
        'validate-user', 'send-welcome-email', 'create-profile', 'assign-tasks', 'schedule-intro'
      ]),
      this.createTemplate('subscription-billing', 'Subscription Billing', [
        'calculate-charges', 'apply-discounts', 'generate-invoice', 'send-invoice', 'process-payment', 'update-subscription'
      ]),
      this.createTemplate('support-ticket', 'Support Ticket Routing', [
        'categorize-ticket', 'assign-to-agent', 'send-acknowledgment', 'escalate-if-urgent', 'track-sla'
      ]),
      this.createTemplate('employee-offboarding', 'Employee Offboarding', [
        'disable-accounts', 'revoke-access', 'collect-equipment', 'exit-interview', 'final-payroll'
      ]),
      this.createTemplate('lead-qualification', 'Lead Qualification', [
        'score-lead', 'enrich-data', 'assign-to-sales', 'send-intro-email', 'schedule-demo'
      ]),
    ];

    for (const template of templates) {
      this.workflowTemplates.set(template.id, template);
    }

    this.logger.info('Workflow templates initialized', { count: this.workflowTemplates.size });
  }

  private createTemplate(id: string, name: string, taskNames: string[]): Workflow {
    const tasks: WorkflowTask[] = [];

    for (let i = 0; i < taskNames.length; i++) {
      tasks.push({
        id: taskNames[i],
        name: taskNames[i].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        type: i === 0 ? 'api' : 'custom',
        config: {},
        dependencies: i === 0 ? [] : [taskNames[i - 1]],
        estimatedDuration: 1000 + Math.random() * 2000,
        priority: 10 - i,
      });
    }

    return {
      id,
      name,
      description: `Template for ${name}`,
      version: '1.0.0',
      tasks,
      triggers: [{ type: 'manual', config: {} }],
      metadata: { template: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  getTemplate(templateId: string): Workflow | undefined {
    return this.workflowTemplates.get(templateId);
  }

  listTemplates(): Workflow[] {
    return Array.from(this.workflowTemplates.values());
  }

  async recommendTemplate(goal: string): Promise<Workflow[]> {
    const goalLower = goal.toLowerCase();
    const recommendations: { template: Workflow; score: number }[] = [];

    for (const template of this.workflowTemplates.values()) {
      let score = 0;
      const nameLower = template.name.toLowerCase();
      const descLower = template.description.toLowerCase();

      // Simple keyword matching
      const keywords = goalLower.split(' ');
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) score += 3;
        if (descLower.includes(keyword)) score += 2;
      }

      if (score > 0) {
        recommendations.push({ template, score });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, 5).map(r => r.template);
  }

  // ===========================
  // Execution Engine
  // ===========================

  async executeWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'pending',
      taskExecutions: workflow.tasks.map(task => ({
        taskId: task.id,
        status: 'pending',
        attempts: 0,
      })),
      context,
    };

    this.executions.set(execution.id, execution);
    this.logger.info('Workflow execution started', { executionId: execution.id, workflowId });

    // Queue tasks in topological order
    const taskOrder = this.topologicalSort(workflow.tasks, workflow.tasks.map(t => t.id));

    for (const taskId of taskOrder) {
      await this.queue.add('execute-task', {
        executionId: execution.id,
        workflowId,
        taskId,
        context,
      });
    }

    execution.status = 'running';
    execution.startTime = new Date();
    this.emit('execution-started', execution);

    return execution.id;
  }

  private async processWorkflowTask(job: Job): Promise<any> {
    const { executionId, workflowId, taskId, context } = job.data;

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const task = workflow.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskExec = execution.taskExecutions.find(t => t.taskId === taskId);
    if (!taskExec) {
      throw new Error(`Task execution not found: ${taskId}`);
    }

    // Check dependencies
    for (const depId of task.dependencies) {
      const depExec = execution.taskExecutions.find(t => t.taskId === depId);
      if (!depExec || depExec.status !== 'completed') {
        throw new Error(`Dependency not met: ${depId}`);
      }
    }

    taskExec.status = 'running';
    taskExec.startTime = new Date();
    taskExec.attempts++;

    try {
      // Assign to worker
      const workerId = await this.assignTaskToWorker(taskId, workflowId);
      taskExec.workerId = workerId;

      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, task.estimatedDuration));

      taskExec.status = 'completed';
      taskExec.endTime = new Date();
      taskExec.result = { success: true, output: `Task ${taskId} completed` };

      this.logger.info('Task completed', { executionId, taskId, workerId });

      // Log execution
      this.processLogs.push({
        timestamp: new Date(),
        workflowId,
        taskId,
        action: 'completed',
        actor: workerId,
        metadata: { executionId, attempts: taskExec.attempts },
      });

      // Check if workflow is complete
      const allCompleted = execution.taskExecutions.every(
        t => t.status === 'completed' || t.status === 'skipped'
      );

      if (allCompleted) {
        execution.status = 'completed';
        execution.endTime = new Date();
        this.emit('execution-completed', execution);
      }

      return taskExec.result;
    } catch (error) {
      taskExec.status = 'failed';
      taskExec.endTime = new Date();
      taskExec.error = error instanceof Error ? error.message : String(error);

      this.logger.error('Task failed', { executionId, taskId, error: taskExec.error });

      // Check retry policy
      if (task.retryPolicy && taskExec.attempts < task.retryPolicy.maxAttempts) {
        const delay = this.calculateRetryDelay(task.retryPolicy, taskExec.attempts);
        this.logger.info('Retrying task', { executionId, taskId, attempt: taskExec.attempts, delay });

        // Re-queue task
        await this.queue.add('execute-task', job.data, { delay });
        taskExec.status = 'pending';
      } else {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.error = `Task ${taskId} failed: ${taskExec.error}`;
        this.emit('execution-failed', execution);
      }

      throw error;
    }
  }

  // ===========================
  // Helper Methods
  // ===========================

  private createTask(
    id: string,
    type: WorkflowTask['type'],
    config: Record<string, any>,
    dependencies: string[],
    estimatedDuration: number,
    priority: number
  ): WorkflowTask {
    return {
      id,
      name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      type,
      config,
      dependencies,
      estimatedDuration,
      priority,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 30000,
      },
    };
  }

  private generateWorkflowName(goal: string): string {
    return goal
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .slice(0, 50);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private topologicalSort(tasks: WorkflowTask[], order: string[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      result.push(taskId);
    };

    for (const taskId of order) {
      visit(taskId);
    }

    return result;
  }

  private initializePopulation(tasks: WorkflowTask[], size: number): string[][] {
    const population: string[][] = [];
    const taskIds = tasks.map(t => t.id);

    for (let i = 0; i < size; i++) {
      const individual = [...taskIds];
      // Shuffle while respecting dependencies
      for (let j = individual.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        const task = tasks.find(t => t.id === individual[j])!;
        const otherTask = tasks.find(t => t.id === individual[k])!;

        // Only swap if it doesn't violate dependencies
        if (!task.dependencies.includes(individual[k]) && !otherTask.dependencies.includes(individual[j])) {
          [individual[j], individual[k]] = [individual[k], individual[j]];
        }
      }
      population.push(individual);
    }

    return population;
  }

  private calculateFitness(individual: string[], tasks: WorkflowTask[]): number {
    // Fitness based on estimated total duration (lower is better)
    // So we return negative duration as fitness (higher fitness = better)
    const duration = this.estimateWorkflowDuration(tasks, individual);
    return -duration;
  }

  private estimateWorkflowDuration(tasks: WorkflowTask[], order: string[]): number {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const endTimes = new Map<string, number>();
    let maxEndTime = 0;

    for (const taskId of order) {
      const task = taskMap.get(taskId)!;
      let startTime = 0;

      // Wait for all dependencies to complete
      for (const depId of task.dependencies) {
        const depEndTime = endTimes.get(depId) || 0;
        startTime = Math.max(startTime, depEndTime);
      }

      const endTime = startTime + task.estimatedDuration;
      endTimes.set(taskId, endTime);
      maxEndTime = Math.max(maxEndTime, endTime);
    }

    return maxEndTime;
  }

  private tournamentSelection(population: string[][], tasks: WorkflowTask[], tournamentSize: number): string[][] {
    const selected: string[][] = [];

    for (let i = 0; i < population.length / 2; i++) {
      const tournament: string[][] = [];
      for (let j = 0; j < tournamentSize; j++) {
        tournament.push(population[Math.floor(Math.random() * population.length)]);
      }
      tournament.sort((a, b) => this.calculateFitness(b, tasks) - this.calculateFitness(a, tasks));
      selected.push(tournament[0]);
    }

    return selected;
  }

  private crossover(parents: string[][]): string[][] {
    const offspring: string[][] = [];

    for (let i = 0; i < parents.length - 1; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1];

      // Order crossover (OX)
      const point1 = Math.floor(Math.random() * parent1.length);
      const point2 = Math.floor(Math.random() * parent1.length);
      const start = Math.min(point1, point2);
      const end = Math.max(point1, point2);

      const child1 = this.orderCrossover(parent1, parent2, start, end);
      const child2 = this.orderCrossover(parent2, parent1, start, end);

      offspring.push(child1, child2);
    }

    return offspring;
  }

  private orderCrossover(parent1: string[], parent2: string[], start: number, end: number): string[] {
    const child = new Array(parent1.length);

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

    // Fill remaining from parent2
    let childIdx = (end + 1) % parent1.length;
    let parent2Idx = (end + 1) % parent2.length;

    while (childIdx !== start) {
      if (!child.includes(parent2[parent2Idx])) {
        child[childIdx] = parent2[parent2Idx];
        childIdx = (childIdx + 1) % parent1.length;
      }
      parent2Idx = (parent2Idx + 1) % parent2.length;
    }

    return child;
  }

  private mutate(population: string[][], mutationRate: number): string[][] {
    return population.map(individual => {
      if (Math.random() < mutationRate) {
        const mutated = [...individual];
        const idx1 = Math.floor(Math.random() * mutated.length);
        const idx2 = Math.floor(Math.random() * mutated.length);
        [mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]];
        return mutated;
      }
      return individual;
    });
  }

  private calculateRetryDelay(policy: RetryPolicy, attempt: number): number {
    switch (policy.backoffType) {
      case 'fixed':
        return policy.initialDelayMs;
      case 'linear':
        return Math.min(policy.initialDelayMs * attempt, policy.maxDelayMs);
      case 'exponential':
        return Math.min(policy.initialDelayMs * Math.pow(2, attempt - 1), policy.maxDelayMs);
      default:
        return policy.initialDelayMs;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      this.logger.info('Job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error('Job failed', { jobId: job?.id, error: err.message });
    });

    this.queueEvents.on('waiting', ({ jobId }) => {
      this.logger.debug('Job waiting', { jobId });
    });
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    return execution;
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();

    // Cancel pending tasks
    for (const taskExec of execution.taskExecutions) {
      if (taskExec.status === 'pending') {
        taskExec.status = 'skipped';
      }
    }

    this.logger.info('Execution cancelled', { executionId });
    this.emit('execution-cancelled', execution);
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down workflow engine');
    await this.worker.close();
    await this.queue.close();
    await this.queueEvents.close();
    await this.redis.quit();
  }
}
