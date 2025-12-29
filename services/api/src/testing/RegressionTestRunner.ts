import { EventEmitter } from 'events';
import IntegrationTestSuite, { TestScenario, TestResult } from './IntegrationTestSuite';

export interface RegressionTestConfig {
  testSuiteConfig: any;
  baselineVersion: string;
  currentVersion: string;
  threshold: RegressionThreshold;
}

export interface RegressionThreshold {
  maxPerformanceDegradation: number; // percentage
  maxFailureRate: number; // percentage
  criticalTestsMustPass: boolean;
}

export interface RegressionTestReport {
  version: string;
  baselineVersion: string;
  timestamp: Date;
  summary: RegressionSummary;
  performanceComparison: PerformanceComparison[];
  newFailures: TestResult[];
  fixedIssues: TestResult[];
  regressions: Regression[];
  passed: boolean;
}

export interface RegressionSummary {
  totalTests: number;
  passed: number;
  failed: number;
  newFailures: number;
  fixedIssues: number;
  regressions: number;
  performanceDegradation: number;
}

export interface PerformanceComparison {
  testId: string;
  baselineDuration: number;
  currentDuration: number;
  change: number;
  changePercentage: number;
  degraded: boolean;
}

export interface Regression {
  testId: string;
  type: 'failure' | 'performance';
  description: string;
  baseline: any;
  current: any;
}

/**
 * Regression Test Runner
 *
 * Automated regression testing to ensure new changes don't break existing functionality.
 * Compares test results against baseline to detect regressions.
 */
export class RegressionTestRunner extends EventEmitter {
  private config: RegressionTestConfig;
  private testSuite: IntegrationTestSuite;
  private baselineResults: Map<string, TestResult> = new Map();
  private currentResults: Map<string, TestResult> = new Map();

  constructor(config: RegressionTestConfig) {
    super();
    this.config = config;
    this.testSuite = new IntegrationTestSuite(config.testSuiteConfig);
  }

  public async loadBaseline(results: Map<string, TestResult>): Promise<void> {
    this.baselineResults = results;
    this.emit('baseline:loaded', { count: results.size });
  }

  public async runRegressionTests(): Promise<RegressionTestReport> {
    this.emit('regression:start', { version: this.config.currentVersion });

    // Run all test scenarios
    this.currentResults = await this.testSuite.runAll();

    // Compare with baseline
    const report = await this.generateReport();

    this.emit('regression:complete', report);

    return report;
  }

  private async generateReport(): Promise<RegressionTestReport> {
    const summary = this.calculateSummary();
    const performanceComparison = this.comparePerformance();
    const newFailures = this.identifyNewFailures();
    const fixedIssues = this.identifyFixedIssues();
    const regressions = this.identifyRegressions();

    const passed = this.evaluateRegressionCriteria(summary, regressions);

    return {
      version: this.config.currentVersion,
      baselineVersion: this.config.baselineVersion,
      timestamp: new Date(),
      summary,
      performanceComparison,
      newFailures,
      fixedIssues,
      regressions,
      passed,
    };
  }

  private calculateSummary(): RegressionSummary {
    const totalTests = this.currentResults.size;
    const passed = Array.from(this.currentResults.values()).filter(r => r.passed).length;
    const failed = totalTests - passed;

    const newFailures = this.identifyNewFailures().length;
    const fixedIssues = this.identifyFixedIssues().length;
    const regressions = this.identifyRegressions().length;

    const performanceComparison = this.comparePerformance();
    const degradedTests = performanceComparison.filter(p => p.degraded).length;
    const performanceDegradation = totalTests > 0
      ? (degradedTests / totalTests) * 100
      : 0;

    return {
      totalTests,
      passed,
      failed,
      newFailures,
      fixedIssues,
      regressions,
      performanceDegradation,
    };
  }

  private comparePerformance(): PerformanceComparison[] {
    const comparisons: PerformanceComparison[] = [];

    for (const [testId, currentResult] of this.currentResults) {
      const baselineResult = this.baselineResults.get(testId);
      if (!baselineResult) continue;

      const change = currentResult.duration - baselineResult.duration;
      const changePercentage = (change / baselineResult.duration) * 100;
      const degraded = changePercentage > this.config.threshold.maxPerformanceDegradation;

      comparisons.push({
        testId,
        baselineDuration: baselineResult.duration,
        currentDuration: currentResult.duration,
        change,
        changePercentage,
        degraded,
      });
    }

    return comparisons.sort((a, b) => b.changePercentage - a.changePercentage);
  }

