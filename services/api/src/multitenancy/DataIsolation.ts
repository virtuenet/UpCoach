import { Pool, PoolClient } from 'pg';
import * as AWS from 'aws-sdk';
import crypto from 'crypto';
import IORedis from 'ioredis';
import { EventEmitter } from 'events';

/**
 * Complete Data Isolation and Security Service
 * Implements row-level security, encryption, audit logging, and cross-tenant prevention
 */

export enum EncryptionAlgorithm {
  AES_256_GCM = 'aes-256-gcm',
  AES_256_CBC = 'aes-256-cbc'
}

export enum DataResidency {
  US_EAST_1 = 'us-east-1',
  US_WEST_2 = 'us-west-2',
  EU_WEST_1 = 'eu-west-1',
  EU_CENTRAL_1 = 'eu-central-1',
  AP_SOUTHEAST_1 = 'ap-southeast-1'
}

export enum AccessLevel {
  NONE = 'NONE',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN'
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  source: 'subdomain' | 'custom_domain' | 'api_key';
  ipAddress?: string;
  userAgent?: string;
}

export interface EncryptionKey {
  id: string;
  tenantId: string;
  keyArn: string;
  dataKey: Buffer;
  algorithm: EncryptionAlgorithm;
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt: Date;
  status: 'active' | 'rotating' | 'expired';
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: {
    before: any;
    after: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  checksum: string;
  metadata: Record<string, any>;
}

export interface DataMaskingRule {
  field: string;
  maskType: 'full' | 'partial' | 'hash';
  pattern?: string;
  roles?: string[];
}

export interface AccessPolicy {
  id: string;
  tenantId: string;
  resourceType: string;
  resourceId?: string;
  principalType: 'user' | 'role' | 'team';
  principalId: string;
  accessLevel: AccessLevel;
  conditions?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

export interface RLSPolicy {
  name: string;
  tableName: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  enabled: boolean;
}

export class DataIsolationService extends EventEmitter {
  private pool: Pool;
  private redis: IORedis;
  private kms: AWS.KMS;
  private s3: AWS.S3;
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private readonly KEY_ROTATION_DAYS = 90;

  constructor(
    dbConfig: any,
    redisConfig: any,
    awsConfig: any
  ) {
    super();

    this.pool = new Pool({
      ...dbConfig,
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.redis = new IORedis(redisConfig);

    AWS.config.update(awsConfig);
    this.kms = new AWS.KMS();
    this.s3 = new AWS.S3();

    this.initializeRLSPolicies();
  }

  private async initializeRLSPolicies(): Promise<void> {
    const tables = [
      'users', 'organizations', 'teams', 'goals', 'habits',
      'sessions', 'notes', 'files', 'events', 'notifications',
      'messages', 'tasks', 'projects', 'documents', 'comments'
    ];

    const client = await this.pool.connect();

    try {
      for (const table of tables) {
        await this.enableRLS(client, table);
      }
    } finally {
      client.release();
    }
  }

  async enableRLS(client: PoolClient, tableName: string): Promise<void> {
    try {
      await client.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);

      await client.query(`
        DROP POLICY IF EXISTS tenant_isolation_select ON ${tableName}
      `);

      await client.query(`
        CREATE POLICY tenant_isolation_select ON ${tableName}
          FOR SELECT
          USING (
            tenant_id = current_setting('app.current_tenant_id', true)::uuid
            OR current_setting('app.bypass_rls', true) = 'true'
          )
      `);

      await client.query(`
        DROP POLICY IF EXISTS tenant_isolation_insert ON ${tableName}
      `);

      await client.query(`
        CREATE POLICY tenant_isolation_insert ON ${tableName}
          FOR INSERT
          WITH CHECK (
            tenant_id = current_setting('app.current_tenant_id', true)::uuid
            OR current_setting('app.bypass_rls', true) = 'true'
          )
      `);

      await client.query(`
        DROP POLICY IF EXISTS tenant_isolation_update ON ${tableName}
      `);

      await client.query(`
        CREATE POLICY tenant_isolation_update ON ${tableName}
          FOR UPDATE
          USING (
            tenant_id = current_setting('app.current_tenant_id', true)::uuid
            OR current_setting('app.bypass_rls', true) = 'true'
          )
          WITH CHECK (
            tenant_id = current_setting('app.current_tenant_id', true)::uuid
            OR current_setting('app.bypass_rls', true) = 'true'
          )
      `);

      await client.query(`
        DROP POLICY IF EXISTS tenant_isolation_delete ON ${tableName}
      `);

      await client.query(`
        CREATE POLICY tenant_isolation_delete ON ${tableName}
          FOR DELETE
          USING (
            tenant_id = current_setting('app.current_tenant_id', true)::uuid
            OR current_setting('app.bypass_rls', true) = 'true'
          )
      `);

      this.emit('rls:enabled', { tableName });
    } catch (error) {
      console.error(`Failed to enable RLS on ${tableName}:`, error);
      throw error;
    }
  }

  async disableRLS(client: PoolClient, tableName: string): Promise<void> {
    await client.query(`ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY`);
    this.emit('rls:disabled', { tableName });
  }

  async executeWithTenantContext<T>(
    tenantContext: TenantContext,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `SET LOCAL app.current_tenant_id = '${tenantContext.tenantId}'`
      );

      await client.query(`SET LOCAL app.current_user_id = '${tenantContext.userId || ''}'`);

      await client.query(`SET LOCAL app.bypass_rls = 'false'`);

      const result = await callback(client);

      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');

      await this.logSecurityEvent({
        tenantId: tenantContext.tenantId,
        userId: tenantContext.userId,
        event: 'query_execution_failed',
        error: error instanceof Error ? error.message : String(error),
        ipAddress: tenantContext.ipAddress,
        userAgent: tenantContext.userAgent
      });

      throw error;
    } finally {
      client.release();
    }
  }

