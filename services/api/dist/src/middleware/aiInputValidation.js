"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeParams = exports.validateGeneralAIInput = exports.validateLearningPathInput = exports.validateVoiceInput = exports.validateConversationInput = exports.validateAIInput = void 0;
const PromptInjectionProtector_1 = require("../security/PromptInjectionProtector");
const logger_1 = require("../utils/logger");
const validateAIInput = (options = {}) => {
    const { maxMessageLength = 4000, requiredFields = [], allowEmptyMessage = false, } = options;
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        message: `Required field missing: ${field}`,
                    });
                    return;
                }
            }
            if (req.body.message !== undefined) {
                const message = req.body.message;
                if (!allowEmptyMessage && (!message || message.trim().length === 0)) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        message: 'Message content cannot be empty',
                    });
                    return;
                }
                if (message && message.length > maxMessageLength) {
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        message: `Message exceeds maximum length of ${maxMessageLength} characters`,
                    });
                    return;
                }
                if (message && message.trim().length > 0) {
                    const validationResult = await PromptInjectionProtector_1.promptInjectionProtector.validateAndSanitize(message, { userId, sessionId: `ai-input-${Date.now()}` });
                    if (!validationResult.isValid) {
                        logger_1.logger.warn('AI input validation failed:', {
                            userId,
                            riskLevel: validationResult.riskLevel,
                            blockedReasons: validationResult.blockedReasons,
                            ip: req.ip,
                        });
                        res.status(400).json({
                            success: false,
                            error: 'Invalid input detected',
                            message: 'Your message contains content that cannot be processed. Please rephrase your request.',
                            code: 'INPUT_VALIDATION_FAILED',
                        });
                        return;
                    }
                    req.body.message = validationResult.sanitizedContent;
                }
            }
            const textFields = ['content', 'prompt', 'query', 'text', 'description'];
            for (const field of textFields) {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    const fieldValue = req.body[field];
                    if (fieldValue.length > maxMessageLength) {
                        res.status(400).json({
                            success: false,
                            error: 'Validation failed',
                            message: `Field '${field}' exceeds maximum length of ${maxMessageLength} characters`,
                        });
                        return;
                    }
                    const validationResult = await PromptInjectionProtector_1.promptInjectionProtector.validateAndSanitize(fieldValue, { userId, sessionId: `ai-input-${field}-${Date.now()}` });
                    if (!validationResult.isValid) {
                        logger_1.logger.warn('AI field validation failed:', {
                            field,
                            userId,
                            riskLevel: validationResult.riskLevel,
                            blockedReasons: validationResult.blockedReasons,
                        });
                        res.status(400).json({
                            success: false,
                            error: 'Invalid input detected',
                            message: `The '${field}' field contains content that cannot be processed. Please review your input.`,
                            code: 'FIELD_VALIDATION_FAILED',
                        });
                        return;
                    }
                    req.body[field] = validationResult.sanitizedContent;
                }
            }
            if (req.body.conversationHistory && Array.isArray(req.body.conversationHistory)) {
                for (let i = 0; i < req.body.conversationHistory.length; i++) {
                    const historyItem = req.body.conversationHistory[i];
                    if (historyItem.content && typeof historyItem.content === 'string') {
                        const validationResult = await PromptInjectionProtector_1.promptInjectionProtector.validateAndSanitize(historyItem.content, { userId, sessionId: `ai-history-${i}-${Date.now()}` });
                        if (!validationResult.isValid) {
                            logger_1.logger.warn('Conversation history validation failed:', {
                                index: i,
                                userId,
                                riskLevel: validationResult.riskLevel,
                                blockedReasons: validationResult.blockedReasons,
                            });
                            res.status(400).json({
                                success: false,
                                error: 'Invalid conversation history',
                                message: 'Your conversation history contains content that cannot be processed.',
                                code: 'HISTORY_VALIDATION_FAILED',
                            });
                            return;
                        }
                        req.body.conversationHistory[i].content = validationResult.sanitizedContent;
                    }
                }
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('AI input validation middleware error:', error);
            res.status(500).json({
                success: false,
                error: 'Validation error',
                message: 'Failed to validate input',
            });
        }
    };
};
exports.validateAIInput = validateAIInput;
exports.validateConversationInput = (0, exports.validateAIInput)({
    maxMessageLength: 2000,
    requiredFields: ['message'],
    allowEmptyMessage: false,
});
const validateVoiceInput = (req, res, next) => {
    try {
        if (req.path.includes('/voice/analyze') && !req.file) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Audio file is required for voice analysis',
            });
            return;
        }
        if (req.file && req.file.size > 50 * 1024 * 1024) {
            res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'Audio file must be smaller than 50MB',
            });
            return;
        }
        if (req.file) {
            const allowedTypes = [
                'audio/mp3',
                'audio/wav',
                'audio/m4a',
                'audio/ogg',
                'audio/webm',
                'audio/mp4',
            ];
            if (!allowedTypes.includes(req.file.mimetype)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid file type',
                    message: 'Audio file must be MP3, WAV, M4A, OGG, WebM, or MP4 format',
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Voice input validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Validation error',
            message: 'Failed to validate voice input',
        });
    }
};
exports.validateVoiceInput = validateVoiceInput;
exports.validateLearningPathInput = (0, exports.validateAIInput)({
    maxMessageLength: 1000,
    requiredFields: ['goalId'],
    allowEmptyMessage: true,
});
exports.validateGeneralAIInput = (0, exports.validateAIInput)({
    maxMessageLength: 4000,
    requiredFields: [],
    allowEmptyMessage: true,
});
const sanitizeParams = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const paramFields = ['activityType', 'riskType', 'pathId', 'moduleId'];
        for (const field of paramFields) {
            if (req.params[field] && typeof req.params[field] === 'string') {
                const paramValue = req.params[field];
                const sanitized = paramValue
                    .replace(/[<>\"']/g, '')
                    .trim()
                    .substring(0, 100);
                const suspiciousPatterns = [
                    /javascript:/i,
                    /<script/i,
                    /union.*select/i,
                    /drop.*table/i,
                ];
                if (suspiciousPatterns.some(pattern => pattern.test(paramValue))) {
                    logger_1.logger.warn('Suspicious parameter detected:', {
                        field,
                        value: paramValue,
                        userId,
                        ip: req.ip,
                    });
                    res.status(400).json({
                        success: false,
                        error: 'Invalid parameter',
                        message: `Invalid value for parameter: ${field}`,
                    });
                    return;
                }
                req.params[field] = sanitized;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Parameter sanitization error:', error);
        next();
    }
};
exports.sanitizeParams = sanitizeParams;
//# sourceMappingURL=aiInputValidation.js.map