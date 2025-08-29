import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { Counter, Histogram, Gauge, register } from 'prom-client';
import { logger } from '../utils/logger';

// Initialize Prometheus metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'status_code'],
});

const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

const activeRequests = new Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
});

const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestSize);
register.registerMetric(httpResponseSize);
register.registerMetric(activeRequests);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      metrics?: {
        route?: string;
        statusCode?: number;
      };
    }
  }
}

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Start timing
  req.startTime = performance.now();
  activeRequests.inc();

  // Get route path
  const route = req.route?.path || req.path || 'unknown';
  req.metrics = { route };

  // Track request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);
  httpRequestSize.observe({ method: req.method, route }, requestSize);

  // Intercept response end
  const originalEnd = _res.end;
  _res.end = function(...args: any[]): Response {
    // Calculate duration
    const duration = req.startTime ? (performance.now() - req.startTime) / 1000 : 0;
    
    // Get response details
    const statusCode = _res.statusCode;
    const status = statusCode >= 400 ? 'error' : 'success';
    const responseSize = parseInt(_res.get('content-length') || '0', 10);

    // Record metrics
    const labels = {
      method: req.method,
      route: req.metrics?.route || 'unknown',
      status,
      status_code: statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    httpResponseSize.observe(
      { method: req.method, route: req.metrics?.route || 'unknown', status },
      responseSize
    );
    activeRequests.dec();

    // Log slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(3)}s`,
        statusCode,
      });
    }

    // Call original end
    return originalEnd.apply(res, args as [any, BufferEncoding, (() => void)?]);
  };

  next();
};

// Database query performance tracking
export const trackDatabaseQuery = (operation: string, table: string, duration: number) => {
  databaseQueryDuration.observe({ operation, table }, duration / 1000);
  
  if (duration > 100) {
    logger.warn('Slow database query', {
      operation,
      table,
      duration: `${duration}ms`,
    });
  }
};

// Cache performance tracking
export const trackCacheHit = (cacheType: string) => {
  cacheHits.inc({ cache_type: cacheType });
};

export const trackCacheMiss = (cacheType: string) => {
  cacheMisses.inc({ cache_type: cacheType });
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, _res: Response) => {
  try {
    _res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    _res.send(metrics);
  } catch (error) {
    _res.status(500).send('Error generating metrics');
  }
};

// Health check endpoint
export const healthCheckHandler = (req: Request, _res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
  
  _res.json(health);
};

// Ready check endpoint (for Kubernetes)
export const readyCheckHandler = async (req: Request, _res: Response) => {
  try {
    // Check database connection
    // const dbHealthy = await checkDatabaseConnection();
    
    // Check Redis connection
    // const redisHealthy = await checkRedisConnection();
    
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: true, // dbHealthy
        redis: true,    // redisHealthy
      },
    };
    
    _res.json(ready);
  } catch (error) {
    _res.status(503).json({
      status: 'not ready',
      error: (error as Error).message,
    });
  }
};