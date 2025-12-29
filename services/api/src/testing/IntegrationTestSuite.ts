import { EventEmitter } from 'events';
import axios from 'axios';
import { UserService } from '../services/core/UserService';
import { GoalService } from '../services/goals/GoalService';
import { HabitService } from '../services/habits/HabitService';
import { CoachingService } from '../services/coaching/CoachingService';
import { AICoachingAssistant } from '../ai/coaching/AICoachingAssistant';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedOutcome: string;
  priority: TestPriority;
  category: TestCategory;
}

export interface TestStep {
  action: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload?: any;
  assertions: Assertion[];
  timeout?: number;
}

export interface Assertion {
  type: 'status' | 'body' | 'headers' | 'performance' | 'database';
  field?: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'matches';
  expected: any;
}

export enum TestPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TestCategory {
  USER_JOURNEY = 'user_journey',
  API = 'api',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  duration: number;
  stepResults: StepResult[];
  errors: TestError[];
  coverage: CoverageMetrics;
}

export interface StepResult {
  stepIndex: number;
  passed: boolean;
  duration: number;
  assertionResults: AssertionResult[];
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  actual: any;
  message?: string;
}

export interface TestError {
  step: number;
  error: string;
  stackTrace?: string;
}

export interface CoverageMetrics {
  endpoints: string[];
  models: string[];
  services: string[];
  coveragePercentage: number;
}

export interface TestSuiteConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  maxParallel: number;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Integration Test Suite
 *
 * Comprehensive end-to-end testing for all user journeys and system integrations.
 * Tests complete workflows from user registration to goal achievement.
 */
export class IntegrationTestSuite extends EventEmitter {
  private scenarios: Map<string, TestScenario> = new Map();
  private results: Map<string, TestResult> = new Map();
  private config: TestSuiteConfig;

  constructor(config: TestSuiteConfig) {
    super();
    this.config = config;
    this.initializeScenarios();
  }

