import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { initializeDatabase } from './config/database';
import { redis } from './services/redis';
import { setupRoutes } from './routes';
import { errorMiddleware } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import { SchedulerService } from './services/SchedulerService';
import { gracefulShutdown } from './utils/shutdown';
import { apiLimiter, webhookLimiter } from './middleware/rateLimiter';
import { enhancedSecurityHeaders } from './middleware/securityNonce';
import { securityHeaders, ctMonitor, securityReportHandler } from './middleware/securityHeaders';
import { sentryService } from './services/monitoring/SentryService';
import { dataDogService } from './services/monitoring/DataDogService';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
    }
  }
}

// Load environment variables
dotenv.config();

// Initialize monitoring services (before creating Express app)
if (config.monitoring?.sentry?.enabled) {
  sentryService.initialize({
    dsn: config.monitoring.sentry.dsn,
    environment: config.env,
    release: config.monitoring.sentry.release,
    tracesSampleRate: config.monitoring.sentry.tracesSampleRate || 0.1,
    profilesSampleRate: config.monitoring.sentry.profilesSampleRate || 0.1,
    debug: config.env === 'development',
  });
}

if (config.monitoring?.datadog?.enabled) {
  dataDogService.initialize({
    enabled: true,
    env: config.env,
    service: 'upcoach-backend',
    version: config.monitoring.datadog.version || process.env.npm_package_version,
    analyticsEnabled: true,
    logInjection: true,
    profiling: config.env === 'production',
    runtimeMetrics: true,
    agentHost: config.monitoring.datadog.agentHost,
    agentPort: config.monitoring.datadog.agentPort,
    statsdHost: config.monitoring.datadog.statsdHost,
    statsdPort: config.monitoring.datadog.statsdPort,
  });
}

const app = express();
const PORT = config.port;

// Set up Sentry request handlers (must be first middleware)
if (config.monitoring?.sentry?.enabled) {
  sentryService.setupExpressMiddleware(app);
}

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// DataDog request tracing middleware
if (config.monitoring?.datadog?.enabled) {
  app.use(dataDogService.requestTracing());
}

// Enhanced security headers with HSTS, CSP, and Certificate Transparency
const isDevelopment = process.env.NODE_ENV === 'development';
app.use(securityHeaders({
  enableHSTS: !isDevelopment,
  enableCSP: true,
  enableCertificateTransparency: !isDevelopment,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'https://api.openai.com', 'wss:', config.corsOrigins.join(' ')],
    'frame-src': ["'self'", 'https://js.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isDevelopment ? [] : [''],
  },
}));

// Certificate Transparency monitoring middleware
app.use(ctMonitor.middleware());

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply specific rate limiting to webhook endpoints
app.use('/webhook/', webhookLimiter);

app.use(compression());

// Rate limiting is already applied above via apiLimiter and webhookLimiter
// Removed duplicate rate limiter to avoid conflicts

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (config.corsOrigins.some(allowedOrigin => {
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
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security report endpoints
app.post('/api/security/report/csp', securityReportHandler());
app.post('/api/security/report/ct', securityReportHandler());
app.post('/api/security/report/expect-ct', securityReportHandler());

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
      environment: config.env,
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
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API Documentation endpoint
app.get('/api', (_req, res) => {
  (res as any).json({
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
      }
    },
    features: config.features,
  });
});

// Setup all API routes
setupRoutes(app);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorMiddleware);

// Helper functions
async function testDatabaseConnection(): Promise<boolean> {
  const timeoutMs = 5000; // 5 second timeout
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs);
    });
    
    // Create the actual health check promise
    const healthCheckPromise = (async () => {
      const { sequelize } = await import('./config/database');
      
      // Test authentication
      await sequelize.authenticate();
      
      // Test a simple query
      const result = await sequelize.query('SELECT 1+1 as result', {
        raw: true,
        type: sequelize.QueryTypes.SELECT
      });
      
      return result && result[0] && (result[0] as any).result === 2;
    })();
    
    // Race between timeout and health check
    const isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);
    
    if (isHealthy) {
      logger.info('Database health check passed');
    }
    
    return isHealthy;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize scheduler service
    SchedulerService.initialize();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
  
  // Initialize services after server starts
  await initializeServices();
  
  // Initialize graceful shutdown
  gracefulShutdown.setServer(server);
  gracefulShutdown.initialize();
  
  // Register additional cleanup if needed
  gracefulShutdown.onShutdown('SchedulerService', async () => {
    logger.info('Shutting down SchedulerService...');
    // Add scheduler shutdown logic here if needed
  }, 25);
});

export default app; 