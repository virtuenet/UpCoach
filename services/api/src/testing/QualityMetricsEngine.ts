import { readFile } from 'fs/promises';
import { parse as parseLcov } from 'lcov-parse';
import * as stats from 'simple-statistics';
import { linearRegression, linearRegressionLine } from 'simple-statistics';
import axios from 'axios';

/**
 * Quality Metrics Engine
 * Aggregates and analyzes quality metrics across platforms with trend analysis
 * and automated quality gates for CI/CD pipelines
 */

// ==================== Types & Interfaces ====================

export enum MetricType {
  CODE_COVERAGE = 'code_coverage',
  PERFORMANCE = 'performance',
  CRASH_RATE = 'crash_rate',
  USER_EXPERIENCE = 'user_experience',
  ACCESSIBILITY = 'accessibility',
  SECURITY = 'security',
}

export enum Platform {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
}

export interface CodeCoverageData {
  platform: Platform;
  type: 'istanbul' | 'lcov' | 'jacoco' | 'cobertura';
  filePath?: string;
  rawData?: any;
  lines: CoverageMetrics;
  branches: CoverageMetrics;
  functions: CoverageMetrics;
  statements: CoverageMetrics;
  files: FileCoverage[];
  timestamp: Date;
}

export interface CoverageMetrics {
  total: number;
  covered: number;
  percentage: number;
}

export interface FileCoverage {
  path: string;
  lines: CoverageMetrics;
  branches: CoverageMetrics;
  functions: CoverageMetrics;
  statements: CoverageMetrics;
  uncoveredLines: number[];
}

export interface AggregatedCoverage {
  platforms: Map<Platform, CodeCoverageData>;
  overall: CoverageMetrics;
  byFile: Map<string, FileCoverage[]>;
  gaps: CoverageGap[];
  trends: CoverageTrend[];
}

export interface CoverageGap {
  file: string;
  platforms: Platform[];
  uncoveredLines: number[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
}

export interface CoverageTrend {
  platform: Platform;
  metric: 'lines' | 'branches' | 'functions' | 'statements';
  historicalData: TrendDataPoint[];
  trend: 'improving' | 'declining' | 'stable';
  slope: number;
  rSquared: number;
  prediction: number;
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

export interface PerformanceMetricData {
  platform: Platform;
  scenario: string;
  metrics: {
    loadTime: number;
    runtimePerformance: number;
    memoryUsage: number;
    cpuUsage: number;
    batteryDrain?: number;
    networkLatency: number;
    frameRate?: number;
    appStartupTime?: number;
  };
  timestamp: Date;
}

export interface PerformanceScore {
  platform: Platform;
  overall: number;
  breakdown: {
    loadTime: number;
    runtime: number;
    memory: number;
    cpu: number;
    network: number;
    battery?: number;
  };
  weights: Record<string, number>;
}

export interface CrashAnalytics {
  platform: Platform;
  totalCrashes: number;
  uniqueCrashes: number;
  crashRate: number;
  crashes: CrashReport[];
  topCrashes: CrashSummary[];
  symbolication: Map<string, string>;
}

export interface CrashReport {
  id: string;
  timestamp: Date;
  platform: Platform;
  version: string;
  stackTrace: string;
  symbolicated: boolean;
  userImpact: number;
  frequency: number;
}

export interface CrashSummary {
  signature: string;
  count: number;
  percentage: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
  stackTrace: string;
}

export interface UserExperienceMetrics {
  platform: Platform;
  coreWebVitals?: CoreWebVitals;
  mobileMetrics?: MobileUXMetrics;
  timestamp: Date;
}

export interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  tti: number;
  score: number;
}

export interface MobileUXMetrics {
  appStartupTime: number;
  screenTransitionTime: number;
  frameRate: number;
  jankPercentage: number;
  touchResponseTime: number;
  score: number;
}

export interface AccessibilityMetrics {
  platform: Platform;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: number;
  criticalViolations: number;
  warnings: number;
  passes: number;
  score: number;
  compliance: number;
  issues: AccessibilityIssue[];
  timestamp: Date;
}

export interface AccessibilityIssue {
  id: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  wcagCriteria: string[];
  count: number;
  affectedElements: number;
}

export interface SecurityMetrics {
  platform: Platform;
  vulnerabilities: Vulnerability[];
  dependencyAudit: DependencyAuditResult;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvss: number;
  cve?: string;
  package: string;
  version: string;
  fixedIn?: string;
  description: string;
}

export interface DependencyAuditResult {
  total: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
  outdated: number;
}

export interface QualityGate {
  id: string;
  name: string;
  conditions: QualityCondition[];
  status: 'passed' | 'failed' | 'warning';
  errors: string[];
  warnings: string[];
}

export interface QualityCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  actual?: number;
  passed?: boolean;
  platform?: Platform;
}

