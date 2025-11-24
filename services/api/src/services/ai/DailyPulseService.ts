import { v4 as uuidv4 } from 'uuid';

import { UnifiedCacheService } from '../cache/UnifiedCacheService';
import { NotificationService } from '../NotificationService';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import { aiService } from './AIService';
import { userDayContextService, DailyUserContext } from './UserDayContextService';

export type PulsePeriod = 'morning' | 'evening';

export interface DailyPulseAction {
  title: string;
  description: string;
  category: string;
  timeframe: 'today' | 'this_week' | 'reflection';
}

export interface DailyPulse {
  id: string;
  userId: string;
  period: PulsePeriod;
  generatedAt: string;
  headline: string;
  summary: string;
  encouragement: string;
  gratitudePrompt?: string;
  recommendedActions: DailyPulseAction[];
  metrics: {
    tasksDueToday: number;
    overdueTasks: number;
    completedGoals: number;
    activeGoals: number;
    averageHabitScore: number;
    moodTrend: string;
  };
}

class DailyPulseService {
  private cache = new UnifiedCacheService();
  private notificationService = NotificationService.getInstance();

  async getPulse(userId: string, period: PulsePeriod = this.getPeriodForNow()): Promise<DailyPulse> {
    const cacheKey = this.buildCacheKey(userId, period);
    const cached = await this.cache.get<DailyPulse>(cacheKey);
    if (cached) {
      return cached;
    }

    const context = await userDayContextService.build(userId);
    const pulse = await this.generatePulseFromContext(userId, period, context);

    await this.cache.set(cacheKey, pulse, { ttl: 60 * 60 }); // 1 hour
    return pulse;
  }

  async broadcastPulse(period: PulsePeriod = this.getPeriodForNow()): Promise<void> {
    try {
      const users = await User.findAll({
        attributes: ['id', 'isActive'],
        where: { isActive: true },
      });

      for (const user of users) {
        try {
          const pulse = await this.getPulse(user.id, period);
          await this.notificationService.showInfo(
            user.id,
            `${pulse.headline}\n${pulse.summary}`,
            true
          );
        } catch (error) {
          logger.warn('Failed to send daily pulse for user', {
            userId: user.id,
            error,
          });
        }
      }

      logger.info(`Broadcasted ${period} pulse to ${users.length} active users`);
    } catch (error) {
      logger.error('Failed to broadcast daily pulse', { error });
    }
  }

  getPeriodForNow(): PulsePeriod {
    const hour = new Date().getUTCHours();
    return hour >= 18 ? 'evening' : 'morning';
  }

  private buildCacheKey(userId: string, period: PulsePeriod): string {
    const dateKey = new Date().toISOString().split('T')[0];
    return `daily-pulse:${userId}:${period}:${dateKey}`;
  }

