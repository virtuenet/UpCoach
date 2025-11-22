import { jest } from '@jest/globals';

export const insightGenerator = {
  generateInsightReport: jest.fn().mockImplementation((userId, periodOrOptions) => {
    // Handle both test format (period as string) and implementation format (options object)
    let period = 'weekly';
    if (typeof periodOrOptions === 'string') {
      period = periodOrOptions;
    } else if (periodOrOptions?.days) {
      if (periodOrOptions.days <= 1) period = 'daily';
      else if (periodOrOptions.days <= 7) period = 'weekly';
      else period = 'monthly';
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30));

    return Promise.resolve({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      insights: [
        { type: 'achievement', title: 'Consistent workout streak', impact: 'positive', confidence: 0.9 },
        { type: 'pattern', title: 'Peak productivity mornings', impact: 'neutral', confidence: 0.85 },
        { type: 'recommendation', title: 'Optimize sleep schedule', impact: 'positive', confidence: 0.78 },
      ],
      summary: {
        totalInsights: 3,
        actionableInsights: 2,
        overallProgress: 0.82,
        engagementScore: 0.88,
      },
      trends: {
        mood: 'improving',
        productivity: 'stable',
        goalProgress: 'accelerating',
      },
      userId,
      generatedAt: new Date().toISOString(),
    });
  }),

  getActiveInsights: jest.fn().mockResolvedValue([
    {
      id: 'insight-1',
      type: 'recommendation',
      title: 'Try morning meditation',
      description: 'Based on your stress patterns, morning meditation could help',
      priority: 'high',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-2',
      type: 'achievement',
      title: 'Goal milestone reached',
      description: 'You\'ve completed 80% of your fitness goal',
      priority: 'medium',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ]),

  dismissInsight: jest.fn().mockResolvedValue({
    success: true,
    insightId: 'insight-1',
    dismissedAt: new Date().toISOString(),
  }),

  generateRecommendations: jest.fn().mockResolvedValue([
    {
      category: 'productivity',
      recommendation: 'Schedule deep work blocks in the morning',
      reason: 'Your data shows highest focus between 9-11 AM',
      expectedImpact: 'high',
    },
    {
      category: 'wellness',
      recommendation: 'Add 10-minute breaks between tasks',
      reason: 'Prevents cognitive fatigue based on your work patterns',
      expectedImpact: 'medium',
    },
  ]),

  analyzeProgress: jest.fn().mockResolvedValue({
    overallTrend: 'positive',
    progressRate: 1.2, // 20% above average
    strengths: ['consistency', 'goal_setting', 'time_management'],
    areasForImprovement: ['stress_management', 'work_life_balance'],
    predictedOutcome: {
      goalCompletion: 0.88,
      timeframe: '2 weeks ahead of schedule',
    },
  }),

  identifyPatterns: jest.fn().mockResolvedValue({
    behavioral: [
      { pattern: 'morning_productivity', strength: 0.89, frequency: 'daily' },
      { pattern: 'weekend_rest', strength: 0.75, frequency: 'weekly' },
    ],
    emotional: [
      { pattern: 'monday_motivation', strength: 0.82, frequency: 'weekly' },
      { pattern: 'friday_relief', strength: 0.91, frequency: 'weekly' },
    ],
  }),
};