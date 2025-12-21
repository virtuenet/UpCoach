/**
 * RevenueCat Service
 * Server-side integration with RevenueCat for subscription management
 */

import axios, { AxiosInstance } from 'axios';

import { config } from '../../config/environment';
import { logger } from '../../utils/logger';

interface RevenueCatSubscriber {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    original_app_user_id: string;
    original_application_version: string | null;
    first_seen: string;
    last_seen: string;
    management_url: string | null;
    non_subscriptions: Record<string, unknown[]>;
    original_purchase_date: string | null;
    other_purchases: Record<string, unknown>;
    subscriptions: Record<string, RevenueCatSubscription>;
    entitlements: Record<string, RevenueCatEntitlement>;
  };
}

interface RevenueCatSubscription {
  auto_resume_date: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: string;
  period_type: string;
  purchase_date: string;
  refunded_at: string | null;
  store: string;
  unsubscribe_detected_at: string | null;
}

interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
}

interface WebhookEvent {
  api_version: string;
  event: {
    aliases: string[];
    app_id: string;
    app_user_id: string;
    country_code: string;
    currency: string;
    entitlement_id: string | null;
    entitlement_ids: string[];
    environment: 'SANDBOX' | 'PRODUCTION';
    event_timestamp_ms: number;
    expiration_at_ms: number;
    id: string;
    is_family_share: boolean;
    offer_code: string | null;
    original_app_user_id: string;
    original_transaction_id: string;
    period_type: string;
    presented_offering_id: string | null;
    price: number;
    price_in_purchased_currency: number;
    product_id: string;
    purchased_at_ms: number;
    store: string;
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
    takehome_percentage: number;
    tax_percentage: number;
    transaction_id: string;
    type: WebhookEventType;
  };
}

type WebhookEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'
  | 'SUBSCRIBER_ALIAS';

interface SubscriptionValidationResult {
  valid: boolean;
  tier: string | null;
  activeEntitlements: string[];
  expiresAt: Date | null;
  isInGracePeriod: boolean;
  isSandbox: boolean;
  managementUrl: string | null;
}

interface SyncResult {
  success: boolean;
  tier: string | null;
  activeEntitlements: string[];
  expiresAt: Date | null;
}