export interface QualityReport {
  timestamp: Date;
  platforms: Platform[];
  coverage: AggregatedCoverage;
  performance: Map<Platform, PerformanceScore>;
  crashes: Map<Platform, CrashAnalytics>;
  userExperience: Map<Platform, UserExperienceMetrics>;
  accessibility: Map<Platform, AccessibilityMetrics>;
  security: Map<Platform, SecurityMetrics>;
  qualityGates: QualityGate[];
  overallScore: number;
  trends: TrendAnalysis;
}

export interface TrendAnalysis {
  coverage: TrendSummary;
  performance: TrendSummary;
  crashes: TrendSummary;
  accessibility: TrendSummary;
  anomalies: Anomaly[];
}

export interface TrendSummary {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  trend: 'improving' | 'declining' | 'stable';
  prediction: number;
}

export interface Anomaly {
  metric: string;
  platform: Platform;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
}

// ==================== Coverage Aggregation ====================

class CoverageAggregator {
  async parseLcovFile(filePath: string, platform: Platform): Promise<CodeCoverageData> {
    const content = await readFile(filePath, 'utf-8');

    return new Promise((resolve, reject) => {
      parseLcov(content, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const files: FileCoverage[] = [];
        let totalLines = 0;
        let coveredLines = 0;
        let totalBranches = 0;
        let coveredBranches = 0;
        let totalFunctions = 0;
        let coveredFunctions = 0;

        for (const file of data || []) {
          const fileLines = file.lines?.found || 0;
          const fileLinesCovered = file.lines?.hit || 0;
          const fileBranches = file.branches?.found || 0;
          const fileBranchesCovered = file.branches?.hit || 0;
          const fileFunctions = file.functions?.found || 0;
          const fileFunctionsCovered = file.functions?.hit || 0;

          totalLines += fileLines;
          coveredLines += fileLinesCovered;
          totalBranches += fileBranches;
          coveredBranches += fileBranchesCovered;
          totalFunctions += fileFunctions;
          coveredFunctions += fileFunctionsCovered;

          const uncoveredLines: number[] = [];
          if (file.lines?.details) {
            for (const detail of file.lines.details) {
              if (detail.hit === 0) {
                uncoveredLines.push(detail.line);
              }
            }
          }

          files.push({
            path: file.file || '',
            lines: {
              total: fileLines,
              covered: fileLinesCovered,
              percentage: fileLines > 0 ? (fileLinesCovered / fileLines) * 100 : 0,
            },
            branches: {
              total: fileBranches,
              covered: fileBranchesCovered,
              percentage: fileBranches > 0 ? (fileBranchesCovered / fileBranches) * 100 : 0,
            },
            functions: {
              total: fileFunctions,
              covered: fileFunctionsCovered,
              percentage: fileFunctions > 0 ? (fileFunctionsCovered / fileFunctions) * 100 : 0,
            },
            statements: {
              total: fileLines,
              covered: fileLinesCovered,
              percentage: fileLines > 0 ? (fileLinesCovered / fileLines) * 100 : 0,
            },
            uncoveredLines,
          });
        }

        resolve({
          platform,
          type: 'lcov',
          filePath,
          lines: {
            total: totalLines,
            covered: coveredLines,
            percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
          },
          branches: {
            total: totalBranches,
            covered: coveredBranches,
            percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
          },
          functions: {
            total: totalFunctions,
            covered: coveredFunctions,
            percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
          },
          statements: {
            total: totalLines,
            covered: coveredLines,
            percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
          },
          files,
          timestamp: new Date(),
        });
      });
    });
  }

  parseIstanbulJson(jsonData: any, platform: Platform): CodeCoverageData {
    const files: FileCoverage[] = [];
    let totalLines = 0;
    let coveredLines = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalStatements = 0;
    let coveredStatements = 0;

    for (const [filePath, fileData] of Object.entries(jsonData)) {
      const data = fileData as any;

      const lineStats = data.s || {};
      const branchStats = data.b || {};
      const functionStats = data.f || {};

      const fileLines = Object.keys(lineStats).length;
      const fileLinesCovered = Object.values(lineStats).filter((v: any) => v > 0).length;

      const fileBranches = Object.keys(branchStats).length;
      let fileBranchesCovered = 0;
      for (const branches of Object.values(branchStats) as any[]) {
        fileBranchesCovered += branches.filter((v: number) => v > 0).length;
      }

      const fileFunctions = Object.keys(functionStats).length;
      const fileFunctionsCovered = Object.values(functionStats).filter((v: any) => v > 0).length;

      totalLines += fileLines;
      coveredLines += fileLinesCovered;
      totalBranches += fileBranches;
      coveredBranches += fileBranchesCovered;
      totalFunctions += fileFunctions;
      coveredFunctions += fileFunctionsCovered;
      totalStatements += fileLines;
      coveredStatements += fileLinesCovered;

      const uncoveredLines: number[] = [];
      for (const [line, count] of Object.entries(lineStats)) {
        if (count === 0) {
          uncoveredLines.push(parseInt(line));
        }
      }

      files.push({
        path: filePath,
        lines: {
          total: fileLines,
          covered: fileLinesCovered,
          percentage: fileLines > 0 ? (fileLinesCovered / fileLines) * 100 : 0,
        },
        branches: {
          total: fileBranches,
          covered: fileBranchesCovered,
          percentage: fileBranches > 0 ? (fileBranchesCovered / fileBranches) * 100 : 0,
        },
        functions: {
          total: fileFunctions,
          covered: fileFunctionsCovered,
          percentage: fileFunctions > 0 ? (fileFunctionsCovered / fileFunctions) * 100 : 0,
        },
        statements: {
          total: fileLines,
          covered: fileLinesCovered,
          percentage: fileLines > 0 ? (fileLinesCovered / fileLines) * 100 : 0,
        },
        uncoveredLines,
      });
    }

    return {
      platform,
      type: 'istanbul',
      rawData: jsonData,
      lines: {
        total: totalLines,
        covered: coveredLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      },
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      },
      files,
      timestamp: new Date(),
    };
  }

  aggregateCoverage(coverageData: CodeCoverageData[]): AggregatedCoverage {
    const platforms = new Map<Platform, CodeCoverageData>();
    const byFile = new Map<string, FileCoverage[]>();

    let totalLines = 0;
    let coveredLines = 0;

    for (const data of coverageData) {
      platforms.set(data.platform, data);

      totalLines += data.lines.total;
      coveredLines += data.lines.covered;

      for (const file of data.files) {
        const existing = byFile.get(file.path) || [];
        existing.push(file);
        byFile.set(file.path, existing);
      }
    }

    const overall: CoverageMetrics = {
      total: totalLines,
      covered: coveredLines,
      percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
    };

    const gaps = this.identifyCoverageGaps(byFile);

    return {
      platforms,
      overall,
      byFile,
      gaps,
      trends: [],
    };
  }

  private identifyCoverageGaps(byFile: Map<string, FileCoverage[]>): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    for (const [filePath, coverages] of byFile) {
      const allUncoveredLines = new Set<number>();
      const platforms: Platform[] = [];

      for (const coverage of coverages) {
        for (const line of coverage.uncoveredLines) {
          allUncoveredLines.add(line);
        }
      }

      if (allUncoveredLines.size > 0) {
        const avgCoverage = stats.mean(coverages.map(c => c.lines.percentage));
        const severity = this.determineSeverity(avgCoverage, allUncoveredLines.size);

        gaps.push({
          file: filePath,
          platforms,
          uncoveredLines: Array.from(allUncoveredLines),
          severity,
          impact: allUncoveredLines.size * (100 - avgCoverage),
        });
      }
    }

    return gaps.sort((a, b) => b.impact - a.impact);
  }

  private determineSeverity(coverage: number, uncoveredLines: number): 'low' | 'medium' | 'high' | 'critical' {
    if (coverage < 50 || uncoveredLines > 100) return 'critical';
    if (coverage < 70 || uncoveredLines > 50) return 'high';
    if (coverage < 80 || uncoveredLines > 20) return 'medium';
    return 'low';
  }
}

