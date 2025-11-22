import { Router } from 'express';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * RevenueCat Webhook Handler
 * Handles subscription events and entitlement updates from RevenueCat
 *
 * Documentation: https://www.revenuecat.com/docs/webhooks
 */

// RevenueCat webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret || !signature) {
    // If no secret is configured, skip verification (development mode)
    logger.warn('RevenueCat webhook signature verification skipped - no secret configured');
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    return false;
  }
}

// Event types from RevenueCat
type RevenueCatEvent =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE';

interface RevenueCatWebhookPayload {
  api_version: string;
  event: {
    type: RevenueCatEvent;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    period_type: 'TRIAL' | 'INTRO' | 'NORMAL';
    purchased_at_ms: number;
    expiration_at_ms: number;
    environment: 'SANDBOX' | 'PRODUCTION';
    entitlement_id?: string;
    entitlement_ids?: string[];
    presented_offering_id?: string;
    transaction_id?: string;
    original_transaction_id?: string;
    is_trial_conversion?: boolean;
    store: 'APP_STORE' | 'MAC_APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
    price?: number;
    currency?: string;
  };
}

router.post('/', async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-revenuecat-signature'] as string | undefined;
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      logger.error('Invalid RevenueCat webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const payload: RevenueCatWebhookPayload = req.body;
    const event = payload.event;

    logger.info('RevenueCat webhook event received', {
      type: event.type,
      userId: event.app_user_id,
      productId: event.product_id,
      entitlementIds: event.entitlement_ids,
      environment: event.environment,
    });

    // Persist entitlement in database
    await persistEntitlement(event);

    // Send success response immediately (RevenueCat expects 200 within 5 seconds)
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (e: unknown) {
    logger.error('RevenueCat webhook processing error', {
      error: e?.message,
      stack: e?.stack
    });
    res.status(500).json({
      success: false,
      error: e?.message || 'Webhook processing error'
    });
  }
});

/**
 * Persist entitlement data to database
 * This enables feature gating based on subscription status
 */
async function persistEntitlement(event: RevenueCatWebhookPayload['event']): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { getDatabase } = await import('../../config/database');
    const db = getDatabase();

    const userId = event.app_user_id;
    const entitlementIds = event.entitlement_ids || [];
    const eventType = event.type;
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'].includes(eventType);

    // Update or create user subscription record
    await db.query(`
      INSERT INTO user_subscriptions (
        user_id,
        product_id,
        entitlement_ids,
        status,
        expires_at,
        transaction_id,
        original_transaction_id,
        store,
        environment,
        is_trial,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      )
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        entitlement_ids = EXCLUDED.entitlement_ids,
        status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        transaction_id = EXCLUDED.transaction_id,
        store = EXCLUDED.store,
        environment = EXCLUDED.environment,
        is_trial = EXCLUDED.is_trial,
        updated_at = NOW()
    `, [
      userId,
      event.product_id,
      JSON.stringify(entitlementIds),
      isActive ? 'active' : eventType.toLowerCase(),
      expiresAt,
      event.transaction_id || null,
      event.original_transaction_id || null,
      event.store,
      event.environment,
      event.period_type === 'TRIAL'
    ]);

    // Log entitlement event for audit trail
    await db.query(`
      INSERT INTO subscription_events (
        user_id,
        event_type,
        product_id,
        entitlement_ids,
        data,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
    `, [
      userId,
      eventType,
      event.product_id,
      JSON.stringify(entitlementIds),
      JSON.stringify(event)
    ]);

    logger.info('Entitlement persisted successfully', {
      userId,
      productId: event.product_id,
      entitlementIds,
      status: isActive ? 'active' : eventType.toLowerCase()
    });

  } catch (error: Record<string, unknown>) {
    logger.error('Failed to persist entitlement', {
      error: error?.message,
      userId: event.app_user_id,
      productId: event.product_id
    });
    // Don't throw - we've already logged the error
    // RevenueCat will retry if we return non-200
  }
}

export default router;