  async executeAsSystemAdmin<T>(
    callback: (client: PoolClient) => Promise<T>,
    reason: string
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`SET LOCAL app.bypass_rls = 'true'`);

      await this.logAdminAction({
        action: 'bypass_rls',
        reason,
        timestamp: new Date()
      });

      const result = await callback(client);

      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrCreateEncryptionKey(tenantId: string): Promise<EncryptionKey> {
    const cached = this.encryptionKeys.get(tenantId);
    if (cached && cached.status === 'active' && new Date() < cached.expiresAt) {
      return cached;
    }

    const keyData = await this.redis.get(`tenant:${tenantId}:encryption_key`);
    if (keyData) {
      const key: EncryptionKey = JSON.parse(keyData);
      key.dataKey = Buffer.from(key.dataKey as any, 'base64');

      if (key.status === 'active' && new Date() < key.expiresAt) {
        this.encryptionKeys.set(tenantId, key);
        return key;
      }
    }

    return await this.generateNewEncryptionKey(tenantId);
  }

  private async generateNewEncryptionKey(tenantId: string): Promise<EncryptionKey> {
    const keySpec = 'AES_256';
    const keyUsage = 'ENCRYPT_DECRYPT';

    const createKeyResponse = await this.kms.createKey({
      Description: `Encryption key for tenant ${tenantId}`,
      KeyUsage: keyUsage,
      Origin: 'AWS_KMS',
      Tags: [
        { TagKey: 'TenantId', TagValue: tenantId },
        { TagKey: 'Purpose', TagValue: 'DataEncryption' }
      ]
    }).promise();

    const keyArn = createKeyResponse.KeyMetadata!.Arn!;

    const dataKeyResponse = await this.kms.generateDataKey({
      KeyId: keyArn,
      KeySpec: keySpec
    }).promise();

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.KEY_ROTATION_DAYS);

    const encryptionKey: EncryptionKey = {
      id: crypto.randomUUID(),
      tenantId,
      keyArn,
      dataKey: dataKeyResponse.Plaintext as Buffer,
      algorithm: EncryptionAlgorithm.AES_256_GCM,
      createdAt: now,
      expiresAt,
      status: 'active'
    };

    const cacheData = {
      ...encryptionKey,
      dataKey: encryptionKey.dataKey.toString('base64')
    };

    await this.redis.setex(
      `tenant:${tenantId}:encryption_key`,
      this.KEY_ROTATION_DAYS * 86400,
      JSON.stringify(cacheData)
    );