// ==================== Performance Score Calculator ====================

class PerformanceScoreCalculator {
  private weights: Record<string, number> = {
    loadTime: 0.25,
    runtime: 0.20,
    memory: 0.15,
    cpu: 0.15,
    network: 0.15,
    battery: 0.10,
  };

  calculateScore(metrics: PerformanceMetricData): PerformanceScore {
    const breakdown = {
      loadTime: this.scoreLoadTime(metrics.metrics.loadTime),
      runtime: this.scoreRuntime(metrics.metrics.runtimePerformance),
      memory: this.scoreMemory(metrics.metrics.memoryUsage),
      cpu: this.scoreCpu(metrics.metrics.cpuUsage),
      network: this.scoreNetwork(metrics.metrics.networkLatency),
      battery: metrics.metrics.batteryDrain ? this.scoreBattery(metrics.metrics.batteryDrain) : 100,
    };

    let overall = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(this.weights)) {
      if (breakdown[key as keyof typeof breakdown] !== undefined) {
        overall += breakdown[key as keyof typeof breakdown] * weight;
        totalWeight += weight;
      }
    }

    overall = totalWeight > 0 ? overall / totalWeight : 0;

    return {
      platform: metrics.platform,
      overall,
      breakdown,
      weights: this.weights,
    };
  }

  private scoreLoadTime(loadTime: number): number {
    if (loadTime <= 1000) return 100;
    if (loadTime <= 2000) return 90;
    if (loadTime <= 3000) return 75;
    if (loadTime <= 5000) return 50;
    if (loadTime <= 10000) return 25;
    return 0;
  }

  private scoreRuntime(runtime: number): number {
    if (runtime <= 50) return 100;
    if (runtime <= 100) return 90;
    if (runtime <= 200) return 75;
    if (runtime <= 500) return 50;
    return 25;
  }

  private scoreMemory(memory: number): number {
    if (memory <= 50) return 100;
    if (memory <= 100) return 90;
    if (memory <= 200) return 75;
    if (memory <= 500) return 50;
    return 25;
  }

  private scoreCpu(cpu: number): number {
    if (cpu <= 20) return 100;
    if (cpu <= 40) return 90;
    if (cpu <= 60) return 75;
    if (cpu <= 80) return 50;
    return 25;
  }

  private scoreNetwork(latency: number): number {
    if (latency <= 50) return 100;
    if (latency <= 100) return 90;
    if (latency <= 200) return 75;
    if (latency <= 500) return 50;
    return 25;
  }

  private scoreBattery(drain: number): number {
    if (drain <= 1) return 100;
    if (drain <= 2) return 90;
    if (drain <= 5) return 75;
    if (drain <= 10) return 50;
    return 25;
  }
}

