import { EventEmitter } from 'events';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  CompositePropagator,
  W3CBaggagePropagator
} from '@opentelemetry/core';
import {
  Tracer,
  Span,
  SpanKind,
  SpanStatusCode,
  Context,
  context,
  trace,
  propagation,
  Baggage,
  baggageUtils
} from '@opentelemetry/api';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor
} from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import * as winston from 'winston';

interface TraceConfig {
  serviceName: string;
  environment: string;
  samplingRate: number;
  jaegerEndpoint?: string;
  zipkinEndpoint?: string;
  awsXRayEnabled: boolean;
  enableAutoInstrumentation: boolean;
}

interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTime: number;
  endTime: number;
  duration: number;
  attributes: Record<string, any>;
  events: SpanEvent[];
  status: {
    code: string;
    message?: string;
  };
  links: SpanLink[];
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, any>;
}

interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, any>;
}

interface TraceData {
  traceId: string;
  startTime: number;
  endTime: number;
  duration: number;
  spans: SpanData[];
  rootSpan?: SpanData;
  serviceName: string;
  environment: string;
}

interface ServiceDependency {
  source: string;
  target: string;
  callCount: number;
  totalLatency: number;
  avgLatency: number;
  errorCount: number;
  errorRate: number;
}

interface ServiceMetrics {
  serviceName: string;
  requestCount: number;
  errorCount: number;
  totalLatency: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

interface CriticalPath {
  spans: SpanData[];
  totalDuration: number;
  percentage: number;
}

interface TraceComparison {
  traceA: TraceData;
  traceB: TraceData;
  durationDiff: number;
  durationDiffPercent: number;
  spanCountDiff: number;
  slowestSpanDiff: {
    spanName: string;
    diffMs: number;
    diffPercent: number;
  }[];
}

interface SamplingDecision {
  sampled: boolean;
  reason: string;
  strategy: 'probability' | 'rate-limit' | 'error-based' | 'latency-based' | 'always';
}

interface DistributedContext {
  traceId: string;
  spanId: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  metadata: Record<string, string>;
}

export class RequestTracer extends EventEmitter {
  private static instance: RequestTracer;
  private config: TraceConfig;
  private sdk?: NodeSDK;
  private tracer!: Tracer;
  private activeSpans: Map<string, Span> = new Map();
  private completedTraces: Map<string, TraceData> = new Map();
  private serviceDependencies: Map<string, ServiceDependency> = new Map();
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private requestCounter = 0;
  private lastResetTime = Date.now();
  private logger: winston.Logger;

  private constructor(config: Partial<TraceConfig> = {}) {
    super();
    this.config = {
      serviceName: config.serviceName || 'upcoach-api',
      environment: config.environment || process.env.NODE_ENV || 'development',
      samplingRate: config.samplingRate ?? (process.env.NODE_ENV === 'production' ? 0.01 : 1.0),
      jaegerEndpoint: config.jaegerEndpoint || process.env.JAEGER_ENDPOINT,
      zipkinEndpoint: config.zipkinEndpoint,
      awsXRayEnabled: config.awsXRayEnabled ?? false,
      enableAutoInstrumentation: config.enableAutoInstrumentation ?? true
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });

    this.initializeTracing();
  }

  public static getInstance(config?: Partial<TraceConfig>): RequestTracer {
    if (!RequestTracer.instance) {
      RequestTracer.instance = new RequestTracer(config);
    }
    return RequestTracer.instance;
  }

