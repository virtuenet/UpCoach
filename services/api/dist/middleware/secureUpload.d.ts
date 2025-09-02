import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
export declare class SecureUploadMiddleware {
    private static uploadDir;
    /**
     * Validate file content using magic bytes
     */
    private static validateFileContent;
    /**
     * Check if buffer contains valid text
     */
    private static isValidTextFile;
    /**
     * Validate image files for security issues
     */
    private static validateImageSecurity;
    /**
     * Sanitize filename to prevent directory traversal
     */
    private static sanitizeFileName;
    /**
     * Get file size limit based on type
     */
    private static getFileSizeLimit;
    /**
     * Create secure multer configuration
     */
    static createUploadMiddleware(options?: {
        allowedTypes?: string[];
        maxFileSize?: number;
        maxFiles?: number;
    }): multer.Multer;
    /**
     * Post-upload validation middleware
     */
    static validateUploadedFile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Virus scanning integration (placeholder)
     */
    static scanForVirus(buffer: Buffer): Promise<boolean>;
    /**
     * Save file securely
     */
    static saveFile(file: Express.Multer.File, subDir?: string): Promise<string>;
}
export declare const secureUpload: multer.Multer;
export declare const validateUpload: any;
export declare const saveUploadedFile: any;
//# sourceMappingURL=secureUpload.d.ts.map