// ==================== Crash Analytics ====================

class CrashAnalyzer {
  private symbolMaps: Map<Platform, Map<string, string>>;

  constructor() {
    this.symbolMaps = new Map();
  }

  loadSymbolMap(platform: Platform, symbolMap: Map<string, string>): void {
    this.symbolMaps.set(platform, symbolMap);
  }

  analyzeCrashes(crashes: CrashReport[]): CrashAnalytics {
    if (crashes.length === 0) {
      return {
        platform: Platform.WEB,
        totalCrashes: 0,
        uniqueCrashes: 0,
        crashRate: 0,
        crashes: [],
        topCrashes: [],
        symbolication: new Map(),
      };
    }

    const platform = crashes[0].platform;
    const symbolMap = this.symbolMaps.get(platform) || new Map();

    const symbolicatedCrashes = crashes.map(crash => ({
      ...crash,
      stackTrace: this.symbolicateStackTrace(crash.stackTrace, symbolMap),
      symbolicated: true,
    }));

    const crashGroups = this.groupCrashesBySignature(symbolicatedCrashes);
    const topCrashes = this.getTopCrashes(crashGroups, 10);

    const uniqueCrashes = crashGroups.size;
    const totalCrashes = crashes.length;
    const totalUsers = new Set(crashes.map(c => c.id)).size;
    const crashRate = totalUsers > 0 ? (totalCrashes / totalUsers) * 100 : 0;

    return {
      platform,
      totalCrashes,
      uniqueCrashes,
      crashRate,
      crashes: symbolicatedCrashes,
      topCrashes,
      symbolication: symbolMap,
    };
  }

