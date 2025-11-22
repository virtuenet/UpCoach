import { jest } from '@jest/globals';

export const enhancedAIService = {
  generateHybridResponse: jest.fn().mockResolvedValue({
    response: {
      content: 'This is a hybrid AI response combining multiple models',
      model: 'gpt-4',
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150,
      },
      finishReason: 'stop',
    },
    metrics: {
      provider: 'openai',
      model: 'gpt-4',
      latency: 850,
      fallbackOccurred: false,
      routingDecisionTime: 12,
      qualityScore: 0.92,
      cacheHit: false,
    },
  }),

  processRequest: jest.fn().mockResolvedValue({
    result: 'Processed request successfully',
    processingTime: 450,
    modelUsed: 'gpt-4',
    confidence: 0.88,
  }),

  generateResponse: jest.fn().mockResolvedValue({
    text: 'Generated response text',
    metadata: {
      model: 'gpt-3.5-turbo',
      tokens: 75,
      temperature: 0.7,
    },
  }),

  validateInput: jest.fn().mockReturnValue({
    valid: true,
    errors: [],
    warnings: [],
  }),

  optimizePrompt: jest.fn().mockResolvedValue({
    optimizedPrompt: 'Optimized version of the prompt',
    improvements: ['Added context', 'Clarified intent', 'Removed ambiguity'],
    estimatedQualityGain: 0.15,
  }),

  selectModel: jest.fn().mockResolvedValue({
    model: 'gpt-4',
    provider: 'openai',
    reasoning: 'Best model for complex reasoning tasks',
    alternativeOptions: ['claude-3', 'gpt-3.5-turbo'],
  }),

  handleError: jest.fn().mockResolvedValue({
    fallbackResponse: 'Fallback response due to error',
    errorHandled: true,
    retryAttempts: 1,
    finalSuccess: true,
  }),
};