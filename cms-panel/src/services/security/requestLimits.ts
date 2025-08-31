/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Request Limits Service
 * Configures size limits, timeouts, and request constraints
 */

import { logger } from '../../utils/logger';

export interface RequestLimitsConfig {
  maxBodySize?: string | number; // Max request body size (e.g., '10mb')
  maxUrlLength?: number; // Max URL length
  maxHeaderSize?: number; // Max header size
  maxParameterCount?: number; // Max number of parameters
  maxFileSize?: string | number; // Max file upload size
  maxFiles?: number; // Max number of files in upload
  requestTimeout?: number; // Request timeout in ms
  uploadTimeout?: number; // Upload timeout in ms
  allowedMethods?: string[]; // Allowed HTTP methods
  allowedContentTypes?: string[]; // Allowed content types
  maxJsonDepth?: number; // Max JSON nesting depth
  maxArrayLength?: number; // Max array length in JSON
}

interface ParsedSize {
  value: number;
  unit: string;
}

class RequestLimitsService {
  private static instance: RequestLimitsService;
  private config: Required<RequestLimitsConfig>;
  private readonly DEFAULT_CONFIG: Required<RequestLimitsConfig> = {
    maxBodySize: '5mb',
    maxUrlLength: 2048,
    maxHeaderSize: 16384, // 16KB
    maxParameterCount: 1000,
    maxFileSize: '10mb',
    maxFiles: 10,
    requestTimeout: 30000, // 30 seconds
    uploadTimeout: 120000, // 2 minutes
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
      'text/html',
      'text/csv',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    maxJsonDepth: 10,
    maxArrayLength: 1000,
  };

  private constructor() {
    this.config = { ...this.DEFAULT_CONFIG };
  }

  static getInstance(): RequestLimitsService {
    if (!RequestLimitsService.instance) {
      RequestLimitsService.instance = new RequestLimitsService();
    }
    return RequestLimitsService.instance;
  }

  /**
   * Configure request limits
   */
  configure(config: RequestLimitsConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('Request limits configured', this.config);
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string | number): number {
    if (typeof size === 'number') {
      return size;
    }

    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);

