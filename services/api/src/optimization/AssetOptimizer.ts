import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import Terser from 'terser';
import { encode as encodeBlurHash } from 'blurhash';
import axios from 'axios';

const execAsync = promisify(exec);

interface AssetOptimizationJob {
  id: string;
  assetId: string;
  assetType: 'image' | 'video' | 'javascript' | 'css' | 'font';
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: AssetMetadata;
}

interface AssetMetadata {
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  quality?: number;
  generatedFiles?: GeneratedFile[];
}

interface GeneratedFile {
  path: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
  quality?: number;
}

interface ImageOptimizationOptions {
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
  quality: number;
  lossless: boolean;
  stripMetadata: boolean;
  generateBlurHash: boolean;
  generateResponsive: boolean;
  responsiveSizes: number[];
  maxDimensions: { width: number; height: number };
  smartCrop: boolean;
}

interface VideoOptimizationOptions {
  formats: ('h264' | 'h265' | 'vp9' | 'av1')[];
  qualities: ('360p' | '720p' | '1080p' | '4k')[];
  adaptiveBitrate: boolean;
  generateThumbnails: boolean;
  thumbnailCount: number;
  crf: number;
  audioNormalization: boolean;
  targetLUFS: number;
  generateSubtitles: boolean;
}

interface JSCSSOptimizationOptions {
  minify: boolean;
  treeShake: boolean;
  codeSplit: boolean;
  brotliCompress: boolean;
  generateSourceMap: boolean;
  extractCriticalCSS: boolean;
}

interface FontOptimizationOptions {
  subset: boolean;
  characters?: string;
  convertToWOFF2: boolean;
  generateVariableFonts: boolean;
  unicodeRanges: string[];
}

interface CDNUploadOptions {
  bucket: string;
  prefix: string;
  cacheControl: string;
  contentType: string;
  acl: 'private' | 'public-read';
  metadata: Record<string, string>;
}

interface AssetManifest {
  version: string;
  generatedAt: Date;
  assets: Record<string, AssetManifestEntry>;
}

interface AssetManifestEntry {
  original: string;
  optimized: string[];
  hash: string;
  size: number;
  type: string;
}

class AssetOptimizer extends EventEmitter {
  private jobs: Map<string, AssetOptimizationJob>;
  private s3Client: S3Client;
  private manifest: AssetManifest;
  private processingQueue: string[];
  private maxConcurrent: number;
  private currentlyProcessing: number;

  constructor() {
    super();
    this.jobs = new Map();
    this.processingQueue = [];
    this.maxConcurrent = 4;
    this.currentlyProcessing = 0;

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.manifest = {
      version: '1.0.0',
      generatedAt: new Date(),
      assets: {},
    };

    this.loadManifest();
  }

