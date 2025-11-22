import { Request, Response, NextFunction } from 'express';
import { promptInjectionProtector } from '../security/PromptInjectionProtector';
import { logger } from '../utils/logger';

export interface AIValidationOptions {
  maxMessageLength?: number;
  requiredFields?: string[];
  allowEmptyMessage?: boolean;
}

/**
 * Middleware to validate and sanitize AI input messages
 */
export const validateAIInput = (options: AIValidationOptions = {}) => {
  const {
    maxMessageLength = 4000,
    requiredFields = [],
    allowEmptyMessage = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      // Validate required fields
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

      // Validate message content if present
      if (req.body.message !== undefined) {
        const message = req.body.message;
        
        // Check if message is required
        if (!allowEmptyMessage && (!message || message.trim().length === 0)) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'Message content cannot be empty',
          });
          return;
        }

        // Check message length
        if (message && message.length > maxMessageLength) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: `Message exceeds maximum length of ${maxMessageLength} characters`,
          });
          return;
        }

        // Validate message for prompt injection
        if (message && message.trim().length > 0) {
          const validationResult = await promptInjectionProtector.validateAndSanitize(
            message,
            { userId, sessionId: `ai-input-${Date.now()}` }
          );

          if (!validationResult.isValid) {
            logger.warn('AI input validation failed:', {
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

          // Replace message with sanitized version
          req.body.message = validationResult.sanitizedContent;
        }
      }

      // Validate other text fields that might contain user input
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

          // Validate for prompt injection
          const validationResult = await promptInjectionProtector.validateAndSanitize(
            fieldValue,
            { userId, sessionId: `ai-input-${field}-${Date.now()}` }
          );

          if (!validationResult.isValid) {
            logger.warn('AI field validation failed:', {
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

          // Replace field with sanitized version
          req.body[field] = validationResult.sanitizedContent;
        }
      }

      // Validate arrays of messages (for conversation history)
      if (req.body.conversationHistory && Array.isArray(req.body.conversationHistory)) {
        for (let i = 0; i < req.body.conversationHistory.length; i++) {
          const historyItem = req.body.conversationHistory[i];
          if (historyItem.content && typeof historyItem.content === 'string') {
            const validationResult = await promptInjectionProtector.validateAndSanitize(
              historyItem.content,
              { userId, sessionId: `ai-history-${i}-${Date.now()}` }
            );

            if (!validationResult.isValid) {
              logger.warn('Conversation history validation failed:', {
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
    } catch (error) {
      logger.error('AI input validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation error',
        message: 'Failed to validate input',
      });
    }
  };
};

/**
 * Specific validation for conversational AI endpoints
 */
export const validateConversationInput = validateAIInput({
  maxMessageLength: 2000,
  requiredFields: ['message'],
  allowEmptyMessage: false,
});

/**
 * Validation for voice AI endpoints
 */
export const validateVoiceInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if audio file is present for voice analysis
    if (req.path.includes('/voice/analyze') && !req.file) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Audio file is required for voice analysis',
      });
      return;
    }

    // Validate audio file size (max 50MB)
    if (req.file && req.file.size > 50 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Audio file must be smaller than 50MB',
      });
      return;
    }

    // Validate audio file type
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
  } catch (error) {
    logger.error('Voice input validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: 'Failed to validate voice input',
    });
  }
};

/**
 * Validation for learning path creation
 */
export const validateLearningPathInput = validateAIInput({
  maxMessageLength: 1000,
  requiredFields: ['goalId'],
  allowEmptyMessage: true,
});

/**
 * Validation for general AI requests
 */
export const validateGeneralAIInput = validateAIInput({
  maxMessageLength: 4000,
  requiredFields: [],
  allowEmptyMessage: true,
});

/**
 * Sanitize URL parameters that might contain user input
 */
export const sanitizeParams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const paramFields = ['activityType', 'riskType', 'pathId', 'moduleId'];

    for (const field of paramFields) {
      if (req.params[field] && typeof req.params[field] === 'string') {
        const paramValue = req.params[field];
        
        // Basic sanitization for URL parameters
        const sanitized = paramValue
          .replace(/[<>\"']/g, '') // Remove dangerous characters
          .trim()
          .substring(0, 100); // Limit length

        // Check for obvious injection attempts in parameters
        const suspiciousPatterns = [
          /javascript:/i,
          /<script/i,
          /union.*select/i,
          /drop.*table/i,
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(paramValue))) {
          logger.warn('Suspicious parameter detected:', {
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
  } catch (error) {
    logger.error('Parameter sanitization error:', error);
    next(); // Continue on error for parameters
  }
};