import { v4 as uuidv4 } from 'uuid';

import { UnifiedCacheService } from '../cache/UnifiedCacheService';
import { aiService, AIMessage } from './AIService';
import { userDayContextService } from './UserDayContextService';

export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CompanionThread {
  userId: string;
  messages: CompanionMessage[];
}

class CompanionChatService {
  private cache = new UnifiedCacheService({
    defaultPrefix: 'companion:',
    defaultTTL: 60 * 60 * 24,
  });

  async getHistory(userId: string): Promise<CompanionMessage[]> {
    const thread = await this.getThread(userId);
    return thread.messages;
  }

  async resetHistory(userId: string): Promise<void> {
    await this.cache.del(this.buildKey(userId));
  }

  async sendMessage(userId: string, content: string): Promise<{ user: CompanionMessage; assistant: CompanionMessage }> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty');
    }

    const thread = await this.getThread(userId);
    const userMessage: CompanionMessage = {
      id: uuidv4(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    thread.messages.push(userMessage);
    thread.messages = thread.messages.slice(-30);

    const assistant = await this.generateAssistantReply(userId, thread.messages);
    thread.messages.push(assistant);

    await this.saveThread(userId, thread);
    return { user: userMessage, assistant };
  }

  private async generateAssistantReply(
    userId: string,
    history: CompanionMessage[]
  ): Promise<CompanionMessage> {
    const context = await userDayContextService.build(userId);
    const summary = this.buildContextSummary(context);

    const aiMessages: AIMessage[] = [
      {
        role: 'system',
        content:
          'You are UpCoach Companion, an encouraging accountability partner. Keep responses under 120 words, include a specific next step, and reference current context when helpful.',
      },
      {
        role: 'user',
        content: `Context snapshot: ${summary}`,
      },
    ];

    for (const message of history.slice(-10)) {
      aiMessages.push({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content,
      });
    }

    const response = await aiService.generateResponse(aiMessages, {
      maxTokens: 400,
      temperature: 0.7,
      useCache: false,
      provider: 'openai',
    });

    return {
      id: uuidv4(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
    };
  }

  private async getThread(userId: string): Promise<CompanionThread> {
    const key = this.buildKey(userId);
    const cached = await this.cache.get<CompanionThread>(key);
    if (cached) {
      return cached;
    }
    return {
      userId,
      messages: [
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Hey! I’m your daily companion. What do you want to focus on right now?',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  private async saveThread(userId: string, thread: CompanionThread): Promise<void> {
    await this.cache.set(this.buildKey(userId), thread);
  }

  private buildKey(userId: string): string {
    return `thread:${userId}`;
  }

  private buildContextSummary(context: Awaited<ReturnType<typeof userDayContextService.build>>): string {
    const latestHabit = context.habitTrend.slice(-1)[0];
    return JSON.stringify({
      tasksDueToday: context.tasksDueToday,
      overdueTasks: context.overdueTasks,
      activeGoals: context.goals.activeGoals,
      completedGoals: context.goals.completedGoals,
      mood: context.todaysMood?.label,
      habitCompletion: latestHabit?.completionRate ?? 0,
    });
  }
}

export const companionChatService = new CompanionChatService();

