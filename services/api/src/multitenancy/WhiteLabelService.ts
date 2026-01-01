import * as AWS from 'aws-sdk';
import * as acme from 'acme-client';
import crypto from 'crypto';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import axios from 'axios';

/**
 * Complete White-Labeling and Customization Service
 * Handles custom domains, SSL certificates, branding, and email customization
 */

export interface CustomDomain {
  id: string;
  tenantId: string;
  domain: string;
  type: 'subdomain' | 'custom' | 'custom_with_subdomain';
  verified: boolean;
  sslCertificateArn?: string;
  sslStatus: 'pending' | 'issuing' | 'active' | 'renewing' | 'expired' | 'failed';
  sslExpiresAt?: Date;
  dnsVerificationToken: string;
  dnsVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandConfiguration {
  tenantId: string;
  logo?: {
    url: string;
    width: number;
    height: number;
  };
  favicon?: {
    url: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  customCss?: string;
  darkMode?: {
    enabled: boolean;
    colors: Partial<BrandConfiguration['colors']>;
  };
}

export interface EmailConfiguration {
  tenantId: string;
  fromAddress: string;
  fromName: string;
  replyToAddress?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  templates: {
    [key: string]: {
      subject: string;
      htmlTemplate: string;
      textTemplate?: string;
    };
  };
  dkimConfig?: {
    domainName: string;
    privateKey: string;
    selector: string;
  };
  spfRecord?: string;
  dmarcPolicy?: string;
  verified: boolean;
}

export interface UITheme {
  tenantId: string;
  name: string;
  theme: {
    palette: {
      mode: 'light' | 'dark';
      primary: {
        main: string;
        light: string;
        dark: string;
        contrastText: string;
      };
      secondary: {
        main: string;
        light: string;
        dark: string;
        contrastText: string;
      };
      error: {
        main: string;
        light: string;
        dark: string;
      };
      warning: {
        main: string;
      };
      info: {
        main: string;
      };
      success: {
        main: string;
      };
      background: {
        default: string;
        paper: string;
      };
      text: {
        primary: string;
        secondary: string;
        disabled: string;
      };
    };
    typography: {
      fontFamily: string;
      fontSize: number;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      body1: any;
      body2: any;
      button: any;
    };
    shape: {
      borderRadius: number;
    };
    spacing: number;
    components?: Record<string, any>;
  };
}

export interface MobileAppBranding {
  tenantId: string;
  appName: string;
  appIcon?: {
    url: string;
    size: number;
  };
  splashScreen?: {
    url: string;
    backgroundColor: string;
  };
  themeColors: {
    primary: string;
    statusBar: 'light-content' | 'dark-content';
    navigationBar: string;
  };
  deepLinkScheme: string;
}

export interface CustomTerminology {
  tenantId: string;
  terms: {
    [key: string]: string;
  };
}

export interface CustomNavigation {
  tenantId: string;
  menuItems: Array<{
    id: string;
    label: string;
    icon?: string;
    path?: string;
    url?: string;
    visible: boolean;
    order: number;
    children?: Array<{
      id: string;
      label: string;
      path?: string;
      url?: string;
      visible: boolean;
    }>;
  }>;
}

export interface LegalDocuments {
  tenantId: string;
  termsOfService?: {
    url?: string;
    content?: string;
    version: string;
    effectiveDate: Date;
  };
  privacyPolicy?: {
    url?: string;
    content?: string;
    version: string;
    effectiveDate: Date;
  };
  cookiePolicy?: {
    url?: string;
    content?: string;
  };
  acceptableUsePolicy?: {
    url?: string;
    content?: string;
  };
  sla?: {
    url?: string;
    content?: string;
    uptimeGuarantee: number;
  };
}

export class WhiteLabelService extends EventEmitter {
  private pool: Pool;
  private redis: IORedis;
  private route53: AWS.Route53;
  private acm: AWS.ACM;
  private s3: AWS.S3;
  private cloudfront: AWS.CloudFront;
  private acmeClient: acme.Client;
  private hostedZoneId: string;

  constructor(
    dbConfig: any,
    redisConfig: any,
    awsConfig: any,
    acmeConfig: {
      accountKey: string;
      email: string;
    },
    hostedZoneId: string
  ) {
    super();

    this.pool = new Pool(dbConfig);
    this.redis = new IORedis(redisConfig);

    AWS.config.update(awsConfig);
    this.route53 = new AWS.Route53();
    this.acm = new AWS.ACM();
    this.s3 = new AWS.S3();
    this.cloudfront = new AWS.CloudFront();

    this.hostedZoneId = hostedZoneId;

    this.acmeClient = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: acmeConfig.accountKey
    });

    this.initializeCertificateRenewal();
  }

