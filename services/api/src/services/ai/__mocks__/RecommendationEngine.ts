import { jest } from '@jest/globals';

export const recommendationEngine = {
  generateRecommendations: jest.fn().mockResolvedValue([
    { type: 'goal', title: 'Morning meditation', score: 0.9 },
    { type: 'coach', title: 'Life Coach - John Doe', score: 0.85 },
    { type: 'content', title: 'Mindfulness Article', score: 0.8 },
  ]),

  getOptimalTiming: jest.fn().mockResolvedValue({
    optimalHours: [6, 7, 18, 19],
    confidence: 0.85,
    reasoning: 'Based on your historical patterns and energy levels',
    nextBestTime: '2024-01-15T06:00:00Z',
  }),

  generateAdaptiveSchedule: jest.fn().mockResolvedValue({
    date: new Date().toISOString().split('T')[0],
    activities: [
      { time: '06:00', activity: 'Morning workout', priority: 'high' },
      { time: '09:00', activity: 'Deep work session', priority: 'high' },
      { time: '12:00', activity: 'Lunch break', priority: 'medium' },
      { time: '15:00', activity: 'Team meeting', priority: 'medium' },
      { time: '19:00', activity: 'Evening meditation', priority: 'high' },
    ],
    optimizationScore: 0.88,
  }),

  suggestContent: jest.fn().mockResolvedValue([
    {
      id: 'content-1',
      title: 'Productivity Tips',
      type: 'article',
      relevance: 0.9,
    },
  ]),

  predictEngagement: jest.fn().mockResolvedValue({
    likelihood: 0.75,
    bestTime: '09:00',
    factors: ['morning person', 'consistent schedule'],
  }),

  analyzePreferences: jest.fn().mockResolvedValue({
    preferredActivities: ['meditation', 'exercise'],
    optimalDuration: 30,
    bestDaysOfWeek: ['Monday', 'Wednesday', 'Friday'],
  }),
};