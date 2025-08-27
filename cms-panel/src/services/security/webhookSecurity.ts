/**
 * Webhook Security Service
 * Implements signature verification and domain validation for webhooks
 */

import * as crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface WebhookConfig {
  secret: string;
  algorithm?: string;
  allowedDomains?: string[];
  maxPayloadSize?: number;
  timeout?: number;
  replayProtection?: boolean;
  replayWindow?: number; // in seconds
}

export interface WebhookPayload {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp?: number;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    signatureValid?: boolean;
    domainValid?: boolean;
    timestampValid?: boolean;
    sizeValid?: boolean;
  };
}

class WebhookSecurityService {
  private static instance: WebhookSecurityService;
  private configs: Map<string, WebhookConfig> = new Map();
  private processedRequests: Map<string, number> = new Map();
  private readonly DEFAULT_ALGORITHM = 'sha256';
  private readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly DEFAULT_REPLAY_WINDOW = 300; // 5 minutes

  private constructor() {
    // Clean up old processed requests every minute
    setInterval(() => this.cleanupProcessedRequests(), 60000);
  }

  static getInstance(): WebhookSecurityService {
    if (!WebhookSecurityService.instance) {
      WebhookSecurityService.instance = new WebhookSecurityService();
    }
    return WebhookSecurityService.instance;
  }

  /**
   * Register webhook configuration
   */
  registerWebhook(name: string, config: WebhookConfig): void {
    if (!config.secret) {
      throw new Error('Webhook secret is required');
    }

    this.configs.set(name, {
      algorithm: this.DEFAULT_ALGORITHM,
      maxPayloadSize: this.DEFAULT_MAX_SIZE,
      replayWindow: this.DEFAULT_REPLAY_WINDOW,
      replayProtection: true,
      ...config,
    });

    logger.info(`Webhook '${name}' registered`, {
      allowedDomains: config.allowedDomains,
      algorithm: config.algorithm || this.DEFAULT_ALGORITHM,
    });
  }

