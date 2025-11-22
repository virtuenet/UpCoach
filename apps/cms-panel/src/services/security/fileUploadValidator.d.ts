/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * File Upload Validation Service
 * Comprehensive security validation for file uploads
 */
export interface FileValidationConfig {
    allowedTypes?: string[];
    allowedExtensions?: string[];
    blockedExtensions?: string[];
    maxFileSize?: number;
    maxFilenameLength?: number;
    requireVirusScan?: boolean;
    checkMagicBytes?: boolean;
    sanitizeFilename?: boolean;
    generateUniqueNames?: boolean;
    maxFiles?: number;
}
interface FileValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedFilename?: string;
    detectedType?: string;
}
declare class FileUploadValidatorService {
    private static instance;
    private readonly DEFAULT_CONFIG;
    private readonly MAGIC_BYTES;
    private config;
    private constructor();
    static getInstance(): FileUploadValidatorService;
    /**
     * Configure validator
     */
    configure(config: FileValidationConfig): void;
    /**
     * Validate file upload
     */
    validateFile(file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer?: Buffer;
        path?: string;
    }): Promise<FileValidationResult>;
    /**
     * Validate multiple files
     */
    validateFiles(files: Array<{
        originalname: string;
        mimetype: string;
        size: number;
        buffer?: Buffer;
    }>): Promise<{
        valid: boolean;
        results: FileValidationResult[];
        totalSize: number;
        errors: string[];
    }>;
    /**
     * Validate filename
     */
    private validateFilename;
    /**
     * Get file extension
     */
    private getFileExtension;
    /**
     * Detect file type by magic bytes
     */
    private detectFileType;
    /**
     * Check if buffer appears to be text
     */
    private isTextFile;
    /**
     * Check for embedded threats
     */
    private checkForThreats;
    /**
     * Check if type is dangerous
     */
    private isDangerousType;
    /**
     * Generate unique filename
     */
    private generateUniqueFilename;
    /**
     * Format file size
     */
    private formatSize;
    /**
     * Express/Multer middleware
     */
    middleware(): (req: any, res: any, next: any) => Promise<any>;
}
export declare const fileUploadValidator: FileUploadValidatorService;
export declare const fileValidationMiddleware: () => (req: any, res: any, next: any) => Promise<any>;
export {};
//# sourceMappingURL=fileUploadValidator.d.ts.map