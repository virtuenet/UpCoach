import { jest } from '@jest/globals';

export const hybridDecisionEngine = {
  generate: jest.fn().mockImplementation((params) => {
    return Promise.resolve({
      content: 'Great progress! Keep up the excellent work on your goals.',
      strategy: 'hybrid',
      models: ['local_llm', 'openai_gpt4'],
      confidence: 0.93,
      executionTime: 245,
      metadata: {
        prompt: params.prompt || params,
        task: params.task || 'content_generation',
        preferences: params.preferences || {},
      },
    });
  }),

  routeRequest: jest.fn().mockResolvedValue({
    selectedProvider: 'openai',
    selectedModel: 'gpt-4',
    strategy: 'quality_optimized',
    reasoning: 'Complex query requiring advanced reasoning',
    alternatives: [
      { provider: 'anthropic', model: 'claude-3', score: 0.88 },
      { provider: 'local', model: 'llama-2', score: 0.72 },
    ],
    estimatedLatency: 1200,
    estimatedCost: 0.003,
    confidence: 0.91,
  }),

  optimizeStrategy: jest.fn().mockResolvedValue({
    strategy: 'balanced',
    configuration: {
      primary: { provider: 'openai', model: 'gpt-4', weight: 0.6 },
      secondary: { provider: 'local', model: 'llama-2', weight: 0.3 },
      fallback: { provider: 'anthropic', model: 'claude-3', weight: 0.1 },
    },
    expectedPerformance: {
      quality: 0.88,
      speed: 0.75,
      cost: 0.82,
      reliability: 0.95,
    },
  }),

  evaluateModels: jest.fn().mockResolvedValue({
    rankings: [
      { model: 'gpt-4', score: 0.92, strengths: ['reasoning', 'creativity'] },
      { model: 'claude-3', score: 0.89, strengths: ['analysis', 'safety'] },
      { model: 'llama-2', score: 0.75, strengths: ['speed', 'cost'] },
    ],
    recommendation: 'gpt-4',
    reasoning: 'Best balance of quality and capabilities for this use case',
  }),

  processWithFallback: jest.fn().mockResolvedValue({
    result: 'Successfully processed request with primary model',
    modelUsed: 'gpt-4',
    attempts: 1,
    fallbackTriggered: false,
    totalLatency: 850,
    processingDetails: {
      tokenCount: 150,
      requestTime: 820,
      postProcessing: 30,
    },
  }),

  combineResponses: jest.fn().mockResolvedValue({
    combinedResponse: 'Synthesized response from multiple models',
    sources: [
      { model: 'gpt-4', contribution: 0.5 },
      { model: 'claude-3', contribution: 0.3 },
      { model: 'llama-2', contribution: 0.2 },
    ],
    confidenceScore: 0.87,
    consensusLevel: 'high',
  }),

  adaptToContext: jest.fn().mockResolvedValue({
    adaptedStrategy: 'speed_optimized',
    reason: 'User context indicates time-sensitive request',
    modifications: [
      'Switched to faster model',
      'Reduced token limit',
      'Enabled caching',
    ],
    expectedImpact: {
      speedImprovement: '40%',
      qualityTradeoff: '5%',
    },
  }),
};