  private symbolicateStackTrace(stackTrace: string, symbolMap: Map<string, string>): string {
    let symbolicated = stackTrace;

    for (const [address, symbol] of symbolMap) {
      symbolicated = symbolicated.replace(new RegExp(address, 'g'), symbol);
    }

    return symbolicated;
  }

  private groupCrashesBySignature(crashes: CrashReport[]): Map<string, CrashReport[]> {
    const groups = new Map<string, CrashReport[]>();

    for (const crash of crashes) {
      const signature = this.generateCrashSignature(crash.stackTrace);
      const existing = groups.get(signature) || [];
      existing.push(crash);
      groups.set(signature, existing);
    }

    return groups;
  }

  private generateCrashSignature(stackTrace: string): string {
    const lines = stackTrace.split('\n').slice(0, 5);
    return lines.join('|');
  }

  private getTopCrashes(groups: Map<string, CrashReport[]>, limit: number): CrashSummary[] {
    const summaries: CrashSummary[] = [];

    for (const [signature, crashes] of groups) {
      const count = crashes.length;
      const affectedUsers = new Set(crashes.map(c => c.id)).size;
      const timestamps = crashes.map(c => c.timestamp);

      summaries.push({
        signature,
        count,
        percentage: 0,
        firstSeen: new Date(Math.min(...timestamps.map(t => t.getTime()))),
        lastSeen: new Date(Math.max(...timestamps.map(t => t.getTime()))),
        affectedUsers,
        stackTrace: crashes[0].stackTrace,
      });
    }

    summaries.sort((a, b) => b.count - a.count);

    const totalCrashes = summaries.reduce((sum, s) => sum + s.count, 0);
    for (const summary of summaries) {
      summary.percentage = totalCrashes > 0 ? (summary.count / totalCrashes) * 100 : 0;
    }

    return summaries.slice(0, limit);
  }
}

// ==================== Trend Analysis ====================

