/**
 * Tiers Service
 * Handles all tier and pricing management API calls for the admin panel.
 */

import { apiClient } from './api';

// Types matching the API response structures

export interface TierPricing {
  id: string;
  tierId: string;
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  stripePriceId: string | null;
  isActive: boolean;
  trialDays: number;
  discountPercentage: number | null;
  discountValidUntil: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  stripeProductId: string | null;
  maxCoaches: number;
  maxGoals: number;
  maxChatsPerDay: number;
  hasVoiceJournaling: boolean;
  hasProgressPhotos: boolean;
  hasAdvancedAnalytics: boolean;
  hasTeamFeatures: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasApiAccess: boolean;
  hasSsoIntegration: boolean;
  hasDedicatedSupport: boolean;
  customFeatures: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  pricing?: TierPricing[];
}

export interface TierAuditLog {
  id: string;
  entityType: 'tier' | 'pricing';
  entityId: string;
  action: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changedFields: string[] | null;
  userId: string | null;
  email: string | null;
  role: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  reason: string | null;
  createdAt: string;
}

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

export interface UpdateTierInput extends Partial<CreateTierInput> {
  stripeProductId?: string | null;
}

export interface CreatePricingInput {
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency?: string;
  isActive?: boolean;
  trialDays?: number;
  discountPercentage?: number;
  discountValidUntil?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePricingInput {
  amount?: number;
  currency?: string;
  isActive?: boolean;
  trialDays?: number;
  discountPercentage?: number | null;
  discountValidUntil?: string | null;
  stripePriceId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface StripeSyncStatus {
  tierId: string;
  tierName: string;
  stripeProductId: string | null;
  stripeProductName: string | null;
  isSynced: boolean;
  pricingSyncStatus: Array<{
    pricingId: string;
    billingInterval: string;
    stripePriceId: string | null;
    isSynced: boolean;
  }>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  prices: Array<{
    id: string;
    unitAmount: number;
    currency: string;
    recurring: {
      interval: string;
      intervalCount: number;
    } | null;
    active: boolean;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class TiersService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all tiers with optional filtering
   */
  async getTiers(options?: {
    isActive?: boolean;
    isPublic?: boolean;
    includePrivate?: boolean;
  }): Promise<SubscriptionTier[]> {
    const params = new URLSearchParams();
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
    if (options?.isPublic !== undefined) params.append('isPublic', String(options.isPublic));
    if (options?.includePrivate) params.append('includePrivate', 'true');

    const queryString = params.toString();
    const url = `/api/tiers${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<SubscriptionTier[]>>(url);
    return response.data.data;
  }

  /**
   * Get public tiers for pricing page (cached)
   */
  async getPublicTiers(): Promise<SubscriptionTier[]> {
    const cacheKey = 'public-tiers';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as SubscriptionTier[];
    }

    const response = await apiClient.get<ApiResponse<SubscriptionTier[]>>('/api/tiers/public');
    const data = response.data.data;

    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Get tier by ID
   */
  async getTierById(id: string): Promise<SubscriptionTier> {
    const response = await apiClient.get<ApiResponse<SubscriptionTier>>(`/api/tiers/${id}`);
    return response.data.data;
  }

  /**
   * Create a new tier
   */
  async createTier(input: CreateTierInput): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>('/api/tiers', input);
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Update an existing tier
   */
  async updateTier(id: string, input: UpdateTierInput): Promise<SubscriptionTier> {
    const response = await apiClient.put<ApiResponse<SubscriptionTier>>(`/api/tiers/${id}`, input);
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Delete a tier
   */
  async deleteTier(id: string, options?: { hardDelete?: boolean }): Promise<void> {
    const params = options?.hardDelete ? '?hardDelete=true' : '';
    await apiClient.delete(`/api/tiers/${id}${params}`);
    this.invalidateCache();
  }

  /**
   * Activate a tier
   */
  async activateTier(id: string): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>(`/api/tiers/${id}/activate`);
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Deactivate a tier
   */
  async deactivateTier(id: string): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>(`/api/tiers/${id}/deactivate`);
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Duplicate a tier
   */
  async duplicateTier(id: string, newName: string): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>(`/api/tiers/${id}/duplicate`, {
      newName,
    });
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Reorder tiers
   */
  async reorderTiers(orderedIds: string[]): Promise<void> {
    await apiClient.post('/api/tiers/reorder', { orderedIds });
    this.invalidateCache();
  }

  /**
   * Compare two tiers
   */
  async compareTiers(tierId1: string, tierId2: string): Promise<{
    tier1: SubscriptionTier;
    tier2: SubscriptionTier;
    differences: Array<{
      field: string;
      tier1Value: unknown;
      tier2Value: unknown;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<{
      tier1: SubscriptionTier;
      tier2: SubscriptionTier;
      differences: Array<{
        field: string;
        tier1Value: unknown;
        tier2Value: unknown;
      }>;
    }>>(`/api/tiers/compare?tier1=${tierId1}&tier2=${tierId2}`);
    return response.data.data;
  }

  // =====================
  // Pricing Management
  // =====================

  /**
   * Get pricing for a tier
   */
  async getTierPricing(tierId: string, options?: { includeInactive?: boolean }): Promise<TierPricing[]> {
    const params = options?.includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<ApiResponse<TierPricing[]>>(
      `/api/tiers/${tierId}/pricing${params}`
    );
    return response.data.data;
  }

  /**
   * Create pricing for a tier
   */
  async createPricing(tierId: string, input: CreatePricingInput): Promise<TierPricing> {
    const response = await apiClient.post<ApiResponse<TierPricing>>(
      `/api/tiers/${tierId}/pricing`,
      input
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Update pricing
   */
  async updatePricing(tierId: string, pricingId: string, input: UpdatePricingInput): Promise<TierPricing> {
    const response = await apiClient.put<ApiResponse<TierPricing>>(
      `/api/tiers/${tierId}/pricing/${pricingId}`,
      input
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Delete pricing
   */
  async deletePricing(tierId: string, pricingId: string, options?: { hardDelete?: boolean }): Promise<void> {
    const params = options?.hardDelete ? '?hardDelete=true' : '';
    await apiClient.delete(`/api/tiers/${tierId}/pricing/${pricingId}${params}`);
    this.invalidateCache();
  }

  /**
   * Set discount on pricing
   */
  async setDiscount(
    tierId: string,
    pricingId: string,
    discountPercentage: number,
    validUntil?: string
  ): Promise<TierPricing> {
    const response = await apiClient.post<ApiResponse<TierPricing>>(
      `/api/tiers/${tierId}/pricing/${pricingId}/discount`,
      { discountPercentage, validUntil }
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Remove discount from pricing
   */
  async removeDiscount(tierId: string, pricingId: string): Promise<TierPricing> {
    const response = await apiClient.delete<ApiResponse<TierPricing>>(
      `/api/tiers/${tierId}/pricing/${pricingId}/discount`
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Set trial days on pricing
   */
  async setTrialDays(tierId: string, pricingId: string, trialDays: number): Promise<TierPricing> {
    const response = await apiClient.post<ApiResponse<TierPricing>>(
      `/api/tiers/${tierId}/pricing/${pricingId}/trial`,
      { trialDays }
    );
    this.invalidateCache();
    return response.data.data;
  }

  // =====================
  // Stripe Sync
  // =====================

  /**
   * Get Stripe sync status for a tier
   */
  async getStripeSyncStatus(tierId: string): Promise<StripeSyncStatus> {
    const response = await apiClient.get<ApiResponse<StripeSyncStatus>>(
      `/api/tiers/${tierId}/stripe/status`
    );
    return response.data.data;
  }

  /**
   * Sync a tier to Stripe
   */
  async syncTierToStripe(tierId: string): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>(
      `/api/tiers/${tierId}/sync/stripe`
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Sync all tiers to Stripe
   */
  async syncAllTiersToStripe(): Promise<{
    synced: string[];
    failed: Array<{ tierId: string; error: string }>;
  }> {
    const response = await apiClient.post<ApiResponse<{
      synced: string[];
      failed: Array<{ tierId: string; error: string }>;
    }>>('/api/tiers/sync/stripe');
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Link a tier to a Stripe product
   */
  async linkStripeProduct(tierId: string, stripeProductId: string): Promise<SubscriptionTier> {
    const response = await apiClient.post<ApiResponse<SubscriptionTier>>(
      `/api/tiers/${tierId}/link-stripe`,
      { stripeProductId }
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Unlink a tier from Stripe
   */
  async unlinkStripeProduct(tierId: string): Promise<SubscriptionTier> {
    const response = await apiClient.delete<ApiResponse<SubscriptionTier>>(
      `/api/tiers/${tierId}/link-stripe`
    );
    this.invalidateCache();
    return response.data.data;
  }

  /**
   * Get Stripe products
   */
  async getStripeProducts(): Promise<StripeProduct[]> {
    const response = await apiClient.get<ApiResponse<StripeProduct[]>>('/api/tiers/stripe/products');
    return response.data.data;
  }

  /**
   * Import tiers from Stripe
   */
  async importFromStripe(): Promise<{
    imported: SubscriptionTier[];
    skipped: Array<{ productId: string; reason: string }>;
  }> {
    const response = await apiClient.post<ApiResponse<{
      imported: SubscriptionTier[];
      skipped: Array<{ productId: string; reason: string }>;
    }>>('/api/tiers/import/stripe');
    this.invalidateCache();
    return response.data.data;
  }

  // =====================
  // Audit Logs
  // =====================

  /**
   * Get audit logs for a tier
   */
  async getTierAuditLogs(
    tierId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ logs: TierAuditLog[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const queryString = params.toString();
    const response = await apiClient.get<ApiResponse<{ logs: TierAuditLog[]; total: number }>>(
      `/api/tiers/${tierId}/audit${queryString ? `?${queryString}` : ''}`
    );
    return response.data.data;
  }

  /**
   * Get audit logs for pricing
   */
  async getPricingAuditLogs(
    tierId: string,
    pricingId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ logs: TierAuditLog[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const queryString = params.toString();
    const response = await apiClient.get<ApiResponse<{ logs: TierAuditLog[]; total: number }>>(
      `/api/tiers/${tierId}/pricing/${pricingId}/audit${queryString ? `?${queryString}` : ''}`
    );
    return response.data.data;
  }

  // =====================
  // Cache Management
  // =====================

  /**
   * Refresh the tier features cache on the server
   */
  async refreshCache(): Promise<void> {
    await apiClient.post('/api/tiers/cache/refresh');
  }

  /**
   * Invalidate local cache
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Format amount from cents to display currency
   */
  formatAmount(amountInCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amountInCents / 100);
  }

  /**
   * Calculate monthly equivalent for a billing interval
   */
  getMonthlyEquivalent(amountInCents: number, interval: 'monthly' | 'quarterly' | 'yearly'): number {
    switch (interval) {
      case 'monthly':
        return amountInCents;
      case 'quarterly':
        return Math.round(amountInCents / 3);
      case 'yearly':
        return Math.round(amountInCents / 12);
      default:
        return amountInCents;
    }
  }

  /**
   * Get billing interval display name
   */
  getBillingIntervalLabel(interval: 'monthly' | 'quarterly' | 'yearly'): string {
    switch (interval) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'yearly':
        return 'Yearly';
      default:
        return interval;
    }
  }

  /**
   * Check if a tier has unlimited value for a limit
   */
  isUnlimited(value: number): boolean {
    return value === -1;
  }

  /**
   * Format limit value for display
   */
  formatLimit(value: number): string {
    return value === -1 ? 'Unlimited' : String(value);
  }
}

// Export singleton instance
export const tiersService = new TiersService();
export default tiersService;
