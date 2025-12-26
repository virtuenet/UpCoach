/**
 * Streak Recovery Service
 * Phase 11 Week 2
 *
 * Helps users recover from broken streaks with personalized
 * interventions and motivational strategies
 */

export interface StreakBreakAnalysis {
  habitId: string;
  habitName: string;
  previousStreak: number;
  daysSinceBreak: number;
  breakReason: string;
  recoveryDifficulty: 'easy' | 'moderate' | 'hard';
  recoveryStrategy: RecoveryStrategy;
  motivationalMessage: string;
}

export interface RecoveryStrategy {
  type: 'immediate_restart' | 'gradual_rebuild' | 'habit_redesign';
  steps: string[];
  estimatedRecoveryDays: number;
  supportingActions: string[];
}

export class StreakRecoveryService {
  /**
   * Analyze a broken streak and generate recovery plan
   */
  async analyzeStreakBreak(
    userId: string,
    habitId: string
  ): Promise<StreakBreakAnalysis> {
    const habitData = await this.getHabitData(userId, habitId);

    // Analyze break pattern
    const breakReason = this.identifyBreakReason(habitData);
    const recoveryDifficulty = this.assessRecoveryDifficulty(habitData);
    const recoveryStrategy = this.generateRecoveryStrategy(habitData, breakReason);
    const motivationalMessage = this.generateMotivationalMessage(habitData);

    return {
      habitId,
      habitName: habitData.name,
      previousStreak: habitData.previousStreak,
      daysSinceBreak: habitData.daysSinceBreak,
      breakReason,
      recoveryDifficulty,
      recoveryStrategy,
      motivationalMessage
    };
  }

