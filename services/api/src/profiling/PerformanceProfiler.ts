import { EventEmitter } from 'events';
import * as v8Profiler from 'v8-profiler-next';
import * as v8 from 'v8';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance, PerformanceObserver } from 'perf_hooks';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Request, Response, NextFunction } from 'express';

interface CPUProfile {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
  nodes: ProfileNode[];
}

interface ProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children: number[];
  positionTicks?: Array<{
    line: number;
    ticks: number;
  }>;
}

interface MemorySnapshot {
  id: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  filePath?: string;
}

interface MemoryLeak {
  className: string;
  growthRate: number;
  instanceCount: number;
  retainedSize: number;
  suspicionScore: number;
  snapshots: {
    before: number;
    after: number;
  };
}

interface IOProfile {
  operation: string;
  type: 'database' | 'network' | 'filesystem' | 'cache' | 'external';
  startTime: number;
  duration: number;
  metadata: Record<string, any>;
}

interface RequestProfile {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  breakdown: {
    middleware: MiddlewareTimings[];
    database: number;
    external: number;
    serialization: number;
    handler: number;
  };
  ioOperations: IOProfile[];
  cpuTime?: number;
  memoryDelta?: number;
}

interface MiddlewareTimings {
  name: string;
  duration: number;
  order: number;
}

interface PerformanceBottleneck {
  type: 'function' | 'query' | 'io' | 'algorithm';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  impact: string;
  duration: number;
  occurrences: number;
  suggestion: string;
}

interface PerformanceBudget {
  route: string;
  p50: number;
  p95: number;
  p99: number;
  maxDuration: number;
  enabled: boolean;
}

interface BudgetViolation {
  route: string;
  metric: 'p50' | 'p95' | 'p99' | 'max';
  expected: number;
  actual: number;
  timestamp: number;
}

interface ProfilingConfig {
  samplingRate: number;
  cpuProfileDuration: number;
  heapSnapshotInterval: number;
  retentionDays: number;
  s3Bucket?: string;
  s3Prefix?: string;
  enableContinuousProfiling: boolean;
  budgets: PerformanceBudget[];
}

interface GCStats {
  pauseDuration: number;
  gcType: 'scavenge' | 'mark-sweep-compact' | 'incremental';
  heapSizeBefore: number;
  heapSizeAfter: number;
  timestamp: number;
}

interface HotPath {
  functionName: string;
  url: string;
  lineNumber: number;
  cpuPercentage: number;
  selfTime: number;
  totalTime: number;
  callCount: number;
}

export class PerformanceProfiler extends EventEmitter {
  private static instance: PerformanceProfiler;
  private config: ProfilingConfig;
  private s3Client?: S3Client;
  private activeCPUProfiles: Map<string, any> = new Map();
  private heapSnapshots: MemorySnapshot[] = [];
  private requestProfiles: Map<string, RequestProfile> = new Map();
  private ioProfiles: Map<string, IOProfile[]> = new Map();
  private gcStats: GCStats[] = [];
  private performanceObserver?: PerformanceObserver;
  private samplingTimer?: NodeJS.Timer;
  private gcMonitorTimer?: NodeJS.Timer;
  private budgetViolations: BudgetViolation[] = [];
  private requestMetrics: Map<string, number[]> = new Map();

  private constructor(config: Partial<ProfilingConfig> = {}) {
    super();
    this.config = {
      samplingRate: config.samplingRate ?? 0.01,
      cpuProfileDuration: config.cpuProfileDuration ?? 60000,
      heapSnapshotInterval: config.heapSnapshotInterval ?? 300000,
      retentionDays: config.retentionDays ?? 30,
      s3Bucket: config.s3Bucket,
      s3Prefix: config.s3Prefix ?? 'profiling',
      enableContinuousProfiling: config.enableContinuousProfiling ?? true,
      budgets: config.budgets ?? []
    };

    if (this.config.s3Bucket) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }

