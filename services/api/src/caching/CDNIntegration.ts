import axios, { AxiosInstance } from 'axios';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { Readable } from 'stream';

const execAsync = promisify(exec);

export enum CDNProvider {
  CLOUDFLARE = 'cloudflare',
  CLOUDFRONT = 'cloudfront',
  FASTLY = 'fastly',
}

export enum ImageFormat {
  WEBP = 'webp',
  AVIF = 'avif',
  JPEG = 'jpeg',
  PNG = 'png',
}

export enum VideoFormat {
  HLS = 'hls',
  DASH = 'dash',
  MP4 = 'mp4',
}

export interface CDNConfig {
  primary: {
    provider: CDNProvider;
    apiKey?: string;
    apiSecret?: string;
    zoneId?: string;
    distributionId?: string;
    domain: string;
  };
  secondary?: {
    provider: CDNProvider;
    apiKey?: string;
    apiSecret?: string;
    distributionId?: string;
    domain: string;
  };
  tertiary?: {
    provider: CDNProvider;
    apiKey?: string;
    serviceId?: string;
    domain: string;
  };
  s3: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  optimization: {
    images: {
      enabled: boolean;
      formats: ImageFormat[];
      thumbnails: Array<{ width: number; height: number; name: string }>;
      quality: number;
    };
    videos: {
      enabled: boolean;
      formats: VideoFormat[];
      qualities: string[];
    };
    compression: {
      brotli: boolean;
      gzip: boolean;
      threshold: number;
    };
    minification: {
      js: boolean;
      css: boolean;
    };
  };
  cacheControl: {
    static: {
      maxAge: number;
      sMaxAge: number;
      immutable: boolean;
    };
    dynamic: {
      maxAge: number;
      sMaxAge: number;
      staleWhileRevalidate: number;
    };
  };
  security: {
    signedUrls: {
      enabled: boolean;
      expirationTime: number;
      secret: string;
    };
    ipRestriction: {
      enabled: boolean;
      allowedIPs: string[];
    };
  };
  analytics: {
    enabled: boolean;
    trackBandwidth: boolean;
    trackHitRatio: boolean;
    trackPopularContent: boolean;
  };
}

export interface AssetUploadOptions {
  contentType?: string;
  cacheControl?: string;
  optimize?: boolean;
  generateThumbnails?: boolean;
  transcode?: boolean;
  tags?: Record<string, string>;
}

export interface PurgeOptions {
  files?: string[];
  patterns?: string[];
  tags?: string[];
  purgeEverything?: boolean;
}

export interface SignedUrlOptions {
  expiresIn?: number;
  ipAddress?: string;
  customPolicy?: Record<string, any>;
}

export interface CDNAnalytics {
  bandwidth: {
    total: number;
    byRegion: Record<string, number>;
    trend: Array<{ timestamp: number; bytes: number }>;
  };
  requests: {
    total: number;
    cached: number;
    uncached: number;
  };
  hitRatio: number;
  topContent: Array<{
    url: string;
    requests: number;
    bandwidth: number;
  }>;
  edgeLocations: Array<{
    location: string;
    requests: number;
    latency: number;
  }>;
}

export interface EdgeFunction {
  name: string;
  code: string;
  routes: string[];
  enabled: boolean;
}

export class CDNIntegration extends EventEmitter {
  private config: CDNConfig;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cloudflareClient: AxiosInstance | null = null;
  private cloudfrontClient: CloudFrontClient | null = null;
  private s3Client: S3Client;
  private fastlyClient: AxiosInstance | null = null;
  private primaryProvider: CDNProvider;
  private failoverActive = false;
  private analyticsCache: Map<string, any> = new Map();
  private readonly ANALYTICS_CACHE_TTL = 300000;

  constructor(config: CDNConfig) {
    super();
    this.config = config;
    this.logger = new Logger('CDNIntegration');
    this.metrics = new MetricsCollector('cdn');
    this.primaryProvider = config.primary.provider;

    this.initializeClients();
    this.startHealthChecks();
    this.startAnalyticsCollection();
  }

