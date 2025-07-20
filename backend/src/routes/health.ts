import { Router } from 'express';
import { getPool } from '../config/database';
import { getRedis } from '../config/redis';

const router = Router();

router.get('/', async (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'up',
      database: 'checking',
      redis: 'checking'
    }
  };

  try {
    // Check database
    const pool = getPool();
    await pool.query('SELECT 1');
    health.services.database = 'up';
  } catch (error) {
    health.services.database = 'down';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    const redis = getRedis();
    await redis.ping();
    health.services.redis = 'up';
  } catch (error) {
    health.services.redis = 'down';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router; 