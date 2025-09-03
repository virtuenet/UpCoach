/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * File Upload Validation Service
 * Comprehensive security validation for file uploads
 */

import * as crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface FileValidationConfig {
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[]; // File extensions
  blockedExtensions?: string[]; // Explicitly blocked extensions
  maxFileSize?: number; // Max size in bytes
  maxFilenameLength?: number; // Max filename length
  requireVirusScan?: boolean; // Require virus scanning
  checkMagicBytes?: boolean; // Verify file type by magic bytes
  sanitizeFilename?: boolean; // Sanitize filename
  generateUniqueNames?: boolean; // Generate unique filenames
  maxFiles?: number; // Max files per upload
}

interface MagicByteSignature {
  bytes: number[];
  offset: number;
  mimeType: string;
}

interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename?: string;
  detectedType?: string;
}

class FileUploadValidatorService {
  private static instance: FileUploadValidatorService;

  private readonly DEFAULT_CONFIG: Required<FileValidationConfig> = {
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv', 'xlsx', 'docx'],
    blockedExtensions: [
      'exe',
      'bat',
      'cmd',
      'sh',
      'ps1',
      'vbs',
      'js',
      'jar',
      'com',
      'scr',
      'msi',
      'dll',
      'app',
      'deb',
      'rpm',
      'php',
      'asp',
      'aspx',
      'jsp',
      'cgi',
      'py',
      'rb',
      'pl',
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilenameLength: 255,
    requireVirusScan: false,
    checkMagicBytes: true,
    sanitizeFilename: true,
    generateUniqueNames: true,
    maxFiles: 10,
  };

  private readonly MAGIC_BYTES: MagicByteSignature[] = [
    // Images
    { bytes: [0xff, 0xd8, 0xff], offset: 0, mimeType: 'image/jpeg' },
    { bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0, mimeType: 'image/png' },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0, mimeType: 'image/gif' },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0, mimeType: 'image/gif' },
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'image/webp' }, // WEBP starts with RIFF

    // Documents
    { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0, mimeType: 'application/pdf' }, // %PDF
    { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0, mimeType: 'application/zip' }, // ZIP (docx, xlsx, etc.)

    // Executables (to block)
    { bytes: [0x4d, 0x5a], offset: 0, mimeType: 'application/x-msdownload' }, // EXE
    { bytes: [0x7f, 0x45, 0x4c, 0x46], offset: 0, mimeType: 'application/x-elf' }, // ELF
  ];

  private config: Required<FileValidationConfig>;

  private constructor() {
    this.config = { ...this.DEFAULT_CONFIG };
  }

  static getInstance(): FileUploadValidatorService {
    if (!FileUploadValidatorService.instance) {
      FileUploadValidatorService.instance = new FileUploadValidatorService();
    }
    return FileUploadValidatorService.instance;
  }

  /**
   * Configure validator
   */
  configure(config: FileValidationConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('File upload validator configured', {
      allowedTypes: this.config.allowedTypes.length,
      maxFileSize: this.config.maxFileSize,
    });
  }

  /**
   * Validate file upload
   */
  async validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
    path?: string;
  }): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const result: FileValidationResult = {
      valid: true,
      errors,
      warnings,
    };

    // 1. Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(
        `File size (${this.formatSize(file.size)}) exceeds maximum allowed size (${this.formatSize(this.config.maxFileSize)})`
      );
    }

    // 2. Check filename length
    if (file.originalname.length > this.config.maxFilenameLength) {
      errors.push(
        `Filename too long (${file.originalname.length} characters). Maximum is ${this.config.maxFilenameLength}`
      );
    }

    // 3. Validate and sanitize filename
    const filenameValidation = this.validateFilename(file.originalname);
    if (!filenameValidation.valid) {
      errors.push(...filenameValidation.errors);
    }
    result.sanitizedFilename = filenameValidation.sanitized;

    // 4. Check file extension
    const extension = this.getFileExtension(file.originalname);
    if (extension) {
      if (this.config.blockedExtensions.includes(extension.toLowerCase())) {
        errors.push(`File extension '.${extension}' is not allowed for security reasons`);
      } else if (
        this.config.allowedExtensions.length > 0 &&
        !this.config.allowedExtensions.includes(extension.toLowerCase())
      ) {
        errors.push(`File extension '.${extension}' is not in the allowed list`);
      }
    }

    // 5. Check MIME type
    if (this.config.allowedTypes.length > 0 && !this.config.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type '${file.mimetype}' is not allowed`);
    }

    // 6. Check magic bytes if buffer is available
    if (this.config.checkMagicBytes && file.buffer) {
      const detectedType = this.detectFileType(file.buffer);
      result.detectedType = detectedType;

      if (detectedType && detectedType !== file.mimetype) {
        warnings.push(
          `Declared MIME type (${file.mimetype}) doesn't match detected type (${detectedType})`
        );

        // Check if detected type is dangerous
        if (this.isDangerousType(detectedType)) {
          errors.push(`Detected dangerous file type: ${detectedType}`);
        }
      }
    }

    // 7. Check for embedded threats
    if (file.buffer) {
      const threats = this.checkForThreats(file.buffer);
      if (threats.length > 0) {
        errors.push(...threats);
      }
    }

    // 8. Generate unique filename if configured
    if (this.config.generateUniqueNames) {
      result.sanitizedFilename = this.generateUniqueFilename(
        result.sanitizedFilename || file.originalname
      );
    }

    result.valid = errors.length === 0;

    if (!result.valid) {
      logger.warn('File validation failed', {
        filename: file.originalname,
        errors,
      });
    }

    return result;
  }

  /**
   * Validate multiple files
   */
  async validateFiles(
    files: Array<{
      originalname: string;
      mimetype: string;
      size: number;
      buffer?: Buffer;
    }>
  ): Promise<{
    valid: boolean;
    results: FileValidationResult[];
    totalSize: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const results: FileValidationResult[] = [];
    let totalSize = 0;

    // Check file count
    if (files.length > this.config.maxFiles) {
      errors.push(`Too many files (${files.length}). Maximum is ${this.config.maxFiles}`);
    }

    // Validate each file
    for (const file of files) {
      const result = await this.validateFile(file);
      results.push(result);
      totalSize += file.size;
    }

    // Check total size
    const maxTotalSize = this.config.maxFileSize * this.config.maxFiles;
    if (totalSize > maxTotalSize) {
      errors.push(
        `Total file size (${this.formatSize(totalSize)}) exceeds maximum (${this.formatSize(maxTotalSize)})`
      );
    }

    const allValid = results.every(r => r.valid) && errors.length === 0;

    return {
      valid: allValid,
      results,
      totalSize,
      errors,
    };
  }

  /**
   * Validate filename
   */
  private validateFilename(filename: string): {
    valid: boolean;
    errors: string[];
    sanitized: string;
  } {
    const errors: string[] = [];
    let sanitized = filename;

    // Check for directory traversal attempts
    if (filename.includes('../') || filename.includes('..\\')) {
      errors.push('Filename contains directory traversal patterns');
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      errors.push('Filename contains null bytes');
    }

    // Check for control characters
    if (/[\x00-\x1F\x7F]/.test(filename)) {
      errors.push('Filename contains control characters');
    }

    // Sanitize filename if configured
    if (this.config.sanitizeFilename) {
      // Remove directory paths
      sanitized = sanitized.split(/[/\\]/).pop() || sanitized;

      // Replace dangerous characters
      sanitized = sanitized
        .replace(/[^\w\s.-]/g, '_') // Keep only safe characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Remove multiple underscores
        .replace(/^[.-]+/, '') // Remove leading dots/dashes
        .substring(0, this.config.maxFilenameLength);

      // Ensure filename is not empty
      if (!sanitized || sanitized === '_') {
        sanitized = 'file_' + Date.now();
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string | null {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return null;
  }

  /**
   * Detect file type by magic bytes
   */
  private detectFileType(buffer: Buffer): string | null {
    for (const signature of this.MAGIC_BYTES) {
      if (buffer.length < signature.offset + signature.bytes.length) {
        continue;
      }

      let match = true;
      for (let i = 0; i < signature.bytes.length; i++) {
        if (buffer[signature.offset + i] !== signature.bytes[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return signature.mimeType;
      }
    }

    // Check for text files
    if (this.isTextFile(buffer)) {
      return 'text/plain';
    }

    return null;
  }

  /**
   * Check if buffer appears to be text
   */
  private isTextFile(buffer: Buffer): boolean {
    const sample = buffer.slice(0, Math.min(512, buffer.length));

    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      // Check for non-printable characters (except common whitespace)
      if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
        return false;
      }
      if (byte === 0x00) {
        return false; // Null byte indicates binary
      }
    }

    return true;
  }

  /**
   * Check for embedded threats
   */
  private checkForThreats(buffer: Buffer): string[] {
    const threats: string[] = [];
    const content = buffer.toString('utf8', 0, Math.min(10000, buffer.length));

    // Check for embedded scripts
    const scriptPatterns = [
      /<script[\s>]/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/,
      /document\s*\./,
      /window\s*\./,
      /alert\s*\(/,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push(`File contains potentially malicious pattern: ${pattern.source}`);
      }
    }

    // Check for PHP tags
    if (/<\?php/i.test(content) || /<\?=/i.test(content)) {
      threats.push('File contains PHP code');
    }

    // Check for shell script indicators
    if (content.startsWith('#!/')) {
      threats.push('File appears to be a shell script');
    }

    return threats;
  }

  /**
   * Check if type is dangerous
   */
  private isDangerousType(mimeType: string): boolean {
    const dangerousTypes = [
      'application/x-msdownload',
      'application/x-elf',
      'application/x-sh',
      'application/x-httpd-php',
      'text/x-php',
      'text/x-python',
      'text/x-perl',
      'text/x-ruby',
      'text/x-shellscript',
    ];

    return dangerousTypes.includes(mimeType);
  }

  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = this.getFileExtension(originalName);

    const baseName = originalName
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[^\w-]/g, '_') // Sanitize
      .substring(0, 50); // Limit length

    if (extension) {
      return `${baseName}_${timestamp}_${random}.${extension}`;
    }

    return `${baseName}_${timestamp}_${random}`;
  }

  /**
   * Format file size
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Express/Multer middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      if (!req.file && !req.files) {
        return next();
      }

      try {
        // Handle single file
        if (req.file) {
          const result = await this.validateFile(req.file);

          if (!result.valid) {
            return res.status(400).json({
              error: 'File validation failed',
              errors: result.errors,
              warnings: result.warnings,
            });
          }

          // Update filename if sanitized
          if (result.sanitizedFilename) {
            req.file.sanitizedFilename = result.sanitizedFilename;
          }
        }

        // Handle multiple files
        if (req.files) {
          const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
          const validation = await this.validateFiles(files as any);

          if (!validation.valid) {
            return res.status(400).json({
              error: 'File validation failed',
              errors: validation.errors,
              results: validation.results,
            });
          }

          // Update filenames if sanitized
          files.forEach((file: any, index: number) => {
            if (validation.results[index]?.sanitizedFilename) {
              file.sanitizedFilename = validation.results[index].sanitizedFilename;
            }
          });
        }

        next();
      } catch (error) {
        logger.error('File validation middleware error', error);
        res.status(500).json({
          error: 'File validation error',
          message: 'Failed to validate uploaded files',
        });
      }
    };
  }
}

// Export singleton instance
export const fileUploadValidator = FileUploadValidatorService.getInstance();

// Export middleware
export const fileValidationMiddleware = () => fileUploadValidator.middleware();
