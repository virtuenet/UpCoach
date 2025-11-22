import { z } from 'zod';

export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'limited';

export interface TenantFeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  context?: Record<string, unknown>;
}

export interface TenantLimits {
  seats: number;
  storageGb: number;
  automationJobs: number;
  aiCredits: number;
}

export interface TenantSettings {
  locale: string;
  timezone: string;
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  dataResidency?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  limits: TenantLimits;
  settings: TenantSettings;
  featureFlags: TenantFeatureFlag[];
  createdAt: Date;
  updatedAt: Date;
}

export const tenantPlanLimits: Record<TenantPlan, TenantLimits> = {
  starter: { seats: 25, storageGb: 10, automationJobs: 5, aiCredits: 2000 },
  growth: { seats: 250, storageGb: 120, automationJobs: 50, aiCredits: 25000 },
  enterprise: { seats: 1000, storageGb: 1024, automationJobs: 250, aiCredits: 250000 },
};

export const tenantSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase and hyphenated'),
  name: z.string().min(2),
  plan: z.enum(['starter', 'growth', 'enterprise']),
  status: z.enum(['active', 'suspended', 'limited']),
  limits: z.object({
    seats: z.number().positive(),
    storageGb: z.number().nonnegative(),
    automationJobs: z.number().nonnegative(),
    aiCredits: z.number().nonnegative(),
  }),
  settings: z.object({
    locale: z.string().default('en-US'),
    timezone: z.string().default('UTC'),
    branding: z
      .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        logoUrl: z.string().url().optional(),
      })
      .default({}),
    dataResidency: z.string().optional(),
  }),
  featureFlags: z
    .array(
      z.object({
        key: z.string(),
        enabled: z.boolean(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        context: z.record(z.any()).optional(),
      })
    )
    .default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TenantDTO = z.infer<typeof tenantSchema>;

export const tenantFactory = (payload: Tenant | TenantDTO): Tenant => ({
  ...payload,
  limits: payload.limits ?? tenantPlanLimits[payload.plan],
  featureFlags: payload.featureFlags ?? [],
});

export const canAccessFeature = (tenant: Tenant, featureKey: string): boolean => {
  const flag = tenant.featureFlags.find(flag => flag.key === featureKey);
  if (!flag) {
    return tenant.plan === 'enterprise';
  }
  if (!flag.enabled) {
    return false;
  }

  if (!flag.rolloutPercentage) {
    return true;
  }

  const hash = Array.from(tenant.id)
    .map(char => char.charCodeAt(0))
    .reduce((acc, curr) => acc + curr, 0);
  const bucket = hash % 100;
  return bucket < flag.rolloutPercentage;
};


