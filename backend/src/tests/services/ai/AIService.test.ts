import { AIService } from '../../../services/ai/AIService';
import { PersonalityEngine } from '../../../services/ai/PersonalityEngine';
import { ContextManager } from '../../../services/ai/ContextManager';
import { PromptEngineering } from '../../../services/ai/PromptEngineering';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Mock external dependencies
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('../../../services/ai/PersonalityEngine');
jest.mock('../../../services/ai/ContextManager');
jest.mock('../../../services/ai/PromptEngineering');

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockAnthropic: jest.Mocked<Anthropic>;
  let mockPersonalityEngine: jest.Mocked<PersonalityEngine>;
  let mockContextManager: jest.Mocked<ContextManager>;
  let mockPromptEngine: jest.Mocked<PromptEngineering>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    aiService = new AIService();

    // Get mock instances
    mockOpenAI = (OpenAI as any).mock.instances[0];
    mockAnthropic = (Anthropic as any).mock.instances[0];
    mockPersonalityEngine = (PersonalityEngine as any).mock.instances[0];
    mockContextManager = (ContextManager as any).mock.instances[0];
    mockPromptEngine = (PromptEngineering as any).mock.instances[0];

    // Setup default mock implementations
    mockPromptEngine.enhancePrompt.mockImplementation((msg) => msg);
    mockContextManager.enrichContext.mockImplementation((msg) => msg);
    mockPersonalityEngine.applyPersonality.mockImplementation((msg) => msg);
    mockPersonalityEngine.getActiveProfile.mockReturnValue({
      id: 'default',
      name: 'Default Coach',
      description: 'Balanced coaching personality',
      systemPrompt: 'You are a helpful coach',
      traits: {
        empathy: 7,
        directness: 5,
        motivation: 8,
        analytical: 6,
        warmth: 7,
        formality: 5
      },
      communicationStyle: {
        greetings: ['Hello!'],
        encouragements: ['Great job!'],
        acknowledgments: ['I understand'],
        transitions: ['Let\'s move on to'],
        closings: ['Take care!']
      },
      responsePatterns: {
        questionStyle: 'balanced',
        feedbackStyle: 'balanced',
        suggestionStyle: 'collaborative'
      }
    });
  });

  describe('generateResponse', () => {
    it('should generate response using OpenAI by default', async () => {
      const messages = [
        { role: 'user' as const, content: 'How can I improve my productivity?' }
      ];

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: { content: 'Here are some productivity tips...', role: 'assistant' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        }
      } as any;

      const response = await aiService.generateResponse(messages);

      expect(response.content).toBe('Here are some productivity tips...');
      expect(response.provider).toBe('openai');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should generate response using Claude when specified', async () => {
      const messages = [
        { role: 'user' as const, content: 'Tell me about mindfulness' }
      ];

      mockAnthropic.messages = {
        create: jest.fn().mockResolvedValue({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Mindfulness is the practice of...' }],
          model: 'claude-3-opus-20240229',
          stop_reason: 'end_turn',
          usage: { input_tokens: 15, output_tokens: 25 }
        })
      } as any;

      const response = await aiService.generateResponse(messages, { provider: 'claude' });

      expect(response.content).toBe('Mindfulness is the practice of...');
      expect(response.provider).toBe('claude');
      expect(mockAnthropic.messages.create).toHaveBeenCalled();
    });

    it('should apply personality to messages', async () => {
      const messages = [
        { role: 'user' as const, content: 'I need motivation' }
      ];

      mockPersonalityEngine.applyPersonality.mockReturnValue([
        { role: 'system', content: 'You are an encouraging coach' },
        ...messages
      ]);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: { content: 'You can do this!', role: 'assistant' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        }
      } as any;

      const response = await aiService.generateResponse(messages, { personality: 'motivator' });

      expect(mockPersonalityEngine.applyPersonality).toHaveBeenCalledWith(messages, 'motivator');
      expect(response.content).toBe('You can do this!');
    });

    it('should handle errors gracefully', async () => {
      const messages = [
        { role: 'user' as const, content: 'Test error handling' }
      ];

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      } as any;

      await expect(aiService.generateResponse(messages)).rejects.toThrow('API Error');
    });
  });

  describe('generateCoachingResponse', () => {
    it('should generate coaching-specific response', async () => {
      const userId = 'user123';
      const message = 'I want to build better habits';
      const context = { goals: ['exercise daily'] };

      mockContextManager.getUserContext.mockResolvedValue({
        user: { id: userId, name: 'Test User' },
        goals: ['exercise daily'],
        recentActivity: []
      });

      mockPromptEngine.generateCoachingPrompt.mockReturnValue({
        role: 'system',
        content: 'You are a habit coach...'
      });

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: { content: 'Let\'s start with small steps...', role: 'assistant' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 30, completion_tokens: 40, total_tokens: 70 }
          })
        }
      } as any;

      const response = await aiService.generateCoachingResponse(userId, message, context);

      expect(mockContextManager.getUserContext).toHaveBeenCalledWith(userId);
      expect(mockPromptEngine.generateCoachingPrompt).toHaveBeenCalled();
      expect(response.content).toBe('Let\'s start with small steps...');
    });
  });

  describe('analyzeConversation', () => {
    it('should analyze conversation for insights', async () => {
      const messages = [
        { role: 'user' as const, content: 'I feel stressed about work' },
        { role: 'assistant' as const, content: 'Tell me more about what\'s causing stress' },
        { role: 'user' as const, content: 'Too many deadlines and not enough time' }
      ];

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  sentiment: 'negative',
                  topics: ['work stress', 'time management'],
                  suggestedActions: ['prioritization', 'delegation']
                }),
                role: 'assistant'
              },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
          })
        }
      } as any;

      const analysis = await aiService.analyzeConversation(messages);

      expect(analysis).toEqual({
        sentiment: 'negative',
        topics: ['work stress', 'time management'],
        suggestedActions: ['prioritization', 'delegation']
      });
    });
  });

  describe('generatePersonalizedPrompt', () => {
    it('should create personalized prompt based on user profile', async () => {
      const userId = 'user456';
      const objective = 'improve sleep quality';
      const userProfile = {
        preferences: { communicationStyle: 'gentle' },
        history: { sleepIssues: true }
      };

      mockContextManager.getUserContext.mockResolvedValue({
        user: { id: userId, profile: userProfile },
        goals: [],
        recentActivity: []
      });

      mockPromptEngine.generatePersonalizedPrompt.mockReturnValue({
        role: 'system',
        content: 'Help user improve sleep with gentle guidance...'
      });

      const prompt = await aiService.generatePersonalizedPrompt(userId, objective);

      expect(mockContextManager.getUserContext).toHaveBeenCalledWith(userId);
      expect(mockPromptEngine.generatePersonalizedPrompt).toHaveBeenCalledWith(
        objective,
        expect.objectContaining({ user: expect.any(Object) })
      );
      expect(prompt.content).toContain('sleep');
    });
  });
});