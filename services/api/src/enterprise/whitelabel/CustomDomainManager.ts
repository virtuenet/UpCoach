import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import * as dns from 'dns';
import { promisify } from 'util';

/**
 * Custom Domain Manager
 *
 * Manages custom domain configuration, DNS verification, and SSL/TLS certificates
 * for enterprise white-label deployments.
 *
 * Features:
 * - Domain registration and verification
 * - DNS record management
 * - SSL/TLS certificate provisioning (Let's Encrypt)
 * - Automatic certificate renewal
 * - Domain health monitoring
 * - CDN integration
 */

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);

export interface CustomDomain {
  id: string;
  tenantId: string;
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'expired';
  verificationType: 'txt' | 'cname' | 'a-record';
  verificationToken: string;
  verificationAttempts: number;
  lastVerificationAttempt?: Date;
  verifiedAt?: Date;
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed' | 'expiring';
  sslProvider: 'letsencrypt' | 'custom';
  sslCertificate?: string;
  sslPrivateKey?: string;
  sslExpiresAt?: Date;
  cdnEnabled: boolean;
  cdnProvider?: 'cloudflare' | 'cloudfront' | 'fastly';
  cdnConfiguration?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DNSRecord {
  type: 'TXT' | 'CNAME' | 'A';
  name: string;
  value: string;
  ttl: number;
}

export interface DomainVerificationResult {
  verified: boolean;
  records: DNSRecord[];
  errors: string[];
}

export interface SSLCertificate {
  certificate: string;
  privateKey: string;
  chain: string;
  expiresAt: Date;
}

export class CustomDomainManager extends EventEmitter {
  private logger: Logger;
  private domains: Map<string, CustomDomain>;
  private verificationInterval: NodeJS.Timeout | null = null;
  private renewalInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.logger = new Logger('CustomDomainManager');
    this.domains = new Map();
  }

  /**
   * Initialize the custom domain manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing custom domain manager...');

      await this.loadDomains();
      this.startVerificationLoop();
      this.startRenewalLoop();

      this.logger.info('Custom domain manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize custom domain manager', error);
      throw error;
    }
  }

  /**
   * Register a new custom domain
   */
  async registerDomain(
    tenantId: string,
    domain: string,
    verificationType: 'txt' | 'cname' | 'a-record' = 'txt'
  ): Promise<CustomDomain> {
    try {
      this.logger.info('Registering custom domain', { tenantId, domain });

      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      // Check if domain already exists
      const existing = await this.getDomainByName(domain);
      if (existing) {
        throw new Error('Domain already registered');
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      const customDomain: CustomDomain = {
        id: this.generateDomainId(),
        tenantId,
        domain,
        status: 'pending',
        verificationType,
        verificationToken,
        verificationAttempts: 0,
        sslStatus: 'pending',
        sslProvider: 'letsencrypt',
        cdnEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveDomain(customDomain);
      this.domains.set(customDomain.id, customDomain);

      this.emit('domain:registered', customDomain);
      this.logger.info('Domain registered successfully', { domainId: customDomain.id });

      return customDomain;
    } catch (error) {
      this.logger.error('Failed to register domain', { tenantId, domain, error });
      throw error;
    }
  }

  /**
   * Get verification instructions for a domain
   */
  getVerificationInstructions(domainId: string): DNSRecord | null {
    const domain = this.domains.get(domainId);

    if (!domain) {
      return null;
    }

    switch (domain.verificationType) {
      case 'txt':
        return {
          type: 'TXT',
          name: `_upcoach-verification.${domain.domain}`,
          value: domain.verificationToken,
          ttl: 3600,
        };

      case 'cname':
        return {
          type: 'CNAME',
          name: domain.domain,
          value: `verify.upcoach.io`,
          ttl: 3600,
        };

      case 'a-record':
        return {
          type: 'A',
          name: domain.domain,
          value: process.env.PRIMARY_IP || '0.0.0.0',
          ttl: 3600,
        };

      default:
        return null;
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<DomainVerificationResult> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      this.logger.info('Verifying domain', { domainId, domain: domain.domain });

      domain.status = 'verifying';
      domain.verificationAttempts++;
      domain.lastVerificationAttempt = new Date();
      domain.updatedAt = new Date();

      const result: DomainVerificationResult = {
        verified: false,
        records: [],
        errors: [],
      };

      try {
        switch (domain.verificationType) {
          case 'txt':
            result.verified = await this.verifyTxtRecord(domain);
            break;

          case 'cname':
            result.verified = await this.verifyCnameRecord(domain);
            break;

          case 'a-record':
            result.verified = await this.verifyARecord(domain);
            break;
        }

        if (result.verified) {
          domain.status = 'active';
          domain.verifiedAt = new Date();

          // Start SSL provisioning
          await this.provisionSSL(domainId);

          this.emit('domain:verified', domain);
          this.logger.info('Domain verified successfully', { domainId });
        } else {
          if (domain.verificationAttempts >= 10) {
            domain.status = 'failed';
            result.errors.push('Maximum verification attempts exceeded');
          } else {
            domain.status = 'pending';
          }
        }
      } catch (error) {
        domain.status = 'failed';
        result.errors.push((error as Error).message);
        this.logger.error('Domain verification failed', { domainId, error });
      }

      await this.saveDomain(domain);

      return result;
    } catch (error) {
      this.logger.error('Failed to verify domain', { domainId, error });
      throw error;
    }
  }

  /**
   * Provision SSL certificate for domain
   */
  async provisionSSL(domainId: string): Promise<void> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      this.logger.info('Provisioning SSL certificate', { domainId, domain: domain.domain });

      domain.sslStatus = 'provisioning';
      domain.updatedAt = new Date();

      // In production, this would use Let's Encrypt ACME protocol
      const certificate = await this.requestCertificate(domain.domain);

      domain.sslCertificate = certificate.certificate;
      domain.sslPrivateKey = certificate.privateKey;
      domain.sslExpiresAt = certificate.expiresAt;
      domain.sslStatus = 'active';

      await this.saveDomain(domain);

      // Configure web server with new certificate
      await this.configureWebServer(domain);

      this.emit('ssl:provisioned', domain);
      this.logger.info('SSL certificate provisioned successfully', { domainId });
    } catch (error) {
      const domain = this.domains.get(domainId);
      if (domain) {
        domain.sslStatus = 'failed';
        await this.saveDomain(domain);
      }

      this.logger.error('Failed to provision SSL', { domainId, error });
      throw error;
    }
  }

