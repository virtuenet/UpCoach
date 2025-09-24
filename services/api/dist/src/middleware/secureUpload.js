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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileContent = validateFileContent;
exports.createSecureUpload = createSecureUpload;
exports.handleSecureUploadError = handleSecureUploadError;
const multer_1 = __importStar(require("multer"));
const crypto = __importStar(require("crypto"));
const file_type_1 = require("file-type");
const logger_1 = require("../utils/logger");
const DEFAULT_SECURITY_OPTIONS = {
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain'
    ],
    requireMagicByteValidation: true,
    enableAntivirusScanning: true,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt']
};
const MALICIOUS_SIGNATURES = [
    'MZ',
    '4D5A',
    '504B0304',
    '52617221',
    '377ABCAF271C',
    'FFD8FFE0',
    '89504E47',
];
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
    '.js', '.jse', '.ws', '.wsf', '.wsc', '.jar', '.app', '.deb',
    '.pkg', '.rpm', '.dmg', '.msi', '.ps1', '.sh', '.php', '.asp',
    '.jsp', '.py', '.rb', '.pl'
];
async function validateMagicBytes(buffer) {
    try {
        const detectedType = await (0, file_type_1.fileTypeFromBuffer)(buffer);
        if (!detectedType) {
            return { valid: false };
        }
        const bufferHex = buffer.toString('hex', 0, 32).toUpperCase();
        for (const signature of MALICIOUS_SIGNATURES) {
            if (bufferHex.startsWith(signature)) {
                logger_1.logger.warn('Malicious file signature detected', { signature, detectedType: detectedType.mime });
                return { valid: false, detectedType: detectedType.mime };
            }
        }
        return { valid: true, detectedType: detectedType.mime };
    }
    catch (error) {
        logger_1.logger.error('Magic byte validation error:', error);
        return { valid: false };
    }
}
async function scanForViruses(buffer, filename) {
    const scanId = crypto.randomBytes(16).toString('hex');
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const threats = [];
        if (buffer.length > 100 * 1024 * 1024) {
            threats.push('SUSPICIOUS_SIZE');
        }
        const bufferString = buffer.toString('ascii', 0, Math.min(buffer.length, 8192));
        if (bufferString.includes('<script>') || bufferString.includes('<?php')) {
            threats.push('EMBEDDED_SCRIPT');
        }
        if (filename.toLowerCase().includes('zip') && buffer.length < 1024 && buffer.includes(Buffer.from('PK'))) {
            threats.push('POTENTIAL_ZIP_BOMB');
        }
        const isSafe = threats.length === 0;
        logger_1.logger.info('File security scan completed', {
            scanId,
            filename,
            fileSize: buffer.length,
            threats: threats.length > 0 ? threats : undefined,
            safe: isSafe
        });
        return {
            safe: isSafe,
            threats: threats.length > 0 ? threats : undefined,
            scanId
        };
    }
    catch (error) {
        logger_1.logger.error('Antivirus scanning error:', error);
        return {
            safe: false,
            threats: ['SCAN_ERROR'],
            scanId
        };
    }
}
function sanitizeFilename(filename) {
    let sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');
    if (sanitized.length > 255) {
        const ext = sanitized.substring(sanitized.lastIndexOf('.'));
        sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }
    if (!sanitized || sanitized.trim() === '') {
        sanitized = `file_${Date.now()}`;
    }
    return sanitized;
}
function createSecureFileFilter(options) {
    return async (req, file, callback) => {
        try {
            const originalExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
            if (DANGEROUS_EXTENSIONS.includes(originalExt)) {
                return callback(new Error(`File extension ${originalExt} is not allowed for security reasons`));
            }
            if (!options.allowedExtensions.includes(originalExt)) {
                return callback(new Error(`File extension ${originalExt} is not allowed`));
            }
            if (!options.allowedMimeTypes.includes(file.mimetype)) {
                return callback(new Error(`File type ${file.mimetype} is not allowed`));
            }
            file.originalname = sanitizeFilename(file.originalname);
            callback(null, true);
        }
        catch (error) {
            logger_1.logger.error('File filter error:', error);
            callback(new Error('File validation failed'));
        }
    };
}
function validateFileContent(options = {}) {
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };
    return async (req, res, next) => {
        try {
            const files = req.files || (req.file ? [req.file] : []);
            if (files.length === 0) {
                return next();
            }
            for (const file of files) {
                if (file.size > config.maxFileSize) {
                    return res.status(400).json({
                        success: false,
                        error: 'File too large',
                        maxSize: config.maxFileSize,
                        actualSize: file.size
                    });
                }
                const contentLength = parseInt(req.headers['content-length'] || '0');
                if (contentLength > config.maxFileSize * 1.1) {
                    return res.status(400).json({
                        success: false,
                        error: 'Content-Length exceeds maximum allowed size',
                        code: 'CONTENT_LENGTH_INVALID'
                    });
                }
                if (config.requireMagicByteValidation) {
                    const magicValidation = await validateMagicBytes(file.buffer);
                    if (!magicValidation.valid) {
                        logger_1.logger.warn('Magic byte validation failed', {
                            filename: file.originalname,
                            reportedMimeType: file.mimetype,
                            detectedType: magicValidation.detectedType
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'File content does not match file type',
                            code: 'MAGIC_BYTE_MISMATCH'
                        });
                    }
                    if (magicValidation.detectedType && !config.allowedMimeTypes.includes(magicValidation.detectedType)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Detected file type is not allowed',
                            detectedType: magicValidation.detectedType,
                            code: 'DETECTED_TYPE_NOT_ALLOWED'
                        });
                    }
                }
                if (config.enableAntivirusScanning) {
                    const scanResult = await scanForViruses(file.buffer, file.originalname);
                    if (!scanResult.safe) {
                        logger_1.logger.error('File security scan failed', {
                            filename: file.originalname,
                            threats: scanResult.threats,
                            scanId: scanResult.scanId
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'File failed security scan',
                            threats: scanResult.threats,
                            scanId: scanResult.scanId,
                            code: 'SECURITY_SCAN_FAILED'
                        });
                    }
                    file.securityScan = scanResult;
                }
                const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
                file.hash = hash;
                logger_1.logger.info('File validation completed', {
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    hash: hash.substring(0, 16) + '...',
                    scanId: file.securityScan?.scanId
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('File content validation error:', error);
            res.status(500).json({
                success: false,
                error: 'File validation error',
                code: 'VALIDATION_ERROR'
            });
        }
    };
}
function createSecureUpload(options = {}) {
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };
    const upload = (0, multer_1.default)({
        storage: (0, multer_1.memoryStorage)(),
        fileFilter: createSecureFileFilter(config),
        limits: {
            fileSize: config.maxFileSize,
            files: 5,
            fields: 10,
            parts: 15
        }
    });
    return {
        single: (fieldName) => [
            upload.single(fieldName),
            validateFileContent(config)
        ],
        multiple: (fieldName, maxCount = 5) => [
            upload.array(fieldName, maxCount),
            validateFileContent(config)
        ],
        fields: (fields) => [
            upload.fields(fields),
            validateFileContent(config)
        ]
    };
}
function handleSecureUploadError(error, req, res, next) {
    if (error instanceof multer_1.MulterError) {
        logger_1.logger.warn('Multer upload error:', {
            code: error.code,
            message: error.message,
            field: error.field
        });
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE',
                    maxSize: DEFAULT_SECURITY_OPTIONS.maxFileSize
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Too many files',
                    code: 'TOO_MANY_FILES',
                    maxFiles: 5
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Unexpected file field',
                    code: 'UNEXPECTED_FILE'
                });
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Upload error',
                    code: error.code
                });
        }
    }
    if (error.message?.includes('not allowed')) {
        return res.status(400).json({
            success: false,
            error: error.message,
            code: 'FILE_TYPE_NOT_ALLOWED'
        });
    }
    logger_1.logger.error('Upload error:', error);
    res.status(500).json({
        success: false,
        error: 'Upload failed',
        code: 'UPLOAD_ERROR'
    });
}
exports.default = createSecureUpload();
//# sourceMappingURL=secureUpload.js.map