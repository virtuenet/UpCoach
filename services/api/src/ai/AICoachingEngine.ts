/**
 * AI Coaching Engine - Core AI coaching orchestration system
 *
 * Features:
 * - GPT-4 Turbo and Claude 3 Opus integration
 * - Multi-turn conversation management with context optimization
 * - Coaching style adaptation (supportive, challenging, analytical, motivational)
 * - Goal-oriented conversation steering
 * - Emotional intelligence detection
 * - Action item extraction and progress tracking
 * - Response streaming support
 * - Safety filters and multilingual support
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Types and Interfaces
export type AIModel = 'gpt-4-turbo' | 'gpt-4' | 'claude-3-opus' | 'claude-3-sonnet';
export type CoachingStyle = 'supportive' | 'challenging' | 'analytical' | 'motivational';
export type MessageRole = 'system' | 'user' | 'assistant';
export type EmotionalState = 'positive' | 'neutral' | 'negative' | 'stressed' | 'motivated' | 'confused';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  coachId?: string;
  goals?: Array<{ id: string; title: string; progress: number }>;
  recentProgress?: Array<{ date: Date; activity: string; outcome: string }>;
  userProfile?: {
    name: string;
    preferences: Record<string, any>;
    language: string;
    timezone: string;
  };
  conversationHistory: Message[];
  currentStyle: CoachingStyle;
  emotionalState?: EmotionalState;
  actionItems: ActionItem[];
  totalTokens: number;
  lastInteraction: Date;
}

export interface ActionItem {
  id: string;
  content: string;
  category: 'goal' | 'habit' | 'reflection' | 'task' | 'question';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  completed: boolean;
  extractedAt: Date;
}

export interface CoachingResponse {
  message: string;
  messageId: string;
  emotionalTone: string;
  suggestedActions?: ActionItem[];
  followUpQuestions?: string[];
  confidence: number;
  model: AIModel;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  processingTime: number;
}

export interface StreamChunk {
  delta: string;
  fullText: string;
  isComplete: boolean;
  tokens?: number;
}

interface SafetyCheckResult {
  isSafe: boolean;
  reasons?: string[];
  suggestedResponse?: string;
}

// Configuration
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MAX_CONTEXT_TOKENS: 120000, // Leave room for response
  MAX_CONVERSATION_HISTORY: 50,
  DEFAULT_MODEL: 'gpt-4-turbo' as AIModel,
  TEMPERATURE: 0.7,
  MAX_COMPLETION_TOKENS: 2000,
  STREAM_ENABLED: true,
  SAFETY_ENABLED: true,
};

/**
 * AI Coaching Engine - Main orchestrator for AI-powered coaching
 */
