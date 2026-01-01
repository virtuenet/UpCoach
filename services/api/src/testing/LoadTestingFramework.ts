/**
 * LoadTestingFramework.ts
 * Performance and load testing framework
 *
 * Features:
 * - Load test scenario builder (fluent API)
 * - Virtual user simulation
 * - Ramp-up configuration (linear, exponential, step)
 * - Think time simulation (fixed, random, gaussian)
 * - Request profiling
 * - Response time tracking
 * - Throughput measurement
 * - Error rate tracking
 * - Percentile calculations (p50, p90, p95, p99, p99.9)
 * - Concurrent user simulation
 * - Stress testing
 * - Spike testing
 * - Soak testing
 * - Scalability testing
 * - Report generation (HTML, JSON, CSV)
 */

import autocannon, { Result as AutocannonResult } from 'autocannon';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import EventEmitter from 'events';
import Handlebars from 'handlebars';

// Types
interface RampUpConfig {
  duration: string | number;
  type: 'linear' | 'exponential' | 'step';
  steps?: number;
}

interface ThinkTimeConfig {
  min: number;
  max?: number;
  distribution?: 'fixed' | 'random' | 'gaussian';
  variance?: number;
}

interface StepConfig {
  name: string;
  handler: (client: TestClient, context: StepContext) => Promise<any>;
  thinkTime?: ThinkTimeConfig;
}

interface StepContext {
  [key: string]: any;
}

interface LoadTestConfig {
  virtualUsers: number;
  rampUp?: RampUpConfig;
  duration: string | number;
  repeat?: number;
  warmup?: string | number;
  reportFormat?: 'html' | 'json' | 'csv';
  outputPath?: string;
}

interface LoadTestResult {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalDuration: number;
    throughput: number;
    errorRate: number;
    successRate: number;
  };
  responseTime: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p90: number;
    p95: number;
    p99: number;
    p999: number;
  };
  errors: Array<{
    type: string;
    message: string;
    count: number;
  }>;
  statusCodes: { [code: number]: number };
  dataTransferred: {
    bytes: number;
    kb: number;
    mb: number;
  };
  timestamp: Date;
}

interface RequestMetrics {
  url: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  error?: string;
  size: number;
}

// Test Client
class TestClient {
  private axios: AxiosInstance;
  private baseURL: string;
  private headers: { [key: string]: string };

