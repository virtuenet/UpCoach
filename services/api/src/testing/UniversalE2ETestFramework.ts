import { WebDriver, Builder, By, until, WebElement } from 'selenium-webdriver';
import { Browser, Page, ElementHandle } from '@playwright/test';
import { faker } from '@faker-js/faker';
import axios from 'axios';

/**
 * Universal E2E Test Framework
 * Provides a platform-agnostic DSL for writing tests that run across web, mobile, and desktop
 */

// ==================== Types & Interfaces ====================

export enum UniversalPlatform {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
}

export enum UniversalAction {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  TYPE = 'type',
  CLEAR = 'clear',
  SELECT = 'select',
  SCROLL = 'scroll',
  SWIPE = 'swipe',
  DRAG = 'drag',
  WAIT = 'wait',
  ASSERT = 'assert',
  SCREENSHOT = 'screenshot',
  SET_STATE = 'setState',
  GET_STATE = 'getState',
  API_CALL = 'apiCall',
}

export interface UniversalTestStep {
  action: UniversalAction;
  selector?: UniversalSelector;
  value?: any;
  condition?: UniversalCondition;
  assertion?: UniversalAssertion;
  options?: StepOptions;
  metadata?: Record<string, any>;
}

export interface UniversalSelector {
  type: 'id' | 'class' | 'xpath' | 'css' | 'text' | 'accessibility' | 'image' | 'coordinate';
  value: string | { x: number; y: number };
  platformOverrides?: Map<UniversalPlatform, UniversalSelector>;
}

export interface UniversalCondition {
  type: 'visible' | 'enabled' | 'selected' | 'value' | 'count' | 'exists';
  timeout?: number;
  expected?: any;
}

export interface UniversalAssertion {
  type: 'equals' | 'contains' | 'matches' | 'exists' | 'visible' | 'enabled' | 'count' | 'custom';
  expected?: any;
  customValidator?: (actual: any) => boolean;
  message?: string;
}

export interface StepOptions {
  timeout?: number;
  retry?: number;
  screenshot?: boolean;
  waitBefore?: number;
  waitAfter?: number;
  continueOnError?: boolean;
}

export interface UniversalTest {
  id: string;
  name: string;
  description: string;
  platforms: UniversalPlatform[];
  steps: UniversalTestStep[];
  setup?: UniversalTestStep[];
  teardown?: UniversalTestStep[];
  tags: string[];
  dependencies?: string[];
  priority: number;
  timeout: number;
  dataProvider?: DataProvider;
}

export interface DataProvider {
  type: 'inline' | 'file' | 'api' | 'generated';
  source: any;
  generator?: () => any[];
}

export interface TestExecutionContext {
  platform: UniversalPlatform;
  driver?: WebDriver;
  page?: Page;
  state: Map<string, any>;
  screenshots: string[];
  logs: string[];
  startTime: Date;
  testData?: any;
}

export interface UniversalTestResult {
  testId: string;
  platform: UniversalPlatform;
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;
  steps: StepResult[];
  error?: Error;
  flakiness: FlakinessMetrics;
  screenshots: string[];
  logs: string[];
}

export interface StepResult {
  step: UniversalTestStep;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
  screenshot?: string;
}

export interface FlakinessMetrics {
  totalRuns: number;
  failures: number;
  consecutiveFailures: number;
  flakinessScore: number;
  lastFailureTime?: Date;
  failurePattern: number[];
}

export interface MockServiceConfig {
  type: 'api' | 'database' | 'external';
  baseUrl?: string;
  routes?: MockRoute[];
  database?: MockDatabase;
}

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: any;
  statusCode?: number;
  delay?: number;
  condition?: (request: any) => boolean;
}

export interface MockDatabase {
  tables: Map<string, any[]>;
  schema?: Record<string, any>;
}

export interface TestDependencyGraph {
  nodes: Map<string, TestNode>;
  edges: Map<string, string[]>;
  sorted: string[];
}

export interface TestNode {
  testId: string;
  dependencies: string[];
  dependents: string[];
  level: number;
}

// ==================== Platform Adapters ====================

