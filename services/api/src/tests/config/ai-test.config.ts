/**
 * AI Service Test Configuration
 * Centralized configuration for AI service testing including performance thresholds,
 * mock configurations, and environment-specific settings
 */

export interface AITestConfig {
  performance: {
    thresholds: {
      chat: number;
      voice: number;
      recommendations: number;
      analytics: number;
      userProfiling: number;
      insights: number;
    };
    concurrent: {
      maxUsers: number;
      rampUpTime: number;
      sustainTime: number;
    };
  };
  mocking: {
    enableAIMocks: boolean;
    responseDelay: number;
    errorRate: number;
    timeoutRate: number;
  };
  database: {
    useInMemory: boolean;
    seedTestData: boolean;
    resetBetweenTests: boolean;
  };
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  ai: {
    providers: {
      openai: {
        model: string;
        temperature: number;
        maxTokens: number;
      };
      claude: {
        model: string;
        temperature: number;
        maxTokens: number;
      };
    };
    circuitBreaker: {
      failureThreshold: number;
      resetTimeout: number;
      monitoringPeriod: number;
    };
  };
}

/**
 * Default test configuration
 */
export const defaultAITestConfig: AITestConfig = {
  performance: {
    thresholds: {
      chat: 2000,          // 2 seconds for chat responses
      voice: 1000,         // 1 second for voice analysis
      recommendations: 500, // 500ms for recommendations
      analytics: 1500,     // 1.5 seconds for analytics
      userProfiling: 800,  // 800ms for user profiling
      insights: 1200,      // 1.2 seconds for insights
    },
    concurrent: {
      maxUsers: 100,       // Maximum concurrent users for load testing
      rampUpTime: 60,      // Seconds to ramp up to max users
      sustainTime: 300,    // Seconds to sustain max load
    },
  },
  mocking: {
    enableAIMocks: true,   // Enable AI response mocking in tests
    responseDelay: 100,    // Simulate AI response delay (ms)
    errorRate: 0.05,       // Simulate 5% error rate
    timeoutRate: 0.01,     // Simulate 1% timeout rate
  },
  database: {
    useInMemory: true,     // Use in-memory database for tests
    seedTestData: true,    // Seed test data automatically
    resetBetweenTests: true, // Reset database between tests
  },
  coverage: {
    statements: 80,        // Minimum statement coverage
    branches: 75,          // Minimum branch coverage
    functions: 80,         // Minimum function coverage
    lines: 80,             // Minimum line coverage
  },
  ai: {
    providers: {
      openai: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 1000,
      },
      claude: {
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 1000,
      },
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
    },
  },
};

/**
 * Environment-specific configurations
 */
