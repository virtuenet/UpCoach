import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { PromptEngineering } from './PromptEngineering';
import { ContextManager } from './ContextManager';
import { PersonalityEngine } from './PersonalityEngine';
import { CircuitBreaker } from './CircuitBreaker';
import { RetryMechanism } from './RetryMechanism';
import { getCacheService } from '../cache/UnifiedCacheService';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  function_call?: any;
}

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
  };
  model?: string;
  provider?: 'openai' | 'claude';
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'claude';
  personality?: string;
  context?: any;
  useCache?: boolean;
  cacheTTL?: number;
}

export class AIService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private promptEngine: PromptEngineering;
  private contextManager: ContextManager;
  private personalityEngine: PersonalityEngine;
  private circuitBreaker: CircuitBreaker;
  private retry: RetryMechanism;
  private metrics = {
    totalRequests: 0,
    totalErrors: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor() {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: config.openai?.apiKey || process.env.OPENAI_API_KEY,
    });

    // Initialize Claude
    this.anthropic = new Anthropic({
      apiKey: config.claude?.apiKey || process.env.CLAUDE_API_KEY,
    });

    // Initialize engines
    this.promptEngine = new PromptEngineering();
    this.contextManager = new ContextManager();
    this.personalityEngine = new PersonalityEngine();
    
    // Initialize resilience components
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
      halfOpenRetries: 3
    });
    
    this.retry = new RetryMechanism();
  }

  async generateResponse(
    messages: AIMessage[],
    options: AIOptions = {}
  ): Promise<AIResponse> {
    const {
      provider = 'openai',
      model = provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-sonnet-20240229',
      temperature = 0.7,
      maxTokens = 1000,
      personality = 'default',
      context = {},
      useCache = true,
      cacheTTL = 300
    } = options;

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Generate cache key
      const cacheKey = JSON.stringify({ messages, options });
      
      // Check cache if enabled
      if (useCache) {
        const cached = await getCacheService().get<AIResponse>(cacheKey, {
          namespace: 'ai-responses',
          ttl: cacheTTL
        });
        
        if (cached) {
          this.metrics.cacheHits++;
          return cached;
        }
        this.metrics.cacheMisses++;
      }
      // Apply personality to system prompt
      const systemPrompt = this.personalityEngine.getSystemPrompt(personality);
      
      // Enrich messages with context
      const enrichedMessages = await this.contextManager.enrichMessages(messages, context);
      
      // Apply prompt engineering
      const engineeredMessages = this.promptEngine.optimizeMessages(enrichedMessages, {
        personality,
        context,
        provider
      });
      
      // Optimize token usage
      const optimizedMessages = this.optimizeTokenUsage(engineeredMessages);

      // Add system prompt if not present
      if (!optimizedMessages.find(m => m.role === 'system')) {
        optimizedMessages.unshift({
          role: 'system',
          content: systemPrompt
        });
      }

      // Execute with circuit breaker and retry
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retry.execute(async () => {
          if (provider === 'openai') {
            return await this.generateOpenAIResponse(optimizedMessages, { model, temperature, maxTokens });
          } else {
            return await this.generateClaudeResponse(optimizedMessages, { model, temperature, maxTokens });
          }
        }, {
          maxRetries: 3,
          onRetry: (error, attempt) => {
            logger.warn(`AI request retry attempt ${attempt}:`, error.message);
          }
        });
      });
      
      // Track metrics
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      
      // Cache successful response
      if (useCache) {
        await getCacheService().set(cacheKey, response, {
          namespace: 'ai-responses',
          ttl: cacheTTL
        });
      }
      
      return response;
    } catch (error) {
      this.metrics.totalErrors++;
      logger.error('AI Service error:', (error as Error));
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  private async generateOpenAIResponse(
    messages: AIMessage[],
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model,
        messages: messages as any,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const completion = response.choices[0];
      
      return {
        content: completion.message.content || '',
        usage: {
          input_tokens: response.usage?.prompt_tokens || 0,
          output_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        provider: 'openai'
      };
    } catch (error) {
      logger.error('OpenAI API error:', (error as Error));
      throw error;
    }
  }

  private async generateClaudeResponse(
    messages: AIMessage[],
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIResponse> {
    try {
      // Extract system message for Claude
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter((m: any) => m.role !== 'system');

      const response = await this.anthropic.messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage?.content,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('');

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        model: response.model,
        provider: 'claude'
      };
    } catch (error) {
      logger.error('Claude API error:', (error as Error));
      throw error;
    }
  }

  async generateCoachingResponse(
    userMessage: string,
    options: {
      conversationHistory?: AIMessage[];
      userId?: string;
      personality?: string;
      context?: any;
      provider?: 'openai' | 'claude';
    } = {}
  ): Promise<AIResponse> {
    const {
      conversationHistory = [],
      userId,
      personality = 'default',
      context = {},
      provider = 'openai'
    } = options;

    // Load user context if userId provided
    let userContext = context;
    if (userId) {
      userContext = await this.contextManager.getUserContext(userId);
    }

    const messages: AIMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    return this.generateResponse(messages, {
      provider,
      personality,
      context: userContext
    });
  }

  async analyzeConversation(
    messages: AIMessage[],
    analysisType: 'sentiment' | 'topics' | 'summary' | 'insights'
  ): Promise<any> {
    const analysisPrompts = {
      sentiment: 'Analyze the emotional sentiment of this conversation. Return a JSON object with overall_sentiment (positive/negative/neutral), emotion_breakdown (percentages), and key_emotional_moments.',
      topics: 'Extract the main topics discussed in this conversation. Return a JSON object with main_topics (array), topic_transitions, and topic_importance_scores.',
      summary: 'Provide a concise summary of this conversation. Return a JSON object with executive_summary, key_points (array), action_items (array), and decisions_made (array).',
      insights: 'Extract coaching insights from this conversation. Return a JSON object with user_patterns, growth_opportunities, recommended_actions, and progress_indicators.'
    };

    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const analysisMessages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant specialized in conversation analysis. Always return your analysis as valid JSON.'
      },
      {
        role: 'user',
        content: `${analysisPrompts[analysisType]}\n\nConversation:\n${conversationText}`
      }
    ];

    const response = await this.generateResponse(analysisMessages, {
      temperature: 0.3,
      maxTokens: 1500
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse analysis response:', (error as Error));
      return { error: 'Failed to parse analysis', raw: response.content };
    }
  }

  async generatePersonalizedPrompt(
    basePrompt: string,
    userId: string,
    promptType: 'goal' | 'habit' | 'reflection' | 'motivation'
  ): Promise<string> {
    const _userContext = await this.contextManager.getUserContext(userId);
    return this.promptEngine.generatePersonalizedPrompt(basePrompt, userContext, promptType);
  }

  // Model selection based on task
  getOptimalModel(task: 'coaching' | 'analysis' | 'creative' | 'technical'): { provider: 'openai' | 'claude'; model: string } {
    const modelMap = {
      coaching: { provider: 'openai' as const, model: 'gpt-4-turbo-preview' },
      analysis: { provider: 'claude' as const, model: 'claude-3-opus-20240229' },
      creative: { provider: 'openai' as const, model: 'gpt-4-turbo-preview' },
      technical: { provider: 'claude' as const, model: 'claude-3-sonnet-20240229' }
    };

    return modelMap[task] || modelMap.coaching;
  }

  // Create initial coaching session for new users
  async createInitialSession(userId: number, onboardingData: any): Promise<void> {
    try {
      const _userContext = await this.contextManager.getUserContext(String(userId));
      const _personality = await this.personalityEngine.getPersonality(String(userId));
      
      // Context will be built dynamically when needed
      // The context manager will fetch fresh data on each request

      logger.info(`Created initial AI session for user ${userId}`);
    } catch (error) {
      logger.error('Failed to create initial AI session:', (error as Error));
    }
  }
  
  // Token optimization
  private optimizeTokenUsage(messages: AIMessage[], maxTokens: number = 8000): AIMessage[] {
    let totalLength = 0;
    const optimized: AIMessage[] = [];
    
    // Start from the most recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const messageLength = messages[i].content.length;
      if (totalLength + messageLength > maxTokens && optimized.length > 0) {
        break;
      }
      optimized.unshift(messages[i]);
      totalLength += messageLength;
    }
    
    // If a message had to be truncated
    if (optimized.length > 0 && optimized[0].content.length > maxTokens) {
      optimized[0] = {
        ...optimized[0],
        content: optimized[0].content.substring(0, maxTokens)
      };
    }
    
    return optimized;
  }
  
  // Get performance metrics
  getMetrics() {
    const totalRequests = this.metrics.totalRequests || 1; // Avoid division by zero
    return {
      totalRequests: this.metrics.totalRequests,
      totalErrors: this.metrics.totalErrors,
      averageResponseTime: this.metrics.totalResponseTime / totalRequests,
      errorRate: this.metrics.totalErrors / totalRequests,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses || 1),
      circuitBreakerState: this.circuitBreaker.getState(),
      cacheStats: getCacheService().getStats()
    };
  }
  
  // Clear cache
  async clearCache(namespace?: string): Promise<void> {
    await getCacheService().invalidate('*', namespace || 'ai-responses');
  }
  
  // Health check
  async healthCheck(): Promise<{
    openai: boolean;
    claude: boolean;
    cache: boolean;
    circuitBreaker: string;
  }> {
    const health = {
      openai: false,
      claude: false,
      cache: false,
      circuitBreaker: this.circuitBreaker.getState()
    };
    
    // Test OpenAI
    try {
      await this.openai.models.list();
      health.openai = true;
    } catch (error) {
      logger.error('OpenAI health check failed:', (error as Error));
    }
    
    // Test Claude
    try {
      // Claude doesn't have a simple health check endpoint
      health.claude = !!this.anthropic;
    } catch (error) {
      logger.error('Claude health check failed:', (error as Error));
    }
    
    // Test cache
    const stats = getCacheService().getStats();
    health.cache = stats.hits >= 0 || stats.misses >= 0;
    
    return health;
  }
}

export const aiService = new AIService();