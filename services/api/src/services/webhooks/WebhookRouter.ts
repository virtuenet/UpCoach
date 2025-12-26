import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { RetryPolicy } from './RetryPolicy';
import * as crypto from 'crypto';

/**
 * Webhook Router
 *
 * Generic webhook routing and transformation layer:
 * - Receive webhooks from external services
 * - Transform payloads using JSONPath rules
 * - Route to internal event handlers
 * - Signature verification
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed webhooks
 *
 * Supported transformations:
 * - JSONPath field mapping
 * - Data type conversion
 * - Custom JavaScript transformations
 * - Header extraction
 */

export interface WebhookRoute {
  id: string;
  tenantId: string;
  name: string;
  sourceUrl: string;
  targetUrl: string;
  transformRules: TransformRule[];
  signatureSecret?: string;
  active: boolean;
  createdAt: Date;
}

export interface TransformRule {
  type: 'jsonpath' | 'javascript' | 'header';
  source: string;
  target: string;
  defaultValue?: any;
}

export interface WebhookPayload {
  headers: Record<string, string>;
  body: any;
  signature?: string;
}

export interface TransformedPayload {
  data: any;
  metadata: {
    sourceUrl: string;
    receivedAt: string;
    transformedBy: string;
  };
}

export class WebhookRouter {
  private db: Pool;
  private httpClient: AxiosInstance;
  private retryPolicy: RetryPolicy;

