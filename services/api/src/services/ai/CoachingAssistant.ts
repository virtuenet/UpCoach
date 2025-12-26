import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * AI Coaching Assistant (Phase 8)
 *
 * Conversational AI coach that provides:
 * - Natural language understanding and intent classification
 * - Context-aware coaching responses
 * - Multi-turn conversations with memory
 * - Tone adaptation (supportive, challenging, analytical)
 * - Proactive outreach based on triggers
 *
 * Integrates with:
 * - OpenAI GPT-4 for advanced reasoning
 * - IntentClassifier for intent detection
 * - ConversationManager for context management
 * - SentimentAnalyzer for mood detection
 */

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  sentiment?: number;
  timestamp: Date;
  metadata?: any;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ConversationContext;
  intent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContext {
  currentGoals?: string[];
  recentHabits?: string[];
  mood?: string;
  energyLevel?: number;
  timezone?: string;
  coachingTone?: 'supportive' | 'challenging' | 'analytical';
}

export interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
  context?: Partial<ConversationContext>;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  intent: string;
  suggestedActions?: {
    type: string;
    label: string;
    action: string;
    data?: any;
  }[];
  metadata?: any;
}

export class CoachingAssistant {
  private db: Pool;
  private openAIKey: string;
  private modelName: string;

  constructor(db: Pool, openAIKey?: string, modelName: string = 'gpt-4') {
    this.db = db;
    this.openAIKey = openAIKey || process.env.OPENAI_API_KEY || '';
    this.modelName = modelName;
  }

  /**
   * Send message to coaching assistant
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { userId, message, conversationId, context } = request;

      // Get or create conversation
      const conversation = conversationId
        ? await this.getConversation(conversationId)
        : await this.createConversation(userId, context);

      // Classify intent
      const intent = await this.classifyIntent(message);

      // Update conversation context
      const updatedContext = await this.updateContext(conversation, message, intent);

      // Generate response
      const responseText = await this.generateResponse(
        message,
        intent,
        conversation,
        updatedContext
      );

      // Save user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        conversationId: conversation.id,
        role: 'user',
        content: message,
        intent,
        timestamp: new Date(),
      };

      // Save assistant message
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random() + 1}`,
        conversationId: conversation.id,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      await this.saveMessages([userMessage, assistantMessage], conversation.id);

      // Generate suggested actions
      const suggestedActions = this.generateSuggestedActions(intent, message, updatedContext);

      return {
        conversationId: conversation.id,
        message: responseText,
        intent,
        suggestedActions,
      };
    } catch (error) {
      logger.error('Failed to send message', { request, error });
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const query = `
        SELECT * FROM conversations
        WHERE id = $1
      `;
      const result = await this.db.query(query, [conversationId]);

      if (result.rows.length === 0) {
        throw new Error('Conversation not found');
      }

      return this.mapConversation(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get conversation', { conversationId, error });
      throw error;
    }
  }

  /**
   * Create new conversation
   */
  private async createConversation(
    userId: string,
    context?: Partial<ConversationContext>
  ): Promise<Conversation> {
    try {
      const defaultContext: ConversationContext = {
        currentGoals: [],
        recentHabits: [],
        mood: 'neutral',
        energyLevel: 5,
        timezone: 'UTC',
        coachingTone: 'supportive',
        ...context,
      };

      const query = `
        INSERT INTO conversations (
          id, user_id, messages, context, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, '[]'::jsonb, $2, NOW(), NOW()
        )
        RETURNING *
      `;

      const result = await this.db.query(query, [userId, JSON.stringify(defaultContext)]);
      return this.mapConversation(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create conversation', { userId, error });
      throw error;
    }
  }

  /**
   * Classify user intent
   */
  private async classifyIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Rule-based intent classification (can be replaced with ML model)
    if (lowerMessage.includes('create') && (lowerMessage.includes('goal') || lowerMessage.includes('objective'))) {
      return 'create_goal';
    }

    if (lowerMessage.includes('habit') && (lowerMessage.includes('track') || lowerMessage.includes('start'))) {
      return 'create_habit';
    }

    if (lowerMessage.includes('check in') || lowerMessage.includes('complete') || lowerMessage.includes('done')) {
      return 'check_in';
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing') || lowerMessage.includes('stats')) {
      return 'request_progress';
    }

    if (lowerMessage.includes('motivat') || lowerMessage.includes('inspire') || lowerMessage.includes('encourage')) {
      return 'request_motivation';
    }

    if (lowerMessage.includes('advice') || lowerMessage.includes('help') || lowerMessage.includes('suggest')) {
      return 'ask_advice';
    }

    if (lowerMessage.includes('stuck') || lowerMessage.includes('struggling') || lowerMessage.includes('difficult')) {
      return 'report_struggle';
    }

    return 'general_conversation';
  }

