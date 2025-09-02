"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUploadedFile = exports.validateUpload = exports.secureUpload = exports.SecureUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const file_type_1 = require("file-type");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
// Define allowed MIME types with their magic bytes
const ALLOWED_TYPES = {
    images: {
        mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    documents: {
        mimes: ['application/pdf', 'text/plain', 'text/csv'],
        extensions: ['.pdf', '.txt', '.csv'],
        maxSize: 25 * 1024 * 1024, // 25MB
    },
    videos: {
        mimes: ['video/mp4', 'video/webm'],
        extensions: ['.mp4', '.webm'],
        maxSize: 100 * 1024 * 1024, // 100MB
    },
    audio: {
        mimes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        extensions: ['.mp3', '.wav', '.ogg'],
        maxSize: 50 * 1024 * 1024, // 50MB
    },
};
// Dangerous file extensions that should never be allowed
const BLOCKED_EXTENSIONS = [
    '.exe',
    '.dll',
    '.scr',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.js',
    '.jar',
    '.app',
    '.deb',
    '.rpm',
    '.msi',
    '.pkg',
    '.php',
    '.jsp',
    '.asp',
    '.aspx',
    '.py',
    '.rb',
    '.sh',
    '.ps1',
    '.vbs',
    '.vb',
    '.wsf',
    '.hta',
    '.htm',
    '.html',
    '.svg', // Can contain scripts
    '.xml', // Can be used for XXE attacks
];
class SecureUploadMiddleware {
    static uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
    /**
     * Validate file content using magic bytes
     */
    static async validateFileContent(buffer, declaredMimeType, originalName) {
        try {
            // Check file extension first
            const ext = path_1.default.extname(originalName).toLowerCase();
            if (BLOCKED_EXTENSIONS.includes(ext)) {
                return {
                    isValid: false,
                    error: `File extension ${ext} is not allowed for security reasons`,
                };
            }
            // Detect actual file type from buffer
            const detectedType = await (0, file_type_1.fileTypeFromBuffer)(buffer);
            if (!detectedType) {
                // Some text files might not have magic bytes
                if (declaredMimeType === 'text/plain' || declaredMimeType === 'text/csv') {
                    // Additional validation for text files
                    const isTextFile = this.isValidTextFile(buffer);
                    if (!isTextFile) {
                        return {
                            isValid: false,
                            error: 'File content does not match declared text type',
                        };
                    }
                }
                else {
                    return {
                        isValid: false,
                        error: 'Unable to determine file type from content',
                    };
                }
            }
            else {
                // Verify detected type matches declared type
                if (detectedType.mime !== declaredMimeType) {
                    logger_1.logger.warn('MIME type mismatch detected', {
                        declared: declaredMimeType,
                        detected: detectedType.mime,
                        fileName: originalName,
                    });
                    return {
                        isValid: false,
                        error: `File type mismatch. Declared: ${declaredMimeType}, Detected: ${detectedType.mime}`,
                    };
                }
            }
            // Check if the MIME type is allowed
            const isAllowed = Object.values(ALLOWED_TYPES).some(category => category.mimes.includes(declaredMimeType));
            if (!isAllowed) {
                return {
                    isValid: false,
                    error: `File type ${declaredMimeType} is not allowed`,
                };
            }
            // Additional security checks for specific file types
            if (declaredMimeType.startsWith('image/')) {
                const imageCheck = await this.validateImageSecurity(buffer);
                if (!imageCheck.isValid) {
                    return imageCheck;
                }
            }
            // Generate sanitized filename
            const sanitizedFileName = this.sanitizeFileName(originalName);
            return {
                isValid: true,
                sanitizedFileName,
                detectedMimeType: detectedType?.mime || declaredMimeType,
            };
        }
        catch (error) {
            logger_1.logger.error('File validation error', { error, fileName: originalName });
            return {
                isValid: false,
                error: 'File validation failed',
            };
        }
    }
    /**
     * Check if buffer contains valid text
     */
    static isValidTextFile(buffer) {
        try {
            const text = buffer.toString('utf-8');
            // Check for null bytes which shouldn't be in text files
            if (text.includes('\0')) {
                return false;
            }
            // Check if it's mostly printable characters
            const printableChars = text.match(/[\x20-\x7E\t\n\r]/g);
            const printableRatio = printableChars ? printableChars.length / text.length : 0;
            return printableRatio > 0.95; // At least 95% printable characters
        }
        catch {
            return false;
        }
    }
    /**
     * Validate image files for security issues
     */
    static async validateImageSecurity(buffer) {
        try {
            // Check for embedded scripts in image metadata
            const bufferString = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
            // Check for script tags or JavaScript
            const scriptPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i, // Event handlers
                /<iframe/i,
                /<embed/i,
                /<object/i,
            ];
            for (const pattern of scriptPatterns) {
                if (pattern.test(bufferString)) {
                    return {
                        isValid: false,
                        error: 'Image file contains potentially malicious content',
                    };
                }
            }
            // Check image dimensions to prevent decompression bombs
            // This would require an image processing library like sharp
            // For now, we'll just check file size in the main validation
            return { isValid: true };
        }
        catch (error) {
            logger_1.logger.error('Image security validation error', { error });
            return {
                isValid: false,
                error: 'Image security validation failed',
            };
        }
    }
    /**
     * Sanitize filename to prevent directory traversal
     */
    static sanitizeFileName(fileName) {
        // Remove any directory components
        const baseName = path_1.default.basename(fileName);
        // Generate unique identifier
        const uniqueId = crypto_1.default.randomBytes(8).toString('hex');
        // Get extension
        const ext = path_1.default.extname(baseName).toLowerCase();
        // Create safe filename
        const safeName = baseName
            .replace(ext, '') // Remove extension
            .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace unsafe chars
            .slice(0, 50); // Limit length
        return `${safeName}_${uniqueId}${ext}`;
    }
    /**
     * Get file size limit based on type
     */
    static getFileSizeLimit(mimeType) {
        for (const category of Object.values(ALLOWED_TYPES)) {
            if (category.mimes.includes(mimeType)) {
                return category.maxSize;
            }
        }
        return 5 * 1024 * 1024; // Default 5MB
    }
    /**
     * Create secure multer configuration
     */
    static createUploadMiddleware(options) {
        const storage = multer_1.default.memoryStorage();
        return (0, multer_1.default)({
            storage,
            limits: {
                fileSize: options?.maxFileSize || 100 * 1024 * 1024,
                files: options?.maxFiles || 10,
            },
            fileFilter: async (req, file, callback) => {
                try {
                    // Basic MIME type check (will be validated more thoroughly later)
                    const isAllowed = options?.allowedTypes
                        ? options.allowedTypes.includes(file.mimetype)
                        : Object.values(ALLOWED_TYPES).some(cat => cat.mimes.includes(file.mimetype));
                    if (!isAllowed) {
                        callback(new Error(`File type ${file.mimetype} is not allowed`));
                        return;
                    }
                    callback(null, true);
                }
                catch (error) {
                    callback(error);
                }
            },
        });
    }
    /**
     * Post-upload validation middleware
     */
    static async validateUploadedFile(req, res, next) {
        try {
            if (!req.file && !req.files) {
                next();
                return;
            }
            const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
            for (const file of files) {
                // Validate file content
                const validation = await this.validateFileContent(file.buffer, file.mimetype, file.originalname);
                if (!validation.isValid) {
                    res.status(400).json({
                        error: 'File validation failed',
                        message: validation.error,
                    });
                    return;
                }
                // Check file size
                const maxSize = this.getFileSizeLimit(file.mimetype);
                if (file.size > maxSize) {
                    res.status(400).json({
                        error: 'File too large',
                        message: `File size ${file.size} exceeds maximum allowed size of ${maxSize}`,
                    });
                    return;
                }
                // Update file object with sanitized name
                if (validation.sanitizedFileName) {
                    file.sanitizedFileName = validation.sanitizedFileName;
                }
                // Log successful upload
                logger_1.logger.info('File upload validated', {
                    originalName: file.originalname,
                    sanitizedName: validation.sanitizedFileName,
                    size: file.size,
                    mimeType: validation.detectedMimeType,
                    userId: req.user?.id,
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('File validation middleware error', { error });
            res.status(500).json({
                error: 'File validation error',
                message: 'An error occurred while validating the uploaded file',
            });
        }
    }
    /**
     * Virus scanning integration (placeholder)
     */
    static async scanForVirus(buffer) {
        try {
            // In production, integrate with ClamAV or similar
            // For now, we'll do basic checks
            // Check for known malware signatures (simplified)
            const malwareSignatures = [
                Buffer.from('4D5A', 'hex'), // PE executable
                Buffer.from('7F454C46', 'hex'), // ELF executable
                Buffer.from('CAFEBABE', 'hex'), // Java class file
            ];
            for (const signature of malwareSignatures) {
                if (buffer.slice(0, signature.length).equals(signature)) {
                    logger_1.logger.warn('Potential malware signature detected');
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Virus scan error', { error });
            return false;
        }
    }
    /**
     * Save file securely
     */
    static async saveFile(file, subDir) {
        try {
            const sanitizedName = file.sanitizedFileName || this.sanitizeFileName(file.originalname);
            const uploadPath = path_1.default.join(this.uploadDir, subDir || '', sanitizedName);
            // Ensure directory exists
            await promises_1.default.mkdir(path_1.default.dirname(uploadPath), { recursive: true });
            // Save file
            await promises_1.default.writeFile(uploadPath, file.buffer);
            // Set appropriate permissions (read-only for others)
            await promises_1.default.chmod(uploadPath, 0o644);
            logger_1.logger.info('File saved successfully', {
                path: uploadPath,
                originalName: file.originalname,
                savedName: sanitizedName,
            });
            return uploadPath;
        }
        catch (error) {
            logger_1.logger.error('File save error', { error });
            throw new Error('Failed to save file');
        }
    }
}
exports.SecureUploadMiddleware = SecureUploadMiddleware;
// Export convenience functions
exports.secureUpload = SecureUploadMiddleware.createUploadMiddleware();
exports.validateUpload = SecureUploadMiddleware.validateUploadedFile.bind(SecureUploadMiddleware);
exports.saveUploadedFile = SecureUploadMiddleware.saveFile.bind(SecureUploadMiddleware);
//# sourceMappingURL=secureUpload.js.map