  /**
   * Renew SSL certificate
   */
  async renewSSL(domainId: string): Promise<void> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      this.logger.info('Renewing SSL certificate', { domainId, domain: domain.domain });

      const certificate = await this.requestCertificate(domain.domain);

      domain.sslCertificate = certificate.certificate;
      domain.sslPrivateKey = certificate.privateKey;
      domain.sslExpiresAt = certificate.expiresAt;

      await this.saveDomain(domain);
      await this.configureWebServer(domain);

      this.emit('ssl:renewed', domain);
      this.logger.info('SSL certificate renewed successfully', { domainId });
    } catch (error) {
      this.logger.error('Failed to renew SSL', { domainId, error });
      throw error;
    }
  }

  /**
   * Enable CDN for domain
   */
  async enableCDN(
    domainId: string,
    provider: 'cloudflare' | 'cloudfront' | 'fastly',
    configuration: Record<string, any>
  ): Promise<void> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      this.logger.info('Enabling CDN', { domainId, provider });

      domain.cdnEnabled = true;
      domain.cdnProvider = provider;
      domain.cdnConfiguration = configuration;
      domain.updatedAt = new Date();

      await this.saveDomain(domain);

      // Configure CDN provider
      await this.configureCDN(domain);

      this.emit('cdn:enabled', domain);
      this.logger.info('CDN enabled successfully', { domainId });
    } catch (error) {
      this.logger.error('Failed to enable CDN', { domainId, error });
      throw error;
    }
  }

  /**
   * Disable CDN for domain
   */
  async disableCDN(domainId: string): Promise<void> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      domain.cdnEnabled = false;
      domain.cdnProvider = undefined;
      domain.cdnConfiguration = undefined;
      domain.updatedAt = new Date();

      await this.saveDomain(domain);

      this.emit('cdn:disabled', domain);
      this.logger.info('CDN disabled successfully', { domainId });
    } catch (error) {
      this.logger.error('Failed to disable CDN', { domainId, error });
      throw error;
    }
  }

  /**
   * Remove domain
   */
  async removeDomain(domainId: string): Promise<void> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      this.logger.info('Removing domain', { domainId, domain: domain.domain });

      // Remove from web server configuration
      await this.removeFromWebServer(domain);

      // Delete from storage
      await this.deleteDomain(domainId);

      this.domains.delete(domainId);

      this.emit('domain:removed', domain);
      this.logger.info('Domain removed successfully', { domainId });
    } catch (error) {
      this.logger.error('Failed to remove domain', { domainId, error });
      throw error;
    }
  }

  /**
   * Get domain by ID
   */
  getDomain(domainId: string): CustomDomain | null {
    return this.domains.get(domainId) || null;
  }

  /**
   * Get domains for tenant
   */
  getDomainsForTenant(tenantId: string): CustomDomain[] {
    return Array.from(this.domains.values()).filter(d => d.tenantId === tenantId);
  }

  /**
   * Get domain health status
   */
  async getDomainHealth(domainId: string): Promise<any> {
    try {
      const domain = this.domains.get(domainId);

      if (!domain) {
        return null;
      }

      const health = {
        domainId,
        domain: domain.domain,
        status: domain.status,
        sslStatus: domain.sslStatus,
        sslExpiresIn: domain.sslExpiresAt
          ? Math.floor((domain.sslExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        cdnEnabled: domain.cdnEnabled,
        cdnProvider: domain.cdnProvider,
        lastCheck: new Date(),
      };

      return health;
    } catch (error) {
      this.logger.error('Failed to get domain health', { domainId, error });
      return null;
    }
  }

  // Private helper methods

  private async verifyTxtRecord(domain: CustomDomain): Promise<boolean> {
    try {
      const records = await resolveTxt(`_upcoach-verification.${domain.domain}`);
      const flatRecords = records.flat();

      return flatRecords.includes(domain.verificationToken);
    } catch (error) {
      return false;
    }
  }

  private async verifyCnameRecord(domain: CustomDomain): Promise<boolean> {
    try {
      const records = await resolveCname(domain.domain);
      return records.includes('verify.upcoach.io');
    } catch (error) {
      return false;
    }
  }

  private async verifyARecord(domain: CustomDomain): Promise<boolean> {
    try {
      const records = await resolve4(domain.domain);
      const expectedIp = process.env.PRIMARY_IP || '0.0.0.0';
      return records.includes(expectedIp);
    } catch (error) {
      return false;
    }
  }

  private async requestCertificate(domain: string): Promise<SSLCertificate> {
    // Mock implementation - would use ACME protocol with Let's Encrypt
    this.logger.info('Requesting SSL certificate', { domain });

    return {
      certificate: 'MOCK_CERTIFICATE',
      privateKey: 'MOCK_PRIVATE_KEY',
      chain: 'MOCK_CHAIN',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }

  private async configureWebServer(domain: CustomDomain): Promise<void> {
    // Mock implementation - would configure Nginx/Apache
    this.logger.info('Configuring web server', { domain: domain.domain });
  }

  private async removeFromWebServer(domain: CustomDomain): Promise<void> {
    // Mock implementation - would remove from Nginx/Apache
    this.logger.info('Removing from web server', { domain: domain.domain });
  }

  private async configureCDN(domain: CustomDomain): Promise<void> {
    // Mock implementation - would configure CDN provider
    this.logger.info('Configuring CDN', {
      domain: domain.domain,
      provider: domain.cdnProvider,
    });
  }

  private isValidDomain(domain: string): boolean {
    const regex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return regex.test(domain);
  }

  private generateDomainId(): string {
    return `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationToken(): string {
    return `upcoach-verify-${Math.random().toString(36).substr(2, 32)}`;
  }

  private async loadDomains(): Promise<void> {
    // Mock implementation - would load from database
    this.logger.info('Loaded domains', { count: this.domains.size });
  }

  private async saveDomain(domain: CustomDomain): Promise<void> {
    // Mock implementation - would save to database
  }

  private async deleteDomain(domainId: string): Promise<void> {
    // Mock implementation - would delete from database
  }

  private async getDomainByName(domain: string): Promise<CustomDomain | null> {
    // Mock implementation - would query database
    const found = Array.from(this.domains.values()).find(d => d.domain === domain);
    return found || null;
  }

  private startVerificationLoop(): void {
    this.verificationInterval = setInterval(async () => {
      const pendingDomains = Array.from(this.domains.values()).filter(
        d => d.status === 'pending' && d.verificationAttempts < 10
      );

      for (const domain of pendingDomains) {
        try {
          await this.verifyDomain(domain.id);
        } catch (error) {
          this.logger.error('Verification loop error', { domainId: domain.id, error });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private startRenewalLoop(): void {
    this.renewalInterval = setInterval(async () => {
      const expiringDomains = Array.from(this.domains.values()).filter(d => {
        if (!d.sslExpiresAt) return false;

        const daysUntilExpiry = Math.floor(
          (d.sslExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return daysUntilExpiry <= 30; // Renew 30 days before expiry
      });

      for (const domain of expiringDomains) {
        try {
          await this.renewSSL(domain.id);
        } catch (error) {
          this.logger.error('SSL renewal loop error', { domainId: domain.id, error });
        }
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down custom domain manager...');

    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }

    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
    }

    this.domains.clear();
    this.removeAllListeners();
  }
}

export default CustomDomainManager;
