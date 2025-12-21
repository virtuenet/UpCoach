/**
 * Request Tracing Middleware
 *
 * Distributed tracing for API requests with correlation IDs,
 * timing metrics, and span propagation.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Tracing headers
export const TRACE_HEADERS = {
  TRACE_ID: 'X-Trace-Id',
  SPAN_ID: 'X-Span-Id',
  PARENT_SPAN_ID: 'X-Parent-Span-Id',
  REQUEST_ID: 'X-Request-Id',
  CORRELATION_ID: 'X-Correlation-Id',
  CLIENT_VERSION: 'X-Client-Version',
  CLIENT_PLATFORM: 'X-Client-Platform',
} as const;

// Trace context
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  requestId: string;
  correlationId: string;
  startTime: number;
  clientInfo: {
    version: string | null;
    platform: string | null;
    userAgent: string | null;
    ip: string;
  };
}

// Request timing
export interface RequestTiming {
  startTime: number;
  endTime: number;
  duration: number;
  serverTiming: {
    total: number;
    db?: number;
    cache?: number;
    external?: number;
  };
}

// Trace span
export interface TraceSpan {
  spanId: string;
  parentSpanId: string | null;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{
    timestamp: number;
    message: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    fields?: Record<string, unknown>;
  }>;
  status: 'ok' | 'error' | 'timeout';
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext;
      timing?: RequestTiming;
      span?: TraceSpan;
    }
  }
}

// Trace storage (in production, use distributed tracing service)
const activeTraces = new Map<string, TraceSpan[]>();
const traceMetrics = {
  totalRequests: 0,
  totalDuration: 0,
  errorCount: 0,
  slowRequests: 0,
  requestsByEndpoint: new Map<string, number>(),
  durationByEndpoint: new Map<string, number[]>(),
};

/**
 * Request tracing middleware
 */
export function requestTracing(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    traceMetrics.totalRequests++;

    // Extract or generate trace IDs
    const traceId =
      (req.get(TRACE_HEADERS.TRACE_ID) as string) || uuidv4();
    const parentSpanId =
      (req.get(TRACE_HEADERS.SPAN_ID) as string) || null;
    const spanId = uuidv4();
    const requestId =
      (req.get(TRACE_HEADERS.REQUEST_ID) as string) || uuidv4();
    const correlationId =
      (req.get(TRACE_HEADERS.CORRELATION_ID) as string) || traceId;

    // Build trace context
    const traceContext: TraceContext = {
      traceId,
      spanId,
      parentSpanId,
      requestId,
      correlationId,
      startTime,
      clientInfo: {
        version: req.get(TRACE_HEADERS.CLIENT_VERSION) || null,
        platform: req.get(TRACE_HEADERS.CLIENT_PLATFORM) || null,
        userAgent: req.get('User-Agent') || null,
        ip: getClientIP(req),
      },
    };

    // Create span
    const span: TraceSpan = {
      spanId,
      parentSpanId,
      operationName: `${req.method} ${req.path}`,
      startTime,
      tags: {
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.path': req.path,
        'http.host': req.hostname,
        'component': 'express',
      },
      logs: [],
      status: 'ok',
    };

    // Attach to request
    req.traceContext = traceContext;
    req.span = span;
    req.timing = {
      startTime,
      endTime: 0,
      duration: 0,
      serverTiming: { total: 0 },
    };

    // Set response headers
    res.set(TRACE_HEADERS.TRACE_ID, traceId);
    res.set(TRACE_HEADERS.SPAN_ID, spanId);
    res.set(TRACE_HEADERS.REQUEST_ID, requestId);
    res.set(TRACE_HEADERS.CORRELATION_ID, correlationId);

    // Track endpoint metrics
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    traceMetrics.requestsByEndpoint.set(
      endpoint,
      (traceMetrics.requestsByEndpoint.get(endpoint) || 0) + 1
    );

    // Store span
    if (!activeTraces.has(traceId)) {
      activeTraces.set(traceId, []);
    }
    activeTraces.get(traceId)!.push(span);

    // Handle response finish
    res.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update timing
      if (req.timing) {
        req.timing.endTime = endTime;
        req.timing.duration = duration;
        req.timing.serverTiming.total = duration;
      }

      // Update span
      if (req.span) {
        req.span.endTime = endTime;
        req.span.duration = duration;
        req.span.tags['http.status_code'] = res.statusCode;

        if (res.statusCode >= 400) {
          req.span.status = 'error';
          traceMetrics.errorCount++;
        }
      }

      // Track slow requests (> 1000ms)
      if (duration > 1000) {
        traceMetrics.slowRequests++;
        console.warn(
          `Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`,
          { traceId, spanId, duration }
        );
      }

      // Update duration metrics
      traceMetrics.totalDuration += duration;
      const durations = traceMetrics.durationByEndpoint.get(endpoint) || [];
      durations.push(duration);
      if (durations.length > 1000) {
        durations.shift(); // Keep last 1000 samples
      }
      traceMetrics.durationByEndpoint.set(endpoint, durations);

      // Set Server-Timing header
      const serverTiming = buildServerTimingHeader(req.timing?.serverTiming || { total: duration });
      res.set('Server-Timing', serverTiming);

      // Clean up old traces (keep for 5 minutes)
      setTimeout(() => {
        if (activeTraces.has(traceId)) {
          const spans = activeTraces.get(traceId)!;
          const index = spans.findIndex((s) => s.spanId === spanId);
          if (index !== -1) {
            spans.splice(index, 1);
          }
          if (spans.length === 0) {
            activeTraces.delete(traceId);
          }
        }
      }, 300000);
    });

    next();
  };
}

