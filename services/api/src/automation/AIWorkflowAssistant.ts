import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import OpenAI from 'openai';
import {
  WorkflowDefinition,
  WorkflowAction,
  WorkflowTrigger,
  WorkflowCondition,
} from './WorkflowEngine';
import TemplateLibrary, { WorkflowTemplate } from './TemplateLibrary';

/**
 * AI Workflow Assistant
 *
 * AI-powered assistant for workflow creation, optimization, and debugging.
 * Uses GPT-4 for natural language understanding and generation.
 *
 * Features:
 * - Natural language to workflow conversion
 * - Intent classification (create, modify, debug, optimize)
 * - Workflow optimization suggestions
 * - Error diagnosis and fix recommendations
 * - Step recommendations based on context
 * - Variable extraction from natural language
 * - Condition builder from text
 * - Trigger suggestion engine
 * - Integration recommendations
 * - Template matching from description
 * - Workflow complexity analysis
 * - Best practice validation
 * - Performance optimization tips
 */

export interface AIRequest {
  id: string;
  userId: string;
  organizationId: string;
  intent: AIIntent;
  input: string;
  context?: {
    workflowId?: string;
    existingWorkflow?: WorkflowDefinition;
    userPreferences?: Record<string, any>;
  };
  timestamp: Date;
}

export type AIIntent =
  | 'create_workflow'
  | 'modify_workflow'
  | 'debug_workflow'
  | 'optimize_workflow'
  | 'suggest_steps'
  | 'explain_workflow'
  | 'find_template'
  | 'generate_condition'
  | 'suggest_trigger';

export interface AIResponse {
  id: string;
  requestId: string;
  intent: AIIntent;
  confidence: number;
  result: AIResult;
  suggestions?: string[];
  warnings?: string[];
  timestamp: Date;
}

export type AIResult =
  | WorkflowGenerationResult
  | WorkflowOptimizationResult
  | WorkflowDebugResult
  | TemplateRecommendationResult
  | StepSuggestionResult
  | TriggerSuggestionResult
  | ConditionGenerationResult;

export interface WorkflowGenerationResult {
  type: 'workflow_generation';
  workflow: Partial<WorkflowDefinition>;
  explanation: string;
  nextSteps: string[];
}

export interface WorkflowOptimizationResult {
  type: 'workflow_optimization';
  optimizations: Optimization[];
  estimatedImprovement: {
    executionTime?: number; // percentage
    reliability?: number; // percentage
    cost?: number; // percentage
  };
}

export interface Optimization {
  type: 'performance' | 'reliability' | 'cost' | 'best_practice';
  severity: 'low' | 'medium' | 'high';
  description: string;
  currentState: string;
  suggestedState: string;
  impact: string;
  implementation: {
    actions: string[];
    automated: boolean;
  };
}

export interface WorkflowDebugResult {
  type: 'workflow_debug';
  issues: WorkflowIssue[];
  fixes: WorkflowFix[];
}

export interface WorkflowIssue {
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  location: {
    actionId?: string;
    conditionIndex?: number;
  };
  impact: string;
}

export interface WorkflowFix {
  issueType: string;
  description: string;
  automated: boolean;
  steps: string[];
  code?: any;
}

export interface TemplateRecommendationResult {
  type: 'template_recommendation';
  templates: Array<{
    template: WorkflowTemplate;
    relevanceScore: number;
    reason: string;
  }>;
}

export interface StepSuggestionResult {
  type: 'step_suggestion';
  suggestions: Array<{
    action: WorkflowAction;
    description: string;
    rationale: string;
    placement: 'before' | 'after' | 'replace';
  }>;
}

export interface TriggerSuggestionResult {
  type: 'trigger_suggestion';
  triggers: Array<{
    trigger: WorkflowTrigger;
    description: string;
    useCase: string;
    confidence: number;
  }>;
}

export interface ConditionGenerationResult {
  type: 'condition_generation';
  conditions: WorkflowCondition[];
  explanation: string;
}

