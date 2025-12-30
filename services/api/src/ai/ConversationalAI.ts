import { EventEmitter } from 'events';
import { nlpEngine, NLPAnalysis, Intent } from './NLPEngine';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    nlpAnalysis?: NLPAnalysis;
    context?: ConversationContext;
    intents?: Intent[];
  };
}

export interface ConversationContext {
  userId: string;
  conversationId: string;
  userProfile?: UserProfile;
  recentGoals?: GoalInfo[];
  recentHabits?: HabitInfo[];
  activeTopics: string[];
  mood?: string;
  sessionStartTime: Date;
  turnCount: number;
}

export interface UserProfile {
  name?: string;
  preferences: {
    coachingStyle?: 'supportive' | 'challenging' | 'balanced';
    communicationStyle?: 'concise' | 'detailed';
    motivationalPreference?: 'encouragement' | 'accountability' | 'data-driven';
  };
  history: {
    totalGoalsCompleted: number;
    currentStreak: number;
    primaryFocusAreas: string[];
    commonChallenges: string[];
  };
}

export interface GoalInfo {
  id: string;
  title: string;
  category: string;
  progress: number;
  deadline?: Date;
  status: 'active' | 'completed' | 'paused';
}

export interface HabitInfo {
  id: string;
  name: string;
  streak: number;
  frequency: string;
  lastCompleted?: Date;
}

export interface ResponseOptions {
  useAI?: boolean; // Use external AI API (OpenAI/Claude)
  maxTokens?: number;
  temperature?: number;
  includeContext?: boolean;
}

export interface AIResponse {
  message: Message;
  suggestions?: string[];
  actions?: SuggestedAction[];
  followUpQuestions?: string[];
}

export interface SuggestedAction {
  type: 'create_goal' | 'track_habit' | 'set_reminder' | 'view_progress' | 'schedule_task';
  label: string;
  parameters?: Record<string, any>;
}

// ============================================================================
// CONVERSATIONAL AI ENGINE
// ============================================================================

export class ConversationalAI extends EventEmitter {
  private static instance: ConversationalAI;
  private conversations: Map<string, Message[]> = new Map();
  private contexts: Map<string, ConversationContext> = new Map();

  // Response templates for coaching domain
  private responseTemplates = {
    greeting: [
      "Hello {name}! How can I help you with your goals today?",
      "Hi {name}! Ready to make progress on your journey?",
      "Welcome back, {name}! What would you like to work on?",
    ],
    goalCreation: [
      "That's a great goal! Let's break it down. What specific outcome do you want to achieve?",
      "I love your ambition! To make this goal actionable, what's the first step you could take?",
      "Excellent! Let's make this goal SMART. When would you like to achieve this by?",
    ],
    encouragement: [
      "You're making great progress! Your {streak}-day streak shows real commitment.",
      "Keep going! You've completed {completed} goals already. That's impressive!",
      "I believe in you! Remember, progress isn't always linear, but you're moving forward.",
    ],
    struggling: [
      "I hear that you're struggling. What specific challenge are you facing right now?",
      "It's okay to find things difficult. What has helped you overcome challenges in the past?",
      "Let's break this down together. What's one small thing you could do today?",
    ],
    celebration: [
      "Amazing work! How does it feel to accomplish this?",
      "You should be proud! This is a significant achievement.",
      "Fantastic! What did you learn from this experience?",
    ],
    motivation: [
      "Remember why you started. Your goals are worth the effort!",
      "You've got this! Every step forward is progress.",
      "Think about how good you'll feel when you achieve this. Keep pushing!",
    ],
  };

  // Coaching prompts for external AI APIs
  private systemPrompt = `You are an empathetic, knowledgeable life coach assistant integrated into the UpCoach platform. Your role is to:

1. Help users set and achieve meaningful goals
2. Provide accountability and encouragement
3. Offer personalized advice based on their history and preferences
4. Ask thoughtful questions to promote self-reflection
5. Celebrate wins and help users learn from setbacks
6. Be supportive but also challenge users when appropriate

Communication style:
- Be warm, authentic, and conversational
- Use the user's name occasionally
- Keep responses concise but meaningful (2-4 sentences typically)
- Ask one follow-up question when appropriate
- Focus on actionable advice and specific next steps

Remember:
- Users trust you with their personal development
- Always be encouraging, never judgmental
- Respect their pace and preferences
- Celebrate progress, no matter how small`;

