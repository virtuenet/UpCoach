import { v4 as uuidv4 } from 'uuid';

import { analyticsInsightsService } from './AnalyticsInsightsService';
import { userDayContextService } from '../ai/UserDayContextService';

export type HighlightSentiment = 'win' | 'momentum' | 'recovery';

export interface ProgressHighlight {
  id: string;
  sentiment: HighlightSentiment;
  title: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  sharePrompt: string;
  createdAt: string;
}

class ProgressHighlightService {
  async generateHighlights(userId: string): Promise<ProgressHighlight[]> {
    const [context, goalOverview, habits] = await Promise.all([
      userDayContextService.build(userId),
      analyticsInsightsService.getGoalOverview(userId),
      analyticsInsightsService.getHabitAdherence(userId, 14),
    ]);

    const highlights: ProgressHighlight[] = [];

    // Goal completion highlight
    if (goalOverview.completedGoals > 0) {
      highlights.push({
        id: uuidv4(),
        sentiment: 'win',
        title: 'Goal unlocked',
        summary: `You’ve wrapped ${goalOverview.completedGoals} goals recently. Amazing follow-through.`,
        metricLabel: 'Completion rate',
        metricValue: `${Math.round(goalOverview.completionRate * 100)}%`,
        sharePrompt: 'Celebrate a goal you recently completed and how it feels.',
        createdAt: new Date().toISOString(),
      });
    }

    // Habit consistency highlight
    const lastHabit = habits.slice(-1)[0];
    if (lastHabit) {
      const score = Math.round((lastHabit.completionRate ?? 0) * 100);
      highlights.push({
        id: uuidv4(),
        sentiment: score >= 70 ? 'momentum' : 'recovery',
        title: score >= 70 ? 'Habit consistency' : 'Fresh momentum',
        summary:
          score >= 70
            ? 'Your recent habit streak is rock solid—keep stacking wins.'
            : 'Momentum dipped, but today is a great reset moment.',
        metricLabel: '7-day habit completion',
        metricValue: `${score}%`,
        sharePrompt:
          score >= 70
            ? 'Share a habit that became effortless this week.'
            : 'Note one tweak you’ll try to reclaim momentum.',
        createdAt: new Date().toISOString(),
      });
    }

    // Mood check-in highlight
    if (context.todaysMood) {
      highlights.push({
        id: uuidv4(),
        sentiment: 'momentum',
        title: 'Energy check',
        summary: `You logged a "${context.todaysMood.label}" mood today. Great self-awareness.`,
        metricLabel: 'Latest mood',
        metricValue: context.todaysMood.label,
        sharePrompt: 'Capture one thing boosting your energy today.',
        createdAt: new Date().toISOString(),
      });
    }

    if (highlights.length === 0) {
      highlights.push({
        id: uuidv4(),
        sentiment: 'recovery',
        title: 'Small steps still count',
        summary: 'Even on quieter weeks, showing up matters. Let’s plan one micro-win.',
        metricLabel: 'Focus idea',
        metricValue: 'Pick a 5-min task',
        sharePrompt: 'Share the tiny action you’ll complete next.',
        createdAt: new Date().toISOString(),
      });
    }

    return highlights.slice(0, 3);
  }
}

export const progressHighlightService = new ProgressHighlightService();

