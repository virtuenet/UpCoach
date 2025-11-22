import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as crypto from 'crypto';

import { asyncHandler } from '../middleware/errorHandler';
import { aiService } from '../services/ai/AIService';
import { userProfilingService } from '../services/ai/UserProfilingService';
import { db } from '../services/database';
import { promptInjectionProtector } from '../security/PromptInjectionProtector';
import { AuthenticatedRequest } from '../types/auth';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const router = Router();

// Enhanced validation schemas with security
const chatMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(4000, 'Message too long')
    .refine(
      (content) => {
        // Basic content validation - more sophisticated validation happens in the handler
        const trimmed = content.trim();
        return trimmed.length > 0 && trimmed.length <= 4000;
      },
      'Message content must be between 1 and 4000 characters'
    ),
  conversationId: z.string().uuid().optional(),
  aiProvider: z.enum(['openai', 'claude']).default('openai'),
});

// Rate limiting schema for security
const rateLimitKey = (userId: string, operation: string) => 
  crypto.createHash('sha256').update(`${userId}:${operation}:${Date.now().toString().slice(0, -3)}`).digest('hex').substring(0, 16);

const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
});

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: List conversations
 *     description: Retrieve all conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       title:
 *                         type: string
 *                         example: "Goal Setting Discussion"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           content:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/conversations',
  asyncHandler(async (req: Request, _res: Response) => {
    const userId = req.user!.id;

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
    const userId = req.user!.id;
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

/**
 * @swagger
 * /api/chat/conversations:
 *   post:
 *     summary: Start new conversation
 *     description: Create a new conversation for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Conversation title
 *                 example: "Goal Setting Discussion"
 *               initialMessage:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional initial message to start the conversation
 *                 example: "I'd like to discuss my career goals"
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     initialMessage:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         content:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/conversations',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
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

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send message
 *     description: Send a message to an AI coach and receive an intelligent response
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the conversation to send the message to
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: Message content to send to the AI coach
 *                 example: "I'm struggling with maintaining my daily habits. Any advice?"
 *     responses:
 *       200:
 *         description: Message sent and AI response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                       format: uuid
 *                     userMessage:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         content:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                     aiResponse:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         content:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         model:
 *                           type: string
 *                           example: "gpt-4"
 *                         provider:
 *                           type: string
 *                           example: "openai"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Conversation not found"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Too many messages. Please wait 45 seconds before sending another message."
 */
/**
 * Send a message and get AI response with enhanced security
 */
router.post(
  '/message',
  asyncHandler(async (req: Request, _res: Response) => {
    const userId = req.user!.id;
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Enhanced input validation
    const validatedData = chatMessageSchema.parse(req.body);
    const aiProvider = validatedData.aiProvider;

    // SECURITY: Rate limiting check
    const rateLimitResult = await checkMessageRateLimit(userId);
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for user:', {
        userId,
        ip: userIP,
        remainingTime: rateLimitResult.resetTime,
      });
      throw new ApiError(429, `Too many messages. Please wait ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds before sending another message.`);
    }

    // SECURITY: Advanced content validation and prompt injection protection
    const securityValidation = await promptInjectionProtector.validateAndSanitize(
      validatedData.content,
      {
        userId,
        sessionId: req.session?.id || `${userId}-${Date.now()}`,
      }
    );

    if (!securityValidation.isValid) {
      logger.warn('Prompt injection attempt detected:', {
        userId,
        ip: userIP,
        userAgent,
        riskLevel: securityValidation.riskLevel,
        blockedReasons: securityValidation.blockedReasons,
        detectedPatterns: securityValidation.metadata.detectedPatterns,
      });
      
      throw new ApiError(400, 'Your message contains content that cannot be processed. Please rephrase your question in a more direct manner.');
    }

    // Use sanitized content
    const sanitizedContent = securityValidation.sanitizedContent;

    let conversationId = validatedData.conversationId;

    // Create new conversation if none provided
    if (!conversationId) {
      const conversation = await db.insert('chat_conversations', {
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

    // Save user message with security metadata
    const userMessage = await db.insert('chat_messages', {
      conversation_id: conversationId,
      content: sanitizedContent, // Use sanitized content
      is_from_user: true,
      metadata: { 
        aiProvider,
        originalLength: validatedData.content.length,
        sanitizedLength: sanitizedContent.length,
        securityRiskLevel: securityValidation.riskLevel,
        securityConfidence: securityValidation.metadata.confidence,
        userAgent: userAgent.substring(0, 100), // Truncate for storage
        ipHash: crypto.createHash('sha256').update(userIP).digest('hex').substring(0, 16), // Hash IP for privacy
      },
    });

    try {
      // Get user profile for personalization
      const userProfile = await userProfilingService.createOrUpdateProfile(userId);

      // Get conversation history for context (with security filtering)
      const messageHistory = await db.query(
        `
        SELECT content, is_from_user, created_at, metadata
        FROM chat_messages 
        WHERE conversation_id = $1 
        AND (metadata->>'error' IS NULL OR metadata->>'error' != 'true')
        ORDER BY created_at ASC
        LIMIT 20
      `,
        [conversationId]
      );

      // Build message history for AI with additional security filtering
      const conversationMessages = await filterAndValidateConversationHistory(
        messageHistory.rows.slice(0, -1)
      );

      // Generate AI response using secured AI service
      const response = await aiService.generateCoachingResponse(sanitizedContent, {
        conversationHistory: conversationMessages,
        userId,
        personality: userProfile.communicationPreference,
        provider: aiProvider as 'openai' | 'claude',
      });

      if (!response.content) {
        throw new Error('No response from AI service');
      }

      // SECURITY: Validate AI response before saving
      const responseValidation = promptInjectionProtector.validateAIResponse(response.content);
      if (!responseValidation.isValid) {
        logger.warn('AI response validation failed:', {
          userId,
          conversationId,
          blockedReasons: responseValidation.blockedReasons,
        });
      }

      // Save AI response with security metadata
      const aiMessage = await db.insert('chat_messages', {
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

      // Update conversation title if it's the first exchange (using sanitized content)
      if (messageHistory.rows.length <= 2) {
        const title = sanitizedContent.length > 50
          ? sanitizedContent.substring(0, 47) + '...'
          : sanitizedContent;

        await db.update('chat_conversations', { title }, { id: conversationId });
      }

      // Log successful interaction with security metrics
      logger.info('Chat message processed successfully:', {
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
            // Don't expose security metadata to client
            metadata: {
              aiProvider: userMessage.metadata.aiProvider,
            },
          },
          aiMessage: {
            ...aiMessage,
            // Don't expose internal security metadata to client
            metadata: {
              model: aiMessage.metadata.model,
              provider: aiMessage.metadata.provider,
              tokens: aiMessage.metadata.tokens,
            },
          },
        },
      });
      
    } catch (error) {
      // Enhanced error handling with security considerations
      logger.error('Error processing chat message:', {
        error: error.message,
        userId,
        conversationId,
        provider: aiProvider,
        securityRiskLevel: securityValidation.riskLevel,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });

      // Save secure error message for user feedback
      await db.insert('chat_messages', {
        conversation_id: conversationId,
        content: 'I apologize, but I encountered an error processing your message. Please try again with a different phrasing.',
        is_from_user: false,
        metadata: { 
          error: true,
          errorType: 'processing_error',
          timestamp: new Date().toISOString(),
        },
      });

      // Return user-friendly error without exposing internal details
      if (error.message.includes('prompt injection') || error.message.includes('cannot be processed')) {
        throw new ApiError(400, error.message);
      } else {
        throw new ApiError(500, 'Failed to process your message. Please try again with different wording.');
      }
    }
  })
);

// Update conversation title
router.put(
  '/conversations/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
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
    const userId = req.user!.id;
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
    const userId = req.user!.id;

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

// SECURITY: Helper functions for enhanced security

/**
 * Rate limiting for message sending
 */
async function checkMessageRateLimit(userId: string): Promise<{
  allowed: boolean;
  resetTime: number;
}> {
  const key = `rate_limit:messages:${userId}`;
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20; // 20 messages per minute
  
  try {
    // This is a simplified rate limiting - in production, use Redis
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // For now, we'll use a basic in-memory approach
    // In production, implement with Redis for distributed rate limiting
    
    return {
      allowed: true, // Simplified for now
      resetTime: 0,
    };
  } catch (error) {
    logger.error('Rate limiting check failed:', error);
    // Fail open for availability, but log the issue
    return {
      allowed: true,
      resetTime: 0,
    };
  }
}

/**
 * Filters and validates conversation history for security
 */
async function filterAndValidateConversationHistory(messages: unknown[]): Promise<any[]> {
  const validatedMessages = [];
  
  for (const msg of messages) {
    try {
      // Skip messages that failed previous security checks
      if (msg.metadata?.securityRiskLevel === 'critical') {
        continue;
      }
      
      // Re-validate user messages
      if (msg.is_from_user) {
        const validation = await promptInjectionProtector.validateAndSanitize(msg.content, {});
        if (validation.isValid) {
          validatedMessages.push({
            role: 'user',
            content: validation.sanitizedContent,
          });
        }
      } else {
        // For AI messages, do basic validation
        const responseValidation = promptInjectionProtector.validateAIResponse(msg.content);
        validatedMessages.push({
          role: 'assistant',
          content: responseValidation.sanitizedResponse,
        });
      }
    } catch (error) {
      logger.warn('Failed to validate message in conversation history:', {
        messageId: msg.id,
        error: error.message,
      });
      // Skip problematic messages rather than failing the entire request
    }
  }
  
  return validatedMessages;
}

export default router;
