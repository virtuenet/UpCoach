/**
 * Response Cache Middleware
 *
 * HTTP response caching with ETag, Last-Modified, and Cache-Control headers.
 * Supports conditional requests and cache invalidation.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import {
  getCacheService,
  TTL_PRESETS,
  CACHE_NAMESPACES,
} from '../services/cache/RedisCacheService';

// Cache configuration for routes
export interface ResponseCacheConfig {
  ttl: number;
  private?: boolean;
  varyHeaders?: string[];
  tags?: string[];
  skipCondition?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
}

// Cached response structure
interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  etag: string;
  lastModified: string;
  cachedAt: number;
}

// Default cache configurations for different route types
export const CACHE_CONFIGS = {
  STATIC: {
    ttl: TTL_PRESETS.VERY_LONG,
    private: false,
    tags: ['static'],
  },
  USER_DATA: {
    ttl: TTL_PRESETS.SHORT,
    private: true,
    varyHeaders: ['Authorization'],
    tags: ['user-data'],
  },
  ANALYTICS: {
    ttl: TTL_PRESETS.MEDIUM,
    private: true,
    varyHeaders: ['Authorization'],
    tags: ['analytics'],
  },
  RECOMMENDATIONS: {
    ttl: TTL_PRESETS.MEDIUM,
    private: true,
    varyHeaders: ['Authorization'],
    tags: ['recommendations'],
  },
  CONTENT: {
    ttl: TTL_PRESETS.LONG,
    private: false,
    tags: ['content'],
  },
  COACH_LISTING: {
    ttl: TTL_PRESETS.MEDIUM,
    private: false,
    tags: ['coach-listing'],
  },
} as const;

/**
 * Generate ETag from content
 */
function generateETag(content: string): string {
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, config: ResponseCacheConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  const parts = [
    req.method,
    req.originalUrl,
  ];

  // Add vary headers to key
  if (config.varyHeaders) {
    for (const header of config.varyHeaders) {
      const value = req.get(header);
      if (value) {
        parts.push(`${header}:${value}`);
      }
    }
  }

  const hash = crypto
    .createHash('md5')
    .update(parts.join('|'))
    .digest('hex');

  return `${CACHE_NAMESPACES.API_RESPONSE}:${hash}`;
}

/**
 * Response cache middleware factory
 */
export function responseCache(config: ResponseCacheConfig): RequestHandler {
  const cache = getCacheService();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check skip condition
    if (config.skipCondition && config.skipCondition(req)) {
      return next();
    }

    // Skip if cache is not available
    if (!cache.isReady()) {
      return next();
    }

    const cacheKey = generateCacheKey(req, config);

    try {
      // Try to get cached response
      const cached = await cache.get<CachedResponse>(cacheKey);

      if (cached) {
        // Check If-None-Match header (ETag validation)
        const ifNoneMatch = req.get('If-None-Match');
        if (ifNoneMatch && ifNoneMatch === cached.etag) {
          res.status(304).end();
          return;
        }

        // Check If-Modified-Since header
        const ifModifiedSince = req.get('If-Modified-Since');
        if (ifModifiedSince) {
          const clientDate = new Date(ifModifiedSince).getTime();
          const cachedDate = new Date(cached.lastModified).getTime();
          if (clientDate >= cachedDate) {
            res.status(304).end();
            return;
          }
        }

        // Return cached response
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('ETag', cached.etag);
        res.set('Last-Modified', cached.lastModified);
        res.set('Cache-Control', buildCacheControl(config));

        // Set original headers
        for (const [key, value] of Object.entries(cached.headers)) {
          if (!['cache-control', 'etag', 'last-modified'].includes(key.toLowerCase())) {
            res.set(key, value);
          }
        }

        res.status(cached.statusCode);
        res.send(cached.body);
        return;
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Store original methods
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);
      const originalEnd = res.end.bind(res);

      let responseBody = '';
      let responseSent = false;

      const cacheResponse = async (body: string) => {
        if (responseSent || res.statusCode >= 400) {
          return;
        }
        responseSent = true;

        const now = new Date();
        const etag = generateETag(body);
        const lastModified = now.toUTCString();

        // Set cache headers
        res.set('ETag', etag);
        res.set('Last-Modified', lastModified);
        res.set('Cache-Control', buildCacheControl(config));

        // Cache the response
        const cachedResponse: CachedResponse = {
          statusCode: res.statusCode,
          headers: Object.fromEntries(
            Object.entries(res.getHeaders())
              .filter(([_, v]) => typeof v === 'string')
              .map(([k, v]) => [k, v as string])
          ),
          body,
          etag,
          lastModified,
          cachedAt: now.getTime(),
        };

        await cache.set(
          cacheKey,
          cachedResponse,
          config.ttl,
          config.tags || []
        );
      };

      // Override send
      res.send = function (body: unknown): Response {
        if (typeof body === 'string') {
          responseBody = body;
        } else if (Buffer.isBuffer(body)) {
          responseBody = body.toString();
        } else {
          responseBody = JSON.stringify(body);
        }
        cacheResponse(responseBody);
        return originalSend(body);
      };

      // Override json
      res.json = function (body: unknown): Response {
        responseBody = JSON.stringify(body);
        cacheResponse(responseBody);
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Response cache error:', error);
      next();
    }
  };
}

/**
 * Build Cache-Control header value
 */
function buildCacheControl(config: ResponseCacheConfig): string {
  const directives: string[] = [];

  if (config.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  directives.push(`max-age=${config.ttl}`);

  return directives.join(', ');
}

/**
 * No-cache middleware for dynamic routes
 */
export function noCache(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  };
}

/**
 * Cache purge middleware
 */
export function cachePurge(tags?: string[]): RequestHandler {
  const cache = getCacheService();

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'PURGE') {
      try {
        if (tags && tags.length > 0) {
          const { getInvalidationService } = await import('../services/cache/CacheInvalidationService');
          await getInvalidationService().invalidateNamespace(tags[0]);
        } else {
          const cacheKey = generateCacheKey(req, { ttl: 0 });
          await cache.delete(cacheKey);
        }
        res.status(200).json({ success: true, message: 'Cache purged' });
        return;
      } catch (error) {
        res.status(500).json({ success: false, error: 'Cache purge failed' });
        return;
      }
    }
    next();
  };
}

/**
 * Conditional GET helper
 */
export function conditionalGet(
  lastModified: Date,
  etag?: string
): (req: Request, res: Response) => boolean {
  return (req: Request, res: Response): boolean => {
    // Set headers
    res.set('Last-Modified', lastModified.toUTCString());
    if (etag) {
      res.set('ETag', etag);
    }

    // Check If-None-Match
    const ifNoneMatch = req.get('If-None-Match');
    if (etag && ifNoneMatch === etag) {
      res.status(304).end();
      return true;
    }

    // Check If-Modified-Since
    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince).getTime();
      if (clientDate >= lastModified.getTime()) {
        res.status(304).end();
        return true;
      }
    }

    return false;
  };
}

export default responseCache;
