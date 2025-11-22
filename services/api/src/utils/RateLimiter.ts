/**
 * Simple rate limiter utility
 * Basic rate limiting without external dependencies
 */

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  timestamp: number;
  success?: boolean;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  async limit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];

    // Filter out expired requests
    const validRequests = existingRequests.filter(req => req.timestamp > windowStart);

    // Check if we can make another request
    const allowed = validRequests.length < this.options.maxRequests;

    if (allowed) {
      // Add this request
      validRequests.push({ timestamp: now });
      this.requests.set(identifier, validRequests);
    }

    const remaining = Math.max(0, this.options.maxRequests - validRequests.length);
    const resetTime = validRequests.length > 0 ?
      validRequests[0].timestamp + this.options.windowMs :
      now + this.options.windowMs;

    return { allowed, remaining, resetTime };
  }

  async recordSuccess(identifier: string): Promise<void> {
    if (this.options.skipSuccessfulRequests) {
      this.removeLatestRequest(identifier);
    } else {
      this.markLatestRequest(identifier, true);
    }
  }

  async recordFailure(identifier: string): Promise<void> {
    if (this.options.skipFailedRequests) {
      this.removeLatestRequest(identifier);
    } else {
      this.markLatestRequest(identifier, false);
    }
  }

  private removeLatestRequest(identifier: string): void {
    const requests = this.requests.get(identifier);
    if (requests && requests.length > 0) {
      requests.pop();
      this.requests.set(identifier, requests);
    }
  }

  private markLatestRequest(identifier: string, success: boolean): void {
    const requests = this.requests.get(identifier);
    if (requests && requests.length > 0) {
      requests[requests.length - 1].success = success;
    }
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(req => req.timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export default RateLimiter;