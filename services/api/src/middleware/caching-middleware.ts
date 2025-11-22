import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { performanceCacheService, CacheKeys, CacheTTL } from '../services/cache/PerformanceCacheService';
import { logger } from '../utils/logger';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  ttl?: number;
  key?: string | ((req: Request) => string);
  condition?: (req: Request, res: Response) => boolean;
  varyBy?: string[];
  tags?: string[];
  strategy?: 'cache-first' | 'network-first' | 'cache-only';
  skipCache?: boolean;
}

/**
 * Generate cache key based on request parameters
 */
function generateCacheKey(req: Request, customKey?: string | ((req: Request) => string)): string {
  if (typeof customKey === 'function') {
    return customKey(req);
  }

  if (typeof customKey === 'string') {
    return customKey;
  }

  // Default cache key generation
  const method = req.method;
  const path = req.route?.path || req.path;
  const query = JSON.stringify(req.query);
  const body = req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : '';
  const userId = req.user?.id || 'anonymous';

  const keyData = `${method}:${path}:${query}:${body}:${userId}`;
  const hash = createHash('md5').update(keyData).digest('hex');

  return CacheKeys.apiResponse(path, hash);
}

/**
 * Check if request should be cached
 */
function shouldCache(req: Request, res: Response, config: CacheConfig): boolean {
  // Skip caching if explicitly disabled
  if (config.skipCache) {
    return false;
  }

  // Skip if custom condition returns false
  if (config.condition && !config.condition(req, res)) {
    return false;
  }

  // Only cache successful GET requests by default
  if (req.method !== 'GET') {
    return false;
  }

  // Skip caching for authenticated routes that might contain sensitive data
  if (req.headers.authorization && !config.key) {
    logger.debug('Skipping cache for authenticated request without explicit key');
    return false;
  }

  return true;
}

/**
 * Extract vary headers for cache key generation
 */
function extractVaryData(req: Request, varyBy?: string[]): string {
  if (!varyBy || varyBy.length === 0) {
    return '';
  }

  const varyData: Record<string, any> = {};

  for (const field of varyBy) {
    switch (field.toLowerCase()) {
      case 'user-agent':
        varyData['user-agent'] = req.get('user-agent');
        break;
      case 'accept-language':
        varyData['accept-language'] = req.get('accept-language');
        break;
      case 'authorization':
        // Don't include the actual token, just indicate presence
        varyData['authorized'] = !!req.headers.authorization;
        break;
      case 'user-id':
        varyData['user-id'] = req.user?.id;
        break;
      default:
        varyData[field] = req.get(field) || req.body?.[field] || req.query?.[field];
    }
  }

  return JSON.stringify(varyData);
}

/**
 * Create caching middleware
 */
export function cacheMiddleware(config: CacheConfig = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_DEV_CACHE) {
      return next();
    }

    try {
      // Check if we should cache this request
      if (!shouldCache(req, res, config)) {
        return next();
      }

      // Generate cache key
      let cacheKey = generateCacheKey(req, config.key);

      // Add vary data to cache key if specified
      if (config.varyBy) {
        const varyData = extractVaryData(req, config.varyBy);
        const varyHash = createHash('md5').update(varyData).digest('hex');
        cacheKey += `:vary:${varyHash}`;
      }

      // Try to get cached response
      const cachedResponse = await performanceCacheService.get(cacheKey);

      if (cachedResponse) {
        logger.debug('Cache hit', { key: cacheKey, path: req.path });

        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey.substring(0, 32) + '...',
          'Cache-Control': `public, max-age=${config.ttl || CacheTTL.DEFAULT}`
        });

        // Return cached response
        return res.status(cachedResponse.statusCode || 200).json(cachedResponse.data);
      }

      logger.debug('Cache miss', { key: cacheKey, path: req.path });

      // Intercept response to cache it
      const originalSend = res.send;
      const originalJson = res.json;
      let responseData: unknown;
      let statusCode = 200;

      // Override res.json to capture response data
      res.json = function(data: unknown) {
        responseData = data;
        statusCode = res.statusCode;
        return originalJson.call(this, data);
      };

      // Override res.send to capture response data
      res.send = function(data: unknown) {
        if (!responseData) {
          responseData = data;
          statusCode = res.statusCode;
        }
        return originalSend.call(this, data);
      };

      // Hook into response finish event
      res.on('finish', async () => {
        try {
          // Only cache successful responses
          if (statusCode >= 200 && statusCode < 300 && responseData) {
            const cacheData = {
              data: responseData,
              statusCode,
              timestamp: Date.now(),
              headers: res.getHeaders()
            };

            // Cache the response
            const ttl = config.ttl || CacheTTL.DEFAULT;
            await performanceCacheService.set(cacheKey, cacheData, ttl);

            // Add cache tags if specified
            if (config.tags && config.tags.length > 0) {
              for (const tag of config.tags) {
                const tagKey = `cache:tag:${tag}`;
                await performanceCacheService.sadd(tagKey, [cacheKey], ttl);
              }
            }

            logger.debug('Response cached', {
              key: cacheKey,
              path: req.path,
              statusCode,
              ttl
            });
          }
        } catch (error) {
          logger.error('Error caching response', { key: cacheKey, error });
        }
      });

      // Set cache miss headers
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey.substring(0, 32) + '...'
      });

      next();

    } catch (error) {
      logger.error('Cache middleware error', error);
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(patterns: string[] | string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

      // Invalidate cache after successful response
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            let totalInvalidated = 0;

            for (const pattern of patternsArray) {
              // Support template variables in patterns
              const resolvedPattern = pattern
                .replace('{{userId}}', req.user?.id || '*')
                .replace('{{id}}', req.params.id || '*')
                .replace('{{route}}', req.route?.path || req.path);

              const invalidated = await performanceCacheService.invalidatePattern(resolvedPattern);
              totalInvalidated += invalidated;
            }

            if (totalInvalidated > 0) {
              logger.info('Cache invalidated', {
                patterns: patternsArray,
                invalidated: totalInvalidated,
                path: req.path,
                method: req.method
              });
            }
          } catch (error) {
            logger.error('Cache invalidation error', error);
          }
        }
      });

      next();
    } catch (error) {
      logger.error('Cache invalidation middleware error', error);
      next();
    }
  };
}

