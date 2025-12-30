import { EventEmitter } from 'events';

/**
 * White-Label Branding Configuration
 */
export interface BrandingConfig {
  id: string;
  organizationId: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  supportEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
  customCSS?: string;
  customJS?: string;
  features: {
    showBranding: boolean;
    customEmailTemplates: boolean;
    customMobileApp: boolean;
    ssoOnly: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Theme Configuration
 */
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * White-Label Engine
 * Manages white-label branding configurations for enterprise customers
 */
export class WhiteLabelEngine extends EventEmitter {
  private brandingConfigs: Map<string, BrandingConfig> = new Map();
  private domainMappings: Map<string, string> = new Map(); // domain -> organizationId
  private themeCache: Map<string, ThemeConfig> = new Map();

  constructor() {
    super();
    this.initializeDefaultBranding();
  }

  /**
   * Initialize default UpCoach branding
   */
  private initializeDefaultBranding(): void {
    const defaultBranding: BrandingConfig = {
      id: 'default',
      organizationId: 'upcoach',
      name: 'UpCoach',
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
      accentColor: '#EC4899',
      logoUrl: '/assets/logo.svg',
      faviconUrl: '/assets/favicon.ico',
      emailFromName: 'UpCoach',
      emailFromAddress: 'noreply@upcoach.com',
      supportEmail: 'support@upcoach.com',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
      features: {
        showBranding: true,
        customEmailTemplates: false,
        customMobileApp: false,
        ssoOnly: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.brandingConfigs.set('default', defaultBranding);
  }

  /**
   * Create or update branding configuration
   */
  async configureBranding(
    organizationId: string,
    config: Partial<BrandingConfig>
  ): Promise<BrandingConfig> {
    const existing = Array.from(this.brandingConfigs.values()).find(
      (b) => b.organizationId === organizationId
    );

    const branding: BrandingConfig = {
      id: existing?.id || `branding-${Date.now()}`,
      organizationId,
      name: config.name || existing?.name || organizationId,
      primaryColor: config.primaryColor || existing?.primaryColor || '#6366F1',
      secondaryColor: config.secondaryColor || existing?.secondaryColor || '#8B5CF6',
      accentColor: config.accentColor || existing?.accentColor || '#EC4899',
      logoUrl: config.logoUrl || existing?.logoUrl,
      faviconUrl: config.faviconUrl || existing?.faviconUrl,
      customDomain: config.customDomain || existing?.customDomain,
      emailFromName: config.emailFromName || existing?.emailFromName,
      emailFromAddress: config.emailFromAddress || existing?.emailFromAddress,
      supportEmail: config.supportEmail || existing?.supportEmail,
      termsUrl: config.termsUrl || existing?.termsUrl,
      privacyUrl: config.privacyUrl || existing?.privacyUrl,
      customCSS: config.customCSS || existing?.customCSS,
      customJS: config.customJS || existing?.customJS,
      features: {
        ...existing?.features,
        ...config.features,
      } as BrandingConfig['features'],
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.brandingConfigs.set(branding.id, branding);

    // Update domain mapping if custom domain provided
    if (branding.customDomain) {
      this.domainMappings.set(branding.customDomain, organizationId);
    }

    // Generate and cache theme
    const theme = this.generateTheme(branding);
    this.themeCache.set(organizationId, theme);

    this.emit('branding:updated', branding);

    return branding;
  }

  /**
   * Get branding configuration for organization
   */
  async getBranding(organizationId: string): Promise<BrandingConfig> {
    const branding = Array.from(this.brandingConfigs.values()).find(
      (b) => b.organizationId === organizationId
    );

    if (!branding) {
      return this.brandingConfigs.get('default')!;
    }

    return branding;
  }

  /**
   * Get branding by custom domain
   */
  async getBrandingByDomain(domain: string): Promise<BrandingConfig> {
    const organizationId = this.domainMappings.get(domain);

    if (!organizationId) {
      return this.brandingConfigs.get('default')!;
    }

    return this.getBranding(organizationId);
  }

  /**
   * Generate theme configuration from branding
   */
  private generateTheme(branding: BrandingConfig): ThemeConfig {
    return {
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        accent: branding.accentColor,
        background: '#FFFFFF',
        surface: '#F9FAFB',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.25rem',
          xlarge: '1.5rem',
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
      },
    };
  }

  /**
   * Get theme configuration
   */
  async getTheme(organizationId: string): Promise<ThemeConfig> {
    // Check cache first
    if (this.themeCache.has(organizationId)) {
      return this.themeCache.get(organizationId)!;
    }

    // Generate from branding
    const branding = await this.getBranding(organizationId);
    const theme = this.generateTheme(branding);
    this.themeCache.set(organizationId, theme);

    return theme;
  }

  /**
   * Generate CSS variables from theme
   */
  async generateThemeCSS(organizationId: string): Promise<string> {
    const theme = await this.getTheme(organizationId);

    return `
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-error: ${theme.colors.error};
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-info: ${theme.colors.info};

  /* Typography */
  --font-family: ${theme.typography.fontFamily};
  --font-size-sm: ${theme.typography.fontSize.small};
  --font-size-md: ${theme.typography.fontSize.medium};
  --font-size-lg: ${theme.typography.fontSize.large};
  --font-size-xl: ${theme.typography.fontSize.xlarge};

  /* Spacing */
  --spacing-xs: ${theme.spacing.xs};
  --spacing-sm: ${theme.spacing.sm};
  --spacing-md: ${theme.spacing.md};
  --spacing-lg: ${theme.spacing.lg};
  --spacing-xl: ${theme.spacing.xl};

  /* Border Radius */
  --radius-sm: ${theme.borderRadius.sm};
  --radius-md: ${theme.borderRadius.md};
  --radius-lg: ${theme.borderRadius.lg};
}
    `.trim();
  }

  /**
   * Upload and process logo
   */
  async uploadLogo(
    organizationId: string,
    file: Buffer,
    filename: string
  ): Promise<string> {
    // In production, this would upload to S3/CloudFront
    const url = `/uploads/logos/${organizationId}/${filename}`;

    // Update branding config
    const branding = await this.getBranding(organizationId);
    await this.configureBranding(organizationId, {
      ...branding,
      logoUrl: url,
    });

    this.emit('logo:uploaded', { organizationId, url });

    return url;
  }

  /**
   * Preview branding changes
   */
  async previewBranding(config: Partial<BrandingConfig>): Promise<{
    theme: ThemeConfig;
    css: string;
  }> {
    const tempBranding: BrandingConfig = {
      id: 'preview',
      organizationId: 'preview',
      name: 'Preview',
      primaryColor: config.primaryColor || '#6366F1',
      secondaryColor: config.secondaryColor || '#8B5CF6',
      accentColor: config.accentColor || '#EC4899',
      features: {
        showBranding: true,
        customEmailTemplates: false,
        customMobileApp: false,
        ssoOnly: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const theme = this.generateTheme(tempBranding);
    const css = await this.generateThemeCSS('preview');

    return { theme, css };
  }

  /**
   * Export branding configuration
   */
  async exportBranding(organizationId: string): Promise<object> {
    const branding = await this.getBranding(organizationId);
    const theme = await this.getTheme(organizationId);

    return {
      branding,
      theme,
      css: await this.generateThemeCSS(organizationId),
    };
  }

  /**
   * List all branding configurations
   */
  async listBranding(): Promise<BrandingConfig[]> {
    return Array.from(this.brandingConfigs.values());
  }

  /**
   * Delete branding configuration
   */
  async deleteBranding(organizationId: string): Promise<void> {
    const branding = Array.from(this.brandingConfigs.values()).find(
      (b) => b.organizationId === organizationId
    );

    if (branding) {
      this.brandingConfigs.delete(branding.id);
      this.themeCache.delete(organizationId);

      if (branding.customDomain) {
        this.domainMappings.delete(branding.customDomain);
      }

      this.emit('branding:deleted', branding);
    }
  }
}

export default WhiteLabelEngine;
