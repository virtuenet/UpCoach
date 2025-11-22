import { jest } from '@jest/globals';

export const personalizationEngine = {
  getUserPreferences: jest.fn().mockResolvedValue({
    userId: 'user-123',
    preferences: {
      contentType: ['articles', 'videos', 'podcasts'],
      difficulty: 'intermediate',
      sessionDuration: 30,
      notificationTime: '09:00',
      language: 'en',
      themes: ['productivity', 'wellness', 'leadership'],
    },
    learningStyle: 'visual',
    communicationStyle: 'direct',
    motivationalTriggers: ['achievement', 'competition', 'growth'],
    updatedAt: new Date().toISOString(),
  }),

  updateUserProfile: jest.fn().mockResolvedValue({
    success: true,
    profileId: 'profile-123',
    updates: {
      preferences: true,
      behavior: true,
      context: true,
    },
    timestamp: new Date().toISOString(),
  }),

  getPersonalizedContent: jest.fn().mockResolvedValue([
    {
      id: 'content-1',
      type: 'article',
      title: 'Advanced Time Management Techniques',
      relevanceScore: 0.92,
      matchedPreferences: ['productivity', 'intermediate'],
      estimatedDuration: 12,
    },
    {
      id: 'content-2',
      type: 'video',
      title: 'Leadership in Remote Teams',
      relevanceScore: 0.87,
      matchedPreferences: ['leadership', 'visual'],
      estimatedDuration: 25,
    },
    {
      id: 'content-3',
      type: 'podcast',
      title: 'Wellness and Work-Life Balance',
      relevanceScore: 0.85,
      matchedPreferences: ['wellness'],
      estimatedDuration: 35,
    },
  ]),

  generateCoachingStrategy: jest.fn().mockResolvedValue({
    strategy: {
      approach: 'goal-oriented',
      frequency: 'daily',
      intensity: 'moderate',
      focusAreas: ['habit formation', 'skill development', 'mindset'],
    },
    tactics: [
      {
        type: 'daily_checkin',
        time: '09:00',
        format: 'quick_survey',
        duration: 2,
      },
      {
        type: 'weekly_review',
        day: 'Sunday',
        format: 'detailed_reflection',
        duration: 15,
      },
      {
        type: 'milestone_celebration',
        trigger: 'goal_completion',
        format: 'achievement_badge',
      },
    ],
    personalizedMessages: {
      greeting: 'Ready to tackle today\'s challenges?',
      motivation: 'You\'re making excellent progress!',
      reminder: 'Don\'t forget your commitment to growth',
    },
    expectedOutcomes: {
      engagement: 0.85,
      retention: 0.90,
      satisfaction: 0.88,
    },
  }),

  adaptToUserBehavior: jest.fn().mockResolvedValue({
    adaptations: [
      {
        aspect: 'notification_timing',
        oldValue: '09:00',
        newValue: '08:30',
        reason: 'User typically checks app earlier',
      },
      {
        aspect: 'content_difficulty',
        oldValue: 'intermediate',
        newValue: 'advanced',
        reason: 'Consistent high performance on intermediate content',
      },
    ],
    confidenceScore: 0.82,
  }),

  predictUserNeeds: jest.fn().mockResolvedValue({
    immediateNeeds: ['stress_management', 'quick_wins'],
    upcomingNeeds: ['skill_advancement', 'network_building'],
    recommendations: [
      'Schedule a relaxation session',
      'Set three achievable mini-goals for today',
    ],
    confidence: 0.78,
  }),
};