/**
 * Build Server-Timing header value
 */
function buildServerTimingHeader(
  timing: Record<string, number | undefined>
): string {
  const entries: string[] = [];

  for (const [key, value] of Object.entries(timing)) {
    if (value !== undefined) {
      entries.push(`${key};dur=${value}`);
    }
  }

  return entries.join(', ');
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  const forwarded = req.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Create child span
 */
export function createChildSpan(
  req: Request,
  operationName: string,
  tags?: Record<string, string | number | boolean>
): TraceSpan | null {
  if (!req.traceContext) {
    return null;
  }

  const span: TraceSpan = {
    spanId: uuidv4(),
    parentSpanId: req.span?.spanId || null,
    operationName,
    startTime: Date.now(),
    tags: {
      ...tags,
    },
    logs: [],
    status: 'ok',
  };

  // Store span
  const traceId = req.traceContext.traceId;
  if (activeTraces.has(traceId)) {
    activeTraces.get(traceId)!.push(span);
  }

  return span;
}

/**
 * End span
 */
export function endSpan(
  span: TraceSpan,
  status: 'ok' | 'error' | 'timeout' = 'ok'
): void {
  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  span.status = status;
}

/**
 * Add span log
 */
export function addSpanLog(
  span: TraceSpan,
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  fields?: Record<string, unknown>
): void {
  span.logs.push({
    timestamp: Date.now(),
    message,
    level,
    fields,
  });
}

/**
 * Get trace by ID
 */
export function getTrace(traceId: string): TraceSpan[] | null {
  return activeTraces.get(traceId) || null;
}

/**
 * Get tracing metrics
 */
export function getTracingMetrics(): {
  totalRequests: number;
  avgDuration: number;
  errorRate: number;
  slowRequestRate: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgDuration: number }>;
} {
  const avgDuration =
    traceMetrics.totalRequests > 0
      ? traceMetrics.totalDuration / traceMetrics.totalRequests
      : 0;

  const errorRate =
    traceMetrics.totalRequests > 0
      ? traceMetrics.errorCount / traceMetrics.totalRequests
      : 0;

  const slowRequestRate =
    traceMetrics.totalRequests > 0
      ? traceMetrics.slowRequests / traceMetrics.totalRequests
      : 0;

  const topEndpoints = Array.from(traceMetrics.requestsByEndpoint.entries())
    .map(([endpoint, count]) => {
      const durations = traceMetrics.durationByEndpoint.get(endpoint) || [];
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;
      return { endpoint, count, avgDuration };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalRequests: traceMetrics.totalRequests,
    avgDuration,
    errorRate,
    slowRequestRate,
    topEndpoints,
  };
}

/**
 * Reset tracing metrics
 */
export function resetTracingMetrics(): void {
  traceMetrics.totalRequests = 0;
  traceMetrics.totalDuration = 0;
  traceMetrics.errorCount = 0;
  traceMetrics.slowRequests = 0;
  traceMetrics.requestsByEndpoint.clear();
  traceMetrics.durationByEndpoint.clear();
}

export default requestTracing;
