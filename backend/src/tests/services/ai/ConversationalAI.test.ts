import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
// Mock all external dependencies first
jest.mock('sequelize');
jest.mock('../../../config/environment', () => ({
  config: {
    openai: {
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    },
    claude: {
      apiKey: 'test-key',
      model: 'claude-3-sonnet',
    },
  },
}));
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock all the services first
jest.mock('../../../services/ai/AIService', () => ({
  aiService: {
    generateResponse: jest.fn(),
  },
}));

jest.mock('../../../services/ai/ContextManager', () => ({
  contextManager: {
    getUserContext: jest.fn(),
  },
}));

jest.mock('../../../services/ai/PersonalityEngine', () => ({
  personalityEngine: {
    selectOptimalPersonality: jest.fn(),
    getSystemPrompt: jest.fn(),
  },
}));

jest.mock('../../../services/ai/RecommendationEngine', () => ({}));

// Mock all models
jest.mock('../../../models/ChatMessage', () => ({
  ChatMessage: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../models/Chat', () => ({
  Chat: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('openai');

// Now import the main class
import { ConversationalAI } from '../../../services/ai/ConversationalAI';
import { aiService } from '../../../services/ai/AIService';
import { contextManager } from '../../../services/ai/ContextManager';
import { personalityEngine } from '../../../services/ai/PersonalityEngine';
import { ChatMessage } from '../../../models/ChatMessage';

describe('ConversationalAI', () => {
  let conversationalAI: ConversationalAI;
  let mockAIService: jest.Mocked<typeof aiService>;
  let mockContextManager: jest.Mocked<typeof contextManager>;
  let mockPersonalityEngine: jest.Mocked<typeof personalityEngine>;
  let mockChatMessage: jest.Mocked<typeof ChatMessage>;

  beforeEach(() => {
    mockAIService = aiService as jest.Mocked<typeof aiService>;
    mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
    mockPersonalityEngine = personalityEngine as jest.Mocked<typeof personalityEngine>;
    mockChatMessage = ChatMessage as jest.Mocked<typeof ChatMessage>;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockAIService.generateResponse = jest.fn();
    mockContextManager.getUserContext = jest.fn();
    mockPersonalityEngine.selectOptimalPersonality = jest.fn();
    mockPersonalityEngine.getSystemPrompt = jest.fn();
    mockChatMessage.findAll = jest.fn();

    conversationalAI = new ConversationalAI();
  });

  describe('processConversation', () => {
    it('should process conversation with correct parameters and return expected structure', async () => {
      // Setup mocks
      const mockAIResponse = {
        content: 'Based on your goals, I recommend starting with 3 workouts per week.',
      };

      const mockUserContext = {
        userId: 'user123',
        preferences: {},
        goals: [],
      };

      mockAIService.generateResponse.mockResolvedValue(mockAIResponse);
      mockContextManager.getUserContext.mockResolvedValue(mockUserContext);
      mockPersonalityEngine.selectOptimalPersonality.mockReturnValue('supportive');
      mockPersonalityEngine.getSystemPrompt.mockReturnValue('You are a supportive coach');
      mockChatMessage.findAll.mockResolvedValue([]);

      // Call with correct parameter order: userId, message, conversationId, context
      const result = await conversationalAI.processConversation(
        'user123',
        'How often should I workout?',
        'conversation123',
        { userGoals: ['fitness'] }
      );

      // Verify result structure matches the actual API
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('actions');

      expect(result.response).toContain('3 workouts per week');
      expect(result.intent.primary).toBeDefined();
      expect(result.intent.confidence).toBeGreaterThan(0);
      expect(result.state.topic).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.actions)).toBe(true);
    });

    it('should handle conversation history correctly', async () => {
      const mockAIResponse = { content: 'I can help you with your workout plan.' };
      const mockUserContext = { userId: 'user123', preferences: {}, goals: [] };
      const mockHistory = [{ role: 'user', content: 'Hi', createdAt: new Date() }];

      mockAIService.generateResponse.mockResolvedValue(mockAIResponse);
      mockContextManager.getUserContext.mockResolvedValue(mockUserContext);
      mockPersonalityEngine.selectOptimalPersonality.mockReturnValue('supportive');
      mockPersonalityEngine.getSystemPrompt.mockReturnValue('You are supportive');
      mockChatMessage.findAll.mockResolvedValue(mockHistory as any);

      const result = await conversationalAI.processConversation(
        'user123',
        'I want to start working out',
        'conversation123'
      );

      expect(mockChatMessage.findAll).toHaveBeenCalledWith({
        where: { chatId: 'conversation123' },
        order: [['createdAt', 'ASC']],
        limit: 20,
      });
      expect(result.response).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockAIService.generateResponse.mockRejectedValue(new Error('AI Service Error'));
      mockContextManager.getUserContext.mockResolvedValue({ userId: 'user123' });
      mockPersonalityEngine.selectOptimalPersonality.mockReturnValue('supportive');
      mockPersonalityEngine.getSystemPrompt.mockReturnValue('You are supportive');
      mockChatMessage.findAll.mockResolvedValue([]);

      await expect(
        conversationalAI.processConversation('user123', 'Hello', 'conversation123')
      ).rejects.toThrow('AI Service Error');
    });
  });

  describe('generateSmartResponse', () => {
    it('should generate responses with different options', async () => {
      const mockResponse = { content: 'Short motivational response.' };
      mockAIService.generateResponse.mockResolvedValue(mockResponse);

      const result = await conversationalAI.generateSmartResponse('user123', 'I need motivation', {
        tone: 'motivational',
        length: 'short',
        includeAction: true,
        includeEmotion: true,
      });

      expect(result).toContain('motivational');
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('motivational'),
          }),
          expect.objectContaining({
            role: 'user',
            content: 'I need motivation',
          }),
        ]),
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 100,
        })
      );
    });
  });

  describe('conversation state management', () => {
    it('should manage conversation state correctly', async () => {
      const mockAIResponse = { content: 'Test response' };
      const mockUserContext = { userId: 'user123', preferences: {}, goals: [] };

      mockAIService.generateResponse.mockResolvedValue(mockAIResponse);
      mockContextManager.getUserContext.mockResolvedValue(mockUserContext);
      mockPersonalityEngine.selectOptimalPersonality.mockReturnValue('supportive');
      mockPersonalityEngine.getSystemPrompt.mockReturnValue('Test prompt');
      mockChatMessage.findAll.mockResolvedValue([]);

      // Process conversation to create state
      await conversationalAI.processConversation('user123', 'Test message', 'conversation123');

      // Get conversation state
      const state = conversationalAI.getConversationState('conversation123');

      expect(state).toBeDefined();
      expect(state?.depth).toBeGreaterThan(0);
      expect(state?.topic).toBeDefined();

      // Clear state
      conversationalAI.clearConversationState('conversation123');

      // Verify state is cleared
      const clearedState = conversationalAI.getConversationState('conversation123');
      expect(clearedState).toBeUndefined();
    });
  });

  describe('intent detection', () => {
    it('should detect different intents correctly', async () => {
      const testCases = [
        {
          message: 'I want to lose 20 pounds',
          expectedIntent: 'goal_setting',
        },
        {
          message: 'I feel really stressed and overwhelmed',
          expectedIntent: 'emotional_support',
        },
        {
          message: 'I need to plan my workout schedule for next week',
          expectedIntent: 'planning',
        },
      ];

      for (const testCase of testCases) {
        const mockAIResponse = { content: 'Let me help you with that!' };
        const mockUserContext = { userId: 'user123', preferences: {}, goals: [] };

        mockAIService.generateResponse.mockResolvedValue(mockAIResponse);
        mockContextManager.getUserContext.mockResolvedValue(mockUserContext);
        mockPersonalityEngine.selectOptimalPersonality.mockReturnValue('supportive');
        mockPersonalityEngine.getSystemPrompt.mockReturnValue('Test prompt');
        mockChatMessage.findAll.mockResolvedValue([]);

        const result = await conversationalAI.processConversation(
          'user123',
          testCase.message,
          'conversation123'
        );

        expect(result.intent.primary).toBe(testCase.expectedIntent);
        expect(result.intent.confidence).toBeGreaterThan(0);

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });
});