abstract class PlatformAdapter {
  abstract initialize(config: any): Promise<void>;
  abstract executeStep(step: UniversalTestStep, context: TestExecutionContext): Promise<void>;
  abstract cleanup(): Promise<void>;
  abstract captureScreenshot(name: string): Promise<string>;
}

class PlaywrightAdapter extends PlatformAdapter {
  private page?: Page;
  private browser?: Browser;

  async initialize(config: any): Promise<void> {
    const { chromium } = await import('@playwright/test');
    this.browser = await chromium.launch({ headless: config.headless !== false });
    this.page = await this.browser.newPage();
  }

  async executeStep(step: UniversalTestStep, context: TestExecutionContext): Promise<void> {
    if (!this.page) throw new Error('Playwright page not initialized');

    switch (step.action) {
      case UniversalAction.NAVIGATE:
        await this.page.goto(step.value as string);
        break;
      case UniversalAction.CLICK:
        if (step.selector) {
          const element = await this.findElement(step.selector);
          await element.click();
        }
        break;
      case UniversalAction.TYPE:
        if (step.selector && step.value) {
          const element = await this.findElement(step.selector);
          await element.fill(step.value as string);
        }
        break;
      case UniversalAction.CLEAR:
        if (step.selector) {
          const element = await this.findElement(step.selector);
          await element.clear();
        }
        break;
      case UniversalAction.WAIT:
        if (step.condition) {
          await this.waitForCondition(step.condition);
        }
        break;
      case UniversalAction.ASSERT:
        if (step.assertion && step.selector) {
          await this.executeAssertion(step.selector, step.assertion);
        }
        break;
      case UniversalAction.SCREENSHOT:
        const screenshot = await this.page.screenshot({ fullPage: true });
        context.screenshots.push(screenshot.toString('base64'));
        break;
      case UniversalAction.SCROLL:
        await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
        break;
    }
  }

  private async findElement(selector: UniversalSelector): Promise<ElementHandle> {
    if (!this.page) throw new Error('Page not initialized');

    switch (selector.type) {
      case 'id':
        return (await this.page.$(`#${selector.value}`))!;
      case 'class':
        return (await this.page.$(`.${selector.value}`))!;
      case 'css':
        return (await this.page.$(selector.value as string))!;
      case 'xpath':
        return (await this.page.$(`xpath=${selector.value}`))!;
      case 'text':
        return (await this.page.$(`text=${selector.value}`))!;
      default:
        throw new Error(`Unsupported selector type: ${selector.type}`);
    }
  }

  private async waitForCondition(condition: UniversalCondition): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const timeout = condition.timeout || 30000;

    switch (condition.type) {
      case 'visible':
        await this.page.waitForTimeout(timeout);
        break;
    }
  }

  private async executeAssertion(selector: UniversalSelector, assertion: UniversalAssertion): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const element = await this.findElement(selector);

    switch (assertion.type) {
      case 'visible':
        const isVisible = await element.isVisible();
        if (!isVisible) {
          throw new Error(assertion.message || 'Element is not visible');
        }
        break;
      case 'equals':
        const text = await element.textContent();
        if (text !== assertion.expected) {
          throw new Error(
            assertion.message || `Expected "${assertion.expected}", got "${text}"`
          );
        }
        break;
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async captureScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshot = await this.page.screenshot({ fullPage: true });
    return screenshot.toString('base64');
  }
}

class AppiumAdapter extends PlatformAdapter {
  private driver?: WebDriver;
  private platform: 'android' | 'ios';

  constructor(platform: 'android' | 'ios') {
    super();
    this.platform = platform;
  }

  async initialize(config: any): Promise<void> {
    const capabilities: any = {
      platformName: this.platform === 'android' ? 'Android' : 'iOS',
      deviceName: config.deviceName || 'emulator',
      app: config.appPath,
      automationName: this.platform === 'android' ? 'UiAutomator2' : 'XCUITest',
    };

    this.driver = await new Builder()
      .usingServer(config.hubUrl || 'http://localhost:4723/wd/hub')
      .withCapabilities(capabilities)
      .build();
  }

