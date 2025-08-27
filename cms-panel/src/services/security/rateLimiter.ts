/**
 * Rate Limiting Service
 * Implements multiple rate limiting strategies to prevent abuse
 */

import { logger } from '../../utils/logger';

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  handler?: (req: any, res: any) => void;
  onLimitReached?: (key: string) => void;
}

export interface RateLimitRule {
  name: string;
  path?: string | RegExp;
  method?: string | string[];
  config: RateLimitConfig;
}

interface RequestRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  violations: number;
}

class RateLimiterService {
  private static instance: RateLimiterService;
  private stores: Map<string, Map<string, RequestRecord>> = new Map();
  private rules: RateLimitRule[] = [];
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();
  private cleanupTimer: any;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly BLACKLIST_THRESHOLD = 10; // violations before blacklisting
  private readonly BLACKLIST_DURATION = 3600000; // 1 hour

  private constructor() {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    
    // Setup default rules
    this.setupDefaultRules();
  }

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Setup default rate limiting rules
   */
  private setupDefaultRules(): void {
    // Strict rate limit for auth endpoints
    this.addRule({
      name: 'auth',
      path: /^\/auth\/(login|register|reset)/,
      config: {
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        onLimitReached: (key) => {
          logger.warn(`Authentication rate limit reached for ${key}`);
        }
      }
    });

    // Moderate rate limit for API endpoints
    this.addRule({
      name: 'api',
      path: /^\/api\//,
      config: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false
      }
    });

    // Strict rate limit for file uploads
    this.addRule({
      name: 'upload',
      path: /upload/i,
      method: 'POST',
      config: {
        windowMs: 60000, // 1 minute
        maxRequests: 10
      }
    });

    // Very strict rate limit for password reset
    this.addRule({
      name: 'password-reset',
      path: /password-reset|forgot-password/i,
      config: {
        windowMs: 3600000, // 1 hour
        maxRequests: 3
      }
    });

