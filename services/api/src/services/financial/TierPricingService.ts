import {
  TierPricing,
  TierBillingInterval,
  TierAuditLog,
  AuditEntityType,
  AuditAction,
  SubscriptionTier,
} from '../../models';
import { logger } from '../../utils/logger';
import { AuditContext } from './TierService';

/**
 * Input type for creating pricing
 */
export interface CreatePricingInput {
  tierId: string;
  billingInterval: TierBillingInterval;
  amount: number; // In cents
  currency?: string;
  isActive?: boolean;
  trialDays?: number;
  discountPercentage?: number;
  discountValidUntil?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Input type for updating pricing
 */
export interface UpdatePricingInput {
  amount?: number;
  currency?: string;
  isActive?: boolean;
  trialDays?: number;
  discountPercentage?: number | null;
  discountValidUntil?: Date | null;
  stripePriceId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * TierPricingService
 *
 * Handles CRUD operations for tier pricing configurations.
 * Supports multiple billing intervals per tier with promotional pricing.
 */
export class TierPricingService {
  /**
   * Get all pricing for a tier
   */
  async findByTierId(
    tierId: string,
    options?: { includeInactive?: boolean }
  ): Promise<TierPricing[]> {
    const where: Record<string, unknown> = { tierId };

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    return TierPricing.findAll({
      where,
      order: [
        ['billingInterval', 'ASC'], // monthly, quarterly, yearly
      ],
    });
  }

  /**
   * Find pricing by ID
   */
  async findById(id: string): Promise<TierPricing | null> {
    return TierPricing.findByPk(id, {
      include: [
        {
          model: SubscriptionTier,
          as: 'tier',
        },
      ],
    });
  }

  /**
   * Find specific pricing by tier and billing interval
   */
  async findByTierAndInterval(
    tierId: string,
    billingInterval: TierBillingInterval,
    currency: string = 'USD'
  ): Promise<TierPricing | null> {
    return TierPricing.findOne({
      where: {
        tierId,
        billingInterval,
        currency: currency.toUpperCase(),
        isActive: true,
      },
    });
  }

