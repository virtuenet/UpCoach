import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/apiError';
import { db } from '../services/database';
import { logger } from '../utils/logger';
// import { config } from '../config/environment';
import { aiService } from '../services/ai/AIService';
import { userProfilingService } from '../services/ai/UserProfilingService';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Validation schemas
const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
  aiProvider: z.enum(['openai', 'claude']).default('openai'),
});

const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
});

// Get all conversations for the current user
router.get(
  '/conversations',
  asyncHandler(async (req: Request, _res: Response) => {
    const userId = (req as any).user!.id;

    const conversations = await db.query(
      `
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
  `,
      [userId]
    );

    _res.json({
      success: true,
      data: {
        conversations: conversations.rows,
      },
    });
  })
);

// Get a specific conversation with messages
router.get(
  '/conversations/:id',
  asyncHandler(async (req: Request, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    // Get conversation
    const conversation = await db.findOne('chat_conversations', {
      id,
      user_id: userId,
      is_active: true,
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    // Get messages for this conversation
    const messages = await db.query(
      `
    SELECT id, content, is_from_user, created_at, metadata
    FROM chat_messages 
    WHERE conversation_id = $1
    ORDER BY created_at ASC
  `,
      [id]
    );

    _res.json({
      success: true,
      data: {
        conversation: {
          ...conversation,
          messages: messages.rows,
        },
      },
    });
  })
);

// Create a new conversation
router.post(
  '/conversations',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const validatedData = createConversationSchema.parse(req.body);

    const conversationData = {
      user_id: userId,
      title: validatedData.title || 'New Conversation',
      is_active: true,
      metadata: {},
    };

    const conversation = await db.insert('chat_conversations', conversationData);

    logger.info('Conversation created:', { conversationId: conversation.id, userId });

    _res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: {
        conversation,
      },
    });
  })
);

// Send a message and get AI response
router.post(
  '/message',
  asyncHandler(async (req: Request, _res: Response) => {
    const userId = (req as any).user!.id;
    const validatedData = chatMessageSchema.parse(req.body);
    const aiProvider = validatedData.aiProvider;

    let conversationId = validatedData.conversationId;

    // Create new conversation if none provided
    if (!conversationId) {
      const conversation = await db.insert('chat_conversations', {
        user_id: userId,
        title: 'New Conversation',
        is_active: true,
        metadata: { aiProvider },
      });
      conversationId = conversation.id;
    } else {
      // Verify conversation belongs to user
      const conversation = await db.findOne('chat_conversations', {
        id: conversationId,
        user_id: userId,
        is_active: true,
      });

      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }
    }

    // Save user message
    const userMessage = await db.insert('chat_messages', {
      conversation_id: conversationId,
      content: validatedData.content,
      is_from_user: true,
      metadata: { aiProvider },
    });

    try {
      // Get user profile for personalization
      const userProfile = await userProfilingService.createOrUpdateProfile(userId);

      // Get conversation history for context
      const messageHistory = await db.query(
        `
      SELECT content, is_from_user, created_at
      FROM chat_messages 
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT 20
    `,
        [conversationId]
      );

      // Build message history for AI
      const conversationMessages = messageHistory.rows.slice(0, -1).map(msg => ({
        role: msg.is_from_user ? 'user' : ('assistant' as 'user' | 'assistant'),
        content: msg.content,
      }));

      // Generate AI response using new AI service
      const response = await aiService.generateCoachingResponse(validatedData.content, {
        conversationHistory: conversationMessages,
        userId,
        personality: userProfile.communicationPreference,
        provider: aiProvider as 'openai' | 'claude',
      });

      if (!response.content) {
        throw new Error('No response from AI');
      }

      // Save AI response
      const aiMessage = await db.insert('chat_messages', {
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
        const title =
          validatedData.content.length > 50
            ? validatedData.content.substring(0, 47) + '...'
            : validatedData.content;

        await db.update('chat_conversations', { title }, { id: conversationId });
      }

      logger.info('Chat message processed:', {
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
    } catch (error) {
      logger.error('Error processing chat message:', error);

      // Save error message for user feedback
      await db.insert('chat_messages', {
        conversation_id: conversationId,
        content:
          'I apologize, but I encountered an error processing your message. Please try again.',
        is_from_user: false,
        metadata: { error: true },
      });

      throw new ApiError(500, 'Failed to process your message. Please try again.');
    }
  })
);

// Update conversation title
router.put(
  '/conversations/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;
    const validatedData = createConversationSchema.parse(req.body);

    // Check if conversation exists and belongs to user
    const conversation = await db.findOne('chat_conversations', {
      id,
      user_id: userId,
      is_active: true,
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    const updatedConversation = await db.update(
      'chat_conversations',
      { title: validatedData.title },
      { id, user_id: userId }
    );

    logger.info('Conversation updated:', { conversationId: id, userId });

    _res.json({
      success: true,
      message: 'Conversation updated successfully',
      data: {
        conversation: updatedConversation,
      },
    });
  })
);

// Delete a conversation (soft delete)
router.delete(
  '/conversations/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    // Check if conversation exists and belongs to user
    const conversation = await db.findOne('chat_conversations', {
      id,
      user_id: userId,
      is_active: true,
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    // Soft delete by setting is_active to false
    await db.update('chat_conversations', { is_active: false }, { id, user_id: userId });

    logger.info('Conversation deleted:', { conversationId: id, userId });

    _res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  })
);

// Get chat statistics
router.get(
  '/stats/overview',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;

    const stats = await db.query(
      `
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
  `,
      [userId]
    );

    const dailyActivity = await db.query(
      `
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
  `,
      [userId]
    );

    _res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        dailyActivity: dailyActivity.rows,
      },
    });
  })
);

export default router;