  private async generatePulseFromContext(
    userId: string,
    period: PulsePeriod,
    context: DailyUserContext
  ): Promise<DailyPulse> {
    const prompt = this.buildPrompt(period, context);
    let parsedContent: DailyPulse | null = null;

    try {
      const response = await aiService.generateResponse(
        [
          {
            role: 'system',
            content:
              'You are UpCoach Pulse, a concise AI companion that summarizes the user day with motivation. Respond strictly in JSON following the provided schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'gpt-4o-mini',
          maxTokens: 600,
          temperature: period === 'morning' ? 0.8 : 0.6,
          useCache: false,
        }
      );

      parsedContent = this.parsePulseResponse(response.content, userId, period, context);
    } catch (error) {
      logger.warn('Falling back to templated pulse content', { error });
    }

    if (!parsedContent) {
      parsedContent = this.buildFallbackPulse(userId, period, context);
    }

    return parsedContent;
  }

  private buildPrompt(period: PulsePeriod, context: DailyUserContext): string {
    const summary = {
      goals: context.goals,
      habitTrend: context.habitTrend.slice(-3),
      engagement: context.engagement.slice(-3),
      tasksDueToday: context.tasksDueToday,
      overdueTasks: context.overdueTasks,
      todaysMood: context.todaysMood,
    };

    return `
Generate a ${period.toUpperCase()} daily pulse for the user using this context:
${JSON.stringify(summary, null, 2)}

Return JSON with shape:
{
  "headline": string,
  "summary": string,
  "encouragement": string,
  "gratitudePrompt": string,
  "recommendedActions": [
    {
      "title": string,
      "description": string,
      "category": string,
      "timeframe": "today" | "this_week" | "reflection"
    }
  ]
}
`;
  }

  private parsePulseResponse(
    rawContent: string,
    userId: string,
    period: PulsePeriod,
    context: DailyUserContext
  ): DailyPulse | null {
    try {
      const jsonStart = rawContent.indexOf('{');
      const jsonEnd = rawContent.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        return null;
      }

      const parsed = JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1));
      return {
        id: uuidv4(),
        userId,
        period,
        generatedAt: new Date().toISOString(),
        headline: parsed.headline ?? this.buildFallbackHeadline(period, context),
        summary: parsed.summary ?? this.buildFallbackSummary(period, context),
        encouragement: parsed.encouragement ?? this.buildEncouragement(context),
        gratitudePrompt: parsed.gratitudePrompt,
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.slice(0, 4).map((action: DailyPulseAction, index: number) => ({
              title: action.title ?? `Action ${index + 1}`,
              description: action.description ?? '',
              category: action.category ?? 'general',
              timeframe: action.timeframe ?? 'today',
            }))
          : [],
        metrics: this.buildMetrics(context),
      };
    } catch (error) {
      logger.warn('Failed to parse daily pulse JSON', { error });
      return null;
    }
  }

  private buildFallbackPulse(
    userId: string,
    period: PulsePeriod,
    context: DailyUserContext
  ): DailyPulse {
    return {
      id: uuidv4(),
      userId,
      period,
      generatedAt: new Date().toISOString(),
      headline: this.buildFallbackHeadline(period, context),
      summary: this.buildFallbackSummary(period, context),
      encouragement: this.buildEncouragement(context),
      gratitudePrompt: period === 'evening'
        ? 'Reflect on one win you are proud of today.'
        : 'Name one thing you are grateful for before starting the day.',
      recommendedActions: this.buildFallbackActions(period, context),
      metrics: this.buildMetrics(context),
    };
  }

  private buildFallbackHeadline(period: PulsePeriod, context: DailyUserContext): string {
    if (period === 'morning') {
      return context.goals.activeGoals > 0
        ? 'Let’s make meaningful progress today'
        : 'Fresh start: shape your day with intention';
    }
    return context.tasksDueToday > 0
      ? 'Great effort — time to wind down with purpose'
      : 'Wrap-up complete — celebrate your wins';
  }

  private buildFallbackSummary(period: PulsePeriod, context: DailyUserContext): string {
    if (period === 'morning') {
      return `You have ${context.tasksDueToday} tasks lined up with ${
        context.overdueTasks
      } awaiting attention. Your goals are ${context.goals.activeGoals} active / ${
        context.goals.completedGoals
      } completed.`;
    }

    return `You wrapped up ${context.goals.completedGoals} goals and ${
      context.habitTrend.slice(-1)[0]?.completionRate
        ? Math.round(context.habitTrend.slice(-1)[0].completionRate * 100)
        : 0
    }% of habits today. Take a breath and capture a reflection.`;
  }

  private buildEncouragement(context: DailyUserContext): string {
    if (context.todaysMood) {
      return `Thanks for checking in — your mood is tracking at ${context.todaysMood.label}. Keep listening to what you need.`;
    }
    return 'Take a mindful moment to check in with yourself today.';
  }

  private buildFallbackActions(period: PulsePeriod, context: DailyUserContext): DailyPulseAction[] {
    if (period === 'morning') {
      return [
        {
          title: 'Focus Block',
          description: 'Schedule 25 uninterrupted minutes on your most impactful task.',
          category: 'productivity',
          timeframe: 'today',
        },
        {
          title: 'Habit Booster',
          description: 'Review your top habit and decide exactly when you’ll complete it.',
          category: 'habit',
          timeframe: 'today',
        },
        {
          title: 'Micro-Win Plan',
          description: 'List one quick win you can celebrate by lunch.',
          category: 'mindset',
          timeframe: 'today',
        },
      ];
    }

    return [
      {
        title: 'Celebrate a Win',
        description: 'Write down one specific accomplishment from today.',
        category: 'reflection',
        timeframe: 'reflection',
      },
      {
        title: 'Reset Space',
        description: 'Tidy your workspace in under five minutes to signal shutdown.',
        category: 'wellness',
        timeframe: 'reflection',
      },
      {
        title: 'Preview Tomorrow',
        description: 'Capture the top priority for tomorrow while it’s fresh.',
        category: 'planning',
        timeframe: 'this_week',
      },
    ];
  }

  private buildMetrics(context: DailyUserContext): DailyPulse['metrics'] {
    const latestHabit = context.habitTrend.slice(-1)[0];
    const moodTrend =
      context.todaysMood?.label ??
      (latestHabit?.completionRate && latestHabit.completionRate > 0.7
        ? 'upward'
        : 'stabilizing');

    return {
      tasksDueToday: context.tasksDueToday,
      overdueTasks: context.overdueTasks,
      completedGoals: context.goals.completedGoals,
      activeGoals: context.goals.activeGoals,
      averageHabitScore: latestHabit?.completionRate ?? 0,
      moodTrend: typeof moodTrend === 'string' ? moodTrend : 'steady',
    };
  }
}

export const dailyPulseService = new DailyPulseService();