  async executeStep(step: UniversalTestStep, context: TestExecutionContext): Promise<void> {
    if (!this.driver) throw new Error('Appium driver not initialized');

    switch (step.action) {
      case UniversalAction.CLICK:
        if (step.selector) {
          const element = await this.findElement(step.selector);
          await element.click();
        }
        break;
      case UniversalAction.TYPE:
        if (step.selector && step.value) {
          const element = await this.findElement(step.selector);
          await element.sendKeys(step.value as string);
        }
        break;
      case UniversalAction.CLEAR:
        if (step.selector) {
          const element = await this.findElement(step.selector);
          await element.clear();
        }
        break;
      case UniversalAction.SWIPE:
        if (step.value) {
          const { startX, startY, endX, endY } = step.value;
          await this.driver.executeScript('mobile: swipe', {
            startX,
            startY,
            endX,
            endY,
          });
        }
        break;
      case UniversalAction.WAIT:
        if (step.condition) {
          await this.waitForCondition(step.condition);
        }
        break;
    }
  }

  private async findElement(selector: UniversalSelector): Promise<WebElement> {
    if (!this.driver) throw new Error('Driver not initialized');

    switch (selector.type) {
      case 'id':
        return await this.driver.findElement(By.id(selector.value as string));
      case 'xpath':
        return await this.driver.findElement(By.xpath(selector.value as string));
      case 'accessibility':
        return await this.driver.findElement(
          By.xpath(`//*[@content-desc="${selector.value}"]`)
        );
      case 'class':
        return await this.driver.findElement(By.className(selector.value as string));
      default:
        throw new Error(`Unsupported selector type: ${selector.type}`);
    }
  }

  private async waitForCondition(condition: UniversalCondition): Promise<void> {
    if (!this.driver) throw new Error('Driver not initialized');

    const timeout = condition.timeout || 30000;
    await this.driver.manage().setTimeouts({ implicit: timeout });
  }

  async cleanup(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  async captureScreenshot(name: string): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');

    const screenshot = await this.driver.takeScreenshot();
    return screenshot;
  }
}

// ==================== Test State Management ====================

class SharedTestState {
  private globalState: Map<string, any>;
  private platformStates: Map<UniversalPlatform, Map<string, any>>;
  private syncQueue: StateUpdate[];

  constructor() {
    this.globalState = new Map();
    this.platformStates = new Map();
    this.syncQueue = [];
  }

  setState(key: string, value: any, platform?: UniversalPlatform): void {
    if (platform) {
      let platformState = this.platformStates.get(platform);
      if (!platformState) {
        platformState = new Map();
        this.platformStates.set(platform, platformState);
      }
      platformState.set(key, value);

      this.syncQueue.push({
        key,
        value,
        platform,
        timestamp: new Date(),
      });
    } else {
      this.globalState.set(key, value);
    }
  }

  getState(key: string, platform?: UniversalPlatform): any {
    if (platform) {
      const platformState = this.platformStates.get(platform);
      return platformState?.get(key) ?? this.globalState.get(key);
    }
    return this.globalState.get(key);
  }

  syncState(sourcePlatform: UniversalPlatform, targetPlatform: UniversalPlatform): void {
    const sourceState = this.platformStates.get(sourcePlatform);
    if (!sourceState) return;

    let targetState = this.platformStates.get(targetPlatform);
    if (!targetState) {
      targetState = new Map();
      this.platformStates.set(targetPlatform, targetState);
    }

    for (const [key, value] of sourceState) {
      targetState.set(key, value);
    }
  }

  clearState(platform?: UniversalPlatform): void {
    if (platform) {
      this.platformStates.delete(platform);
    } else {
      this.globalState.clear();
      this.platformStates.clear();
    }
  }
}

interface StateUpdate {
  key: string;
  value: any;
  platform: UniversalPlatform;
  timestamp: Date;
}

// ==================== Mock Service Manager ====================

class MockServiceManager {
  private mockServers: Map<string, any>;
  private mockDatabase: MockDatabase;
  private activeRoutes: Map<string, MockRoute[]>;

  constructor() {
    this.mockServers = new Map();
    this.mockDatabase = { tables: new Map() };
    this.activeRoutes = new Map();
  }

