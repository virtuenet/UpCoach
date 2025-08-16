import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';

interface WebhookConfig {
  secret: string;
  algorithm?: string;
  headerName?: string;
  maxAge?: number; // Maximum age of webhook in seconds
  replayProtection?: boolean;
}

/**
 * Generic webhook signature verification middleware
 */
export function verifyWebhookSignature(config: WebhookConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const {
      secret,
      algorithm = 'sha256',
      headerName = 'x-webhook-signature',
      maxAge = 300, // 5 minutes default
      replayProtection = true
    } = config;

    try {
      // Get signature from header
      const signature = req.headers[headerName] as string;
      
      if (!signature) {
        logger.error(`Missing webhook signature header: ${headerName}`);
        return res.status(401).json({ 
          error: 'Missing signature',
          code: 'MISSING_SIGNATURE' 
        });
      }

      // Get timestamp if included in signature
      const timestamp = req.headers['x-webhook-timestamp'] as string;
      
      // Check timestamp to prevent replay attacks
      if (replayProtection && timestamp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const webhookTime = parseInt(timestamp, 10);
        
        if (isNaN(webhookTime)) {
          return res.status(401).json({ 
            error: 'Invalid timestamp',
            code: 'INVALID_TIMESTAMP' 
          });
        }
        
        const age = currentTime - webhookTime;
        if (age > maxAge || age < -maxAge) {
          logger.warn('Webhook timestamp outside allowed window', { 
            age, 
            maxAge 
          });
          return res.status(401).json({ 
            error: 'Request too old',
            code: 'REQUEST_TOO_OLD' 
          });
        }
      }

      // Calculate expected signature
      const payload = timestamp 
        ? `${timestamp}.${JSON.stringify(req.body)}`
        : JSON.stringify(req.body);
        
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      if (signatureBuffer.length !== expectedBuffer.length) {
        logger.error('Signature length mismatch');
        return res.status(401).json({ 
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE' 
        });
      }
      
      if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        logger.error('Webhook signature verification failed');
        return res.status(401).json({ 
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE' 
        });
      }

      // Check for replay if we have an event ID
      if (replayProtection && req.body.id) {
        const eventKey = `webhook:processed:${req.body.id}`;
        const wasProcessed = await redis.get(eventKey);
        
        if (wasProcessed) {
          logger.warn('Duplicate webhook detected', { eventId: req.body.id });
          return res.status(200).json({ 
            received: true,
            duplicate: true 
          });
        }
        
        // Mark as processed (expire after 24 hours)
        await redis.setEx(eventKey, 86400, 'true');
      }

      logger.info('Webhook signature verified successfully');
      next();
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.status(500).json({ 
        error: 'Verification error',
        code: 'VERIFICATION_ERROR' 
      });
    }
  };
}

/**
 * Rate limiting for webhooks
 */
export function webhookRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this identifier
    const existingRequests = requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = existingRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      logger.warn('Webhook rate limit exceeded', { 
        identifier, 
        requests: recentRequests.length 
      });
      return res.status(429).json({ 
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED' 
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, times] of requests.entries()) {
        const recent = times.filter(time => time > windowStart);
        if (recent.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, recent);
        }
      }
    }
    
    next();
  };
}

/**
 * IP whitelist for webhooks
 */
export function webhookIPWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Check if IP is in whitelist
    const isAllowed = allowedIPs.some(ip => {
      if (ip.includes('/')) {
        // CIDR notation support
        return isIPInCIDR(clientIP, ip);
      }
      return clientIP === ip;
    });
    
    if (!isAllowed) {
      logger.warn('Webhook from unauthorized IP', { clientIP });
      return res.status(403).json({ 
        error: 'Unauthorized IP',
        code: 'UNAUTHORIZED_IP' 
      });
    }
    
    next();
  };
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = (0xffffffff << (32 - parseInt(bits, 10))) >>> 0;
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IP address to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  return parts.reduce((acc, part, i) => {
    return acc + (parseInt(part, 10) << (8 * (3 - i)));
  }, 0) >>> 0;
}

/**
 * Webhook event deduplication
 */
export async function deduplicateWebhook(
  eventId: string,
  ttl: number = 86400 // 24 hours default
): Promise<boolean> {
  const key = `webhook:event:${eventId}`;
  
  try {
    // Check if event was already processed
    const exists = await redis.get(key);
    if (exists) {
      logger.info('Duplicate webhook event detected', { eventId });
      return true; // Is duplicate
    }
    
    // Mark as processed
    await redis.setEx(key, ttl, JSON.stringify({
      processedAt: new Date().toISOString(),
      eventId
    }));
    
    return false; // Not duplicate
  } catch (error) {
    logger.error('Error checking webhook deduplication', { error, eventId });
    return false; // Process anyway on error
  }
}