export class AIWorkflowAssistant extends EventEmitter {
  private openai: OpenAI;
  private redis: Redis;
  private templateLibrary: TemplateLibrary;
  private readonly CACHE_PREFIX = 'ai:';
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly MODEL = 'gpt-4-turbo-preview';

  constructor(templateLibrary: TemplateLibrary) {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 9, // AI Cache DB
    });

    this.templateLibrary = templateLibrary;
  }

  /**
   * Process AI request
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const intent = await this.classifyIntent(request.input, request.intent);

      let result: AIResult;

      switch (intent) {
        case 'create_workflow':
          result = await this.generateWorkflow(request);
          break;
        case 'modify_workflow':
          result = await this.modifyWorkflow(request);
          break;
        case 'debug_workflow':
          result = await this.debugWorkflow(request);
          break;
        case 'optimize_workflow':
          result = await this.optimizeWorkflow(request);
          break;
        case 'suggest_steps':
          result = await this.suggestSteps(request);
          break;
        case 'find_template':
          result = await this.findTemplates(request);
          break;
        case 'generate_condition':
          result = await this.generateConditions(request);
          break;
        case 'suggest_trigger':
          result = await this.suggestTriggers(request);
          break;
        default:
          throw new Error(`Unsupported intent: ${intent}`);
      }

      const response: AIResponse = {
        id: this.generateId(),
        requestId: request.id,
        intent,
        confidence: 0.85,
        result,
        timestamp: new Date(),
      };

      const duration = Date.now() - startTime;
      this.emit('request:completed', { request, response, duration });

      return response;
    } catch (error) {
      this.emit('request:failed', { request, error });
      throw error;
    }
  }

  /**
   * Classify intent from natural language
   */
  private async classifyIntent(input: string, hintIntent?: AIIntent): Promise<AIIntent> {
    if (hintIntent) return hintIntent;

    const prompt = `Classify the following user request into one of these intents:
- create_workflow: User wants to create a new workflow
- modify_workflow: User wants to modify an existing workflow
- debug_workflow: User needs help fixing a workflow error
- optimize_workflow: User wants to improve workflow performance
- suggest_steps: User wants suggestions for workflow steps
- find_template: User is looking for a template
- generate_condition: User wants to create conditions
- suggest_trigger: User needs help choosing a trigger

User request: "${input}"

Respond with only the intent name.`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert workflow automation assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const intent = completion.choices[0].message.content?.trim() as AIIntent;
    return intent || 'create_workflow';
  }

  /**
   * Generate workflow from natural language
   */
  private async generateWorkflow(request: AIRequest): Promise<WorkflowGenerationResult> {
    const prompt = `Create a workflow automation based on this description:

"${request.input}"

Generate a workflow with:
1. An appropriate trigger (event, schedule, webhook, or manual)
2. A sequence of actions to accomplish the goal
3. Any necessary conditions
4. Proper error handling

Available action types:
- send_email: Send an email
- send_notification: Send push notification
- send_sms: Send SMS message
- create_task: Create a task
- update_record: Update a database record
- http_request: Make HTTP API call
- delay: Wait for a period
- condition: Conditional branching
- loop: Iterate over items
- ai_analyze: AI analysis

Available trigger types:
- event: Triggered by platform events (user.registered, goal.completed, etc.)
- schedule: Cron-based scheduling
- webhook: External webhook
- manual: Manually triggered

Respond in JSON format:
{
  "name": "Workflow name",
  "description": "Workflow description",
  "trigger": { "type": "...", ... },
  "actions": [ { "id": "...", "type": "...", "config": {...} } ],
  "conditions": [ ... ],
  "explanation": "How this workflow works",
  "nextSteps": ["What the user should do next"]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert workflow automation designer. Generate production-ready workflow definitions with proper error handling, retry logic, and best practices.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    const workflow: Partial<WorkflowDefinition> = {
      name: result.name,
      description: result.description,
      trigger: result.trigger,
      actions: result.actions,
      conditions: result.conditions || [],
      settings: {
        maxExecutionTime: 300,
        maxRetries: 3,
        retryDelay: 1000,
        concurrentExecutions: 10,
        errorHandling: 'stop',
        logging: true,
        notifications: {
          onSuccess: false,
          onError: true,
          recipients: [],
        },
      },
    };

    return {
      type: 'workflow_generation',
      workflow,
      explanation: result.explanation,
      nextSteps: result.nextSteps,
    };
  }

  /**
   * Modify existing workflow
   */
  private async modifyWorkflow(request: AIRequest): Promise<WorkflowGenerationResult> {
    if (!request.context?.existingWorkflow) {
      throw new Error('Existing workflow required for modification');
    }

    const existingWorkflow = request.context.existingWorkflow;

    const prompt = `Modify the following workflow based on this request:

Request: "${request.input}"

Current workflow:
${JSON.stringify(existingWorkflow, null, 2)}

Generate the modified workflow with explanations of what changed.

Respond in JSON format:
{
  "name": "Workflow name",
  "description": "Workflow description",
  "trigger": { ... },
  "actions": [ ... ],
  "conditions": [ ... ],
  "explanation": "What was changed and why",
  "nextSteps": ["What to do next"]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert workflow automation designer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'workflow_generation',
      workflow: result,
      explanation: result.explanation,
      nextSteps: result.nextSteps,
    };
  }

  /**
   * Debug workflow
   */
  private async debugWorkflow(request: AIRequest): Promise<WorkflowDebugResult> {
    if (!request.context?.existingWorkflow) {
      throw new Error('Workflow required for debugging');
    }

    const workflow = request.context.existingWorkflow;

    const prompt = `Debug the following workflow and identify issues:

User problem: "${request.input}"

Workflow:
${JSON.stringify(workflow, null, 2)}

Analyze the workflow for:
1. Logic errors
2. Missing error handling
3. Invalid configurations
4. Performance issues
5. Best practice violations

Respond in JSON format:
{
  "issues": [
    {
      "severity": "error|warning|info",
      "type": "logic_error|config_error|performance|best_practice",
      "message": "Issue description",
      "location": { "actionId": "..." },
      "impact": "Impact description"
    }
  ],
  "fixes": [
    {
      "issueType": "...",
      "description": "Fix description",
      "automated": true,
      "steps": ["Step 1", "Step 2"]
    }
  ]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert workflow debugger and troubleshooter.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'workflow_debug',
      issues: result.issues || [],
      fixes: result.fixes || [],
    };
  }

  /**
   * Optimize workflow
   */
  private async optimizeWorkflow(request: AIRequest): Promise<WorkflowOptimizationResult> {
    if (!request.context?.existingWorkflow) {
      throw new Error('Workflow required for optimization');
    }

    const workflow = request.context.existingWorkflow;

    const prompt = `Analyze and optimize the following workflow:

${JSON.stringify(workflow, null, 2)}

Provide optimizations for:
1. Performance (execution speed)
2. Reliability (error handling, retries)
3. Cost (API calls, resource usage)
4. Best practices (code quality, maintainability)

Respond in JSON format:
{
  "optimizations": [
    {
      "type": "performance|reliability|cost|best_practice",
      "severity": "low|medium|high",
      "description": "What to optimize",
      "currentState": "Current implementation",
      "suggestedState": "Suggested implementation",
      "impact": "Expected improvement",
      "implementation": {
        "actions": ["Step 1", "Step 2"],
        "automated": true
      }
    }
  ],
  "estimatedImprovement": {
    "executionTime": 25,
    "reliability": 15,
    "cost": 10
  }
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert workflow optimization specialist.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'workflow_optimization',
      optimizations: result.optimizations || [],
      estimatedImprovement: result.estimatedImprovement || {},
    };
  }

  /**
   * Suggest workflow steps
   */
  private async suggestSteps(request: AIRequest): Promise<StepSuggestionResult> {
    const context = request.context?.existingWorkflow
      ? `\n\nCurrent workflow:\n${JSON.stringify(request.context.existingWorkflow, null, 2)}`
      : '';

    const prompt = `Suggest workflow steps for: "${request.input}"${context}

Available action types:
- send_email, send_notification, send_sms
- create_task, update_record, delete_record
- http_request (API calls)
- delay, condition, loop
- ai_analyze, trigger_workflow

Respond in JSON format:
{
  "suggestions": [
    {
      "action": {
        "id": "unique-id",
        "type": "action_type",
        "config": { ... }
      },
      "description": "What this step does",
      "rationale": "Why this step is needed",
      "placement": "before|after|replace"
    }
  ]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert workflow designer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'step_suggestion',
      suggestions: result.suggestions || [],
    };
  }

  /**
   * Find matching templates
   */
  private async findTemplates(request: AIRequest): Promise<TemplateRecommendationResult> {
    const allTemplates = await this.templateLibrary.searchTemplates({});

    const prompt = `Match the user's request to the best workflow templates:

User request: "${request.input}"

Available templates (${allTemplates.length} total):
${allTemplates
  .slice(0, 50)
  .map((t) => `- ${t.name}: ${t.description} (Category: ${t.category})`)
  .join('\n')}

Respond in JSON format with the top 5 matching templates:
{
  "matches": [
    {
      "templateId": "...",
      "relevanceScore": 0.95,
      "reason": "Why this template matches"
    }
  ]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at matching user needs to workflow templates.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    const recommendations = await Promise.all(
      (result.matches || []).map(async (match: any) => {
        const template = await this.templateLibrary.getTemplate(match.templateId);
        return {
          template: template!,
          relevanceScore: match.relevanceScore,
          reason: match.reason,
        };
      })
    );

    return {
      type: 'template_recommendation',
      templates: recommendations.filter((r) => r.template),
    };
  }

  /**
   * Generate conditions from natural language
   */
  private async generateConditions(request: AIRequest): Promise<ConditionGenerationResult> {
    const prompt = `Generate workflow conditions from this description:

"${request.input}"

Available operators:
- equals, not_equals
- contains
- greater_than, less_than
- in, not_in
- exists, not_exists

Available logical operators:
- and, or

Respond in JSON format:
{
  "conditions": [
    {
      "field": "fieldName",
      "operator": "equals",
      "value": "expectedValue",
      "logicalOperator": "and"
    }
  ],
  "explanation": "What these conditions check for"
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating workflow conditions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'condition_generation',
      conditions: result.conditions || [],
      explanation: result.explanation,
    };
  }

  /**
   * Suggest triggers
   */
  private async suggestTriggers(request: AIRequest): Promise<TriggerSuggestionResult> {
    const prompt = `Suggest workflow triggers for: "${request.input}"

Available trigger types:
1. event: Platform events (user.registered, goal.completed, session.started, etc.)
2. schedule: Cron-based scheduling (daily, weekly, monthly, custom)
3. webhook: External webhook triggers
4. manual: User-initiated triggers

Respond in JSON format:
{
  "triggers": [
    {
      "trigger": {
        "type": "event",
        "event": "user.registered"
      },
      "description": "Trigger description",
      "useCase": "When to use this trigger",
      "confidence": 0.95
    }
  ]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at selecting workflow triggers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      type: 'trigger_suggestion',
      triggers: result.triggers || [],
    };
  }

  /**
   * Analyze workflow complexity
   */
  async analyzeComplexity(workflow: WorkflowDefinition): Promise<{
    score: number; // 0-100
    level: 'simple' | 'moderate' | 'complex' | 'advanced';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
  }> {
    const factors = [];
    let score = 0;

    const actionCount = workflow.actions.length;
    factors.push({
      factor: 'Action Count',
      impact: Math.min(actionCount * 5, 30),
      description: `${actionCount} actions in workflow`,
    });
    score += Math.min(actionCount * 5, 30);

    const conditionCount = workflow.conditions.length;
    factors.push({
      factor: 'Conditions',
      impact: conditionCount * 10,
      description: `${conditionCount} conditional branches`,
    });
    score += conditionCount * 10;

    const hasLoops = workflow.actions.some((a) => a.type === 'loop');
    if (hasLoops) {
      factors.push({
        factor: 'Loops',
        impact: 15,
        description: 'Contains loop operations',
      });
      score += 15;
    }

    const hasNestedActions = workflow.actions.some(
      (a) => a.type === 'condition' || a.type === 'loop'
    );
    if (hasNestedActions) {
      factors.push({
        factor: 'Nesting',
        impact: 20,
        description: 'Contains nested logic',
      });
      score += 20;
    }

    let level: 'simple' | 'moderate' | 'complex' | 'advanced';
    if (score < 25) level = 'simple';
    else if (score < 50) level = 'moderate';
    else if (score < 75) level = 'complex';
    else level = 'advanced';

    const recommendations = [];
    if (actionCount > 10) {
      recommendations.push('Consider breaking into multiple workflows');
    }
    if (conditionCount > 5) {
      recommendations.push('Simplify conditional logic where possible');
    }
    if (score > 75) {
      recommendations.push('Add comprehensive error handling');
      recommendations.push('Implement detailed logging');
    }

    return {
      score,
      level,
      factors,
      recommendations,
    };
  }

  /**
   * Validate best practices
   */
  async validateBestPractices(workflow: WorkflowDefinition): Promise<{
    passed: boolean;
    score: number; // 0-100
    violations: Array<{
      practice: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      recommendation: string;
    }>;
  }> {
    const violations = [];
    let score = 100;

    if (!workflow.settings.logging) {
      violations.push({
        practice: 'Logging',
        severity: 'medium',
        message: 'Logging is disabled',
        recommendation: 'Enable logging for better debugging',
      });
      score -= 10;
    }

    if (workflow.settings.maxRetries < 3) {
      violations.push({
        practice: 'Retry Policy',
        severity: 'low',
        message: 'Low retry count',
        recommendation: 'Consider increasing retries to at least 3',
      });
      score -= 5;
    }

    if (!workflow.settings.notifications.onError) {
      violations.push({
        practice: 'Error Notifications',
        severity: 'high',
        message: 'Error notifications disabled',
        recommendation: 'Enable error notifications',
      });
      score -= 15;
    }

    const hasErrorHandling = workflow.actions.some((a) => a.continueOnError !== undefined);
    if (!hasErrorHandling) {
      violations.push({
        practice: 'Error Handling',
        severity: 'high',
        message: 'No explicit error handling',
        recommendation: 'Add error handling to critical actions',
      });
      score -= 20;
    }

    const longRunningActions = workflow.actions.filter((a) => !a.timeout);
    if (longRunningActions.length > 0) {
      violations.push({
        practice: 'Timeouts',
        severity: 'medium',
        message: 'Actions without timeouts',
        recommendation: 'Add timeouts to prevent hanging',
      });
      score -= 10;
    }

    return {
      passed: violations.length === 0,
      score: Math.max(score, 0),
      violations,
    };
  }

  /**
   * Extract variables from natural language
   */
  async extractVariables(text: string): Promise<Array<{
    key: string;
    type: string;
    description: string;
    example?: string;
  }>> {
    const prompt = `Extract workflow variables from this text:

"${text}"

Identify variables that should be configurable.

Respond in JSON format:
{
  "variables": [
    {
      "key": "variableName",
      "type": "string|number|boolean|email|url",
      "description": "What this variable is for",
      "example": "example value"
    }
  ]
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying workflow variables.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result.variables || [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AIWorkflowAssistant;