  registerMockAPI(name: string, config: MockServiceConfig): void {
    if (config.routes) {
      this.activeRoutes.set(name, config.routes);
    }

    if (config.database) {
      this.mockDatabase = config.database;
    }
  }

  async handleRequest(
    serviceName: string,
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const routes = this.activeRoutes.get(serviceName);
    if (!routes) {
      throw new Error(`Mock service ${serviceName} not found`);
    }

    const route = routes.find(r => r.method === method && this.matchPath(r.path, path));
    if (!route) {
      return { status: 404, body: { error: 'Route not found' } };
    }

    if (route.condition && !route.condition({ method, path, body })) {
      return { status: 400, body: { error: 'Condition not met' } };
    }

    if (route.delay) {
      await new Promise(resolve => setTimeout(resolve, route.delay));
    }

    return {
      status: route.statusCode || 200,
      body: typeof route.response === 'function' ? route.response({ method, path, body }) : route.response,
    };
  }

  private matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue;
      if (patternParts[i] !== pathParts[i]) return false;
    }

    return true;
  }

  queryDatabase(table: string, filter?: (row: any) => boolean): any[] {
    const tableData = this.mockDatabase.tables.get(table);
    if (!tableData) return [];

    return filter ? tableData.filter(filter) : tableData;
  }

  insertDatabase(table: string, data: any): void {
    let tableData = this.mockDatabase.tables.get(table);
    if (!tableData) {
      tableData = [];
      this.mockDatabase.tables.set(table, tableData);
    }

    tableData.push(data);
  }

  clearDatabase(table?: string): void {
    if (table) {
      this.mockDatabase.tables.delete(table);
    } else {
      this.mockDatabase.tables.clear();
    }
  }
}

// ==================== Test Data Generator ====================

class TestDataGenerator {
  generateUserData(): any {
    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: faker.date.past(),
    };
  }

  generateProductData(): any {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      category: faker.commerce.department(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      inStock: faker.datatype.boolean(),
      quantity: faker.number.int({ min: 0, max: 1000 }),
    };
  }

  generateOrderData(): any {
    return {
      id: faker.string.uuid(),
      customerId: faker.string.uuid(),
      items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        productId: faker.string.uuid(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        price: parseFloat(faker.commerce.price()),
      })),
      total: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
      createdAt: faker.date.recent(),
    };
  }

  generateCustomData(schema: Record<string, string>): any {
    const data: any = {};

    for (const [key, type] of Object.entries(schema)) {
      switch (type) {
        case 'uuid':
          data[key] = faker.string.uuid();
          break;
        case 'email':
          data[key] = faker.internet.email();
          break;
        case 'name':
          data[key] = faker.person.fullName();
          break;
        case 'number':
          data[key] = faker.number.int({ min: 1, max: 1000 });
          break;
        case 'date':
          data[key] = faker.date.recent();
          break;
        case 'boolean':
          data[key] = faker.datatype.boolean();
          break;
        default:
          data[key] = faker.lorem.word();
      }
    }

    return data;
  }
}

// ==================== Flaky Test Detection ====================

class FlakyTestDetector {
  private testHistory: Map<string, TestRun[]>;
  private smoothingFactor: number;

  constructor(smoothingFactor = 0.3) {
    this.testHistory = new Map();
    this.smoothingFactor = smoothingFactor;
  }

  recordTestRun(testId: string, platform: UniversalPlatform, passed: boolean): void {
    const key = `${testId}-${platform}`;
    const history = this.testHistory.get(key) || [];

    history.push({
      timestamp: new Date(),
      passed,
    });

    if (history.length > 100) {
      history.shift();
    }

    this.testHistory.set(key, history);
  }

  calculateFlakiness(testId: string, platform: UniversalPlatform): FlakinessMetrics {
    const key = `${testId}-${platform}`;
    const history = this.testHistory.get(key) || [];

    if (history.length === 0) {
      return {
        totalRuns: 0,
        failures: 0,
        consecutiveFailures: 0,
        flakinessScore: 0,
        failurePattern: [],
      };
    }

    const totalRuns = history.length;
    const failures = history.filter(r => !r.passed).length;
    const consecutiveFailures = this.countConsecutiveFailures(history);
    const failurePattern = this.calculateFailurePattern(history);
    const flakinessScore = this.calculateExponentialSmoothing(history);

    const lastFailure = history.slice().reverse().find(r => !r.passed);

    return {
      totalRuns,
      failures,
      consecutiveFailures,
      flakinessScore,
      lastFailureTime: lastFailure?.timestamp,
      failurePattern,
    };
  }

