import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Tenant Configuration
 */
export interface TenantConfig {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  domain?: string; // Custom domain (e.g., coaching.company.com)
  status: 'active' | 'suspended' | 'trial';
  tier: 'standard' | 'premium' | 'enterprise';

  // Feature flags
  features: {
    aiCoaching: boolean;
    communities: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    sso: boolean;
    apiAccess: boolean;
  };

  // Branding
  branding: {
    logo?: string; // URL to logo
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    customCSS?: string;
    hidePoweredBy: boolean; // Hide "Powered by UpCoach"
  };

  // Limits
  limits: {
    maxUsers: number;
    maxStorage: number; // GB
    maxAPIKeys: number;
    maxWebhooks: number;
  };

  // Data residency
  dataResidency: {
    region: 'EU-CENTRAL' | 'EU-WEST' | 'US-EAST' | 'US-WEST' | 'APAC' | 'LATAM';
    allowDataTransfer: boolean;
  };

  // SSO Configuration
  ssoConfig?: {
    provider: 'saml' | 'azure_ad' | 'okta' | 'google_workspace';
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    enabled: boolean;
  };

  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant Statistics
 */
export interface TenantStatistics {
  tenantId: string;
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  usage: {
    storage: number; // GB
    apiCalls: number;
    bandwidth: number; // GB
  };
  billing: {
    plan: string;
    mrr: number; // Monthly recurring revenue
    nextBillingDate: Date;
  };
}

/**
 * TenantManagementService
 *
 * Manages multi-tenant architecture including tenant creation,
 * configuration, isolation, and white-label customization.
 */
export class TenantManagementService extends EventEmitter {
  private static instance: TenantManagementService;
  private tenants: Map<string, TenantConfig> = new Map();
  private tenantsBySlug: Map<string, string> = new Map(); // slug -> tenantId
  private tenantsByDomain: Map<string, string> = new Map(); // domain -> tenantId

  private constructor() {
    super();
  }

  static getInstance(): TenantManagementService {
    if (!TenantManagementService.instance) {
      TenantManagementService.instance = new TenantManagementService();
    }
    return TenantManagementService.instance;
  }

  /**
   * Create Tenant
   */
  async createTenant(config: {
    name: string;
    slug: string;
    tier: 'standard' | 'premium' | 'enterprise';
    domain?: string;
  }): Promise<TenantConfig> {
    // Validate slug uniqueness
    if (this.tenantsBySlug.has(config.slug)) {
      throw new Error('Tenant slug already exists');
    }

    // Validate domain uniqueness
    if (config.domain && this.tenantsByDomain.has(config.domain)) {
      throw new Error('Domain already registered');
    }

    const tenant: TenantConfig = {
      id: crypto.randomUUID(),
      name: config.name,
      slug: config.slug,
      domain: config.domain,
      status: 'trial',
      tier: config.tier,

      features: this.getDefaultFeatures(config.tier),
      branding: this.getDefaultBranding(),
      limits: this.getDefaultLimits(config.tier),
      dataResidency: {
        region: 'US-EAST',
        allowDataTransfer: false,
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tenants.set(tenant.id, tenant);
    this.tenantsBySlug.set(tenant.slug, tenant.id);
    if (tenant.domain) {
      this.tenantsByDomain.set(tenant.domain, tenant.id);
    }

    this.emit('tenant:created', { tenantId: tenant.id, name: tenant.name });

    return tenant;
  }

  /**
   * Get Tenant by ID
   */
  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get Tenant by Slug
   */
  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    const tenantId = this.tenantsBySlug.get(slug);
    return tenantId ? this.tenants.get(tenantId) || null : null;
  }

  /**
   * Get Tenant by Domain
   */
  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    const tenantId = this.tenantsByDomain.get(domain);
    return tenantId ? this.tenants.get(tenantId) || null : null;
  }

  /**
   * Update Tenant Branding
   */
  async updateBranding(
    tenantId: string,
    branding: Partial<TenantConfig['branding']>
  ): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.branding = { ...tenant.branding, ...branding };
    tenant.updatedAt = new Date();

    this.emit('tenant:branding_updated', { tenantId, branding });