    // Rate limit for search endpoints
    this.addRule({
      name: 'search',
      path: /search/i,
      config: {
        windowMs: 60000, // 1 minute
        maxRequests: 30
      }
    });
  }

  /**
   * Add a rate limiting rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.push(rule);
    this.stores.set(rule.name, new Map());
    
    logger.info(`Rate limit rule '${rule.name}' added`, {
      path: rule.path?.toString(),
      method: rule.method,
      maxRequests: rule.config.maxRequests,
      windowMs: rule.config.windowMs
    });
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(
    identifier: string,
    ruleName?: string,
    path?: string,
    method?: string
  ): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
    // Check blacklist first
    if (this.blacklist.has(identifier)) {
      return {
        allowed: false,
        reason: 'Blacklisted due to repeated violations'
      };
    }

    // Check whitelist
    if (this.whitelist.has(identifier)) {
      return { allowed: true };
    }

    // Find applicable rules
    const applicableRules = ruleName 
      ? this.rules.filter(r => r.name === ruleName)
      : this.findApplicableRules(path, method);

    if (applicableRules.length === 0) {
      return { allowed: true };
    }

    // Check each applicable rule
    for (const rule of applicableRules) {
      const result = this.checkRuleLimit(identifier, rule);
      
      if (!result.allowed) {
        // Track violations
        this.trackViolation(identifier, rule.name);
        
        // Call limit reached handler
        if (rule.config.onLimitReached) {
          rule.config.onLimitReached(identifier);
        }
        
        return result;
      }
    }

    return { allowed: true };
  }

  /**
   * Check limit for a specific rule
   */
  private checkRuleLimit(
    identifier: string,
    rule: RateLimitRule
  ): { allowed: boolean; retryAfter?: number; reason?: string } {
    const store = this.stores.get(rule.name);
    if (!store) {
      return { allowed: true };
    }

    const now = Date.now();
    let record = store.get(identifier);

    // Create new record if doesn't exist
    if (!record) {
      record = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
        blocked: false,
        violations: 0
      };
      store.set(identifier, record);
      return { allowed: true };
    }

    // Check if window has expired
    const windowExpired = now - record.firstRequest > rule.config.windowMs;
    
    if (windowExpired) {
      // Reset the window
      record.count = 1;
      record.firstRequest = now;
      record.lastRequest = now;
      record.blocked = false;
      return { allowed: true };
    }

    // Increment counter
    record.count++;
    record.lastRequest = now;

    // Check if limit exceeded
    if (record.count > rule.config.maxRequests) {
      record.blocked = true;
      const retryAfter = Math.ceil((record.firstRequest + rule.config.windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded for ${rule.name}. Max ${rule.config.maxRequests} requests per ${rule.config.windowMs / 1000} seconds.`
      };
    }

    return { allowed: true };
  }

  /**
   * Find applicable rules for a request
   */
  private findApplicableRules(path?: string, method?: string): RateLimitRule[] {
    return this.rules.filter(rule => {
      // Check path match
      if (rule.path) {
        if (!path) return false;
        
        if (typeof rule.path === 'string') {
          if (!path.startsWith(rule.path)) return false;
        } else if (rule.path instanceof RegExp) {
          if (!rule.path.test(path)) return false;
        }
      }

      // Check method match
      if (rule.method) {
        if (!method) return false;
        
        const methods = Array.isArray(rule.method) ? rule.method : [rule.method];
        if (!methods.includes(method.toUpperCase())) return false;
      }

      return true;
    });
  }

  /**
   * Track violations and potentially blacklist
   */
  private trackViolation(identifier: string, ruleName: string): void {
    const store = this.stores.get(ruleName);
    if (!store) return;

    const record = store.get(identifier);
    if (!record) return;

    record.violations++;

    // Check if should blacklist
    if (record.violations >= this.BLACKLIST_THRESHOLD) {
      this.blacklist.add(identifier);
      
      // Auto-remove from blacklist after duration
      setTimeout(() => {
        this.blacklist.delete(identifier);
        logger.info(`Removed ${identifier} from blacklist`);
      }, this.BLACKLIST_DURATION);

      logger.warn(`Blacklisted ${identifier} due to ${record.violations} violations`);
    }
  }

  /**
   * Cleanup old records
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [ruleName, store] of this.stores) {
      const rule = this.rules.find(r => r.name === ruleName);
      if (!rule) continue;

      for (const [key, record] of store) {
        // Remove records older than 2x the window
        if (now - record.lastRequest > rule.config.windowMs * 2) {
          store.delete(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} old rate limit records`);
    }
  }

  /**
   * Add to whitelist
   */
  addToWhitelist(identifier: string): void {
    this.whitelist.add(identifier);
    logger.info(`Added ${identifier} to rate limit whitelist`);
  }

  /**
   * Remove from whitelist
   */
  removeFromWhitelist(identifier: string): void {
    this.whitelist.delete(identifier);
    logger.info(`Removed ${identifier} from rate limit whitelist`);
  }

  /**
   * Add to blacklist
   */
  addToBlacklist(identifier: string, duration?: number): void {
    this.blacklist.add(identifier);
    
    if (duration) {
      setTimeout(() => {
        this.blacklist.delete(identifier);
      }, duration);
    }
    
    logger.warn(`Added ${identifier} to rate limit blacklist`);
  }

  /**
   * Remove from blacklist
   */
  removeFromBlacklist(identifier: string): void {
    this.blacklist.delete(identifier);
    logger.info(`Removed ${identifier} from rate limit blacklist`);
  }

  /**
   * Get current limits for an identifier
   */
  getLimits(identifier: string): Map<string, RequestRecord> {
    const limits = new Map<string, RequestRecord>();
    
    for (const [ruleName, store] of this.stores) {
      const record = store.get(identifier);
      if (record) {
        limits.set(ruleName, record);
      }
    }
    
    return limits;
  }

  /**
   * Reset limits for an identifier
   */
  resetLimits(identifier: string, ruleName?: string): void {
    if (ruleName) {
      const store = this.stores.get(ruleName);
      store?.delete(identifier);
    } else {
      for (const store of this.stores.values()) {
        store.delete(identifier);
      }
    }
    
    logger.info(`Reset rate limits for ${identifier}`);
  }

  /**
   * Express middleware
   */
  middleware(ruleName?: string) {
    return async (req: any, res: any, next: any) => {
      // Generate identifier (IP by default, can be customized)
      const identifier = this.getIdentifier(req);
      
      // Check rate limit
      const result = await this.checkLimit(
        identifier,
        ruleName,
        req.path,
        req.method
      );

      if (!result.allowed) {
        // Set retry-after header
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter);
        }
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', '0');
        res.setHeader('X-RateLimit-Remaining', '0');
        
        logger.warn(`Rate limit exceeded`, {
          identifier,
          path: req.path,
          method: req.method,
          reason: result.reason
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: result.reason || 'Rate limit exceeded',
          retryAfter: result.retryAfter
        });
      }

      next();
    };
  }

  /**
   * Get identifier from request
   */
  private getIdentifier(req: any): string {
    // Try to get authenticated user ID first
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    
    // Fall back to IP address
    const ip = req.ip || 
                req.connection?.remoteAddress || 
                req.socket?.remoteAddress ||
                req.headers?.['x-forwarded-for']?.split(',')[0] ||
                'unknown';
    
    return `ip:${ip}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    rules: number;
    activeRecords: number;
    blacklisted: number;
    whitelisted: number;
  } {
    let activeRecords = 0;
    
    for (const store of this.stores.values()) {
      activeRecords += store.size;
    }
    
    return {
      rules: this.rules.length,
      activeRecords,
      blacklisted: this.blacklist.size,
      whitelisted: this.whitelist.size
    };
  }
}

// Export singleton instance
export const rateLimiter = RateLimiterService.getInstance();

// Export middleware factory functions
export const authRateLimit = rateLimiter.middleware('auth');
export const apiRateLimit = rateLimiter.middleware('api');
export const uploadRateLimit = rateLimiter.middleware('upload');