  private countConsecutiveFailures(history: TestRun[]): number {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (!history[i].passed) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private calculateFailurePattern(history: TestRun[]): number[] {
    return history.slice(-10).map(r => (r.passed ? 0 : 1));
  }

  private calculateExponentialSmoothing(history: TestRun[]): number {
    let smoothed = 0;

    for (let i = 0; i < history.length; i++) {
      const value = history[i].passed ? 0 : 1;
      smoothed = this.smoothingFactor * value + (1 - this.smoothingFactor) * smoothed;
    }

    return smoothed * 100;
  }

  isFlaky(testId: string, platform: UniversalPlatform, threshold = 20): boolean {
    const metrics = this.calculateFlakiness(testId, platform);
    return metrics.flakinessScore > threshold;
  }
}

interface TestRun {
  timestamp: Date;
  passed: boolean;
}

// ==================== Dependency Graph Manager ====================

class DependencyGraphManager {
  private graph: TestDependencyGraph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      sorted: [],
    };
  }

  addTest(testId: string, dependencies: string[] = []): void {
    const node: TestNode = {
      testId,
      dependencies,
      dependents: [],
      level: 0,
    };

    this.graph.nodes.set(testId, node);
    this.graph.edges.set(testId, dependencies);

    for (const depId of dependencies) {
      const depNode = this.graph.nodes.get(depId);
      if (depNode) {
        depNode.dependents.push(testId);
      }
    }
  }

  buildDependencyGraph(tests: UniversalTest[]): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      sorted: [],
    };

    for (const test of tests) {
      this.addTest(test.id, test.dependencies || []);
    }

    this.calculateLevels();
    this.topologicalSort();
  }

  private calculateLevels(): void {
    const visited = new Set<string>();
    const calculateLevel = (testId: string): number => {
      if (visited.has(testId)) {
        return this.graph.nodes.get(testId)!.level;
      }

      visited.add(testId);
      const node = this.graph.nodes.get(testId)!;
      const dependencies = this.graph.edges.get(testId) || [];

      if (dependencies.length === 0) {
        node.level = 0;
        return 0;
      }

      const maxDepLevel = Math.max(
        ...dependencies.map(depId => calculateLevel(depId))
      );

      node.level = maxDepLevel + 1;
      return node.level;
    };

    for (const testId of this.graph.nodes.keys()) {
      calculateLevel(testId);
    }
  }

  private topologicalSort(): void {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (testId: string) => {
      if (visited.has(testId)) return;

      visited.add(testId);
      const dependencies = this.graph.edges.get(testId) || [];

      for (const depId of dependencies) {
        visit(depId);
      }

      stack.push(testId);
    };

    for (const testId of this.graph.nodes.keys()) {
      visit(testId);
    }

    this.graph.sorted = stack;
  }

  getExecutionOrder(): string[] {
    return this.graph.sorted;
  }

  getParallelGroups(): string[][] {
    const groups: string[][] = [];
    const levels = new Map<number, string[]>();

    for (const [testId, node] of this.graph.nodes) {
      const levelTests = levels.get(node.level) || [];
      levelTests.push(testId);
      levels.set(node.level, levelTests);
    }

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    for (const level of sortedLevels) {
      groups.push(levels.get(level)!);
    }

    return groups;
  }

  hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (testId: string): boolean => {
      visited.add(testId);
      recursionStack.add(testId);

      const dependencies = this.graph.edges.get(testId) || [];
      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (detectCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(testId);
      return false;
    };

    for (const testId of this.graph.nodes.keys()) {
      if (!visited.has(testId)) {
        if (detectCycle(testId)) return true;
      }
    }

    return false;
  }
}

// ==================== Main Framework ====================