  private initializeClients(): void {
    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: {
        accessKeyId: this.config.s3.accessKeyId,
        secretAccessKey: this.config.s3.secretAccessKey,
      },
    });

    if (this.config.primary.provider === CDNProvider.CLOUDFLARE) {
      this.cloudflareClient = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
          'Authorization': `Bearer ${this.config.primary.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }

    if (
      this.config.primary.provider === CDNProvider.CLOUDFRONT ||
      this.config.secondary?.provider === CDNProvider.CLOUDFRONT
    ) {
      this.cloudfrontClient = new CloudFrontClient({
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
      });
    }

    if (
      this.config.primary.provider === CDNProvider.FASTLY ||
      this.config.tertiary?.provider === CDNProvider.FASTLY
    ) {
      this.fastlyClient = axios.create({
        baseURL: 'https://api.fastly.com',
        headers: {
          'Fastly-Key': this.config.primary.apiKey || this.config.tertiary?.apiKey || '',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }

    this.logger.info('CDN clients initialized', {
      primary: this.config.primary.provider,
      secondary: this.config.secondary?.provider,
      tertiary: this.config.tertiary?.provider,
    });
  }

  public async uploadAsset(
    path: string,
    data: Buffer | Readable,
    options: AssetUploadOptions = {}
  ): Promise<string> {
    const startTime = Date.now();

    try {
      let processedData = data instanceof Buffer ? data : await this.streamToBuffer(data);
      const contentType = options.contentType || this.detectContentType(path);

      if (options.optimize) {
        processedData = await this.optimizeAsset(path, processedData, contentType);
      }

      const cacheControl = options.cacheControl || this.generateCacheControl(path);

      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: path,
        Body: processedData,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: options.tags,
      });

      await this.s3Client.send(uploadCommand);

      if (options.generateThumbnails && this.isImage(contentType)) {
        await this.generateThumbnails(path, processedData);
      }

      if (options.transcode && this.isVideo(contentType)) {
        await this.transcodeVideo(path, processedData);
      }

      const url = this.getAssetUrl(path);

      const latency = Date.now() - startTime;
      this.metrics.histogram('cdn.upload.latency', latency);
      this.metrics.increment('cdn.upload.success');

      this.logger.info('Asset uploaded successfully', { path, latency, size: processedData.length });

      return url;
    } catch (error) {
      this.logger.error('Asset upload failed', { path, error });
      this.metrics.increment('cdn.upload.error');
      throw error;
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private async optimizeAsset(path: string, data: Buffer, contentType: string): Promise<Buffer> {
    try {
      if (this.isImage(contentType)) {
        return await this.optimizeImage(data);
      }

      if (this.isJavaScript(contentType) && this.config.optimization.minification.js) {
        return await this.minifyJavaScript(data);
      }

      if (this.isCSS(contentType) && this.config.optimization.minification.css) {
        return await this.minifyCSS(data);
      }

      if (data.length >= this.config.optimization.compression.threshold) {
        return await this.compressData(data);
      }

      return data;
    } catch (error) {
      this.logger.error('Asset optimization failed', { path, error });
      return data;
    }
  }

  private async optimizeImage(data: Buffer): Promise<Buffer> {
    if (!this.config.optimization.images.enabled) {
      return data;
    }

    try {
      const image = sharp(data);
      const metadata = await image.metadata();

      const targetFormat = this.selectBestImageFormat(metadata);

      let optimized = image;

      if (targetFormat === ImageFormat.WEBP) {
        optimized = optimized.webp({ quality: this.config.optimization.images.quality });
      } else if (targetFormat === ImageFormat.AVIF) {
        optimized = optimized.avif({ quality: this.config.optimization.images.quality });
      } else if (targetFormat === ImageFormat.JPEG) {
        optimized = optimized.jpeg({ quality: this.config.optimization.images.quality, progressive: true });
      } else if (targetFormat === ImageFormat.PNG) {
        optimized = optimized.png({ compressionLevel: 9, progressive: true });
      }

      const result = await optimized.toBuffer();

      this.logger.debug('Image optimized', {
        originalSize: data.length,
        optimizedSize: result.length,
        format: targetFormat,
        savings: ((1 - result.length / data.length) * 100).toFixed(2) + '%',
      });

      return result;
    } catch (error) {
      this.logger.error('Image optimization failed', error);
      return data;
    }
  }

  private selectBestImageFormat(metadata: sharp.Metadata): ImageFormat {
    const formats = this.config.optimization.images.formats;

    if (formats.includes(ImageFormat.AVIF)) {
      return ImageFormat.AVIF;
    }

    if (formats.includes(ImageFormat.WEBP)) {
      return ImageFormat.WEBP;
    }

    if (metadata.format === 'png' && formats.includes(ImageFormat.PNG)) {
      return ImageFormat.PNG;
    }

    return ImageFormat.JPEG;
  }

  private async generateThumbnails(path: string, data: Buffer): Promise<void> {
    if (!this.config.optimization.images.thumbnails.length) {
      return;
    }

    try {
      const image = sharp(data);

      for (const thumbnail of this.config.optimization.images.thumbnails) {
        const resized = await image
          .clone()
          .resize(thumbnail.width, thumbnail.height, {
            fit: 'cover',
            position: 'center',
          })
          .toBuffer();

        const thumbnailPath = this.getThumbnailPath(path, thumbnail.name);

        const uploadCommand = new PutObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: thumbnailPath,
          Body: resized,
          ContentType: 'image/jpeg',
          CacheControl: this.config.cacheControl.static.immutable
            ? `public, max-age=${this.config.cacheControl.static.maxAge}, immutable`
            : `public, max-age=${this.config.cacheControl.static.maxAge}`,
        });

        await this.s3Client.send(uploadCommand);

        this.logger.debug('Thumbnail generated', {
          path: thumbnailPath,
          width: thumbnail.width,
          height: thumbnail.height,
        });
      }
    } catch (error) {
      this.logger.error('Thumbnail generation failed', { path, error });
    }
  }

  private getThumbnailPath(originalPath: string, thumbnailName: string): string {
    const parts = originalPath.split('/');
    const filename = parts.pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const ext = filename.substring(filename.lastIndexOf('.'));

    return [...parts, `${nameWithoutExt}_${thumbnailName}${ext}`].join('/');
  }

  private async transcodeVideo(path: string, data: Buffer): Promise<void> {
    if (!this.config.optimization.videos.enabled) {
      return;
    }

    try {
      const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
      const tempOutputDir = `/tmp/output_${Date.now()}`;

      await require('fs').promises.writeFile(tempInputPath, data);
      await require('fs').promises.mkdir(tempOutputDir, { recursive: true });

      for (const format of this.config.optimization.videos.formats) {
        if (format === VideoFormat.HLS) {
          await this.transcodeToHLS(tempInputPath, tempOutputDir, path);
        } else if (format === VideoFormat.DASH) {
          await this.transcodeToDASH(tempInputPath, tempOutputDir, path);
        }
      }

      await require('fs').promises.unlink(tempInputPath);
      await require('fs').promises.rm(tempOutputDir, { recursive: true });

      this.logger.info('Video transcoding completed', { path });
    } catch (error) {
      this.logger.error('Video transcoding failed', { path, error });
    }
  }

  private async transcodeToHLS(inputPath: string, outputDir: string, s3Path: string): Promise<void> {
    const qualities = this.config.optimization.videos.qualities;
    const hlsDir = `${outputDir}/hls`;
    await require('fs').promises.mkdir(hlsDir, { recursive: true });

    for (const quality of qualities) {
      const outputPath = `${hlsDir}/${quality}.m3u8`;
      const bitrateMap: Record<string, string> = {
        '360p': '800k',
        '480p': '1400k',
        '720p': '2800k',
        '1080p': '5000k',
      };

      const bitrate = bitrateMap[quality] || '2800k';

      const ffmpegCommand = `ffmpeg -i ${inputPath} -c:v libx264 -b:v ${bitrate} -c:a aac -b:a 128k -hls_time 10 -hls_list_size 0 -f hls ${outputPath}`;

      await execAsync(ffmpegCommand);

      const files = await require('fs').promises.readdir(hlsDir);
      for (const file of files) {
        if (file.startsWith(quality)) {
          const fileData = await require('fs').promises.readFile(`${hlsDir}/${file}`);
          const s3Key = `${s3Path.replace(/\.[^/.]+$/, '')}/hls/${file}`;

          const uploadCommand = new PutObjectCommand({
            Bucket: this.config.s3.bucket,
            Key: s3Key,
            Body: fileData,
            ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T',
            CacheControl: `public, max-age=${this.config.cacheControl.static.maxAge}`,
          });

          await this.s3Client.send(uploadCommand);
        }
      }
    }
  }

  private async transcodeToDASH(inputPath: string, outputDir: string, s3Path: string): Promise<void> {
    const dashDir = `${outputDir}/dash`;
    await require('fs').promises.mkdir(dashDir, { recursive: true });

    const ffmpegCommand = `ffmpeg -i ${inputPath} -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f dash ${dashDir}/manifest.mpd`;

    await execAsync(ffmpegCommand);

    const files = await require('fs').promises.readdir(dashDir);
    for (const file of files) {
      const fileData = await require('fs').promises.readFile(`${dashDir}/${file}`);
      const s3Key = `${s3Path.replace(/\.[^/.]+$/, '')}/dash/${file}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: s3Key,
        Body: fileData,
        ContentType: file.endsWith('.mpd') ? 'application/dash+xml' : 'video/mp4',
        CacheControl: `public, max-age=${this.config.cacheControl.static.maxAge}`,
      });

      await this.s3Client.send(uploadCommand);
    }
  }

  private async minifyJavaScript(data: Buffer): Promise<Buffer> {
    try {
      const { minify } = await import('terser');
      const code = data.toString('utf-8');
      const result = await minify(code, {
        compress: {
          drop_console: true,
          dead_code: true,
        },
        mangle: true,
      });

      return Buffer.from(result.code || code);
    } catch (error) {
      this.logger.error('JavaScript minification failed', error);
      return data;
    }
  }

  private async minifyCSS(data: Buffer): Promise<Buffer> {
    try {
      const postcss = await import('postcss');
      const cssnano = await import('cssnano');

      const css = data.toString('utf-8');
      const result = await postcss.default([cssnano.default()]).process(css, { from: undefined });

      return Buffer.from(result.css);
    } catch (error) {
      this.logger.error('CSS minification failed', error);
      return data;
    }
  }

  private async compressData(data: Buffer): Promise<Buffer> {
    try {
      if (this.config.optimization.compression.brotli) {
        return await this.brotliCompress(data);
      }

      if (this.config.optimization.compression.gzip) {
        return await this.gzipCompress(data);
      }

      return data;
    } catch (error) {
      this.logger.error('Data compression failed', error);
      return data;
    }
  }

  private async brotliCompress(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.brotliCompress(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private async gzipCompress(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { level: 9 }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private detectContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      js: 'application/javascript',
      css: 'text/css',
      html: 'text/html',
      json: 'application/json',
      pdf: 'application/pdf',
      zip: 'application/zip',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private generateCacheControl(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const staticExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'css', 'js', 'woff', 'woff2'];

    if (staticExtensions.includes(ext || '')) {
      const maxAge = this.config.cacheControl.static.maxAge;
      const sMaxAge = this.config.cacheControl.static.sMaxAge;
      const immutable = this.config.cacheControl.static.immutable;

      return immutable
        ? `public, max-age=${maxAge}, s-maxage=${sMaxAge}, immutable`
        : `public, max-age=${maxAge}, s-maxage=${sMaxAge}`;
    }

    const maxAge = this.config.cacheControl.dynamic.maxAge;
    const sMaxAge = this.config.cacheControl.dynamic.sMaxAge;
    const staleWhileRevalidate = this.config.cacheControl.dynamic.staleWhileRevalidate;

    return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  private isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  private isVideo(contentType: string): boolean {
    return contentType.startsWith('video/');
  }

  private isJavaScript(contentType: string): boolean {
    return contentType.includes('javascript');
  }

  private isCSS(contentType: string): boolean {
    return contentType.includes('css');
  }

  private getAssetUrl(path: string): string {
    return `https://${this.config.primary.domain}/${path}`;
  }

  public async purge(options: PurgeOptions): Promise<boolean> {
    try {
      const provider = this.failoverActive && this.config.secondary
        ? this.config.secondary.provider
        : this.primaryProvider;

      switch (provider) {
        case CDNProvider.CLOUDFLARE:
          return await this.purgeCloudflare(options);
        case CDNProvider.CLOUDFRONT:
          return await this.purgeCloudFront(options);
        case CDNProvider.FASTLY:
          return await this.purgeFastly(options);
        default:
          throw new Error(`Unknown CDN provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error('CDN purge failed', { options, error });
      this.metrics.increment('cdn.purge.error');
      return false;
    }
  }

  private async purgeCloudflare(options: PurgeOptions): Promise<boolean> {
    if (!this.cloudflareClient || !this.config.primary.zoneId) {
      throw new Error('Cloudflare client not initialized');
    }

    try {
      const payload: any = {};

      if (options.purgeEverything) {
        payload.purge_everything = true;
      } else {
        if (options.files && options.files.length > 0) {
          payload.files = options.files.map((file) => `https://${this.config.primary.domain}/${file}`);
        }

        if (options.tags && options.tags.length > 0) {
          payload.tags = options.tags;
        }

        if (options.patterns && options.patterns.length > 0) {
          payload.prefixes = options.patterns;
        }
      }

      const response = await this.cloudflareClient.post(
        `/zones/${this.config.primary.zoneId}/purge_cache`,
        payload
      );

      if (response.data.success) {
        this.logger.info('Cloudflare cache purged successfully', options);
        this.metrics.increment('cdn.purge.success');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Cloudflare purge failed', error);
      throw error;
    }
  }

  private async purgeCloudFront(options: PurgeOptions): Promise<boolean> {
    if (!this.cloudfrontClient) {
      throw new Error('CloudFront client not initialized');
    }

    try {
      const distributionId = this.config.primary.distributionId || this.config.secondary?.distributionId;
      if (!distributionId) {
        throw new Error('CloudFront distribution ID not configured');
      }

      const paths: string[] = [];

      if (options.purgeEverything) {
        paths.push('/*');
      } else {
        if (options.files && options.files.length > 0) {
          paths.push(...options.files.map((file) => `/${file}`));
        }

        if (options.patterns && options.patterns.length > 0) {
          paths.push(...options.patterns);
        }
      }

      const command = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      });

      const response = await this.cloudfrontClient.send(command);

      if (response.Invalidation) {
        this.logger.info('CloudFront cache invalidated successfully', {
          id: response.Invalidation.Id,
          paths: paths.length,
        });
        this.metrics.increment('cdn.purge.success');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('CloudFront purge failed', error);
      throw error;
    }
  }

  private async purgeFastly(options: PurgeOptions): Promise<boolean> {
    if (!this.fastlyClient || !this.config.tertiary?.serviceId) {
      throw new Error('Fastly client not initialized');
    }

    try {
      const serviceId = this.config.tertiary.serviceId;

      if (options.purgeEverything) {
        await this.fastlyClient.post(`/service/${serviceId}/purge_all`);
        this.logger.info('Fastly cache purged completely');
        this.metrics.increment('cdn.purge.success');
        return true;
      }

      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.fastlyClient.post(`/service/${serviceId}/purge/${tag}`);
        }
      }

      if (options.files && options.files.length > 0) {
        for (const file of options.files) {
          const url = `https://${this.config.tertiary.domain}/${file}`;
          await this.fastlyClient.post('/purge', { url });
        }
      }

      this.logger.info('Fastly cache purged successfully', options);
      this.metrics.increment('cdn.purge.success');
      return true;
    } catch (error) {
      this.logger.error('Fastly purge failed', error);
      throw error;
    }
  }

  public generateSignedUrl(path: string, options: SignedUrlOptions = {}): string {
    if (!this.config.security.signedUrls.enabled) {
      return this.getAssetUrl(path);
    }

    const expiresIn = options.expiresIn || this.config.security.signedUrls.expirationTime;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    const data = {
      path,
      expires,
      ip: options.ipAddress,
      ...options.customPolicy,
    };

    const signature = this.createSignature(JSON.stringify(data));

    return `${this.getAssetUrl(path)}?expires=${expires}&signature=${signature}`;
  }

  public async generatePresignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: path,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.debug('Presigned URL generated', { path, expiresIn });

      return url;
    } catch (error) {
      this.logger.error('Presigned URL generation failed', { path, error });
      throw error;
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.config.security.signedUrls.secret)
      .update(data)
      .digest('hex');
  }

  public verifySignature(path: string, expires: number, signature: string, ipAddress?: string): boolean {
    if (expires < Math.floor(Date.now() / 1000)) {
      return false;
    }

    const data = {
      path,
      expires,
      ip: ipAddress,
    };

    const expectedSignature = this.createSignature(JSON.stringify(data));

    return signature === expectedSignature;
  }

  public async deployEdgeFunction(func: EdgeFunction): Promise<boolean> {
    try {
      if (this.primaryProvider !== CDNProvider.CLOUDFLARE) {
        this.logger.warn('Edge functions only supported on Cloudflare');
        return false;
      }

      if (!this.cloudflareClient || !this.config.primary.zoneId) {
        throw new Error('Cloudflare client not initialized');
      }

      const response = await this.cloudflareClient.post(
        `/zones/${this.config.primary.zoneId}/workers/scripts/${func.name}`,
        func.code,
        {
          headers: {
            'Content-Type': 'application/javascript',
          },
        }
      );

      if (response.data.success) {
        for (const route of func.routes) {
          await this.cloudflareClient.post(
            `/zones/${this.config.primary.zoneId}/workers/routes`,
            {
              pattern: route,
              script: func.name,
            }
          );
        }

        this.logger.info('Edge function deployed successfully', { name: func.name });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Edge function deployment failed', { name: func.name, error });
      return false;
    }
  }

  public async getAnalytics(): Promise<CDNAnalytics> {
    const cacheKey = 'cdn_analytics';
    const cached = this.analyticsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ANALYTICS_CACHE_TTL) {
      return cached.data;
    }

    try {
      let analytics: CDNAnalytics;

      switch (this.primaryProvider) {
        case CDNProvider.CLOUDFLARE:
          analytics = await this.getCloudflareAnalytics();
          break;
        case CDNProvider.CLOUDFRONT:
          analytics = await this.getCloudFrontAnalytics();
          break;
        case CDNProvider.FASTLY:
          analytics = await this.getFastlyAnalytics();
          break;
        default:
          throw new Error(`Analytics not supported for ${this.primaryProvider}`);
      }

      this.analyticsCache.set(cacheKey, { data: analytics, timestamp: Date.now() });

      return analytics;
    } catch (error) {
      this.logger.error('Failed to fetch CDN analytics', error);
      throw error;
    }
  }

  private async getCloudflareAnalytics(): Promise<CDNAnalytics> {
    if (!this.cloudflareClient || !this.config.primary.zoneId) {
      throw new Error('Cloudflare client not initialized');
    }

    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const until = new Date().toISOString();

      const response = await this.cloudflareClient.get(
        `/zones/${this.config.primary.zoneId}/analytics/dashboard`,
        {
          params: { since, until },
        }
      );

      const data = response.data.result;

      return {
        bandwidth: {
          total: data.totals.bandwidth.all || 0,
          byRegion: data.totals.bandwidth.country || {},
          trend: data.timeseries.map((point: any) => ({
            timestamp: new Date(point.until).getTime(),
            bytes: point.bandwidth.all,
          })),
        },
        requests: {
          total: data.totals.requests.all || 0,
          cached: data.totals.requests.cached || 0,
          uncached: data.totals.requests.uncached || 0,
        },
        hitRatio: (data.totals.requests.cached / data.totals.requests.all) * 100 || 0,
        topContent: [],
        edgeLocations: [],
      };
    } catch (error) {
      this.logger.error('Cloudflare analytics fetch failed', error);
      throw error;
    }
  }

  private async getCloudFrontAnalytics(): Promise<CDNAnalytics> {
    if (!this.cloudfrontClient) {
      throw new Error('CloudFront client not initialized');
    }

    try {
      const distributionId = this.config.primary.distributionId || this.config.secondary?.distributionId;
      if (!distributionId) {
        throw new Error('CloudFront distribution ID not configured');
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await this.cloudfrontClient.send(command);

      return {
        bandwidth: {
          total: 0,
          byRegion: {},
          trend: [],
        },
        requests: {
          total: 0,
          cached: 0,
          uncached: 0,
        },
        hitRatio: 0,
        topContent: [],
        edgeLocations: [],
      };
    } catch (error) {
      this.logger.error('CloudFront analytics fetch failed', error);
      throw error;
    }
  }

  private async getFastlyAnalytics(): Promise<CDNAnalytics> {
    if (!this.fastlyClient || !this.config.tertiary?.serviceId) {
      throw new Error('Fastly client not initialized');
    }

    try {
      const serviceId = this.config.tertiary.serviceId;
      const from = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      const to = Math.floor(Date.now() / 1000);

      const response = await this.fastlyClient.get(`/stats/service/${serviceId}`, {
        params: { from, to, by: 'minute' },
      });

      const data = response.data.data;

      return {
        bandwidth: {
          total: data.reduce((sum: number, point: any) => sum + point.bytes, 0),
          byRegion: {},
          trend: data.map((point: any) => ({
            timestamp: point.start_time * 1000,
            bytes: point.bytes,
          })),
        },
        requests: {
          total: data.reduce((sum: number, point: any) => sum + point.requests, 0),
          cached: data.reduce((sum: number, point: any) => sum + point.hits, 0),
          uncached: data.reduce((sum: number, point: any) => sum + point.miss, 0),
        },
        hitRatio: 0,
        topContent: [],
        edgeLocations: [],
      };
    } catch (error) {
      this.logger.error('Fastly analytics fetch failed', error);
      throw error;
    }
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      try {
        await this.checkPrimaryHealth();
      } catch (error) {
        this.logger.error('Health check failed', error);
      }
    }, 60000);
  }

  private async checkPrimaryHealth(): Promise<void> {
    try {
      const testUrl = `https://${this.config.primary.domain}/health`;
      const response = await axios.head(testUrl, { timeout: 5000 });

      if (response.status === 200) {
        if (this.failoverActive) {
          this.logger.info('Primary CDN recovered, switching back');
          this.failoverActive = false;
          this.emit('failover-recovered');
        }
        this.metrics.gauge('cdn.health', 1);
      }
    } catch (error) {
      this.logger.error('Primary CDN health check failed', error);
      this.metrics.gauge('cdn.health', 0);

      if (!this.failoverActive && this.config.secondary) {
        this.logger.warn('Activating CDN failover');
        this.failoverActive = true;
        this.emit('failover-activated');
      }
    }
  }

  private startAnalyticsCollection(): void {
    if (!this.config.analytics.enabled) {
      return;
    }

    setInterval(async () => {
      try {
        const analytics = await this.getAnalytics();

        if (this.config.analytics.trackBandwidth) {
          this.metrics.gauge('cdn.bandwidth.total', analytics.bandwidth.total);
        }

        if (this.config.analytics.trackHitRatio) {
          this.metrics.gauge('cdn.hit_ratio', analytics.hitRatio);
        }

        this.metrics.gauge('cdn.requests.total', analytics.requests.total);
        this.metrics.gauge('cdn.requests.cached', analytics.requests.cached);
        this.metrics.gauge('cdn.requests.uncached', analytics.requests.uncached);
      } catch (error) {
        this.logger.error('Analytics collection failed', error);
      }
    }, 300000);
  }

  public async close(): Promise<void> {
    this.analyticsCache.clear();
    this.logger.info('CDN integration closed');
  }
}

export default CDNIntegration;
