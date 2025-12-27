/**
 * Response Compression Middleware
 * Phase 12 Week 1
 *
 * Compresses API responses with intelligent content-type detection
 * and size thresholds for optimal performance
 */

import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

export interface CompressionConfig {
  threshold: number; // Minimum bytes to compress
  level?: number; // 1-9 for gzip, 0-11 for brotli
  preferBrotli?: boolean; // Prefer brotli over gzip when supported
  compressibleTypes?: string[]; // MIME types to compress
  excludePaths?: string[]; // Paths to exclude from compression
}

export interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  gzipCount: number;
  brotliCount: number;
  bytesSaved: number;
  averageRatio: number; // Compression ratio percentage
}

export class CompressionMiddleware {
  private stats: CompressionStats;
  private config: Required<CompressionConfig>;
  private ratios: number[] = [];
  private readonly MAX_RATIO_SAMPLES = 1000;

  private readonly DEFAULT_COMPRESSIBLE_TYPES = [
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-font-ttf',
    'application/x-font-opentype',
    'application/vnd.ms-fontobject',
    'image/svg+xml',
    'image/x-icon'
  ];

  constructor(config: CompressionConfig) {
    this.config = {
      threshold: config.threshold || 1024, // 1KB default
      level: config.level ?? 6,
      preferBrotli: config.preferBrotli ?? true,
      compressibleTypes: config.compressibleTypes || this.DEFAULT_COMPRESSIBLE_TYPES,
      excludePaths: config.excludePaths || []
    };

    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      gzipCount: 0,
      brotliCount: 0,
      bytesSaved: 0,
      averageRatio: 0
    };
  }

  /**
   * Express middleware for response compression
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      this.stats.totalRequests++;

      // Skip if path is excluded
      if (this.shouldSkip(req.path)) {
        return next();
      }

      // Store original methods
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      // Override res.send
      res.send = (body: any) => {
        return this.compressResponse(req, res, body, originalSend);
      };

      // Override res.json
      res.json = (body: any) => {
        res.setHeader('Content-Type', 'application/json');
        return this.compressResponse(req, res, JSON.stringify(body), originalSend);
      };

      next();
    };
  }

  /**
   * Compress response data
   */
  private async compressResponse(
    req: Request,
    res: Response,
    body: any,
    originalSend: Function
  ): Promise<Response> {
    // Convert body to Buffer
    const buffer = Buffer.isBuffer(body)
      ? body
      : Buffer.from(String(body), 'utf8');

    // Skip compression if body too small
    if (buffer.length < this.config.threshold) {
      return originalSend(body);
    }

    // Skip if content-type not compressible
    const contentType = res.getHeader('Content-Type') as string || '';
    if (!this.isCompressible(contentType)) {
      return originalSend(body);
    }

    // Determine compression method based on Accept-Encoding header
    const acceptEncoding = req.header('Accept-Encoding') || '';
    let compressed: Buffer | null = null;
    let encoding: string | null = null;

    try {
      if (this.config.preferBrotli && acceptEncoding.includes('br')) {
        // Use Brotli compression
        compressed = await brotli(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.level
          }
        });
        encoding = 'br';
        this.stats.brotliCount++;
      } else if (acceptEncoding.includes('gzip')) {
        // Use Gzip compression
        compressed = await gzip(buffer, { level: this.config.level });
        encoding = 'gzip';
        this.stats.gzipCount++;
      }

      // If compression succeeded and saved bytes
      if (compressed && compressed.length < buffer.length) {
        const bytesSaved = buffer.length - compressed.length;
        const ratio = (bytesSaved / buffer.length) * 100;

        this.updateStats(bytesSaved, ratio);

        res.setHeader('Content-Encoding', encoding!);
        res.setHeader('Content-Length', compressed.length);
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('X-Original-Size', buffer.length);
        res.setHeader('X-Compressed-Size', compressed.length);
        res.setHeader('X-Compression-Ratio', `${ratio.toFixed(2)}%`);

        return originalSend(compressed);
      }
    } catch (error) {
      // Compression failed, send uncompressed
      console.error('Compression error:', error);
    }

    // Send uncompressed if compression failed or didn't save bytes
    return originalSend(body);
  }

  /**
   * Check if path should skip compression
   */
  private shouldSkip(path: string): boolean {
    return this.config.excludePaths.some(excludePath =>
      path.startsWith(excludePath)
    );
  }

  /**
   * Check if content-type is compressible
   */
  private isCompressible(contentType: string): boolean {
    if (!contentType) return false;

    return this.config.compressibleTypes.some(type =>
      contentType.toLowerCase().includes(type)
    );
  }

  /**
   * Update compression statistics
   */
  private updateStats(bytesSaved: number, ratio: number): void {
    this.stats.compressedRequests++;
    this.stats.bytesSaved += bytesSaved;

    this.ratios.push(ratio);
    if (this.ratios.length > this.MAX_RATIO_SAMPLES) {
      this.ratios.shift();
    }

    this.stats.averageRatio = this.calculateAverageRatio();
  }

  /**
   * Calculate average compression ratio
   */
  private calculateAverageRatio(): number {
    if (this.ratios.length === 0) return 0;

    const sum = this.ratios.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.ratios.length) * 100) / 100;
  }

  /**
   * Get compression statistics
   */
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      gzipCount: 0,
      brotliCount: 0,
      bytesSaved: 0,
      averageRatio: 0
    };
    this.ratios = [];
  }
}

/**
 * Create compression middleware with default config
 */
export function createCompressionMiddleware(config?: Partial<CompressionConfig>) {
  const middleware = new CompressionMiddleware({
    threshold: 1024, // 1KB
    level: 6,
    preferBrotli: true,
    ...config
  });

  return middleware.middleware();
}

/**
 * Singleton compression manager
 */
export class CompressionManager {
  private static instance: CompressionMiddleware;

  static initialize(config: CompressionConfig): void {
    if (this.instance) {
      throw new Error('Compression manager already initialized');
    }

    this.instance = new CompressionMiddleware(config);
  }

  static getInstance(): CompressionMiddleware {
    if (!this.instance) {
      throw new Error('Compression manager not initialized');
    }

    return this.instance;
  }

  static getStats(): CompressionStats {
    return this.getInstance().getStats();
  }
}
