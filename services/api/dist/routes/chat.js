"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const zod_1 = require("zod");
const crypto = tslib_1.__importStar(require("crypto"));
const errorHandler_1 = require("../middleware/errorHandler");
const AIService_1 = require("../services/ai/AIService");
const UserProfilingService_1 = require("../services/ai/UserProfilingService");
const database_1 = require("../services/database");
const PromptInjectionProtector_1 = require("../security/PromptInjectionProtector");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const chatMessageSchema = zod_1.z.object({
    content: zod_1.z.string()
        .min(1, 'Message content is required')
        .max(4000, 'Message too long')
        .refine((content) => {
        const trimmed = content.trim();
        return trimmed.length > 0 && trimmed.length <= 4000;
    }, 'Message content must be between 1 and 4000 characters'),
    conversationId: zod_1.z.string().uuid().optional(),
    aiProvider: zod_1.z.enum(['openai', 'claude']).default('openai'),
});
const rateLimitKey = (userId, operation) => crypto.createHash('sha256').update(`${userId}:${operation}:${Date.now().toString().slice(0, -3)}`).digest('hex').substring(0, 16);
const createConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
});
router.get('/conversations', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const conversations = await database_1.db.query(`
    SELECT 
      c.id, 
      c.title, 
      c.is_active, 
      c.created_at, 
      c.updated_at,
      COUNT(m.id) as message_count,
      MAX(m.created_at) as last_message_at
    FROM chat_conversations c
    LEFT JOIN chat_messages m ON c.id = m.conversation_id
    WHERE c.user_id = $1 AND c.is_active = true
    GROUP BY c.id, c.title, c.is_active, c.created_at, c.updated_at
    ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC
  `, [userId]);
    _res.json({
        success: true,
        data: {
            conversations: conversations.rows,
        },
    });
}));
router.get('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const conversation = await database_1.db.findOne('chat_conversations', {
        id,
        user_id: userId,
        is_active: true,
    });
    if (!conversation) {
        throw new apiError_1.ApiError(404, 'Conversation not found');
    }
    const messages = await database_1.db.query(`
    SELECT id, content, is_from_user, created_at, metadata
    FROM chat_messages 
    WHERE conversation_id = $1
    ORDER BY created_at ASC
  `, [id]);
    _res.json({
        success: true,
        data: {
            conversation: {
                ...conversation,
                messages: messages.rows,
            },
        },
    });
}));
router.post('/conversations', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const validatedData = createConversationSchema.parse(req.body);
    const conversationData = {
        user_id: userId,
        title: validatedData.title || 'New Conversation',
        is_active: true,
        metadata: {},
    };
    const conversation = await database_1.db.insert('chat_conversations', conversationData);
    logger_1.logger.info('Conversation created:', { conversationId: conversation.id, userId });
    _res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
            conversation,
        },
    });
}));
router.post('/message', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    const validatedData = chatMessageSchema.parse(req.body);
    const aiProvider = validatedData.aiProvider;
    const rateLimitResult = await checkMessageRateLimit(userId);
    if (!rateLimitResult.allowed) {
        logger_1.logger.warn('Rate limit exceeded for user:', {
            userId,
            ip: userIP,
            remainingTime: rateLimitResult.resetTime,
        });
        throw new apiError_1.ApiError(429, `Too many messages. Please wait ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds before sending another message.`);
    }
    const securityValidation = await PromptInjectionProtector_1.promptInjectionProtector.validateAndSanitize(validatedData.content, {
        userId,
        sessionId: req.session?.id || `${userId}-${Date.now()}`,
    });
    if (!securityValidation.isValid) {
        logger_1.logger.warn('Prompt injection attempt detected:', {
            userId,
            ip: userIP,
            userAgent,
            riskLevel: securityValidation.riskLevel,
            blockedReasons: securityValidation.blockedReasons,
            detectedPatterns: securityValidation.metadata.detectedPatterns,
        });
        throw new apiError_1.ApiError(400, 'Your message contains content that cannot be processed. Please rephrase your question in a more direct manner.');
    }
    const sanitizedContent = securityValidation.sanitizedContent;
    let conversationId = validatedData.conversationId;
    if (!conversationId) {
        const conversation = await database_1.db.insert('chat_conversations', {
            user_id: userId,
            title: 'New Conversation',
            is_active: true,
            metadata: {
                aiProvider,
                securityValidation: {
                    riskLevel: securityValidation.riskLevel,
                    confidence: securityValidation.metadata.confidence,
                },
            },
        });
        conversationId = conversation.id;
    }
    else {
        const conversation = await database_1.db.findOne('chat_conversations', {
            id: conversationId,
            user_id: userId,
            is_active: true,
        });
        if (!conversation) {
            throw new apiError_1.ApiError(404, 'Conversation not found');
        }
    }
    const userMessage = await database_1.db.insert('chat_messages', {
        conversation_id: conversationId,
        content: sanitizedContent,
        is_from_user: true,
        metadata: {
            aiProvider,
            originalLength: validatedData.content.length,
            sanitizedLength: sanitizedContent.length,
            securityRiskLevel: securityValidation.riskLevel,
            securityConfidence: securityValidation.metadata.confidence,
            userAgent: userAgent.substring(0, 100),
            ipHash: crypto.createHash('sha256').update(userIP).digest('hex').substring(0, 16),
        },
    });
    try {
        const userProfile = await UserProfilingService_1.userProfilingService.createOrUpdateProfile(userId);
        const messageHistory = await database_1.db.query(`
        SELECT content, is_from_user, created_at, metadata
        FROM chat_messages 
        WHERE conversation_id = $1 
        AND (metadata->>'error' IS NULL OR metadata->>'error' != 'true')
        ORDER BY created_at ASC
        LIMIT 20
      `, [conversationId]);
        const conversationMessages = await filterAndValidateConversationHistory(messageHistory.rows.slice(0, -1));
        const response = await AIService_1.aiService.generateCoachingResponse(sanitizedContent, {
            conversationHistory: conversationMessages,
            userId,
            personality: userProfile.communicationPreference,
            provider: aiProvider,
        });
        if (!response.content) {
            throw new Error('No response from AI service');
        }
        const responseValidation = PromptInjectionProtector_1.promptInjectionProtector.validateAIResponse(response.content);
        if (!responseValidation.isValid) {
            logger_1.logger.warn('AI response validation failed:', {
                userId,
                conversationId,
                blockedReasons: responseValidation.blockedReasons,
            });
        }
        const aiMessage = await database_1.db.insert('chat_messages', {
            conversation_id: conversationId,
            content: responseValidation.sanitizedResponse,
            is_from_user: false,
            metadata: {
                model: response.model,
                provider: response.provider,
                tokens: response.usage?.totalTokens || 0,
                personality: userProfile.communicationPreference,
                responseValidated: responseValidation.isValid,
                responseValidationIssues: responseValidation.blockedReasons,
                securityMetadata: response.securityMetadata,
            },
        });
        if (messageHistory.rows.length <= 2) {
            const title = sanitizedContent.length > 50
                ? sanitizedContent.substring(0, 47) + '...'
                : sanitizedContent;
            await database_1.db.update('chat_conversations', { title }, { id: conversationId });
        }
        logger_1.logger.info('Chat message processed successfully:', {
            conversationId,
            userId,
            userMessageId: userMessage.id,
            aiMessageId: aiMessage.id,
            provider: response.provider,
            tokens: response.usage?.totalTokens || 0,
            securityRiskLevel: securityValidation.riskLevel,
            responseValidated: responseValidation.isValid,
        });
        _res.json({
            success: true,
            data: {
                conversationId,
                userMessage: {
                    ...userMessage,
                    metadata: {
                        aiProvider: userMessage.metadata.aiProvider,
                    },
                },
                aiMessage: {
                    ...aiMessage,
                    metadata: {
                        model: aiMessage.metadata.model,
                        provider: aiMessage.metadata.provider,
                        tokens: aiMessage.metadata.tokens,
                    },
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing chat message:', {
            error: error.message,
            userId,
            conversationId,
            provider: aiProvider,
            securityRiskLevel: securityValidation.riskLevel,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
        await database_1.db.insert('chat_messages', {
            conversation_id: conversationId,
            content: 'I apologize, but I encountered an error processing your message. Please try again with a different phrasing.',
            is_from_user: false,
            metadata: {
                error: true,
                errorType: 'processing_error',
                timestamp: new Date().toISOString(),
            },
        });
        if (error.message.includes('prompt injection') || error.message.includes('cannot be processed')) {
            throw new apiError_1.ApiError(400, error.message);
        }
        else {
            throw new apiError_1.ApiError(500, 'Failed to process your message. Please try again with different wording.');
        }
    }
}));
router.put('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const validatedData = createConversationSchema.parse(req.body);
    const conversation = await database_1.db.findOne('chat_conversations', {
        id,
        user_id: userId,
        is_active: true,
    });
    if (!conversation) {
        throw new apiError_1.ApiError(404, 'Conversation not found');
    }
    const updatedConversation = await database_1.db.update('chat_conversations', { title: validatedData.title }, { id, user_id: userId });
    logger_1.logger.info('Conversation updated:', { conversationId: id, userId });
    _res.json({
        success: true,
        message: 'Conversation updated successfully',
        data: {
            conversation: updatedConversation,
        },
    });
}));
router.delete('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const conversation = await database_1.db.findOne('chat_conversations', {
        id,
        user_id: userId,
        is_active: true,
    });
    if (!conversation) {
        throw new apiError_1.ApiError(404, 'Conversation not found');
    }
    await database_1.db.update('chat_conversations', { is_active: false }, { id, user_id: userId });
    logger_1.logger.info('Conversation deleted:', { conversationId: id, userId });
    _res.json({
        success: true,
        message: 'Conversation deleted successfully',
    });
}));
router.get('/stats/overview', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const stats = await database_1.db.query(`
    SELECT 
      COUNT(DISTINCT c.id) as total_conversations,
      COUNT(m.id) as total_messages,
      COUNT(m.id) FILTER (WHERE m.is_from_user = true) as user_messages,
      COUNT(m.id) FILTER (WHERE m.is_from_user = false) as ai_messages,
      COUNT(m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '7 days') as messages_this_week,
      COUNT(m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '30 days') as messages_this_month
    FROM chat_conversations c
    LEFT JOIN chat_messages m ON c.id = m.conversation_id
    WHERE c.user_id = $1 AND c.is_active = true
  `, [userId]);
    const dailyActivity = await database_1.db.query(`
    SELECT 
      DATE(m.created_at) as date,
      COUNT(m.id) as message_count,
      COUNT(DISTINCT m.conversation_id) as active_conversations
    FROM chat_messages m
    JOIN chat_conversations c ON m.conversation_id = c.id
    WHERE c.user_id = $1 
      AND c.is_active = true
      AND m.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(m.created_at)
    ORDER BY date
  `, [userId]);
    _res.json({
        success: true,
        data: {
            overview: stats.rows[0],
            dailyActivity: dailyActivity.rows,
        },
    });
}));
async function checkMessageRateLimit(userId) {
    const key = `rate_limit:messages:${userId}`;
    const windowMs = 60 * 1000;
    const maxRequests = 20;
    try {
        const now = Date.now();
        const windowStart = now - windowMs;
        return {
            allowed: true,
            resetTime: 0,
        };
    }
    catch (error) {
        logger_1.logger.error('Rate limiting check failed:', error);
        return {
            allowed: true,
            resetTime: 0,
        };
    }
}
async function filterAndValidateConversationHistory(messages) {
    const validatedMessages = [];
    for (const msg of messages) {
        try {
            if (msg.metadata?.securityRiskLevel === 'critical') {
                continue;
            }
            if (msg.is_from_user) {
                const validation = await PromptInjectionProtector_1.promptInjectionProtector.validateAndSanitize(msg.content, {});
                if (validation.isValid) {
                    validatedMessages.push({
                        role: 'user',
                        content: validation.sanitizedContent,
                    });
                }
            }
            else {
                const responseValidation = PromptInjectionProtector_1.promptInjectionProtector.validateAIResponse(msg.content);
                validatedMessages.push({
                    role: 'assistant',
                    content: responseValidation.sanitizedResponse,
                });
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to validate message in conversation history:', {
                messageId: msg.id,
                error: error.message,
            });
        }
    }
    return validatedMessages;
}
exports.default = router;
