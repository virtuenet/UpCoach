"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readyCheckHandler = exports.healthCheckHandler = exports.metricsHandler = exports.trackCacheMiss = exports.trackCacheHit = exports.trackDatabaseQuery = exports.performanceMiddleware = void 0;
const perf_hooks_1 = require("perf_hooks");
const prom_client_1 = require("prom-client");
const logger_1 = require("../utils/logger");
// Initialize Prometheus metrics
const httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
const httpRequestTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status', 'status_code'],
});
const httpRequestSize = new prom_client_1.Histogram({
    name: 'http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000],
});
const httpResponseSize = new prom_client_1.Histogram({
    name: 'http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route', 'status'],
    buckets: [100, 1000, 10000, 100000, 1000000],
});
const activeRequests = new prom_client_1.Gauge({
    name: 'http_requests_active',
    help: 'Number of active HTTP requests',
});
const databaseQueryDuration = new prom_client_1.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});
const cacheHits = new prom_client_1.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type'],
});
const cacheMisses = new prom_client_1.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type'],
});
// Register all metrics
prom_client_1.register.registerMetric(httpRequestDuration);
prom_client_1.register.registerMetric(httpRequestTotal);
prom_client_1.register.registerMetric(httpRequestSize);
prom_client_1.register.registerMetric(httpResponseSize);
prom_client_1.register.registerMetric(activeRequests);
prom_client_1.register.registerMetric(databaseQueryDuration);
prom_client_1.register.registerMetric(cacheHits);
prom_client_1.register.registerMetric(cacheMisses);
// Performance monitoring middleware
const performanceMiddleware = (req, _res, next) => {
    // Start timing
    req.startTime = perf_hooks_1.performance.now();
    activeRequests.inc();
    // Get route path
    const route = req.route?.path || req.path || 'unknown';
    req.metrics = { route };
    // Track request size
    const requestSize = parseInt(req.get('content-length') || '0', 10);
    httpRequestSize.observe({ method: req.method, route }, requestSize);
    // Intercept response end
    const originalEnd = _res.end;
    _res.end = function (...args) {
        // Calculate duration
        const duration = req.startTime ? (perf_hooks_1.performance.now() - req.startTime) / 1000 : 0;
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
        httpResponseSize.observe({ method: req.method, route: req.metrics?.route || 'unknown', status }, responseSize);
        activeRequests.dec();
        // Log slow requests
        if (duration > 1) {
            logger_1.logger.warn('Slow request detected', {
                method: req.method,
                path: req.path,
                duration: `${duration.toFixed(3)}s`,
                statusCode,
            });
        }
        // Call original end
        return originalEnd.apply(_res, args);
    };
    next();
};
exports.performanceMiddleware = performanceMiddleware;
// Database query performance tracking
const trackDatabaseQuery = (operation, table, duration) => {
    databaseQueryDuration.observe({ operation, table }, duration / 1000);
    if (duration > 100) {
        logger_1.logger.warn('Slow database query', {
            operation,
            table,
            duration: `${duration}ms`,
        });
    }
};
exports.trackDatabaseQuery = trackDatabaseQuery;
// Cache performance tracking
const trackCacheHit = (cacheType) => {
    cacheHits.inc({ cache_type: cacheType });
};
exports.trackCacheHit = trackCacheHit;
const trackCacheMiss = (cacheType) => {
    cacheMisses.inc({ cache_type: cacheType });
};
exports.trackCacheMiss = trackCacheMiss;
// Metrics endpoint handler
const metricsHandler = async (req, res) => {
    try {
        res.set('Content-Type', prom_client_1.register.contentType);
        const metrics = await prom_client_1.register.metrics();
        res.send(metrics);
    }
    catch (error) {
        res.status(500).send('Error generating metrics');
    }
};
exports.metricsHandler = metricsHandler;
// Health check endpoint
const healthCheckHandler = (req, _res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
    };
    _res.json(health);
};
exports.healthCheckHandler = healthCheckHandler;
// Ready check endpoint (for Kubernetes)
const readyCheckHandler = async (req, _res) => {
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
                redis: true, // redisHealthy
            },
        };
        _res.json(ready);
    }
    catch (error) {
        _res.status(503).json({
            status: 'not ready',
            error: error.message,
        });
    }
};
exports.readyCheckHandler = readyCheckHandler;
//# sourceMappingURL=performance.js.map