  constructor(baseURL: string, headers: { [key: string]: string } = {}) {
    this.baseURL = baseURL;
    this.headers = headers;
    this.axios = axios.create({
      baseURL,
      headers,
      timeout: 30000,
    });
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.axios.get(url, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.axios.post(url, data, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.axios.put(url, data, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.axios.patch(url, data, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.axios.delete(url, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
    this.axios.defaults.headers.common[key] = value;
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

// Load Test Scenario
class LoadTestScenario extends EventEmitter {
  private name: string;
  private steps: StepConfig[] = [];
  private config: Partial<LoadTestConfig> = {};
  private baseURL: string = 'http://localhost:3000';
  private headers: { [key: string]: string } = {};

  constructor(name: string) {
    super();
    this.name = name;
  }

  setBaseURL(url: string): this {
    this.baseURL = url;
    return this;
  }

  setHeaders(headers: { [key: string]: string }): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  addVirtualUsers(count: number): this {
    this.config.virtualUsers = count;
    return this;
  }

  rampUp(config: RampUpConfig): this {
    this.config.rampUp = config;
    return this;
  }

  duration(duration: string | number): this {
    this.config.duration = duration;
    return this;
  }

  repeat(count: number): this {
    this.config.repeat = count;
    return this;
  }

  warmup(duration: string | number): this {
    this.config.warmup = duration;
    return this;
  }

  step(
    name: string,
    handler: (client: TestClient, context: StepContext) => Promise<any>
  ): this {
    this.steps.push({ name, handler });
    return this;
  }

  thinkTime(min: number, config?: Partial<ThinkTimeConfig>): this {
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      lastStep.thinkTime = {
        min,
        max: config?.max,
        distribution: config?.distribution || 'fixed',
        variance: config?.variance,
      };
    }
    return this;
  }

  async execute(): Promise<LoadTestResult> {
    const metrics: RequestMetrics[] = [];
    const errors: Map<string, number> = new Map();
    const statusCodes: Map<number, number> = new Map();
    let totalBytes = 0;

    const virtualUsers = this.config.virtualUsers || 1;
    const repeatCount = this.config.repeat || 1;
    const startTime = performance.now();

    this.emit('start', { virtualUsers, scenario: this.name });

    // Warmup phase
    if (this.config.warmup) {
      await this.executeWarmup();
    }

    // Execute virtual users
    const userPromises: Promise<void>[] = [];

    for (let i = 0; i < virtualUsers; i++) {
      const rampDelay = this.calculateRampDelay(i, virtualUsers);
      userPromises.push(this.executeVirtualUser(i, repeatCount, metrics, errors, statusCodes, rampDelay));
    }

    await Promise.all(userPromises);

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000;

    // Calculate metrics
    const result = this.calculateMetrics(metrics, errors, statusCodes, totalBytes, totalDuration);

    this.emit('complete', result);

    return result;
  }

  private async executeWarmup(): Promise<void> {
    const warmupDuration = this.parseDuration(this.config.warmup!);
    const warmupEndTime = Date.now() + warmupDuration;

    this.emit('warmup:start', { duration: warmupDuration });

    while (Date.now() < warmupEndTime) {
      const client = new TestClient(this.baseURL, this.headers);
      const context: StepContext = {};

      for (const step of this.steps) {
        try {
          await step.handler(client, context);
        } catch (error) {
          // Ignore warmup errors
        }
      }
    }

    this.emit('warmup:complete');
  }

  private async executeVirtualUser(
    userId: number,
    repeatCount: number,
    metrics: RequestMetrics[],
    errors: Map<string, number>,
    statusCodes: Map<number, number>,
    rampDelay: number
  ): Promise<void> {
    if (rampDelay > 0) {
      await this.sleep(rampDelay);
    }

    const client = new TestClient(this.baseURL, this.headers);

    for (let iteration = 0; iteration < repeatCount; iteration++) {
      const context: StepContext = {};

      for (const step of this.steps) {
        try {
          const stepStart = performance.now();
          const response = await step.handler(client, context);
          const stepEnd = performance.now();

          const metric: RequestMetrics = {
            url: response?.config?.url || 'unknown',
            method: response?.config?.method?.toUpperCase() || 'UNKNOWN',
            statusCode: response?.status || 0,
            duration: stepEnd - stepStart,
            timestamp: Date.now(),
            size: this.getResponseSize(response),
          };

          metrics.push(metric);

          const statusCount = statusCodes.get(metric.statusCode) || 0;
          statusCodes.set(metric.statusCode, statusCount + 1);

          this.emit('request:complete', metric);

          // Think time
          if (step.thinkTime) {
            const thinkDelay = this.calculateThinkTime(step.thinkTime);
            await this.sleep(thinkDelay);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorCount = errors.get(errorMessage) || 0;
          errors.set(errorMessage, errorCount + 1);

          const metric: RequestMetrics = {
            url: 'error',
            method: 'ERROR',
            statusCode: 0,
            duration: 0,
            timestamp: Date.now(),
            error: errorMessage,
            size: 0,
          };

          metrics.push(metric);

          this.emit('request:error', { error: errorMessage, userId, step: step.name });
        }
      }
    }
  }

  private calculateRampDelay(userId: number, totalUsers: number): number {
    if (!this.config.rampUp) {
      return 0;
    }

    const rampDuration = this.parseDuration(this.config.rampUp.duration);
    const { type, steps = 10 } = this.config.rampUp;

    switch (type) {
      case 'linear':
        return (rampDuration / totalUsers) * userId;

      case 'exponential':
        const expFactor = Math.log(totalUsers) / rampDuration;
        return Math.exp(expFactor * userId) - 1;

      case 'step':
        const usersPerStep = Math.ceil(totalUsers / steps);
        const stepIndex = Math.floor(userId / usersPerStep);
        return (rampDuration / steps) * stepIndex;

      default:
        return 0;
    }
  }

  private calculateThinkTime(config: ThinkTimeConfig): number {
    const { min, max, distribution = 'fixed', variance = 0 } = config;

    switch (distribution) {
      case 'fixed':
        return min;

      case 'random':
        return max ? min + Math.random() * (max - min) : min;

      case 'gaussian':
        const mean = max ? (min + max) / 2 : min;
        const stdDev = variance || (max ? (max - min) / 6 : min * 0.1);
        return this.gaussianRandom(mean, stdDev);

      default:
        return min;
    }
  }

  private gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, z0 * stdDev + mean);
  }

  private parseDuration(duration: string | number): number {
    if (typeof duration === 'number') {
      return duration;
    }

    const match = duration.match(/^(\d+)(ms|s|m|h)$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'ms':
        return value;
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  private getResponseSize(response: any): number {
    if (!response || !response.data) {
      return 0;
    }
    return JSON.stringify(response.data).length;
  }

  private calculateMetrics(
    metrics: RequestMetrics[],
    errors: Map<string, number>,
    statusCodes: Map<number, number>,
    totalBytes: number,
    totalDuration: number
  ): LoadTestResult {
    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const successfulRequests = metrics.filter((m) => m.statusCode >= 200 && m.statusCode < 300).length;
    const failedRequests = metrics.length - successfulRequests;

    return {
      summary: {
        totalRequests: metrics.length,
        successfulRequests,
        failedRequests,
        totalDuration,
        throughput: metrics.length / totalDuration,
        errorRate: (failedRequests / metrics.length) * 100,
        successRate: (successfulRequests / metrics.length) * 100,
      },
      responseTime: {
        min: durations[0] || 0,
        max: durations[durations.length - 1] || 0,
        mean: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
        median: this.percentile(durations, 50),
        p90: this.percentile(durations, 90),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99),
        p999: this.percentile(durations, 99.9),
      },
      errors: Array.from(errors.entries()).map(([type, count]) => ({
        type: type.split(':')[0],
        message: type,
        count,
      })),
      statusCodes: Object.fromEntries(statusCodes),
      dataTransferred: {
        bytes: totalBytes,
        kb: totalBytes / 1024,
        mb: totalBytes / (1024 * 1024),
      },
      timestamp: new Date(),
    };
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((values.length * p) / 100) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Report Generator
class ReportGenerator {
  private templateDir: string;

  constructor(templateDir: string = path.join(__dirname, 'templates')) {
    this.templateDir = templateDir;
  }

  generateHTML(result: LoadTestResult, outputPath: string): void {
    try {
      const template = this.getHTMLTemplate();
      const compiled = Handlebars.compile(template);
      const html = compiled({
        result,
        generatedAt: new Date().toISOString(),
        chartData: this.generateChartData(result),
      });

      fs.writeFileSync(outputPath, html, 'utf-8');
    } catch (error) {
      throw new Error(`HTML report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateJSON(result: LoadTestResult, outputPath: string): void {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`JSON report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateCSV(result: LoadTestResult, outputPath: string): void {
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Requests', result.summary.totalRequests],
        ['Successful Requests', result.summary.successfulRequests],
        ['Failed Requests', result.summary.failedRequests],
        ['Total Duration (s)', result.summary.totalDuration.toFixed(2)],
        ['Throughput (req/s)', result.summary.throughput.toFixed(2)],
        ['Error Rate (%)', result.summary.errorRate.toFixed(2)],
        ['Success Rate (%)', result.summary.successRate.toFixed(2)],
        ['Min Response Time (ms)', result.responseTime.min.toFixed(2)],
        ['Max Response Time (ms)', result.responseTime.max.toFixed(2)],
        ['Mean Response Time (ms)', result.responseTime.mean.toFixed(2)],
        ['Median Response Time (ms)', result.responseTime.median.toFixed(2)],
        ['p90 Response Time (ms)', result.responseTime.p90.toFixed(2)],
        ['p95 Response Time (ms)', result.responseTime.p95.toFixed(2)],
        ['p99 Response Time (ms)', result.responseTime.p99.toFixed(2)],
        ['p99.9 Response Time (ms)', result.responseTime.p999.toFixed(2)],
      ];

      const csv = rows.map((row) => row.join(',')).join('\n');
      fs.writeFileSync(outputPath, csv, 'utf-8');
    } catch (error) {
      throw new Error(`CSV report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateChartData(result: LoadTestResult): any {
    return {
      responseTimes: [
        { label: 'Min', value: result.responseTime.min },
        { label: 'Mean', value: result.responseTime.mean },
        { label: 'Median', value: result.responseTime.median },
        { label: 'p90', value: result.responseTime.p90 },
        { label: 'p95', value: result.responseTime.p95 },
        { label: 'p99', value: result.responseTime.p99 },
        { label: 'Max', value: result.responseTime.max },
      ],
      statusCodes: Object.entries(result.statusCodes).map(([code, count]) => ({
        code: parseInt(code),
        count,
      })),
    };
  }

  private getHTMLTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; }
    .metric-label { font-size: 12px; color: #777; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    tr:hover { background: #f5f5f5; }
    .error { color: #f44336; }
    .success { color: #4CAF50; }
    .timestamp { color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Load Test Report</h1>
    <p class="timestamp">Generated at: {{generatedAt}}</p>

    <h2>Summary</h2>
    <div class="summary">
      <div class="metric">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">{{result.summary.totalRequests}}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value success">{{result.summary.successRate}}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Error Rate</div>
        <div class="metric-value error">{{result.summary.errorRate}}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Throughput</div>
        <div class="metric-value">{{result.summary.throughput}} req/s</div>
      </div>
      <div class="metric">
        <div class="metric-label">Mean Response Time</div>
        <div class="metric-value">{{result.responseTime.mean}} ms</div>
      </div>
      <div class="metric">
        <div class="metric-label">p95 Response Time</div>
        <div class="metric-value">{{result.responseTime.p95}} ms</div>
      </div>
    </div>

    <h2>Response Time Percentiles</h2>
    <table>
      <thead>
        <tr>
          <th>Percentile</th>
          <th>Response Time (ms)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Min</td><td>{{result.responseTime.min}}</td></tr>
        <tr><td>Mean</td><td>{{result.responseTime.mean}}</td></tr>
        <tr><td>Median (p50)</td><td>{{result.responseTime.median}}</td></tr>
        <tr><td>p90</td><td>{{result.responseTime.p90}}</td></tr>
        <tr><td>p95</td><td>{{result.responseTime.p95}}</td></tr>
        <tr><td>p99</td><td>{{result.responseTime.p99}}</td></tr>
        <tr><td>p99.9</td><td>{{result.responseTime.p999}}</td></tr>
        <tr><td>Max</td><td>{{result.responseTime.max}}</td></tr>
      </tbody>
    </table>

    {{#if result.errors.length}}
    <h2>Errors</h2>
    <table>
      <thead>
        <tr>
          <th>Error Type</th>
          <th>Message</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {{#each result.errors}}
        <tr>
          <td>{{this.type}}</td>
          <td class="error">{{this.message}}</td>
          <td>{{this.count}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    {{/if}}

    <h2>Status Codes</h2>
    <table>
      <thead>
        <tr>
          <th>Status Code</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {{#each result.statusCodes}}
        <tr>
          <td>{{@key}}</td>
          <td>{{this}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
  }
}

// Load Test Runner
async function runLoadTest(scenario: LoadTestScenario, config?: Partial<LoadTestConfig>): Promise<LoadTestResult> {
  try {
    const result = await scenario.execute();

    // Generate reports if configured
    if (config?.reportFormat && config?.outputPath) {
      const generator = new ReportGenerator();
      const outputDir = config.outputPath;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      switch (config.reportFormat) {
        case 'html':
          generator.generateHTML(result, path.join(outputDir, `report-${timestamp}.html`));
          break;
        case 'json':
          generator.generateJSON(result, path.join(outputDir, `report-${timestamp}.json`));
          break;
        case 'csv':
          generator.generateCSV(result, path.join(outputDir, `report-${timestamp}.csv`));
          break;
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Load test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stress Testing
async function runStressTest(
  baseURL: string,
  endpoint: string,
  options: {
    startUsers: number;
    maxUsers: number;
    step: number;
    stepDuration: string;
  }
): Promise<LoadTestResult[]> {
  const results: LoadTestResult[] = [];

  for (let users = options.startUsers; users <= options.maxUsers; users += options.step) {
    const scenario = new LoadTestScenario(`Stress Test - ${users} users`)
      .setBaseURL(baseURL)
      .addVirtualUsers(users)
      .duration(options.stepDuration)
      .step('Request', async (client) => {
        return await client.get(endpoint);
      });

    const result = await scenario.execute();
    results.push(result);

    // Check if system is breaking
    if (result.summary.errorRate > 50) {
      console.log(`System breaking point found at ${users} users`);
      break;
    }
  }

  return results;
}

// Spike Testing
async function runSpikeTest(
  baseURL: string,
  endpoint: string,
  options: {
    normalUsers: number;
    spikeUsers: number;
    normalDuration: string;
    spikeDuration: string;
  }
): Promise<{ normal: LoadTestResult; spike: LoadTestResult }> {
  // Normal load
  const normalScenario = new LoadTestScenario('Normal Load')
    .setBaseURL(baseURL)
    .addVirtualUsers(options.normalUsers)
    .duration(options.normalDuration)
    .step('Request', async (client) => {
      return await client.get(endpoint);
    });

  const normalResult = await normalScenario.execute();

  // Spike
  const spikeScenario = new LoadTestScenario('Spike Load')
    .setBaseURL(baseURL)
    .addVirtualUsers(options.spikeUsers)
    .duration(options.spikeDuration)
    .step('Request', async (client) => {
      return await client.get(endpoint);
    });

  const spikeResult = await spikeScenario.execute();

  return { normal: normalResult, spike: spikeResult };
}

// Soak Testing
async function runSoakTest(
  baseURL: string,
  endpoint: string,
  options: {
    users: number;
    duration: string;
    thinkTime?: number;
  }
): Promise<LoadTestResult> {
  const scenario = new LoadTestScenario('Soak Test')
    .setBaseURL(baseURL)
    .addVirtualUsers(options.users)
    .duration(options.duration)
    .step('Request', async (client) => {
      return await client.get(endpoint);
    });

  if (options.thinkTime) {
    scenario.thinkTime(options.thinkTime);
  }

  return await scenario.execute();
}

// Autocannon Integration
async function runAutocannonTest(
  url: string,
  options: {
    connections?: number;
    pipelining?: number;
    duration?: number;
    amount?: number;
    method?: string;
    body?: any;
    headers?: { [key: string]: string };
  }
): Promise<AutocannonResult> {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: options.connections || 10,
      pipelining: options.pipelining || 1,
      duration: options.duration || 10,
      amount: options.amount,
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: options.headers,
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    autocannon.track(instance);
  });
}

// Performance Baseline
class PerformanceBaseline {
  private baselines: Map<string, LoadTestResult> = new Map();

  setBaseline(name: string, result: LoadTestResult): void {
    this.baselines.set(name, result);
  }

  getBaseline(name: string): LoadTestResult | undefined {
    return this.baselines.get(name);
  }

  compare(name: string, current: LoadTestResult): {
    regression: boolean;
    improvements: string[];
    regressions: string[];
  } {
    const baseline = this.baselines.get(name);
    if (!baseline) {
      throw new Error(`No baseline found for ${name}`);
    }

    const improvements: string[] = [];
    const regressions: string[] = [];

    // Compare response times
    if (current.responseTime.p95 < baseline.responseTime.p95 * 0.9) {
      improvements.push('p95 response time improved');
    } else if (current.responseTime.p95 > baseline.responseTime.p95 * 1.1) {
      regressions.push('p95 response time regressed');
    }

    // Compare throughput
    if (current.summary.throughput > baseline.summary.throughput * 1.1) {
      improvements.push('Throughput improved');
    } else if (current.summary.throughput < baseline.summary.throughput * 0.9) {
      regressions.push('Throughput regressed');
    }

    // Compare error rate
    if (current.summary.errorRate < baseline.summary.errorRate) {
      improvements.push('Error rate improved');
    } else if (current.summary.errorRate > baseline.summary.errorRate) {
      regressions.push('Error rate regressed');
    }

    return {
      regression: regressions.length > 0,
      improvements,
      regressions,
    };
  }
}

// Exports
export {
  LoadTestScenario,
  TestClient,
  ReportGenerator,
  PerformanceBaseline,
  runLoadTest,
  runStressTest,
  runSpikeTest,
  runSoakTest,
  runAutocannonTest,
};

export type {
  LoadTestResult,
  LoadTestConfig,
  RampUpConfig,
  ThinkTimeConfig,
  StepContext,
  RequestMetrics,
};

export const LoadTestingFramework = {
  LoadTestScenario,
  TestClient,
  ReportGenerator,
  PerformanceBaseline,
  runLoadTest,
  runStressTest,
  runSpikeTest,
  runSoakTest,
  runAutocannonTest,
};

export default LoadTestingFramework;
