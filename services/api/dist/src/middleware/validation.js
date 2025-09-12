"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateFileUpload = exports.preventSQLInjection = exports.sanitizeInput = exports.validators = exports.handleValidationErrors = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        logger_1.logger.warn('Validation errors', {
            path: req.path,
            errors: errors.array(),
            ip: req.ip,
        });
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param || 'unknown',
                message: err.msg || 'Validation error',
            })),
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
exports.handleValidationErrors = exports.validateRequest;
exports.validators = {
    id: (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID must be a positive integer').toInt(),
    uuid: (0, express_validator_1.param)('id').isUUID().withMessage('Invalid UUID format'),
    pagination: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Page must be between 1 and 1000')
            .toInt(),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
            .toInt(),
        (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
    ],
    search: (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
        .escape(),
    dateRange: [
        (0, express_validator_1.query)('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO 8601 format')
            .toDate(),
        (0, express_validator_1.query)('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO 8601 format')
            .toDate()
            .custom((endDate, { req }) => {
            const request = req;
            if (request.query?.startDate && endDate < new Date(request.query.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    ],
    email: (0, express_validator_1.body)('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Invalid email address')
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters'),
    password: (0, express_validator_1.body)('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
        .withMessage('Password must contain at least one special character')
        .custom(value => {
        if (/(.)\1{2,}/.test(value)) {
            throw new Error('Password should not contain 3 or more repeated characters');
        }
        const commonPasswords = [
            'password',
            '12345678',
            'qwerty',
            'abc123',
            'password123',
            'admin',
            'letmein',
        ];
        if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
            throw new Error('Password is too common. Please choose a more unique password');
        }
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(value)) {
            throw new Error('Password should not contain sequential characters');
        }
        return true;
    }),
    strongPassword: (0, express_validator_1.body)('password')
        .isLength({ min: 12, max: 128 })
        .withMessage('Strong passwords must be between 12 and 128 characters')
        .matches(/[A-Z].*[A-Z]/)
        .withMessage('Strong passwords must contain at least two uppercase letters')
        .matches(/[a-z].*[a-z]/)
        .withMessage('Strong passwords must contain at least two lowercase letters')
        .matches(/\d.*\d/)
        .withMessage('Strong passwords must contain at least two numbers')
        .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?].*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
        .withMessage('Strong passwords must contain at least two special characters')
        .custom(value => {
        if (/(.)\1{2,}/.test(value)) {
            throw new Error('Password should not contain 3 or more repeated characters');
        }
        const commonPasswords = [
            'password',
            '12345678',
            'qwerty',
            'abc123',
            'password123',
            'admin',
            'letmein',
        ];
        if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
            throw new Error('Password is too common. Please choose a more unique password');
        }
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(value)) {
            throw new Error('Password should not contain sequential characters');
        }
        return true;
    }),
    username: (0, express_validator_1.body)('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    phone: (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number'),
    url: (0, express_validator_1.body)('url')
        .optional()
        .trim()
        .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
    })
        .withMessage('Invalid URL format'),
    amount: (0, express_validator_1.body)('amount')
        .isFloat({ min: 0, max: 999999.99 })
        .withMessage('Amount must be between 0 and 999999.99')
        .toFloat(),
    percentage: (0, express_validator_1.body)('percentage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Percentage must be between 0 and 100')
        .toFloat(),
};
const sanitizeInput = (fields) => {
    return fields.map(field => (0, express_validator_1.body)(field)
        .trim()
        .escape()
        .customSanitizer(value => {
        if (typeof value === 'string') {
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
                .replace(/on\w+\s*=\s*'[^']*'/gi, '')
                .replace(/javascript:/gi, '');
        }
        return value;
    }));
};
exports.sanitizeInput = sanitizeInput;
const preventSQLInjection = (req, res, next) => {
    const suspiciousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
        /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
        /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
        /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    ];
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(checkValue);
        }
        return false;
    };
    if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
        logger_1.logger.error('Potential SQL injection attempt detected', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(400).json({
            success: false,
            error: 'Invalid input detected',
        });
        return;
    }
    next();
};
exports.preventSQLInjection = preventSQLInjection;
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        if (!req.file) {
            next();
            return;
        }
        if (!allowedTypes.includes(req.file.mimetype)) {
            res.status(400).json({
                success: false,
                error: 'Invalid file type',
                allowedTypes,
            });
            return;
        }
        if (req.file.size > maxSize) {
            res.status(400).json({
                success: false,
                error: 'File too large',
                maxSize: `${maxSize / 1024 / 1024}MB`,
            });
            return;
        }
        const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255);
        req.file.originalname = sanitizedName;
        next();
    };
};
exports.validateFileUpload = validateFileUpload;
const validate = (...validations) => {
    return [...validations, exports.validateRequest];
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map