    await this.pool.query(
      `INSERT INTO encryption_keys
       (id, tenant_id, key_arn, algorithm, created_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        encryptionKey.id,
        tenantId,
        keyArn,
        encryptionKey.algorithm,
        encryptionKey.createdAt,
        encryptionKey.expiresAt,
        encryptionKey.status
      ]
    );

    this.encryptionKeys.set(tenantId, encryptionKey);

    this.emit('encryption_key:created', { tenantId, keyId: encryptionKey.id });

    return encryptionKey;
  }

  async encryptField(tenantId: string, plaintext: string): Promise<string> {
    const key = await this.getOrCreateEncryptionKey(tenantId);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      key.algorithm,
      key.dataKey,
      iv
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = (cipher as any).getAuthTag().toString('hex');

    const result = JSON.stringify({
      algorithm: key.algorithm,
      iv: iv.toString('hex'),
      encrypted,
      authTag,
      keyId: key.id
    });

    return Buffer.from(result).toString('base64');
  }

  async decryptField(tenantId: string, ciphertext: string): Promise<string> {
    const key = await this.getOrCreateEncryptionKey(tenantId);

    const data = JSON.parse(Buffer.from(ciphertext, 'base64').toString('utf8'));

    const decipher = crypto.createDecipheriv(
      data.algorithm,
      key.dataKey,
      Buffer.from(data.iv, 'hex')
    );

    (decipher as any).setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async rotateEncryptionKey(tenantId: string): Promise<void> {
    const oldKey = await this.getOrCreateEncryptionKey(tenantId);

    await this.pool.query(
      `UPDATE encryption_keys SET status = 'rotating' WHERE id = $1`,
      [oldKey.id]
    );

    const newKey = await this.generateNewEncryptionKey(tenantId);

    const encryptedFields = await this.pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND column_name LIKE '%_encrypted'`
    );

    for (const field of encryptedFields.rows) {
      await this.reencryptTableColumn(
        tenantId,
        field.table_name,
        field.column_name,
        oldKey,
        newKey
      );
    }

    await this.pool.query(
      `UPDATE encryption_keys SET status = 'expired' WHERE id = $1`,
      [oldKey.id]
    );

    this.emit('encryption_key:rotated', { tenantId, oldKeyId: oldKey.id, newKeyId: newKey.id });
  }

