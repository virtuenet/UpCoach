"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorSimulationConfig = exports.mockAIResponses = exports.testDataConfig = exports.performanceBenchmarks = exports.testConfigs = exports.defaultAITestConfig = void 0;
exports.getAITestConfig = getAITestConfig;
exports.defaultAITestConfig = {
    performance: {
        thresholds: {
            chat: 2000,
            voice: 1000,
            recommendations: 500,
            analytics: 1500,
            userProfiling: 800,
            insights: 1200,
        },
        concurrent: {
            maxUsers: 100,
            rampUpTime: 60,
            sustainTime: 300,
        },
    },
    mocking: {
        enableAIMocks: true,
        responseDelay: 100,
        errorRate: 0.05,
        timeoutRate: 0.01,
    },
    database: {
        useInMemory: true,
        seedTestData: true,
        resetBetweenTests: true,
    },
    coverage: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
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
exports.testConfigs = {
    development: {
        ...exports.defaultAITestConfig,
        mocking: {
            ...exports.defaultAITestConfig.mocking,
            enableAIMocks: true,
            responseDelay: 50,
        },
        performance: {
            ...exports.defaultAITestConfig.performance,
            thresholds: {
                ...exports.defaultAITestConfig.performance.thresholds,
                chat: 3000,
                voice: 1500,
                recommendations: 750,
            },
        },
    },
    testing: {
        ...exports.defaultAITestConfig,
        mocking: {
            ...exports.defaultAITestConfig.mocking,
            enableAIMocks: true,
            responseDelay: 0,
            errorRate: 0.1,
        },
    },
    staging: {
        ...exports.defaultAITestConfig,
        mocking: {
            ...exports.defaultAITestConfig.mocking,
            enableAIMocks: false,
            responseDelay: 0,
        },
        performance: {
            ...exports.defaultAITestConfig.performance,
            concurrent: {
                maxUsers: 500,
                rampUpTime: 120,
                sustainTime: 600,
            },
        },
    },
    production: {
        ...exports.defaultAITestConfig,
        mocking: {
            ...exports.defaultAITestConfig.mocking,
            enableAIMocks: false,
            responseDelay: 0,
            errorRate: 0.01,
        },
        performance: {
            ...exports.defaultAITestConfig.performance,
            thresholds: {
                ...exports.defaultAITestConfig.performance.thresholds,
                chat: 1500,
                voice: 800,
                recommendations: 400,
            },
        },
        coverage: {
            statements: 85,
            branches: 80,
            functions: 85,
            lines: 85,
        },
    },
};
function getAITestConfig() {
    const env = process.env.NODE_ENV || 'development';
    return exports.testConfigs[env] || exports.defaultAITestConfig;
}
exports.performanceBenchmarks = {
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
exports.testDataConfig = {
    users: {
        count: 100,
        profiles: {
            beginner: 0.4,
            intermediate: 0.4,
            advanced: 0.2,
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
        avgLength: 10,
        maxLength: 50,
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
exports.mockAIResponses = {
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
exports.errorSimulationConfig = {
    types: {
        timeout: {
            rate: 0.01,
            delay: 5000,
        },
        rateLimit: {
            rate: 0.02,
            resetTime: 60000,
        },
        serverError: {
            rate: 0.01,
            codes: [500, 502, 503],
        },
        validation: {
            rate: 0.05,
            codes: [400, 422],
        },
    },
    recovery: {
        retryAttempts: 3,
        backoffMultiplier: 1.5,
        maxBackoffTime: 30000,
    },
};
exports.default = getAITestConfig;
//# sourceMappingURL=ai-test.config.js.map