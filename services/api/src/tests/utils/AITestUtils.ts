import { AIMessage, AIResponse, AIOptions } from '../../services/ai/AIService';

/**
 * Test utilities for AI service testing
 * Provides deterministic patterns for testing non-deterministic AI responses
 */

export interface MockUser {
  id: string;
  email: string;
  preferences?: {
    coachingStyle?: string;
    focusAreas?: string[];
  };
  createdAt?: Date;
}

export interface MockGoal {
  id: string;
  title: string;
  description?: string;
  userId: string;
  category: string;
  status?: string;
  progress?: number;
  targetDate?: Date;
}

export interface MockProfile {
  id: string;
  userId: string;
  learningStyle?: string;
  communicationPreference?: string;
  coachingPreferences?: unknown;
  behaviorPatterns?: unknown;
  progressMetrics?: unknown;
  preferences?: unknown;
  insights?: unknown[];
  lastInsightGeneration?: Date;
  profileMetrics?: unknown;
  save?: jest.Mock;
  toJSON?: () => any;
}

/**
 * Factory for creating consistent test data
 * Optimized to prevent memory leaks by using static dates and reusing objects
 */
export class AITestDataFactory {
  // Static date to prevent memory leaks from new Date() calls
  private static readonly STATIC_DATE = new Date('2024-01-01');
  
