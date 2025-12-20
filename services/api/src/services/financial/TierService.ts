import { Op } from 'sequelize';

import {
  SubscriptionTier,
  TierPricing,
  TierAuditLog,
  AuditEntityType,
  AuditAction,
} from '../../models';
import { logger } from '../../utils/logger';

/**
 * Input type for creating a new tier
 */
export interface CreateTierInput {
  name: string;
  displayName: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
  maxCoaches: number;
  maxGoals: number;
  maxChatsPerDay: number;
  hasVoiceJournaling?: boolean;
  hasProgressPhotos?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasTeamFeatures?: boolean;
  hasPrioritySupport?: boolean;
  hasCustomBranding?: boolean;
  hasApiAccess?: boolean;
  hasSsoIntegration?: boolean;
  hasDedicatedSupport?: boolean;
  customFeatures?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Input type for updating a tier
 */
export interface UpdateTierInput extends Partial<CreateTierInput> {
  stripeProductId?: string | null;
}

/**
 * Context for audit logging
 */
export interface AuditContext {
  userId?: string;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  reason?: string;
}

/**
 * Cached tier features for quick lookups
 */
const tierFeaturesCache = new Map<
  string,
  {
    features: ReturnType<SubscriptionTier['planFeatures']>;
    expiresAt: number;
  }
>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * TierService
 *
 * Handles CRUD operations for subscription tiers.
 * Provides caching for feature lookups (used by Subscription model).
 */
export class TierService {
  /**
   * Get all tiers with optional filtering
   */
  async findAll(options?: {
    isActive?: boolean;
    isPublic?: boolean;
    includePrivate?: boolean;
  }): Promise<SubscriptionTier[]> {
    const where: Record<string, unknown> = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.isPublic !== undefined) {
      where.isPublic = options.isPublic;
    }

    // Default to only public tiers unless explicitly including private
    if (!options?.includePrivate && options?.isPublic === undefined) {
      where.isPublic = true;
    }

    return SubscriptionTier.findAll({
      where,
      include: [
        {
          model: TierPricing,
          as: 'pricing',
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['sortOrder', 'ASC']],
    });
  }

  /**
   * Get public tiers for pricing page display
   */
  async getPublicTiers(): Promise<SubscriptionTier[]> {
    return this.findAll({
      isActive: true,
      isPublic: true,
    });
  }

  /**
   * Find a tier by ID
   */
  async findById(id: string): Promise<SubscriptionTier | null> {
    return SubscriptionTier.findByPk(id, {
      include: [
        {
          model: TierPricing,
          as: 'pricing',
        },
      ],
    });
  }

  /**
   * Find a tier by name (e.g., 'pro', 'basic')
   */
  async findByName(name: string): Promise<SubscriptionTier | null> {
    return SubscriptionTier.findOne({
      where: { name: name.toLowerCase() },
      include: [
        {
          model: TierPricing,
          as: 'pricing',
        },
      ],
    });
  }

  /**
   * Create a new tier
   */
  async create(
    input: CreateTierInput,
    auditContext?: AuditContext
  ): Promise<SubscriptionTier> {
    // Normalize name to lowercase
    const normalizedInput = {
      ...input,
      name: input.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    };

    // Check for duplicate name
    const existing = await this.findByName(normalizedInput.name);
    if (existing) {
      throw new Error(`Tier with name '${normalizedInput.name}' already exists`);
    }

    // If no sortOrder provided, put it at the end
    if (normalizedInput.sortOrder === undefined) {
      const maxOrder = await SubscriptionTier.max('sortOrder');
      normalizedInput.sortOrder = (maxOrder as number || 0) + 1;
    }

    const tier = await SubscriptionTier.create(normalizedInput);

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tier.id,
      action: AuditAction.CREATE,
      newValue: tier.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Created new tier: ${tier.name} (${tier.id})`);
    this.invalidateCache(tier.name);

    return tier;
  }

  /**
   * Update an existing tier
   */
  async update(
    id: string,
    input: UpdateTierInput,
    auditContext?: AuditContext
  ): Promise<SubscriptionTier> {
    const tier = await this.findById(id);
    if (!tier) {
      throw new Error(`Tier not found: ${id}`);
    }

    const previousValue = tier.toJSON() as Record<string, unknown>;

    // If name is being changed, normalize and check for conflicts
    if (input.name && input.name !== tier.name) {
      const normalizedName = input.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const existing = await this.findByName(normalizedName);
      if (existing && existing.id !== id) {
        throw new Error(`Tier with name '${normalizedName}' already exists`);
      }
      input.name = normalizedName;
    }

    await tier.update(input);

    // Audit log
    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tier.id,
      action: AuditAction.UPDATE,
      previousValue,
      newValue: tier.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Updated tier: ${tier.name} (${tier.id})`);
    this.invalidateCache(tier.name);
    if (previousValue.name !== tier.name) {
      this.invalidateCache(previousValue.name as string);
    }

