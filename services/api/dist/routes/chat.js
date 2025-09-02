"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const apiError_1 = require("../utils/apiError");
const database_1 = require("../services/database");
const logger_1 = require("../utils/logger");
// import { config } from '../config/environment';
const AIService_1 = require("../services/ai/AIService");
const UserProfilingService_1 = require("../services/ai/UserProfilingService");
const router = (0, express_1.Router)();
// Validation schemas
const chatMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
    conversationId: zod_1.z.string().uuid().optional(),
    aiProvider: zod_1.z.enum(['openai', 'claude']).default('openai'),
});
const createConversationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
});
// Get all conversations for the current user
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
// Get a specific conversation with messages
router.get('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    // Get conversation
    const conversation = await database_1.db.findOne('chat_conversations', {
        id,
        user_id: userId,
        is_active: true,
    });
    if (!conversation) {
        throw new apiError_1.ApiError(404, 'Conversation not found');
    }
    // Get messages for this conversation
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
// Create a new conversation
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
// Send a message and get AI response
router.post('/message', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const validatedData = chatMessageSchema.parse(req.body);
    const aiProvider = validatedData.aiProvider;
    let conversationId = validatedData.conversationId;
    // Create new conversation if none provided
    if (!conversationId) {
        const conversation = await database_1.db.insert('chat_conversations', {
            user_id: userId,
            title: 'New Conversation',
            is_active: true,
            metadata: { aiProvider },
        });
        conversationId = conversation.id;
    }
    else {
        // Verify conversation belongs to user
        const conversation = await database_1.db.findOne('chat_conversations', {
            id: conversationId,
            user_id: userId,
            is_active: true,
        });
        if (!conversation) {
            throw new apiError_1.ApiError(404, 'Conversation not found');
        }
    }
    // Save user message
    const userMessage = await database_1.db.insert('chat_messages', {
        conversation_id: conversationId,
        content: validatedData.content,
        is_from_user: true,
        metadata: { aiProvider },
    });
    try {
        // Get user profile for personalization
        const userProfile = await UserProfilingService_1.userProfilingService.createOrUpdateProfile(userId);
        // Get conversation history for context
        const messageHistory = await database_1.db.query(`
      SELECT content, is_from_user, created_at
      FROM chat_messages 
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT 20
    `, [conversationId]);
        // Build message history for AI
        const conversationMessages = messageHistory.rows.slice(0, -1).map(msg => ({
            role: msg.is_from_user ? 'user' : 'assistant',
            content: msg.content,
        }));
        // Generate AI response using new AI service
        const response = await AIService_1.aiService.generateCoachingResponse(validatedData.content, {
            conversationHistory: conversationMessages,
            userId,
            personality: userProfile.communicationPreference,
            provider: aiProvider,
        });
        if (!response.content) {
            throw new Error('No response from AI');
        }
        // Save AI response
        const aiMessage = await database_1.db.insert('chat_messages', {
            conversation_id: conversationId,
            content: response.content,
            is_from_user: false,
            metadata: {
                model: response.model,
                provider: response.provider,
                tokens: response.usage?.total_tokens || 0,
                personality: userProfile.communicationPreference,
            },
        });
        // Update conversation title if it's the first exchange
        if (messageHistory.rows.length <= 2) {
            const title = validatedData.content.length > 50
                ? validatedData.content.substring(0, 47) + '...'
                : validatedData.content;
            await database_1.db.update('chat_conversations', { title }, { id: conversationId });
        }
        logger_1.logger.info('Chat message processed:', {
            conversationId,
            userId,
            userMessageId: userMessage.id,
            aiMessageId: aiMessage.id,
            provider: response.provider,
            tokens: response.usage?.total_tokens || 0,
        });
        _res.json({
            success: true,
            data: {
                conversationId,
                userMessage,
                aiMessage,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing chat message:', error);
        // Save error message for user feedback
        await database_1.db.insert('chat_messages', {
            conversation_id: conversationId,
            content: 'I apologize, but I encountered an error processing your message. Please try again.',
            is_from_user: false,
            metadata: { error: true },
        });
        throw new apiError_1.ApiError(500, 'Failed to process your message. Please try again.');
    }
}));
// Update conversation title
router.put('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const validatedData = createConversationSchema.parse(req.body);
    // Check if conversation exists and belongs to user
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
// Delete a conversation (soft delete)
router.delete('/conversations/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    // Check if conversation exists and belongs to user
    const conversation = await database_1.db.findOne('chat_conversations', {
        id,
        user_id: userId,
        is_active: true,
    });
    if (!conversation) {
        throw new apiError_1.ApiError(404, 'Conversation not found');
    }
    // Soft delete by setting is_active to false
    await database_1.db.update('chat_conversations', { is_active: false }, { id, user_id: userId });
    logger_1.logger.info('Conversation deleted:', { conversationId: id, userId });
    _res.json({
        success: true,
        message: 'Conversation deleted successfully',
    });
}));
// Get chat statistics
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
exports.default = router;
//# sourceMappingURL=chat.js.map