  /**
   * Create new pricing for a tier
   */
  async create(
    input: CreatePricingInput,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    // Validate tier exists
    const tier = await SubscriptionTier.findByPk(input.tierId);
    if (!tier) {
      throw new Error(`Tier not found: ${input.tierId}`);
    }

    // Check for duplicate (same tier + interval + currency)
    const currency = (input.currency || 'USD').toUpperCase();
    const existing = await this.findByTierAndInterval(
      input.tierId,
      input.billingInterval,
      currency
    );
    if (existing) {
      throw new Error(
        `Pricing for ${tier.name} with ${input.billingInterval} billing in ${currency} already exists`
      );
    }

    // Validate amount
    if (input.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    const pricing = await TierPricing.create({
      ...input,
      currency,
    });

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.PRICING,
      entityId: pricing.id,
      action: AuditAction.CREATE,
      newValue: pricing.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(
      `Created pricing for tier ${tier.name}: ${input.billingInterval} at ${input.amount / 100} ${currency}`
    );

    return pricing;
  }

  /**
   * Update existing pricing
   */
  async update(
    id: string,
    input: UpdatePricingInput,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    const pricing = await this.findById(id);
    if (!pricing) {
      throw new Error(`Pricing not found: ${id}`);
    }

    // Validate amount if provided
    if (input.amount !== undefined && input.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    const previousValue = pricing.toJSON() as Record<string, unknown>;

    // Normalize currency if provided
    if (input.currency) {
      input.currency = input.currency.toUpperCase();
    }

    await pricing.update(input);

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.PRICING,
      entityId: pricing.id,
      action: AuditAction.UPDATE,
      previousValue,
      newValue: pricing.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Updated pricing ${id}`);

    return pricing;
  }

  /**
   * Delete pricing
   */
  async delete(
    id: string,
    auditContext?: AuditContext,
    options?: { hardDelete?: boolean }
  ): Promise<void> {
    const pricing = await this.findById(id);
    if (!pricing) {
      throw new Error(`Pricing not found: ${id}`);
    }

    const previousValue = pricing.toJSON() as Record<string, unknown>;

    if (options?.hardDelete) {
      await pricing.destroy();
      await TierAuditLog.logChange({
        entityType: AuditEntityType.PRICING,
        entityId: id,
        action: AuditAction.DELETE,
        previousValue,
        ...auditContext,
      });
      logger.info(`Hard deleted pricing ${id}`);
    } else {
      await pricing.update({ isActive: false });
      await TierAuditLog.logChange({
        entityType: AuditEntityType.PRICING,
        entityId: pricing.id,
        action: AuditAction.DEACTIVATE,
        previousValue,
        newValue: pricing.toJSON() as Record<string, unknown>,
        ...auditContext,
      });
      logger.info(`Deactivated pricing ${id}`);
    }
  }

  /**
   * Set promotional discount
   */
  async setDiscount(
    id: string,
    discountPercentage: number,
    validUntil: Date | null,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    return this.update(
      id,
      {
        discountPercentage,
        discountValidUntil: validUntil,
      },
      auditContext
    );
  }

  /**
   * Remove promotional discount
   */
  async removeDiscount(
    id: string,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    return this.update(
      id,
      {
        discountPercentage: null,
        discountValidUntil: null,
      },
      auditContext
    );
  }

  /**
   * Update trial days
   */
  async setTrialDays(
    id: string,
    trialDays: number,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    if (trialDays < 0 || trialDays > 365) {
      throw new Error('Trial days must be between 0 and 365');
    }

    return this.update(id, { trialDays }, auditContext);
  }

  /**
   * Link to Stripe Price
   */
  async linkStripePrice(
    id: string,
    stripePriceId: string,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    const pricing = await this.findById(id);
    if (!pricing) {
      throw new Error(`Pricing not found: ${id}`);
    }

    const previousValue = pricing.toJSON() as Record<string, unknown>;

    await pricing.update({ stripePriceId });

    await TierAuditLog.logChange({
      entityType: AuditEntityType.PRICING,
      entityId: pricing.id,
      action: AuditAction.STRIPE_LINK,
      previousValue,
      newValue: { stripePriceId },
      ...auditContext,
    });

    logger.info(`Linked pricing ${id} to Stripe price ${stripePriceId}`);

    return pricing;
  }

  /**
   * Unlink from Stripe Price
   */
  async unlinkStripePrice(
    id: string,
    auditContext?: AuditContext
  ): Promise<TierPricing> {
    const pricing = await this.findById(id);
    if (!pricing) {
      throw new Error(`Pricing not found: ${id}`);
    }

    const previousValue = pricing.toJSON() as Record<string, unknown>;

    await pricing.update({ stripePriceId: null });

    await TierAuditLog.logChange({
      entityType: AuditEntityType.PRICING,
      entityId: pricing.id,
      action: AuditAction.STRIPE_UNLINK,
      previousValue,
      newValue: { stripePriceId: null },
      ...auditContext,
    });

    logger.info(`Unlinked pricing ${id} from Stripe`);

    return pricing;
  }

  /**
   * Bulk update pricing for a tier (e.g., price increase)
   */
  async bulkUpdateTierPricing(
    tierId: string,
    multiplier: number,
    auditContext?: AuditContext
  ): Promise<TierPricing[]> {
    if (multiplier <= 0) {
      throw new Error('Multiplier must be positive');
    }

    const pricing = await this.findByTierId(tierId, { includeInactive: false });
    const updated: TierPricing[] = [];

    for (const price of pricing) {
      const newAmount = Math.round(price.amount * multiplier);
      const updatedPrice = await this.update(
        price.id,
        { amount: newAmount },
        {
          ...auditContext,
          reason: `Bulk price adjustment with multiplier ${multiplier}`,
        }
      );
      updated.push(updatedPrice);
    }

    return updated;
  }

  /**
   * Get pricing comparison across all tiers for a billing interval
   */
  async getPricingComparison(
    billingInterval: TierBillingInterval,
    currency: string = 'USD'
  ): Promise<
    Array<{
      tier: SubscriptionTier;
      pricing: TierPricing | null;
      monthlyEquivalent: number;
    }>
  > {
    const tiers = await SubscriptionTier.findAll({
      where: { isActive: true, isPublic: true },
      order: [['sortOrder', 'ASC']],
    });

    const comparison = await Promise.all(
      tiers.map(async (tier) => {
        const pricing = await this.findByTierAndInterval(
          tier.id,
          billingInterval,
          currency
        );
        return {
          tier,
          pricing,
          monthlyEquivalent: pricing?.monthlyEquivalent || 0,
        };
      })
    );

    return comparison;
  }

  /**
   * Get audit logs for pricing
   */
  async getAuditLogs(
    pricingId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ logs: TierAuditLog[]; total: number }> {
    const { count, rows } = await TierAuditLog.findAndCountAll({
      where: {
        entityType: AuditEntityType.PRICING,
        entityId: pricingId,
      },
      order: [['createdAt', 'DESC']],
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    });

    return { logs: rows, total: count };
  }

  /**
   * Calculate savings for a billing interval compared to monthly
   */
  async calculateSavings(
    tierId: string,
    billingInterval: TierBillingInterval,
    currency: string = 'USD'
  ): Promise<{
    monthlyPrice: number;
    intervalPrice: number;
    totalMonths: number;
    totalSavings: number;
    savingsPercentage: number;
  } | null> {
    const monthly = await this.findByTierAndInterval(
      tierId,
      TierBillingInterval.MONTHLY,
      currency
    );
    const interval = await this.findByTierAndInterval(
      tierId,
      billingInterval,
      currency
    );

    if (!monthly || !interval || billingInterval === TierBillingInterval.MONTHLY) {
      return null;
    }

    const totalMonths =
      billingInterval === TierBillingInterval.QUARTERLY
        ? 3
        : billingInterval === TierBillingInterval.YEARLY
          ? 12
          : 1;

    const monthlyTotal = monthly.amount * totalMonths;
    const intervalTotal = interval.amount;
    const savings = monthlyTotal - intervalTotal;
    const savingsPercentage = monthlyTotal > 0 ? (savings / monthlyTotal) * 100 : 0;

    return {
      monthlyPrice: monthly.amount,
      intervalPrice: interval.amount,
      totalMonths,
      totalSavings: savings,
      savingsPercentage,
    };
  }
}

export const tierPricingService = new TierPricingService();