    return tier;
  }

  /**
   * Delete a tier (soft delete by deactivating)
   */
  async delete(
    id: string,
    auditContext?: AuditContext,
    options?: { hardDelete?: boolean }
  ): Promise<void> {
    const tier = await this.findById(id);
    if (!tier) {
      throw new Error(`Tier not found: ${id}`);
    }

    // Check for active subscriptions using this tier
    // This would need to query the subscriptions table
    // For now, we'll just log a warning
    logger.warn(`Deleting tier ${tier.name} - ensure no active subscriptions use this tier`);

    const previousValue = tier.toJSON() as Record<string, unknown>;

    if (options?.hardDelete) {
      await tier.destroy();
      await TierAuditLog.logChange({
        entityType: AuditEntityType.TIER,
        entityId: id,
        action: AuditAction.DELETE,
        previousValue,
        ...auditContext,
      });
      logger.info(`Hard deleted tier: ${tier.name} (${id})`);
    } else {
      await tier.update({ isActive: false, isPublic: false });
      await TierAuditLog.logChange({
        entityType: AuditEntityType.TIER,
        entityId: tier.id,
        action: AuditAction.DEACTIVATE,
        previousValue,
        newValue: tier.toJSON() as Record<string, unknown>,
        ...auditContext,
      });
      logger.info(`Deactivated tier: ${tier.name} (${tier.id})`);
    }

    this.invalidateCache(tier.name);
  }

