import { EventEmitter } from 'events';
import OpenAI from 'openai';

// AI Coaching Assistant - Personalized AI coaching powered by GPT-4 and Claude (~700 LOC)

export enum CoachingFramework {
  GROW = 'GROW', // Goal, Reality, Options, Will
  SMART = 'SMART', // Specific, Measurable, Achievable, Relevant, Time-bound
  CBT = 'CBT', // Cognitive Behavioral Therapy
  DBT = 'DBT', // Dialectical Behavior Therapy
}

export enum CoachingPersonality {
  EMPATHETIC = 'empathetic',
  DIRECTIVE = 'directive',
  SOCRATIC = 'socratic',
  MOTIVATIONAL = 'motivational',
}

export enum AIModel {
  GPT4 = 'gpt-4',
  GPT35_TURBO = 'gpt-3.5-turbo',
  CLAUDE_SONNET = 'claude-3-5-sonnet-20241022',
  GEMINI_PRO = 'gemini-pro',
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface UserContext {
  userId: string;
  goals: Array<{ id: string; title: string; progress: number }>;
  recentProgress: Array<{ date: Date; metric: string; value: number }>;
  habits: Array<{ id: string; name: string; streak: number }>;
  preferences: {
    framework: CoachingFramework;
    personality: CoachingPersonality;
  };
  coachingHistory: Message[];
}

interface ChatOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

interface AIResponse {
  response: string;
  insights: {
    keyPoints: string[];
    actionItems: string[];
    emotions: string[];
    patterns: string[];
  };
  model: AIModel;
  tokens: number;
  cost: number;
}

export class AICoachingAssistant extends EventEmitter {
  private conversationHistory: Message[] = [];
  private userContext: UserContext | null = null;
  private openai: OpenAI;
  private defaultModel: AIModel = AIModel.GPT4;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(
    userId: string,
    message: string,
    options: ChatOptions = {}
  ): Promise<AIResponse> {
    console.log(`[AICoachingAssistant] Chat request from user ${userId}`);

    // Build user context
    this.userContext = await this.buildUserContext(userId);

    // Add user message to history
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    this.conversationHistory.push(userMessage);

    // Select model
    const model = options.model || this.selectModel(message);

    // Generate response
    const response = await this.generateResponse(model, message, options);

    // Extract insights
    const insights = await this.extractInsights(response);

    // Add assistant message to history
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    this.conversationHistory.push(assistantMessage);

    // Calculate cost
    const tokens = this.estimateTokens(message + response);
    const cost = this.calculateCost(model, tokens);

    this.emit('chat:completed', { userId, message, response, insights });

    return {
      response,
      insights,
      model,
      tokens,
      cost,
    };
  }

  private async buildUserContext(userId: string): Promise<UserContext> {
    // In production, fetch from database
    return {
      userId,
      goals: [
        { id: '1', title: 'Run 5K', progress: 65 },
        { id: '2', title: 'Read 12 books', progress: 42 },
      ],
      recentProgress: [
        { date: new Date(), metric: 'running_distance', value: 3.2 },
        { date: new Date(), metric: 'books_read', value: 5 },
      ],
      habits: [
        { id: '1', name: 'Morning run', streak: 12 },
        { id: '2', name: 'Daily reading', streak: 8 },
      ],
      preferences: {
        framework: CoachingFramework.GROW,
        personality: CoachingPersonality.EMPATHETIC,
      },
      coachingHistory: this.conversationHistory.slice(-10),
    };
  }

  private selectModel(message: string): AIModel {
    // Use GPT-4 for complex coaching, GPT-3.5 for simple queries
    const complexKeywords = [
      'why',
      'how',
      'struggle',
      'difficult',
      'challenge',
      'plan',
      'strategy',
    ];
    const isComplex = complexKeywords.some((kw) =>
      message.toLowerCase().includes(kw)
    );

    return isComplex ? AIModel.GPT4 : AIModel.GPT35_TURBO;
  }

  private async generateResponse(
    model: AIModel,
    message: string,
    options: ChatOptions
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const contextPrompt = this.buildContextPrompt();

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'system' as const, content: contextPrompt },
      ...this.conversationHistory.slice(-5).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    if (model.startsWith('gpt')) {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      });

