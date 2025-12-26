import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketEncryptionCommand,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Tenant Storage Service
 *
 * Manages isolated S3 buckets for each tenant:
 * - Automatic bucket creation and configuration
 * - Encryption at rest (AES-256)
 * - Lifecycle policies (auto-expiration)
 * - Storage quota enforcement
 * - Presigned URL generation
 *
 * Bucket naming: `upcoach-tenant-{tenantId}`
 */

export interface StorageConfig {
  quotaGB?: number; // Storage quota in GB
  lifecycleDays?: number; // Days until file expiration
  region?: string;
}

export interface FileUpload {
  tenantId: string;
  key: string;
  content: Buffer | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export class TenantStorageService {
  private db: Pool;
  private s3Client: S3Client;
  private region: string;
  private bucketPrefix: string = 'upcoach-tenant-';

  constructor(db: Pool, region?: string) {
    this.db = db;
    this.region = region || process.env.AWS_REGION || 'us-east-1';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Create S3 bucket for tenant
   */
  async createTenantBucket(tenantId: string, config: StorageConfig = {}): Promise<string> {
    const bucketName = this.getBucketName(tenantId);

    try {
      // Check if bucket already exists
      const bucketExists = await this.bucketExists(bucketName);

      if (bucketExists) {
        logger.info('Tenant bucket already exists', { tenantId, bucketName });
        return bucketName;
      }

      // Create bucket
      await this.s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: this.region,
          },
        })
      );

      logger.info('Tenant bucket created', { tenantId, bucketName });

      // Enable encryption
      await this.enableEncryption(bucketName);

      // Set bucket policy for isolation
      await this.setBucketPolicy(bucketName, tenantId);

      // Configure lifecycle policies
      if (config.lifecycleDays) {
        await this.setLifecyclePolicy(bucketName, config.lifecycleDays);
      }

      // Save to database
      await this.saveBucketMetadata(tenantId, bucketName, config);