  constructor(db: Pool) {
    this.db = db;
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UpCoach-Webhook-Router/1.0',
      },
    });
    this.retryPolicy = new RetryPolicy();
  }

  /**
   * Create webhook route
   */
  async createRoute(
    tenantId: string,
    name: string,
    sourceUrl: string,
    targetUrl: string,
    transformRules: TransformRule[],
    signatureSecret?: string
  ): Promise<WebhookRoute> {
    const query = `
      INSERT INTO webhook_routes (
        tenant_id, name, source_url, target_url,
        transform_rules, signature_secret, active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [
      tenantId,
      name,
      sourceUrl,
      targetUrl,
      JSON.stringify(transformRules),
      signatureSecret,
    ]);

    logger.info('Webhook route created', {
      tenantId,
      name,
      routeId: result.rows[0].id,
    });

    return this.mapRowToRoute(result.rows[0]);
  }

  /**
   * Receive and process webhook
   */
  async processWebhook(
    routeId: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const route = await this.getRoute(routeId);
      if (!route || !route.active) {
        throw new Error(`Webhook route ${routeId} not found or inactive`);
      }

      // Verify signature if required
      if (route.signatureSecret) {
        this.verifySignature(payload, route.signatureSecret);
      }

      // Transform payload
      const transformed = await this.transformPayload(payload, route.transformRules);

      // Add metadata
      const enrichedPayload: TransformedPayload = {
        data: transformed,
        metadata: {
          sourceUrl: route.sourceUrl,
          receivedAt: new Date().toISOString(),
          transformedBy: `route:${route.id}`,
        },
      };

      // Route to target with retry
      await this.retryPolicy.executeWithRetry(
        async () => {
          await this.httpClient.post(route.targetUrl, enrichedPayload);
        },
        5, // max retries
        1000 // initial delay
      );

      // Log success
      await this.logWebhook(route.id, route.tenantId, true, null);

      logger.info('Webhook processed successfully', {
        routeId,
        tenantId: route.tenantId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Webhook processing failed', {
        routeId,
        error: errorMessage,
      });

      // Send to dead letter queue
      await this.sendToDeadLetterQueue(routeId, payload, errorMessage);

      // Log failure
      const route = await this.getRoute(routeId);
      if (route) {
        await this.logWebhook(route.id, route.tenantId, false, errorMessage);
      }

      throw error;
    }
  }

  /**
   * Transform payload using rules
   */
  async transformPayload(
    payload: WebhookPayload,
    rules: TransformRule[]
  ): Promise<any> {
    const transformed: any = {};

    for (const rule of rules) {
      try {
        let value: any;

        switch (rule.type) {
          case 'jsonpath':
            value = this.applyJsonPath(payload.body, rule.source);
            break;
          case 'javascript':
            value = await this.applyJavaScript(payload.body, rule.source);
            break;
          case 'header':
            value = payload.headers[rule.source];
            break;
          default:
            throw new Error(`Unknown transform rule type: ${rule.type}`);
        }

        // Use default value if extraction failed
        if (value === undefined || value === null) {
          value = rule.defaultValue;
        }

        this.setNestedValue(transformed, rule.target, value);
      } catch (error) {
        logger.warn('Transform rule failed', {
          rule,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return transformed;
  }

  /**
   * Get webhook statistics
   */
  async getStats(routeId: string, days: number = 7): Promise<{
    totalWebhooks: number;
    successRate: number;
    avgProcessingTime: number;
    errorRate: number;
  }> {
    const query = `
      SELECT
        COUNT(*) AS total_webhooks,
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) AS success_rate,
        AVG(processing_time_ms) AS avg_processing_time,
        AVG(CASE WHEN NOT success THEN 1.0 ELSE 0.0 END) AS error_rate
      FROM webhook_logs
      WHERE route_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    const result = await this.db.query(query, [routeId]);
    const row = result.rows[0];

    return {
      totalWebhooks: parseInt(row.total_webhooks),
      successRate: parseFloat(row.success_rate) * 100,
      avgProcessingTime: parseFloat(row.avg_processing_time || 0),
      errorRate: parseFloat(row.error_rate) * 100,
    };
  }

  /**
   * Private helper methods
   */

  private async getRoute(routeId: string): Promise<WebhookRoute | null> {
    const query = `SELECT * FROM webhook_routes WHERE id = $1`;
    const result = await this.db.query(query, [routeId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToRoute(result.rows[0]);
  }

  private verifySignature(payload: WebhookPayload, secret: string): void {
    if (!payload.signature) {
      throw new Error('Webhook signature missing');
    }

    const bodyString = JSON.stringify(payload.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    if (payload.signature !== expectedSignature) {
      throw new Error('Webhook signature verification failed');
    }
  }

  private applyJsonPath(data: any, path: string): any {
    // Simple JSONPath implementation (supports dot notation)
    // For production, use library like 'jsonpath-plus'
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array indices: users[0]
      const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key]?.[parseInt(index)];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  private async applyJavaScript(data: any, code: string): Promise<any> {
    // Execute JavaScript transformation
    // IMPORTANT: In production, use VM2 or isolated-vm for sandboxing
    try {
      const func = new Function('data', `return ${code}`);
      return func(data);
    } catch (error) {
      logger.error('JavaScript transform failed', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return undefined;
    }
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    let current = obj;

    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[last] = value;
  }

  private async logWebhook(
    routeId: string,
    tenantId: string,
    success: boolean,
    error: string | null
  ): Promise<void> {
    const query = `
      INSERT INTO webhook_logs (
        route_id, tenant_id, success, error_message,
        processing_time_ms, created_at
      )
      VALUES ($1, $2, $3, $4, 0, NOW())
    `;
    await this.db.query(query, [routeId, tenantId, success, error]);
  }

  private async sendToDeadLetterQueue(
    routeId: string,
    payload: WebhookPayload,
    error: string
  ): Promise<void> {
    const query = `
      INSERT INTO webhook_dead_letter_queue (
        route_id, payload, error_message, created_at
      )
      VALUES ($1, $2, $3, NOW())
    `;
    await this.db.query(query, [routeId, JSON.stringify(payload), error]);

    logger.info('Webhook sent to dead letter queue', { routeId });
  }

  private mapRowToRoute(row: any): WebhookRoute {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      sourceUrl: row.source_url,
      targetUrl: row.target_url,
      transformRules: row.transform_rules,
      signatureSecret: row.signature_secret,
      active: row.active,
      createdAt: row.created_at,
    };
  }
}
