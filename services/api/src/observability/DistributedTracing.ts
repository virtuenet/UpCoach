import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
  Span,
  SpanStatusCode,
  trace,
  context,
  propagation,
  Context,
  Tracer,
  SpanKind,
  SpanOptions,
  Attributes,
  TimeInput,
} from '@opentelemetry/api';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { BatchSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { Request, Response, NextFunction } from 'express';

interface TraceConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  jaeger?: {
    endpoint: string;
    agentHost?: string;
    agentPort?: number;
  };
  zipkin?: {
    url: string;
  };
  sampling?: {
    type: 'always' | 'never' | 'probability' | 'rate-limiting';
    probability?: number;
    rateLimit?: number;
  };
  enableAutoInstrumentation?: boolean;
}

interface SpanMetadata {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
  baggage: Map<string, string>;
}

interface TraceVisualization {
  traceId: string;
  spans: Array<{
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: number;
    duration: number;
    status: string;
    attributes: Attributes;
    events: Array<{ name: string; timestamp: number; attributes?: Attributes }>;
  }>;
  totalDuration: number;
  services: string[];
  errorCount: number;
}

class ProbabilitySampler {
  private probability: number;

  constructor(probability: number) {
    this.probability = Math.max(0, Math.min(1, probability));
  }

  shouldSample(): boolean {
    return Math.random() < this.probability;
  }
}

class RateLimitingSampler {
  private maxTracesPerSecond: number;
  private traces: number[];
  private windowMs: number = 1000;

  constructor(maxTracesPerSecond: number) {
    this.maxTracesPerSecond = maxTracesPerSecond;
    this.traces = [];
  }

  shouldSample(): boolean {
    const now = Date.now();
    this.traces = this.traces.filter(timestamp => now - timestamp < this.windowMs);

    if (this.traces.length < this.maxTracesPerSecond) {
      this.traces.push(now);
      return true;
    }

    return false;
  }
}

export class DistributedTracing {
  private sdk: NodeSDK;
  private tracer: Tracer;
  private config: TraceConfig;
  private sampler: ProbabilitySampler | RateLimitingSampler | null;
  private activeSpans: Map<string, Span>;
  private spanProcessors: SpanProcessor[];

  constructor(config: TraceConfig) {
    this.config = config;
    this.activeSpans = new Map();
    this.spanProcessors = [];

    // Initialize sampler
    if (config.sampling) {
      switch (config.sampling.type) {
        case 'probability':
          this.sampler = new ProbabilitySampler(config.sampling.probability || 0.1);
          break;
        case 'rate-limiting':
          this.sampler = new RateLimitingSampler(config.sampling.rateLimit || 100);
          break;
        default:
          this.sampler = null;
      }
    } else {
      this.sampler = null;
    }

    // Initialize exporters
    const exporters: SpanProcessor[] = [];

    if (config.jaeger) {
      const jaegerExporter = new JaegerExporter({
        endpoint: config.jaeger.endpoint,
        host: config.jaeger.agentHost,
        port: config.jaeger.agentPort,
      });
      exporters.push(new BatchSpanProcessor(jaegerExporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
      }));
    }

