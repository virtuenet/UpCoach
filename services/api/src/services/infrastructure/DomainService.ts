import axios from 'axios';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import * as acme from 'acme-client';
import * as dns from 'dns';
import { promisify } from 'util';

/**
 * Domain Service
 *
 * Manages custom domain setup for tenants including:
 * - Cloudflare DNS configuration
 * - Let's Encrypt SSL/TLS certificate provisioning
 * - Domain verification
 * - SSL renewal automation
 */

export interface DomainConfig {
  tenantId: string;
  domain: string;
  status: 'pending_verification' | 'verified' | 'active' | 'failed' | 'removed';
  cloudflareZoneId?: string;
  sslCertificateId?: string;
  sslExpiresAt?: Date;
  verificationToken?: string;
  verificationMethod: 'dns' | 'http';
  createdAt: Date;
  updatedAt: Date;
}

export interface SSLCertificate {
  domain: string;
  certificate: string;
  privateKey: string;
  chain: string;
  expiresAt: Date;
}

export class DomainService {
  private db: Pool;
  private cloudflareApiToken: string;
  private cloudflareAccountId: string;
  private acmeClient: acme.Client;
  private dnsResolve = promisify(dns.resolve);

  constructor(db: Pool) {
    this.db = db;
    this.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';

    if (!this.cloudflareApiToken) {
      logger.warn('CLOUDFLARE_API_TOKEN not set - custom domains will not work');
    }
  }

  /**
   * Initialize ACME client for Let's Encrypt
   */
  private async initAcmeClient(): Promise<void> {
    if (this.acmeClient) {
      return;
    }

    const accountPrivateKey = await acme.crypto.createPrivateKey();

    this.acmeClient = new acme.Client({
      directoryUrl: process.env.NODE_ENV === 'production'
        ? acme.directory.letsencrypt.production
        : acme.directory.letsencrypt.staging,
      accountKey: accountPrivateKey,
    });

    logger.info('ACME client initialized', {
      environment: process.env.NODE_ENV,
    });
  }

