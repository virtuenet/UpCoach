import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { performanceCacheService } from '../cache/PerformanceCacheService';

/**
 * Asset types for optimization
 */
export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  STATIC = 'static'
}

/**
 * Image formats supported for optimization
 */
export enum ImageFormat {
  WEBP = 'webp',
  AVIF = 'avif',
  JPEG = 'jpeg',
  PNG = 'png'
}

/**
 * Asset optimization configuration
 */
interface AssetConfig {
  type: AssetType;
  maxSize?: number;
  quality?: number;
  format?: ImageFormat;
  responsive?: boolean;
  compression?: boolean;
  cacheTTL?: number;
}

/**
 * Optimized asset metadata
 */
interface OptimizedAsset {
  originalUrl: string;
  optimizedUrl: string;
  cdnUrl: string;
  format: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
  dimensions?: { width: number; height: number };
  variants?: OptimizedAsset[];
  etag: string;
  lastModified: Date;
}

/**
 * CDN configuration
 */
interface CDNConfig {
  domain: string;
  distributionId: string;
  cacheBehaviors: Record<string, any>;
  headers: Record<string, string>;
}

/**
 * Comprehensive asset optimization and CDN service
 */
export class AssetOptimizationService {
  private s3Client: S3Client;
  private cloudFrontClient: CloudFrontClient;
  private bucketName: string;
  private cdnConfig: CDNConfig;

  // Asset processing queue
  private processingQueue: Map<string, Promise<OptimizedAsset>> = new Map();

  // Responsive image breakpoints
  private readonly breakpoints = [320, 640, 768, 1024, 1280, 1920];

