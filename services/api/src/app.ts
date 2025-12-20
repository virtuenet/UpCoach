/**
 * App Module - Express Application Configuration
 *
 * This module creates and configures the Express application without starting the server.
 * This allows for testing and programmatic use without actually listening on a port.
 *
 * For production use with server startup, import from './index.ts'
 * For testing or programmatic use, import from './app.ts'
 */

import compression from 'compression';
import cors from 'cors';
import { config as dotenvConfig } from 'dotenv';
import express, { json, urlencoded } from 'express';
import morgan from 'morgan';

import { config } from './config/environment';
import { setupSwagger } from './config/swagger';
import { configureCsrf } from './middleware/csrf';
import { errorMiddleware } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiLimiter, webhookLimiter } from './middleware/rateLimiter';
import { securityHeaders, ctMonitor, securityReportHandler } from './middleware/securityHeaders';
import { setupRoutes } from './routes';
import { initializeLarkService, isLarkConfigured } from './services/lark';
import { dataDogService } from './services/monitoring/DataDogService';
import { sentryService } from './services/monitoring/SentryService';
import { redis } from './services/redis';
import { logger } from './utils/logger';

// Extend Express Request interface
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
    }
  }
}

// Load environment variables
dotenvConfig();

/**
 * Helper function to test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const timeoutMs = 5000;

  try {
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs);
    });

    const healthCheckPromise = (async () => {
      const { sequelize } = await import('./config/database');
      await sequelize.authenticate();

      const result = await sequelize.query('SELECT 1+1 as result', {
        raw: true,
        type: 'SELECT',
      });

      return result && result[0] && (result[0] as { result?: number })?.result === 2;
    })();

    const isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);

    if (isHealthy) {
      logger.info('Database health check passed');
    }

    return isHealthy || false;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Helper function to test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Create and configure the Express application
 * @returns Configured Express application (server not started)
 */
export function createApp(): ReturnType<typeof express> {
  // Initialize monitoring services
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

  // Initialize Lark integration if configured
  if (isLarkConfigured()) {
    initializeLarkService({
      appId: config.lark.appId,
      appSecret: config.lark.appSecret,
      encryptKey: config.lark.encryptKey || undefined,
      verificationToken: config.lark.verificationToken || undefined,
      defaultChatId: config.lark.defaultChatId || undefined,
      environment: config.env,
    });
    logger.info('Lark integration initialized');
  }

  const app = express();

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
  app.use(
    securityHeaders({
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
          config.corsOrigins.join(' '),
        ],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': isDevelopment ? [] : [''],
      },
    })
  );

  // Certificate Transparency monitoring middleware
  app.use(ctMonitor.middleware());

  // Apply general rate limiting to all API routes
  app.use('/api/', apiLimiter);

  // Apply specific rate limiting to webhook endpoints
  app.use('/webhook/', webhookLimiter);

  app.use(compression());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin && config.env === 'production') {
          return callback(new Error('Origin header required in production'));
        }

        if (!origin && config.env !== 'production') {
          return callback(null, true);
        }

        if (config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        logger.warn(
          `CORS rejection: Origin "${origin}" not in allowed list: ${config.corsOrigins.join(', ')}`
        );
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
      exposedHeaders: ['X-Total-Count'],
      optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    })
  );

  // Body parsing middleware with JSON error handling
  app.use(
    json({
      limit: '10mb',
      verify: (req: Express.Request, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Handle JSON parsing errors
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format in request body',
      });
      return;
    }
    next(err);
  });

  // Logging middleware
  if (config.env !== 'test') {
    app.use(
      morgan('combined', {
        stream: {
          write: message => logger.info(message.trim()),
        },
      })
    );
  }

  // Request ID middleware for tracking
  app.use((req, res, next) => {
    req.id = Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // Configure CSRF protection
  configureCsrf(app);

  // CSRF token endpoint for clients
  app.get('/api/csrf-token', (req: express.Request & { csrfToken?: () => string }, res) => {
    try {
      if (req.csrfToken) {
        const token = req.csrfToken();
        res.json({ csrfToken: token });
      } else {
        res.status(500).json({ error: 'CSRF token generation not available' });
      }
    } catch (error) {
      logger.error('CSRF token generation failed:', error);
      res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
  });

  // Security report endpoints
  app.post('/api/security/report/csp', securityReportHandler());
  app.post('/api/security/report/ct', securityReportHandler());
  app.post('/api/security/report/expect-ct', securityReportHandler());

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    try {
      const dbHealth = await testDatabaseConnection();
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
      features: config.features,
    });
  });

  // Setup all API routes
  setupRoutes(app);

  // Setup Swagger API documentation
  if (config.env !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
    setupSwagger(app);
  }

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}

// Create and export app instance for testing
const app = createApp();

export { app };
export default app;