  async optimizeImage(
    filePath: string,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<AssetOptimizationJob> {
    const defaultOptions: ImageOptimizationOptions = {
      formats: ['webp', 'avif'],
      quality: 85,
      lossless: false,
      stripMetadata: true,
      generateBlurHash: true,
      generateResponsive: true,
      responsiveSizes: [320, 640, 1024, 1920],
      maxDimensions: { width: 4096, height: 4096 },
      smartCrop: false,
    };

    const opts = { ...defaultOptions, ...options };

    const job = await this.createJob(filePath, 'image');
    this.emit('job:started', job);

    try {
      const imageBuffer = await fs.readFile(filePath);
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      job.metadata.format = metadata.format;
      job.metadata.width = metadata.width;
      job.metadata.height = metadata.height;
      job.metadata.generatedFiles = [];

      if (metadata.width! > opts.maxDimensions.width || metadata.height! > opts.maxDimensions.height) {
        await image.resize(opts.maxDimensions.width, opts.maxDimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (opts.smartCrop) {
        await this.applySmartCrop(image, metadata);
      }

      for (const format of opts.formats) {
        const generatedFiles = await this.convertImageFormat(
          image,
          filePath,
          format,
          opts
        );
        job.metadata.generatedFiles.push(...generatedFiles);
      }

      if (opts.generateResponsive) {
        const responsiveFiles = await this.generateResponsiveImages(
          filePath,
          opts.responsiveSizes,
          opts
        );
        job.metadata.generatedFiles.push(...responsiveFiles);
      }

      if (opts.generateBlurHash) {
        const blurHash = await this.generateBlurHash(imageBuffer);
        job.metadata.quality = blurHash.length;
      }

      const optimizedSize = job.metadata.generatedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      );

      job.optimizedSize = optimizedSize;
      job.compressionRatio = ((job.originalSize - optimizedSize) / job.originalSize) * 100;
      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('job:completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      this.emit('job:failed', job);
    }

    return job;
  }

  async optimizeVideo(
    filePath: string,
    options: Partial<VideoOptimizationOptions> = {}
  ): Promise<AssetOptimizationJob> {
    const defaultOptions: VideoOptimizationOptions = {
      formats: ['h264', 'h265'],
      qualities: ['360p', '720p', '1080p'],
      adaptiveBitrate: true,
      generateThumbnails: true,
      thumbnailCount: 10,
      crf: 23,
      audioNormalization: true,
      targetLUFS: -23,
      generateSubtitles: false,
    };

    const opts = { ...defaultOptions, ...options };

    const job = await this.createJob(filePath, 'video');
    this.emit('job:started', job);

    try {
      const videoInfo = await this.getVideoInfo(filePath);
      job.metadata.duration = videoInfo.duration;
      job.metadata.bitrate = videoInfo.bitrate;
      job.metadata.generatedFiles = [];

      for (const format of opts.formats) {
        for (const quality of opts.qualities) {
          const outputFile = await this.transcodeVideo(
            filePath,
            format,
            quality,
            opts.crf
          );
          const stats = await fs.stat(outputFile);

          job.metadata.generatedFiles.push({
            path: outputFile,
            size: stats.size,
            format,
            quality: this.getQualityHeight(quality),
          });
        }
      }

      if (opts.adaptiveBitrate) {
        const hlsFiles = await this.generateHLS(filePath, opts.qualities);
        job.metadata.generatedFiles.push(...hlsFiles);

        const dashFiles = await this.generateDASH(filePath, opts.qualities);
        job.metadata.generatedFiles.push(...dashFiles);
      }

      if (opts.generateThumbnails) {
        const thumbnailFiles = await this.generateVideoThumbnails(
          filePath,
          opts.thumbnailCount
        );
        job.metadata.generatedFiles.push(...thumbnailFiles);
      }

      if (opts.audioNormalization) {
        await this.normalizeAudio(filePath, opts.targetLUFS);
      }

      const optimizedSize = job.metadata.generatedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      );

      job.optimizedSize = optimizedSize;
      job.compressionRatio = ((job.originalSize - optimizedSize) / job.originalSize) * 100;
      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('job:completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      this.emit('job:failed', job);
    }

    return job;
  }

  async optimizeJavaScript(
    filePath: string,
    options: Partial<JSCSSOptimizationOptions> = {}
  ): Promise<AssetOptimizationJob> {
    const defaultOptions: JSCSSOptimizationOptions = {
      minify: true,
      treeShake: true,
      codeSplit: true,
      brotliCompress: true,
      generateSourceMap: true,
      extractCriticalCSS: false,
    };

    const opts = { ...defaultOptions, ...options };

    const job = await this.createJob(filePath, 'javascript');
    this.emit('job:started', job);

    try {
      const code = await fs.readFile(filePath, 'utf-8');
      job.metadata.generatedFiles = [];

      if (opts.minify) {
        const result = await Terser.minify(code, {
          compress: {
            dead_code: true,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'],
          },
          mangle: {
            toplevel: true,
          },
          sourceMap: opts.generateSourceMap ? {
            filename: path.basename(filePath),
            url: `${path.basename(filePath)}.map`,
          } : false,
        });

        if (result.code) {
          const minifiedPath = filePath.replace(/\.js$/, '.min.js');
          await fs.writeFile(minifiedPath, result.code);

          const stats = await fs.stat(minifiedPath);
          job.metadata.generatedFiles.push({
            path: minifiedPath,
            size: stats.size,
            format: 'js',
          });

          if (result.map && opts.generateSourceMap) {
            const mapPath = `${minifiedPath}.map`;
            await fs.writeFile(mapPath, result.map);
          }
        }
      }

      if (opts.treeShake || opts.codeSplit) {
        const bundledFiles = await this.bundleWithRollup(filePath, opts);
        job.metadata.generatedFiles.push(...bundledFiles);
      }

      if (opts.brotliCompress) {
        const compressedFiles = await this.compressBrotli(
          job.metadata.generatedFiles.map((f) => f.path)
        );
        job.metadata.generatedFiles.push(...compressedFiles);
      }

      const optimizedSize = job.metadata.generatedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      );

      job.optimizedSize = optimizedSize;
      job.compressionRatio = ((job.originalSize - optimizedSize) / job.originalSize) * 100;
      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('job:completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      this.emit('job:failed', job);
    }

    return job;
  }

  async optimizeCSS(
    filePath: string,
    options: Partial<JSCSSOptimizationOptions> = {}
  ): Promise<AssetOptimizationJob> {
    const defaultOptions: JSCSSOptimizationOptions = {
      minify: true,
      treeShake: false,
      codeSplit: false,
      brotliCompress: true,
      generateSourceMap: true,
      extractCriticalCSS: true,
    };

    const opts = { ...defaultOptions, ...options };

    const job = await this.createJob(filePath, 'css');
    this.emit('job:started', job);

    try {
      const css = await fs.readFile(filePath, 'utf-8');
      job.metadata.generatedFiles = [];

      if (opts.minify) {
        const { stdout } = await execAsync(
          `npx cssnano ${filePath} --output ${filePath.replace(/\.css$/, '.min.css')}`
        );

        const minifiedPath = filePath.replace(/\.css$/, '.min.css');
        const stats = await fs.stat(minifiedPath);

        job.metadata.generatedFiles.push({
          path: minifiedPath,
          size: stats.size,
          format: 'css',
        });
      }

      if (opts.extractCriticalCSS) {
        const criticalCSS = await this.extractCriticalCSS(css);
        const criticalPath = filePath.replace(/\.css$/, '.critical.css');
        await fs.writeFile(criticalPath, criticalCSS);

        const stats = await fs.stat(criticalPath);
        job.metadata.generatedFiles.push({
          path: criticalPath,
          size: stats.size,
          format: 'css',
        });
      }

      if (opts.brotliCompress) {
        const compressedFiles = await this.compressBrotli(
          job.metadata.generatedFiles.map((f) => f.path)
        );
        job.metadata.generatedFiles.push(...compressedFiles);
      }

      const optimizedSize = job.metadata.generatedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      );

      job.optimizedSize = optimizedSize;
      job.compressionRatio = ((job.originalSize - optimizedSize) / job.originalSize) * 100;
      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('job:completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      this.emit('job:failed', job);
    }

    return job;
  }

  async optimizeFont(
    filePath: string,
    options: Partial<FontOptimizationOptions> = {}
  ): Promise<AssetOptimizationJob> {
    const defaultOptions: FontOptimizationOptions = {
      subset: true,
      convertToWOFF2: true,
      generateVariableFonts: false,
      unicodeRanges: ['U+0000-00FF', 'U+0100-017F'],
    };

    const opts = { ...defaultOptions, ...options };

    const job = await this.createJob(filePath, 'font');
    this.emit('job:started', job);

    try {
      job.metadata.generatedFiles = [];

      if (opts.subset && opts.characters) {
        const subsetPath = await this.subsetFont(filePath, opts.characters);
        const stats = await fs.stat(subsetPath);

        job.metadata.generatedFiles.push({
          path: subsetPath,
          size: stats.size,
          format: 'ttf',
        });
      }

      if (opts.convertToWOFF2) {
        const woff2Path = await this.convertToWOFF2(filePath);
        const stats = await fs.stat(woff2Path);

        job.metadata.generatedFiles.push({
          path: woff2Path,
          size: stats.size,
          format: 'woff2',
        });
      }

      for (const range of opts.unicodeRanges) {
        const rangePath = await this.subsetFontByUnicodeRange(filePath, range);
        const stats = await fs.stat(rangePath);

        job.metadata.generatedFiles.push({
          path: rangePath,
          size: stats.size,
          format: 'woff2',
        });
      }

      const optimizedSize = job.metadata.generatedFiles.reduce(
        (sum, file) => sum + file.size,
        0
      );

      job.optimizedSize = optimizedSize;
      job.compressionRatio = ((job.originalSize - optimizedSize) / job.originalSize) * 100;
      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('job:completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      this.emit('job:failed', job);
    }

    return job;
  }

  async uploadToCDN(
    filePath: string,
    options: Partial<CDNUploadOptions> = {}
  ): Promise<string> {
    const defaultOptions: CDNUploadOptions = {
      bucket: process.env.CDN_BUCKET || 'upcoach-cdn',
      prefix: 'assets',
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: this.getContentType(filePath),
      acl: 'public-read',
      metadata: {},
    };

    const opts = { ...defaultOptions, ...options };

    const fileBuffer = await fs.readFile(filePath);
    const hash = this.calculateHash(fileBuffer);
    const ext = path.extname(filePath);
    const key = `${opts.prefix}/${hash}${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: opts.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: opts.contentType,
        CacheControl: opts.cacheControl,
        ACL: opts.acl,
        Metadata: opts.metadata,
      })
    );

    const cdnUrl = `https://${opts.bucket}.s3.amazonaws.com/${key}`;

    this.manifest.assets[filePath] = {
      original: filePath,
      optimized: [cdnUrl],
      hash,
      size: fileBuffer.length,
      type: opts.contentType,
    };

    await this.saveManifest();

    return cdnUrl;
  }

  async batchOptimize(
    filePaths: string[],
    assetType: 'image' | 'video' | 'javascript' | 'css' | 'font'
  ): Promise<AssetOptimizationJob[]> {
    const jobs: AssetOptimizationJob[] = [];

    for (const filePath of filePaths) {
      this.processingQueue.push(filePath);
    }

    while (this.processingQueue.length > 0 || this.currentlyProcessing > 0) {
      if (
        this.currentlyProcessing < this.maxConcurrent &&
        this.processingQueue.length > 0
      ) {
        const filePath = this.processingQueue.shift()!;
        this.currentlyProcessing++;

        let job: AssetOptimizationJob;

        switch (assetType) {
          case 'image':
            job = await this.optimizeImage(filePath);
            break;
          case 'video':
            job = await this.optimizeVideo(filePath);
            break;
          case 'javascript':
            job = await this.optimizeJavaScript(filePath);
            break;
          case 'css':
            job = await this.optimizeCSS(filePath);
            break;
          case 'font':
            job = await this.optimizeFont(filePath);
            break;
          default:
            throw new Error(`Unknown asset type: ${assetType}`);
        }

        jobs.push(job);
        this.currentlyProcessing--;
      } else {
        await this.sleep(100);
      }
    }

    return jobs;
  }

  async cleanupOldVersions(keepVersions: number = 3): Promise<void> {
    const assetsByOriginal: Record<string, AssetManifestEntry[]> = {};

    for (const [original, entry] of Object.entries(this.manifest.assets)) {
      if (!assetsByOriginal[entry.original]) {
        assetsByOriginal[entry.original] = [];
      }
      assetsByOriginal[entry.original].push(entry);
    }

    for (const [original, entries] of Object.entries(assetsByOriginal)) {
      if (entries.length > keepVersions) {
        const toDelete = entries.slice(keepVersions);

        for (const entry of toDelete) {
          for (const optimizedUrl of entry.optimized) {
            await this.deleteFromCDN(optimizedUrl);
          }
          delete this.manifest.assets[original];
        }
      }
    }

    await this.saveManifest();
  }

  private async createJob(
    filePath: string,
    assetType: 'image' | 'video' | 'javascript' | 'css' | 'font'
  ): Promise<AssetOptimizationJob> {
    const stats = await fs.stat(filePath);
    const jobId = this.generateId();

    const job: AssetOptimizationJob = {
      id: jobId,
      assetId: this.calculateHash(await fs.readFile(filePath)),
      assetType,
      filePath,
      status: 'processing',
      originalSize: stats.size,
      optimizedSize: 0,
      compressionRatio: 0,
      startedAt: new Date(),
      metadata: {},
    };

    this.jobs.set(jobId, job);
    return job;
  }

  private async convertImageFormat(
    image: sharp.Sharp,
    originalPath: string,
    format: 'webp' | 'avif' | 'jpeg' | 'png',
    options: ImageOptimizationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const outputPath = originalPath.replace(/\.[^.]+$/, `.${format}`);

    let sharpInstance = image.clone();

    if (options.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata({
        exif: {},
        icc: undefined,
      });
    }

    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: options.quality,
          lossless: options.lossless,
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality: options.quality,
          lossless: options.lossless,
        });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: options.quality,
          mozjpeg: true,
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: options.quality,
          compressionLevel: 9,
        });
        break;
    }

