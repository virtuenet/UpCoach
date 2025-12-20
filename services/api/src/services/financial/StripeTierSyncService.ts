import Stripe from 'stripe';

import {
  SubscriptionTier,
  TierPricing,
  TierBillingInterval,
  TierAuditLog,
  AuditEntityType,
  AuditAction,
} from '../../models';
import { logger } from '../../utils/logger';
import { AuditContext } from './TierService';

/**
 * Map internal billing intervals to Stripe intervals
 */
const INTERVAL_MAP: Record<TierBillingInterval, Stripe.Price.Recurring.Interval> = {
  [TierBillingInterval.MONTHLY]: 'month',
  [TierBillingInterval.QUARTERLY]: 'month', // Stripe uses interval_count for quarterly
  [TierBillingInterval.YEARLY]: 'year',
};

const INTERVAL_COUNT_MAP: Record<TierBillingInterval, number> = {
  [TierBillingInterval.MONTHLY]: 1,
  [TierBillingInterval.QUARTERLY]: 3, // 3 months
  [TierBillingInterval.YEARLY]: 1,
};

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  tier?: SubscriptionTier;
  stripeProduct?: Stripe.Product;
  stripePrices?: Stripe.Price[];
  errors: string[];
  warnings: string[];
}

/**
 * Stripe product listing result
 */
export interface StripeProductInfo {
  id: string;
  name: string;
  active: boolean;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    active: boolean;
  }>;
}

/**
 * StripeTierSyncService
 *
 * Handles synchronization between UpCoach subscription tiers
 * and Stripe products/prices.
 */
