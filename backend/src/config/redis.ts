import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient>;

export async function initializeRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();
}

export function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redisClient.get(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function cacheSet(key: string, value: any, expirySeconds?: number): Promise<void> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (expirySeconds) {
    await redisClient.setEx(key, expirySeconds, stringValue);
  } else {
    await redisClient.set(key, stringValue);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  await redisClient.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const exists = await redisClient.exists(key);
  return exists === 1;
} 