    if (config.zipkin) {
      const zipkinExporter = new ZipkinExporter({
        url: config.zipkin.url,
      });
      exporters.push(new BatchSpanProcessor(zipkinExporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
      }));
    }

    this.spanProcessors = exporters;

    // Initialize SDK
    this.sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
      }),
      spanProcessor: exporters.length > 0 ? exporters[0] : undefined,
      textMapPropagator: new W3CTraceContextPropagator(),
      instrumentations: config.enableAutoInstrumentation !== false ? [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
        new HttpInstrumentation({
          requestHook: (span, request) => {
            span.setAttribute('http.request.header.user-agent', request.headers['user-agent'] || '');
          },
          responseHook: (span, response) => {
            span.setAttribute('http.response.header.content-type', response.headers['content-type'] || '');
          },
        }),
        new ExpressInstrumentation({
          requestHook: (span, request) => {
            const req = request as any;
            if (req.user?.id) {
              span.setAttribute('user.id', req.user.id);
            }
          },
        }),
        new PgInstrumentation({
          enhancedDatabaseReporting: true,
        }),
        new RedisInstrumentation(),
      ] : [],
    });

    this.sdk.start();

    // Get tracer
    this.tracer = trace.getTracer(config.serviceName, config.serviceVersion);

    // Set up context propagation
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  }

  public startSpan(
    name: string,
    options?: {
      kind?: SpanKind;
      attributes?: Attributes;
      startTime?: TimeInput;
      parent?: Context | Span;
      links?: Array<{ context: Context; attributes?: Attributes }>;
    }
  ): Span {
    // Check sampling decision
    if (this.sampler && this.config.sampling?.type !== 'always') {
      if (this.config.sampling?.type === 'never') {
        return trace.wrapSpanContext({
          traceId: '00000000000000000000000000000000',
          spanId: '0000000000000000',
          traceFlags: 0,
        });
      }

      if (!this.sampler.shouldSample()) {
        return trace.wrapSpanContext({
          traceId: '00000000000000000000000000000000',
          spanId: '0000000000000000',
          traceFlags: 0,
        });
      }
    }

    const spanOptions: SpanOptions = {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
      startTime: options?.startTime,
      links: options?.links,
    };

    let span: Span;

    if (options?.parent) {
      if (options.parent instanceof Object && 'setValue' in options.parent) {
        // It's a Context
        span = this.tracer.startSpan(name, spanOptions, options.parent as Context);
      } else {
        // It's a Span
        span = this.tracer.startSpan(name, spanOptions, trace.setSpan(context.active(), options.parent as Span));
      }
    } else {
      span = this.tracer.startSpan(name, spanOptions);
    }

    this.activeSpans.set(span.spanContext().spanId, span);

    return span;
  }

  public endSpan(span: Span, endTime?: TimeInput): void {
    span.end(endTime);
    this.activeSpans.delete(span.spanContext().spanId);
  }

  public setSpanAttributes(span: Span, attributes: Attributes): void {
    span.setAttributes(attributes);
  }

  public addSpanEvent(
    span: Span,
    name: string,
    attributes?: Attributes,
    timestamp?: TimeInput
  ): void {
    span.addEvent(name, attributes, timestamp);
  }

  public recordException(span: Span, exception: Error | string): void {
    if (typeof exception === 'string') {
      span.recordException(new Error(exception));
      span.setStatus({ code: SpanStatusCode.ERROR, message: exception });
    } else {
      span.recordException(exception);
      span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
    }
  }

  public setSpanStatus(span: Span, code: SpanStatusCode, message?: string): void {
    span.setStatus({ code, message });
  }

  public getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  public getActiveContext(): Context {
    return context.active();
  }

  public withSpan<T>(span: Span, fn: () => T): T {
    return context.with(trace.setSpan(context.active(), span), fn);
  }

  public async traceAsyncOperation<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      kind?: SpanKind;
      attributes?: Attributes;
    }
  ): Promise<T> {
    const span = this.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      this.recordException(span, error as Error);
      throw error;
    } finally {
      this.endSpan(span);
    }
  }

  public traceSyncOperation<T>(
    name: string,
    fn: (span: Span) => T,
    options?: {
      kind?: SpanKind;
      attributes?: Attributes;
    }
  ): T {
    const span = this.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });

    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      this.recordException(span, error as Error);
      throw error;
    } finally {
      this.endSpan(span);
    }
  }

  public traceHttpRequest(req: Request, res: Response, next: NextFunction): void {
    const span = this.startSpan(`HTTP ${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.target': req.path,
        'http.host': req.hostname,
        'http.scheme': req.protocol,
        'http.user_agent': req.get('user-agent') || '',
        'http.client_ip': req.ip,
      },
    });

    // Inject trace context into request for propagation
    const carrier: { [key: string]: string } = {};
    propagation.inject(trace.setSpan(context.active(), span), carrier);
    Object.assign(req.headers, carrier);

    // Capture response
    const originalSend = res.send.bind(res);
    res.send = (body: any): Response => {
      span.setAttribute('http.status_code', res.statusCode);
      span.setAttribute('http.response.size', Buffer.byteLength(JSON.stringify(body)));

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      this.endSpan(span);

      return originalSend(body);
    };

    // Handle errors
    res.on('error', (error) => {
      this.recordException(span, error);
      this.endSpan(span);
    });

    next();
  }

  public async traceDatabaseQuery(
    operation: string,
    table: string,
    query: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `DB ${operation} ${table}`,
      async (span) => {
        span.setAttributes({
          'db.system': 'postgresql',
          'db.operation': operation,
          'db.sql.table': table,
          'db.statement': query.substring(0, 1000), // Truncate long queries
        });

        const result = await fn();

        if (Array.isArray(result)) {
          span.setAttribute('db.result.count', result.length);
        }

        return result;
      },
      { kind: SpanKind.CLIENT }
    );
  }

  public async traceCacheOperation(
    operation: 'GET' | 'SET' | 'DEL' | 'EXISTS',
    key: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `CACHE ${operation} ${key}`,
      async (span) => {
        span.setAttributes({
          'db.system': 'redis',
          'db.operation': operation,
          'db.redis.key': key,
        });

        const result = await fn();

        if (operation === 'GET') {
          span.setAttribute('cache.hit', result !== null);
        }

        return result;
      },
      { kind: SpanKind.CLIENT }
    );
  }

  public async traceExternalApiCall(
    service: string,
    method: string,
    url: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `${service} ${method}`,
      async (span) => {
        span.setAttributes({
          'http.method': method,
          'http.url': url,
          'peer.service': service,
          'span.kind': 'client',
        });

        const startTime = Date.now();
        const result = await fn();
        const duration = Date.now() - startTime;

        span.setAttribute('http.duration_ms', duration);

        if (result?.status) {
          span.setAttribute('http.status_code', result.status);

          if (result.status >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${result.status}`,
            });
          }
        }

        return result;
      },
      { kind: SpanKind.CLIENT }
    );
  }

  public async traceQueueOperation(
    operation: 'ENQUEUE' | 'DEQUEUE' | 'PROCESS',
    queue: string,
    messageId: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `QUEUE ${operation} ${queue}`,
      async (span) => {
        span.setAttributes({
          'messaging.system': 'rabbitmq',
          'messaging.destination': queue,
          'messaging.operation': operation,
          'messaging.message_id': messageId,
        });

        const result = await fn();

        return result;
      },
      { kind: operation === 'ENQUEUE' ? SpanKind.PRODUCER : SpanKind.CONSUMER }
    );
  }

  public async traceBackgroundJob(
    jobName: string,
    jobId: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `JOB ${jobName}`,
      async (span) => {
        span.setAttributes({
          'job.name': jobName,
          'job.id': jobId,
        });

        const startTime = Date.now();
        const result = await fn();
        const duration = Date.now() - startTime;

        span.setAttribute('job.duration_ms', duration);

        return result;
      },
      { kind: SpanKind.INTERNAL }
    );
  }

  public async traceMicroserviceCall(
    targetService: string,
    operation: string,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.traceAsyncOperation(
      `RPC ${targetService}.${operation}`,
      async (span) => {
        span.setAttributes({
          'rpc.service': targetService,
          'rpc.method': operation,
          'rpc.system': 'grpc',
        });

        // Propagate context to downstream service
        const carrier: { [key: string]: string } = {};
        propagation.inject(trace.setSpan(context.active(), span), carrier);

        const result = await fn();

        return result;
      },
      { kind: SpanKind.CLIENT }
    );
  }

  public extractContext(headers: { [key: string]: string | string[] | undefined }): Context {
    return propagation.extract(context.active(), headers);
  }

  public injectContext(ctx: Context, headers: { [key: string]: string }): void {
    propagation.inject(ctx, headers);
  }

  public getSpanMetadata(span: Span): SpanMetadata {
    const spanContext = span.spanContext();
    const baggage = new Map<string, string>();

    // Extract baggage from context
    const currentContext = context.active();
    const baggageEntries = propagation.getBaggage(currentContext);
    if (baggageEntries) {
      baggageEntries.getAllEntries().forEach(([key, entry]) => {
        baggage.set(key, entry.value);
      });
    }

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      parentSpanId: undefined, // Not directly available from spanContext
      sampled: (spanContext.traceFlags & 1) === 1,
      baggage,
    };
  }

  public setBaggage(key: string, value: string): void {
    const currentBaggage = propagation.getBaggage(context.active()) || propagation.createBaggage();
    const newBaggage = currentBaggage.setEntry(key, { value });
    propagation.setBaggage(context.active(), newBaggage);
  }

  public getBaggage(key: string): string | undefined {
    const baggage = propagation.getBaggage(context.active());
    return baggage?.getEntry(key)?.value;
  }

  public getAllBaggage(): Map<string, string> {
    const baggage = propagation.getBaggage(context.active());
    const entries = new Map<string, string>();

    if (baggage) {
      baggage.getAllEntries().forEach(([key, entry]) => {
        entries.set(key, entry.value);
      });
    }

    return entries;
  }

  public createSpanLink(
    span: Span,
    linkedContext: Context,
    attributes?: Attributes
  ): void {
    // Span links must be added at span creation time
    // This method documents the pattern for creating linked spans
    const linkedSpan = trace.getSpan(linkedContext);
    if (linkedSpan) {
      span.addEvent('linked_span', {
        'linked.trace_id': linkedSpan.spanContext().traceId,
        'linked.span_id': linkedSpan.spanContext().spanId,
        ...attributes,
      });
    }
  }

  public getServiceDependencies(): Map<string, Set<string>> {
    const dependencies = new Map<string, Set<string>>();

    // This would typically be populated by analyzing span data
    // For now, return an empty map
    return dependencies;
  }

  public analyzeLatencyBreakdown(traceId: string): Map<string, number> {
    const breakdown = new Map<string, number>();

    // This would analyze a complete trace and break down time spent in each service
    // For now, return an empty map
    return breakdown;
  }

  public async visualizeTrace(traceId: string): Promise<TraceVisualization | null> {
    // This would fetch and format trace data for visualization
    // In a real implementation, this would query the trace backend
    return null;
  }

  public createCustomSpan(
    operationName: string,
    attributes: {
      userId?: string;
      goalId?: string;
      coachId?: string;
      teamId?: string;
      customerId?: string;
      [key: string]: any;
    }
  ): Span {
    const span = this.startSpan(operationName, {
      kind: SpanKind.INTERNAL,
      attributes,
    });

    return span;
  }

  public traceUserJourney(userId: string, action: string, metadata: Attributes = {}): Span {
    const span = this.startSpan(`USER_JOURNEY ${action}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'user.id': userId,
        'user.action': action,
        ...metadata,
      },
    });

    return span;
  }

  public traceGoalOperation(
    goalId: string,
    operation: string,
    metadata: Attributes = {}
  ): Span {
    const span = this.startSpan(`GOAL ${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'goal.id': goalId,
        'goal.operation': operation,
        ...metadata,
      },
    });

    return span;
  }

  public traceCoachingSession(
    coachId: string,
    clientId: string,
    sessionId: string,
    metadata: Attributes = {}
  ): Span {
    const span = this.startSpan('COACHING_SESSION', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'coach.id': coachId,
        'client.id': clientId,
        'session.id': sessionId,
        ...metadata,
      },
    });

    return span;
  }

  public tracePaymentOperation(
    customerId: string,
    amount: number,
    currency: string,
    operation: string
  ): Span {
    const span = this.startSpan(`PAYMENT ${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'payment.customer_id': customerId,
        'payment.amount': amount,
        'payment.currency': currency,
        'payment.operation': operation,
      },
    });

    return span;
  }

  public traceNotificationDelivery(
    userId: string,
    channel: string,
    notificationType: string
  ): Span {
    const span = this.startSpan(`NOTIFICATION ${channel}`, {
      kind: SpanKind.PRODUCER,
      attributes: {
        'notification.user_id': userId,
        'notification.channel': channel,
        'notification.type': notificationType,
      },
    });

    return span;
  }

  public traceSearchQuery(
    query: string,
    filters: Record<string, any>,
    resultCount: number
  ): Span {
    const span = this.startSpan('SEARCH', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'search.query': query,
        'search.filters': JSON.stringify(filters),
        'search.result_count': resultCount,
      },
    });

    return span;
  }

  public traceFileOperation(
    operation: 'upload' | 'download' | 'delete',
    fileId: string,
    fileName: string,
    fileSize: number
  ): Span {
    const span = this.startSpan(`FILE ${operation.toUpperCase()}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'file.id': fileId,
        'file.name': fileName,
        'file.size': fileSize,
        'file.operation': operation,
      },
    });

    return span;
  }

  public traceReportGeneration(
    reportType: string,
    dateRange: { start: string; end: string },
    format: string
  ): Span {
    const span = this.startSpan(`REPORT ${reportType}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'report.type': reportType,
        'report.date_range.start': dateRange.start,
        'report.date_range.end': dateRange.end,
        'report.format': format,
      },
    });

    return span;
  }

  public traceBatchOperation(
    batchType: string,
    batchSize: number,
    batchId: string
  ): Span {
    const span = this.startSpan(`BATCH ${batchType}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'batch.type': batchType,
        'batch.size': batchSize,
        'batch.id': batchId,
      },
    });

    return span;
  }

  public getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  public getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  public flushSpans(): Promise<void> {
    const flushPromises = this.spanProcessors.map(processor =>
      processor.forceFlush()
    );

    return Promise.all(flushPromises).then(() => undefined);
  }

  public async shutdown(): Promise<void> {
    await this.flushSpans();
    await this.sdk.shutdown();
    this.activeSpans.clear();
  }
}

export default DistributedTracing;