    return tenant;
  }

  /**
   * Update Tenant Features
   */
  async updateFeatures(
    tenantId: string,
    features: Partial<TenantConfig['features']>
  ): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.features = { ...tenant.features, ...features };
    tenant.updatedAt = new Date();

    this.emit('tenant:features_updated', { tenantId, features });

    return tenant;
  }

  /**
   * Configure SSO
   */
  async configureSS(
    tenantId: string,
    ssoConfig: TenantConfig['ssoConfig']
  ): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.features.sso) {
      throw new Error('SSO feature not enabled for this tenant');
    }

    tenant.ssoConfig = ssoConfig;
    tenant.updatedAt = new Date();

    this.emit('tenant:sso_configured', { tenantId });

    return tenant;
  }

  /**
   * Set Custom Domain
   */
  async setCustomDomain(tenantId: string, domain: string): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.features.customDomain) {
      throw new Error('Custom domain feature not enabled');
    }

    // Remove old domain mapping
    if (tenant.domain) {
      this.tenantsByDomain.delete(tenant.domain);
    }

    // Add new domain mapping
    tenant.domain = domain;
    this.tenantsByDomain.set(domain, tenantId);
    tenant.updatedAt = new Date();

    this.emit('tenant:domain_updated', { tenantId, domain });

    return tenant;
  }

  /**
   * Update Tenant Status
   */
  async updateStatus(
    tenantId: string,
    status: 'active' | 'suspended' | 'trial'
  ): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.status = status;
    tenant.updatedAt = new Date();

    this.emit('tenant:status_updated', { tenantId, status });

    return tenant;
  }

  /**
   * Get Tenant Statistics
   */
  async getTenantStatistics(tenantId: string): Promise<TenantStatistics> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // This would normally query database for actual statistics
    return {
      tenantId,
      users: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      usage: {
        storage: 0,
        apiCalls: 0,
        bandwidth: 0,
      },
      billing: {
        plan: tenant.tier,
        mrr: tenant.tier === 'enterprise' ? 400000 : tenant.tier === 'premium' ? 250000 : 0,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * List All Tenants
   */
  async listTenants(): Promise<TenantConfig[]> {
    return Array.from(this.tenants.values());
  }

  /**
   * Delete Tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    this.tenants.delete(tenantId);
    this.tenantsBySlug.delete(tenant.slug);
    if (tenant.domain) {
      this.tenantsByDomain.delete(tenant.domain);
    }

    this.emit('tenant:deleted', { tenantId });
  }

  /**
   * Get Default Features by Tier
   */
  private getDefaultFeatures(tier: string): TenantConfig['features'] {
    const features = {
      standard: {
        aiCoaching: true,
        communities: false,
        whiteLabel: false,
        customDomain: false,
        sso: false,
        apiAccess: false,
      },
      premium: {
        aiCoaching: true,
        communities: true,
        whiteLabel: true,
        customDomain: true,
        sso: true,
        apiAccess: false,
      },
      enterprise: {
        aiCoaching: true,
        communities: true,
        whiteLabel: true,
        customDomain: true,
        sso: true,
        apiAccess: true,
      },
    };

    return features[tier as keyof typeof features] || features.standard;
  }

  /**
   * Get Default Branding
   */
  private getDefaultBranding(): TenantConfig['branding'] {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#EC4899',
      hidePoweredBy: false,
    };
  }

  /**
   * Get Default Limits by Tier
   */
  private getDefaultLimits(tier: string): TenantConfig['limits'] {
    const limits = {
      standard: {
        maxUsers: 10000,
        maxStorage: 100,
        maxAPIKeys: 5,
        maxWebhooks: 10,
      },
      premium: {
        maxUsers: 50000,
        maxStorage: 500,
        maxAPIKeys: 20,
        maxWebhooks: 50,
      },
      enterprise: {
        maxUsers: 999999,
        maxStorage: 5000,
        maxAPIKeys: 100,
        maxWebhooks: 200,
      },
    };

    return limits[tier as keyof typeof limits] || limits.standard;
  }
}

export const tenantManagementService = TenantManagementService.getInstance();
