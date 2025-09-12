"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUploadedFile = exports.validateUpload = exports.secureUpload = exports.SecureUploadMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const file_type_1 = require("file-type");
const multer_1 = __importStar(require("multer"));
const logger_1 = require("../utils/logger");
const ALLOWED_TYPES = {
    images: {
        mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 10 * 1024 * 1024,
    },
    documents: {
        mimes: ['application/pdf', 'text/plain', 'text/csv'],
        extensions: ['.pdf', '.txt', '.csv'],
        maxSize: 25 * 1024 * 1024,
    },
    videos: {
        mimes: ['video/mp4', 'video/webm'],
        extensions: ['.mp4', '.webm'],
        maxSize: 100 * 1024 * 1024,
    },
    audio: {
        mimes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        extensions: ['.mp3', '.wav', '.ogg'],
        maxSize: 50 * 1024 * 1024,
    },
};
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
    '.svg',
    '.xml',
];
class SecureUploadMiddleware {
    static uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
    static async validateFileContent(buffer, declaredMimeType, originalName) {
        try {
            const ext = path_1.default.extname(originalName).toLowerCase();
            if (BLOCKED_EXTENSIONS.includes(ext)) {
                return {
                    isValid: false,
                    error: `File extension ${ext} is not allowed for security reasons`,
                };
            }
            const detectedType = await (0, file_type_1.fileTypeFromBuffer)(buffer);
            if (!detectedType) {
                if (declaredMimeType === 'text/plain' || declaredMimeType === 'text/csv') {
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
            const isAllowed = Object.values(ALLOWED_TYPES).some(category => category.mimes.includes(declaredMimeType));
            if (!isAllowed) {
                return {
                    isValid: false,
                    error: `File type ${declaredMimeType} is not allowed`,
                };
            }
            if (declaredMimeType.startsWith('image/')) {
                const imageCheck = await this.validateImageSecurity(buffer);
                if (!imageCheck.isValid) {
                    return imageCheck;
                }
            }
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
    static isValidTextFile(buffer) {
        try {
            const text = buffer.toString('utf-8');
            if (text.includes('\0')) {
                return false;
            }
            const printableChars = text.match(/[\x20-\x7E\t\n\r]/g);
            const printableRatio = printableChars ? printableChars.length / text.length : 0;
            return printableRatio > 0.95;
        }
        catch {
            return false;
        }
    }
    static async validateImageSecurity(buffer) {
        try {
            const bufferString = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
            const scriptPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i,
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
    static sanitizeFileName(fileName) {
        const baseName = path_1.default.basename(fileName);
        const uniqueId = crypto_1.default.randomBytes(8).toString('hex');
        const ext = path_1.default.extname(baseName).toLowerCase();
        const safeName = baseName
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 50);
        return `${safeName}_${uniqueId}${ext}`;
    }
    static getFileSizeLimit(mimeType) {
        for (const category of Object.values(ALLOWED_TYPES)) {
            if (category.mimes.includes(mimeType)) {
                return category.maxSize;
            }
        }
        return 5 * 1024 * 1024;
    }
    static createUploadMiddleware(options) {
        const storage = (0, multer_1.memoryStorage)();
        return (0, multer_1.default)({
            storage,
            limits: {
                fileSize: options?.maxFileSize || 100 * 1024 * 1024,
                files: options?.maxFiles || 10,
            },
            fileFilter: async (req, file, callback) => {
                try {
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
    static async validateUploadedFile(req, res, next) {
        try {
            if (!req.file && !req.files) {
                next();
                return;
            }
            const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
            for (const file of files) {
                const validation = await this.validateFileContent(file.buffer, file.mimetype, file.originalname);
                if (!validation.isValid) {
                    res.status(400).json({
                        error: 'File validation failed',
                        message: validation.error,
                    });
                    return;
                }
                const maxSize = this.getFileSizeLimit(file.mimetype);
                if (file.size > maxSize) {
                    res.status(400).json({
                        error: 'File too large',
                        message: `File size ${file.size} exceeds maximum allowed size of ${maxSize}`,
                    });
                    return;
                }
                if (validation.sanitizedFileName) {
                    file.sanitizedFileName = validation.sanitizedFileName;
                }
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
    static async scanForVirus(buffer) {
        try {
            const malwareSignatures = [
                Buffer.from('4D5A', 'hex'),
                Buffer.from('7F454C46', 'hex'),
                Buffer.from('CAFEBABE', 'hex'),
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
    static async saveFile(file, subDir) {
        try {
            const sanitizedName = file.sanitizedFileName || this.sanitizeFileName(file.originalname);
            const uploadPath = path_1.default.join(this.uploadDir, subDir || '', sanitizedName);
            await promises_1.default.mkdir(path_1.default.dirname(uploadPath), { recursive: true });
            await promises_1.default.writeFile(uploadPath, file.buffer);
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
exports.secureUpload = SecureUploadMiddleware.createUploadMiddleware();
exports.validateUpload = SecureUploadMiddleware.validateUploadedFile.bind(SecureUploadMiddleware);
exports.saveUploadedFile = SecureUploadMiddleware.saveFile.bind(SecureUploadMiddleware);
//# sourceMappingURL=secureUpload.js.map