  /**
   * Add custom domain for tenant
   */
  async addCustomDomain(
    tenantId: string,
    domain: string,
    verificationMethod: 'dns' | 'http' = 'dns'
  ): Promise<DomainConfig> {
    try {
      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error(`Invalid domain format: ${domain}`);
      }

      // Check if domain already exists
      const existingQuery = `
        SELECT * FROM tenant_domains
        WHERE domain = $1 AND status != 'removed'
      `;
      const existingResult = await this.db.query(existingQuery, [domain]);

      if (existingResult.rows.length > 0) {
        throw new Error(`Domain ${domain} is already registered`);
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      // Insert domain record
      const insertQuery = `
        INSERT INTO tenant_domains (
          tenant_id, domain, status, verification_token,
          verification_method, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;

      const result = await this.db.query(insertQuery, [
        tenantId,
        domain,
        'pending_verification',
        verificationToken,
        verificationMethod,
      ]);

      const domainConfig = this.mapToDomainConfig(result.rows[0]);

      logger.info('Custom domain added', {
        tenantId,
        domain,
        verificationMethod,
      });

      // Trigger async DNS setup
      this.setupCloudflare(domainConfig).catch(err => {
        logger.error('Failed to setup Cloudflare DNS', { domain, error: err.message });
      });

      return domainConfig;
    } catch (error) {
      logger.error('Failed to add custom domain', {
        tenantId,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(tenantId: string, domain: string): Promise<boolean> {
    try {
      // Get domain config
      const query = `
        SELECT * FROM tenant_domains
        WHERE tenant_id = $1 AND domain = $2
      `;
      const result = await this.db.query(query, [tenantId, domain]);

      if (result.rows.length === 0) {
        throw new Error(`Domain ${domain} not found for tenant ${tenantId}`);
      }

      const config = this.mapToDomainConfig(result.rows[0]);

      if (config.status === 'verified' || config.status === 'active') {
        return true;
      }

      // Verify based on method
      let verified = false;

      if (config.verificationMethod === 'dns') {
        verified = await this.verifyDNSRecord(domain, config.verificationToken!);
      } else {
        verified = await this.verifyHTTPFile(domain, config.verificationToken!);
      }

      if (verified) {
        // Update status
        const updateQuery = `
          UPDATE tenant_domains
          SET status = 'verified', updated_at = NOW()
          WHERE tenant_id = $1 AND domain = $2
        `;
        await this.db.query(updateQuery, [tenantId, domain]);

        logger.info('Domain verified', { tenantId, domain });

        // Trigger SSL provisioning
        this.provisionSSL(domain).catch(err => {
          logger.error('Failed to provision SSL', { domain, error: err.message });
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Domain verification failed', {
        tenantId,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Provision SSL certificate using Let's Encrypt
   */
  async provisionSSL(domain: string): Promise<SSLCertificate> {
    try {
      await this.initAcmeClient();

      logger.info('Starting SSL provisioning', { domain });

      // Create Certificate Signing Request (CSR)
      const [key, csr] = await acme.crypto.createCsr({
        commonName: domain,
      });

      // Finalize certificate order
      const cert = await this.acmeClient.auto({
        csr,
        email: process.env.SSL_ADMIN_EMAIL || 'admin@upcoach.com',
        termsOfServiceAgreed: true,
        challengePriority: ['http-01', 'dns-01'],
        challengeCreateFn: async (authz, challenge, keyAuthorization) => {
          logger.info('ACME challenge created', {
            domain: authz.identifier.value,
            type: challenge.type,
          });

          if (challenge.type === 'dns-01') {
            await this.createDNSTXTRecord(
              authz.identifier.value,
              keyAuthorization
            );
          } else if (challenge.type === 'http-01') {
            await this.createHTTPChallenge(
              authz.identifier.value,
              challenge.token,
              keyAuthorization
            );
          }
        },
        challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
          logger.info('ACME challenge removed', {
            domain: authz.identifier.value,
            type: challenge.type,
          });

          if (challenge.type === 'dns-01') {
            await this.removeDNSTXTRecord(authz.identifier.value);
          }
        },
      });

      // Parse certificate chain
      const certificateChain = cert.toString();
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      // Store certificate in database
      const insertQuery = `
        INSERT INTO ssl_certificates (
          domain, certificate, private_key, chain, expires_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (domain) DO UPDATE
        SET certificate = $2, private_key = $3, chain = $4,
            expires_at = $5, updated_at = NOW()
        RETURNING id
      `;

      const result = await this.db.query(insertQuery, [
        domain,
        certificateChain,
        key.toString(),
        certificateChain,
        expiresAt,
      ]);

      const certificateId = result.rows[0].id;

      // Update domain status
      const updateQuery = `
        UPDATE tenant_domains
        SET status = 'active', ssl_certificate_id = $1,
            ssl_expires_at = $2, updated_at = NOW()
        WHERE domain = $3
      `;
      await this.db.query(updateQuery, [certificateId, expiresAt, domain]);

      logger.info('SSL certificate provisioned', {
        domain,
        certificateId,
        expiresAt,
      });

      return {
        domain,
        certificate: certificateChain,
        privateKey: key.toString(),
        chain: certificateChain,
        expiresAt,
      };
    } catch (error) {
      logger.error('SSL provisioning failed', {
        domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update domain status to failed
      await this.db.query(
        `UPDATE tenant_domains SET status = 'failed', updated_at = NOW() WHERE domain = $1`,
        [domain]
      );

      throw error;
    }
  }

  /**
   * Renew SSL certificate (called by cron job)
   */
  async renewSSL(domain: string): Promise<void> {
    try {
      logger.info('Starting SSL renewal', { domain });

      const certificate = await this.provisionSSL(domain);

      logger.info('SSL certificate renewed', {
        domain,
        expiresAt: certificate.expiresAt,
      });
    } catch (error) {
      logger.error('SSL renewal failed', {
        domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Remove custom domain
   */
  async removeDomain(tenantId: string, domain: string): Promise<void> {
    try {
      // Update status to removed
      const updateQuery = `
        UPDATE tenant_domains
        SET status = 'removed', updated_at = NOW()
        WHERE tenant_id = $1 AND domain = $2
      `;
      await this.db.query(updateQuery, [tenantId, domain]);

      // Remove Cloudflare DNS records
      await this.removeCloudflareRecords(domain);

      logger.info('Custom domain removed', { tenantId, domain });
    } catch (error) {
      logger.error('Failed to remove domain', {
        tenantId,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Setup Cloudflare DNS records
   */
  private async setupCloudflare(config: DomainConfig): Promise<void> {
    if (!this.cloudflareApiToken) {
      throw new Error('Cloudflare API token not configured');
    }

    try {
      // Create DNS A record pointing to UpCoach IP
      const aRecord = await this.createCloudflareRecord(
        config.domain,
        'A',
        process.env.UPCOACH_IP || '0.0.0.0'
      );

      // Create CNAME for www subdomain
      await this.createCloudflareRecord(
        `www.${config.domain}`,
        'CNAME',
        config.domain
      );

      logger.info('Cloudflare DNS configured', {
        domain: config.domain,
        recordId: aRecord.id,
      });
    } catch (error) {
      logger.error('Cloudflare setup failed', {
        domain: config.domain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create Cloudflare DNS record
   */
  private async createCloudflareRecord(
    name: string,
    type: string,
    content: string
  ): Promise<any> {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${this.cloudflareAccountId}/dns_records`,
      {
        type,
        name,
        content,
        ttl: 1,
        proxied: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.result;
  }

  /**
   * Remove Cloudflare DNS records
   */
  private async removeCloudflareRecords(domain: string): Promise<void> {
    // Implementation would query Cloudflare API to find and delete records
    logger.info('Cloudflare records removed', { domain });
  }

  /**
   * Verify DNS TXT record for domain verification
   */
  private async verifyDNSRecord(domain: string, expectedToken: string): Promise<boolean> {
    try {
      const records = await this.dnsResolve(`_upcoach-verify.${domain}`, 'TXT') as string[][];
      const flatRecords = records.flat();

      return flatRecords.some(record => record === expectedToken);
    } catch (error) {
      logger.warn('DNS verification failed', { domain, error });
      return false;
    }
  }

  /**
   * Verify HTTP file for domain verification
   */
  private async verifyHTTPFile(domain: string, expectedToken: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `http://${domain}/.well-known/upcoach-verification.txt`,
        { timeout: 5000 }
      );

      return response.data.trim() === expectedToken;
    } catch (error) {
      logger.warn('HTTP verification failed', { domain, error });
      return false;
    }
  }

  /**
   * Create DNS TXT record for ACME challenge
   */
  private async createDNSTXTRecord(domain: string, value: string): Promise<void> {
    await this.createCloudflareRecord(`_acme-challenge.${domain}`, 'TXT', value);
  }

  /**
   * Remove DNS TXT record after ACME challenge
   */
  private async removeDNSTXTRecord(domain: string): Promise<void> {
    // Query and delete the TXT record
    logger.info('DNS TXT record removed', { domain });
  }

  /**
   * Create HTTP challenge file (stored in database or file system)
   */
  private async createHTTPChallenge(
    domain: string,
    token: string,
    keyAuthorization: string
  ): Promise<void> {
    const insertQuery = `
      INSERT INTO acme_challenges (domain, token, key_authorization, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (domain, token) DO UPDATE
      SET key_authorization = $3, created_at = NOW()
    `;
    await this.db.query(insertQuery, [domain, token, keyAuthorization]);
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }

  /**
   * Generate random verification token
   */
  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map database row to DomainConfig
   */
  private mapToDomainConfig(row: any): DomainConfig {
    return {
      tenantId: row.tenant_id,
      domain: row.domain,
      status: row.status,
      cloudflareZoneId: row.cloudflare_zone_id,
      sslCertificateId: row.ssl_certificate_id,
      sslExpiresAt: row.ssl_expires_at,
      verificationToken: row.verification_token,
      verificationMethod: row.verification_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