  private identifyNewFailures(): TestResult[] {
    const newFailures: TestResult[] = [];

    for (const [testId, currentResult] of this.currentResults) {
      const baselineResult = this.baselineResults.get(testId);

      // Test failed in current but passed in baseline
      if (!currentResult.passed && baselineResult?.passed) {
        newFailures.push(currentResult);
      }
    }

    return newFailures;
  }

  private identifyFixedIssues(): TestResult[] {
    const fixedIssues: TestResult[] = [];

    for (const [testId, currentResult] of this.currentResults) {
      const baselineResult = this.baselineResults.get(testId);

      // Test passed in current but failed in baseline
      if (currentResult.passed && baselineResult && !baselineResult.passed) {
        fixedIssues.push(currentResult);
      }
    }

    return fixedIssues;
  }

  private identifyRegressions(): Regression[] {
    const regressions: Regression[] = [];

    // Failure regressions
    const newFailures = this.identifyNewFailures();
    for (const failure of newFailures) {
      regressions.push({
        testId: failure.scenarioId,
        type: 'failure',
        description: `Test started failing: ${failure.errors[0]?.error || 'Unknown error'}`,
        baseline: this.baselineResults.get(failure.scenarioId),
        current: failure,
      });
    }

    // Performance regressions
    const performanceComparison = this.comparePerformance();
    for (const comparison of performanceComparison) {
      if (comparison.degraded) {
        regressions.push({
          testId: comparison.testId,
          type: 'performance',
          description: `Performance degraded by ${comparison.changePercentage.toFixed(1)}%`,
          baseline: { duration: comparison.baselineDuration },
          current: { duration: comparison.currentDuration },
        });
      }
    }

    return regressions;
  }

  private evaluateRegressionCriteria(
    summary: RegressionSummary,
    regressions: Regression[]
  ): boolean {
    // Check if critical tests passed
    if (this.config.threshold.criticalTestsMustPass) {
      const criticalTests = Array.from(this.currentResults.values()).filter(r =>
        r.scenarioId.includes('critical') || r.scenarioId.includes('user-onboarding')
      );

      if (criticalTests.some(t => !t.passed)) {
        this.emit('regression:critical_test_failed');
        return false;
      }
    }

    // Check failure rate
    const failureRate = (summary.failed / summary.totalTests) * 100;
    if (failureRate > this.config.threshold.maxFailureRate) {
      this.emit('regression:failure_rate_exceeded', { failureRate });
      return false;
    }

    // Check performance degradation
    if (summary.performanceDegradation > this.config.threshold.maxPerformanceDegradation) {
      this.emit('regression:performance_degraded', { degradation: summary.performanceDegradation });
      return false;
    }

    // Check for any regressions
    if (regressions.length > 0) {
      this.emit('regression:regressions_found', { count: regressions.length });
      return false;
    }

    return true;
  }

  public formatReport(report: RegressionTestReport): string {
    return `
# Regression Test Report

**Version**: ${report.version}
**Baseline**: ${report.baselineVersion}
**Timestamp**: ${report.timestamp.toISOString()}
**Result**: ${report.passed ? '✅ PASSED' : '❌ FAILED'}

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **New Failures**: ${report.summary.newFailures}
- **Fixed Issues**: ${report.summary.fixedIssues}
- **Regressions**: ${report.summary.regressions}
- **Performance Degradation**: ${report.summary.performanceDegradation.toFixed(1)}%

## Regressions
${report.regressions.length > 0
  ? report.regressions.map(r => `- [${r.type}] ${r.testId}: ${r.description}`).join('\n')
  : 'No regressions detected'}

## Performance Changes
${report.performanceComparison
  .filter(p => Math.abs(p.changePercentage) > 5)
  .slice(0, 10)
  .map(p => `- ${p.testId}: ${p.changePercentage > 0 ? '+' : ''}${p.changePercentage.toFixed(1)}% (${p.baselineDuration}ms → ${p.currentDuration}ms)`)
  .join('\n')}

## New Failures
${report.newFailures.length > 0
  ? report.newFailures.map(f => `- ${f.scenarioId}: ${f.errors[0]?.error || 'Unknown error'}`).join('\n')
  : 'No new failures'}

## Fixed Issues
${report.fixedIssues.length > 0
  ? report.fixedIssues.map(f => `- ${f.scenarioId}`).join('\n')
  : 'No issues fixed'}
    `.trim();
  }
}

export default RegressionTestRunner;