export const testConfigs = {
  development: {
    ...defaultAITestConfig,
    mocking: {
      ...defaultAITestConfig.mocking,
      enableAIMocks: true,
      responseDelay: 50,
    },
    performance: {
      ...defaultAITestConfig.performance,
      thresholds: {
        ...defaultAITestConfig.performance.thresholds,
        chat: 3000, // More relaxed thresholds in dev
        voice: 1500,
        recommendations: 750,
      },
    },
  },
  
  testing: {
    ...defaultAITestConfig,
    mocking: {
      ...defaultAITestConfig.mocking,
      enableAIMocks: true,
      responseDelay: 0, // No delay in unit tests
      errorRate: 0.1,   // Higher error rate for testing
    },
  },
  
  staging: {
    ...defaultAITestConfig,
    mocking: {
      ...defaultAITestConfig.mocking,
      enableAIMocks: false, // Use real APIs in staging
      responseDelay: 0,
    },
    performance: {
      ...defaultAITestConfig.performance,
      concurrent: {
        maxUsers: 500, // Higher load testing in staging
        rampUpTime: 120,
        sustainTime: 600,
      },
    },
  },
  
  production: {
    ...defaultAITestConfig,
    mocking: {
      ...defaultAITestConfig.mocking,
      enableAIMocks: false, // Never mock in production tests
      responseDelay: 0,
      errorRate: 0.01,      // Lower acceptable error rate
    },
    performance: {
      ...defaultAITestConfig.performance,
      thresholds: {
        ...defaultAITestConfig.performance.thresholds,
        chat: 1500,         // Stricter thresholds in production
        voice: 800,
        recommendations: 400,
      },
    },
    coverage: {
      statements: 85,       // Higher coverage requirements
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
};

/**
 * Get configuration for current environment
 */
export function getAITestConfig(): AITestConfig {
  const env = process.env.NODE_ENV || 'development';
  return testConfigs[env as keyof typeof testConfigs] || defaultAITestConfig;
}

/**
 * Performance benchmark data for comparison
 */
export const performanceBenchmarks = {
  baseline: {
    chat: 1800,
    voice: 900,
    recommendations: 400,
    analytics: 1200,
    userProfiling: 600,
    insights: 1000,
  },
  target: {
    chat: 1500,
    voice: 750,
    recommendations: 350,
    analytics: 1000,
    userProfiling: 500,
    insights: 800,
  },
  excellent: {
    chat: 1000,
    voice: 500,
    recommendations: 250,
    analytics: 800,
    userProfiling: 400,
    insights: 600,
  },
};

/**
 * Test data configurations
 */
export const testDataConfig = {
  users: {
    count: 100,
    profiles: {
      beginner: 0.4,      // 40% beginners
      intermediate: 0.4,   // 40% intermediate
      advanced: 0.2,       // 20% advanced
    },
    coachingStyles: [
      'motivational',
      'analytical',
      'supportive',
      'challenging',
      'gentle',
    ],
  },
  
  conversations: {
    avgLength: 10,        // Average messages per conversation
    maxLength: 50,        // Maximum messages per conversation
    topics: [
      'goal_setting',
      'motivation',
      'progress_review',
      'habit_formation',
      'wellness',
      'productivity',
    ],
  },
  
  goals: {
    categories: [
      'health',
      'fitness',
      'productivity',
      'wellness',
      'career',
      'relationships',
    ],
    statusDistribution: {
      active: 0.6,
      completed: 0.2,
      paused: 0.15,
      cancelled: 0.05,
    },
  },
};

/**
 * Mock AI responses for different scenarios
 */
export const mockAIResponses = {
  coaching: {
    motivational: [
      "You're capable of achieving great things! Let's break this goal into smaller, manageable steps.",
      "I believe in your potential. What's one small action you can take today?",
      "Progress isn't always linear, but consistency is key. Keep moving forward!",
    ],
    analytical: [
      "Let's analyze your current progress and identify specific areas for improvement.",
      "Based on the data, I see patterns that we can leverage for better outcomes.",
      "Here's a structured approach to tackle this challenge systematically.",
    ],
    supportive: [
      "It's okay to feel overwhelmed sometimes. Let's work through this together.",
      "You're doing better than you think. Let's focus on your strengths.",
      "Take your time. Progress is more important than perfection.",
    ],
  },
  
  recommendations: {
    goals: [
      { title: "Daily 30-minute walk", category: "fitness", priority: "high" },
      { title: "10-minute morning meditation", category: "wellness", priority: "medium" },
      { title: "Read for 20 minutes daily", category: "personal_development", priority: "medium" },
    ],
    habits: [
      { title: "Morning routine", category: "productivity", priority: "high" },
      { title: "Evening reflection", category: "mindfulness", priority: "medium" },
      { title: "Hydration tracking", category: "health", priority: "low" },
    ],
  },
  
  insights: [
    {
      type: "behavior",
      title: "Peak Performance Hours",
      message: "You're most productive between 9 AM and 11 AM. Schedule important tasks during this time.",
      confidence: 0.85,
    },
    {
      type: "mood",
      title: "Mood Patterns",
      message: "Your mood tends to be higher on days when you exercise. Consider morning workouts.",
      confidence: 0.78,
    },
    {
      type: "goal_progress",
      title: "Goal Achievement",
      message: "You complete goals 23% faster when you break them into weekly milestones.",
      confidence: 0.92,
    },
  ],
};

/**
 * Error simulation configurations
 */
export const errorSimulationConfig = {
  types: {
    timeout: {
      rate: 0.01,        // 1% timeout rate
      delay: 5000,       // 5 second timeout
    },
    rateLimit: {
      rate: 0.02,        // 2% rate limit errors
      resetTime: 60000,  // 1 minute reset
    },
    serverError: {
      rate: 0.01,        // 1% server errors
      codes: [500, 502, 503],
    },
    validation: {
      rate: 0.05,        // 5% validation errors
      codes: [400, 422],
    },
  },
  
  recovery: {
    retryAttempts: 3,
    backoffMultiplier: 1.5,
    maxBackoffTime: 30000,
  },
};

export default getAITestConfig;