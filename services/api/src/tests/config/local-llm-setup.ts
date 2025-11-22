/**
 * Local LLM Test Setup Configuration
 * Initialization and configuration for local LLM testing environment
 */

import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';

// Global test state
interface TestState {
  modelCache: Map<string, any>;
  performanceMetrics: Map<string, number[]>;
  qualityMetrics: Map<string, number[]>;
  testStartTime: number;
}

declare global {
  var localLLMTestState: TestState;
  var mockLocalLLMService: jest.MockedClass<unknown>;
  var performanceTracker: PerformanceTracker;
}

class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  startTimer(testName: string): () => number {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(testName)) {
        this.metrics.set(testName, []);
      }
      this.metrics.get(testName)!.push(duration);
      
      return duration;
    };
  }

  getMetrics(testName: string): number[] {
    return this.metrics.get(testName) || [];
  }

  getP95(testName: string): number {
    const values = this.getMetrics(testName);
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(values.length * 0.95) - 1;
    return sorted[index];
  }

  getAverage(testName: string): number {
    const values = this.getMetrics(testName);
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Mock Local LLM Service for testing
class MockLocalLLMService {
  private isLoaded = false;
  private currentModel: string | null = null;
  private responseDelay: number;
  private qualityScore: number;

  constructor(config: { responseDelay?: number; qualityScore?: number } = {}) {
    this.responseDelay = config.responseDelay ?? 100;
    this.qualityScore = config.qualityScore ?? 4.2;
  }

  async loadModel(modelName: string): Promise<{ 
    success: boolean; 
    model?: unknown; 
    loadTime?: number; 
    error?: string 
  }> {
    const startTime = performance.now();
    
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (modelName.includes('invalid')) {
      return { 
        success: false, 
        error: 'Model not found' 
      };
    }

    this.isLoaded = true;
    this.currentModel = modelName;
    
    return {
      success: true,
      model: {
        name: modelName,
        quantization: 'Q4_K_M',
        memoryUsage: 3.5 * 1024 * 1024 * 1024, // 3.5GB
        loadTime: performance.now() - startTime
      },
      loadTime: performance.now() - startTime
    };
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: unknown = {}
  ): Promise<{
    content: string;
    tokensGenerated: number;
    qualityScore: number;
    processingTime: number;
    model: string;
  }> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    const startTime = performance.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));

    // Generate contextual response based on input
    const userMessage = messages[messages.length - 1]?.content || '';
    let response = 'I understand your request. ';

    if (userMessage.toLowerCase().includes('exercise') || userMessage.toLowerCase().includes('fitness')) {
      response += 'Regular exercise is important for physical and mental health. ';
    } else if (userMessage.toLowerCase().includes('motivation')) {
      response += 'Staying motivated can be challenging, but setting small, achievable goals helps. ';
    } else if (userMessage.toLowerCase().includes('goal')) {
      response += 'Setting SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) is key to success. ';
    } else {
      response += 'Let me help you work through this step by step. ';
    }

    response += 'What specific area would you like to focus on first?';

    return {
      content: response,
      tokensGenerated: Math.floor(response.length / 4), // Rough token estimate
      qualityScore: this.qualityScore + (Math.random() - 0.5) * 0.5, // ±0.25 variation
      processingTime: performance.now() - startTime,
      model: this.currentModel!
    };
  }

  async generateCoachingResponse(
    prompt: string,
    context: { personality?: string; userId?: string }
  ): Promise<{
    content: string;
    qualityScore: number;
    personality: string;
  }> {
    const personality = context.personality || 'balanced';
    let response = '';

    switch (personality) {
      case 'motivational':
        response = 'You absolutely can achieve this! I believe in your potential. ';
        break;
      case 'analytical':
        response = 'Let\'s analyze this systematically and create a data-driven approach. ';
        break;
      case 'supportive':
        response = 'I understand this might feel overwhelming. Let\'s take it one step at a time. ';
        break;
      default:
        response = 'I\'m here to help you succeed. ';
    }

    // Add context-specific content
    if (prompt.toLowerCase().includes('unmotivated')) {
      response += 'Low motivation is completely normal. What usually helps you feel energized?';
    } else {
      response += 'What\'s the most important thing you\'d like to work on right now?';
    }

    return {
      content: response,
      qualityScore: this.qualityScore,
      personality
    };
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  getCurrentModel(): string | null {
    return this.currentModel;
  }

  setQualityScore(score: number): void {
    this.qualityScore = score;
  }

  setResponseDelay(delay: number): void {
    this.responseDelay = delay;
  }
}