  private constructor() {
    super();
  }

  static getInstance(): ConversationalAI {
    if (!ConversationalAI.instance) {
      ConversationalAI.instance = new ConversationalAI();
    }
    return ConversationalAI.instance;
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  async startConversation(userId: string, userProfile?: UserProfile): Promise<string> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const context: ConversationContext = {
      userId,
      conversationId,
      userProfile,
      recentGoals: [],
      recentHabits: [],
      activeTopics: [],
      sessionStartTime: new Date(),
      turnCount: 0,
    };

    this.contexts.set(conversationId, context);
    this.conversations.set(conversationId, []);

    this.emit('conversation:started', { conversationId, userId });

    return conversationId;
  }

  async sendMessage(
    conversationId: string,
    userMessage: string,
    options: ResponseOptions = {}
  ): Promise<AIResponse> {
    const context = this.contexts.get(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Analyze user message
    const nlpAnalysis = await nlpEngine.analyze(userMessage);

    // Create user message
    const userMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: {
        nlpAnalysis,
        intents: nlpAnalysis.intents,
      },
    };

    // Add to conversation history
    this.addMessage(conversationId, userMsg);

    // Update context
    this.updateContext(context, nlpAnalysis);

    // Generate response
    const response = await this.generateResponse(conversationId, context, nlpAnalysis, options);

    this.emit('message:received', { conversationId, message: userMsg });
    this.emit('response:generated', { conversationId, response });

    return response;
  }

  private addMessage(conversationId: string, message: Message): void {
    const messages = this.conversations.get(conversationId) || [];
    messages.push(message);
    this.conversations.set(conversationId, messages);

    // Keep only last 50 messages to prevent memory issues
    if (messages.length > 50) {
      this.conversations.set(conversationId, messages.slice(-50));
    }
  }

  private updateContext(context: ConversationContext, analysis: NLPAnalysis): void {
    context.turnCount++;

    // Extract topics from intents
    analysis.intents.forEach(intent => {
      if (!context.activeTopics.includes(intent.name)) {
        context.activeTopics.push(intent.name);
      }
    });

    // Keep only recent topics
    if (context.activeTopics.length > 5) {
      context.activeTopics = context.activeTopics.slice(-5);
    }

    // Update mood if detected
    const moodEntity = analysis.entities.find(e => e.type === 'emotion');
    if (moodEntity) {
      context.mood = moodEntity.value;
    }
  }

  // ============================================================================
  // RESPONSE GENERATION
  // ============================================================================

  private async generateResponse(
    conversationId: string,
    context: ConversationContext,
    analysis: NLPAnalysis,
    options: ResponseOptions
  ): Promise<AIResponse> {
    // Determine response strategy based on intents
    const primaryIntent = analysis.intents[0];

    let responseContent: string;
    let suggestions: string[] = [];
    let actions: SuggestedAction[] = [];
    let followUpQuestions: string[] = [];

    if (options.useAI && process.env.OPENAI_API_KEY) {
      // Use external AI API
      const aiResponse = await this.generateAIResponse(conversationId, context, options);
      responseContent = aiResponse.content;
      suggestions = aiResponse.suggestions || [];
    } else {
      // Use template-based response (fallback)
      const templateResponse = this.generateTemplateResponse(context, analysis, primaryIntent);
      responseContent = templateResponse.content;
      suggestions = templateResponse.suggestions;
      actions = templateResponse.actions;
      followUpQuestions = templateResponse.followUpQuestions;
    }

    const assistantMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      metadata: { context },
    };

    this.addMessage(conversationId, assistantMsg);

