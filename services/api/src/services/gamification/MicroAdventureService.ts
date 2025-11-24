import { UnifiedCacheService } from '../cache/UnifiedCacheService';
import { logger } from '../../utils/logger';
import { userDayContextService, DailyUserContext } from '../ai/UserDayContextService';
import {
  microChallengeCatalog,
  MicroChallengeDefinition,
} from '../../data/microChallengesCatalog';

type ChallengeStatus = 'available' | 'completed' | 'expired';

export interface MicroChallengeView {
  id: string;
  title: string;
  description: string;
  microCopy: string;
  durationMinutes: number;
  rewardXp: number;
  category: string;
  status: ChallengeStatus;
  reason: string;
}

interface CompletionRecord {
  challengeId: string;
  completedAt: string;
}

class MicroAdventureService {
  private cache = new UnifiedCacheService({
    defaultPrefix: 'micro-adventures:',
    defaultTTL: 60 * 60 * 6,
  });

  async getRecommendedChallenges(userId: string, opts: { limit?: number } = {}): Promise<MicroChallengeView[]> {
    const context = await userDayContextService.build(userId);
    const limit = opts.limit ?? 4;

    const period = this.inferPeriod();
    const habitTrend = this.inferHabitTrend(context);
    const completions = await this.getCompletions(userId);

    const available = microChallengeCatalog
      .filter(challenge =>
        this.matchesTrigger(challenge, {
          period,
          context,
          habitTrend,
        })
      )
      .slice(0, limit);

    return available.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      microCopy: challenge.microCopy,
      durationMinutes: challenge.durationMinutes,
      rewardXp: challenge.rewardXp,
      category: challenge.category,
      status: completions.some(c => c.challengeId === challenge.id) ? 'completed' : 'available',
      reason: this.buildRecommendationReason(challenge, period, context),
    }));
  }

  async markChallengeComplete(userId: string, challengeId: string): Promise<MicroChallengeView | null> {
    const challenge = microChallengeCatalog.find(item => item.id === challengeId);
    if (!challenge) {
      return null;
    }

    const completions = await this.getCompletions(userId);
    if (!completions.some(record => record.challengeId === challengeId)) {
      completions.push({
        challengeId,
        completedAt: new Date().toISOString(),
      });
      await this.saveCompletions(userId, completions);
    }

    const context = await userDayContextService.build(userId);
    const period = this.inferPeriod();

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      microCopy: challenge.microCopy,
      durationMinutes: challenge.durationMinutes,
      rewardXp: challenge.rewardXp,
      category: challenge.category,
      status: 'completed',
      reason: this.buildRecommendationReason(challenge, period, context),
    };
  }

  private async getCompletions(userId: string): Promise<CompletionRecord[]> {
    const key = this.buildCompletionKey(userId);
    const stored = await this.cache.get<CompletionRecord[]>(key);
    return Array.isArray(stored) ? stored : [];
  }

  private async saveCompletions(userId: string, completions: CompletionRecord[]): Promise<void> {
    const key = this.buildCompletionKey(userId);
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    const ttlSeconds = Math.ceil((midnight.getTime() - Date.now()) / 1000);
    await this.cache.set(key, completions, { ttl: Math.max(ttlSeconds, 60) });
  }

  private buildCompletionKey(userId: string): string {
    const dateKey = new Date().toISOString().split('T')[0];
    return `${userId}:${dateKey}:completions`;
  }

  private inferPeriod(): 'morning' | 'afternoon' | 'evening' {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) {
      return 'morning';
    }
    if (hour < 17) {
      return 'afternoon';
    }
    return 'evening';
  }

  private inferHabitTrend(context: DailyUserContext): 'upward' | 'steady' | 'downward' {
    const lastThree = context.habitTrend.slice(-3);
    if (lastThree.length < 3) {
      return 'steady';
    }
    const changes = lastThree.map(point => point.completionRate);
    const delta = changes[changes.length - 1] - changes[0];
    if (delta > 0.1) return 'upward';
    if (delta < -0.1) return 'downward';
    return 'steady';
  }

  private matchesTrigger(
    challenge: MicroChallengeDefinition,
    opts: {
      period: 'morning' | 'afternoon' | 'evening';
      context: DailyUserContext;
      habitTrend: 'upward' | 'steady' | 'downward';
    }
  ): boolean {
    const { period, context, habitTrend } = opts;
    const triggers = challenge.triggers;

    if (triggers.period && !triggers.period.includes(period)) {
      return false;
    }
    if (
      typeof triggers.minTasksDue === 'number' &&
      context.tasksDueToday < triggers.minTasksDue
    ) {
      return false;
    }
    if (triggers.habitTrend && triggers.habitTrend !== habitTrend) {
      return false;
    }
    if (
      triggers.mood &&
      context.todaysMood &&
      !triggers.mood.includes(context.todaysMood.label)
    ) {
      return false;
    }
    return true;
  }

  private buildRecommendationReason(
    challenge: MicroChallengeDefinition,
    period: string,
    context: DailyUserContext
  ): string {
    if (challenge.triggers.minTasksDue && context.tasksDueToday >= challenge.triggers.minTasksDue) {
      return 'Helps reduce today’s task load.';
    }
    if (challenge.triggers.habitTrend === 'downward') {
      return 'Designed to reignite your habit momentum.';
    }
    if (challenge.triggers.mood && context.todaysMood) {
      return 'Crafted to elevate today’s emotional energy.';
    }
    if (challenge.triggers.period?.includes(period as 'morning' | 'afternoon' | 'evening')) {
      return `Optimized for ${period} energy rhythms.`;
    }
    return 'Curated for your current engagement pattern.';
  }
}

export const microAdventureService = new MicroAdventureService();

