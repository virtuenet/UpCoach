import fs from 'fs';
import os from 'os';
import { promisify } from 'util';

import { Router, Request, Response } from 'express';

import { sequelize } from '../models';
import { redis } from '../services/redis';

const router = Router();
const fsPromises = {
  access: promisify(fs.access),
  stat: promisify(fs.stat),
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
      metadata?: unknown;
    };
  };
  metrics?: {
    memory: unknown;
    cpu: unknown;
    disk?: unknown;
  };
}

// Basic health check - for load balancers
router.get('/', async (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'up',
      database: 'checking',
      redis: 'checking',
    },
  };

  try {
    // Check database
    await sequelize.authenticate();
    health.services.database = 'up';
  } catch (error) {
    health.services.database = 'down';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    await redis.ping();
    health.services.redis = 'up';
  } catch (error) {
    health.services.redis = 'down';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe - checks if the service is alive
router.get('/live', async (_req: Request, res: Response) => {
  try {
    const liveness = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
    };
    
    res.status(200).json(liveness);
  } catch (error) {
    res.status(503).json({ status: 'dead' });
  }
});

// Readiness probe - checks if the service is ready to handle requests
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: unknown = {};
  let isReady = true;
  
  // Check database connection
  try {
    await sequelize.authenticate();
    checks.database = { status: 'pass', message: 'Connected' };
  } catch (error) {
    checks.database = { status: 'fail', message: (error as Error).message };
    isReady = false;
  }
  
  // Check Redis connection
  try {
    await redis.ping();
    checks.redis = { status: 'pass', message: 'Connected' };
  } catch (error) {
    checks.redis = { status: 'fail', message: (error as Error).message };
    isReady = false;
  }
  
  // Check required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length === 0) {
    checks.environment = { status: 'pass', message: 'All required variables set' };
  } else {
    checks.environment = { 
      status: 'fail', 
      message: `Missing: ${missingEnvVars.join(', ')}` 
    };
    isReady = false;
  }
  
  const response = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks,
  };
  
  const status = isReady ? 200 : 503;
  res.status(status).json(response);
});

// Comprehensive health check - detailed system status
router.get('/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: unknown = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Database health
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    
    // Check for active connections
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'"
    );
    
    checks.database = {
      status: 'pass',
      duration: Date.now() - dbStart,
      metadata: {
        activeConnections: (results[0] as unknown).count,
        maxConnections: sequelize.config.pool?.max || 10,
      },
    };
  } catch (error) {
    checks.database = {
      status: 'fail',
      message: (error as Error).message,
    };
    overallStatus = 'unhealthy';
  }
  
  // Redis health
  try {
    const redisStart = Date.now();
    const pong = await redis.ping();
    const info = '' as string; // Redis info not directly available
    
    checks.redis = {
      status: 'pass',
      duration: Date.now() - redisStart,
      metadata: {
        response: pong,
        version: info.split('\n').find(l => l.startsWith('redis_version'))?.split(':')[1]?.trim(),
      },
    };
  } catch (error) {
    checks.redis = {
      status: 'fail',
      message: (error as Error).message,
    };
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }
  
  // Memory check
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem) * 100;
  
  checks.memory = {
    status: memPercent > 90 ? 'warn' : 'pass',
    metadata: {
      usagePercent: memPercent.toFixed(2),
      processRSS: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      processHeap: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      systemFree: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      systemTotal: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
    },
  };
  
  if (memPercent > 90) {
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }
  
  // CPU check
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  checks.cpu = {
    status: loadAvg[0] > cpus.length * 0.8 ? 'warn' : 'pass',
    metadata: {
      cores: cpus.length,
      loadAverage: {
        '1m': loadAvg[0].toFixed(2),
        '5m': loadAvg[1].toFixed(2),
        '15m': loadAvg[2].toFixed(2),
      },
    },
  };
  
  // Response time check
  const responseTime = Date.now() - startTime;
  checks.responseTime = {
    status: responseTime > 1000 ? 'warn' : 'pass',
    duration: responseTime,
  };
  
  // Build response
  const healthResult: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      memory: {
        process: memUsage,
        system: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          percentUsed: memPercent,
        },
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model,
        speed: cpus[0]?.speed,
        loadAverage: loadAvg,
      },
    },
  };
  
  // Determine HTTP status code
  let statusCode = 200;
  if (overallStatus === 'degraded') statusCode = 200; // Still operational
  if (overallStatus === 'unhealthy') statusCode = 503;
  
  res.status(statusCode).json(healthResult);
});

// Metrics endpoint - Prometheus format
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics: string[] = [];
    
    // Process metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP process_memory_rss_bytes Process RSS memory in bytes`);
    metrics.push(`# TYPE process_memory_rss_bytes gauge`);
    metrics.push(`process_memory_rss_bytes ${memUsage.rss}`);
    
    metrics.push(`# HELP process_memory_heap_used_bytes Process heap used in bytes`);
    metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
    metrics.push(`process_memory_heap_used_bytes ${memUsage.heapUsed}`);
    
    metrics.push(`# HELP process_memory_heap_total_bytes Process heap total in bytes`);
    metrics.push(`# TYPE process_memory_heap_total_bytes gauge`);
    metrics.push(`process_memory_heap_total_bytes ${memUsage.heapTotal}`);
    
    // CPU metrics
    const cpuUsage = process.cpuUsage();
    metrics.push(`# HELP process_cpu_user_seconds_total Process CPU user time in seconds`);
    metrics.push(`# TYPE process_cpu_user_seconds_total counter`);
    metrics.push(`process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`);
    
    metrics.push(`# HELP process_cpu_system_seconds_total Process CPU system time in seconds`);
    metrics.push(`# TYPE process_cpu_system_seconds_total counter`);
    metrics.push(`process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`);
    
    // Uptime
    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    metrics.push(`# TYPE process_uptime_seconds gauge`);
    metrics.push(`process_uptime_seconds ${process.uptime()}`);
    
    // System metrics
    metrics.push(`# HELP system_load_average System load average`);
    metrics.push(`# TYPE system_load_average gauge`);
    const loadAvg = os.loadavg();
    metrics.push(`system_load_average{period="1m"} ${loadAvg[0]}`);
    metrics.push(`system_load_average{period="5m"} ${loadAvg[1]}`);
    metrics.push(`system_load_average{period="15m"} ${loadAvg[2]}`);
    
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Startup probe - used during container startup
router.get('/startup', async (_req: Request, res: Response) => {
  try {
    // Check if all critical services are initialized
    const checks = {
      database: false,
      redis: false,
      migrations: false,
    };
    
    // Check database
    try {
      await sequelize.authenticate();
      checks.database = true;
    } catch (error) {
      // Database not ready
    }
    
    // Check Redis
    try {
      await redis.ping();
      checks.redis = true;
    } catch (error) {
      // Redis not ready
    }
    
    // Check if migrations are complete
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      );
      checks.migrations = (results[0] as unknown).count > 0;
    } catch (error) {
      // Migrations check failed
    }
    
    const allReady = Object.values(checks).every(v => v === true);
    
    if (allReady) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
        checks,
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        checks,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: (error as Error).message,
    });
  }
});

export default router;
