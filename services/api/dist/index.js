"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import helmet from 'helmet'; // Imported below where used
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
// import rateLimit from 'express-rate-limit'; // Imported via rateLimiter middleware
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const redis_1 = require("./services/redis");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const logger_1 = require("./utils/logger");
const SchedulerService_1 = require("./services/SchedulerService");
const shutdown_1 = require("./utils/shutdown");
const rateLimiter_1 = require("./middleware/rateLimiter");
// import { enhancedSecurityHeaders } from './middleware/securityNonce'; // Not currently used
const securityHeaders_1 = require("./middleware/securityHeaders");
const csrf_1 = require("./middleware/csrf");
const SentryService_1 = require("./services/monitoring/SentryService");
const DataDogService_1 = require("./services/monitoring/DataDogService");
// Load environment variables
dotenv_1.default.config();
// Initialize monitoring services (before creating Express app)
if (environment_1.config.monitoring?.sentry?.enabled) {
    SentryService_1.sentryService.initialize({
        dsn: environment_1.config.monitoring.sentry.dsn,
        environment: environment_1.config.env,
        release: environment_1.config.monitoring.sentry.release,
        tracesSampleRate: environment_1.config.monitoring.sentry.tracesSampleRate || 0.1,
        profilesSampleRate: environment_1.config.monitoring.sentry.profilesSampleRate || 0.1,
        debug: environment_1.config.env === 'development',
    });
}
if (environment_1.config.monitoring?.datadog?.enabled) {
    DataDogService_1.dataDogService.initialize({
        enabled: true,
        env: environment_1.config.env,
        service: 'upcoach-backend',
        version: environment_1.config.monitoring.datadog.version || process.env.npm_package_version,
        analyticsEnabled: true,
        logInjection: true,
        profiling: environment_1.config.env === 'production',
        runtimeMetrics: true,
        agentHost: environment_1.config.monitoring.datadog.agentHost,
        agentPort: environment_1.config.monitoring.datadog.agentPort,
        statsdHost: environment_1.config.monitoring.datadog.statsdHost,
        statsdPort: environment_1.config.monitoring.datadog.statsdPort,
    });
}
const app = (0, express_1.default)();
const PORT = environment_1.config.port;
// Set up Sentry request handlers (must be first middleware)
if (environment_1.config.monitoring?.sentry?.enabled) {
    SentryService_1.sentryService.setupExpressMiddleware(app);
}
// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// DataDog request tracing middleware
if (environment_1.config.monitoring?.datadog?.enabled) {
    app.use(DataDogService_1.dataDogService.requestTracing());
}
// Enhanced security headers with HSTS, CSP, and Certificate Transparency
const isDevelopment = process.env.NODE_ENV === 'development';
app.use((0, securityHeaders_1.securityHeaders)({
    enableHSTS: !isDevelopment,
    enableCSP: true,
    enableCertificateTransparency: !isDevelopment,
    cspDirectives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': [
            "'self'",
            'https://api.stripe.com',
            'https://api.openai.com',
            'wss:',
            environment_1.config.corsOrigins.join(' '),
        ],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': isDevelopment ? [] : [''],
    },
}));
// Certificate Transparency monitoring middleware
app.use(securityHeaders_1.ctMonitor.middleware());
// Apply general rate limiting to all API routes
app.use('/api/', rateLimiter_1.apiLimiter);
// Apply specific rate limiting to webhook endpoints
app.use('/webhook/', rateLimiter_1.webhookLimiter);
app.use((0, compression_1.default)());
// Rate limiting is already applied above via apiLimiter and webhookLimiter
// Removed duplicate rate limiter to avoid conflicts
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        if (environment_1.config.corsOrigins.some(allowedOrigin => {
            if (allowedOrigin.includes('*')) {
                const pattern = allowedOrigin.replace(/\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(origin);
            }
            return allowedOrigin === origin;
        })) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
}));
// Body parsing middleware
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
if (environment_1.config.env !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: message => logger_1.logger.info(message.trim()),
        },
    }));
}
// Request ID middleware for tracking
app.use((req, res, next) => {
    req.id = Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', req.id);
    next();
});
// Configure CSRF protection (must be after body parsing middleware)
(0, csrf_1.configureCsrf)(app);
// CSRF token endpoint for clients
app.get('/api/csrf-token', (req, res) => {
    try {
        if (req.csrfToken) {
            const token = req.csrfToken();
            res.json({ csrfToken: token });
        }
        else {
            res.status(500).json({ error: 'CSRF token generation not available' });
        }
    }
    catch (error) {
        logger_1.logger.error('CSRF token generation failed:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
});
// Security report endpoints
app.post('/api/security/report/csp', (0, securityHeaders_1.securityReportHandler)());
app.post('/api/security/report/ct', (0, securityHeaders_1.securityReportHandler)());
app.post('/api/security/report/expect-ct', (0, securityHeaders_1.securityReportHandler)());
// Health check endpoint
app.get('/health', async (_req, res) => {
    try {
        // Test database connection
        const dbHealth = await testDatabaseConnection();
        // Test Redis connection
        const redisHealth = await testRedisConnection();
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: environment_1.config.env,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: dbHealth ? 'healthy' : 'unhealthy',
                redis: redisHealth ? 'healthy' : 'unhealthy',
            },
            uptime: process.uptime(),
            memory: {
                used: process.memoryUsage().heapUsed / 1024 / 1024,
                total: process.memoryUsage().heapTotal / 1024 / 1024,
            },
        };
        const statusCode = dbHealth && redisHealth ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
// API Documentation endpoint
app.get('/api', (_req, res) => {
    res.json({
        name: 'UpCoach Backend API',
        version: '1.0.0',
        description: 'Personal coaching and development platform API',
        documentation: 'https://github.com/your-repo/upcoach-api',
        health: '/health',
        baseURL: `/api`,
        authentication: {
            type: 'Bearer Token (JWT)',
            endpoints: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                refresh: 'POST /api/auth/refresh',
                logout: 'POST /api/auth/logout',
                verify: 'GET /api/auth/verify',
            },
        },
        features: environment_1.config.features,
    });
});
// Setup all API routes
(0, routes_1.setupRoutes)(app);
// 404 handler for undefined routes
app.use(notFoundHandler_1.notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler_1.errorMiddleware);
// Helper functions
async function testDatabaseConnection() {
    const timeoutMs = 5000; // 5 second timeout
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs);
        });
        // Create the actual health check promise
        const healthCheckPromise = (async () => {
            const { sequelize } = await Promise.resolve().then(() => __importStar(require('./config/database')));
            // Test authentication
            await sequelize.authenticate();
            // Test a simple query
            const result = await sequelize.query('SELECT 1+1 as result', {
                raw: true,
                type: sequelize.QueryTypes?.SELECT || 'SELECT',
            });
            return result && result[0] && result[0].result === 2;
        })();
        // Race between timeout and health check
        const isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);
        if (isHealthy) {
            logger_1.logger.info('Database health check passed');
        }
        return isHealthy || false;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
}
async function testRedisConnection() {
    try {
        await redis_1.redis.ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
        return false;
    }
}
// Initialize services
async function initializeServices() {
    try {
        // Initialize database
        await (0, database_1.initializeDatabase)();
        // Initialize scheduler service
        SchedulerService_1.SchedulerService.initialize();
        logger_1.logger.info('All services initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}
// Start server
const server = app.listen(PORT, async () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
    // Initialize services after server starts
    await initializeServices();
    // Initialize graceful shutdown
    shutdown_1.gracefulShutdown.setServer(server);
    shutdown_1.gracefulShutdown.initialize();
    // Register additional cleanup if needed
    shutdown_1.gracefulShutdown.onShutdown('SchedulerService', async () => {
        logger_1.logger.info('Shutting down SchedulerService...');
        // Add scheduler shutdown logic here if needed
    }, 25);
});
exports.default = app;
//# sourceMappingURL=index.js.map