    await sharpInstance.toFile(outputPath);
    const stats = await fs.stat(outputPath);

    files.push({
      path: outputPath,
      size: stats.size,
      format,
    });

    return files;
  }

  private async generateResponsiveImages(
    filePath: string,
    sizes: number[],
    options: ImageOptimizationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const width of sizes) {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      if (metadata.width && metadata.width < width) {
        continue;
      }

      const resizedPath = filePath.replace(
        /(\.[^.]+)$/,
        `-${width}w$1`
      );

      await image
        .resize(width, undefined, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(resizedPath);

      const stats = await fs.stat(resizedPath);

      files.push({
        path: resizedPath,
        size: stats.size,
        format: path.extname(resizedPath).substring(1),
        width,
      });
    }

    return files;
  }

  private async applySmartCrop(
    image: sharp.Sharp,
    metadata: sharp.Metadata
  ): Promise<void> {
    if (!metadata.width || !metadata.height) return;

    const targetAspectRatio = 16 / 9;
    const currentAspectRatio = metadata.width / metadata.height;

    if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.1) {
      const targetWidth = metadata.width;
      const targetHeight = Math.round(targetWidth / targetAspectRatio);

      await image.resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'attention',
      });
    }
  }

  private async generateBlurHash(imageBuffer: Buffer): Promise<string> {
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    const blurHash = encodeBlurHash(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      4
    );

    return blurHash;
  }

  private async getVideoInfo(filePath: string): Promise<{
    duration: number;
    bitrate: number;
  }> {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format "${filePath}"`
    );

    const info = JSON.parse(stdout);
    return {
      duration: parseFloat(info.format.duration),
      bitrate: parseInt(info.format.bit_rate, 10),
    };
  }

  private async transcodeVideo(
    filePath: string,
    format: 'h264' | 'h265' | 'vp9' | 'av1',
    quality: string,
    crf: number
  ): Promise<string> {
    const outputPath = filePath.replace(
      /\.[^.]+$/,
      `-${format}-${quality}.mp4`
    );

    const codecMap = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9',
      av1: 'libaom-av1',
    };

    const resolutionMap: Record<string, string> = {
      '360p': '640:360',
      '720p': '1280:720',
      '1080p': '1920:1080',
      '4k': '3840:2160',
    };

    await execAsync(
      `ffmpeg -i "${filePath}" -c:v ${codecMap[format]} -crf ${crf} -vf scale=${resolutionMap[quality]} -c:a aac -b:a 128k "${outputPath}"`
    );

    return outputPath;
  }

  private async generateHLS(
    filePath: string,
    qualities: string[]
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const outputDir = path.join(path.dirname(filePath), 'hls');
    await fs.mkdir(outputDir, { recursive: true });

    const variantPlaylists: string[] = [];

    for (const quality of qualities) {
      const outputPath = path.join(outputDir, `${quality}.m3u8`);

      await execAsync(
        `ffmpeg -i "${filePath}" -vf scale=${this.getQualityResolution(quality)} -c:v libx264 -c:a aac -hls_time 4 -hls_playlist_type vod "${outputPath}"`
      );

      const stats = await fs.stat(outputPath);
      files.push({
        path: outputPath,
        size: stats.size,
        format: 'hls',
      });

      variantPlaylists.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${this.getQualityBandwidth(quality)},RESOLUTION=${this.getQualityResolution(quality)}\n${quality}.m3u8`
      );
    }

    const masterPlaylist = path.join(outputDir, 'master.m3u8');
    await fs.writeFile(
      masterPlaylist,
      `#EXTM3U\n${variantPlaylists.join('\n')}`
    );

    const stats = await fs.stat(masterPlaylist);
    files.push({
      path: masterPlaylist,
      size: stats.size,
      format: 'hls',
    });

    return files;
  }

  private async generateDASH(
    filePath: string,
    qualities: string[]
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const outputDir = path.join(path.dirname(filePath), 'dash');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'manifest.mpd');

    await execAsync(
      `ffmpeg -i "${filePath}" -c:v libx264 -c:a aac -f dash "${outputPath}"`
    );

    const stats = await fs.stat(outputPath);
    files.push({
      path: outputPath,
      size: stats.size,
      format: 'dash',
    });

    return files;
  }

  private async generateVideoThumbnails(
    filePath: string,
    count: number
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const videoInfo = await this.getVideoInfo(filePath);
    const interval = videoInfo.duration / count;

    for (let i = 0; i < count; i++) {
      const timestamp = i * interval;
      const outputPath = filePath.replace(
        /\.[^.]+$/,
        `-thumb-${i}.jpg`
      );

      await execAsync(
        `ffmpeg -ss ${timestamp} -i "${filePath}" -vframes 1 "${outputPath}"`
      );

      const stats = await fs.stat(outputPath);
      files.push({
        path: outputPath,
        size: stats.size,
        format: 'jpeg',
      });
    }

    return files;
  }

  private async normalizeAudio(filePath: string, targetLUFS: number): Promise<void> {
    const tempFile = filePath.replace(/\.[^.]+$/, '-normalized.mp4');

    await execAsync(
      `ffmpeg -i "${filePath}" -af loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11 "${tempFile}"`
    );

    await fs.rename(tempFile, filePath);
  }

  private async bundleWithRollup(
    filePath: string,
    options: JSCSSOptimizationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const outputPath = filePath.replace(/\.js$/, '.bundle.js');
    await execAsync(
      `npx rollup "${filePath}" --format esm --file "${outputPath}"`
    );

    const stats = await fs.stat(outputPath);
    files.push({
      path: outputPath,
      size: stats.size,
      format: 'js',
    });

    return files;
  }

  private async compressBrotli(filePaths: string[]): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const filePath of filePaths) {
      const outputPath = `${filePath}.br`;

      await execAsync(`brotli -q 11 -o "${outputPath}" "${filePath}"`);

      const stats = await fs.stat(outputPath);
      files.push({
        path: outputPath,
        size: stats.size,
        format: 'br',
      });
    }

    return files;
  }

  private async extractCriticalCSS(css: string): Promise<string> {
    const lines = css.split('\n');
    const critical = lines.slice(0, Math.floor(lines.length * 0.2));
    return critical.join('\n');
  }

  private async subsetFont(filePath: string, characters: string): Promise<string> {
    const outputPath = filePath.replace(/\.[^.]+$/, '-subset.ttf');

    await execAsync(
      `pyftsubset "${filePath}" --text="${characters}" --output-file="${outputPath}"`
    );

    return outputPath;
  }

  private async convertToWOFF2(filePath: string): Promise<string> {
    const outputPath = filePath.replace(/\.[^.]+$/, '.woff2');

    await execAsync(`woff2_compress "${filePath}"`);

    return outputPath;
  }

  private async subsetFontByUnicodeRange(
    filePath: string,
    range: string
  ): Promise<string> {
    const outputPath = filePath.replace(
      /\.[^.]+$/,
      `-${range.replace(/[^a-zA-Z0-9]/g, '')}.woff2`
    );

    await execAsync(
      `pyftsubset "${filePath}" --unicodes="${range}" --flavor=woff2 --output-file="${outputPath}"`
    );

    return outputPath;
  }

  private async deleteFromCDN(url: string): Promise<void> {
    const key = url.split('.com/')[1];

    if (!key) return;

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CDN_BUCKET || 'upcoach-cdn',
        Key: key,
      })
    );
  }

  private async loadManifest(): Promise<void> {
    try {
      const manifestPath = path.join(process.cwd(), 'asset-manifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestData);
    } catch (error) {
      console.log('No existing manifest found, creating new one');
    }
  }

  private async saveManifest(): Promise<void> {
    const manifestPath = path.join(process.cwd(), 'asset-manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf-8'
    );
  }

  private calculateHash(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  private getQualityHeight(quality: string): number {
    const heights: Record<string, number> = {
      '360p': 360,
      '720p': 720,
      '1080p': 1080,
      '4k': 2160,
    };

    return heights[quality] || 720;
  }

  private getQualityResolution(quality: string): string {
    const resolutions: Record<string, string> = {
      '360p': '640:360',
      '720p': '1280:720',
      '1080p': '1920:1080',
      '4k': '3840:2160',
    };

    return resolutions[quality] || '1280:720';
  }

  private getQualityBandwidth(quality: string): number {
    const bandwidths: Record<string, number> = {
      '360p': 800000,
      '720p': 2500000,
      '1080p': 5000000,
      '4k': 20000000,
    };

    return bandwidths[quality] || 2500000;
  }

  private generateId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getJob(jobId: string): AssetOptimizationJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): AssetOptimizationJob[] {
    return Array.from(this.jobs.values());
  }

  getManifest(): AssetManifest {
    return this.manifest;
  }
}

export default AssetOptimizer;
export {
  AssetOptimizationJob,
  ImageOptimizationOptions,
  VideoOptimizationOptions,
  JSCSSOptimizationOptions,
  FontOptimizationOptions,
  CDNUploadOptions,
  AssetManifest,
};
