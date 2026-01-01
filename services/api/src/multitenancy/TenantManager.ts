import { Pool, PoolClient } from 'pg';
import { Queue, Job, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import Stripe from 'stripe';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import * as AWS from 'aws-sdk';

/**
 * Enterprise Multi-Tenancy Manager
 * Handles tenant lifecycle, provisioning, billing, and management
 */

export enum IsolationStrategy {
  DATABASE_PER_TENANT = 'DATABASE_PER_TENANT',
  SCHEMA_PER_TENANT = 'SCHEMA_PER_TENANT',
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY'
}

export enum TenantStatus {
  PROVISIONING = 'PROVISIONING',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
  DELETED = 'DELETED'
}

export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export interface TenantLimits {
  maxUsers: number;
  maxStorageGB: number;
  maxApiCallsPerMonth: number;
  maxSubOrganizations: number;
  maxTeams: number;
}

export interface TenantFeatureFlags {
  advancedAnalytics: boolean;
  aiCoaching: boolean;
  whiteLabeling: boolean;
  customDomain: boolean;
  ssoIntegration: boolean;
  apiAccess: boolean;
  customReporting: boolean;
  dataExport: boolean;
  auditLogs: boolean;
  multiLanguage: boolean;
}

export interface TenantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export interface TenantConfiguration {
  features: TenantFeatureFlags;
  limits: TenantLimits;
  branding: TenantBranding;
  customTerminology?: Record<string, string>;
  integrations: {
    enabled: string[];
    config: Record<string, any>;
  };
  dataResidency: string;
  timezone: string;
  locale: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: TenantStatus;
  isolationStrategy: IsolationStrategy;
  plan: SubscriptionPlan;
  configuration: TenantConfiguration;
  adminEmail: string;
  industry: string;
  companySize: string;
  trialEndsAt?: Date;
  subscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  metadata: Record<string, any>;
}

export interface TenantOnboardingState {
  tenantId: string;
  currentStep: number;
  completedSteps: number[];
  data: {
    basicInfo?: {
      name: string;
      subdomain: string;
      adminEmail: string;
      industry: string;
      companySize: string;
    };
    configuration?: TenantConfiguration;
    dataMigration?: {
      source: 'csv' | 'api' | 'manual';
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      recordsImported: number;
    };
    userSetup?: {
      invitedAdmins: string[];
      rolesConfigured: boolean;
    };
  };
}

export interface TenantMetrics {
  tenantId: string;
  date: Date;
  dau: number;
  mau: number;
  activeUsers: number;
  totalUsers: number;
  apiCalls: number;
  storageUsedGB: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  featuresUsed: string[];
  healthScore: number;
}

export interface TenantUsageRecord {
  tenantId: string;
  month: string;
  usersCount: number;
  storageGB: number;
  apiCalls: number;
  overageCharges: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  totalAmount: number;
}

export interface ImpersonationSession {
  id: string;
  adminId: string;
  adminEmail: string;
  tenantId: string;
  startedAt: Date;
  expiresAt: Date;
  endedAt?: Date;
  reason: string;
  actionsPerformed: string[];
}

const PLAN_CONFIGS: Record<SubscriptionPlan, {
  price: number;
  limits: TenantLimits;
  features: TenantFeatureFlags;
}> = {
  [SubscriptionPlan.STARTER]: {
    price: 99,
    limits: {
      maxUsers: 10,
      maxStorageGB: 10,
      maxApiCallsPerMonth: 10000,
      maxSubOrganizations: 0,
      maxTeams: 3
    },
    features: {
      advancedAnalytics: false,
      aiCoaching: false,
      whiteLabeling: false,
      customDomain: false,
      ssoIntegration: false,
      apiAccess: true,
      customReporting: false,
      dataExport: true,
      auditLogs: false,
      multiLanguage: false
    }
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 299,
    limits: {
      maxUsers: 100,
      maxStorageGB: 100,
      maxApiCallsPerMonth: 100000,
      maxSubOrganizations: 5,
      maxTeams: 20
    },
    features: {
      advancedAnalytics: true,
      aiCoaching: true,
      whiteLabeling: true,
      customDomain: true,
      ssoIntegration: true,
      apiAccess: true,
      customReporting: true,
      dataExport: true,
      auditLogs: true,
      multiLanguage: false
    }
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 999,
    limits: {
      maxUsers: 10000,
      maxStorageGB: 10000,
      maxApiCallsPerMonth: 10000000,
      maxSubOrganizations: 50,
      maxTeams: 200
    },
    features: {
      advancedAnalytics: true,
      aiCoaching: true,
      whiteLabeling: true,
      customDomain: true,
      ssoIntegration: true,
      apiAccess: true,
      customReporting: true,
      dataExport: true,
      auditLogs: true,
      multiLanguage: true
    }
  }
};

export class TenantManager extends EventEmitter {
  private masterPool: Pool;
  private tenantPools: Map<string, Pool> = new Map();
  private redis: IORedis;
  private provisioningQueue: Queue;
  private queueScheduler: QueueScheduler;
  private stripe: Stripe;
  private s3: AWS.S3;
  private kms: AWS.KMS;
  private rds: AWS.RDS;

  constructor(
    masterDbConfig: any,
    redisConfig: any,
    stripeApiKey: string,
    awsConfig: any
  ) {
    super();

    this.masterPool = new Pool({
      ...masterDbConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.redis = new IORedis(redisConfig);

    this.queueScheduler = new QueueScheduler('tenant-provisioning', {
      connection: redisConfig
    });

    this.provisioningQueue = new Queue('tenant-provisioning', {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    });

    this.stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16',
      typescript: true
    });

    AWS.config.update(awsConfig);
    this.s3 = new AWS.S3();
    this.kms = new AWS.KMS();
    this.rds = new AWS.RDS();

    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    this.provisioningQueue.process(async (job: Job) => {
      const { tenantId, isolationStrategy } = job.data;

      try {
        await job.updateProgress(10);

        switch (isolationStrategy) {
          case IsolationStrategy.DATABASE_PER_TENANT:
            await this.provisionDatabasePerTenant(tenantId, job);
            break;
          case IsolationStrategy.SCHEMA_PER_TENANT:
            await this.provisionSchemaPerTenant(tenantId, job);
            break;
          case IsolationStrategy.ROW_LEVEL_SECURITY:
            await this.provisionRowLevelSecurity(tenantId, job);
            break;
        }

        await job.updateProgress(90);
        await this.updateTenantStatus(tenantId, TenantStatus.TRIAL);
        await job.updateProgress(100);

        this.emit('tenant:provisioned', { tenantId });

        return { success: true, tenantId };
      } catch (error) {
        this.emit('tenant:provisioning_failed', { tenantId, error });
        throw error;
      }
    });
  }

  async createTenant(data: {
    name: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    industry: string;
    companySize: string;
    plan: SubscriptionPlan;
    isolationStrategy: IsolationStrategy;
  }): Promise<Tenant> {
    const client = await this.masterPool.connect();

    try {
      await client.query('BEGIN');

      const subdomainExists = await this.checkSubdomainAvailability(data.subdomain);
      if (!subdomainExists) {
        throw new Error(`Subdomain ${data.subdomain} is already taken`);
      }

      const tenantId = crypto.randomUUID();
      const planConfig = PLAN_CONFIGS[data.plan];

      const stripeCustomer = await this.stripe.customers.create({
        email: data.adminEmail,
        name: data.name,
        metadata: {
          tenantId,
          subdomain: data.subdomain
        }
      });

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const configuration: TenantConfiguration = {
        features: planConfig.features,
        limits: planConfig.limits,
        branding: {},
        integrations: {
          enabled: [],
          config: {}
        },
        dataResidency: 'us-east-1',
        timezone: 'America/New_York',
        locale: 'en-US'
      };

      const insertQuery = `
        INSERT INTO tenants (
          id, name, subdomain, status, isolation_strategy, plan,
          configuration, admin_email, industry, company_size,
          trial_ends_at, stripe_customer_id, created_at, updated_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        tenantId,
        data.name,
        data.subdomain,
        TenantStatus.PROVISIONING,
        data.isolationStrategy,
        data.plan,
        JSON.stringify(configuration),
        data.adminEmail,
        data.industry,
        data.companySize,
        trialEndsAt,
        stripeCustomer.id,
        JSON.stringify({})
      ]);

      await this.createTenantAdmin(client, tenantId, data.adminEmail, data.adminPassword);

      await this.provisioningQueue.add('provision-tenant', {
        tenantId,
        isolationStrategy: data.isolationStrategy,
        subdomain: data.subdomain
      });

      await client.query('COMMIT');

      const tenant = this.mapRowToTenant(result.rows[0]);

      this.emit('tenant:created', { tenant });

      return tenant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async createTenantAdmin(
    client: PoolClient,
    tenantId: string,
    email: string,
    password: string
  ): Promise<void> {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12);

    const adminQuery = `
      INSERT INTO users (
        id, tenant_id, email, password_hash, role,
        first_name, last_name, is_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
    `;

    await client.query(adminQuery, [
      crypto.randomUUID(),
      tenantId,
      email,
      hashedPassword,
      'TENANT_ADMIN',
      'Admin',
      'User'
    ]);
  }

  private async provisionDatabasePerTenant(tenantId: string, job: Job): Promise<void> {
    await job.updateProgress(20);

    const dbInstanceIdentifier = `upcoach-tenant-${tenantId.substring(0, 8)}`;

    const dbInstance = await this.rds.createDBInstance({
      DBInstanceIdentifier: dbInstanceIdentifier,
      DBInstanceClass: 'db.t3.micro',
      Engine: 'postgres',
      EngineVersion: '15.3',
      MasterUsername: 'tenant_admin',
      MasterUserPassword: crypto.randomBytes(32).toString('hex'),
      AllocatedStorage: 20,
      StorageType: 'gp3',
      StorageEncrypted: true,
      BackupRetentionPeriod: 7,
      MultiAZ: false,
      PubliclyAccessible: false,
      Tags: [
        { Key: 'TenantId', Value: tenantId },
        { Key: 'Environment', Value: 'production' }
      ]
    }).promise();

    await job.updateProgress(40);

    await this.waitForDatabaseAvailable(dbInstanceIdentifier, job, 40, 70);

    const endpoint = dbInstance.DBInstance?.Endpoint?.Address;
    const port = dbInstance.DBInstance?.Endpoint?.Port || 5432;

    await job.updateProgress(70);

    const pool = new Pool({
      host: endpoint,
      port,
      database: 'postgres',
      user: 'tenant_admin',
      password: dbInstance.DBInstance?.MasterUserPassword,
      max: 10
    });

    await this.runMigrations(pool);

    await job.updateProgress(80);

    this.tenantPools.set(tenantId, pool);

    await this.storeTenantDatabaseConfig(tenantId, {
      dbInstanceIdentifier,
      endpoint,
      port
    });
  }

  private async provisionSchemaPerTenant(tenantId: string, job: Job): Promise<void> {
    await job.updateProgress(30);

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const client = await this.masterPool.connect();

    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      await job.updateProgress(50);

      await client.query(`SET search_path TO ${schemaName}`);

      await this.runMigrations(this.masterPool, schemaName);

      await job.updateProgress(70);

      const roleName = `tenant_role_${tenantId.substring(0, 8)}`;
      await client.query(`CREATE ROLE ${roleName} WITH LOGIN PASSWORD '${crypto.randomBytes(16).toString('hex')}'`);
      await client.query(`GRANT USAGE ON SCHEMA ${schemaName} TO ${roleName}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaName} TO ${roleName}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaName} TO ${roleName}`);

      await job.updateProgress(85);

      await this.storeTenantSchemaConfig(tenantId, { schemaName, roleName });
    } finally {
      client.release();
    }
  }

  private async provisionRowLevelSecurity(tenantId: string, job: Job): Promise<void> {
    await job.updateProgress(30);

    const client = await this.masterPool.connect();

    try {
      const tables = [
        'users', 'organizations', 'teams', 'goals', 'habits',
        'sessions', 'notes', 'files', 'events', 'notifications'
      ];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

        await client.query(`
          DROP POLICY IF EXISTS tenant_isolation_policy ON ${table}
        `);

        await client.query(`
          CREATE POLICY tenant_isolation_policy ON ${table}
            FOR ALL
            USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
            WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid)
        `);

        await job.updateProgress(30 + ((i + 1) / tables.length) * 60);
      }

      await this.redis.set(`tenant:${tenantId}:rls_enabled`, 'true', 'EX', 86400);
    } finally {
      client.release();
    }
  }

  private async waitForDatabaseAvailable(
    dbInstanceIdentifier: string,
    job: Job,
    startProgress: number,
    endProgress: number
  ): Promise<void> {
    const maxAttempts = 60;
    const delayMs = 10000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.rds.describeDBInstances({
        DBInstanceIdentifier: dbInstanceIdentifier
      }).promise();

      const status = response.DBInstances?.[0]?.DBInstanceStatus;

      if (status === 'available') {
        return;
      }

      const progress = startProgress + ((attempt + 1) / maxAttempts) * (endProgress - startProgress);
      await job.updateProgress(Math.floor(progress));

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Database provisioning timeout');
  }

  private async runMigrations(pool: Pool, schemaName?: string): Promise<void> {
    const client = await pool.connect();

    try {
      if (schemaName) {
        await client.query(`SET search_path TO ${schemaName}`);
      }

      const migrations = [
        `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          tenant_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(50) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          is_verified BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          UNIQUE(tenant_id, email)
        )`,
        `CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY,
          tenant_id UUID NOT NULL,
          parent_id UUID,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50),
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY,
          tenant_id UUID NOT NULL,
          organization_id UUID,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY,
          tenant_id UUID NOT NULL,
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(100),
          resource_id UUID,
          changes JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_teams_tenant ON teams(tenant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at)`
      ];

      for (const migration of migrations) {
        await client.query(migration);
      }
    } finally {
      client.release();
    }
  }

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    const result = await this.masterPool.query(
      'SELECT COUNT(*) FROM tenants WHERE subdomain = $1',
      [subdomain]
    );
    return parseInt(result.rows[0].count) === 0;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    const cached = await this.redis.get(`tenant:${tenantId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.masterPool.query(
      'SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const tenant = this.mapRowToTenant(result.rows[0]);

    await this.redis.setex(`tenant:${tenantId}`, 3600, JSON.stringify(tenant));

    return tenant;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const result = await this.masterPool.query(
      'SELECT * FROM tenants WHERE subdomain = $1 AND deleted_at IS NULL',
      [subdomain]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTenant(result.rows[0]);
  }

  async getTenantByCustomDomain(customDomain: string): Promise<Tenant | null> {
    const result = await this.masterPool.query(
      'SELECT * FROM tenants WHERE custom_domain = $1 AND deleted_at IS NULL',
      [customDomain]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTenant(result.rows[0]);
  }

  async listTenants(filters: {
    status?: TenantStatus;
    plan?: SubscriptionPlan;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.plan) {
      whereClause += ` AND plan = $${paramIndex++}`;
      params.push(filters.plan);
    }

    if (filters.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR subdomain ILIKE $${paramIndex} OR admin_email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const countResult = await this.masterPool.query(
      `SELECT COUNT(*) FROM tenants ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    const limit = filters.limit || 25;
    const offset = filters.offset || 0;

    const result = await this.masterPool.query(
      `SELECT * FROM tenants ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const tenants = result.rows.map(row => this.mapRowToTenant(row));

    return { tenants, total };
  }

  async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
    await this.masterPool.query(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, tenantId]
    );

    await this.redis.del(`tenant:${tenantId}`);

    this.emit('tenant:status_changed', { tenantId, status });
  }

  async updateTenantConfiguration(
    tenantId: string,
    configuration: Partial<TenantConfiguration>
  ): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedConfig = {
      ...tenant.configuration,
      ...configuration
    };

    await this.masterPool.query(
      'UPDATE tenants SET configuration = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedConfig), tenantId]
    );

    await this.redis.del(`tenant:${tenantId}`);

    this.emit('tenant:configuration_updated', { tenantId, configuration: updatedConfig });
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    await this.updateTenantStatus(tenantId, TenantStatus.SUSPENDED);

    await this.masterPool.query(
      `INSERT INTO tenant_suspension_logs (id, tenant_id, reason, suspended_at)
       VALUES ($1, $2, $3, NOW())`,
      [crypto.randomUUID(), tenantId, reason]
    );

    this.emit('tenant:suspended', { tenantId, reason });
  }

  async activateTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const status = tenant.trialEndsAt && new Date() < tenant.trialEndsAt
      ? TenantStatus.TRIAL
      : TenantStatus.ACTIVE;

    await this.updateTenantStatus(tenantId, status);

    this.emit('tenant:activated', { tenantId });
  }

  async cancelTenant(tenantId: string): Promise<void> {
    await this.updateTenantStatus(tenantId, TenantStatus.CANCELED);

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await this.masterPool.query(
      `UPDATE tenants SET metadata = metadata || $1 WHERE id = $2`,
      [JSON.stringify({ scheduledDeletion: deletionDate.toISOString() }), tenantId]
    );

    this.emit('tenant:canceled', { tenantId, deletionDate });
  }

  async deleteTenant(tenantId: string, hard: boolean = false): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (hard) {
      await this.hardDeleteTenant(tenantId, tenant);
    } else {
      await this.softDeleteTenant(tenantId);
    }
  }

  private async softDeleteTenant(tenantId: string): Promise<void> {
    await this.masterPool.query(
      'UPDATE tenants SET status = $1, deleted_at = NOW(), updated_at = NOW() WHERE id = $2',
      [TenantStatus.DELETED, tenantId]
    );

    await this.redis.del(`tenant:${tenantId}`);

    this.emit('tenant:soft_deleted', { tenantId });
  }

  private async hardDeleteTenant(tenantId: string, tenant: Tenant): Promise<void> {
    const client = await this.masterPool.connect();

    try {
      await client.query('BEGIN');

      if (tenant.isolationStrategy === IsolationStrategy.DATABASE_PER_TENANT) {
        const config = await this.getTenantDatabaseConfig(tenantId);
        if (config?.dbInstanceIdentifier) {
          await this.rds.deleteDBInstance({
            DBInstanceIdentifier: config.dbInstanceIdentifier,
            SkipFinalSnapshot: false,
            FinalDBSnapshotIdentifier: `${config.dbInstanceIdentifier}-final-${Date.now()}`
          }).promise();
        }
      } else if (tenant.isolationStrategy === IsolationStrategy.SCHEMA_PER_TENANT) {
        const config = await this.getTenantSchemaConfig(tenantId);
        if (config?.schemaName) {
          await client.query(`DROP SCHEMA IF EXISTS ${config.schemaName} CASCADE`);
        }
      } else {
        const tables = ['users', 'organizations', 'teams', 'goals', 'habits', 'sessions', 'notes', 'files', 'events', 'notifications'];
        for (const table of tables) {
          await client.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [tenantId]);
        }
      }

      await this.s3.deleteObjects({
        Bucket: 'upcoach-tenant-data',
        Delete: {
          Objects: [{ Key: `${tenantId}/` }]
        }
      }).promise();

      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

      await client.query('COMMIT');

      await this.redis.del(`tenant:${tenantId}`);

      this.emit('tenant:hard_deleted', { tenantId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async calculateTenantMetrics(tenantId: string, date: Date): Promise<TenantMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const pool = await this.getTenantPool(tenantId);

    const dauResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as dau
       FROM user_sessions
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfDay, endOfDay]
    );

    const mauResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as mau
       FROM user_sessions
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfMonth, endOfMonth]
    );

    const usersResult = await pool.query(
      `SELECT
         COUNT(*) as total_users,
         COUNT(CASE WHEN last_login_at >= $2 THEN 1 END) as active_users
       FROM users
       WHERE tenant_id = $1`,
      [tenantId, startOfMonth]
    );

    const apiCallsResult = await pool.query(
      `SELECT COUNT(*) as api_calls
       FROM api_logs
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfDay, endOfDay]
    );

    const storageResult = await pool.query(
      `SELECT COALESCE(SUM(file_size), 0) / (1024.0 * 1024.0 * 1024.0) as storage_gb
       FROM files
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const sessionsResult = await pool.query(
      `SELECT
         COUNT(*) as sessions,
         AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration
       FROM user_sessions
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfDay, endOfDay]
    );

    const pageViewsResult = await pool.query(
      `SELECT COUNT(*) as page_views
       FROM page_views
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfDay, endOfDay]
    );

    const featuresResult = await pool.query(
      `SELECT DISTINCT feature_name
       FROM feature_usage
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startOfDay, endOfDay]
    );

    const dau = parseInt(dauResult.rows[0]?.dau || 0);
    const mau = parseInt(mauResult.rows[0]?.mau || 0);
    const totalUsers = parseInt(usersResult.rows[0]?.total_users || 0);
    const activeUsers = parseInt(usersResult.rows[0]?.active_users || 0);
    const apiCalls = parseInt(apiCallsResult.rows[0]?.api_calls || 0);
    const storageUsedGB = parseFloat(storageResult.rows[0]?.storage_gb || 0);
    const sessions = parseInt(sessionsResult.rows[0]?.sessions || 0);
    const avgSessionDuration = parseFloat(sessionsResult.rows[0]?.avg_duration || 0);
    const pageViews = parseInt(pageViewsResult.rows[0]?.page_views || 0);
    const featuresUsed = featuresResult.rows.map(r => r.feature_name);

    const engagementScore = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const adoptionScore = featuresUsed.length * 10;
    const healthScore = Math.min(100, (engagementScore * 0.6) + (adoptionScore * 0.4));

    return {
      tenantId,
      date,
      dau,
      mau,
      activeUsers,
      totalUsers,
      apiCalls,
      storageUsedGB,
      sessions,
      pageViews,
      avgSessionDuration,
      featuresUsed,
      healthScore
    };
  }

  async recordTenantUsage(tenantId: string, month: string): Promise<TenantUsageRecord> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const pool = await this.getTenantPool(tenantId);
    const planConfig = PLAN_CONFIGS[tenant.plan];

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const usersCount = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND created_at <= $2`,
      [tenantId, endDate]
    );

    const storageGB = await pool.query(
      `SELECT COALESCE(SUM(file_size), 0) / (1024.0 * 1024.0 * 1024.0) as storage
       FROM files WHERE tenant_id = $1`,
      [tenantId]
    );

    const apiCalls = await pool.query(
      `SELECT COUNT(*) as count FROM api_logs
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [tenantId, startDate, endDate]
    );

    const actualUsers = parseInt(usersCount.rows[0].count);
    const actualStorage = parseFloat(storageGB.rows[0].storage);
    const actualApiCalls = parseInt(apiCalls.rows[0].count);

    const overageCharges = {
      users: Math.max(0, (actualUsers - planConfig.limits.maxUsers) * 10),
      storage: Math.max(0, (actualStorage - planConfig.limits.maxStorageGB) * 0.10),
      apiCalls: Math.max(0, (actualApiCalls - planConfig.limits.maxApiCallsPerMonth) * 0.01)
    };

    const totalAmount = planConfig.price +
      overageCharges.users +
      overageCharges.storage +
      overageCharges.apiCalls;

    const usageRecord: TenantUsageRecord = {
      tenantId,
      month,
      usersCount: actualUsers,
      storageGB: actualStorage,
      apiCalls: actualApiCalls,
      overageCharges,
      totalAmount
    };

    await this.masterPool.query(
      `INSERT INTO tenant_usage_records
       (id, tenant_id, month, users_count, storage_gb, api_calls, overage_charges, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (tenant_id, month) DO UPDATE SET
         users_count = $4, storage_gb = $5, api_calls = $6,
         overage_charges = $7, total_amount = $8`,
      [
        crypto.randomUUID(),
        tenantId,
        month,
        actualUsers,
        actualStorage,
        actualApiCalls,
        JSON.stringify(overageCharges),
        totalAmount
      ]
    );

    return usageRecord;
  }

  async createImpersonationSession(
    adminId: string,
    adminEmail: string,
    tenantId: string,
    reason: string
  ): Promise<ImpersonationSession> {
    const sessionId = crypto.randomUUID();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 60 * 60 * 1000);

    const session: ImpersonationSession = {
      id: sessionId,
      adminId,
      adminEmail,
      tenantId,
      startedAt,
      expiresAt,
      reason,
      actionsPerformed: []
    };

    await this.redis.setex(
      `impersonation:${sessionId}`,
      3600,
      JSON.stringify(session)
    );

    await this.masterPool.query(
      `INSERT INTO impersonation_logs
       (id, admin_id, admin_email, tenant_id, reason, started_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, adminId, adminEmail, tenantId, reason, startedAt, expiresAt]
    );

    this.emit('impersonation:started', session);

    return session;
  }

  async endImpersonationSession(sessionId: string): Promise<void> {
    const sessionData = await this.redis.get(`impersonation:${sessionId}`);
    if (!sessionData) {
      throw new Error('Impersonation session not found');
    }

    await this.masterPool.query(
      `UPDATE impersonation_logs SET ended_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    await this.redis.del(`impersonation:${sessionId}`);

    this.emit('impersonation:ended', { sessionId });
  }

  async exportTenantData(tenantId: string, format: 'json' | 'csv' | 'sql'): Promise<string> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const pool = await this.getTenantPool(tenantId);

    const tables = ['users', 'organizations', 'teams', 'goals', 'habits', 'sessions', 'notes'];
    const exportData: Record<string, any[]> = {};

    for (const table of tables) {
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE tenant_id = $1`,
        [tenantId]
      );
      exportData[table] = result.rows;
    }

    let content: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      filename = `tenant-${tenantId}-export-${Date.now()}.json`;
    } else if (format === 'csv') {
      const csvContent: string[] = [];
      for (const [table, rows] of Object.entries(exportData)) {
        csvContent.push(`\n### ${table} ###\n`);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]).join(',');
          csvContent.push(headers);
          rows.forEach(row => {
            const values = Object.values(row).map(v =>
              typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',');
            csvContent.push(values);
          });
        }
      }
      content = csvContent.join('\n');
      filename = `tenant-${tenantId}-export-${Date.now()}.csv`;
    } else {
      const sqlStatements: string[] = [];
      for (const [table, rows] of Object.entries(exportData)) {
        rows.forEach(row => {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(v =>
            v === null ? 'NULL' :
            typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
            typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'` :
            v
          ).join(', ');
          sqlStatements.push(`INSERT INTO ${table} (${columns}) VALUES (${values});`);
        });
      }
      content = sqlStatements.join('\n');
      filename = `tenant-${tenantId}-export-${Date.now()}.sql`;
    }

    await this.s3.putObject({
      Bucket: 'upcoach-tenant-exports',
      Key: filename,
      Body: content,
      ContentType: format === 'json' ? 'application/json' : 'text/plain'
    }).promise();

    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: 'upcoach-tenant-exports',
      Key: filename,
      Expires: 86400
    });

    this.emit('tenant:data_exported', { tenantId, format, filename });

    return url;
  }

  private async getTenantPool(tenantId: string): Promise<Pool> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.isolationStrategy === IsolationStrategy.DATABASE_PER_TENANT) {
      if (this.tenantPools.has(tenantId)) {
        return this.tenantPools.get(tenantId)!;
      }

      const config = await this.getTenantDatabaseConfig(tenantId);
      if (!config) {
        throw new Error('Tenant database config not found');
      }

      const pool = new Pool({
        host: config.endpoint,
        port: config.port,
        database: 'postgres',
        max: 10
      });

      this.tenantPools.set(tenantId, pool);
      return pool;
    }

    return this.masterPool;
  }

  private async storeTenantDatabaseConfig(tenantId: string, config: any): Promise<void> {
    await this.redis.setex(
      `tenant:${tenantId}:db_config`,
      86400,
      JSON.stringify(config)
    );
  }

  private async getTenantDatabaseConfig(tenantId: string): Promise<any> {
    const config = await this.redis.get(`tenant:${tenantId}:db_config`);
    return config ? JSON.parse(config) : null;
  }

  private async storeTenantSchemaConfig(tenantId: string, config: any): Promise<void> {
    await this.redis.setex(
      `tenant:${tenantId}:schema_config`,
      86400,
      JSON.stringify(config)
    );
  }

  private async getTenantSchemaConfig(tenantId: string): Promise<any> {
    const config = await this.redis.get(`tenant:${tenantId}:schema_config`);
    return config ? JSON.parse(config) : null;
  }

  private mapRowToTenant(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      subdomain: row.subdomain,
      customDomain: row.custom_domain,
      status: row.status,
      isolationStrategy: row.isolation_strategy,
      plan: row.plan,
      configuration: typeof row.configuration === 'string'
        ? JSON.parse(row.configuration)
        : row.configuration,
      adminEmail: row.admin_email,
      industry: row.industry,
      companySize: row.company_size,
      trialEndsAt: row.trial_ends_at,
      subscriptionId: row.subscription_id,
      stripeCustomerId: row.stripe_customer_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : row.metadata || {}
    };
  }

  async close(): Promise<void> {
    await this.provisioningQueue.close();
    await this.queueScheduler.close();
    await this.masterPool.end();

    for (const pool of this.tenantPools.values()) {
      await pool.end();
    }

    await this.redis.quit();
  }
}
