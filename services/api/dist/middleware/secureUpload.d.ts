import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
export declare class SecureUploadMiddleware {
    private static uploadDir;
    private static validateFileContent;
    private static isValidTextFile;
    private static validateImageSecurity;
    private static sanitizeFileName;
    private static getFileSizeLimit;
    static createUploadMiddleware(options?: {
        allowedTypes?: string[];
        maxFileSize?: number;
        maxFiles?: number;
    }): multer.Multer;
    static validateUploadedFile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static scanForVirus(buffer: Buffer): Promise<boolean>;
    static saveFile(file: Express.Multer.File, subDir?: string): Promise<string>;
}
export declare const secureUpload: multer.Multer;
export declare const validateUpload: typeof SecureUploadMiddleware.validateUploadedFile;
export declare const saveUploadedFile: typeof SecureUploadMiddleware.saveFile;
//# sourceMappingURL=secureUpload.d.ts.map