    this.initializeMonitoring();
  }

  public static getInstance(config?: Partial<ProfilingConfig>): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler(config);
    }
    return PerformanceProfiler.instance;
  }

  private initializeMonitoring(): void {
    v8Profiler.setGenerateType(1);

    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          this.emit('performance:measure', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'function'] });

    if (this.config.enableContinuousProfiling) {
      this.startContinuousProfiling();
    }

    this.startGCMonitoring();
    this.startPeriodicSnapshots();
  }

  private startContinuousProfiling(): void {
    this.samplingTimer = setInterval(() => {
      this.performSampledProfiling().catch((error) => {
        this.emit('error', { type: 'sampling', error });
      });
    }, 60000);
  }

  private async performSampledProfiling(): Promise<void> {
    const shouldSample = Math.random() < this.config.samplingRate;
    if (!shouldSample) return;

    const profileId = `sampled-${Date.now()}`;
    await this.startCPUProfile(profileId);

    setTimeout(async () => {
      const profile = await this.stopCPUProfile(profileId);
      if (profile) {
        await this.analyzeProfile(profile);
      }
    }, 10000);
  }

  private startGCMonitoring(): void {
    const gcPerfObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'gc') {
          const gcEntry = entry as any;
          this.gcStats.push({
            pauseDuration: entry.duration,
            gcType: this.getGCType(gcEntry.kind),
            heapSizeBefore: 0,
            heapSizeAfter: 0,
            timestamp: Date.now()
          });

          if (this.gcStats.length > 1000) {
            this.gcStats = this.gcStats.slice(-1000);
          }

          if (entry.duration > 100) {
            this.emit('gc:long-pause', {
              duration: entry.duration,
              type: this.getGCType(gcEntry.kind)
            });
          }
        }
      }
    });

    gcPerfObserver.observe({ entryTypes: ['gc'] });
  }

  private getGCType(kind: number): 'scavenge' | 'mark-sweep-compact' | 'incremental' {
    if (kind === 1 || kind === 2) return 'scavenge';
    if (kind === 4 || kind === 8) return 'mark-sweep-compact';
    return 'incremental';
  }

  private startPeriodicSnapshots(): void {
    setInterval(async () => {
      await this.captureHeapSnapshot();
      await this.detectMemoryLeaks();
    }, this.config.heapSnapshotInterval);
  }

  public async startCPUProfile(profileId: string, title?: string): Promise<void> {
    if (this.activeCPUProfiles.has(profileId)) {
      throw new Error(`CPU profile ${profileId} is already running`);
    }

    const profileTitle = title || profileId;
    v8Profiler.startProfiling(profileTitle, true);

    this.activeCPUProfiles.set(profileId, {
      title: profileTitle,
      startTime: Date.now()
    });

    this.emit('profile:started', { profileId, type: 'cpu' });
  }

  public async stopCPUProfile(profileId: string): Promise<CPUProfile | null> {
    const profileInfo = this.activeCPUProfiles.get(profileId);
    if (!profileInfo) {
      return null;
    }

    const profile = v8Profiler.stopProfiling(profileInfo.title);
    this.activeCPUProfiles.delete(profileId);

    const cpuProfile: CPUProfile = {
      id: profileId,
      title: profileInfo.title,
      startTime: profileInfo.startTime,
      endTime: Date.now(),
      samples: (profile as any).samples || [],
      timeDeltas: (profile as any).timeDeltas || [],
      nodes: this.convertProfileNodes((profile as any).head)
    };

    await this.exportProfile(cpuProfile);
    profile.delete();

    this.emit('profile:completed', { profileId, type: 'cpu' });

    return cpuProfile;
  }

  private convertProfileNodes(node: any): ProfileNode[] {
    const nodes: ProfileNode[] = [];
    const queue = [{ node, id: 1 }];
    let currentId = 1;

    while (queue.length > 0) {
      const { node: current, id } = queue.shift()!;

      const profileNode: ProfileNode = {
        id,
        callFrame: {
          functionName: current.functionName || '(anonymous)',
          scriptId: current.scriptId?.toString() || '0',
          url: current.url || '',
          lineNumber: current.lineNumber || 0,
          columnNumber: current.columnNumber || 0
        },
        hitCount: current.hitCount || 0,
        children: []
      };

      if (current.children) {
        for (const child of current.children) {
          currentId++;
          profileNode.children.push(currentId);
          queue.push({ node: child, id: currentId });
        }
      }

      nodes.push(profileNode);
    }

    return nodes;
  }

  private async exportProfile(profile: CPUProfile): Promise<void> {
    const fileName = `${profile.id}.cpuprofile`;
    const localPath = path.join('/tmp', fileName);

    await fs.writeFile(localPath, JSON.stringify(profile, null, 2));

    if (this.s3Client && this.config.s3Bucket) {
      const key = `${this.config.s3Prefix}/cpu-profiles/${fileName}`;
      const fileContent = await fs.readFile(localPath);

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/json',
        Metadata: {
          type: 'cpu-profile',
          startTime: profile.startTime.toString(),
          endTime: profile.endTime.toString()
        }
      }));

      this.emit('profile:exported', { profileId: profile.id, location: `s3://${this.config.s3Bucket}/${key}` });
    }
  }

  public async analyzeProfile(profile: CPUProfile): Promise<{
    hotPaths: HotPath[];
    bottlenecks: PerformanceBottleneck[];
  }> {
    const hotPaths = this.detectHotPaths(profile);
    const bottlenecks = this.detectBottlenecks(profile, hotPaths);

    this.emit('profile:analyzed', { profileId: profile.id, hotPaths, bottlenecks });

    return { hotPaths, bottlenecks };
  }

  private detectHotPaths(profile: CPUProfile): HotPath[] {
    const totalSamples = profile.samples.length;
    const functionStats = new Map<string, {
      node: ProfileNode;
      selfTime: number;
      totalTime: number;
      count: number;
    }>();

    for (const node of profile.nodes) {
      const key = `${node.callFrame.functionName}:${node.callFrame.url}:${node.callFrame.lineNumber}`;
      const existing = functionStats.get(key) || {
        node,
        selfTime: 0,
        totalTime: 0,
        count: 0
      };

      existing.selfTime += node.hitCount;
      existing.count++;
      functionStats.set(key, existing);
    }

    const hotPaths: HotPath[] = [];

    for (const [key, stats] of functionStats.entries()) {
      const cpuPercentage = (stats.selfTime / totalSamples) * 100;

      if (cpuPercentage >= 10) {
        hotPaths.push({
          functionName: stats.node.callFrame.functionName,
          url: stats.node.callFrame.url,
          lineNumber: stats.node.callFrame.lineNumber,
          cpuPercentage,
          selfTime: stats.selfTime,
          totalTime: stats.totalTime,
          callCount: stats.count
        });
      }
    }

    return hotPaths.sort((a, b) => b.cpuPercentage - a.cpuPercentage);
  }

  private detectBottlenecks(profile: CPUProfile, hotPaths: HotPath[]): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    for (const hotPath of hotPaths) {
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (hotPath.cpuPercentage >= 30) severity = 'critical';
      else if (hotPath.cpuPercentage >= 20) severity = 'high';
      else if (hotPath.cpuPercentage >= 10) severity = 'medium';

      bottlenecks.push({
        type: 'function',
        severity,
        location: `${hotPath.url}:${hotPath.lineNumber}`,
        description: `Function ${hotPath.functionName} consuming ${hotPath.cpuPercentage.toFixed(2)}% CPU`,
        impact: `High CPU usage affecting overall performance`,
        duration: hotPath.selfTime,
        occurrences: hotPath.callCount,
        suggestion: this.getSuggestion(hotPath)
      });
    }

    return bottlenecks;
  }

  private getSuggestion(hotPath: HotPath): string {
    if (hotPath.functionName.includes('JSON.parse') || hotPath.functionName.includes('JSON.stringify')) {
      return 'Consider using streaming JSON parser or caching serialization results';
    }
    if (hotPath.functionName.includes('sort')) {
      return 'Verify sort algorithm complexity, consider pre-sorting or using indexed data structures';
    }
    if (hotPath.functionName.includes('map') || hotPath.functionName.includes('filter')) {
      return 'Consider combining operations or using for loops for better performance';
    }
    return 'Review function implementation for optimization opportunities';
  }

  public async captureHeapSnapshot(): Promise<MemorySnapshot> {
    const snapshotId = `heap-${Date.now()}`;
    const fileName = `${snapshotId}.heapsnapshot`;
    const filePath = path.join('/tmp', fileName);

    v8.writeHeapSnapshot(filePath);

    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      filePath
    };

    this.heapSnapshots.push(snapshot);

    if (this.heapSnapshots.length > 10) {
      const oldSnapshot = this.heapSnapshots.shift()!;
      if (oldSnapshot.filePath) {
        await fs.unlink(oldSnapshot.filePath).catch(() => {});
      }
    }

    if (this.s3Client && this.config.s3Bucket) {
      const key = `${this.config.s3Prefix}/heap-snapshots/${fileName}`;
      const fileContent = await fs.readFile(filePath);

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/json',
        Metadata: {
          type: 'heap-snapshot',
          timestamp: snapshot.timestamp.toString(),
          heapUsed: snapshot.heapUsed.toString()
        }
      }));
    }

    this.emit('snapshot:captured', snapshot);

    return snapshot;
  }

  public async detectMemoryLeaks(): Promise<MemoryLeak[]> {
    if (this.heapSnapshots.length < 2) {
      return [];
    }

    const leaks: MemoryLeak[] = [];
    const recent = this.heapSnapshots.slice(-3);

    for (let i = 1; i < recent.length; i++) {
      const before = recent[i - 1];
      const after = recent[i];

      const heapGrowth = after.heapUsed - before.heapUsed;
      const growthRate = heapGrowth / before.heapUsed;

      if (growthRate > 0.1) {
        leaks.push({
          className: 'Unknown',
          growthRate,
          instanceCount: 0,
          retainedSize: heapGrowth,
          suspicionScore: Math.min(growthRate * 10, 10),
          snapshots: {
            before: before.heapUsed,
            after: after.heapUsed
          }
        });
      }
    }

    if (leaks.length > 0) {
      this.emit('memory:leak-detected', leaks);
    }

    return leaks;
  }

  public trackIOOperation(
    operation: string,
    type: IOProfile['type'],
    metadata: Record<string, any> = {}
  ): () => void {
    const startTime = performance.now();
    const requestId = (metadata.requestId as string) || 'global';

    return () => {
      const duration = performance.now() - startTime;
      const ioProfile: IOProfile = {
        operation,
        type,
        startTime,
        duration,
        metadata
      };

      const profiles = this.ioProfiles.get(requestId) || [];
      profiles.push(ioProfile);
      this.ioProfiles.set(requestId, profiles);

      if (duration > 1000) {
        this.emit('io:slow-operation', {
          operation,
          type,
          duration,
          metadata
        });
      }

      setTimeout(() => {
        this.ioProfiles.delete(requestId);
      }, 60000);
    };
  }

  public profilingMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const shouldProfile = Math.random() < this.config.samplingRate;
      if (!shouldProfile) {
        return next();
      }

      const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
      const startTime = performance.now();
      const middlewareTimings: MiddlewareTimings[] = [];
      let middlewareIndex = 0;

      const requestProfile: RequestProfile = {
        requestId,
        method: req.method,
        path: req.path,
        startTime,
        endTime: 0,
        totalDuration: 0,
        breakdown: {
          middleware: [],
          database: 0,
          external: 0,
          serialization: 0,
          handler: 0
        },
        ioOperations: []
      };

      this.requestProfiles.set(requestId, requestProfile);

      const originalNext = next;
      const trackedNext = () => {
        const duration = performance.now() - startTime;
        middlewareTimings.push({
          name: `middleware-${middlewareIndex}`,
          duration,
          order: middlewareIndex++
        });
        originalNext();
      };

      res.on('finish', () => {
        requestProfile.endTime = performance.now();
        requestProfile.totalDuration = requestProfile.endTime - requestProfile.startTime;
        requestProfile.breakdown.middleware = middlewareTimings;

        const ioOps = this.ioProfiles.get(requestId) || [];
        requestProfile.ioOperations = ioOps;

        requestProfile.breakdown.database = ioOps
          .filter((op) => op.type === 'database')
          .reduce((sum, op) => sum + op.duration, 0);

        requestProfile.breakdown.external = ioOps
          .filter((op) => op.type === 'external')
          .reduce((sum, op) => sum + op.duration, 0);

        this.checkPerformanceBudget(requestProfile);
        this.emit('request:profiled', requestProfile);

        setTimeout(() => {
          this.requestProfiles.delete(requestId);
        }, 300000);
      });

      trackedNext();
    };
  }

  private checkPerformanceBudget(profile: RequestProfile): void {
    const budget = this.config.budgets.find((b) =>
      profile.path.match(new RegExp(b.route))
    );

    if (!budget || !budget.enabled) {
      return;
    }

    const routeMetrics = this.requestMetrics.get(budget.route) || [];
    routeMetrics.push(profile.totalDuration);

    if (routeMetrics.length > 100) {
      routeMetrics.shift();
    }

    this.requestMetrics.set(budget.route, routeMetrics);

    const sorted = [...routeMetrics].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    const violations: BudgetViolation[] = [];

    if (p50 > budget.p50) {
      violations.push({
        route: budget.route,
        metric: 'p50',
        expected: budget.p50,
        actual: p50,
        timestamp: Date.now()
      });
    }

    if (p95 > budget.p95) {
      violations.push({
        route: budget.route,
        metric: 'p95',
        expected: budget.p95,
        actual: p95,
        timestamp: Date.now()
      });
    }

    if (p99 > budget.p99) {
      violations.push({
        route: budget.route,
        metric: 'p99',
        expected: budget.p99,
        actual: p99,
        timestamp: Date.now()
      });
    }

    if (profile.totalDuration > budget.maxDuration) {
      violations.push({
        route: budget.route,
        metric: 'max',
        expected: budget.maxDuration,
        actual: profile.totalDuration,
        timestamp: Date.now()
      });
    }

    if (violations.length > 0) {
      this.budgetViolations.push(...violations);
      this.emit('budget:violation', violations);
    }
  }

  public async detectNPlusOneQueries(requestId: string): Promise<PerformanceBottleneck[]> {
    const profile = this.requestProfiles.get(requestId);
    if (!profile) {
      return [];
    }

    const dbOperations = profile.ioOperations.filter((op) => op.type === 'database');
    const bottlenecks: PerformanceBottleneck[] = [];

    const queryPatterns = new Map<string, IOProfile[]>();
    for (const op of dbOperations) {
      const pattern = this.normalizeQuery(op.metadata.query || '');
      const existing = queryPatterns.get(pattern) || [];
      existing.push(op);
      queryPatterns.set(pattern, existing);
    }

    for (const [pattern, operations] of queryPatterns.entries()) {
      if (operations.length > 10) {
        const totalDuration = operations.reduce((sum, op) => sum + op.duration, 0);

        bottlenecks.push({
          type: 'query',
          severity: operations.length > 50 ? 'critical' : 'high',
          location: profile.path,
          description: `N+1 query detected: ${operations.length} similar queries`,
          impact: `${totalDuration.toFixed(2)}ms wasted on repeated queries`,
          duration: totalDuration,
          occurrences: operations.length,
          suggestion: 'Use eager loading or batch queries to eliminate N+1 pattern'
        });
      }
    }

    return bottlenecks;
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public async detectBlockingOperations(profile: CPUProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    const blockingPatterns = [
      'readFileSync',
      'writeFileSync',
      'execSync',
      'readdirSync',
      'statSync',
      'createHash'
    ];

    for (const node of profile.nodes) {
      const functionName = node.callFrame.functionName;

      for (const pattern of blockingPatterns) {
        if (functionName.includes(pattern)) {
          bottlenecks.push({
            type: 'io',
            severity: 'high',
            location: `${node.callFrame.url}:${node.callFrame.lineNumber}`,
            description: `Blocking operation detected: ${functionName}`,
            impact: 'Synchronous I/O blocking event loop',
            duration: node.hitCount,
            occurrences: 1,
            suggestion: `Replace ${pattern} with async version: ${pattern.replace('Sync', '')}`
          });
        }
      }
    }

    return bottlenecks;
  }

  public setBudget(budget: PerformanceBudget): void {
    const existingIndex = this.config.budgets.findIndex((b) => b.route === budget.route);
    if (existingIndex >= 0) {
      this.config.budgets[existingIndex] = budget;
    } else {
      this.config.budgets.push(budget);
    }
    this.emit('budget:updated', budget);
  }

  public getBudgetViolations(since?: number): BudgetViolation[] {
    if (since) {
      return this.budgetViolations.filter((v) => v.timestamp >= since);
    }
    return this.budgetViolations;
  }

  public getRequestProfile(requestId: string): RequestProfile | undefined {
    return this.requestProfiles.get(requestId);
  }

  public getGCStats(since?: number): GCStats[] {
    if (since) {
      return this.gcStats.filter((stat) => stat.timestamp >= since);
    }
    return this.gcStats;
  }

  public getMemorySnapshots(): MemorySnapshot[] {
    return this.heapSnapshots;
  }

  public async generatePerformanceReport(): Promise<{
    summary: {
      totalRequests: number;
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      totalGCPauses: number;
      avgGCPause: number;
      memoryLeaks: number;
    };
    topBottlenecks: PerformanceBottleneck[];
    budgetViolations: BudgetViolation[];
  }> {
    const allDurations: number[] = [];
    for (const durations of this.requestMetrics.values()) {
      allDurations.push(...durations);
    }

    const sorted = allDurations.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const avg = allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length || 0;

    const gcPauses = this.gcStats.map((s) => s.pauseDuration);
    const avgGCPause = gcPauses.reduce((sum, p) => sum + p, 0) / gcPauses.length || 0;

    const memoryLeaks = await this.detectMemoryLeaks();

    return {
      summary: {
        totalRequests: allDurations.length,
        avgResponseTime: avg,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
        totalGCPauses: this.gcStats.length,
        avgGCPause,
        memoryLeaks: memoryLeaks.length
      },
      topBottlenecks: [],
      budgetViolations: this.getBudgetViolations(Date.now() - 86400000)
    };
  }

  public async exportToSpeedscope(profile: CPUProfile): Promise<string> {
    const speedscopeFormat = {
      $schema: 'https://www.speedscope.app/file-format-schema.json',
      shared: {
        frames: profile.nodes.map((node) => ({
          name: node.callFrame.functionName,
          file: node.callFrame.url,
          line: node.callFrame.lineNumber,
          col: node.callFrame.columnNumber
        }))
      },
      profiles: [
        {
          type: 'sampled',
          name: profile.title,
          unit: 'microseconds',
          startValue: profile.startTime,
          endValue: profile.endTime,
          samples: profile.samples,
          weights: profile.timeDeltas
        }
      ],
      name: profile.title,
      activeProfileIndex: 0,
      exporter: 'UpCoach Performance Profiler'
    };

    const fileName = `${profile.id}.speedscope.json`;
    const filePath = path.join('/tmp', fileName);
    await fs.writeFile(filePath, JSON.stringify(speedscopeFormat, null, 2));

    if (this.s3Client && this.config.s3Bucket) {
      const key = `${this.config.s3Prefix}/speedscope/${fileName}`;
      const fileContent = await fs.readFile(filePath);

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/json'
      }));

      return `s3://${this.config.s3Bucket}/${key}`;
    }

    return filePath;
  }

  public async cleanup(): Promise<void> {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
    }

    if (this.gcMonitorTimer) {
      clearInterval(this.gcMonitorTimer);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    for (const [profileId] of this.activeCPUProfiles) {
      await this.stopCPUProfile(profileId);
    }

    for (const snapshot of this.heapSnapshots) {
      if (snapshot.filePath) {
        await fs.unlink(snapshot.filePath).catch(() => {});
      }
    }

    this.emit('profiler:shutdown');
  }
}

export default PerformanceProfiler;