export class UniversalE2ETestFramework {
  private tests: Map<string, UniversalTest>;
  private adapters: Map<UniversalPlatform, PlatformAdapter>;
  private sharedState: SharedTestState;
  private mockManager: MockServiceManager;
  private dataGenerator: TestDataGenerator;
  private flakyDetector: FlakyTestDetector;
  private dependencyManager: DependencyGraphManager;
  private results: UniversalTestResult[];

  constructor() {
    this.tests = new Map();
    this.adapters = new Map();
    this.sharedState = new SharedTestState();
    this.mockManager = new MockServiceManager();
    this.dataGenerator = new TestDataGenerator();
    this.flakyDetector = new FlakyTestDetector();
    this.dependencyManager = new DependencyGraphManager();
    this.results = [];

    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    this.adapters.set(UniversalPlatform.WEB, new PlaywrightAdapter());
    this.adapters.set(UniversalPlatform.ANDROID, new AppiumAdapter('android'));
    this.adapters.set(UniversalPlatform.IOS, new AppiumAdapter('ios'));
  }

  registerTest(test: UniversalTest): void {
    this.tests.set(test.id, test);
    this.dependencyManager.addTest(test.id, test.dependencies);
  }

  registerMockService(name: string, config: MockServiceConfig): void {
    this.mockManager.registerMockAPI(name, config);
  }

  async executeTests(
    testIds: string[],
    platforms: UniversalPlatform[],
    options: {
      parallel?: boolean;
      respectDependencies?: boolean;
    } = {}
  ): Promise<UniversalTestResult[]> {
    const testsToRun = testIds.map(id => this.tests.get(id)).filter(t => t !== undefined) as UniversalTest[];

    if (options.respectDependencies) {
      this.dependencyManager.buildDependencyGraph(testsToRun);

      if (this.dependencyManager.hasCycle()) {
        throw new Error('Circular dependency detected in test suite');
      }

      const executionOrder = this.dependencyManager.getExecutionOrder();
      const orderedTests = executionOrder
        .map(id => this.tests.get(id))
        .filter(t => t !== undefined) as UniversalTest[];

      return await this.executeTestsInOrder(orderedTests, platforms, options.parallel);
    }

    return await this.executeTestsInOrder(testsToRun, platforms, options.parallel);
  }

  private async executeTestsInOrder(
    tests: UniversalTest[],
    platforms: UniversalPlatform[],
    parallel?: boolean
  ): Promise<UniversalTestResult[]> {
    const results: UniversalTestResult[] = [];

    if (parallel) {
      const parallelGroups = this.dependencyManager.getParallelGroups();

      for (const group of parallelGroups) {
        const groupTests = group
          .map(id => tests.find(t => t.id === id))
          .filter(t => t !== undefined) as UniversalTest[];

        const groupResults = await Promise.all(
          groupTests.flatMap(test =>
            platforms.map(platform => this.executeTest(test, platform))
          )
        );

        results.push(...groupResults);
      }
    } else {
      for (const test of tests) {
        for (const platform of platforms) {
          const result = await this.executeTest(test, platform);
          results.push(result);
        }
      }
    }

    this.results.push(...results);
    return results;
  }