/**
 * Cache warming middleware
 */
export function warmCache(warmupConfig: {
  key: string;
  handler: (req: Request) => Promise<unknown>;
  ttl?: number;
  condition?: (req: Request) => boolean;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if warming condition is met
      if (warmupConfig.condition && !warmupConfig.condition(req)) {
        return next();
      }

      // Perform cache warming in background
      setImmediate(async () => {
        try {
          const data = await warmupConfig.handler(req);
          const ttl = warmupConfig.ttl || CacheTTL.DEFAULT;

          await performanceCacheService.set(warmupConfig.key, data, ttl);

          logger.debug('Cache warmed', {
            key: warmupConfig.key,
            ttl,
            path: req.path
          });
        } catch (error) {
          logger.error('Cache warming error', { key: warmupConfig.key, error });
        }
      });

      next();
    } catch (error) {
      logger.error('Cache warming middleware error', error);
      next();
    }
  };
}

/**
 * Cache status middleware for monitoring
 */
export function cacheStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/cache/status' && req.method === 'GET') {
      try {
        const stats = await performanceCacheService.getCacheStats();
        return res.json({
          cache: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to get cache status',
          details: error.message
        });
      }
    }

    next();
  };
}

/**
 * Conditional caching based on user type
 */
export function conditionalCache(config: {
  authenticated?: CacheConfig;
  anonymous?: CacheConfig;
  premium?: CacheConfig;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    let selectedConfig: CacheConfig;

    if (req.user) {
      if (req.user.isPremium && config.premium) {
        selectedConfig = config.premium;
      } else if (config.authenticated) {
        selectedConfig = config.authenticated;
      } else {
        return next();
      }
    } else {
      selectedConfig = config.anonymous || {};
    }

    return cacheMiddleware(selectedConfig)(req, res, next);
  };
}

/**
 * Rate limiting with cache
 */
export function cacheBasedRateLimit(config: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ?
        config.keyGenerator(req) :
        `rate_limit:${req.ip}:${req.path}`;

      const currentCount = await performanceCacheService.increment(
        key,
        1,
        Math.ceil(config.windowMs / 1000)
      );

      const remaining = Math.max(0, config.maxRequests - currentCount);

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
      });

      if (currentCount > config.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error', error);
      // Continue without rate limiting on error
      next();
    }
  };
}

// Export pre-configured middleware for common scenarios
export const commonCacheMiddleware = {
  // Cache public content for 30 minutes
  publicContent: cacheMiddleware({
    ttl: CacheTTL.CONTENT,
    varyBy: ['accept-language'],
    tags: ['content']
  }),

  // Cache user-specific data for 5 minutes
  userSpecific: cacheMiddleware({
    ttl: CacheTTL.SHORT,
    varyBy: ['user-id'],
    condition: (req) => !!req.user
  }),

  // Cache analytics data for 15 minutes
  analytics: cacheMiddleware({
    ttl: CacheTTL.ANALYTICS,
    tags: ['analytics']
  }),

  // Cache ML results for 1 hour
  mlResults: cacheMiddleware({
    ttl: CacheTTL.ML,
    tags: ['ml', 'predictions']
  }),

  // No cache for sensitive operations
  noCache: (req: Request, res: Response, next: NextFunction) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  }
};