    return {
      message: assistantMsg,
      suggestions,
      actions,
      followUpQuestions,
    };
  }

  private generateTemplateResponse(
    context: ConversationContext,
    analysis: NLPAnalysis,
    primaryIntent?: Intent
  ): {
    content: string;
    suggestions: string[];
    actions: SuggestedAction[];
    followUpQuestions: string[];
  } {
    let content = '';
    const suggestions: string[] = [];
    const actions: SuggestedAction[] = [];
    const followUpQuestions: string[] = [];

    const userName = context.userProfile?.name || 'there';

    // Handle based on sentiment first
    if (analysis.sentiment.label === 'very_negative' || analysis.sentiment.label === 'negative') {
      content = this.selectTemplate('struggling').replace('{name}', userName);
      followUpQuestions.push(
        "What's been the biggest obstacle?",
        "How can I support you right now?",
        "Would you like to adjust your current goals?"
      );
    } else if (analysis.sentiment.label === 'very_positive') {
      content = this.selectTemplate('celebration').replace('{name}', userName);
      followUpQuestions.push(
        "What contributed to this success?",
        "How can we build on this momentum?"
      );
    } else if (primaryIntent) {
      // Handle based on intent
      switch (primaryIntent.name) {
        case 'create_goal':
          content = this.selectTemplate('goalCreation');
          actions.push({
            type: 'create_goal',
            label: 'Create Goal',
            parameters: primaryIntent.parameters,
          });
          break;

        case 'track_habit':
          content = `Great! I'll help you track "${primaryIntent.parameters.habitName}". How often would you like to do this?`;
          actions.push({
            type: 'track_habit',
            label: 'Set Up Habit Tracking',
            parameters: primaryIntent.parameters,
          });
          break;

        case 'check_progress':
          content = this.generateProgressSummary(context);
          actions.push({
            type: 'view_progress',
            label: 'View Detailed Analytics',
          });
          break;

        case 'request_motivation':
          content = this.selectTemplate('motivation');
          suggestions.push(
            "Review your achievements",
            "Set a new milestone",
            "Connect with accountability partner"
          );
          break;

        case 'request_help':
          content = `I'd be happy to help with ${primaryIntent.parameters.topic}. Let me share some insights and resources.`;
          break;

        default:
          content = this.selectTemplate('greeting').replace('{name}', userName);
      }
    } else {
      // Default conversational response
      content = `I understand. ${this.generateContextualAdvice(context, analysis)}`;
      suggestions.push(
        "What are your goals for today?",
        "Show me my progress",
        "I need motivation"
      );
    }

    return { content, suggestions, actions, followUpQuestions };
  }

  private generateProgressSummary(context: ConversationContext): string {
    const { userProfile, recentGoals } = context;

    if (!userProfile) {
      return "Let me check your progress. It looks like you're making steady progress! What specific area would you like to review?";
    }

    const streak = userProfile.history.currentStreak;
    const completed = userProfile.history.totalGoalsCompleted;

    let summary = `You're on a ${streak}-day streak! `;

    if (completed > 0) {
      summary += `You've completed ${completed} goal${completed > 1 ? 's' : ''} so far. `;
    }

    if (recentGoals && recentGoals.length > 0) {
      const activeGoals = recentGoals.filter(g => g.status === 'active');
      if (activeGoals.length > 0) {
        summary += `You have ${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''} in progress. `;
      }
    }

    return summary + "What would you like to focus on?";
  }

  private generateContextualAdvice(context: ConversationContext, analysis: NLPAnalysis): string {
    const { userProfile } = context;

    if (!userProfile) {
      return "Tell me more about what you're working on, and I'll provide personalized guidance.";
    }

    // Personalize based on user preferences
    const style = userProfile.preferences.coachingStyle || 'balanced';

    if (style === 'supportive') {
      return "I'm here to support you. What's on your mind today?";
    } else if (style === 'challenging') {
      return "What action are you going to take today to move closer to your goals?";
    } else {
      return "Let's talk about your progress. What's working well, and where could you use some support?";
    }
  }

  private selectTemplate(category: keyof typeof this.responseTemplates): string {
    const templates = this.responseTemplates[category];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // ============================================================================
  // EXTERNAL AI INTEGRATION (OpenAI/Claude)
  // ============================================================================

  private async generateAIResponse(
    conversationId: string,
    context: ConversationContext,
    options: ResponseOptions
  ): Promise<{ content: string; suggestions?: string[] }> {
    // Build conversation history for context
    const messages = this.conversations.get(conversationId) || [];
    const recentMessages = messages.slice(-10); // Last 10 messages

    // Build prompt with context
    const contextPrompt = this.buildContextPrompt(context);

    try {
      // This is a placeholder for actual API integration
      // In production, you would call OpenAI or Claude API here
      const response = await this.callExternalAI(contextPrompt, recentMessages, options);

      return {
        content: response,
        suggestions: this.generateSmartSuggestions(context),
      };
    } catch (error) {
      this.emit('ai:error', { conversationId, error });

      // Fallback to template-based response
      return {
        content: "I'm here to help. Tell me more about what you're working on.",
        suggestions: [],
      };
    }
  }

  private buildContextPrompt(context: ConversationContext): string {
    const { userProfile, recentGoals, recentHabits, mood } = context;

    let prompt = this.systemPrompt + '\n\nCurrent Context:\n';

    if (userProfile) {
      prompt += `- User: ${userProfile.name || 'User'}\n`;
      prompt += `- Coaching Style: ${userProfile.preferences.coachingStyle || 'balanced'}\n`;
      prompt += `- Current Streak: ${userProfile.history.currentStreak} days\n`;
      prompt += `- Goals Completed: ${userProfile.history.totalGoalsCompleted}\n`;
    }

    if (recentGoals && recentGoals.length > 0) {
      prompt += `\nActive Goals:\n`;
      recentGoals.slice(0, 3).forEach(goal => {
        prompt += `- ${goal.title} (${goal.progress}% complete)\n`;
      });
    }

    if (recentHabits && recentHabits.length > 0) {
      prompt += `\nTracked Habits:\n`;
      recentHabits.slice(0, 3).forEach(habit => {
        prompt += `- ${habit.name} (${habit.streak}-day streak)\n`;
      });
    }

    if (mood) {
      prompt += `\nCurrent Mood: ${mood}\n`;
    }

    return prompt;
  }

  private async callExternalAI(
    systemPrompt: string,
    messages: Message[],
    options: ResponseOptions
  ): Promise<string> {
    // Placeholder for actual API call
    // In production, this would use OpenAI SDK or Claude SDK

    /*
    Example OpenAI integration:

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: options.maxTokens || 150,
      temperature: options.temperature || 0.7,
    });

    return response.choices[0].message.content;
    */

    // For now, return a fallback response
    return "I'm here to support your growth. What would you like to work on today?";
  }

  private generateSmartSuggestions(context: ConversationContext): string[] {
    const suggestions: string[] = [];

    if (context.recentGoals && context.recentGoals.length > 0) {
      suggestions.push("Review my goals");
    }

    if (context.userProfile?.history.currentStreak > 0) {
      suggestions.push("How do I maintain my streak?");
    }

    suggestions.push(
      "I need motivation",
      "Set a new goal",
      "Show my progress"
    );

    return suggestions.slice(0, 4);
  }

  // ============================================================================
  // CONVERSATION HISTORY & CONTEXT
  // ============================================================================

  getConversationHistory(conversationId: string, limit: number = 20): Message[] {
    const messages = this.conversations.get(conversationId) || [];
    return messages.slice(-limit);
  }

  updateUserContext(conversationId: string, updates: Partial<ConversationContext>): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      Object.assign(context, updates);
      this.contexts.set(conversationId, context);
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    const context = this.contexts.get(conversationId);
    if (context) {
      const duration = Date.now() - context.sessionStartTime.getTime();
      this.emit('conversation:ended', {
        conversationId,
        userId: context.userId,
        duration,
        turnCount: context.turnCount,
      });
    }

    // Keep conversation history but remove active context
    this.contexts.delete(conversationId);
  }

  clearOldConversations(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [conversationId, messages] of this.conversations.entries()) {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const age = now - lastMessage.timestamp.getTime();

        if (age > maxAgeMs) {
          this.conversations.delete(conversationId);
          this.contexts.delete(conversationId);
          cleared++;
        }
      }
    }

    return cleared;
  }
}

export const conversationalAI = ConversationalAI.getInstance();