  // Supported image formats for conversion
  private readonly supportedFormats: Record<string, ImageFormat> = {
    'image/jpeg': ImageFormat.JPEG,
    'image/jpg': ImageFormat.JPEG,
    'image/png': ImageFormat.PNG,
    'image/webp': ImageFormat.WEBP,
    'image/avif': ImageFormat.AVIF
  };

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize AWS services and configuration
   */
  private initializeServices(): void {
    const region = process.env.AWS_REGION || 'us-east-1';

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    this.cloudFrontClient = new CloudFrontClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    this.bucketName = process.env.S3_BUCKET_NAME || 'upcoach-assets';

    this.cdnConfig = {
      domain: process.env.CDN_DOMAIN || 'cdn.upcoach.ai',
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
      cacheBehaviors: {
        images: { TTL: 31536000, compress: true }, // 1 year
        videos: { TTL: 86400, compress: false },   // 1 day
        documents: { TTL: 3600, compress: true },  // 1 hour
        static: { TTL: 31536000, compress: true }  // 1 year
      },
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'X-Content-Type-Options': 'nosniff'
      }
    };
  }

  /**
   * Optimize and upload asset to CDN
   */
  async optimizeAsset(
    file: Buffer | string,
    originalName: string,
    config: AssetConfig
  ): Promise<OptimizedAsset> {
    const assetId = this.generateAssetId(originalName, file);

    // Check if already processing
    if (this.processingQueue.has(assetId)) {
      return await this.processingQueue.get(assetId)!;
    }

    // Check cache for already optimized asset
    const cached = await this.getCachedAsset(assetId);
    if (cached) {
      return cached;
    }

    // Start processing
    const processingPromise = this.processAsset(file, originalName, config, assetId);
    this.processingQueue.set(assetId, processingPromise);

    try {
      const result = await processingPromise;
      await this.cacheAsset(assetId, result);
      return result;
    } finally {
      this.processingQueue.delete(assetId);
    }
  }

  /**
   * Process asset based on type
   */
  private async processAsset(
    file: Buffer | string,
    originalName: string,
    config: AssetConfig,
    assetId: string
  ): Promise<OptimizedAsset> {
    let buffer: Buffer;

    if (typeof file === 'string') {
      buffer = await fs.readFile(file);
    } else {
      buffer = file;
    }

    const originalSize = buffer.length;
    const fileExtension = path.extname(originalName).toLowerCase();

    let optimizedBuffer: Buffer;
    let format: string;
    let dimensions: { width: number; height: number } | undefined;
    let variants: OptimizedAsset[] = [];

    switch (config.type) {
      case AssetType.IMAGE:
        const imageResult = await this.optimizeImage(buffer, config);
        optimizedBuffer = imageResult.buffer;
        format = imageResult.format;
        dimensions = imageResult.dimensions;
        if (config.responsive) {
          variants = await this.generateResponsiveVariants(buffer, config);
        }
        break;

      case AssetType.VIDEO:
        // For now, just compress video without transcoding
        optimizedBuffer = await this.compressVideo(buffer, config);
        format = fileExtension.substring(1);
        break;

      case AssetType.DOCUMENT:
        optimizedBuffer = await this.compressDocument(buffer, config);
        format = fileExtension.substring(1);
        break;

      case AssetType.AUDIO:
        optimizedBuffer = await this.compressAudio(buffer, config);
        format = fileExtension.substring(1);
        break;

      default:
        optimizedBuffer = buffer;
        format = fileExtension.substring(1);
    }

    // Generate file paths
    const optimizedKey = this.generateS3Key(assetId, format);
    const etag = this.generateETag(optimizedBuffer);

    // Upload to S3
    await this.uploadToS3(optimizedKey, optimizedBuffer, format, config);

    // Generate URLs
    const optimizedUrl = `s3://${this.bucketName}/${optimizedKey}`;
    const cdnUrl = `https://${this.cdnConfig.domain}/${optimizedKey}`;

    const result: OptimizedAsset = {
      originalUrl: originalName,
      optimizedUrl,
      cdnUrl,
      format,
      size: optimizedBuffer.length,
      originalSize,
      compressionRatio: ((originalSize - optimizedBuffer.length) / originalSize) * 100,
      dimensions,
      variants,
      etag,
      lastModified: new Date()
    };

    logger.info('Asset optimized', {
      assetId,
      originalSize,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: result.compressionRatio,
      format
    });

    return result;
  }

  /**
   * Optimize image with advanced compression
   */
  private async optimizeImage(
    buffer: Buffer,
    config: AssetConfig
  ): Promise<{ buffer: Buffer; format: string; dimensions: { width: number; height: number } }> {
    let processor = sharp(buffer);

    // Get original dimensions
    const metadata = await processor.metadata();
    const dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0
    };

    // Apply transformations
    if (config.maxSize) {
      const maxDimension = Math.sqrt(config.maxSize);
      processor = processor.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to optimal format
    const targetFormat = config.format || this.selectOptimalFormat(metadata.format);
    const quality = config.quality || this.getOptimalQuality(targetFormat);

    let optimizedBuffer: Buffer;

    switch (targetFormat) {
      case ImageFormat.WEBP:
        optimizedBuffer = await processor
          .webp({ quality, effort: 6, smartSubsample: true })
          .toBuffer();
        break;

      case ImageFormat.AVIF:
        optimizedBuffer = await processor
          .avif({ quality, effort: 9, chromaSubsampling: '4:2:0' })
          .toBuffer();
        break;

      case ImageFormat.JPEG:
        optimizedBuffer = await processor
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
        break;

      case ImageFormat.PNG:
        optimizedBuffer = await processor
          .png({ quality, progressive: true, compressionLevel: 9 })
          .toBuffer();
        break;

      default:
        optimizedBuffer = await processor.toBuffer();
    }

    return {
      buffer: optimizedBuffer,
      format: targetFormat,
      dimensions
    };
  }

  /**
   * Generate responsive image variants
   */
  private async generateResponsiveVariants(
    originalBuffer: Buffer,
    config: AssetConfig
  ): Promise<OptimizedAsset[]> {
    const variants: OptimizedAsset[] = [];

    for (const width of this.breakpoints) {
      try {
        const processor = sharp(originalBuffer);
        const resizedBuffer = await processor
          .resize(width, undefined, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: config.quality || 85 })
          .toBuffer();

        const metadata = await sharp(resizedBuffer).metadata();
        const variantKey = this.generateS3Key(
          `${this.generateAssetId(config.toString(), originalBuffer)}_${width}w`,
          'webp'
        );

        await this.uploadToS3(variantKey, resizedBuffer, 'webp', config);

        variants.push({
          originalUrl: '',
          optimizedUrl: `s3://${this.bucketName}/${variantKey}`,
          cdnUrl: `https://${this.cdnConfig.domain}/${variantKey}`,
          format: 'webp',
          size: resizedBuffer.length,
          originalSize: originalBuffer.length,
          compressionRatio: 0,
          dimensions: { width: metadata.width || 0, height: metadata.height || 0 },
          etag: this.generateETag(resizedBuffer),
          lastModified: new Date()
        });
      } catch (error) {
        logger.error(`Failed to generate ${width}w variant`, error);
      }
    }

    return variants;
  }

  /**
   * Compress video (placeholder for future video optimization)
   */
  private async compressVideo(buffer: Buffer, config: AssetConfig): Promise<Buffer> {
    // For now, return original buffer
    // In the future, implement FFmpeg-based video compression
    logger.info('Video compression not yet implemented, returning original');
    return buffer;
  }

  /**
   * Compress document (basic compression)
   */
  private async compressDocument(buffer: Buffer, config: AssetConfig): Promise<Buffer> {
    // For PDFs and documents, we might use different compression strategies
    // For now, return original buffer
    return buffer;
  }

  /**
   * Compress audio (placeholder for future audio optimization)
   */
  private async compressAudio(buffer: Buffer, config: AssetConfig): Promise<Buffer> {
    // For now, return original buffer
    // In the future, implement audio compression
    return buffer;
  }

  /**
   * Upload optimized asset to S3
   */
  private async uploadToS3(
    key: string,
    buffer: Buffer,
    format: string,
    config: AssetConfig
  ): Promise<void> {
    const contentType = this.getContentType(format);
    const cacheControl = this.getCacheControl(config.type, config.cacheTTL);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
      ...this.cdnConfig.headers,
      Metadata: {
        originalFormat: format,
        optimized: 'true',
        timestamp: Date.now().toString()
      }
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(asset: OptimizedAsset): string {
    if (!asset.variants || asset.variants.length === 0) {
      return asset.cdnUrl;
    }

    const srcSetEntries = asset.variants.map(variant => {
      const width = variant.dimensions?.width;
      return `${variant.cdnUrl} ${width}w`;
    });

    return srcSetEntries.join(', ');
  }

  /**
   * Generate picture element for modern format support
   */
  generatePictureElement(asset: OptimizedAsset, alt: string = ''): string {
    const webpVariants = asset.variants?.filter(v => v.format === 'webp') || [];
    const avifVariants = asset.variants?.filter(v => v.format === 'avif') || [];

    let pictureHtml = '<picture>';

    // AVIF sources
    if (avifVariants.length > 0) {
      const avifSrcSet = avifVariants.map(v =>
        `${v.cdnUrl} ${v.dimensions?.width}w`
      ).join(', ');
      pictureHtml += `<source srcset="${avifSrcSet}" type="image/avif">`;
    }

    // WebP sources
    if (webpVariants.length > 0) {
      const webpSrcSet = webpVariants.map(v =>
        `${v.cdnUrl} ${v.dimensions?.width}w`
      ).join(', ');
      pictureHtml += `<source srcset="${webpSrcSet}" type="image/webp">`;
    }

    // Fallback img
    pictureHtml += `<img src="${asset.cdnUrl}" alt="${alt}" loading="lazy">`;
    pictureHtml += '</picture>';

    return pictureHtml;
  }

  /**
   * Invalidate CDN cache
   */
  async invalidateCache(paths: string[]): Promise<void> {
    if (!this.cdnConfig.distributionId) {
      logger.warn('CloudFront distribution ID not configured');
      return;
    }

    const command = new CreateInvalidationCommand({
      DistributionId: this.cdnConfig.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths.map(path => path.startsWith('/') ? path : `/${path}`)
        },
        CallerReference: Date.now().toString()
      }
    });

    try {
      await this.cloudFrontClient.send(command);
      logger.info('CDN cache invalidated', { paths });
    } catch (error) {
      logger.error('CDN cache invalidation failed', error);
    }
  }

  /**
   * Utility methods
   */
  private generateAssetId(name: string, content: Buffer | string): string {
    const hash = createHash('sha256');
    hash.update(name);
    hash.update(typeof content === 'string' ? content : content.toString());
    return hash.digest('hex').substring(0, 16);
  }

  private generateS3Key(assetId: string, format: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `assets/${date}/${assetId}.${format}`;
  }

  private generateETag(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }

  private selectOptimalFormat(originalFormat?: string): ImageFormat {
    // Prefer modern formats for better compression
    if (originalFormat === 'png') {
      return ImageFormat.WEBP; // Better for transparency
    }
    return ImageFormat.WEBP; // Generally best balance of quality and size
  }

  private getOptimalQuality(format: ImageFormat): number {
    switch (format) {
      case ImageFormat.WEBP:
        return 85;
      case ImageFormat.AVIF:
        return 80;
      case ImageFormat.JPEG:
        return 85;
      case ImageFormat.PNG:
        return 90;
      default:
        return 85;
    }
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      wav: 'audio/wav'
    };

    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  private getCacheControl(assetType: AssetType, customTTL?: number): string {
    if (customTTL) {
      return `public, max-age=${customTTL}, immutable`;
    }

    const ttl = this.cdnConfig.cacheBehaviors[assetType]?.TTL || 3600;
    return `public, max-age=${ttl}, immutable`;
  }

  private async getCachedAsset(assetId: string): Promise<OptimizedAsset | null> {
    try {
      return await performanceCacheService.get(`asset:${assetId}`);
    } catch (error) {
      return null;
    }
  }

  private async cacheAsset(assetId: string, asset: OptimizedAsset): Promise<void> {
    try {
      await performanceCacheService.set(`asset:${assetId}`, asset, 86400); // 24 hours
    } catch (error) {
      logger.error('Failed to cache asset', error);
    }
  }

  /**
   * Cleanup and resource management
   */
  async cleanup(): Promise<void> {
    // Clear processing queue
    this.processingQueue.clear();

    logger.info('Asset optimization service cleaned up');
  }
}

// Export singleton instance
export const assetOptimizationService = new AssetOptimizationService();

// Export utility functions
export const AssetUtils = {
  // Determine asset type from file extension
  getAssetType(filename: string): AssetType {
    const ext = path.extname(filename).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'].includes(ext)) {
      return AssetType.IMAGE;
    }
    if (['.mp4', '.avi', '.mov', '.webm', '.mkv'].includes(ext)) {
      return AssetType.VIDEO;
    }
    if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(ext)) {
      return AssetType.AUDIO;
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) {
      return AssetType.DOCUMENT;
    }

    return AssetType.STATIC;
  },

  // Generate responsive image config
  createResponsiveImageConfig(quality: number = 85): AssetConfig {
    return {
      type: AssetType.IMAGE,
      quality,
      format: ImageFormat.WEBP,
      responsive: true,
      compression: true,
      cacheTTL: 31536000 // 1 year
    };
  },

  // Generate standard image config
  createStandardImageConfig(maxSize?: number): AssetConfig {
    return {
      type: AssetType.IMAGE,
      maxSize,
      quality: 85,
      format: ImageFormat.WEBP,
      compression: true,
      cacheTTL: 31536000
    };
  }
};

export default AssetOptimizationService;