export class StripeTierSyncService {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      logger.warn('STRIPE_SECRET_KEY not set - Stripe sync will be disabled');
    }
    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  /**
   * Sync a tier to Stripe (create or update product and prices)
   */
  async syncTierToStripe(
    tierId: string,
    auditContext?: AuditContext
  ): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        errors: ['Stripe is not configured'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get tier with pricing
      const tier = await SubscriptionTier.findByPk(tierId, {
        include: [{ model: TierPricing, as: 'pricing' }],
      });

      if (!tier) {
        return { success: false, errors: ['Tier not found'], warnings: [] };
      }

      // Create or update product
      let stripeProduct: Stripe.Product;

      if (tier.stripeProductId) {
        // Update existing product
        try {
          stripeProduct = await this.stripe.products.update(tier.stripeProductId, {
            name: tier.displayName,
            description: tier.description || undefined,
            active: tier.isActive,
            metadata: {
              upcoach_tier_id: tier.id,
              upcoach_tier_name: tier.name,
              max_coaches: String(tier.maxCoaches),
              max_goals: String(tier.maxGoals),
              max_chats_per_day: String(tier.maxChatsPerDay),
            },
          });
        } catch (error) {
          // Product might have been deleted in Stripe
          logger.warn(`Failed to update Stripe product ${tier.stripeProductId}, creating new`);
          stripeProduct = await this.createStripeProduct(tier);
          await tier.update({ stripeProductId: stripeProduct.id });
        }
      } else {
        // Create new product
        stripeProduct = await this.createStripeProduct(tier);
        await tier.update({ stripeProductId: stripeProduct.id });
      }

      // Sync prices
      const stripePrices: Stripe.Price[] = [];
      const pricing = tier.pricing || [];

      for (const price of pricing) {
        try {
          const stripePrice = await this.syncPriceToStripe(price, stripeProduct.id);
          stripePrices.push(stripePrice);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to sync price ${price.billingInterval}: ${errorMessage}`
          );
        }
      }

      // Audit log
      await TierAuditLog.logChange({
        entityType: AuditEntityType.STRIPE_SYNC,
        entityId: tier.id,
        action: AuditAction.STRIPE_SYNC,
        newValue: {
          stripeProductId: stripeProduct.id,
          stripePriceIds: stripePrices.map((p) => p.id),
        },
        ...auditContext,
      });

      logger.info(`Synced tier ${tier.name} to Stripe`);

      return {
        success: errors.length === 0,
        tier,
        stripeProduct,
        stripePrices,
        errors,
        warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to sync tier ${tierId} to Stripe: ${errorMessage}`);
      return { success: false, errors: [errorMessage], warnings };
    }
  }

  /**
   * Create a Stripe product for a tier
   */
  private async createStripeProduct(tier: SubscriptionTier): Promise<Stripe.Product> {
    return this.stripe.products.create({
      name: tier.displayName,
      description: tier.description || undefined,
      active: tier.isActive,
      metadata: {
        upcoach_tier_id: tier.id,
        upcoach_tier_name: tier.name,
        max_coaches: String(tier.maxCoaches),
        max_goals: String(tier.maxGoals),
        max_chats_per_day: String(tier.maxChatsPerDay),
      },
    });
  }

  /**
   * Sync a price to Stripe
   */
  private async syncPriceToStripe(
    pricing: TierPricing,
    stripeProductId: string
  ): Promise<Stripe.Price> {
    const interval = INTERVAL_MAP[pricing.billingInterval];
    const intervalCount = INTERVAL_COUNT_MAP[pricing.billingInterval];

    if (pricing.stripePriceId) {
      // Stripe prices are immutable - check if it matches
      try {
        const existingPrice = await this.stripe.prices.retrieve(pricing.stripePriceId);

        // Check if price matches
        if (
          existingPrice.unit_amount === pricing.amount &&
          existingPrice.currency === pricing.currency.toLowerCase() &&
          existingPrice.recurring?.interval === interval &&
          existingPrice.recurring?.interval_count === intervalCount
        ) {
          // Price matches, just update active status if needed
          if (existingPrice.active !== pricing.isActive) {
            return this.stripe.prices.update(pricing.stripePriceId, {
              active: pricing.isActive,
            });
          }
          return existingPrice;
        }

        // Price doesn't match - archive old and create new
        await this.stripe.prices.update(pricing.stripePriceId, { active: false });
      } catch {
        // Price doesn't exist in Stripe
        logger.warn(`Stripe price ${pricing.stripePriceId} not found, creating new`);
      }
    }

    // Create new price
    const stripePrice = await this.stripe.prices.create({
      product: stripeProductId,
      unit_amount: pricing.amount,
      currency: pricing.currency.toLowerCase(),
      recurring: {
        interval,
        interval_count: intervalCount,
        trial_period_days: pricing.trialDays || undefined,
      },
      active: pricing.isActive,
      metadata: {
        upcoach_pricing_id: pricing.id,
        billing_interval: pricing.billingInterval,
      },
    });

    // Update pricing with new Stripe price ID
    await pricing.update({ stripePriceId: stripePrice.id });

    return stripePrice;
  }

  /**
   * Sync all tiers to Stripe
   */
  async syncAllTiersToStripe(auditContext?: AuditContext): Promise<{
    results: SyncResult[];
    successful: number;
    failed: number;
  }> {
    const tiers = await SubscriptionTier.findAll({
      where: { isActive: true },
      include: [{ model: TierPricing, as: 'pricing' }],
    });

    const results: SyncResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const tier of tiers) {
      const result = await this.syncTierToStripe(tier.id, auditContext);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    logger.info(`Synced ${successful} tiers to Stripe, ${failed} failed`);

    return { results, successful, failed };
  }

  /**
   * Link an existing Stripe product to a tier
   */
  async linkStripeProduct(
    tierId: string,
    stripeProductId: string,
    auditContext?: AuditContext
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    // Verify product exists in Stripe
    const product = await this.stripe.products.retrieve(stripeProductId);

    const tier = await SubscriptionTier.findByPk(tierId);
    if (!tier) {
      throw new Error(`Tier not found: ${tierId}`);
    }

    const previousValue = { stripeProductId: tier.stripeProductId };

    await tier.update({ stripeProductId: product.id });

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tierId,
      action: AuditAction.STRIPE_LINK,
      previousValue,
      newValue: { stripeProductId: product.id },
      ...auditContext,
    });

    logger.info(`Linked tier ${tier.name} to Stripe product ${product.id}`);
  }

  /**
   * Unlink a tier from Stripe
   */
  async unlinkStripeProduct(
    tierId: string,
    auditContext?: AuditContext
  ): Promise<void> {
    const tier = await SubscriptionTier.findByPk(tierId);
    if (!tier) {
      throw new Error(`Tier not found: ${tierId}`);
    }

    const previousValue = { stripeProductId: tier.stripeProductId };

    await tier.update({ stripeProductId: null });

    // Also clear price links
    const pricing = await TierPricing.findAll({ where: { tierId } });
    for (const price of pricing) {
      await price.update({ stripePriceId: null });
    }

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tierId,
      action: AuditAction.STRIPE_UNLINK,
      previousValue,
      newValue: { stripeProductId: null },
      ...auditContext,
    });

    logger.info(`Unlinked tier ${tier.name} from Stripe`);
  }

  /**
   * List Stripe products (for linking UI)
   */
  async listStripeProducts(options?: {
    active?: boolean;
    limit?: number;
  }): Promise<StripeProductInfo[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const products = await this.stripe.products.list({
      active: options?.active,
      limit: options?.limit || 100,
    });

    const result: StripeProductInfo[] = [];

    for (const product of products.data) {
      const prices = await this.stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      result.push({
        id: product.id,
        name: product.name,
        active: product.active,
        prices: prices.data.map((p) => ({
          id: p.id,
          amount: p.unit_amount || 0,
          currency: p.currency,
          interval: p.recurring?.interval || 'one_time',
          intervalCount: p.recurring?.interval_count || 1,
          active: p.active,
        })),
      });
    }

    return result;
  }

  /**
   * Import a Stripe product as a new tier
   */
  async importFromStripe(
    stripeProductId: string,
    tierName: string,
    auditContext?: AuditContext
  ): Promise<SubscriptionTier> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    // Get product and prices from Stripe
    const product = await this.stripe.products.retrieve(stripeProductId);
    const prices = await this.stripe.prices.list({
      product: stripeProductId,
      active: true,
    });

    // Create tier
    const tier = await SubscriptionTier.create({
      name: tierName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      displayName: product.name,
      description: product.description || undefined,
      stripeProductId: product.id,
      isActive: product.active,
      isPublic: true,
      // Default feature limits - admin should adjust
      maxCoaches: 1,
      maxGoals: 3,
      maxChatsPerDay: 5,
    });

    // Create pricing entries
    for (const stripePrice of prices.data) {
      if (!stripePrice.recurring) continue;

      let billingInterval: TierBillingInterval;
      if (stripePrice.recurring.interval === 'year') {
        billingInterval = TierBillingInterval.YEARLY;
      } else if (
        stripePrice.recurring.interval === 'month' &&
        stripePrice.recurring.interval_count === 3
      ) {
        billingInterval = TierBillingInterval.QUARTERLY;
      } else {
        billingInterval = TierBillingInterval.MONTHLY;
      }

      await TierPricing.create({
        tierId: tier.id,
        billingInterval,
        amount: stripePrice.unit_amount || 0,
        currency: stripePrice.currency.toUpperCase(),
        stripePriceId: stripePrice.id,
        isActive: stripePrice.active,
        trialDays: stripePrice.recurring.trial_period_days || 0,
      });
    }

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tier.id,
      action: AuditAction.CREATE,
      newValue: {
        ...tier.toJSON(),
        importedFrom: 'stripe',
        stripeProductId,
      } as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Imported tier ${tierName} from Stripe product ${stripeProductId}`);

    return SubscriptionTier.findByPk(tier.id, {
      include: [{ model: TierPricing, as: 'pricing' }],
    }) as Promise<SubscriptionTier>;
  }

  /**
   * Get sync status for all tiers
   */
  async getSyncStatus(): Promise<
    Array<{
      tier: SubscriptionTier;
      hasStripeProduct: boolean;
      pricesLinked: number;
      pricesTotal: number;
      lastSyncedAt?: Date;
    }>
  > {
    const tiers = await SubscriptionTier.findAll({
      include: [{ model: TierPricing, as: 'pricing' }],
      order: [['sortOrder', 'ASC']],
    });

    return tiers.map((tier) => {
      const pricing = tier.pricing || [];
      const linkedPrices = pricing.filter((p) => p.stripePriceId).length;

      return {
        tier,
        hasStripeProduct: !!tier.stripeProductId,
        pricesLinked: linkedPrices,
        pricesTotal: pricing.length,
      };
    });
  }
}

export const stripeTierSyncService = new StripeTierSyncService();
