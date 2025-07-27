import { AIService } from '../../../services/ai/AIService';

// Mock OpenAI and Anthropic
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4-turbo-preview'
        })
      }
    }
  }))
}));

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Claude response' }],
        usage: { input_tokens: 15, output_tokens: 25 },
        model: 'claude-3-sonnet'
      })
    }
  }))
}));

// Mock other services
jest.mock('../../../services/ai/PromptEngineering');
jest.mock('../../../services/ai/ContextManager');
jest.mock('../../../services/ai/PersonalityEngine');

describe('AI Service Unit Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
  });

  describe('Core Functionality', () => {
    it('should be instantiated correctly', () => {
      expect(aiService).toBeDefined();
      expect(aiService).toBeInstanceOf(AIService);
    });

    it('should have generateResponse method', () => {
      expect(aiService.generateResponse).toBeDefined();
      expect(typeof aiService.generateResponse).toBe('function');
    });

    it('should have generateCoachingResponse method', () => {
      expect(aiService.generateCoachingResponse).toBeDefined();
      expect(typeof aiService.generateCoachingResponse).toBe('function');
    });

    it('should have analyzeConversation method', () => {
      expect(aiService.analyzeConversation).toBeDefined();
      expect(typeof aiService.analyzeConversation).toBe('function');
    });

    it('should have getOptimalModel method', () => {
      expect(aiService.getOptimalModel).toBeDefined();
      expect(typeof aiService.getOptimalModel).toBe('function');
    });
  });

  describe('Model Selection', () => {
    it('should select optimal model for coaching', () => {
      const model = aiService.getOptimalModel('coaching');
      expect(model).toEqual({
        provider: 'openai',
        model: 'gpt-4-turbo-preview'
      });
    });

    it('should select optimal model for analysis', () => {
      const model = aiService.getOptimalModel('analysis');
      expect(model).toEqual({
        provider: 'claude',
        model: 'claude-3-opus-20240229'
      });
    });

    it('should select optimal model for creative tasks', () => {
      const model = aiService.getOptimalModel('creative');
      expect(model).toEqual({
        provider: 'openai',
        model: 'gpt-4-turbo-preview'
      });
    });

    it('should select optimal model for technical tasks', () => {
      const model = aiService.getOptimalModel('technical');
      expect(model).toEqual({
        provider: 'claude',
        model: 'claude-3-sonnet-20240229'
      });
    });
  });

  describe('Response Generation', () => {
    it('should generate response with default options', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello AI' }
      ];

      const response = await aiService.generateResponse(messages);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('usage');
      expect(response).toHaveProperty('provider');
    });

    it('should handle empty messages array', async () => {
      const messages: any[] = [];
      
      await expect(aiService.generateResponse(messages))
        .resolves.toBeDefined();
    });

    it('should respect provider option', async () => {
      const messages = [
        { role: 'user' as const, content: 'Test message' }
      ];

      const response = await aiService.generateResponse(messages, {
        provider: 'claude'
      });

      expect(response.provider).toBe('claude');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock a failure
      const mockError = new Error('API Error');
      jest.spyOn(aiService as any, 'generateOpenAIResponse')
        .mockRejectedValueOnce(mockError);

      const messages = [
        { role: 'user' as const, content: 'Test' }
      ];

      await expect(aiService.generateResponse(messages))
        .rejects.toThrow('Failed to generate AI response');
    });
  });

  describe('Conversation Analysis', () => {
    it('should analyze conversation sentiment', async () => {
      const messages = [
        { role: 'user' as const, content: 'I am feeling great!' },
        { role: 'assistant' as const, content: 'That\'s wonderful!' }
      ];

      // Mock the response
      jest.spyOn(aiService, 'generateResponse').mockResolvedValueOnce({
        content: JSON.stringify({
          overall_sentiment: 'positive',
          emotion_breakdown: { joy: 80, neutral: 20 },
          key_emotional_moments: ['feeling great']
        }),
        usage: { input_tokens: 20, output_tokens: 30 },
        provider: 'openai'
      });

      const analysis = await aiService.analyzeConversation(messages, 'sentiment');
      
      expect(analysis).toHaveProperty('overall_sentiment');
      expect(analysis.overall_sentiment).toBe('positive');
    });

    it('should handle invalid JSON in analysis', async () => {
      const messages = [
        { role: 'user' as const, content: 'Test' }
      ];

      jest.spyOn(aiService, 'generateResponse').mockResolvedValueOnce({
        content: 'Invalid JSON',
        usage: { input_tokens: 10, output_tokens: 20 },
        provider: 'openai'
      });

      const analysis = await aiService.analyzeConversation(messages, 'sentiment');
      
      expect(analysis).toHaveProperty('error');
      expect(analysis.error).toBe('Failed to parse analysis');
    });
  });

  describe('Coaching Response', () => {
    it('should generate coaching response without history', async () => {
      jest.spyOn(aiService, 'generateResponse').mockResolvedValueOnce({
        content: 'Here is my coaching advice...',
        usage: { input_tokens: 15, output_tokens: 25 },
        provider: 'openai'
      });

      const response = await aiService.generateCoachingResponse(
        'How can I improve?'
      );

      expect(response).toBeDefined();
      expect(response.content).toContain('coaching advice');
    });

    it('should include conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'Previous message' },
        { role: 'assistant' as const, content: 'Previous response' }
      ];

      jest.spyOn(aiService, 'generateResponse').mockResolvedValueOnce({
        content: 'Contextual response',
        usage: { input_tokens: 30, output_tokens: 40 },
        provider: 'openai'
      });

      const response = await aiService.generateCoachingResponse(
        'Follow up question',
        { conversationHistory: history }
      );

      expect(response).toBeDefined();
      expect(aiService.generateResponse).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...history,
          { role: 'user', content: 'Follow up question' }
        ]),
        expect.any(Object)
      );
    });
  });
});