  private initializeCertificateRenewal(): void {
    setInterval(async () => {
      await this.renewExpiringCertificates();
    }, 24 * 60 * 60 * 1000);
  }

  async addCustomDomain(
    tenantId: string,
    domain: string,
    type: 'custom' | 'custom_with_subdomain' = 'custom'
  ): Promise<CustomDomain> {
    const existing = await this.pool.query(
      'SELECT * FROM custom_domains WHERE domain = $1 AND tenant_id != $2',
      [domain, tenantId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Domain already in use by another tenant');
    }

    const dnsVerificationToken = crypto.randomBytes(32).toString('hex');

    const customDomain: CustomDomain = {
      id: crypto.randomUUID(),
      tenantId,
      domain,
      type,
      verified: false,
      sslStatus: 'pending',
      dnsVerificationToken,
      dnsVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.pool.query(
      `INSERT INTO custom_domains
       (id, tenant_id, domain, type, verified, ssl_status,
        dns_verification_token, dns_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        customDomain.id,
        customDomain.tenantId,
        customDomain.domain,
        customDomain.type,
        customDomain.verified,
        customDomain.sslStatus,
        customDomain.dnsVerificationToken,
        customDomain.dnsVerified,
        customDomain.createdAt,
        customDomain.updatedAt
      ]
    );

    this.emit('custom_domain:added', customDomain);

    return customDomain;
  }

  async verifyDNS(domainId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT * FROM custom_domains WHERE id = $1',
      [domainId]
    );

    if (result.rows.length === 0) {
      throw new Error('Custom domain not found');
    }

    const customDomain = result.rows[0];

    try {
      const txtRecords = await this.queryDNSTxtRecords(
        `_upcoach-verification.${customDomain.domain}`
      );

      const verified = txtRecords.some(
        record => record.includes(customDomain.dns_verification_token)
      );

      if (verified) {
        await this.pool.query(
          `UPDATE custom_domains SET dns_verified = true, updated_at = NOW()
           WHERE id = $1`,
          [domainId]
        );

        await this.configureCNAME(customDomain.domain, customDomain.tenant_id);

        await this.issueSslCertificate(domainId);

        this.emit('custom_domain:verified', { domainId, domain: customDomain.domain });

        return true;
      }

      return false;
    } catch (error) {
      console.error('DNS verification failed:', error);
      return false;
    }
  }

  private async queryDNSTxtRecords(domain: string): Promise<string[]> {
    const dns = require('dns').promises;

    try {
      const records = await dns.resolveTxt(domain);
      return records.flat();
    } catch (error) {
      return [];
    }
  }

  private async configureCNAME(domain: string, tenantId: string): Promise<void> {
    const targetDomain = `${tenantId}.upcoach.com`;

    try {
      await this.route53.changeResourceRecordSets({
        HostedZoneId: this.hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: domain,
                Type: 'CNAME',
                TTL: 300,
                ResourceRecords: [{ Value: targetDomain }]
              }
            }
          ]
        }
      }).promise();

      this.emit('dns:cname_configured', { domain, target: targetDomain });
    } catch (error) {
      console.error('Failed to configure CNAME:', error);
      throw error;
    }
  }

  async issueSslCertificate(domainId: string): Promise<void> {
    const result = await this.pool.query(
      'SELECT * FROM custom_domains WHERE id = $1',
      [domainId]
    );

    if (result.rows.length === 0) {
      throw new Error('Custom domain not found');
    }

    const customDomain = result.rows[0];

    await this.pool.query(
      `UPDATE custom_domains SET ssl_status = 'issuing', updated_at = NOW()
       WHERE id = $1`,
      [domainId]
    );

    try {
      const [key, csr] = await acme.crypto.createCsr({
        commonName: customDomain.domain,
        altNames: [`*.${customDomain.domain}`]
      });

      const cert = await this.acmeClient.auto({
        csr,
        email: 'ssl@upcoach.com',
        termsOfServiceAgreed: true,
        challengePriority: ['dns-01'],
        challengeCreateFn: async (authz, challenge, keyAuthorization) => {
          if (challenge.type === 'dns-01') {
            const dnsRecord = `_acme-challenge.${authz.identifier.value}`;

            await this.route53.changeResourceRecordSets({
              HostedZoneId: this.hostedZoneId,
              ChangeBatch: {
                Changes: [
                  {
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                      Name: dnsRecord,
                      Type: 'TXT',
                      TTL: 60,
                      ResourceRecords: [{ Value: `"${keyAuthorization}"` }]
                    }
                  }
                ]
              }
            }).promise();

            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        },
        challengeRemoveFn: async (authz, challenge) => {
          if (challenge.type === 'dns-01') {
            const dnsRecord = `_acme-challenge.${authz.identifier.value}`;

            await this.route53.changeResourceRecordSets({
              HostedZoneId: this.hostedZoneId,
              ChangeBatch: {
                Changes: [
                  {
                    Action: 'DELETE',
                    ResourceRecordSet: {
                      Name: dnsRecord,
                      Type: 'TXT',
                      TTL: 60,
                      ResourceRecords: [{ Value: `"${challenge.token}"` }]
                    }
                  }
                ]
              }
            }).promise().catch(() => {});
          }
        }
      });

      const certificateArn = await this.uploadCertificateToACM(
        customDomain.domain,
        cert.toString(),
        key.toString()
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await this.pool.query(
        `UPDATE custom_domains SET
         ssl_status = 'active',
         ssl_certificate_arn = $1,
         ssl_expires_at = $2,
         verified = true,
         updated_at = NOW()
         WHERE id = $3`,
        [certificateArn, expiresAt, domainId]
      );

      this.emit('ssl:certificate_issued', {
        domainId,
        domain: customDomain.domain,
        certificateArn
      });
    } catch (error) {
      await this.pool.query(
        `UPDATE custom_domains SET ssl_status = 'failed', updated_at = NOW()
         WHERE id = $1`,
        [domainId]
      );

      console.error('Failed to issue SSL certificate:', error);
      throw error;
    }
  }

  private async uploadCertificateToACM(
    domain: string,
    certificate: string,
    privateKey: string
  ): Promise<string> {
    const response = await this.acm.importCertificate({
      Certificate: certificate,
      PrivateKey: privateKey,
      Tags: [
        { Key: 'Domain', Value: domain },
        { Key: 'ManagedBy', Value: 'UpCoach-WhiteLabel' }
      ]
    }).promise();

    return response.CertificateArn!;
  }

  async renewExpiringCertificates(): Promise<void> {
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);

    const result = await this.pool.query(
      `SELECT * FROM custom_domains
       WHERE ssl_status = 'active'
       AND ssl_expires_at <= $1
       AND ssl_expires_at IS NOT NULL`,
      [expiringDate]
    );

    for (const domain of result.rows) {
      try {
        await this.pool.query(
          `UPDATE custom_domains SET ssl_status = 'renewing', updated_at = NOW()
           WHERE id = $1`,
          [domain.id]
        );

        await this.issueSslCertificate(domain.id);

        this.emit('ssl:certificate_renewed', {
          domainId: domain.id,
          domain: domain.domain
        });
      } catch (error) {
        console.error(`Failed to renew certificate for ${domain.domain}:`, error);
        this.emit('ssl:renewal_failed', {
          domainId: domain.id,
          domain: domain.domain,
          error
        });
      }
    }
  }

  async uploadBrandAsset(
    tenantId: string,
    file: Buffer,
    filename: string,
    type: 'logo' | 'favicon' | 'app_icon' | 'splash_screen'
  ): Promise<string> {
    const ext = filename.split('.').pop();
    const key = `branding/${tenantId}/${type}-${Date.now()}.${ext}`;

    await this.s3.putObject({
      Bucket: 'upcoach-brand-assets',
      Key: key,
      Body: file,
      ContentType: this.getContentType(ext || ''),
      ACL: 'public-read',
      CacheControl: 'max-age=31536000'
    }).promise();

    const url = `https://upcoach-brand-assets.s3.amazonaws.com/${key}`;

    this.emit('brand:asset_uploaded', { tenantId, type, url });

    return url;
  }

  private getContentType(ext: string): string {
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };

    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async updateBrandConfiguration(
    tenantId: string,
    config: Partial<BrandConfiguration>
  ): Promise<void> {
    const existing = await this.pool.query(
      'SELECT configuration FROM brand_configurations WHERE tenant_id = $1',
      [tenantId]
    );

    const currentConfig = existing.rows.length > 0
      ? JSON.parse(existing.rows[0].configuration)
      : this.getDefaultBrandConfiguration();

    const updatedConfig = {
      ...currentConfig,
      ...config,
      colors: {
        ...currentConfig.colors,
        ...(config.colors || {})
      },
      typography: {
        ...currentConfig.typography,
        ...(config.typography || {})
      }
    };

    if (existing.rows.length > 0) {
      await this.pool.query(
        `UPDATE brand_configurations SET configuration = $1, updated_at = NOW()
         WHERE tenant_id = $2`,
        [JSON.stringify(updatedConfig), tenantId]
      );
    } else {
      await this.pool.query(
        `INSERT INTO brand_configurations (id, tenant_id, configuration, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [crypto.randomUUID(), tenantId, JSON.stringify(updatedConfig)]
      );
    }

    await this.redis.setex(
      `tenant:${tenantId}:brand_config`,
      3600,
      JSON.stringify(updatedConfig)
    );

    this.emit('brand:configuration_updated', { tenantId, config: updatedConfig });
  }

  private getDefaultBrandConfiguration(): BrandConfiguration {
    return {
      tenantId: '',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        accent: '#9c27b0',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#666666',
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        info: '#2196f3'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '2rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      }
    };
  }

  async getBrandConfiguration(tenantId: string): Promise<BrandConfiguration> {
    const cached = await this.redis.get(`tenant:${tenantId}:brand_config`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.pool.query(
      'SELECT configuration FROM brand_configurations WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return this.getDefaultBrandConfiguration();
    }

    const config = JSON.parse(result.rows[0].configuration);

    await this.redis.setex(
      `tenant:${tenantId}:brand_config`,
      3600,
      JSON.stringify(config)
    );

    return config;
  }

  async updateUITheme(tenantId: string, theme: Partial<UITheme['theme']>): Promise<void> {
    const brandConfig = await this.getBrandConfiguration(tenantId);

    const uiTheme: UITheme = {
      tenantId,
      name: 'custom',
      theme: {
        palette: {
          mode: theme.palette?.mode || 'light',
          primary: {
            main: brandConfig.colors.primary,
            light: this.lightenColor(brandConfig.colors.primary, 20),
            dark: this.darkenColor(brandConfig.colors.primary, 20),
            contrastText: '#ffffff'
          },
          secondary: {
            main: brandConfig.colors.secondary,
            light: this.lightenColor(brandConfig.colors.secondary, 20),
            dark: this.darkenColor(brandConfig.colors.secondary, 20),
            contrastText: '#ffffff'
          },
          error: {
            main: brandConfig.colors.error,
            light: this.lightenColor(brandConfig.colors.error, 20),
            dark: this.darkenColor(brandConfig.colors.error, 20)
          },
          warning: {
            main: brandConfig.colors.warning
          },
          info: {
            main: brandConfig.colors.info
          },
          success: {
            main: brandConfig.colors.success
          },
          background: {
            default: brandConfig.colors.background,
            paper: brandConfig.colors.surface
          },
          text: {
            primary: brandConfig.colors.text,
            secondary: brandConfig.colors.textSecondary,
            disabled: '#999999'
          }
        },
        typography: {
          fontFamily: brandConfig.typography.fontFamily,
          fontSize: 14,
          h1: { fontSize: '2.5rem', fontWeight: 700 },
          h2: { fontSize: '2rem', fontWeight: 700 },
          h3: { fontSize: '1.75rem', fontWeight: 600 },
          h4: { fontSize: '1.5rem', fontWeight: 600 },
          h5: { fontSize: '1.25rem', fontWeight: 600 },
          h6: { fontSize: '1rem', fontWeight: 600 },
          body1: { fontSize: '1rem', fontWeight: 400 },
          body2: { fontSize: '0.875rem', fontWeight: 400 },
          button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' as any }
        },
        shape: {
          borderRadius: theme.shape?.borderRadius || 8
        },
        spacing: theme.spacing || 8,
        components: theme.components || {}
      }
    };

    await this.pool.query(
      `INSERT INTO ui_themes (id, tenant_id, name, theme, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         theme = $4, updated_at = NOW()`,
      [crypto.randomUUID(), tenantId, uiTheme.name, JSON.stringify(uiTheme.theme)]
    );

    await this.redis.setex(
      `tenant:${tenantId}:ui_theme`,
      3600,
      JSON.stringify(uiTheme)
    );

    this.emit('ui_theme:updated', { tenantId, theme: uiTheme });
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, ((num >> 16) & 0xff) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, ((num >> 16) & 0xff) - amt);
    const G = Math.max(0, ((num >> 8) & 0xff) - amt);
    const B = Math.max(0, (num & 0xff) - amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  async updateEmailConfiguration(
    tenantId: string,
    config: Partial<EmailConfiguration>
  ): Promise<void> {
    const existing = await this.pool.query(
      'SELECT * FROM email_configurations WHERE tenant_id = $1',
      [tenantId]
    );

    const currentConfig = existing.rows.length > 0
      ? {
          ...existing.rows[0],
          templates: JSON.parse(existing.rows[0].templates || '{}'),
          smtpConfig: existing.rows[0].smtp_config ? JSON.parse(existing.rows[0].smtp_config) : undefined,
          dkimConfig: existing.rows[0].dkim_config ? JSON.parse(existing.rows[0].dkim_config) : undefined
        }
      : {};

    const updatedConfig = {
      ...currentConfig,
      ...config
    };

    if (existing.rows.length > 0) {
      await this.pool.query(
        `UPDATE email_configurations SET
         from_address = $1,
         from_name = $2,
         reply_to_address = $3,
         smtp_config = $4,
         templates = $5,
         dkim_config = $6,
         spf_record = $7,
         dmarc_policy = $8,
         updated_at = NOW()
         WHERE tenant_id = $9`,
        [
          updatedConfig.fromAddress,
          updatedConfig.fromName,
          updatedConfig.replyToAddress,
          updatedConfig.smtpConfig ? JSON.stringify(updatedConfig.smtpConfig) : null,
          JSON.stringify(updatedConfig.templates || {}),
          updatedConfig.dkimConfig ? JSON.stringify(updatedConfig.dkimConfig) : null,
          updatedConfig.spfRecord,
          updatedConfig.dmarcPolicy,
          tenantId
        ]
      );
    } else {
      await this.pool.query(
        `INSERT INTO email_configurations
         (id, tenant_id, from_address, from_name, reply_to_address, smtp_config,
          templates, dkim_config, spf_record, dmarc_policy, verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          updatedConfig.fromAddress,
          updatedConfig.fromName,
          updatedConfig.replyToAddress,
          updatedConfig.smtpConfig ? JSON.stringify(updatedConfig.smtpConfig) : null,
          JSON.stringify(updatedConfig.templates || {}),
          updatedConfig.dkimConfig ? JSON.stringify(updatedConfig.dkimConfig) : null,
          updatedConfig.spfRecord,
          updatedConfig.dmarcPolicy
        ]
      );
    }

    await this.redis.del(`tenant:${tenantId}:email_config`);

    this.emit('email:configuration_updated', { tenantId, config: updatedConfig });
  }

  async sendBrandedEmail(
    tenantId: string,
    to: string,
    templateName: string,
    data: Record<string, any>
  ): Promise<void> {
    const emailConfig = await this.getEmailConfiguration(tenantId);
    const brandConfig = await this.getBrandConfiguration(tenantId);

    if (!emailConfig.templates[templateName]) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const template = emailConfig.templates[templateName];

    const compiledSubject = Handlebars.compile(template.subject);
    const compiledHtml = Handlebars.compile(template.htmlTemplate);
    const compiledText = template.textTemplate
      ? Handlebars.compile(template.textTemplate)
      : null;

    const templateData = {
      ...data,
      brandName: brandConfig.tenantId,
      primaryColor: brandConfig.colors.primary,
      logoUrl: brandConfig.logo?.url
    };

    const subject = compiledSubject(templateData);
    const html = compiledHtml(templateData);
    const text = compiledText ? compiledText(templateData) : undefined;

    let transporter: nodemailer.Transporter;

    if (emailConfig.smtpConfig) {
      transporter = nodemailer.createTransport(emailConfig.smtpConfig);
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SMTP_PASS || ''
        }
      });
    }

    await transporter.sendMail({
      from: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
      to,
      replyTo: emailConfig.replyToAddress,
      subject,
      html,
      text
    });

    this.emit('email:sent', { tenantId, to, templateName });
  }

  private async getEmailConfiguration(tenantId: string): Promise<EmailConfiguration> {
    const cached = await this.redis.get(`tenant:${tenantId}:email_config`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.pool.query(
      'SELECT * FROM email_configurations WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Email configuration not found');
    }

    const row = result.rows[0];
    const config: EmailConfiguration = {
      tenantId: row.tenant_id,
      fromAddress: row.from_address,
      fromName: row.from_name,
      replyToAddress: row.reply_to_address,
      smtpConfig: row.smtp_config ? JSON.parse(row.smtp_config) : undefined,
      templates: JSON.parse(row.templates || '{}'),
      dkimConfig: row.dkim_config ? JSON.parse(row.dkim_config) : undefined,
      spfRecord: row.spf_record,
      dmarcPolicy: row.dmarc_policy,
      verified: row.verified
    };

    await this.redis.setex(
      `tenant:${tenantId}:email_config`,
      3600,
      JSON.stringify(config)
    );

    return config;
  }

  async updateCustomTerminology(
    tenantId: string,
    terms: Record<string, string>
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO custom_terminology (id, tenant_id, terms, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         terms = $3, updated_at = NOW()`,
      [crypto.randomUUID(), tenantId, JSON.stringify(terms)]
    );

    await this.redis.setex(
      `tenant:${tenantId}:terminology`,
      3600,
      JSON.stringify(terms)
    );

    this.emit('terminology:updated', { tenantId, terms });
  }

  async updateCustomNavigation(
    tenantId: string,
    menuItems: CustomNavigation['menuItems']
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO custom_navigation (id, tenant_id, menu_items, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         menu_items = $3, updated_at = NOW()`,
      [crypto.randomUUID(), tenantId, JSON.stringify(menuItems)]
    );

    await this.redis.setex(
      `tenant:${tenantId}:navigation`,
      3600,
      JSON.stringify(menuItems)
    );

    this.emit('navigation:updated', { tenantId, menuItems });
  }

  async updateMobileAppBranding(
    tenantId: string,
    branding: Partial<MobileAppBranding>
  ): Promise<void> {
    const existing = await this.pool.query(
      'SELECT * FROM mobile_app_branding WHERE tenant_id = $1',
      [tenantId]
    );

    const currentBranding = existing.rows.length > 0
      ? JSON.parse(existing.rows[0].branding)
      : {};

    const updatedBranding = {
      ...currentBranding,
      ...branding
    };

    if (existing.rows.length > 0) {
      await this.pool.query(
        `UPDATE mobile_app_branding SET branding = $1, updated_at = NOW()
         WHERE tenant_id = $2`,
        [JSON.stringify(updatedBranding), tenantId]
      );
    } else {
      await this.pool.query(
        `INSERT INTO mobile_app_branding (id, tenant_id, branding, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [crypto.randomUUID(), tenantId, JSON.stringify(updatedBranding)]
      );
    }

    await this.redis.setex(
      `tenant:${tenantId}:mobile_branding`,
      3600,
      JSON.stringify(updatedBranding)
    );

    this.emit('mobile:branding_updated', { tenantId, branding: updatedBranding });
  }

  async updateLegalDocuments(
    tenantId: string,
    documents: Partial<LegalDocuments>
  ): Promise<void> {
    const existing = await this.pool.query(
      'SELECT * FROM legal_documents WHERE tenant_id = $1',
      [tenantId]
    );

    const currentDocs = existing.rows.length > 0
      ? JSON.parse(existing.rows[0].documents)
      : {};

    const updatedDocs = {
      ...currentDocs,
      ...documents
    };

    if (existing.rows.length > 0) {
      await this.pool.query(
        `UPDATE legal_documents SET documents = $1, updated_at = NOW()
         WHERE tenant_id = $2`,
        [JSON.stringify(updatedDocs), tenantId]
      );
    } else {
      await this.pool.query(
        `INSERT INTO legal_documents (id, tenant_id, documents, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [crypto.randomUUID(), tenantId, JSON.stringify(updatedDocs)]
      );
    }

    await this.redis.del(`tenant:${tenantId}:legal_docs`);

    this.emit('legal:documents_updated', { tenantId, documents: updatedDocs });
  }

  async close(): Promise<void> {
    await this.pool.end();
    await this.redis.quit();
  }
}
