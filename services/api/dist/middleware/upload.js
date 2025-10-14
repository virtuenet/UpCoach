"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileTypeCategory = exports.validateFileSizes = exports.handleUploadError = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = exports.uploadMiddleware = void 0;
const tslib_1 = require("tslib");
const multer_1 = tslib_1.__importStar(require("multer"));
const storage = (0, multer_1.memoryStorage)();
const fileFilter = (req, file, callback) => {
    const allowedTypes = {
        images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-m4a'],
        documents: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ],
    };
    const allAllowedTypes = [
        ...allowedTypes.images,
        ...allowedTypes.videos,
        ...allowedTypes.audio,
        ...allowedTypes.documents,
    ];
    if (allAllowedTypes.includes(file.mimetype)) {
        callback(null, true);
    }
    else {
        callback(new Error(`File type ${file.mimetype} is not allowed`));
    }
};
const getFileSizeLimit = (mimetype) => {
    if (mimetype.startsWith('image/')) {
        return 10 * 1024 * 1024;
    }
    else if (mimetype.startsWith('video/')) {
        return 100 * 1024 * 1024;
    }
    else if (mimetype.startsWith('audio/')) {
        return 50 * 1024 * 1024;
    }
    else {
        return 25 * 1024 * 1024;
    }
};
const customFileSizeLimit = (req, file, callback) => {
    const _maxSize = getFileSizeLimit(file.mimetype);
    callback(null, true);
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, callback) => {
        fileFilter(req, file, (error) => {
            if (error) {
                callback(error);
                return;
            }
            customFileSizeLimit(req, file, callback);
        });
    },
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 10,
        fields: 10,
    },
});
const uploadSingle = (fieldName = 'file') => {
    return exports.uploadMiddleware.single(fieldName);
};
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
    return exports.uploadMiddleware.array(fieldName, maxCount);
};
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => {
    return exports.uploadMiddleware.fields(fields);
};
exports.uploadFields = uploadFields;
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 100MB.',
                    error: 'FILE_TOO_LARGE',
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum is 10 files per upload.',
                    error: 'TOO_MANY_FILES',
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field.',
                    error: 'UNEXPECTED_FILE',
                });
            case 'LIMIT_FIELD_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many form fields.',
                    error: 'TOO_MANY_FIELDS',
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error.',
                    error: error.code,
                });
        }
    }
    else if (error.message?.includes('File type')) {
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'INVALID_FILE_TYPE',
        });
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
const validateFileSizes = (req, res, next) => {
    const files = req.files;
    if (files && Array.isArray(files)) {
        for (const file of files) {
            const maxSize = getFileSizeLimit(file.mimetype);
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: `File "${file.originalname}" is too large. Maximum size for ${file.mimetype.split('/')[0]} files is ${Math.round(maxSize / 1024 / 1024)}MB.`,
                    error: 'FILE_TOO_LARGE',
                });
            }
        }
    }
    else if (req.file) {
        const maxSize = getFileSizeLimit(req.file.mimetype);
        if (req.file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `File "${req.file.originalname}" is too large. Maximum size for ${req.file.mimetype.split('/')[0]} files is ${Math.round(maxSize / 1024 / 1024)}MB.`,
                error: 'FILE_TOO_LARGE',
            });
        }
    }
    next();
};
exports.validateFileSizes = validateFileSizes;
const getFileTypeCategory = (mimetype) => {
    if (mimetype.startsWith('image/'))
        return 'image';
    if (mimetype.startsWith('video/'))
        return 'video';
    if (mimetype.startsWith('audio/'))
        return 'audio';
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text'))
        return 'document';
    return 'other';
};
exports.getFileTypeCategory = getFileTypeCategory;
exports.default = exports.uploadMiddleware;
