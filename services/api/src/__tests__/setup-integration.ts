/**
 * Integration Test Setup
 * Sets up real database connections for integration testing
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-security';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-minimum-32-characters-long-for-security';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.PORT = '3000';

// Mock Redis to avoid connection issues
jest.mock('../services/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

// Mock external services
jest.mock('../services/email/UnifiedEmailService', () => ({
  emailService: {
    send: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock monitoring services to avoid initialization issues
jest.mock('../services/monitoring/SentryService', () => ({
  sentryService: {
    initialize: jest.fn(),
    setupExpressMiddleware: jest.fn(),
  },
}));

jest.mock('../services/monitoring/DataDogService', () => ({
  dataDogService: {
    initialize: jest.fn(),
    requestTracing: jest.fn(() => (req: any, res: any, next: any) => next()),
  },
}));

// Mock AI services
jest.mock('../services/ai/AIService', () => ({
  aiService: {
    createInitialSession: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock analytics service
jest.mock('../services/analytics/AnalyticsService', () => ({
  analyticsService: {
    identify: jest.fn().mockResolvedValue(undefined),
    trackUserAction: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock controllers that may have initialization issues
jest.mock('../controllers/AdvancedAnalyticsController', () => ({
  advancedAnalyticsController: {
    createCohort: jest.fn((req: any, res: any) => res.json({ success: true })),
    getCohorts: jest.fn((req: any, res: any) => res.json({ success: true, data: [] })),
    getCohortRetention: jest.fn((req: any, res: any) => res.json({ success: true, data: {} })),
    compareCohorts: jest.fn((req: any, res: any) => res.json({ success: true, data: {} })),
    createFunnel: jest.fn((req: any, res: any) => res.json({ success: true })),
    getFunnels: jest.fn((req: any, res: any) => res.json({ success: true, data: [] })),
    getFunnelAnalytics: jest.fn((req: any, res: any) => res.json({ success: true, data: {} })),
  },
}));
