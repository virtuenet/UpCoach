import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { config } from './config/environment';
import { initializeDatabase } from './config/database';
import { redis } from './services/redis';
import { setupRoutes } from './routes';
import { errorMiddleware } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import { SchedulerService } from './services/SchedulerService';

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

const app = express();
const PORT = config.port;

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

app.use('/api/', limiter);

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
  verify: (req: any, res, buf) => {
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

// Health check endpoint
app.get('/health', async (req, res) => {
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
app.get('/api', (req, res) => {
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
  try {
    // This will be implemented once we fix the database service
    return true;
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
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize services after server starts
  await initializeServices();
});

export default app; 