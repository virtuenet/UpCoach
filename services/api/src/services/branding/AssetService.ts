import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Asset Service
 *
 * Handles tenant branding asset uploads:
 * - Logos (SVG, PNG, JPG)
 * - Favicons (ICO, PNG)
 * - Background images
 * - Custom fonts
 *
 * Features:
 * - S3 storage with CDN integration
 * - Image optimization and resizing
 * - Format validation
 * - Asset versioning
 */

export interface AssetUpload {
  tenantId: string;
  assetType: 'logo' | 'favicon' | 'background' | 'font';
  file: Buffer;
  filename: string;
  contentType: string;
}

export interface Asset {
  id: string;
  tenantId: string;
  assetType: string;
  filename: string;
  s3Key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
  version: number;
  createdAt: Date;
}

export class AssetService {
  private db: Pool;
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain?: string;

  constructor(db: Pool) {
    this.db = db;
    this.bucketName = process.env.S3_ASSETS_BUCKET || 'upcoach-tenant-assets';
    this.cdnDomain = process.env.CDN_DOMAIN;

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Upload logo
   */
  async uploadLogo(upload: AssetUpload): Promise<Asset> {
    try {
      // Validate file type
      this.validateLogoType(upload.contentType);

      // Optimize image
      const optimizedBuffer = await this.optimizeLogo(upload.file, upload.contentType);

      // Get image dimensions
      const metadata = await sharp(optimizedBuffer).metadata();

      // Generate S3 key
      const s3Key = this.generateS3Key(upload.tenantId, 'logo', upload.filename);

      // Upload to S3
      await this.uploadToS3(s3Key, optimizedBuffer, upload.contentType);

      // Save to database
      const asset = await this.saveAsset({
        tenantId: upload.tenantId,
        assetType: 'logo',
        filename: upload.filename,
        s3Key,
        size: optimizedBuffer.length,
        contentType: upload.contentType,
        width: metadata.width,
        height: metadata.height,
      });

      logger.info('Logo uploaded', {
        tenantId: upload.tenantId,
        assetId: asset.id,
        size: asset.size,
      });

      return asset;
    } catch (error) {
      logger.error('Logo upload failed', {
        tenantId: upload.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Upload favicon
   */
  async uploadFavicon(upload: AssetUpload): Promise<Asset> {
    try {
      // Validate file type
      this.validateFaviconType(upload.contentType);

      // Generate multiple favicon sizes (16x16, 32x32, 192x192)
      const faviconSizes = [16, 32, 192];
      const assets: Asset[] = [];

      for (const size of faviconSizes) {
        const resizedBuffer = await sharp(upload.file)
          .resize(size, size, { fit: 'cover' })
          .png()
          .toBuffer();

        const filename = `favicon-${size}x${size}.png`;
        const s3Key = this.generateS3Key(upload.tenantId, 'favicon', filename);

        await this.uploadToS3(s3Key, resizedBuffer, 'image/png');

        const asset = await this.saveAsset({
          tenantId: upload.tenantId,
          assetType: 'favicon',
          filename,
          s3Key,
          size: resizedBuffer.length,
          contentType: 'image/png',
          width: size,
          height: size,
        });

        assets.push(asset);
      }

      logger.info('Favicon uploaded', {
        tenantId: upload.tenantId,
        variants: assets.length,
      });

      // Return the largest variant
      return assets[assets.length - 1];
    } catch (error) {
      logger.error('Favicon upload failed', {
        tenantId: upload.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Upload background image
   */
  async uploadBackground(upload: AssetUpload): Promise<Asset> {
    try {
      this.validateImageType(upload.contentType);

      // Optimize for web (max 1920px width)
      const optimizedBuffer = await sharp(upload.file)
        .resize(1920, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const metadata = await sharp(optimizedBuffer).metadata();

      const s3Key = this.generateS3Key(upload.tenantId, 'background', upload.filename);

      await this.uploadToS3(s3Key, optimizedBuffer, 'image/jpeg');

      const asset = await this.saveAsset({
        tenantId: upload.tenantId,
        assetType: 'background',
        filename: upload.filename,
        s3Key,
        size: optimizedBuffer.length,
        contentType: 'image/jpeg',
        width: metadata.width,
        height: metadata.height,
      });

      logger.info('Background image uploaded', {
        tenantId: upload.tenantId,
        assetId: asset.id,
      });

      return asset;
    } catch (error) {
      logger.error('Background upload failed', {
        tenantId: upload.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<Asset | null> {
    const query = `
      SELECT * FROM tenant_assets
      WHERE id = $1
    `;
    const result = await this.db.query(query, [assetId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToAsset(result.rows[0]);
  }

  /**
   * Get all assets for tenant
   */
  async getAssetsByTenant(tenantId: string): Promise<Asset[]> {
    const query = `
      SELECT * FROM tenant_assets
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);

    return result.rows.map(row => this.mapToAsset(row));
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      const asset = await this.getAsset(assetId);

      if (!asset) {
        throw new Error(`Asset ${assetId} not found`);
      }

      // Delete from S3
      await this.deleteFromS3(asset.s3Key);

      // Delete from database
      const deleteQuery = `
        DELETE FROM tenant_assets
        WHERE id = $1
      `;
      await this.db.query(deleteQuery, [assetId]);

      logger.info('Asset deleted', { assetId, s3Key: asset.s3Key });
    } catch (error) {
      logger.error('Asset deletion failed', {
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  async getPresignedUrl(assetId: string, expiresIn: number = 3600): Promise<string> {
    const asset = await this.getAsset(assetId);

    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: asset.s3Key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return url;
  }

  /**
   * Optimize logo image
   */
  private async optimizeLogo(buffer: Buffer, contentType: string): Promise<Buffer> {
    if (contentType === 'image/svg+xml') {
      // SVG doesn't need optimization
      return buffer;
    }

    // Resize to max 500px width, maintain aspect ratio
    return sharp(buffer)
      .resize(500, null, { withoutEnlargement: true, fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    await this.s3Client.send(command);
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate S3 key with versioning
   */
  private generateS3Key(tenantId: string, assetType: string, filename: string): string {
    const hash = crypto.randomBytes(8).toString('hex');
    const extension = filename.split('.').pop();
    return `tenants/${tenantId}/${assetType}/${hash}.${extension}`;
  }

  /**
   * Save asset metadata to database
   */
  private async saveAsset(data: {
    tenantId: string;
    assetType: string;
    filename: string;
    s3Key: string;
    size: number;
    contentType: string;
    width?: number;
    height?: number;
  }): Promise<Asset> {
    const query = `
      INSERT INTO tenant_assets (
        tenant_id, asset_type, filename, s3_key, size,
        content_type, width, height, version, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, NOW())
      RETURNING *
    `;

    const result = await this.db.query(query, [
      data.tenantId,
      data.assetType,
      data.filename,
      data.s3Key,
      data.size,
      data.contentType,
      data.width,
      data.height,
    ]);

    return this.mapToAsset(result.rows[0]);
  }

  /**
   * Validate logo file type
   */
  private validateLogoType(contentType: string): void {
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid logo type: ${contentType}. Allowed: PNG, JPEG, SVG`);
    }
  }

  /**
   * Validate favicon file type
   */
  private validateFaviconType(contentType: string): void {
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid favicon type: ${contentType}. Allowed: PNG, ICO`);
    }
  }

  /**
   * Validate image file type
   */
  private validateImageType(contentType: string): void {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid image type: ${contentType}. Allowed: PNG, JPEG, WebP`);
    }
  }

  /**
   * Map database row to Asset
   */
  private mapToAsset(row: any): Asset {
    const url = `https://${this.bucketName}.s3.amazonaws.com/${row.s3_key}`;
    const cdnUrl = this.cdnDomain
      ? `https://${this.cdnDomain}/${row.s3_key}`
      : undefined;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetType: row.asset_type,
      filename: row.filename,
      s3Key: row.s3_key,
      url,
      cdnUrl,
      size: row.size,
      contentType: row.content_type,
      width: row.width,
      height: row.height,
      version: row.version,
      createdAt: row.created_at,
    };
  }
}