class TrendAnalyzer {
  analyzeTrend(dataPoints: TrendDataPoint[]): CoverageTrend {
    if (dataPoints.length < 2) {
      return {
        platform: Platform.WEB,
        metric: 'lines',
        historicalData: dataPoints,
        trend: 'stable',
        slope: 0,
        rSquared: 0,
        prediction: dataPoints[0]?.value || 0,
      };
    }

    const sortedData = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const x = sortedData.map((_, i) => i);
    const y = sortedData.map(d => d.value);

    const regression = linearRegression(x.map((xi, i) => [xi, y[i]]));
    const regressionLine = linearRegressionLine(regression);

    const slope = regression.m;
    const rSquared = this.calculateRSquared(y, x.map(xi => regressionLine(xi)));

    const prediction = regressionLine(x.length);

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.1) {
      trend = slope > 0 ? 'improving' : 'declining';
    }

    return {
      platform: Platform.WEB,
      metric: 'lines',
      historicalData: sortedData,
      trend,
      slope,
      rSquared,
      prediction,
    };
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const mean = stats.mean(actual);
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);

    return totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;
  }

  detectAnomalies(
    dataPoints: TrendDataPoint[],
    platform: Platform,
    metric: string,
    threshold = 3
  ): Anomaly[] {
    if (dataPoints.length < 5) return [];

    const values = dataPoints.map(d => d.value);
    const mean = stats.mean(values);
    const stdDev = stats.standardDeviation(values);

    const anomalies: Anomaly[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      const value = dataPoints[i].value;
      const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;

      if (zScore > threshold) {
        anomalies.push({
          metric,
          platform,
          value,
          expected: mean,
          deviation: zScore,
          severity: this.getSeverity(zScore),
          detectedAt: dataPoints[i].timestamp,
        });
      }
    }

    return anomalies;
  }

  private getSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  calculateTrendSummary(current: number, historical: number[]): TrendSummary {
    if (historical.length === 0) {
      return {
        current,
        previous: current,
        change: 0,
        percentChange: 0,
        trend: 'stable',
        prediction: current,
      };
    }

    const previous = historical[historical.length - 1];
    const change = current - previous;
    const percentChange = previous > 0 ? (change / previous) * 100 : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(percentChange) > 5) {
      trend = percentChange > 0 ? 'improving' : 'declining';
    }

    const dataPoints = historical.map((value, i) => ({
      timestamp: new Date(Date.now() - (historical.length - i) * 24 * 60 * 60 * 1000),
      value,
    }));

    const trendAnalysis = this.analyzeTrend(dataPoints);
    const prediction = trendAnalysis.prediction;

    return {
      current,
      previous,
      change,
      percentChange,
      trend,
      prediction,
    };
  }
}

// ==================== Quality Gate Evaluator ====================

class QualityGateEvaluator {
  evaluateGate(gate: Omit<QualityGate, 'status' | 'errors' | 'warnings'>, metrics: any): QualityGate {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const condition of gate.conditions) {
      const actual = this.extractMetricValue(metrics, condition.metric, condition.platform);
      condition.actual = actual;

      const passed = this.evaluateCondition(condition, actual);
      condition.passed = passed;

      if (!passed) {
        const message = `${condition.metric} (${actual}) does not meet threshold (${condition.operator} ${condition.threshold})`;

        if (condition.metric.includes('critical') || condition.metric.includes('security')) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    const status = errors.length > 0 ? 'failed' : warnings.length > 0 ? 'warning' : 'passed';

    return {
      ...gate,
      status,
      errors,
      warnings,
    };
  }

  private extractMetricValue(metrics: any, metricPath: string, platform?: Platform): number {
    const parts = metricPath.split('.');
    let value = metrics;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        if (platform && value instanceof Map) {
          value = value.get(platform);
        } else {
          value = value[part];
        }
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  private evaluateCondition(condition: QualityCondition, actual: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return actual > condition.threshold;
      case 'gte':
        return actual >= condition.threshold;
      case 'lt':
        return actual < condition.threshold;
      case 'lte':
        return actual <= condition.threshold;
      case 'eq':
        return actual === condition.threshold;
      case 'neq':
        return actual !== condition.threshold;
      default:
        return false;
    }
  }
}

// ==================== Main Quality Metrics Engine ====================

export class QualityMetricsEngine {
  private coverageAggregator: CoverageAggregator;
  private performanceCalculator: PerformanceScoreCalculator;
  private crashAnalyzer: CrashAnalyzer;
  private trendAnalyzer: TrendAnalyzer;
  private gateEvaluator: QualityGateEvaluator;
  private historicalData: Map<string, TrendDataPoint[]>;