  /**
   * Activate a tier
   */
  async activate(id: string, auditContext?: AuditContext): Promise<SubscriptionTier> {
    const tier = await this.findById(id);
    if (!tier) {
      throw new Error(`Tier not found: ${id}`);
    }

    const previousValue = tier.toJSON() as Record<string, unknown>;
    await tier.update({ isActive: true });

    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tier.id,
      action: AuditAction.ACTIVATE,
      previousValue,
      newValue: tier.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Activated tier: ${tier.name} (${tier.id})`);
    this.invalidateCache(tier.name);

    return tier;
  }

  /**
   * Deactivate a tier
   */
  async deactivate(id: string, auditContext?: AuditContext): Promise<SubscriptionTier> {
    const tier = await this.findById(id);
    if (!tier) {
      throw new Error(`Tier not found: ${id}`);
    }

    const previousValue = tier.toJSON() as Record<string, unknown>;
    await tier.update({ isActive: false });

    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: tier.id,
      action: AuditAction.DEACTIVATE,
      previousValue,
      newValue: tier.toJSON() as Record<string, unknown>,
      ...auditContext,
    });

    logger.info(`Deactivated tier: ${tier.name} (${tier.id})`);
    this.invalidateCache(tier.name);

    return tier;
  }

  /**
   * Duplicate a tier (for creating variations)
   */
  async duplicate(
    id: string,
    newName: string,
    auditContext?: AuditContext
  ): Promise<SubscriptionTier> {
    const source = await this.findById(id);
    if (!source) {
      throw new Error(`Tier not found: ${id}`);
    }

    const sourceData = source.toJSON();
    delete sourceData.id;
    delete sourceData.createdAt;
    delete sourceData.updatedAt;
    delete sourceData.stripeProductId; // Don't copy Stripe ID

    const newTier = await this.create(
      {
        ...sourceData,
        name: newName,
        displayName: `${sourceData.displayName} (Copy)`,
        isPublic: false, // Start as private
      } as CreateTierInput,
      auditContext
    );

    // Copy pricing
    if (source.pricing && source.pricing.length > 0) {
      for (const price of source.pricing) {
        await TierPricing.create({
          tierId: newTier.id,
          billingInterval: price.billingInterval,
          amount: price.amount,
          currency: price.currency,
          isActive: price.isActive,
          trialDays: price.trialDays,
          discountPercentage: price.discountPercentage,
          discountValidUntil: price.discountValidUntil,
        });
      }
    }

    return this.findById(newTier.id) as Promise<SubscriptionTier>;
  }

  /**
   * Reorder tiers
   */
  async reorder(
    orderedIds: string[],
    auditContext?: AuditContext
  ): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await SubscriptionTier.update(
        { sortOrder: i },
        { where: { id: orderedIds[i] } }
      );
    }

    await TierAuditLog.logChange({
      entityType: AuditEntityType.TIER,
      entityId: 'reorder',
      action: AuditAction.UPDATE,
      newValue: { orderedIds },
      ...auditContext,
      reason: 'Bulk reorder operation',
    });

    // Invalidate all tier caches
    tierFeaturesCache.clear();
    logger.info('Reordered tiers');
  }

  /**
   * Get cached tier features for a tier name
   * Used by Subscription.planFeatures for dual-read mode
   */
  getCachedFeatures(tierName: string): ReturnType<SubscriptionTier['planFeatures']> | null {
    const cached = tierFeaturesCache.get(tierName.toLowerCase());
    if (cached && cached.expiresAt > Date.now()) {
      return cached.features;
    }
    return null;
  }

  /**
   * Refresh the tier features cache
   * Call this after modifying tiers or on a schedule
   */
  async refreshCache(): Promise<void> {
    const tiers = await this.findAll({ isActive: true, includePrivate: true });

    for (const tier of tiers) {
      tierFeaturesCache.set(tier.name, {
        features: tier.planFeatures,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    logger.debug(`Refreshed tier features cache with ${tiers.length} tiers`);
  }

  /**
   * Invalidate cache for a specific tier
   */
  private invalidateCache(tierName: string): void {
    tierFeaturesCache.delete(tierName.toLowerCase());
  }

  /**
   * Get audit logs for a tier
   */
  async getAuditLogs(
    tierId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: TierAuditLog[]; total: number }> {
    const { count, rows } = await TierAuditLog.findAndCountAll({
      where: {
        entityType: AuditEntityType.TIER,
        entityId: tierId,
      },
      order: [['createdAt', 'DESC']],
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    });

    return { logs: rows, total: count };
  }

  /**
   * Compare two tiers to show feature differences
   */
  async compareTiers(
    tierId1: string,
    tierId2: string
  ): Promise<{
    tier1: SubscriptionTier;
    tier2: SubscriptionTier;
    differences: Array<{
      field: string;
      tier1Value: unknown;
      tier2Value: unknown;
    }>;
  }> {
    const [tier1, tier2] = await Promise.all([
      this.findById(tierId1),
      this.findById(tierId2),
    ]);

    if (!tier1 || !tier2) {
      throw new Error('One or both tiers not found');
    }

    const compareFields = [
      'maxCoaches',
      'maxGoals',
      'maxChatsPerDay',
      'hasVoiceJournaling',
      'hasProgressPhotos',
      'hasAdvancedAnalytics',
      'hasTeamFeatures',
      'hasPrioritySupport',
      'hasCustomBranding',
      'hasApiAccess',
      'hasSsoIntegration',
      'hasDedicatedSupport',
    ];

    const differences = compareFields
      .map((field) => ({
        field,
        tier1Value: (tier1 as unknown as Record<string, unknown>)[field],
        tier2Value: (tier2 as unknown as Record<string, unknown>)[field],
      }))
      .filter((d) => d.tier1Value !== d.tier2Value);

    return { tier1, tier2, differences };
  }
}

export const tierService = new TierService();