      return bucketName;
    } catch (error) {
      logger.error('Failed to create tenant bucket', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Upload file to tenant bucket
   */
  async uploadFile(upload: FileUpload): Promise<string> {
    try {
      const bucketName = this.getBucketName(upload.tenantId);

      // Ensure bucket exists
      const bucketExists = await this.bucketExists(bucketName);
      if (!bucketExists) {
        await this.createTenantBucket(upload.tenantId);
      }

      // Check quota before upload
      await this.enforceQuota(upload.tenantId, upload.content.length);

      // Upload file
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: upload.key,
        Body: upload.content,
        ContentType: upload.contentType || 'application/octet-stream',
        Metadata: upload.metadata,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);

      // Track storage usage
      await this.trackStorageUsage(upload.tenantId, upload.key, upload.content.length);

      logger.info('File uploaded', {
        tenantId: upload.tenantId,
        key: upload.key,
        size: upload.content.length,
      });

      return `s3://${bucketName}/${upload.key}`;
    } catch (error) {
      logger.error('File upload failed', {
        tenantId: upload.tenantId,
        key: upload.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Download file from tenant bucket
   */
  async downloadFile(tenantId: string, key: string): Promise<Buffer> {
    try {
      const bucketName = this.getBucketName(tenantId);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Empty file body');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('File download failed', {
        tenantId,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete file from tenant bucket
   */
  async deleteFile(tenantId: string, key: string): Promise<void> {
    try {
      const bucketName = this.getBucketName(tenantId);

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      // Update storage usage
      await this.removeStorageUsage(tenantId, key);

      logger.info('File deleted', { tenantId, key });
    } catch (error) {
      logger.error('File deletion failed', {
        tenantId,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List files in tenant bucket
   */
  async listFiles(tenantId: string, prefix?: string): Promise<FileMetadata[]> {
    try {
      const bucketName = this.getBucketName(tenantId);

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((obj) => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        contentType: '',
        lastModified: obj.LastModified || new Date(),
      }));
    } catch (error) {
      logger.error('File listing failed', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async getPresignedDownloadUrl(
    tenantId: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const bucketName = this.getBucketName(tenantId);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate presigned URL for file upload
   */
  async getPresignedUploadUrl(
    tenantId: string,
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const bucketName = this.getBucketName(tenantId);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get current storage usage for tenant
   */
  async getStorageUsage(tenantId: string): Promise<{
    usedBytes: number;
    usedGB: number;
    quotaGB: number;
    percentUsed: number;
  }> {
    const query = `
      SELECT
        COALESCE(SUM(file_size), 0) AS used_bytes,
        (SELECT quota_gb FROM tenant_storage_config WHERE tenant_id = $1) AS quota_gb
      FROM tenant_storage_usage
      WHERE tenant_id = $1
    `;
    const result = await this.db.query(query, [tenantId]);

    const usedBytes = parseInt(result.rows[0].used_bytes);
    const quotaGB = result.rows[0].quota_gb || 100; // Default 100GB
    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const percentUsed = (usedGB / quotaGB) * 100;

    return {
      usedBytes,
      usedGB: parseFloat(usedGB.toFixed(2)),
      quotaGB,
      percentUsed: parseFloat(percentUsed.toFixed(2)),
    };
  }

  /**
   * Check if bucket exists
   */
  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Enable bucket encryption
   */
  private async enableEncryption(bucketName: string): Promise<void> {
    const command = new PutBucketEncryptionCommand({
      Bucket: bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });

    await this.s3Client.send(command);

    logger.info('Bucket encryption enabled', { bucketName });
  }

  /**
   * Set bucket policy for tenant isolation
   */
  private async setBucketPolicy(bucketName: string, tenantId: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'TenantIsolation',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:*',
          Resource: [
            `arn:aws:s3:::${bucketName}`,
            `arn:aws:s3:::${bucketName}/*`,
          ],
          Condition: {
            StringNotEquals: {
              'aws:userid': process.env.AWS_USER_ID || '',
            },
          },
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    });

    await this.s3Client.send(command);

    logger.info('Bucket policy set', { bucketName, tenantId });
  }

  /**
   * Set lifecycle policy for automatic file expiration
   */
  private async setLifecyclePolicy(bucketName: string, days: number): Promise<void> {
    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'AutoExpiration',
            Status: 'Enabled',
            Expiration: {
              Days: days,
            },
          },
        ],
      },
    });

    await this.s3Client.send(command);

    logger.info('Lifecycle policy set', { bucketName, days });
  }

  /**
   * Enforce storage quota
   */
  private async enforceQuota(tenantId: string, additionalBytes: number): Promise<void> {
    const usage = await this.getStorageUsage(tenantId);
    const newUsageGB = (usage.usedBytes + additionalBytes) / (1024 * 1024 * 1024);

    if (newUsageGB > usage.quotaGB) {
      throw new Error(
        `Storage quota exceeded: ${newUsageGB.toFixed(2)}GB / ${usage.quotaGB}GB`
      );
    }
  }

  /**
   * Track storage usage in database
   */
  private async trackStorageUsage(
    tenantId: string,
    key: string,
    size: number
  ): Promise<void> {
    const query = `
      INSERT INTO tenant_storage_usage (tenant_id, file_key, file_size, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id, file_key) DO UPDATE
      SET file_size = $3, updated_at = NOW()
    `;
    await this.db.query(query, [tenantId, key, size]);
  }

  /**
   * Remove storage usage from database
   */
  private async removeStorageUsage(tenantId: string, key: string): Promise<void> {
    const query = `
      DELETE FROM tenant_storage_usage
      WHERE tenant_id = $1 AND file_key = $2
    `;
    await this.db.query(query, [tenantId, key]);
  }

  /**
   * Save bucket metadata to database
   */
  private async saveBucketMetadata(
    tenantId: string,
    bucketName: string,
    config: StorageConfig
  ): Promise<void> {
    const query = `
      INSERT INTO tenant_storage_config (tenant_id, bucket_name, quota_gb, lifecycle_days, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (tenant_id) DO UPDATE
      SET bucket_name = $2, quota_gb = $3, lifecycle_days = $4, updated_at = NOW()
    `;
    await this.db.query(query, [
      tenantId,
      bucketName,
      config.quotaGB || 100,
      config.lifecycleDays || null,
    ]);
  }

  /**
   * Get bucket name for tenant
   */
  private getBucketName(tenantId: string): string {
    return `${this.bucketPrefix}${tenantId.toLowerCase()}`;
  }
}