  constructor() {
    this.coverageAggregator = new CoverageAggregator();
    this.performanceCalculator = new PerformanceScoreCalculator();
    this.crashAnalyzer = new CrashAnalyzer();
    this.trendAnalyzer = new TrendAnalyzer();
    this.gateEvaluator = new QualityGateEvaluator();
    this.historicalData = new Map();
  }

  async aggregateCoverage(coverageFiles: Array<{ platform: Platform; type: 'lcov' | 'istanbul'; path?: string; data?: any }>): Promise<AggregatedCoverage> {
    const coverageData: CodeCoverageData[] = [];

    for (const file of coverageFiles) {
      if (file.type === 'lcov' && file.path) {
        const data = await this.coverageAggregator.parseLcovFile(file.path, file.platform);
        coverageData.push(data);
      } else if (file.type === 'istanbul' && file.data) {
        const data = this.coverageAggregator.parseIstanbulJson(file.data, file.platform);
        coverageData.push(data);
      }
    }

    const aggregated = this.coverageAggregator.aggregateCoverage(coverageData);

    this.recordHistoricalMetric('coverage', aggregated.overall.percentage);

    return aggregated;
  }

  calculatePerformanceScores(metricsData: PerformanceMetricData[]): Map<Platform, PerformanceScore> {
    const scores = new Map<Platform, PerformanceScore>();

    for (const metrics of metricsData) {
      const score = this.performanceCalculator.calculateScore(metrics);
      scores.set(metrics.platform, score);

      this.recordHistoricalMetric(`performance-${metrics.platform}`, score.overall);
    }

    return scores;
  }

  analyzeCrashes(crashReports: Map<Platform, CrashReport[]>): Map<Platform, CrashAnalytics> {
    const analytics = new Map<Platform, CrashAnalytics>();

    for (const [platform, crashes] of crashReports) {
      const analysis = this.crashAnalyzer.analyzeCrashes(crashes);
      analytics.set(platform, analysis);

      this.recordHistoricalMetric(`crashes-${platform}`, analysis.crashRate);
    }

    return analytics;
  }

  calculateAccessibilityScore(metrics: AccessibilityMetrics): number {
    const violationWeight = {
      critical: 10,
      serious: 5,
      moderate: 2,
      minor: 1,
    };

    let deductions = 0;
    for (const issue of metrics.issues) {
      deductions += issue.count * violationWeight[issue.severity];
    }

    const score = Math.max(0, 100 - deductions);
    return score;
  }

  evaluateQualityGates(gates: Array<Omit<QualityGate, 'status' | 'errors' | 'warnings'>>, metrics: any): QualityGate[] {
    return gates.map(gate => this.gateEvaluator.evaluateGate(gate, metrics));
  }