  private async executeTest(test: UniversalTest, platform: UniversalPlatform): Promise<UniversalTestResult> {
    const context: TestExecutionContext = {
      platform,
      state: new Map(),
      screenshots: [],
      logs: [],
      startTime: new Date(),
    };

    const stepResults: StepResult[] = [];
    let status: 'passed' | 'failed' | 'skipped' | 'flaky' = 'passed';
    let error: Error | undefined;

    try {
      const adapter = this.adapters.get(platform);
      if (!adapter) {
        throw new Error(`No adapter found for platform: ${platform}`);
      }

      await adapter.initialize({});

      context.logs.push(`Starting test: ${test.name} on ${platform}`);

      if (test.setup) {
        for (const step of test.setup) {
          await this.executeStep(step, context, adapter);
        }
      }

      if (test.dataProvider) {
        context.testData = await this.generateTestData(test.dataProvider);
      }

      for (const step of test.steps) {
        const stepStartTime = Date.now();
        try {
          await this.executeStep(step, context, adapter);

          stepResults.push({
            step,
            status: 'passed',
            duration: Date.now() - stepStartTime,
          });
        } catch (stepError) {
          stepResults.push({
            step,
            status: 'failed',
            duration: Date.now() - stepStartTime,
            error: stepError as Error,
          });

          if (!step.options?.continueOnError) {
            throw stepError;
          }
        }
      }

      if (test.teardown) {
        for (const step of test.teardown) {
          await this.executeStep(step, context, adapter);
        }
      }

      await adapter.cleanup();
    } catch (err) {
      error = err as Error;
      status = 'failed';
      context.logs.push(`Test failed: ${error.message}`);
    }

    this.flakyDetector.recordTestRun(test.id, platform, status === 'passed');
    const flakinessMetrics = this.flakyDetector.calculateFlakiness(test.id, platform);

    if (this.flakyDetector.isFlaky(test.id, platform)) {
      status = 'flaky';
    }

    return {
      testId: test.id,
      platform,
      status,
      duration: Date.now() - context.startTime.getTime(),
      steps: stepResults,
      error,
      flakiness: flakinessMetrics,
      screenshots: context.screenshots,
      logs: context.logs,
    };
  }

  private async executeStep(
    step: UniversalTestStep,
    context: TestExecutionContext,
    adapter: PlatformAdapter
  ): Promise<void> {
    if (step.options?.waitBefore) {
      await new Promise(resolve => setTimeout(resolve, step.options!.waitBefore));
    }

    const effectiveStep = this.applyPlatformOverrides(step, context.platform);

    switch (effectiveStep.action) {
      case UniversalAction.SET_STATE:
        if (effectiveStep.selector && effectiveStep.value) {
          this.sharedState.setState(
            effectiveStep.selector.value as string,
            effectiveStep.value,
            context.platform
          );
        }
        break;
      case UniversalAction.GET_STATE:
        if (effectiveStep.selector) {
          const value = this.sharedState.getState(
            effectiveStep.selector.value as string,
            context.platform
          );
          context.state.set(effectiveStep.selector.value as string, value);
        }
        break;
      case UniversalAction.API_CALL:
        if (effectiveStep.value) {
          const { service, method, path, body } = effectiveStep.value;
          const response = await this.mockManager.handleRequest(service, method, path, body);
          context.state.set('apiResponse', response);
        }
        break;
      default:
        await adapter.executeStep(effectiveStep, context);
    }

    if (step.options?.screenshot) {
      const screenshot = await adapter.captureScreenshot(`step-${Date.now()}`);
      context.screenshots.push(screenshot);
    }

    if (step.options?.waitAfter) {
      await new Promise(resolve => setTimeout(resolve, step.options!.waitAfter));
    }
  }

  private applyPlatformOverrides(step: UniversalTestStep, platform: UniversalPlatform): UniversalTestStep {
    if (step.selector?.platformOverrides) {
      const override = step.selector.platformOverrides.get(platform);
      if (override) {
        return {
          ...step,
          selector: override,
        };
      }
    }

    return step;
  }

  private async generateTestData(provider: DataProvider): Promise<any> {
    switch (provider.type) {
      case 'inline':
        return provider.source;
      case 'generated':
        return provider.generator ? provider.generator() : [];
      case 'api':
        const response = await axios.get(provider.source);
        return response.data;
      default:
        return {};
    }
  }

  getTestResults(): UniversalTestResult[] {
    return this.results;
  }

  getFlakyTests(threshold = 20): Array<{ testId: string; platform: UniversalPlatform; metrics: FlakinessMetrics }> {
    const flakyTests: Array<{ testId: string; platform: UniversalPlatform; metrics: FlakinessMetrics }> = [];

    for (const test of this.tests.values()) {
      for (const platform of test.platforms) {
        if (this.flakyDetector.isFlaky(test.id, platform, threshold)) {
          const metrics = this.flakyDetector.calculateFlakiness(test.id, platform);
          flakyTests.push({ testId: test.id, platform, metrics });
        }
      }
    }

    return flakyTests;
  }

  getTestDataGenerator(): TestDataGenerator {
    return this.dataGenerator;
  }

  clearResults(): void {
    this.results = [];
  }
}