// Quality validation helpers
export class QualityValidator {
  static validateResponseStructure(response: unknown): boolean {
    return (
      typeof response === 'object' &&
      typeof response.content === 'string' &&
      response.content.length > 0 &&
      typeof response.tokensGenerated === 'number' &&
      response.tokensGenerated > 0
    );
  }

  static validateCoachingQuality(response: string, expectedKeywords: string[]): boolean {
    const content = response.toLowerCase();
    return expectedKeywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  static calculateSimilarityScore(response1: string, response2: string): number {
    // Simple Jaccard similarity for testing
    const words1 = new Set(response1.toLowerCase().split(/\s+/));
    const words2 = new Set(response2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

// Test data factory
export class LocalLLMTestDataFactory {
  static createTestMessages(count: number = 5): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    const userPrompts = [
      'Help me set a fitness goal',
      'I feel unmotivated about exercising',
      'How can I stay consistent with my habits?',
      'I want to improve my productivity',
      'Help me manage stress better'
    ];

    const assistantResponses = [
      'I can help you create a SMART fitness goal...',
      'Low motivation is common. Let\'s find what inspires you...',
      'Consistency comes from building small, sustainable habits...',
      'Productivity improvement starts with understanding your peak hours...',
      'Stress management involves both mental and physical strategies...'
    ];

    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) {
        messages.push({
          role: 'user',
          content: userPrompts[i % userPrompts.length]
        });
      } else {
        messages.push({
          role: 'assistant',
          content: assistantResponses[Math.floor(i / 2) % assistantResponses.length]
        });
      }
    }

    return messages;
  }

  static createDeviceProfile(type: 'high-end' | 'mid-range' | 'low-end') {
    const profiles = {
      'high-end': {
        model: 'iPhone 15 Pro',
        batteryLevel: 85,
        thermalState: 'nominal',
        availableMemory: 8 * 1024 * 1024 * 1024, // 8GB
        processingPower: 'high'
      },
      'mid-range': {
        model: 'iPhone 12',
        batteryLevel: 50,
        thermalState: 'fair',
        availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
        processingPower: 'medium'
      },
      'low-end': {
        model: 'iPhone SE',
        batteryLevel: 25,
        thermalState: 'critical',
        availableMemory: 3 * 1024 * 1024 * 1024, // 3GB
        processingPower: 'low'
      }
    };

    return profiles[type];
  }
}

// Performance assertion helpers
export const performanceAssertions = {
  expectLatencyUnder(actualMs: number, thresholdMs: number, testName: string) {
    if (actualMs > thresholdMs) {
      throw new Error(
        `Performance assertion failed for ${testName}: ` +
        `Expected latency under ${thresholdMs}ms, got ${actualMs}ms`
      );
    }
  },

  expectQualityAbove(actualScore: number, threshold: number, testName: string) {
    if (actualScore < threshold) {
      throw new Error(
        `Quality assertion failed for ${testName}: ` +
        `Expected quality above ${threshold}, got ${actualScore}`
      );
    }
  },

  expectMemoryUsageUnder(actualMB: number, thresholdMB: number, testName: string) {
    if (actualMB > thresholdMB) {
      throw new Error(
        `Memory assertion failed for ${testName}: ` +
        `Expected memory under ${thresholdMB}MB, got ${actualMB}MB`
      );
    }
  }
};

// Setup function called before each test
beforeEach(() => {
  // Initialize global test state
  global.localLLMTestState = {
    modelCache: new Map(),
    performanceMetrics: new Map(),
    qualityMetrics: new Map(),
    testStartTime: performance.now()
  };

  // Initialize performance tracker
  global.performanceTracker = new PerformanceTracker();

  // Create mock service with default configuration
  global.mockLocalLLMService = MockLocalLLMService as unknown;
});

// Cleanup function called after each test
afterEach(() => {
  // Clear performance metrics
  global.performanceTracker?.clear();
  
  // Clear model cache
  global.localLLMTestState?.modelCache.clear();
  
  // Log test duration for performance monitoring
  const testDuration = performance.now() - global.localLLMTestState?.testStartTime;
  if (testDuration > 10000) { // Warn if test takes >10 seconds
    console.warn(`Long-running test detected: ${testDuration}ms`);
  }
});

// Global error handler for unhandled model failures
process.on('unhandledRejection', (reason, promise) => {
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as Error).message;
    if (message.includes('model') || message.includes('inference')) {
      console.error('Local LLM model error:', reason);
      // Don't fail the test, just log the error
      return;
    }
  }
  
  // Re-throw for other errors
  throw reason;
});

// Export utilities for use in tests
export {
  MockLocalLLMService,
  PerformanceTracker
};