export class RevenueCatService {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://api.revenuecat.com/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.revenueCat.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get subscriber info from RevenueCat
   */
  async getSubscriber(appUserId: string): Promise<RevenueCatSubscriber | null> {
    if (!config.features.enableRevenueCat) {
      logger.warn('RevenueCat is not enabled');
      return null;
    }

    try {
      const response = await this.client.get<RevenueCatSubscriber>(
        `/subscribers/${encodeURIComponent(appUserId)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.info(`RevenueCat subscriber not found: ${appUserId}`);
        return null;
      }
      logger.error('Failed to get RevenueCat subscriber:', error);
      throw error;
    }
  }

  /**
   * Validate a subscription receipt
   */
  async validateSubscription(appUserId: string): Promise<SubscriptionValidationResult> {
    const result: SubscriptionValidationResult = {
      valid: false,
      tier: null,
      activeEntitlements: [],
      expiresAt: null,
      isInGracePeriod: false,
      isSandbox: false,
      managementUrl: null,
    };

    try {
      const subscriber = await this.getSubscriber(appUserId);

      if (!subscriber) {
        return result;
      }

      const { entitlements, subscriptions } = subscriber.subscriber;

      // Get active entitlements
      const now = new Date();
      for (const [entitlementId, entitlement] of Object.entries(entitlements)) {
        const expiresDate = entitlement.expires_date
          ? new Date(entitlement.expires_date)
          : null;

        // Check if entitlement is active
        if (!expiresDate || expiresDate > now) {
          result.activeEntitlements.push(entitlementId);

          // Update expiration if this is the latest
          if (expiresDate && (!result.expiresAt || expiresDate > result.expiresAt)) {
            result.expiresAt = expiresDate;
          }
        }

        // Check grace period
        if (entitlement.grace_period_expires_date) {
          const gracePeriodExpires = new Date(entitlement.grace_period_expires_date);
          if (gracePeriodExpires > now) {
            result.isInGracePeriod = true;
          }
        }
      }

      // Determine tier from entitlements
      result.tier = this.determineTier(result.activeEntitlements);
      result.valid = result.activeEntitlements.length > 0;
      result.managementUrl = subscriber.subscriber.management_url;

      // Check if any subscription is sandbox
      for (const subscription of Object.values(subscriptions)) {
        if (subscription.is_sandbox) {
          result.isSandbox = true;
          break;
        }
      }

      logger.info(`Validated subscription for ${appUserId}:`, {
        valid: result.valid,
        tier: result.tier,
        entitlements: result.activeEntitlements,
      });

      return result;
    } catch (error) {
      logger.error('Failed to validate subscription:', error);
      return result;
    }
  }

  /**
   * Sync subscription data from mobile app
   */
  async syncSubscription(
    userId: number,
    revenueCatUserId: string,
    activeEntitlements: string[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      tier: null,
      activeEntitlements: [],
      expiresAt: null,
    };

    try {
      // Validate with RevenueCat to ensure data is accurate
      const validation = await this.validateSubscription(revenueCatUserId);

      if (!validation.valid) {
        // Client-reported entitlements don't match server
        if (activeEntitlements.length > 0) {
          logger.warn(`Entitlement mismatch for user ${userId}:`, {
            reported: activeEntitlements,
            validated: validation.activeEntitlements,
          });
        }
      }

      // Use server-validated data
      result.tier = validation.tier;
      result.activeEntitlements = validation.activeEntitlements;
      result.expiresAt = validation.expiresAt;
      result.success = true;

      // TODO: Update user subscription in database
      // await this.updateUserSubscription(userId, result);

      logger.info(`Synced subscription for user ${userId}:`, result);
      return result;
    } catch (error) {
      logger.error('Failed to sync subscription:', error);
      return result;
    }
  }

  /**
   * Handle RevenueCat webhook events
   */
  async handleWebhook(event: WebhookEvent, authHeader: string | undefined): Promise<boolean> {
    // Validate webhook authentication
    if (!this.validateWebhookAuth(authHeader)) {
      logger.warn('Invalid RevenueCat webhook authentication');
      return false;
    }

    const { type, app_user_id, entitlement_ids, product_id, environment } = event.event;

    logger.info(`Processing RevenueCat webhook: ${type}`, {
      appUserId: app_user_id,
      productId: product_id,
      entitlements: entitlement_ids,
      environment,
    });

    try {
      switch (type) {
        case 'INITIAL_PURCHASE':
          await this.handleInitialPurchase(event);
          break;

        case 'RENEWAL':
          await this.handleRenewal(event);
          break;

        case 'CANCELLATION':
          await this.handleCancellation(event);
          break;

        case 'EXPIRATION':
          await this.handleExpiration(event);
          break;

        case 'BILLING_ISSUE':
          await this.handleBillingIssue(event);
          break;

        case 'PRODUCT_CHANGE':
          await this.handleProductChange(event);
          break;

        case 'UNCANCELLATION':
          await this.handleUncancellation(event);
          break;

        default:
          logger.info(`Unhandled RevenueCat event type: ${type}`);
      }

      return true;
    } catch (error) {
      logger.error('Failed to handle RevenueCat webhook:', error);
      return false;
    }
  }

  /**
   * Validate webhook authentication
   */
  private validateWebhookAuth(authHeader: string | undefined): boolean {
    if (!config.revenueCat.webhookAuthKey) {
      // If no auth key configured, accept all (development mode)
      logger.warn('RevenueCat webhook auth key not configured');
      return true;
    }

    if (!authHeader) {
      return false;
    }

    // RevenueCat sends auth as Bearer token
    const token = authHeader.replace('Bearer ', '');
    return token === config.revenueCat.webhookAuthKey;
  }

  /**
   * Handle initial purchase event
   */
  private async handleInitialPurchase(event: WebhookEvent): Promise<void> {
    const { app_user_id, entitlement_ids, product_id, price, currency } = event.event;

    logger.info(`New subscription for ${app_user_id}:`, {
      product: product_id,
      entitlements: entitlement_ids,
      price,
      currency,
    });

    // TODO: Update user subscription in database
    // TODO: Send welcome email
    // TODO: Track analytics event
  }

  /**
   * Handle renewal event
   */
  private async handleRenewal(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id } = event.event;

    logger.info(`Subscription renewed for ${app_user_id}:`, {
      product: product_id,
    });

    // TODO: Update expiration date in database
    // TODO: Track analytics event
  }

  /**
   * Handle cancellation event
   */
  private async handleCancellation(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id, expiration_at_ms } = event.event;

    logger.info(`Subscription cancelled for ${app_user_id}:`, {
      product: product_id,
      expiresAt: new Date(expiration_at_ms),
    });

    // TODO: Mark subscription as cancelled (will expire at expiration_at_ms)
    // TODO: Send cancellation email
    // TODO: Track analytics event
  }

  /**
   * Handle expiration event
   */
  private async handleExpiration(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id } = event.event;

    logger.info(`Subscription expired for ${app_user_id}:`, {
      product: product_id,
    });

    // TODO: Downgrade user to free tier
    // TODO: Send winback email
    // TODO: Track analytics event
  }

  /**
   * Handle billing issue event
   */
  private async handleBillingIssue(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id } = event.event;

    logger.warn(`Billing issue for ${app_user_id}:`, {
      product: product_id,
    });

    // TODO: Send billing issue notification
    // TODO: Track analytics event
  }

  /**
   * Handle product change event
   */
  private async handleProductChange(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id, entitlement_ids } = event.event;

    logger.info(`Product changed for ${app_user_id}:`, {
      newProduct: product_id,
      entitlements: entitlement_ids,
    });

    // TODO: Update user tier in database
    // TODO: Track analytics event
  }

  /**
   * Handle uncancellation event
   */
  private async handleUncancellation(event: WebhookEvent): Promise<void> {
    const { app_user_id, product_id } = event.event;

    logger.info(`Subscription uncancelled for ${app_user_id}:`, {
      product: product_id,
    });

    // TODO: Update subscription status
    // TODO: Track analytics event
  }

  /**
   * Determine tier from entitlements
   */
  private determineTier(entitlements: string[]): string | null {
    // Check in order of priority (highest first)
    if (entitlements.includes('enterprise')) {
      return 'enterprise';
    }
    if (entitlements.includes('premium')) {
      return 'premium';
    }
    if (entitlements.includes('pro')) {
      return 'pro';
    }
    return null;
  }

  /**
   * Create or update subscriber attributes
   */
  async updateSubscriberAttributes(
    appUserId: string,
    attributes: Record<string, string>
  ): Promise<boolean> {
    if (!config.features.enableRevenueCat) {
      return false;
    }

    try {
      await this.client.post(
        `/subscribers/${encodeURIComponent(appUserId)}/attributes`,
        {
          attributes: Object.fromEntries(
            Object.entries(attributes).map(([key, value]) => [
              key,
              { value },
            ])
          ),
        }
      );
      return true;
    } catch (error) {
      logger.error('Failed to update subscriber attributes:', error);
      return false;
    }
  }

  /**
   * Delete a subscriber
   */
  async deleteSubscriber(appUserId: string): Promise<boolean> {
    if (!config.features.enableRevenueCat) {
      return false;
    }

    try {
      await this.client.delete(`/subscribers/${encodeURIComponent(appUserId)}`);
      logger.info(`Deleted RevenueCat subscriber: ${appUserId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete subscriber:', error);
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