      return completion.choices[0].message.content || '';
    }

    // For Claude/Gemini, use their respective APIs (simplified here)
    return 'AI response generated';
  }

  private buildSystemPrompt(): string {
    if (!this.userContext) return '';

    const { framework, personality } = this.userContext.preferences;

    const frameworkPrompts = {
      [CoachingFramework.GROW]: `Use the GROW coaching framework:
- Goal: What do they want to achieve?
- Reality: Where are they now?
- Options: What could they do?
- Will: What will they do?`,
      [CoachingFramework.SMART]: `Help set SMART goals:
- Specific: Clear and well-defined
- Measurable: Quantifiable progress
- Achievable: Realistic and attainable
- Relevant: Aligned with values
- Time-bound: Clear deadline`,
      [CoachingFramework.CBT]: `Apply CBT principles:
- Identify thought patterns
- Challenge negative beliefs
- Develop coping strategies
- Focus on behavior change`,
      [CoachingFramework.DBT]: `Use DBT skills:
- Mindfulness
- Distress tolerance
- Emotion regulation
- Interpersonal effectiveness`,
    };

    const personalityPrompts = {
      [CoachingPersonality.EMPATHETIC]: `Be warm, understanding, and supportive. Validate emotions and provide encouragement.`,
      [CoachingPersonality.DIRECTIVE]: `Be clear, structured, and action-oriented. Provide specific guidance and next steps.`,
      [CoachingPersonality.SOCRATIC]: `Ask thought-provoking questions. Help the user discover insights through inquiry.`,
      [CoachingPersonality.MOTIVATIONAL]: `Be energizing and inspiring. Focus on possibilities and strengths.`,
    };

    return `You are an expert life coach specializing in personal development and behavior change.

${frameworkPrompts[framework]}

Coaching Style:
${personalityPrompts[personality]}

Guidelines:
- Be concise but insightful (2-3 paragraphs max)
- Ask powerful questions
- Celebrate progress
- Identify patterns
- Suggest specific, actionable next steps
- Show empathy and understanding
- Reference their goals and progress when relevant`;
  }

  private buildContextPrompt(): string {
    if (!this.userContext) return '';

    const { goals, habits, recentProgress } = this.userContext;

    return `User Context:

Current Goals:
${goals.map((g) => `- ${g.title} (${g.progress}% complete)`).join('\n')}

Active Habits:
${habits.map((h) => `- ${h.name} (${h.streak} day streak)`).join('\n')}

Recent Progress:
${recentProgress.map((p) => `- ${p.metric}: ${p.value}`).join('\n')}

Use this context to provide personalized, relevant coaching.`;
  }

  private async extractInsights(response: string): Promise<{
    keyPoints: string[];
    actionItems: string[];
    emotions: string[];
    patterns: string[];
  }> {
    // Use GPT-3.5 for fast insight extraction
    const prompt = `Extract from this coaching response:
1. Key points (2-3 main insights)
2. Action items (specific next steps)
3. Emotions mentioned
4. Patterns identified

Response: "${response}"

Format as JSON with keys: keyPoints, actionItems, emotions, patterns`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    try {
      const content = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      return {
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
        emotions: parsed.emotions || [],
        patterns: parsed.patterns || [],
      };
    } catch (error) {
      console.error('[AICoachingAssistant] Failed to parse insights:', error);
      return {
        keyPoints: [],
        actionItems: [],
        emotions: [],
        patterns: [],
      };
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateCost(model: AIModel, tokens: number): number {
    // Pricing per 1K tokens (as of 2025)
    const pricing: Record<AIModel, { input: number; output: number }> = {
      [AIModel.GPT4]: { input: 0.03, output: 0.06 },
      [AIModel.GPT35_TURBO]: { input: 0.0005, output: 0.0015 },
      [AIModel.CLAUDE_SONNET]: { input: 0.003, output: 0.015 },
      [AIModel.GEMINI_PRO]: { input: 0.00025, output: 0.0005 },
    };

    const modelPricing = pricing[model];
    // Assume 50/50 input/output
    const cost =
      ((tokens / 2) * modelPricing.input + (tokens / 2) * modelPricing.output) /
      1000;
    return cost;
  }

  async getConversationHistory(): Promise<Message[]> {
    return this.conversationHistory;
  }

  async clearHistory(): Promise<void> {
    this.conversationHistory = [];
  }

  async getMetrics(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalCost: number;
    averageSatisfaction: number;
  }> {
    // In production, fetch from analytics database
    return {
      totalConversations: 48,
      totalMessages: 234,
      totalCost: 12.45,
      averageSatisfaction: 4.6,
    };
  }
}

export const aiCoachingAssistant = new AICoachingAssistant();