export class AICoachingEngine extends EventEmitter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private redis: Redis;
  private conversations: Map<string, ConversationContext>;

  constructor() {
    super();

    // Initialize AI clients
    this.openai = new OpenAI({
      apiKey: CONFIG.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: CONFIG.ANTHROPIC_API_KEY,
    });

    // Initialize Redis for conversation state
    this.redis = new Redis(CONFIG.REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.conversations = new Map();

    this.redis.on('error', (err) => {
      this.emit('error', { type: 'redis', error: err });
    });

    this.redis.on('connect', () => {
      this.emit('ready', { service: 'redis' });
    });
  }

  /**
   * Start a new coaching session
   */
  async startSession(
    userId: string,
    options: {
      coachId?: string;
      style?: CoachingStyle;
      model?: AIModel;
      language?: string;
      goals?: Array<{ id: string; title: string; progress: number }>;
    } = {}
  ): Promise<string> {
    const sessionId = uuidv4();
    const language = options.language || 'en';

    const context: ConversationContext = {
      sessionId,
      userId,
      coachId: options.coachId,
      goals: options.goals || [],
      conversationHistory: [],
      currentStyle: options.style || 'supportive',
      actionItems: [],
      totalTokens: 0,
      lastInteraction: new Date(),
      userProfile: {
        name: 'User',
        preferences: {},
        language,
        timezone: 'UTC',
      },
    };

    // Add system message
    const systemMessage = this.buildSystemPrompt(context, options.model || CONFIG.DEFAULT_MODEL);
    context.conversationHistory.push({
      id: uuidv4(),
      role: 'system',
      content: systemMessage,
      timestamp: new Date(),
    });

    this.conversations.set(sessionId, context);
    await this.saveContextToRedis(sessionId, context);

    this.emit('session:started', { sessionId, userId, style: context.currentStyle });

    return sessionId;
  }

  /**
   * Send a message and get AI coaching response
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    options: {
      model?: AIModel;
      stream?: boolean;
      includeActions?: boolean;
    } = {}
  ): Promise<CoachingResponse> {
    const startTime = Date.now();
    const context = await this.getContext(sessionId);

    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Safety check
    if (CONFIG.SAFETY_ENABLED) {
      const safetyCheck = await this.performSafetyCheck(userMessage);
      if (!safetyCheck.isSafe) {
        this.emit('safety:violation', { sessionId, reasons: safetyCheck.reasons });
        return this.createSafetyResponse(safetyCheck, startTime);
      }
    }

    // Add user message to history
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    context.conversationHistory.push(userMsg);

    // Detect emotional state
    context.emotionalState = await this.detectEmotionalState(userMessage);

    // Optimize context window
    const optimizedHistory = await this.optimizeContextWindow(context);

    // Select model
    const model = options.model || CONFIG.DEFAULT_MODEL;

    // Generate response
    let response: CoachingResponse;
    if (options.stream) {
      response = await this.generateStreamingResponse(
        context,
        optimizedHistory,
        model,
        startTime
      );
    } else {
      response = await this.generateResponse(
        context,
        optimizedHistory,
        model,
        startTime
      );
    }

    // Add assistant message to history
    const assistantMsg: Message = {
      id: response.messageId,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      tokens: response.tokens.completion,
    };
    context.conversationHistory.push(assistantMsg);

    // Extract action items
    if (options.includeActions !== false) {
      const actions = await this.extractActionItems(response.message);
      response.suggestedActions = actions;
      context.actionItems.push(...actions);
    }

    // Update token count
    context.totalTokens += response.tokens.total;
    context.lastInteraction = new Date();

    // Save context
    await this.saveContextToRedis(sessionId, context);
    this.conversations.set(sessionId, context);

    this.emit('message:sent', {
      sessionId,
      userId: context.userId,
      tokens: response.tokens,
      model,
    });

    return response;
  }

  /**
   * Stream a coaching response
   */
  async *streamMessage(
    sessionId: string,
    userMessage: string,
    model?: AIModel
  ): AsyncGenerator<StreamChunk> {
    const context = await this.getContext(sessionId);

    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add user message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    context.conversationHistory.push(userMsg);

    const optimizedHistory = await this.optimizeContextWindow(context);
    const selectedModel = model || CONFIG.DEFAULT_MODEL;

    let fullText = '';
    let totalTokens = 0;

    if (selectedModel.startsWith('gpt')) {
      const messages = this.formatMessagesForOpenAI(optimizedHistory);
      const stream = await this.openai.chat.completions.create({
        model: selectedModel === 'gpt-4-turbo' ? 'gpt-4-turbo-preview' : selectedModel,
        messages,
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_COMPLETION_TOKENS,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullText += delta;
        totalTokens = chunk.usage?.total_tokens || totalTokens;

        yield {
          delta,
          fullText,
          isComplete: false,
          tokens: totalTokens,
        };
      }
    } else {
      // Claude streaming
      const messages = this.formatMessagesForClaude(optimizedHistory);
      const stream = await this.anthropic.messages.stream({
        model: selectedModel === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
        max_tokens: CONFIG.MAX_COMPLETION_TOKENS,
        messages,
        temperature: CONFIG.TEMPERATURE,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const delta = chunk.delta.text;
          fullText += delta;

          yield {
            delta,
            fullText,
            isComplete: false,
          };
        }
      }
    }

    // Final chunk
    yield {
      delta: '',
      fullText,
      isComplete: true,
      tokens: totalTokens,
    };

    // Save assistant message
    const assistantMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: fullText,
      timestamp: new Date(),
      tokens: totalTokens,
    };
    context.conversationHistory.push(assistantMsg);
    context.totalTokens += totalTokens;

    await this.saveContextToRedis(sessionId, context);
  }

  /**
   * Change coaching style mid-session
   */
  async changeCoachingStyle(sessionId: string, newStyle: CoachingStyle): Promise<void> {
    const context = await this.getContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const oldStyle = context.currentStyle;
    context.currentStyle = newStyle;

    // Update system message
    const systemMessage = this.buildSystemPrompt(context, CONFIG.DEFAULT_MODEL);
    context.conversationHistory[0].content = systemMessage;

    await this.saveContextToRedis(sessionId, context);
    this.conversations.set(sessionId, context);

    this.emit('style:changed', { sessionId, oldStyle, newStyle });
  }

  /**
   * Generate session summary
   */
  async generateSessionSummary(sessionId: string): Promise<{
    summary: string;
    keyTopics: string[];
    actionItems: ActionItem[];
    emotionalJourney: string;
    nextSteps: string[];
    duration: number;
  }> {
    const context = await this.getContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const conversationText = context.conversationHistory
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = `Analyze this coaching conversation and provide a comprehensive summary:

${conversationText}

Provide:
1. A concise summary (2-3 paragraphs)
2. Key topics discussed
3. Emotional journey of the coachee
4. Recommended next steps

Format as JSON with keys: summary, keyTopics (array), emotionalJourney, nextSteps (array)`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing coaching conversations.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    const duration =
      context.conversationHistory.length > 0
        ? new Date().getTime() - context.conversationHistory[0].timestamp.getTime()
        : 0;

    return {
      summary: analysis.summary || '',
      keyTopics: analysis.keyTopics || [],
      actionItems: context.actionItems,
      emotionalJourney: analysis.emotionalJourney || '',
      nextSteps: analysis.nextSteps || [],
      duration: Math.floor(duration / 1000 / 60), // minutes
    };
  }

  /**
   * Get conversation analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    totalTokens: number;
    averageResponseTime: number;
    emotionalStates: Record<string, number>;
    actionItemCount: number;
    completedActions: number;
  }> {
    const context = await this.getContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const userMessages = context.conversationHistory.filter((m) => m.role === 'user');
    const assistantMessages = context.conversationHistory.filter((m) => m.role === 'assistant');

    // Calculate average response time
    let totalResponseTime = 0;
    let responsePairs = 0;

    for (let i = 0; i < context.conversationHistory.length - 1; i++) {
      if (
        context.conversationHistory[i].role === 'user' &&
        context.conversationHistory[i + 1].role === 'assistant'
      ) {
        const responseTime =
          context.conversationHistory[i + 1].timestamp.getTime() -
          context.conversationHistory[i].timestamp.getTime();
        totalResponseTime += responseTime;
        responsePairs++;
      }
    }

    const averageResponseTime = responsePairs > 0 ? totalResponseTime / responsePairs : 0;

    return {
      messageCount: context.conversationHistory.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      totalTokens: context.totalTokens,
      averageResponseTime: Math.floor(averageResponseTime / 1000), // seconds
      emotionalStates: {}, // Would analyze all messages
      actionItemCount: context.actionItems.length,
      completedActions: context.actionItems.filter((a) => a.completed).length,
    };
  }

  /**
   * End a coaching session
   */
  async endSession(sessionId: string): Promise<void> {
    const context = await this.getContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Generate final summary
    const summary = await this.generateSessionSummary(sessionId);

    this.emit('session:ended', {
      sessionId,
      userId: context.userId,
      duration: summary.duration,
      messageCount: context.conversationHistory.length,
    });

    // Clean up
    this.conversations.delete(sessionId);
    await this.redis.del(`session:${sessionId}`);
  }

  // Private helper methods

  private buildSystemPrompt(context: ConversationContext, model: AIModel): string {
    const stylePrompts = {
      supportive:
        'You are a warm, empathetic coach who provides encouragement and validation. Focus on building confidence and celebrating progress.',
      challenging:
        'You are a direct, growth-oriented coach who asks tough questions and pushes for excellence. Challenge assumptions and encourage stepping outside comfort zones.',
      analytical:
        'You are a logical, data-driven coach who focuses on systematic problem-solving. Break down complex issues and provide structured frameworks.',
      motivational:
        'You are an energetic, inspiring coach who ignites passion and drive. Use powerful language and vivid imagery to motivate action.',
    };

    const goalsContext =
      context.goals && context.goals.length > 0
        ? `\n\nCurrent Goals:\n${context.goals.map((g) => `- ${g.title} (${g.progress}% complete)`).join('\n')}`
        : '';

    const language = context.userProfile?.language || 'en';
    const languageInstruction =
      language !== 'en' ? `\n\nRespond in ${language} language.` : '';

    return `You are an expert AI coaching assistant for UpCoach, a professional coaching platform.

Coaching Style: ${context.currentStyle}
${stylePrompts[context.currentStyle]}

Core Principles:
- Ask powerful, open-ended questions that promote self-discovery
- Listen actively and reflect back what you hear
- Focus on the coachee's agenda and goals
- Maintain confidentiality and build trust
- Use the GROW model (Goal, Reality, Options, Will) when appropriate
- Adapt your communication style to the coachee's needs
- Celebrate wins and acknowledge progress
- Help identify limiting beliefs and reframe perspectives
- Encourage action and accountability${goalsContext}${languageInstruction}

Guidelines:
- Keep responses concise (2-4 paragraphs)
- Ask one thoughtful question at a time
- Avoid giving direct advice unless asked
- Use coaching techniques: powerful questions, active listening, reframing
- Be present and authentic in your responses
- Reference previous conversation context when relevant`;
  }

  private async generateResponse(
    context: ConversationContext,
    messages: Message[],
    model: AIModel,
    startTime: number
  ): Promise<CoachingResponse> {
    let response: string;
    let promptTokens: number;
    let completionTokens: number;

    if (model.startsWith('gpt')) {
      const formattedMessages = this.formatMessagesForOpenAI(messages);
      const completion = await this.openai.chat.completions.create({
        model: model === 'gpt-4-turbo' ? 'gpt-4-turbo-preview' : model,
        messages: formattedMessages,
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_COMPLETION_TOKENS,
      });

      response = completion.choices[0].message.content || '';
      promptTokens = completion.usage?.prompt_tokens || 0;
      completionTokens = completion.usage?.completion_tokens || 0;
    } else {
      // Claude
      const formattedMessages = this.formatMessagesForClaude(messages);
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';

      const completion = await this.anthropic.messages.create({
        model:
          model === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
        max_tokens: CONFIG.MAX_COMPLETION_TOKENS,
        system: systemMessage,
        messages: formattedMessages,
        temperature: CONFIG.TEMPERATURE,
      });

      response = completion.content[0].type === 'text' ? completion.content[0].text : '';
      promptTokens = completion.usage.input_tokens;
      completionTokens = completion.usage.output_tokens;
    }

    const emotionalTone = this.analyzeEmotionalTone(response);
    const followUpQuestions = this.extractQuestions(response);
    const processingTime = Date.now() - startTime;

    return {
      message: response,
      messageId: uuidv4(),
      emotionalTone,
      followUpQuestions,
      confidence: 0.85,
      model,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      processingTime,
    };
  }

  private async generateStreamingResponse(
    context: ConversationContext,
    messages: Message[],
    model: AIModel,
    startTime: number
  ): Promise<CoachingResponse> {
    let fullResponse = '';
    let totalTokens = 0;

    const generator = this.streamMessage(context.sessionId, messages[messages.length - 1].content, model);

    for await (const chunk of generator) {
      fullResponse = chunk.fullText;
      totalTokens = chunk.tokens || 0;

      this.emit('stream:chunk', {
        sessionId: context.sessionId,
        delta: chunk.delta,
        fullText: chunk.fullText,
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      message: fullResponse,
      messageId: uuidv4(),
      emotionalTone: this.analyzeEmotionalTone(fullResponse),
      followUpQuestions: this.extractQuestions(fullResponse),
      confidence: 0.85,
      model,
      tokens: {
        prompt: Math.floor(totalTokens * 0.6), // Estimate
        completion: Math.floor(totalTokens * 0.4),
        total: totalTokens,
      },
      processingTime,
    };
  }

  private formatMessagesForOpenAI(messages: Message[]): Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private formatMessagesForClaude(messages: Message[]): Array<{
    role: 'user' | 'assistant';
    content: string;
  }> {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  private async optimizeContextWindow(context: ConversationContext): Promise<Message[]> {
    const systemMessage = context.conversationHistory[0];
    let messages = context.conversationHistory.slice(1);

    // Calculate approximate tokens (rough estimate: 1 token ≈ 4 characters)
    let totalTokens = systemMessage.content.length / 4;

    // Keep most recent messages that fit in context window
    const optimized: Message[] = [systemMessage];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = messages[i].content.length / 4;
      if (totalTokens + msgTokens < CONFIG.MAX_CONTEXT_TOKENS) {
        optimized.unshift(messages[i]);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    // Ensure we have system message
    if (optimized.length === 1) {
      return [systemMessage];
    }

    return optimized;
  }

  private async detectEmotionalState(message: string): Promise<EmotionalState> {
    const lowerMessage = message.toLowerCase();

    // Simple keyword-based detection (in production, use ML model)
    if (
      lowerMessage.includes('stressed') ||
      lowerMessage.includes('overwhelmed') ||
      lowerMessage.includes('anxious')
    ) {
      return 'stressed';
    }

    if (
      lowerMessage.includes('excited') ||
      lowerMessage.includes('motivated') ||
      lowerMessage.includes('ready')
    ) {
      return 'motivated';
    }

    if (
      lowerMessage.includes('confused') ||
      lowerMessage.includes('unsure') ||
      lowerMessage.includes('stuck')
    ) {
      return 'confused';
    }

    if (
      lowerMessage.includes('frustrated') ||
      lowerMessage.includes('disappointed') ||
      lowerMessage.includes('failing')
    ) {
      return 'negative';
    }

    if (
      lowerMessage.includes('great') ||
      lowerMessage.includes('happy') ||
      lowerMessage.includes('achieved')
    ) {
      return 'positive';
    }

    return 'neutral';
  }

  private analyzeEmotionalTone(response: string): string {
    const lowerResponse = response.toLowerCase();

    if (
      lowerResponse.includes('congratulations') ||
      lowerResponse.includes('wonderful') ||
      lowerResponse.includes('excellent')
    ) {
      return 'encouraging';
    }

    if (lowerResponse.includes('challenge') || lowerResponse.includes('push')) {
      return 'challenging';
    }

    if (lowerResponse.includes('understand') || lowerResponse.includes('hear you')) {
      return 'empathetic';
    }

    return 'neutral';
  }

  private extractQuestions(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    return sentences
      .filter((s) => s.includes('?'))
      .map((s) => s.trim() + '?')
      .slice(0, 3);
  }

  private async extractActionItems(message: string): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];

    // Use GPT to extract action items
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Extract action items from the coaching message. Return JSON array with format:
[{ "content": "action description", "category": "goal|habit|reflection|task|question", "priority": "high|medium|low" }]`,
          },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"actions":[]}');
      const actions = result.actions || [];

      return actions.map((action: any) => ({
        id: uuidv4(),
        content: action.content,
        category: action.category || 'task',
        priority: action.priority || 'medium',
        completed: false,
        extractedAt: new Date(),
      }));
    } catch (error) {
      this.emit('error', { type: 'action-extraction', error });
      return actionItems;
    }
  }

  private async performSafetyCheck(message: string): Promise<SafetyCheckResult> {
    try {
      const moderation = await this.openai.moderations.create({
        input: message,
      });

      const result = moderation.results[0];

      if (result.flagged) {
        const categories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category);

        return {
          isSafe: false,
          reasons: categories,
          suggestedResponse:
            "I appreciate you sharing, but I'm not able to discuss that topic. Let's focus on your coaching goals. What would you like to work on today?",
        };
      }

      return { isSafe: true };
    } catch (error) {
      this.emit('error', { type: 'safety-check', error });
      return { isSafe: true }; // Fail open
    }
  }

  private createSafetyResponse(
    safetyCheck: SafetyCheckResult,
    startTime: number
  ): CoachingResponse {
    return {
      message: safetyCheck.suggestedResponse || 'I cannot respond to that message.',
      messageId: uuidv4(),
      emotionalTone: 'neutral',
      confidence: 1.0,
      model: 'safety-filter' as AIModel,
      tokens: { prompt: 0, completion: 0, total: 0 },
      processingTime: Date.now() - startTime,
    };
  }

  private async getContext(sessionId: string): Promise<ConversationContext | null> {
    // Try memory first
    if (this.conversations.has(sessionId)) {
      return this.conversations.get(sessionId)!;
    }

    // Try Redis
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      if (data) {
        const context = JSON.parse(data);
        // Convert date strings back to Date objects
        context.conversationHistory = context.conversationHistory.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        context.lastInteraction = new Date(context.lastInteraction);
        context.actionItems = context.actionItems.map((a: any) => ({
          ...a,
          extractedAt: new Date(a.extractedAt),
          dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
        }));

        this.conversations.set(sessionId, context);
        return context;
      }
    } catch (error) {
      this.emit('error', { type: 'redis-get', error });
    }

    return null;
  }

  private async saveContextToRedis(
    sessionId: string,
    context: ConversationContext
  ): Promise<void> {
    try {
      await this.redis.setex(
        `session:${sessionId}`,
        86400 * 7, // 7 days TTL
        JSON.stringify(context)
      );
    } catch (error) {
      this.emit('error', { type: 'redis-save', error });
    }
  }

  /**
   * Cleanup and close connections
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();
    this.conversations.clear();
    this.emit('shutdown');
  }
}

export default AICoachingEngine;
