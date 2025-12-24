import crypto from 'crypto';
import { Request } from 'express';

import { logger } from '../../utils/logger';
import { ERPConfiguration } from '../../models/erp/ERPConfiguration';
import {
  ERPAuditLog,
  AuditAction,
  AuditEntityType,
  AuditStatus,
} from '../../models/erp/ERPAuditLog';
import { ERPError, ERPErrorCode, WebhookEvent } from '../../types/flasherp';

/**
 * FlashERP Webhook Handler
 * Processes incoming webhooks from FlashERP
 */
export class FlashERPWebhookHandler {
  private static instance: FlashERPWebhookHandler;
  private processedEvents: Set<string> = new Set();
  private readonly EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Clean up processed events periodically
    setInterval(() => {
      this.cleanupProcessedEvents();
    }, 60 * 60 * 1000); // Every hour
  }

  public static getInstance(): FlashERPWebhookHandler {
    if (!FlashERPWebhookHandler.instance) {
      FlashERPWebhookHandler.instance = new FlashERPWebhookHandler();
    }
    return FlashERPWebhookHandler.instance;
  }

  /**
   * Process incoming webhook
   */
  public async handleWebhook(req: Request): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    logger.info('Received FlashERP webhook', {
      requestId,
      eventType: req.body?.type,
    });

    try {
      // 1. Validate webhook signature
      await this.validateSignature(req);

      // 2. Parse event
      const event = this.parseEvent(req.body);

      // 3. Check for duplicate
      if (this.isDuplicate(event.id)) {
        logger.warn('Duplicate webhook event ignored', {
          eventId: event.id,
          eventType: event.type,
        });
        return;
      }

      // 4. Mark as processed
      this.markAsProcessed(event.id);

      // 5. Create audit log
      const auditLog = await ERPAuditLog.create({
        action: AuditAction.WEBHOOK_RECEIVED,
        entityType: this.getEntityType(event.type),
        entityId: event.data.id,
        status: AuditStatus.INITIATED,
        requestPayload: event,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        performedBy: 'system',
        requestId,
      });

      // 6. Route to specific handler
      await this.routeEvent(event, auditLog.id);

      // 7. Update audit log
      const duration = Date.now() - startTime;
      auditLog.status = AuditStatus.SUCCESS;
      auditLog.duration = duration;
      await auditLog.save();

      logger.info('Webhook processed successfully', {
        requestId,
        eventType: event.type,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Webhook processing failed', {
        requestId,
        error: (error as Error).message,
        duration,
      });

      // Create failure audit log
      await ERPAuditLog.create({
        action: AuditAction.WEBHOOK_RECEIVED,
        entityType: AuditEntityType.CONFIGURATION,
        status: AuditStatus.FAILED,
        requestPayload: req.body,
        errorDetails: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
        duration,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        performedBy: 'system',
        requestId,
      });

      throw error;
    }
  }

  /**
   * Validate webhook signature using HMAC-SHA256
   */
  private async validateSignature(req: Request): Promise<void> {
    const signature = req.get('x-flasherp-signature');
    const timestamp = req.get('x-flasherp-timestamp');

    if (!signature || !timestamp) {
      throw new ERPError(
        ERPErrorCode.WEBHOOK_VALIDATION_FAILED,
        'Missing webhook signature or timestamp'
      );
    }

    // Check timestamp (5-minute window)
    const timestampNum = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestampNum);

    if (timeDiff > 300) {
      // 5 minutes
      throw new ERPError(
        ERPErrorCode.WEBHOOK_VALIDATION_FAILED,
        'Webhook timestamp too old or too far in future'
      );
    }

    // Get webhook secret from config
    const config = await ERPConfiguration.findOne({
      where: { isEnabled: true },
    });

    if (!config || !config.webhookSecret) {
      throw new ERPError(
        ERPErrorCode.CONFIGURATION_ERROR,
        'Webhook secret not configured'
      );
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const signedPayload = `${timestamp}.${payload}`;

    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Timing-safe comparison
    if (!this.timingSafeEqual(signature, expectedSignature)) {
      throw new ERPError(
        ERPErrorCode.WEBHOOK_VALIDATION_FAILED,
        'Invalid webhook signature'
      );
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Parse webhook event
   */
  private parseEvent(body: any): WebhookEvent {
    if (!body || !body.type || !body.id || !body.data) {
      throw new ERPError(
        ERPErrorCode.WEBHOOK_VALIDATION_FAILED,
        'Invalid webhook payload structure'
      );
    }

    return {
      id: body.id,
      type: body.type,
      data: body.data,
      timestamp: new Date(body.timestamp || Date.now()),
    };
  }

  /**
   * Check if event already processed (deduplication)
   */
  private isDuplicate(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark event as processed
   */
  private markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
  }

  /**
   * Clean up old processed events
   */
  private cleanupProcessedEvents(): void {
    // In-memory cleanup (for production, use Redis with TTL)
    // This is a simple implementation
    if (this.processedEvents.size > 10000) {
      logger.info('Cleaning up processed events cache');
      this.processedEvents.clear();
    }
  }

  /**
   * Route event to specific handler
   */
  private async routeEvent(event: WebhookEvent, auditLogId: string): Promise<void> {
    logger.info('Routing webhook event', {
      eventType: event.type,
      auditLogId,
    });

    switch (event.type) {
      case 'invoice.created':
        await this.handleInvoiceCreated(event);
        break;

      case 'invoice.updated':
        await this.handleInvoiceUpdated(event);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;

      case 'customer.updated':
        await this.handleCustomerUpdated(event);
        break;

      case 'sync.completed':
        await this.handleSyncCompleted(event);
        break;

      default:
        logger.warn('Unknown webhook event type', {
          eventType: event.type,
        });
    }
  }

  /**
   * Get entity type from event type
   */
  private getEntityType(eventType: string): AuditEntityType {
    if (eventType.startsWith('invoice.')) {
      return AuditEntityType.INVOICE;
    }
    if (eventType.startsWith('payment.')) {
      return AuditEntityType.TRANSACTION;
    }
    if (eventType.startsWith('customer.')) {
      return AuditEntityType.CUSTOMER;
    }
    if (eventType.startsWith('subscription.')) {
      return AuditEntityType.SUBSCRIPTION;
    }
    return AuditEntityType.CONFIGURATION;
  }

  /**
   * Handle invoice.created event
   */
  private async handleInvoiceCreated(event: WebhookEvent): Promise<void> {
    logger.info('Processing invoice.created event', {
      invoiceId: event.data.id,
    });

    // TODO: Implement invoice created logic
    // - Store invoice reference in local database
    // - Send notification to admin
    // - Update financial reports
  }

  /**
   * Handle invoice.updated event
   */
  private async handleInvoiceUpdated(event: WebhookEvent): Promise<void> {
    logger.info('Processing invoice.updated event', {
      invoiceId: event.data.id,
    });

    // TODO: Implement invoice updated logic
    // - Update local invoice status
    // - Send notification if status changed
  }

  /**
   * Handle invoice.paid event
   */
  private async handleInvoicePaid(event: WebhookEvent): Promise<void> {
    logger.info('Processing invoice.paid event', {
      invoiceId: event.data.id,
      amount: event.data.amount,
    });

    // TODO: Implement invoice paid logic
    // - Update transaction status
    // - Send payment confirmation
    // - Update revenue metrics
  }

  /**
   * Handle payment.failed event
   */
  private async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    logger.info('Processing payment.failed event', {
      paymentId: event.data.id,
      reason: event.data.failureReason,
    });

    // TODO: Implement payment failed logic
    // - Mark transaction as failed
    // - Send notification to customer
    // - Trigger retry if appropriate
  }

  /**
   * Handle customer.updated event
   */
  private async handleCustomerUpdated(event: WebhookEvent): Promise<void> {
    logger.info('Processing customer.updated event', {
      customerId: event.data.id,
    });

    // TODO: Implement customer updated logic
    // - Sync customer data back to UpCoach
    // - Update user profile if needed
  }

  /**
   * Handle sync.completed event
   */
  private async handleSyncCompleted(event: WebhookEvent): Promise<void> {
    logger.info('Processing sync.completed event', {
      syncJobId: event.data.id,
      status: event.data.status,
    });

    // TODO: Implement sync completed logic
    // - Update sync records
    // - Send notification to admin
    // - Trigger reconciliation if needed
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const flashERPWebhookHandler = FlashERPWebhookHandler.getInstance();