  static createUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: 'test-user-123',
      email: 'test@upcoach.ai',
      preferences: {
        coachingStyle: 'motivational',
        focusAreas: ['productivity', 'wellness']
      },
      createdAt: this.STATIC_DATE,
      ...overrides
    };
  }

  static createGoal(overrides: Partial<MockGoal> = {}): MockGoal {
    return {
      id: 'test-goal-123',
      title: 'Test Fitness Goal',
      description: 'A test goal for fitness improvement',
      userId: 'test-user-123',
      category: 'health',
      status: 'active',
      progress: 50,
      targetDate: new Date('2024-12-31'), // Static date
      ...overrides
    };
  }

  static createUserProfile(overrides: Partial<MockProfile> = {}): MockProfile {
    return {
      id: 'test-profile-123',
      userId: 'test-user-123',
      learningStyle: 'visual',
      communicationPreference: 'direct',
      coachingPreferences: {
        style: 'motivational',
        frequency: 'daily'
      },
      behaviorPatterns: {
        mostActiveTimeOfDay: 'morning',
        averageMoodScore: 7.5,
        preferredCategories: ['health', 'productivity'],
        goalCompletionRate: 75,
        consistencyScore: 0.8
      },
      progressMetrics: {
        totalSessions: 25,
        totalGoals: 5,
        streakDays: 14,
        averageSessionsPerWeek: 3.5,
        goalsCompleted: 3
      },
      preferences: {
        notifications: true
      },
      insights: [
        { type: 'behavior', message: 'You work best in the morning' }
      ],
      lastInsightGeneration: this.STATIC_DATE,
      profileMetrics: {
        totalSessions: 25,
        totalGoals: 5,
        streakDays: 14
      },
      save: jest.fn().mockResolvedValue(true),
      toJSON: function() { return { id: this.id, userId: this.userId }; },
      ...overrides
    };
  }

  static createConversation(messageCount = 5): AIMessage[] {
    return Array(messageCount).fill(null).map((_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Test message ${index + 1}`
    }));
  }

  static createMockAIResponse(content = 'Test AI response'): AIResponse {
    return {
      id: `test-response-${Date.now()}`,
      content,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      },
      model: 'gpt-4-turbo-preview',
      provider: 'openai'
    };
  }

  static createMockTasks(count = 3) {
    return Array(count).fill(null).map((_, index) => ({
      id: `task-${index + 1}`,
      title: `Test Task ${index + 1}`,
      priority: index === 0 ? 'high' : 'medium',
      estimatedDuration: 60 + (index * 30),
      dueDate: new Date(),
      status: 'pending'
    }));
  }

  static createMockMoods(count = 5) {
    return Array(count).fill(null).map((_, index) => ({
      moodValue: 6 + (index % 4),
      createdAt: new Date(this.STATIC_DATE.getTime() - (index * 24 * 60 * 60 * 1000))
    }));
  }
}

/**
 * Mock AI response patterns for deterministic testing
 */
export class AIMockPatterns {
  static generateCoachingResponse(input: string, context: unknown = {}): AIResponse {
    const responses = {
      motivation: 'I believe in your ability to achieve your goals. Let\'s break this down into manageable steps.',
      goal_setting: 'Setting SMART goals is key to success. Let\'s define specific, measurable objectives.',
      progress_review: 'You\'re making great progress! Let\'s analyze what\'s working and what we can improve.',
      default: 'I\'m here to support you on your journey. How can I help you today?'
    };

    const responseType = this.detectIntent(input);
    const content = responses[responseType as keyof typeof responses] || responses.default;

    return AITestDataFactory.createMockAIResponse(content);
  }

  static generateRecommendations(userId: string, type: 'goals' | 'habits' | 'content' | 'activities' = 'goals') {
    const recommendations = {
      goals: [
        { title: 'Daily Exercise', category: 'fitness', priority: 'high', urgency: 'high' },
        { title: 'Meditation Practice', category: 'wellness', priority: 'medium', urgency: 'medium' }
      ],
      habits: [
        { title: 'Morning Routine', category: 'productivity', priority: 'high' },
        { title: 'Evening Reflection', category: 'mindfulness', priority: 'medium' }
      ],
      content: [
        { title: 'Fitness Article', type: 'article', relevance: 0.9 },
        { title: 'Wellness Video', type: 'video', relevance: 0.8 }
      ],
      activities: [
        { title: '30-min Walk', duration: 30, type: 'exercise' },
        { title: '10-min Meditation', duration: 10, type: 'mindfulness' }
      ]
    };

    return recommendations[type];
  }

  static generateSchedule(userId: string, date: Date) {
    return {
      morning: [
        { time: '08:00', activity: 'Morning Exercise', duration: 30, type: 'exercise', priority: 'high' }
      ],
      afternoon: [
        { time: '14:00', activity: 'Team Meeting', duration: 60, type: 'work', priority: 'high' }
      ],
      evening: [
        { time: '19:00', activity: 'Meditation', duration: 15, type: 'wellness', priority: 'medium' }
      ],
      flexibility: 0.7
    };
  }

  static generateOptimalTiming(userId: string, activity: string) {
    const timingData = {
      exercise: {
        bestTime: 'morning',
        reason: 'Higher energy levels and better consistency',
        alternativeTimes: ['afternoon', 'evening'],
        specificTimeSlots: ['7:00 PM', '8:00 PM']
      },
      meditation: {
        bestTime: 'evening',
        reason: 'Better for relaxation and sleep preparation',
        alternativeTimes: ['morning', 'afternoon'],
        specificTimeSlots: ['6:00 PM', '7:00 PM']
      },
      work: {
        bestTime: 'morning',
        reason: 'Peak cognitive performance hours',
        alternativeTimes: ['afternoon'],
        specificTimeSlots: ['9:00 AM', '10:00 AM']
      }
    };

    return timingData[activity as keyof typeof timingData] || timingData.exercise;
  }

  private static detectIntent(input: string): string {
    const patterns = {
      motivation: /unmotivated|discouraged|give up|quit/i,
      goal_setting: /goal|target|objective|want to|plan to/i,
      progress_review: /progress|how am i|doing|achievement/i
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) {
        return intent;
      }
    }
    
    return 'default';
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  static async measureResponseTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    return { result, duration };
  }

  static async measureConcurrentRequests<T>(
    fn: () => Promise<T>,
    concurrency: number
  ): Promise<{ results: T[]; avgDuration: number; maxDuration: number }> {
    const startTime = Date.now();
    const promises = Array(concurrency).fill(null).map(() => fn());
    const results = await Promise.all(promises);
    const totalDuration = Date.now() - startTime;
    
    return {
      results,
      avgDuration: totalDuration / concurrency,
      maxDuration: totalDuration
    };
  }

  static validateResponseTime(duration: number, threshold: number): void {
    expect(duration).toBeLessThan(threshold);
  }

  static validateConcurrencyPerformance(avgDuration: number, threshold: number): void {
    expect(avgDuration).toBeLessThan(threshold);
  }
}

/**
 * Mock database operations for testing
 */
export class MockDatabaseUtils {
  static mockSequelizeModel(model: unknown) {
    return {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
      ...model
    };
  }

  static mockUserOperations() {
    const mockUser = AITestDataFactory.createUser();
    return {
      findByPk: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser)
    };
  }

  static mockGoalOperations() {
    const mockGoals = [
      AITestDataFactory.createGoal({ category: 'health' }),
      AITestDataFactory.createGoal({ category: 'productivity' })
    ];
    return {
      findAll: jest.fn().mockResolvedValue(mockGoals),
      count: jest.fn().mockResolvedValue(mockGoals.length)
    };
  }

  static mockTaskOperations() {
    const mockTasks = AITestDataFactory.createMockTasks();
    return {
      findAll: jest.fn().mockResolvedValue(mockTasks),
      count: jest.fn().mockResolvedValue(mockTasks.length)
    };
  }

  static mockMoodOperations() {
    const mockMoods = AITestDataFactory.createMockMoods();
    return {
      findAll: jest.fn().mockResolvedValue(mockMoods),
      count: jest.fn().mockResolvedValue(mockMoods.length)
    };
  }
}

/**
 * Validation utilities for AI responses
 */
export class AIResponseValidators {
  static validateAIResponse(response: unknown): void {
    expect(response).toMatchObject({
      id: expect.any(String),
      content: expect.any(String),
      usage: {
        promptTokens: expect.any(Number),
        completionTokens: expect.any(Number),
        totalTokens: expect.any(Number)
      },
      model: expect.any(String)
    });
    
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  }

  static validateRecommendations(recommendations: unknown): void {
    expect(recommendations).toBeInstanceOf(Array);
    if (recommendations.length > 0) {
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('category');
    }
  }

  static validateUserProfile(profile: unknown): void {
    expect(profile).toHaveProperty('learningStyle');
    expect(profile).toHaveProperty('communicationPreference');
    expect(profile).toHaveProperty('coachingPreferences');
    expect(profile).toHaveProperty('behaviorPatterns');
  }

  static validateInsightReport(report: unknown): void {
    expect(report).toHaveProperty('insights');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('trends');
    expect(report).toHaveProperty('recommendations');
    expect(report.insights).toBeInstanceOf(Array);
  }

  static validateSchedule(schedule: unknown): void {
    expect(schedule).toHaveProperty('morning');
    expect(schedule).toHaveProperty('afternoon');
    expect(schedule).toHaveProperty('evening');
    expect(schedule).toHaveProperty('flexibility');
    expect(typeof schedule.flexibility).toBe('number');
  }
}