  /**
   * Get personalized recovery recommendations
   */
  async getRecoveryRecommendations(
    userId: string,
    habitId: string
  ): Promise<string[]> {
    const analysis = await this.analyzeStreakBreak(userId, habitId);

    const recommendations: string[] = [];

    // Based on break reason
    if (analysis.breakReason === 'too_difficult') {
      recommendations.push('Consider reducing the difficulty or time commitment');
      recommendations.push('Break the habit into smaller, more manageable steps');
      recommendations.push('Start with just 5 minutes instead of the full duration');
    } else if (analysis.breakReason === 'schedule_conflict') {
      recommendations.push('Try a different time of day');
      recommendations.push('Set up calendar reminders');
      recommendations.push('Pair with an existing daily routine');
    } else if (analysis.breakReason === 'lost_motivation') {
      recommendations.push('Revisit your "why" - the reason you started');
      recommendations.push('Find an accountability partner');
      recommendations.push('Set up a reward system for milestones');
    } else if (analysis.breakReason === 'external_circumstances') {
      recommendations.push('Be kind to yourself - life happens');
      recommendations.push('Start fresh with adjusted expectations');
      recommendations.push('Focus on consistency over perfection');
    }

    // Based on recovery difficulty
    if (analysis.recoveryDifficulty === 'hard') {
      recommendations.push('Consider starting a new, easier habit first to build momentum');
      recommendations.push('Join a community or group with similar goals');
    }

    // Based on previous streak length
    if (analysis.previousStreak >= 30) {
      recommendations.push(`You maintained this for ${analysis.previousStreak} days before - you can do it again!`);
      recommendations.push('Review what worked during your streak');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Identify why the streak was broken
   */
  private identifyBreakReason(habitData: any): string {
    // Analyze patterns in check-in data
    const { missedDays, completionRate, avgDifficulty, userFeedback } = habitData;

    // If user marked habit as "too hard"
    if (avgDifficulty > 7 || userFeedback?.includes('difficult')) {
      return 'too_difficult';
    }

    // If missed days were always same day of week or time
    if (this.hasSchedulePattern(missedDays)) {
      return 'schedule_conflict';
    }

    // If completion rate gradually declined
    if (completionRate.last7Days < completionRate.previous7Days * 0.7) {
      return 'lost_motivation';
    }

    // Default to external circumstances
    return 'external_circumstances';
  }

  /**
   * Assess difficulty of recovering the streak
   */
  private assessRecoveryDifficulty(habitData: any): 'easy' | 'moderate' | 'hard' {
    const { previousStreak, daysSinceBreak, totalBreaks } = habitData;

    // Easy: Short break, long previous streak
    if (daysSinceBreak <= 3 && previousStreak >= 21) {
      return 'easy';
    }

    // Hard: Long break, multiple previous breaks, short previous streak
    if (daysSinceBreak > 14 || totalBreaks > 3 || previousStreak < 7) {
      return 'hard';
    }

    // Moderate: Everything else
    return 'moderate';
  }

  /**
   * Generate personalized recovery strategy
   */
  private generateRecoveryStrategy(
    habitData: any,
    breakReason: string
  ): RecoveryStrategy {
    const { previousStreak, difficulty } = habitData;

    // Immediate restart for easy recoveries
    if (previousStreak >= 30 && breakReason === 'external_circumstances') {
      return {
        type: 'immediate_restart',
        steps: [
          'Resume your habit today at your usual time',
          'Don\'t overthink it - just start',
          'Your muscle memory is still there'
        ],
        estimatedRecoveryDays: 3,
        supportingActions: [
          'Set a reminder for tomorrow',
          'Prepare materials tonight',
          'Tell someone about your restart'
        ]
      };
    }

    // Gradual rebuild for moderate difficulty
    if (breakReason === 'lost_motivation' || difficulty > 6) {
      return {
        type: 'gradual_rebuild',
        steps: [
          'Week 1: Do the habit 3 times (non-consecutive days)',
          'Week 2: Do the habit 5 times',
          'Week 3: Return to daily consistency'
        ],
        estimatedRecoveryDays: 21,
        supportingActions: [
          'Lower your expectations temporarily',
          'Focus on showing up, not perfection',
          'Celebrate each completion'
        ]
      };
    }

    // Habit redesign for systematic issues
    return {
      type: 'habit_redesign',
      steps: [
        'Reduce time commitment by 50%',
        'Change timing or context',
        'Simplify the habit',
        'Rebuild from this new baseline'
      ],
      estimatedRecoveryDays: 14,
      supportingActions: [
        'Make it ridiculously easy to start',
        'Remove friction and barriers',
        'Stack with existing habits'
      ]
    };
  }

  /**
   * Generate motivational message
   */
  private generateMotivationalMessage(habitData: any): string {
    const { previousStreak, name, totalCompletions } = habitData;

    const messages = [
      `You've completed ${name} ${totalCompletions} times already. That's real progress!`,
      `Your ${previousStreak}-day streak showed you can do this. Time to prove it again.`,
      `Every expert was once a beginner who didn't give up. This is your comeback moment.`,
      `The difference between who you are and who you want to be is what you do. Start today.`,
      `You don't have to be perfect. You just have to show up.`
    ];

    // Select message based on context
    if (previousStreak >= 30) {
      return `You've completed ${name} ${totalCompletions} times already. That's real progress! Your ${previousStreak}-day streak proved you have what it takes.`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Check if missed days follow a pattern
   */
  private hasSchedulePattern(missedDays: Date[]): boolean {
    if (missedDays.length < 3) return false;

    // Check if same day of week
    const daysOfWeek = missedDays.map(d => new Date(d).getDay());
    const uniqueDays = new Set(daysOfWeek);

    // If most missed days are same day of week
    return uniqueDays.size <= 2;
  }

  /**
   * Get habit data (mock implementation)
   */
  private async getHabitData(userId: string, habitId: string): Promise<any> {
    // Mock data - in production, query from database
    return {
      name: 'Morning Exercise',
      previousStreak: 28,
      daysSinceBreak: 5,
      totalBreaks: 2,
      totalCompletions: 85,
      difficulty: 6,
      missedDays: [],
      completionRate: {
        last7Days: 0.43,
        previous7Days: 0.86
      },
      avgDifficulty: 6,
      userFeedback: []
    };
  }
}