  /**
   * Validate incoming webhook request
   */
  async validateWebhook(
    name: string,
    payload: WebhookPayload
  ): Promise<WebhookValidationResult> {
    const config = this.configs.get(name);
    
    if (!config) {
      logger.error(`Webhook '${name}' not configured`);
      return {
        isValid: false,
        error: 'Webhook not configured',
      };
    }

    const validationDetails: any = {};

    // 1. Validate payload size
    const payloadSize = JSON.stringify(payload.body).length;
    if (payloadSize > (config.maxPayloadSize || this.DEFAULT_MAX_SIZE)) {
      logger.warn(`Webhook payload too large: ${payloadSize} bytes`);
      validationDetails.sizeValid = false;
      return {
        isValid: false,
        error: 'Payload too large',
        details: validationDetails,
      };
    }
    validationDetails.sizeValid = true;

    // 2. Validate domain
    if (config.allowedDomains && config.allowedDomains.length > 0) {
      const url = new URL(payload.url);
      const domainValid = config.allowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          // Wildcard subdomain matching
          const baseDomain = domain.slice(2);
          return url.hostname.endsWith(baseDomain);
        }
        return url.hostname === domain;
      });

      validationDetails.domainValid = domainValid;
      if (!domainValid) {
        logger.warn(`Webhook from unauthorized domain: ${url.hostname}`);
        return {
          isValid: false,
          error: 'Domain not allowed',
          details: validationDetails,
        };
      }
    } else {
      validationDetails.domainValid = true;
    }

    // 3. Validate timestamp (replay protection)
    if (config.replayProtection) {
      const timestamp = payload.timestamp || this.extractTimestamp(payload.headers);
      
      if (!timestamp) {
        logger.warn('Webhook missing timestamp for replay protection');
        validationDetails.timestampValid = false;
        return {
          isValid: false,
          error: 'Missing timestamp',
          details: validationDetails,
        };
      }

      const now = Date.now() / 1000;
      const age = Math.abs(now - timestamp);
      
      if (age > (config.replayWindow || this.DEFAULT_REPLAY_WINDOW)) {
        logger.warn(`Webhook timestamp too old: ${age} seconds`);
        validationDetails.timestampValid = false;
        return {
          isValid: false,
          error: 'Request too old',
          details: validationDetails,
        };
      }

      // Check for replay
      const requestId = this.generateRequestId(name, payload, timestamp);
      if (this.processedRequests.has(requestId)) {
        logger.warn('Webhook replay detected');
        validationDetails.timestampValid = false;
        return {
          isValid: false,
          error: 'Replay detected',
          details: validationDetails,
        };
      }

      this.processedRequests.set(requestId, Date.now());
      validationDetails.timestampValid = true;
    }

    // 4. Validate signature
    const signature = this.extractSignature(payload.headers, name);
    
    if (!signature) {
      logger.warn('Webhook missing signature');
      validationDetails.signatureValid = false;
      return {
        isValid: false,
        error: 'Missing signature',
        details: validationDetails,
      };
    }

    const expectedSignature = this.generateSignature(
      config,
      payload.body,
      payload.timestamp
    );

    const signatureValid = this.secureCompare(signature, expectedSignature);
    validationDetails.signatureValid = signatureValid;

    if (!signatureValid) {
      logger.warn('Webhook signature verification failed');
      return {
        isValid: false,
        error: 'Invalid signature',
        details: validationDetails,
      };
    }

    logger.debug(`Webhook '${name}' validated successfully`);
    return {
      isValid: true,
      details: validationDetails,
    };
  }

  /**
   * Generate signature for outgoing webhook
   */
  generateWebhookSignature(
    name: string,
    payload: any,
    timestamp?: number
  ): string {
    const config = this.configs.get(name);
    
    if (!config) {
      throw new Error(`Webhook '${name}' not configured`);
    }

    return this.generateSignature(config, payload, timestamp);
  }

  /**
   * Generate webhook headers for outgoing request
   */
  generateWebhookHeaders(
    name: string,
    payload: any
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateWebhookSignature(name, payload, timestamp);

    return {
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Name': name,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate signature using HMAC
   */
  private generateSignature(
    config: WebhookConfig,
    payload: any,
    timestamp?: number
  ): string {
    const algorithm = config.algorithm || this.DEFAULT_ALGORITHM;
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);

    // Include timestamp in signature if provided
    const signaturePayload = timestamp 
      ? `${timestamp}.${payloadString}`
      : payloadString;

    const hmac = crypto.createHmac(algorithm, config.secret);
    hmac.update(signaturePayload);
    
    return `${algorithm}=${hmac.digest('hex')}`;
  }

  /**
   * Extract signature from headers
   */
  private extractSignature(
    headers: Record<string, string>,
    name: string
  ): string | null {
    // Try multiple header variations
    const signatureHeaders = [
      'x-webhook-signature',
      'x-signature',
      `x-${name}-signature`,
      'x-hub-signature',
      'x-hub-signature-256',
    ];

    for (const header of signatureHeaders) {
      const value = headers[header] || headers[header.toLowerCase()];
      if (value) {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract timestamp from headers
   */
  private extractTimestamp(headers: Record<string, string>): number | null {
    const timestampHeaders = [
      'x-webhook-timestamp',
      'x-timestamp',
      'timestamp',
    ];

    for (const header of timestampHeaders) {
      const value = headers[header] || headers[header.toLowerCase()];
      if (value) {
        const timestamp = parseInt(value, 10);
        if (!isNaN(timestamp)) {
          return timestamp;
        }
      }
    }

    return null;
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate unique request ID for replay protection
   */
  private generateRequestId(
    name: string,
    payload: WebhookPayload,
    timestamp: number
  ): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${name}:${timestamp}:${JSON.stringify(payload.body)}`);
    return hash.digest('hex');
  }

  /**
   * Clean up old processed requests
   */
  private cleanupProcessedRequests(): void {
    const now = Date.now();
    const maxAge = this.DEFAULT_REPLAY_WINDOW * 1000 * 2; // Keep for 2x replay window

    for (const [id, time] of this.processedRequests.entries()) {
      if (now - time > maxAge) {
        this.processedRequests.delete(id);
      }
    }
  }

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Must be HTTPS in production
      if (import.meta.env.PROD && parsedUrl.protocol !== 'https:') {
        logger.warn(`Webhook URL must use HTTPS: ${url}`);
        return false;
      }

      // Prevent localhost/internal IPs in production
      if (import.meta.env.PROD) {
        const hostname = parsedUrl.hostname;
        const internalPatterns = [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '::1',
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[01])\./,
          /^192\.168\./,
        ];

        for (const pattern of internalPatterns) {
          if (typeof pattern === 'string' && hostname === pattern) {
            logger.warn(`Webhook URL cannot use internal address: ${hostname}`);
            return false;
          }
          if (pattern instanceof RegExp && pattern.test(hostname)) {
            logger.warn(`Webhook URL cannot use internal address: ${hostname}`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Invalid webhook URL', error);
      return false;
    }
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(
    name: string,
    testUrl: string
  ): Promise<{ success: boolean; error?: string; response?: any }> {
    const config = this.configs.get(name);
    
    if (!config) {
      return {
        success: false,
        error: 'Webhook not configured',
      };
    }

    if (!this.validateWebhookUrl(testUrl)) {
      return {
        success: false,
        error: 'Invalid webhook URL',
      };
    }

    try {
      const testPayload = {
        event: 'test',
        timestamp: Date.now(),
        data: {
          message: 'Webhook test',
        },
      };

      const headers = this.generateWebhookHeaders(name, testPayload);

      const response = await fetch(testUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(config.timeout || 10000),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          response: await response.text(),
        };
      }

      return {
        success: true,
        response: await response.json().catch(() => null),
      };
    } catch (error) {
      logger.error('Webhook test failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }
}

// Export singleton instance
export const webhookSecurity = WebhookSecurityService.getInstance();

// Export middleware for Express
export function webhookSecurityMiddleware(webhookName: string) {
  return async (req: any, res: any, next: any) => {
    const payload: WebhookPayload = {
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      timestamp: parseInt(req.headers['x-webhook-timestamp'] || '0', 10),
    };

    const result = await webhookSecurity.validateWebhook(webhookName, payload);

    if (!result.isValid) {
      logger.warn(`Webhook validation failed: ${result.error}`, result.details);
      return res.status(401).json({
        error: 'Webhook validation failed',
        message: result.error,
      });
    }

    // Add validation result to request for logging
    req.webhookValidation = result;
    next();
  };
}