  private async reencryptTableColumn(
    tenantId: string,
    tableName: string,
    columnName: string,
    oldKey: EncryptionKey,
    newKey: EncryptionKey
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const rows = await client.query(
        `SELECT id, ${columnName} FROM ${tableName} WHERE tenant_id = $1 AND ${columnName} IS NOT NULL`,
        [tenantId]
      );

      for (const row of rows.rows) {
        const decrypted = await this.decryptField(tenantId, row[columnName]);
        const reencrypted = await this.encryptField(tenantId, decrypted);

        await client.query(
          `UPDATE ${tableName} SET ${columnName} = $1 WHERE id = $2`,
          [reencrypted, row.id]
        );
      }
    } finally {
      client.release();
    }
  }

  maskData(value: any, rule: DataMaskingRule, userRole: string): any {
    if (rule.roles && !rule.roles.includes(userRole)) {
      return value;
    }

    if (value === null || value === undefined) {
      return value;
    }

    const stringValue = String(value);

    switch (rule.maskType) {
      case 'full':
        return '***MASKED***';

      case 'partial':
        if (rule.pattern === 'email') {
          const [local, domain] = stringValue.split('@');
          if (!domain) return '***@***.com';
          const maskedLocal = local.charAt(0) + '***';
          const domainParts = domain.split('.');
          const maskedDomain = '***.' + domainParts[domainParts.length - 1];
          return `${maskedLocal}@${maskedDomain}`;
        } else if (rule.pattern === 'phone') {
          const digits = stringValue.replace(/\D/g, '');
          if (digits.length >= 10) {
            return `(${digits.substring(0, 3)}) ***-${digits.substring(digits.length - 4)}`;
          }
          return '(***) ***-****';
        } else if (rule.pattern === 'ssn') {
          const digits = stringValue.replace(/\D/g, '');
          if (digits.length === 9) {
            return `***-**-${digits.substring(5)}`;
          }
          return '***-**-****';
        } else if (rule.pattern === 'credit_card') {
          const digits = stringValue.replace(/\D/g, '');
          if (digits.length >= 13) {
            return `****-****-****-${digits.substring(digits.length - 4)}`;
          }
          return '****-****-****-****';
        } else {
          const visibleChars = Math.max(1, Math.floor(stringValue.length * 0.2));
          return stringValue.substring(0, visibleChars) + '*'.repeat(stringValue.length - visibleChars);
        }

      case 'hash':
        return crypto.createHash('sha256').update(stringValue).digest('hex').substring(0, 16);

      default:
        return value;
    }
  }

  async logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'checksum'>): Promise<void> {
    const id = crypto.randomUUID();

    const checksumData = JSON.stringify({
      id,
      tenantId: entry.tenantId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      timestamp: entry.timestamp
    });

    const checksum = crypto
      .createHash('sha256')
      .update(checksumData)
      .digest('hex');

    const auditEntry: AuditLogEntry = {
      id,
      ...entry,
      checksum
    };

    await this.pool.query(
      `INSERT INTO audit_logs
       (id, tenant_id, user_id, action, resource_type, resource_id,
        changes, ip_address, user_agent, timestamp, checksum, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        auditEntry.id,
        auditEntry.tenantId,
        auditEntry.userId,
        auditEntry.action,
        auditEntry.resourceType,
        auditEntry.resourceId,
        auditEntry.changes ? JSON.stringify(auditEntry.changes) : null,
        auditEntry.ipAddress,
        auditEntry.userAgent,
        auditEntry.timestamp,
        auditEntry.checksum,
        JSON.stringify(auditEntry.metadata)
      ]
    );

    await this.redis.lpush(
      `tenant:${entry.tenantId}:recent_audit_logs`,
      JSON.stringify(auditEntry)
    );

    await this.redis.ltrim(`tenant:${entry.tenantId}:recent_audit_logs`, 0, 999);

    this.emit('audit:logged', auditEntry);
  }

  async verifyAuditLogIntegrity(logId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [logId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const log = result.rows[0];

    const checksumData = JSON.stringify({
      id: log.id,
      tenantId: log.tenant_id,
      userId: log.user_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      timestamp: log.timestamp
    });

    const expectedChecksum = crypto
      .createHash('sha256')
      .update(checksumData)
      .digest('hex');

    return expectedChecksum === log.checksum;
  }

  async createAccessPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt'>): Promise<AccessPolicy> {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    const accessPolicy: AccessPolicy = {
      id,
      ...policy,
      createdAt
    };

    await this.pool.query(
      `INSERT INTO access_policies
       (id, tenant_id, resource_type, resource_id, principal_type, principal_id,
        access_level, conditions, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        accessPolicy.id,
        accessPolicy.tenantId,
        accessPolicy.resourceType,
        accessPolicy.resourceId,
        accessPolicy.principalType,
        accessPolicy.principalId,
        accessPolicy.accessLevel,
        accessPolicy.conditions ? JSON.stringify(accessPolicy.conditions) : null,
        accessPolicy.expiresAt,
        accessPolicy.createdAt
      ]
    );

    await this.redis.del(`tenant:${policy.tenantId}:access_policies:${policy.principalId}`);

    this.emit('access_policy:created', accessPolicy);

    return accessPolicy;
  }

  async checkAccess(
    tenantId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    requiredLevel: AccessLevel
  ): Promise<boolean> {
    const cacheKey = `access:${tenantId}:${userId}:${resourceType}:${resourceId}:${requiredLevel}`;
    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      return cached === 'true';
    }

    const policies = await this.pool.query(
      `SELECT * FROM access_policies
       WHERE tenant_id = $1
       AND resource_type = $2
       AND (resource_id = $3 OR resource_id IS NULL)
       AND principal_type = 'user'
       AND principal_id = $4
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [tenantId, resourceType, resourceId, userId]
    );

    const rolePolicies = await this.pool.query(
      `SELECT ap.* FROM access_policies ap
       JOIN user_roles ur ON ap.principal_id = ur.role_id
       WHERE ap.tenant_id = $1
       AND ap.resource_type = $2
       AND (ap.resource_id = $3 OR ap.resource_id IS NULL)
       AND ap.principal_type = 'role'
       AND ur.user_id = $4
       AND (ap.expires_at IS NULL OR ap.expires_at > NOW())`,
      [tenantId, resourceType, resourceId, userId]
    );

    const allPolicies = [...policies.rows, ...rolePolicies.rows];

    const accessLevelHierarchy = [
      AccessLevel.NONE,
      AccessLevel.READ,
      AccessLevel.WRITE,
      AccessLevel.DELETE,
      AccessLevel.ADMIN
    ];

    const requiredIndex = accessLevelHierarchy.indexOf(requiredLevel);

    const hasAccess = allPolicies.some(policy => {
      const policyIndex = accessLevelHierarchy.indexOf(policy.access_level);
      return policyIndex >= requiredIndex;
    });

    await this.redis.setex(cacheKey, 300, hasAccess ? 'true' : 'false');

    return hasAccess;
  }

  async enforceDataResidency(
    tenantId: string,
    requiredRegion: DataResidency
  ): Promise<void> {
    const tenantConfig = await this.pool.query(
      `SELECT configuration FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantConfig.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const config = JSON.parse(tenantConfig.rows[0].configuration);
    const tenantRegion = config.dataResidency;

    if (tenantRegion !== requiredRegion) {
      throw new Error(
        `Data residency violation: Tenant data must remain in ${tenantRegion}, attempted access from ${requiredRegion}`
      );
    }

    await this.logAuditEntry({
      tenantId,
      action: 'data_residency_check',
      resourceType: 'tenant',
      resourceId: tenantId,
      timestamp: new Date(),
      metadata: {
        requiredRegion,
        tenantRegion,
        result: 'allowed'
      }
    });
  }

  async preventCrossTenantAccess(
    requestTenantId: string,
    resourceTenantId: string
  ): Promise<void> {
    if (requestTenantId !== resourceTenantId) {
      await this.logSecurityEvent({
        tenantId: requestTenantId,
        event: 'cross_tenant_access_attempt',
        targetTenantId: resourceTenantId,
        blocked: true
      });

      throw new Error('Cross-tenant access denied');
    }
  }

  async exportTenantData(
    tenantId: string,
    requestedBy: string,
    format: 'json' | 'csv' | 'xml'
  ): Promise<string> {
    await this.logAuditEntry({
      tenantId,
      userId: requestedBy,
      action: 'data_export_requested',
      resourceType: 'tenant',
      resourceId: tenantId,
      timestamp: new Date(),
      metadata: { format }
    });

    const tables = [
      'users', 'organizations', 'teams', 'goals', 'habits',
      'sessions', 'notes', 'files', 'events', 'notifications'
    ];

    const exportData: Record<string, any[]> = {};

    for (const table of tables) {
      const result = await this.pool.query(
        `SELECT * FROM ${table} WHERE tenant_id = $1`,
        [tenantId]
      );

      exportData[table] = result.rows.map(row => {
        const cleaned = { ...row };
        delete cleaned.password_hash;
        delete cleaned.password;

        for (const key of Object.keys(cleaned)) {
          if (key.endsWith('_encrypted')) {
            cleaned[key] = '***ENCRYPTED***';
          }
        }

        return cleaned;
      });
    }

    let content: string;
    let contentType: string;
    let extension: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      extension = 'json';
    } else if (format === 'csv') {
      const csvParts: string[] = [];
      for (const [table, rows] of Object.entries(exportData)) {
        csvParts.push(`\n### ${table} ###\n`);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]).join(',');
          csvParts.push(headers);
          rows.forEach(row => {
            const values = Object.values(row).map(v =>
              v === null ? '' :
              typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` :
              typeof v === 'object' ? `"${JSON.stringify(v).replace(/"/g, '""')}"` :
              v
            ).join(',');
            csvParts.push(values);
          });
        }
      }
      content = csvParts.join('\n');
      contentType = 'text/csv';
      extension = 'csv';
    } else {
      const xmlParts = ['<?xml version="1.0" encoding="UTF-8"?>', '<export>'];
      for (const [table, rows] of Object.entries(exportData)) {
        xmlParts.push(`  <${table}>`);
        rows.forEach(row => {
          xmlParts.push('    <record>');
          for (const [key, value] of Object.entries(row)) {
            const xmlValue = value === null ? '' :
              typeof value === 'object' ? JSON.stringify(value) :
              String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            xmlParts.push(`      <${key}>${xmlValue}</${key}>`);
          }
          xmlParts.push('    </record>');
        });
        xmlParts.push(`  </${table}>`);
      }
      xmlParts.push('</export>');
      content = xmlParts.join('\n');
      contentType = 'application/xml';
      extension = 'xml';
    }

    const filename = `tenant-${tenantId}-export-${Date.now()}.${extension}`;

    await this.s3.putObject({
      Bucket: 'upcoach-data-exports',
      Key: `${tenantId}/${filename}`,
      Body: content,
      ContentType: contentType,
      ServerSideEncryption: 'aws:kms'
    }).promise();

    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: 'upcoach-data-exports',
      Key: `${tenantId}/${filename}`,
      Expires: 86400
    });

    await this.logAuditEntry({
      tenantId,
      userId: requestedBy,
      action: 'data_export_completed',
      resourceType: 'tenant',
      resourceId: tenantId,
      timestamp: new Date(),
      metadata: { format, filename, url }
    });

    return url;
  }

  async deleteTenantData(
    tenantId: string,
    method: 'soft' | 'hard' | 'anonymize',
    requestedBy: string
  ): Promise<void> {
    await this.logAuditEntry({
      tenantId,
      userId: requestedBy,
      action: 'data_deletion_initiated',
      resourceType: 'tenant',
      resourceId: tenantId,
      timestamp: new Date(),
      metadata: { method }
    });

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const tables = [
        'users', 'organizations', 'teams', 'goals', 'habits',
        'sessions', 'notes', 'files', 'events', 'notifications'
      ];

      if (method === 'soft') {
        for (const table of tables) {
          await client.query(
            `UPDATE ${table} SET deleted_at = NOW() WHERE tenant_id = $1 AND deleted_at IS NULL`,
            [tenantId]
          );
        }
      } else if (method === 'hard') {
        for (const table of tables) {
          await client.query(
            `DELETE FROM ${table} WHERE tenant_id = $1`,
            [tenantId]
          );
        }

        await this.s3.listObjectsV2({
          Bucket: 'upcoach-tenant-data',
          Prefix: `${tenantId}/`
        }).promise().then(async (response) => {
          if (response.Contents && response.Contents.length > 0) {
            await this.s3.deleteObjects({
              Bucket: 'upcoach-tenant-data',
              Delete: {
                Objects: response.Contents.map(obj => ({ Key: obj.Key! }))
              }
            }).promise();
          }
        });
      } else if (method === 'anonymize') {
        await client.query(
          `UPDATE users SET
           email = 'anonymized-' || id || '@example.com',
           first_name = 'Anonymized',
           last_name = 'User',
           password_hash = NULL,
           phone_encrypted = NULL,
           ssn_encrypted = NULL
           WHERE tenant_id = $1`,
          [tenantId]
        );

        for (const table of ['notes', 'messages', 'comments']) {
          await client.query(
            `UPDATE ${table} SET content = '[ANONYMIZED]' WHERE tenant_id = $1`,
            [tenantId]
          );
        }
      }

      await client.query('COMMIT');

      await this.logAuditEntry({
        tenantId,
        userId: requestedBy,
        action: 'data_deletion_completed',
        resourceType: 'tenant',
        resourceId: tenantId,
        timestamp: new Date(),
        metadata: { method }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async logSecurityEvent(event: {
    tenantId: string;
    userId?: string;
    event: string;
    error?: string;
    ipAddress?: string;
    userAgent?: string;
    targetTenantId?: string;
    blocked?: boolean;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO security_events
       (id, tenant_id, user_id, event_type, error_message, ip_address,
        user_agent, target_tenant_id, blocked, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        crypto.randomUUID(),
        event.tenantId,
        event.userId,
        event.event,
        event.error,
        event.ipAddress,
        event.userAgent,
        event.targetTenantId,
        event.blocked || false
      ]
    );

    this.emit('security:event', event);
  }

  private async logAdminAction(action: {
    action: string;
    reason: string;
    timestamp: Date;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO admin_actions (id, action, reason, created_at)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), action.action, action.reason, action.timestamp]
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
    await this.redis.quit();
  }
}