  private initializeScenarios(): void {
    // Critical User Journeys
    this.registerScenario({
      id: 'user-onboarding-complete',
      name: 'Complete User Onboarding Journey',
      description: 'Tests entire user onboarding from registration to first goal creation',
      priority: TestPriority.CRITICAL,
      category: TestCategory.USER_JOURNEY,
      expectedOutcome: 'User successfully registered, profiled, and created first goal',
      steps: [
        {
          action: 'Register new user',
          endpoint: '/api/auth/register',
          method: 'POST',
          payload: {
            email: 'test@example.com',
            password: 'SecurePass123!',
            firstName: 'Test',
            lastName: 'User',
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 201 },
            { type: 'body', field: 'user.id', operator: 'exists', expected: true },
            { type: 'body', field: 'token', operator: 'exists', expected: true },
          ],
        },
        {
          action: 'Complete user profile',
          endpoint: '/api/users/profile',
          method: 'PUT',
          payload: {
            age: 30,
            timezone: 'America/New_York',
            coachingPreferences: {
              framework: 'GROW',
              personality: 'supportive',
              communicationStyle: 'detailed',
            },
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'profile.age', operator: 'equals', expected: 30 },
          ],
        },
        {
          action: 'Create first goal',
          endpoint: '/api/goals',
          method: 'POST',
          payload: {
            title: 'Run a 5K',
            category: 'fitness',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { title: 'Run 1 mile', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
              { title: 'Run 3 miles', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 201 },
            { type: 'body', field: 'goal.id', operator: 'exists', expected: true },
            { type: 'body', field: 'goal.milestones.length', operator: 'equals', expected: 2 },
          ],
        },
        {
          action: 'Get AI coaching recommendation',
          endpoint: '/api/ai/coaching/recommendations',
          method: 'POST',
          payload: {
            goalId: '{{goals[0].id}}',
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'recommendations.length', operator: 'greaterThan', expected: 0 },
            { type: 'performance', operator: 'lessThan', expected: 2000 }, // < 2s
          ],
        },
      ],
    });

    this.registerScenario({
      id: 'habit-tracking-flow',
      name: 'Complete Habit Tracking Flow',
      description: 'Tests habit creation, logging, and streak tracking',
      priority: TestPriority.CRITICAL,
      category: TestCategory.USER_JOURNEY,
      expectedOutcome: 'User successfully creates habit, logs entries, and maintains streak',
      steps: [
        {
          action: 'Create new habit',
          endpoint: '/api/habits',
          method: 'POST',
          payload: {
            name: 'Morning Meditation',
            frequency: 'daily',
            reminderTime: '07:00',
            category: 'wellness',
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 201 },
            { type: 'body', field: 'habit.id', operator: 'exists', expected: true },
          ],
        },
        {
          action: 'Log habit entry',
          endpoint: '/api/habits/{{habitId}}/entries',
          method: 'POST',
          payload: {
            completed: true,
            notes: 'Felt very focused today',
            duration: 600, // 10 minutes
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 201 },
            { type: 'body', field: 'entry.id', operator: 'exists', expected: true },
          ],
        },
        {
          action: 'Get habit statistics',
          endpoint: '/api/habits/{{habitId}}/stats',
          method: 'GET',
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'stats.currentStreak', operator: 'equals', expected: 1 },
            { type: 'body', field: 'stats.totalCompletions', operator: 'equals', expected: 1 },
          ],
        },
      ],
    });

    this.registerScenario({
      id: 'ai-coaching-conversation',
      name: 'AI Coaching Conversation Flow',
      description: 'Tests multi-turn AI coaching conversation with context retention',
      priority: TestPriority.HIGH,
      category: TestCategory.INTEGRATION,
      expectedOutcome: 'AI maintains context and provides relevant coaching across multiple turns',
      steps: [
        {
          action: 'Start coaching conversation',
          endpoint: '/api/ai/coaching/chat',
          method: 'POST',
          payload: {
            message: "I'm struggling to stay motivated with my fitness goals",
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'response', operator: 'exists', expected: true },
            { type: 'body', field: 'conversationId', operator: 'exists', expected: true },
            { type: 'performance', operator: 'lessThan', expected: 3000 },
          ],
        },
        {
          action: 'Continue conversation',
          endpoint: '/api/ai/coaching/chat',
          method: 'POST',
          payload: {
            conversationId: '{{conversationId}}',
            message: "What specific steps can I take this week?",
          },
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'response', operator: 'contains', expected: 'week' },
            { type: 'body', field: 'actionItems', operator: 'exists', expected: true },
          ],
        },
        {
          action: 'Get conversation summary',
          endpoint: '/api/ai/coaching/conversations/{{conversationId}}/summary',
          method: 'GET',
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'body', field: 'summary.keyInsights', operator: 'exists', expected: true },
            { type: 'body', field: 'summary.actionItems.length', operator: 'greaterThan', expected: 0 },
          ],
        },
      ],
    });

    // Performance Tests
    this.registerScenario({
      id: 'concurrent-user-load',
      name: 'Concurrent User Load Test',
      description: 'Tests system performance under concurrent user load',
      priority: TestPriority.HIGH,
      category: TestCategory.PERFORMANCE,
      expectedOutcome: 'System handles 100 concurrent users with acceptable response times',
      steps: [
        {
          action: 'Simulate 100 concurrent requests',
          endpoint: '/api/goals',
          method: 'GET',
          assertions: [
            { type: 'status', operator: 'equals', expected: 200 },
            { type: 'performance', operator: 'lessThan', expected: 500 }, // < 500ms
          ],
        },
      ],
    });

    // Security Tests
    this.registerScenario({
      id: 'auth-security-validation',
      name: 'Authentication Security Validation',
      description: 'Tests authentication security measures',
      priority: TestPriority.CRITICAL,
      category: TestCategory.SECURITY,
      expectedOutcome: 'All protected endpoints require valid authentication',
      steps: [
        {
          action: 'Access protected endpoint without token',
          endpoint: '/api/users/profile',
          method: 'GET',
          assertions: [
            { type: 'status', operator: 'equals', expected: 401 },
          ],
        },
        {
          action: 'Access with invalid token',
          endpoint: '/api/users/profile',
          method: 'GET',
          assertions: [
            { type: 'status', operator: 'equals', expected: 401 },
          ],
        },
      ],
    });
  }

  public registerScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.id, scenario);
    this.emit('scenario:registered', scenario);
  }

  public async runScenario(scenarioId: string): Promise<TestResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    this.emit('scenario:start', scenario);
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const errors: TestError[] = [];

    try {
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepResult = await this.executeStep(step, i);
        stepResults.push(stepResult);

        if (!stepResult.passed) {
          errors.push({
            step: i,
            error: `Step ${i + 1} failed: ${step.action}`,
          });
          break; // Stop on first failure
        }
      }
    } catch (error: any) {
      errors.push({
        step: stepResults.length,
        error: error.message,
        stackTrace: error.stack,
      });
    }

    const duration = Date.now() - startTime;
    const passed = errors.length === 0 && stepResults.every(r => r.passed);

    const result: TestResult = {
      scenarioId,
      passed,
      duration,
      stepResults,
      errors,
      coverage: this.calculateCoverage(scenario),
    };

    this.results.set(scenarioId, result);
    this.emit('scenario:complete', result);

    return result;
  }

  private async executeStep(step: TestStep, stepIndex: number): Promise<StepResult> {
    this.emit('step:start', { step, stepIndex });
    const startTime = Date.now();
    const assertionResults: AssertionResult[] = [];

    try {
      if (step.endpoint && step.method) {
        const response = await this.makeRequest(step);

        for (const assertion of step.assertions) {
          const result = await this.evaluateAssertion(assertion, response);
          assertionResults.push(result);
        }
      }
    } catch (error: any) {
      assertionResults.push({
        assertion: step.assertions[0],
        passed: false,
        actual: error.message,
        message: `Request failed: ${error.message}`,
      });
    }

    const duration = Date.now() - startTime;
    const passed = assertionResults.every(r => r.passed);

    return {
      stepIndex,
      passed,
      duration,
      assertionResults,
    };
  }

  private async makeRequest(step: TestStep): Promise<any> {
    const url = `${this.config.baseUrl}${step.endpoint}`;
    const config: any = {
      method: step.method,
      url,
      timeout: step.timeout || this.config.timeout,
    };

    if (step.payload) {
      config.data = step.payload;
    }

    return await axios(config);
  }

  private async evaluateAssertion(assertion: Assertion, response: any): Promise<AssertionResult> {
    let actual: any;
    let passed = false;

    switch (assertion.type) {
      case 'status':
        actual = response.status;
        passed = this.compareValues(actual, assertion.expected, assertion.operator);
        break;

      case 'body':
        actual = assertion.field ? this.getNestedValue(response.data, assertion.field) : response.data;
        passed = this.compareValues(actual, assertion.expected, assertion.operator);
        break;

      case 'headers':
        actual = assertion.field ? response.headers[assertion.field] : response.headers;
        passed = this.compareValues(actual, assertion.expected, assertion.operator);
        break;

      case 'performance':
        actual = response.duration || 0;
        passed = this.compareValues(actual, assertion.expected, assertion.operator);
        break;
    }

    return {
      assertion,
      passed,
      actual,
      message: passed ? 'Assertion passed' : `Expected ${assertion.expected}, got ${actual}`,
    };
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'greaterThan':
        return actual > expected;
      case 'lessThan':
        return actual < expected;
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'matches':
        return new RegExp(expected).test(String(actual));
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private calculateCoverage(scenario: TestScenario): CoverageMetrics {
    const endpoints = scenario.steps
      .filter(s => s.endpoint)
      .map(s => s.endpoint!);

    return {
      endpoints,
      models: [],
      services: [],
      coveragePercentage: 0,
    };
  }

  public async runAll(): Promise<Map<string, TestResult>> {
    this.emit('suite:start', { totalScenarios: this.scenarios.size });

    for (const [scenarioId] of this.scenarios) {
      await this.runScenario(scenarioId);
    }

    this.emit('suite:complete', this.results);
    return this.results;
  }

  public async runByPriority(priority: TestPriority): Promise<Map<string, TestResult>> {
    const scenariosToRun = Array.from(this.scenarios.values())
      .filter(s => s.priority === priority);

    const results = new Map<string, TestResult>();

    for (const scenario of scenariosToRun) {
      const result = await this.runScenario(scenario.id);
      results.set(scenario.id, result);
    }

    return results;
  }

  public getResults(): Map<string, TestResult> {
    return this.results;
  }

  public getSummary(): {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    passRate: number;
  } {
    const total = this.results.size;
    const passed = Array.from(this.results.values()).filter(r => r.passed).length;
    const failed = total - passed;
    const duration = Array.from(this.results.values()).reduce((sum, r) => sum + r.duration, 0);
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, duration, passRate };
  }
}

export default IntegrationTestSuite;