    if (!match) {
      throw new Error(`Invalid size format: ${size}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';

    if (!units[unit]) {
      throw new Error(`Invalid size unit: ${unit}`);
    }

    return Math.floor(value * units[unit]);
  }

  /**
   * Check if request body size is within limits
   */
  checkBodySize(size: number): { valid: boolean; maxSize: number; error?: string } {
    const maxSize = this.parseSize(this.config.maxBodySize);

    if (size > maxSize) {
      return {
        valid: false,
        maxSize,
        error: `Request body too large. Maximum size is ${this.config.maxBodySize}`,
      };
    }

    return { valid: true, maxSize };
  }

  /**
   * Check if URL length is within limits
   */
  checkUrlLength(url: string): { valid: boolean; maxLength: number; error?: string } {
    if (url.length > this.config.maxUrlLength) {
      return {
        valid: false,
        maxLength: this.config.maxUrlLength,
        error: `URL too long. Maximum length is ${this.config.maxUrlLength} characters`,
      };
    }

    return { valid: true, maxLength: this.config.maxUrlLength };
  }

  /**
   * Check if file size is within limits
   */
  checkFileSize(size: number): { valid: boolean; maxSize: number; error?: string } {
    const maxSize = this.parseSize(this.config.maxFileSize);

    if (size > maxSize) {
      return {
        valid: false,
        maxSize,
        error: `File too large. Maximum size is ${this.config.maxFileSize}`,
      };
    }

    return { valid: true, maxSize };
  }

  /**
   * Check if HTTP method is allowed
   */
  checkMethod(method: string): { valid: boolean; error?: string } {
    const upperMethod = method.toUpperCase();

    if (!this.config.allowedMethods.includes(upperMethod)) {
      return {
        valid: false,
        error: `HTTP method ${upperMethod} is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if content type is allowed
   */
  checkContentType(contentType: string): { valid: boolean; error?: string } {
    // Extract base content type (without charset, etc.)
    const baseType = contentType.split(';')[0].trim().toLowerCase();

    // Check exact match or wildcard match
    const isAllowed = this.config.allowedContentTypes.some(allowed => {
      if (allowed === baseType) return true;
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return baseType.startsWith(prefix);
      }
      return false;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Content type ${baseType} is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Check JSON depth
   */
  checkJsonDepth(obj: any, maxDepth: number = this.config.maxJsonDepth): boolean {
    if (obj === null || typeof obj !== 'object') {
      return true;
    }

    let depth = 0;
    const stack: Array<{ obj: any; depth: number }> = [{ obj, depth: 0 }];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current.depth > maxDepth) {
        return false;
      }

      depth = Math.max(depth, current.depth);

      for (const value of Object.values(current.obj)) {
        if (value !== null && typeof value === 'object') {
          stack.push({ obj: value, depth: current.depth + 1 });
        }
      }
    }

    return true;
  }

  /**
   * Check array length in JSON
   */
  checkArrayLength(obj: any, maxLength: number = this.config.maxArrayLength): boolean {
    if (obj === null || typeof obj !== 'object') {
      return true;
    }

    const stack: any[] = [obj];

    while (stack.length > 0) {
      const current = stack.pop();

      if (Array.isArray(current) && current.length > maxLength) {
        return false;
      }

      for (const value of Object.values(current)) {
        if (value !== null && typeof value === 'object') {
          stack.push(value);
        }
      }
    }

    return true;
  }

  /**
   * Validate complete request
   */
  validateRequest(request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    bodySize?: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check method
    const methodCheck = this.checkMethod(request.method);
    if (!methodCheck.valid && methodCheck.error) {
      errors.push(methodCheck.error);
    }

    // Check URL length
    const urlCheck = this.checkUrlLength(request.url);
    if (!urlCheck.valid && urlCheck.error) {
      errors.push(urlCheck.error);
    }

    // Check content type
    if (request.headers?.['content-type']) {
      const contentTypeCheck = this.checkContentType(request.headers['content-type']);
      if (!contentTypeCheck.valid && contentTypeCheck.error) {
        errors.push(contentTypeCheck.error);
      }
    }

    // Check body size
    if (request.bodySize) {
      const bodySizeCheck = this.checkBodySize(request.bodySize);
      if (!bodySizeCheck.valid && bodySizeCheck.error) {
        errors.push(bodySizeCheck.error);
      }
    }

    // Check JSON structure if applicable
    if (request.body && typeof request.body === 'object') {
      if (!this.checkJsonDepth(request.body)) {
        errors.push(`JSON nesting depth exceeds maximum of ${this.config.maxJsonDepth}`);
      }

      if (!this.checkArrayLength(request.body)) {
        errors.push(`Array length exceeds maximum of ${this.config.maxArrayLength}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Express middleware
   */
  middleware(options?: Partial<RequestLimitsConfig>) {
    const config = { ...this.config, ...options };

    return (req: any, res: any, next: any) => {
      try {
        // Check method
        const methodCheck = this.checkMethod(req.method);
        if (!methodCheck.valid) {
          logger.warn(`Invalid HTTP method: ${req.method}`);
          return res.status(405).json({
            error: 'Method Not Allowed',
            message: methodCheck.error,
          });
        }

        // Check URL length
        const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const urlCheck = this.checkUrlLength(fullUrl);
        if (!urlCheck.valid) {
          logger.warn(`URL too long: ${fullUrl.length} characters`);
          return res.status(414).json({
            error: 'URI Too Long',
            message: urlCheck.error,
          });
        }

        // Check content type
        if (req.headers['content-type']) {
          const contentTypeCheck = this.checkContentType(req.headers['content-type']);
          if (!contentTypeCheck.valid) {
            logger.warn(`Invalid content type: ${req.headers['content-type']}`);
            return res.status(415).json({
              error: 'Unsupported Media Type',
              message: contentTypeCheck.error,
            });
          }
        }

        // Check body size (if body parser hasn't already)
        if (req.headers['content-length']) {
          const size = parseInt(req.headers['content-length'], 10);
          const bodySizeCheck = this.checkBodySize(size);
          if (!bodySizeCheck.valid) {
            logger.warn(`Request body too large: ${size} bytes`);
            return res.status(413).json({
              error: 'Payload Too Large',
              message: bodySizeCheck.error,
            });
          }
        }

        // Set request timeout
        const timeout = req.path.includes('upload') ? config.uploadTimeout : config.requestTimeout;

        req.setTimeout(timeout, () => {
          logger.warn(`Request timeout: ${req.method} ${req.path}`);
          res.status(408).json({
            error: 'Request Timeout',
            message: `Request exceeded timeout of ${timeout}ms`,
          });
        });

        next();
      } catch (error) {
        logger.error('Request limits middleware error', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate request limits',
        });
      }
    };
  }

  /**
   * File upload middleware
   */
  uploadMiddleware() {
    return (req: any, res: any, next: any) => {
      // This would be used with multer or similar
      req.uploadLimits = {
        fileSize: this.parseSize(this.config.maxFileSize),
        files: this.config.maxFiles,
      };

      next();
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<RequestLimitsConfig> {
    return { ...this.config };
  }

  /**
   * Create size limit string for display
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Export singleton instance
export const requestLimits = RequestLimitsService.getInstance();

// Export middleware factories
export const requestLimitsMiddleware = (options?: Partial<RequestLimitsConfig>) =>
  requestLimits.middleware(options);

export const uploadLimitsMiddleware = () => requestLimits.uploadMiddleware();