  /**
   * Update conversation context
   */
  private async updateContext(
    conversation: Conversation,
    message: string,
    intent: string
  ): Promise<ConversationContext> {
    // Update context based on message and intent
    const updatedContext = { ...conversation.context };

    // Analyze sentiment (simplified - use SentimentAnalyzer in production)
    const sentiment = this.analyzeSentiment(message);
    if (sentiment < -0.3) {
      updatedContext.mood = 'negative';
      updatedContext.energyLevel = Math.max(1, (updatedContext.energyLevel || 5) - 2);
    } else if (sentiment > 0.3) {
      updatedContext.mood = 'positive';
      updatedContext.energyLevel = Math.min(10, (updatedContext.energyLevel || 5) + 1);
    }

    return updatedContext;
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    message: string,
    intent: string,
    conversation: Conversation,
    context: ConversationContext
  ): Promise<string> {
    try {
      // Build conversation history for context
      const conversationHistory = conversation.messages
        .slice(-5) // Last 5 messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // Build system prompt based on coaching tone
      const systemPrompt = this.buildSystemPrompt(context.coachingTone || 'supportive');

      // Build user prompt
      const userPrompt = `
Conversation history:
${conversationHistory}

Current context:
- Mood: ${context.mood}
- Energy level: ${context.energyLevel}/10
- Current goals: ${context.currentGoals?.length || 0}
- Recent habits: ${context.recentHabits?.length || 0}

User message: ${message}
Detected intent: ${intent}

Please provide a supportive, personalized coaching response.
`;

      // Call OpenAI API (mocked for now)
      const response = await this.callOpenAI(systemPrompt, userPrompt);

      return response;
    } catch (error) {
      logger.error('Failed to generate response', { error });
      return this.getFallbackResponse(intent, context);
    }
  }

  /**
   * Build system prompt based on coaching tone
   */
  private buildSystemPrompt(tone: 'supportive' | 'challenging' | 'analytical'): string {
    const basePrompt = `You are an AI coaching assistant for UpCoach, a goal-tracking and habit-building platform.`;

    const tonePrompts = {
      supportive: `${basePrompt} Your coaching style is warm, encouraging, and empathetic. Focus on positive reinforcement, celebrate small wins, and provide emotional support.`,
      challenging: `${basePrompt} Your coaching style is direct, growth-oriented, and pushes users to their potential. Ask tough questions, set stretch goals, and challenge limiting beliefs.`,
      analytical: `${basePrompt} Your coaching style is data-driven, logical, and systematic. Provide insights based on patterns, suggest optimizations, and focus on measurable progress.`,
    };

    return tonePrompts[tone];
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    // Mock implementation - replace with actual OpenAI API call
    // In production: use OpenAI SDK

    // Fallback mock responses
    return "I'm here to help you achieve your goals! What would you like to work on today?";
  }

  /**
   * Get fallback response for common intents
   */
  private getFallbackResponse(intent: string, context: ConversationContext): string {
    const responses: Record<string, string> = {
      create_goal: "I'd love to help you create a new goal! What would you like to achieve?",
      create_habit: "Great idea to start a new habit! What habit would you like to track?",
      check_in: "Awesome! Which habit did you complete today?",
      request_progress: "Let me check your progress. You're doing great - keep it up!",
      request_motivation: context.mood === 'negative'
        ? "I know things feel tough right now, but remember how far you've come. Every small step counts!"
        : "You're doing amazing! Your dedication is truly inspiring. Keep pushing forward!",
      ask_advice: "I'm here to help! Tell me more about what you're working on.",
      report_struggle: "I hear you. Challenges are part of the journey. Let's break this down together - what specifically feels difficult?",
      general_conversation: "How can I support your goals today?",
    };

    return responses[intent] || "I'm here to help! How can I support your journey today?";
  }

  /**
   * Generate suggested actions
   */
  private generateSuggestedActions(
    intent: string,
    message: string,
    context: ConversationContext
  ): ChatResponse['suggestedActions'] {
    const actions: ChatResponse['suggestedActions'] = [];

    if (intent === 'create_goal') {
      actions.push({
        type: 'navigation',
        label: 'Create Goal',
        action: 'navigate',
        data: { screen: 'CreateGoal' },
      });
    }

    if (intent === 'create_habit') {
      actions.push({
        type: 'navigation',
        label: 'Add Habit',
        action: 'navigate',
        data: { screen: 'CreateHabit' },
      });
    }

    if (intent === 'request_progress') {
      actions.push({
        type: 'navigation',
        label: 'View Stats',
        action: 'navigate',
        data: { screen: 'Analytics' },
      });
    }

    return actions;
  }

  /**
   * Analyze sentiment (simplified)
   */
  private analyzeSentiment(message: string): number {
    const lowerMessage = message.toLowerCase();

    const positiveWords = ['great', 'awesome', 'happy', 'excited', 'love', 'good', 'amazing', 'fantastic'];
    const negativeWords = ['bad', 'sad', 'difficult', 'hard', 'struggle', 'fail', 'stuck', 'frustrated'];

    let score = 0;
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 0.2;
    });
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 0.2;
    });

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Save messages to conversation
   */
  private async saveMessages(messages: ChatMessage[], conversationId: string): Promise<void> {
    try {
      const query = `
        UPDATE conversations
        SET
          messages = messages || $1::jsonb,
          updated_at = NOW()
        WHERE id = $2
      `;

      await this.db.query(query, [JSON.stringify(messages), conversationId]);
    } catch (error) {
      logger.error('Failed to save messages', { conversationId, error });
    }
  }

  /**
   * Map database row to Conversation
   */
  private mapConversation(row: any): Conversation {
    return {
      id: row.id,
      userId: row.user_id,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages || [],
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context || {},
      intent: row.intent,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