  generateQualityReport(data: {
    coverage: AggregatedCoverage;
    performance: Map<Platform, PerformanceScore>;
    crashes: Map<Platform, CrashAnalytics>;
    userExperience: Map<Platform, UserExperienceMetrics>;
    accessibility: Map<Platform, AccessibilityMetrics>;
    security: Map<Platform, SecurityMetrics>;
    qualityGates: Array<Omit<QualityGate, 'status' | 'errors' | 'warnings'>>;
  }): QualityReport {
    const evaluatedGates = this.evaluateQualityGates(data.qualityGates, data);

    const overallScore = this.calculateOverallScore(data);

    const trends = this.analyzeTrends();

    return {
      timestamp: new Date(),
      platforms: Array.from(new Set([
        ...Array.from(data.performance.keys()),
        ...Array.from(data.crashes.keys()),
        ...Array.from(data.accessibility.keys()),
      ])),
      coverage: data.coverage,
      performance: data.performance,
      crashes: data.crashes,
      userExperience: data.userExperience,
      accessibility: data.accessibility,
      security: data.security,
      qualityGates: evaluatedGates,
      overallScore,
      trends,
    };
  }

  private calculateOverallScore(data: any): number {
    const weights = {
      coverage: 0.25,
      performance: 0.25,
      crashes: 0.20,
      accessibility: 0.15,
      security: 0.15,
    };

    let score = 0;

    score += (data.coverage.overall.percentage || 0) * weights.coverage;

    if (data.performance.size > 0) {
      const avgPerformance = stats.mean(Array.from(data.performance.values()).map((p: PerformanceScore) => p.overall));
      score += avgPerformance * weights.performance;
    }

    if (data.crashes.size > 0) {
      const avgCrashRate = stats.mean(Array.from(data.crashes.values()).map((c: CrashAnalytics) => c.crashRate));
      score += Math.max(0, 100 - avgCrashRate) * weights.crashes;
    }

    if (data.accessibility.size > 0) {
      const avgAccessibility = stats.mean(Array.from(data.accessibility.values()).map((a: AccessibilityMetrics) => a.score));
      score += avgAccessibility * weights.accessibility;
    }

    if (data.security.size > 0) {
      const avgSecurity = stats.mean(Array.from(data.security.values()).map((s: SecurityMetrics) => s.securityScore));
      score += avgSecurity * weights.security;
    }

    return score;
  }

  private recordHistoricalMetric(key: string, value: number): void {
    const history = this.historicalData.get(key) || [];
    history.push({
      timestamp: new Date(),
      value,
    });

    if (history.length > 100) {
      history.shift();
    }

    this.historicalData.set(key, history);
  }

  private analyzeTrends(): TrendAnalysis {
    const coverageHistory = this.historicalData.get('coverage') || [];
    const coverageTrend = this.trendAnalyzer.analyzeTrend(coverageHistory);

    const performanceHistory = this.historicalData.get('performance-web') || [];
    const performanceTrend = this.trendAnalyzer.analyzeTrend(performanceHistory);

    const crashHistory = this.historicalData.get('crashes-web') || [];
    const crashTrend = this.trendAnalyzer.analyzeTrend(crashHistory);

    const anomalies: Anomaly[] = [
      ...this.trendAnalyzer.detectAnomalies(coverageHistory, Platform.WEB, 'coverage'),
      ...this.trendAnalyzer.detectAnomalies(performanceHistory, Platform.WEB, 'performance'),
      ...this.trendAnalyzer.detectAnomalies(crashHistory, Platform.WEB, 'crashes'),
    ];

    return {
      coverage: this.createTrendSummary(coverageHistory),
      performance: this.createTrendSummary(performanceHistory),
      crashes: this.createTrendSummary(crashHistory),
      accessibility: this.createTrendSummary([]),
      anomalies,
    };
  }

  private createTrendSummary(dataPoints: TrendDataPoint[]): TrendSummary {
    if (dataPoints.length === 0) {
      return {
        current: 0,
        previous: 0,
        change: 0,
        percentChange: 0,
        trend: 'stable',
        prediction: 0,
      };
    }

    const values = dataPoints.map(d => d.value);
    return this.trendAnalyzer.calculateTrendSummary(values[values.length - 1], values.slice(0, -1));
  }

  getHistoricalData(metric: string): TrendDataPoint[] {
    return this.historicalData.get(metric) || [];
  }

  clearHistoricalData(): void {
    this.historicalData.clear();
  }
}