  private initializeTracing(): void {
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0'
    });

    const exporters = [];

    if (this.config.jaegerEndpoint) {
      exporters.push(new JaegerExporter({
        endpoint: this.config.jaegerEndpoint
      }));
    }

    if (this.config.zipkinEndpoint) {
      exporters.push(new ZipkinExporter({
        url: this.config.zipkinEndpoint
      }));
    }

    if (exporters.length === 0) {
      exporters.push(new ConsoleSpanExporter());
    }

    const spanProcessors = exporters.map(exporter =>
      new BatchSpanProcessor(exporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000
      })
    );

    const propagators = [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator()
    ];

    if (this.config.awsXRayEnabled) {
      propagators.push(new AWSXRayPropagator());
    }

    const instrumentations = this.config.enableAutoInstrumentation
      ? getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false
          }
        })
      : [
          new ExpressInstrumentation(),
          new HttpInstrumentation({
            requestHook: (span, request) => {
              span.setAttribute('http.user_agent', request.headers?.['user-agent'] || 'unknown');
            }
          }),
          new RedisInstrumentation(),
          new IORedisInstrumentation(),
          new KafkaJsInstrumentation()
        ];

    this.sdk = new NodeSDK({
      resource,
      spanProcessors,
      textMapPropagator: new CompositePropagator({
        propagators
      }),
      instrumentations,
      ...(this.config.awsXRayEnabled && {
        idGenerator: new AWSXRayIdGenerator()
      })
    });

    this.sdk.start();

    this.tracer = trace.getTracer(this.config.serviceName, '1.0.0');

    process.on('SIGTERM', async () => {
      await this.shutdown();
    });
  }

  public tracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const samplingDecision = this.shouldSample(req);

      if (!samplingDecision.sampled) {
        return next();
      }

      const spanName = `${req.method} ${req.route?.path || req.path}`;
      const span = this.tracer.startSpan(spanName, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.path': req.path,
          'http.route': req.route?.path || req.path,
          'http.user_agent': req.get('user-agent') || 'unknown',
          'http.client_ip': req.ip,
          'sampling.strategy': samplingDecision.strategy,
          'sampling.reason': samplingDecision.reason
        }
      });

      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;

      (req as any).traceId = traceId;
      (req as any).spanId = spanId;
      (req as any).span = span;

      this.activeSpans.set(traceId, span);

      const baggage = propagation.getBaggage(context.active());
      if (baggage) {
        const userId = baggage.getEntry('user_id')?.value;
        const tenantId = baggage.getEntry('tenant_id')?.value;
        const sessionId = baggage.getEntry('session_id')?.value;

        if (userId) span.setAttribute('user.id', userId);
        if (tenantId) span.setAttribute('tenant.id', tenantId);
        if (sessionId) span.setAttribute('session.id', sessionId);
      }

      if ((req as any).user?.id) {
        span.setAttribute('user.id', (req as any).user.id);
        this.setBaggageItem('user_id', (req as any).user.id.toString());
      }

      this.logger.info('Request started', {
        traceId,
        spanId,
        method: req.method,
        path: req.path
      });

      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        span.setAttribute('http.status_code', res.statusCode);
        span.setAttribute('http.response_time_ms', duration);

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`
          });
          span.recordException(new Error(`HTTP ${res.statusCode}`));
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        this.activeSpans.delete(traceId);

        this.recordTraceCompletion(span, req, res, duration);

        this.logger.info('Request completed', {
          traceId,
          spanId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        });
      });

      next();
    };
  }

  private shouldSample(req: Request): SamplingDecision {
    if (this.config.environment !== 'production') {
      return { sampled: true, reason: 'Non-production environment', strategy: 'always' };
    }

    if (this.requestCounter / ((Date.now() - this.lastResetTime) / 1000) > 100) {
      return { sampled: false, reason: 'Rate limit exceeded', strategy: 'rate-limit' };
    }

    if (Math.random() < this.config.samplingRate) {
      this.requestCounter++;
      return { sampled: true, reason: 'Probability-based sampling', strategy: 'probability' };
    }

    return { sampled: false, reason: 'Not selected by sampling', strategy: 'probability' };
  }

  public startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
      parentSpan?: Span;
    } = {}
  ): Span {
    const { kind = SpanKind.INTERNAL, attributes = {}, parentSpan } = options;

    const spanOptions: any = {
      kind,
      attributes
    };

    let span: Span;
    if (parentSpan) {
      const ctx = trace.setSpan(context.active(), parentSpan);
      span = this.tracer.startSpan(name, spanOptions, ctx);
    } else {
      span = this.tracer.startSpan(name, spanOptions);
    }

    return span;
  }

  public async traceAsyncOperation<T>(
    name: string,
    operation: (span: Span) => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const span = this.startSpan(name, { attributes });

    try {
      const result = await operation(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  public traceDatabaseQuery(
    query: string,
    database: string = 'default',
    attributes: Record<string, any> = {}
  ): () => void {
    const span = this.startSpan('database.query', {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.name': database,
        'db.statement': this.sanitizeQuery(query),
        ...attributes
      }
    });

    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      span.setAttribute('db.query_time_ms', duration);
      span.end();

      if (duration > 1000) {
        this.emit('trace:slow-query', {
          query: this.sanitizeQuery(query),
          duration,
          database
        });
      }
    };
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 500);
  }

  public traceExternalCall(
    service: string,
    endpoint: string,
    method: string = 'GET',
    attributes: Record<string, any> = {}
  ): () => void {
    const span = this.startSpan(`external.${service}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': endpoint,
        'peer.service': service,
        ...attributes
      }
    });

    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      span.setAttribute('http.response_time_ms', duration);
      span.end();

      this.recordServiceDependency(this.config.serviceName, service, duration, false);
    };
  }

  public traceCacheOperation(
    operation: 'get' | 'set' | 'delete',
    key: string,
    hit?: boolean,
    ttl?: number
  ): () => void {
    const span = this.startSpan(`cache.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'cache.operation': operation,
        'cache.key': key,
        ...(hit !== undefined && { 'cache.hit': hit }),
        ...(ttl !== undefined && { 'cache.ttl': ttl })
      }
    });

    return () => {
      span.end();
    };
  }

  private recordTraceCompletion(
    span: Span,
    req: Request,
    res: Response,
    duration: number
  ): void {
    const spanContext = span.spanContext();
    const traceId = spanContext.traceId;

    const spanData: SpanData = {
      traceId,
      spanId: spanContext.spanId,
      name: `${req.method} ${req.path}`,
      kind: 'SERVER',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      attributes: {
        'http.method': req.method,
        'http.path': req.path,
        'http.status_code': res.statusCode
      },
      events: [],
      status: {
        code: res.statusCode >= 400 ? 'ERROR' : 'OK'
      },
      links: []
    };

    const traceData: TraceData = {
      traceId,
      startTime: spanData.startTime,
      endTime: spanData.endTime,
      duration,
      spans: [spanData],
      rootSpan: spanData,
      serviceName: this.config.serviceName,
      environment: this.config.environment
    };

    this.completedTraces.set(traceId, traceData);

    if (this.completedTraces.size > 1000) {
      const oldestKey = this.completedTraces.keys().next().value;
      this.completedTraces.delete(oldestKey);
    }

    this.updateServiceMetrics(this.config.serviceName, duration, res.statusCode >= 400);

    if (duration > 1000) {
      this.emit('trace:slow-request', {
        traceId,
        path: req.path,
        duration
      });
    }
  }

  private recordServiceDependency(
    source: string,
    target: string,
    latency: number,
    isError: boolean
  ): void {
    const key = `${source}->${target}`;
    const existing = this.serviceDependencies.get(key) || {
      source,
      target,
      callCount: 0,
      totalLatency: 0,
      avgLatency: 0,
      errorCount: 0,
      errorRate: 0
    };

    existing.callCount++;
    existing.totalLatency += latency;
    existing.avgLatency = existing.totalLatency / existing.callCount;

    if (isError) {
      existing.errorCount++;
    }

    existing.errorRate = existing.errorCount / existing.callCount;

    this.serviceDependencies.set(key, existing);
  }

  private updateServiceMetrics(
    serviceName: string,
    latency: number,
    isError: boolean
  ): void {
    const existing = this.serviceMetrics.get(serviceName) || {
      serviceName,
      requestCount: 0,
      errorCount: 0,
      totalLatency: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0
    };

    existing.requestCount++;
    existing.totalLatency += latency;
    existing.avgLatency = existing.totalLatency / existing.requestCount;

    if (isError) {
      existing.errorCount++;
    }

    this.serviceMetrics.set(serviceName, existing);
  }

  public setBaggageItem(key: string, value: string): void {
    const currentBaggage = propagation.getBaggage(context.active()) || propagation.createBaggage();
    const newBaggage = currentBaggage.setEntry(key, { value });
    const newContext = propagation.setBaggage(context.active(), newBaggage);
    context.with(newContext, () => {});
  }

  public getBaggageItem(key: string): string | undefined {
    const baggage = propagation.getBaggage(context.active());
    return baggage?.getEntry(key)?.value;
  }

  public getDistributedContext(req: Request): DistributedContext | null {
    const traceId = (req as any).traceId;
    const spanId = (req as any).spanId;

    if (!traceId || !spanId) {
      return null;
    }

    return {
      traceId,
      spanId,
      userId: this.getBaggageItem('user_id'),
      tenantId: this.getBaggageItem('tenant_id'),
      sessionId: this.getBaggageItem('session_id'),
      metadata: {}
    };
  }

  public injectContextIntoHeaders(headers: Record<string, string>): void {
    propagation.inject(context.active(), headers);
  }

  public extractContextFromHeaders(headers: Record<string, string>): Context {
    return propagation.extract(context.active(), headers);
  }

  public async getTrace(traceId: string): Promise<TraceData | null> {
    const trace = this.completedTraces.get(traceId);
    if (trace) {
      return trace;
    }

    if (this.config.jaegerEndpoint) {
      try {
        const jaegerHost = new URL(this.config.jaegerEndpoint).hostname;
        const response = await axios.get(
          `http://${jaegerHost}:16686/api/traces/${traceId}`
        );
        return this.convertJaegerTrace(response.data);
      } catch (error) {
        this.logger.error('Failed to fetch trace from Jaeger', { traceId, error });
      }
    }

    return null;
  }

  private convertJaegerTrace(jaegerData: any): TraceData | null {
    if (!jaegerData.data || jaegerData.data.length === 0) {
      return null;
    }

    const trace = jaegerData.data[0];
    const spans: SpanData[] = trace.spans.map((span: any) => ({
      traceId: span.traceID,
      spanId: span.spanID,
      parentSpanId: span.references?.[0]?.spanID,
      name: span.operationName,
      kind: this.determineSpanKind(span.tags),
      startTime: span.startTime / 1000,
      endTime: (span.startTime + span.duration) / 1000,
      duration: span.duration / 1000,
      attributes: this.convertTags(span.tags),
      events: span.logs?.map((log: any) => ({
        name: log.fields.find((f: any) => f.key === 'event')?.value || 'log',
        timestamp: log.timestamp / 1000,
        attributes: this.convertTags(log.fields)
      })) || [],
      status: {
        code: this.determineStatus(span.tags)
      },
      links: []
    }));

    const rootSpan = spans.find(s => !s.parentSpanId);
    const startTime = Math.min(...spans.map(s => s.startTime));
    const endTime = Math.max(...spans.map(s => s.endTime));

    return {
      traceId: trace.traceID,
      startTime,
      endTime,
      duration: endTime - startTime,
      spans,
      rootSpan,
      serviceName: trace.processes[trace.spans[0].processID]?.serviceName || 'unknown',
      environment: this.config.environment
    };
  }

  private determineSpanKind(tags: any[]): string {
    const kindTag = tags.find(t => t.key === 'span.kind');
    return kindTag?.value || 'INTERNAL';
  }

  private determineStatus(tags: any[]): string {
    const errorTag = tags.find(t => t.key === 'error');
    return errorTag?.value ? 'ERROR' : 'OK';
  }

  private convertTags(tags: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const tag of tags) {
      result[tag.key] = tag.value;
    }
    return result;
  }

  public async searchTraces(filters: {
    serviceName?: string;
    operation?: string;
    minDuration?: number;
    maxDuration?: number;
    tags?: Record<string, string>;
    limit?: number;
  }): Promise<TraceData[]> {
    const results: TraceData[] = [];

    for (const trace of this.completedTraces.values()) {
      if (filters.serviceName && trace.serviceName !== filters.serviceName) {
        continue;
      }

      if (filters.minDuration && trace.duration < filters.minDuration) {
        continue;
      }

      if (filters.maxDuration && trace.duration > filters.maxDuration) {
        continue;
      }

      if (filters.operation) {
        const hasOperation = trace.spans.some(s =>
          s.name.includes(filters.operation!)
        );
        if (!hasOperation) continue;
      }

      results.push(trace);

      if (filters.limit && results.length >= filters.limit) {
        break;
      }
    }

    return results.sort((a, b) => b.startTime - a.startTime);
  }

  public findSlowestSpans(trace: TraceData, limit: number = 5): SpanData[] {
    return [...trace.spans]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  public calculateCriticalPath(trace: TraceData): CriticalPath {
    const spanMap = new Map<string, SpanData>();
    for (const span of trace.spans) {
      spanMap.set(span.spanId, span);
    }

    const criticalPathSpans: SpanData[] = [];
    let currentSpan = trace.rootSpan;

    while (currentSpan) {
      criticalPathSpans.push(currentSpan);

      const children = trace.spans.filter(s => s.parentSpanId === currentSpan!.spanId);
      if (children.length === 0) break;

      currentSpan = children.reduce((longest, span) =>
        span.duration > longest.duration ? span : longest
      );
    }

    const totalDuration = criticalPathSpans.reduce((sum, span) => sum + span.duration, 0);
    const percentage = (totalDuration / trace.duration) * 100;

    return {
      spans: criticalPathSpans,
      totalDuration,
      percentage
    };
  }

  public compareTraces(traceIdA: string, traceIdB: string): TraceComparison | null {
    const traceA = this.completedTraces.get(traceIdA);
    const traceB = this.completedTraces.get(traceIdB);

    if (!traceA || !traceB) {
      return null;
    }

    const durationDiff = traceB.duration - traceA.duration;
    const durationDiffPercent = (durationDiff / traceA.duration) * 100;

    const spansByName = new Map<string, { a: SpanData; b: SpanData }>();

    for (const spanA of traceA.spans) {
      const matchingSpanB = traceB.spans.find(s => s.name === spanA.name);
      if (matchingSpanB) {
        spansByName.set(spanA.name, { a: spanA, b: matchingSpanB });
      }
    }

    const slowestSpanDiff = Array.from(spansByName.entries())
      .map(([name, spans]) => ({
        spanName: name,
        diffMs: spans.b.duration - spans.a.duration,
        diffPercent: ((spans.b.duration - spans.a.duration) / spans.a.duration) * 100
      }))
      .sort((a, b) => Math.abs(b.diffMs) - Math.abs(a.diffMs))
      .slice(0, 5);

    return {
      traceA,
      traceB,
      durationDiff,
      durationDiffPercent,
      spanCountDiff: traceB.spans.length - traceA.spans.length,
      slowestSpanDiff
    };
  }

  public detectLatencyRegression(
    baselineTraceId: string,
    currentTraceId: string,
    threshold: number = 0.2
  ): {
    hasRegression: boolean;
    percentage: number;
    comparison: TraceComparison | null;
  } {
    const comparison = this.compareTraces(baselineTraceId, currentTraceId);

    if (!comparison) {
      return { hasRegression: false, percentage: 0, comparison: null };
    }

    const hasRegression = comparison.durationDiffPercent > threshold * 100;

    return {
      hasRegression,
      percentage: comparison.durationDiffPercent,
      comparison
    };
  }

  public getServiceDependencyGraph(): ServiceDependency[] {
    return Array.from(this.serviceDependencies.values());
  }

  public getServiceMetrics(serviceName?: string): ServiceMetrics[] {
    if (serviceName) {
      const metrics = this.serviceMetrics.get(serviceName);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.serviceMetrics.values());
  }

  public createCorrelatedLogger(req: Request): winston.Logger {
    const traceId = (req as any).traceId;
    const spanId = (req as any).spanId;

    return this.logger.child({
      traceId,
      spanId,
      userId: this.getBaggageItem('user_id'),
      tenantId: this.getBaggageItem('tenant_id')
    });
  }

  public injectTraceContext(log: Record<string, any>): Record<string, any> {
    const activeSpan = trace.getSpan(context.active());
    if (!activeSpan) {
      return log;
    }

    const spanContext = activeSpan.spanContext();
    return {
      ...log,
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags
    };
  }

  public async generateServiceMap(): Promise<{
    nodes: Array<{ id: string; label: string; metrics: ServiceMetrics }>;
    edges: Array<{
      source: string;
      target: string;
      metrics: ServiceDependency;
    }>;
  }> {
    const nodes = new Map<string, { id: string; label: string; metrics: ServiceMetrics }>();
    const edges: Array<{ source: string; target: string; metrics: ServiceDependency }> = [];

    for (const dep of this.serviceDependencies.values()) {
      if (!nodes.has(dep.source)) {
        const metrics = this.serviceMetrics.get(dep.source) || {
          serviceName: dep.source,
          requestCount: 0,
          errorCount: 0,
          totalLatency: 0,
          avgLatency: 0,
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0
        };
        nodes.set(dep.source, {
          id: dep.source,
          label: dep.source,
          metrics
        });
      }

      if (!nodes.has(dep.target)) {
        const metrics = this.serviceMetrics.get(dep.target) || {
          serviceName: dep.target,
          requestCount: 0,
          errorCount: 0,
          totalLatency: 0,
          avgLatency: 0,
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0
        };
        nodes.set(dep.target, {
          id: dep.target,
          label: dep.target,
          metrics
        });
      }

      edges.push({
        source: dep.source,
        target: dep.target,
        metrics: dep
      });
    }

    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.sdk) {
        await this.sdk.shutdown();
      }
      this.emit('tracer:shutdown');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }
}

export default RequestTracer;
