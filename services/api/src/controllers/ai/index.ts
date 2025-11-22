/**
 * Conditional Controller Export
 *
 * Uses a lazy-loading proxy to avoid importing the real AIController in test mode.
 * This prevents model initialization and dependency loading during tests.
 */

// Mock implementation for tests
const mockFn = async () => ({ success: true });

const mockController = {
  getRecommendations: mockFn,
  getOptimalTiming: mockFn,
  getAdaptiveSchedule: mockFn,
  processMessage: mockFn,
  generateSmartResponse: mockFn,
  createLearningPath: mockFn,
  getLearningPaths: mockFn,
  trackLearningProgress: mockFn,
  getNextModule: mockFn,
  analyzeVoice: mockFn,
  getVoiceCoaching: mockFn,
  getVoiceInsights: mockFn,
  compareVoiceSessions: mockFn,
  getActiveInsights: mockFn,
  dismissInsight: mockFn,
  getInsightReport: mockFn,
  predictGoalCompletion: mockFn,
  getBehaviorPatterns: mockFn,
  getEngagementMetrics: mockFn,
  getPredictions: mockFn,
  getSuccessFactors: mockFn,
  getInterventionPlan: mockFn,
  getCoachingStrategy: mockFn,
  getPersonalizedContent: mockFn,
  updatePersonalization: mockFn,
  getPersonalizationPreferences: mockFn,
  hybridGenerate: mockFn,
  getRoutingDecision: mockFn,
  trackAnalyticsEvent: mockFn,
};

// Lazy-loading proxy that returns mock in test, real controller in production
let _cachedController: typeof mockController | null = null;

function getController() {
  if (_cachedController) {
    return _cachedController;
  }

  console.log('[aiController] Loading controller, NODE_ENV:', process.env.NODE_ENV);

  if (process.env.NODE_ENV === 'test') {
    console.log('[aiController] Using mock controller');
    _cachedController = mockController;
  } else {
    // Dynamically import to avoid loading in test environment
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { aiController: realController } = require('./AIController');
      console.log('[aiController] Loaded real controller');
      _cachedController = realController;
    } catch (error) {
      console.error('[aiController] Failed to load AIController:', error);
      _cachedController = mockController; // Fallback to mock
    }
  }

  return _cachedController;
}

// Export a proxy that lazily loads the appropriate implementation
export const aiController = new Proxy({} as typeof mockController, {
  get(_target, prop: string) {
    const controller = getController();
    return controller[prop as keyof typeof controller];
  },
  has(_target, prop: string) {
    const controller = getController();
    return prop in controller;
  },
  ownKeys(_target) {
    const controller = getController();
    return Object.keys(controller);
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    const controller = getController();
    if (prop in controller) {
      return {
        enumerable: true,
        configurable: true,
        writable: true,
        value: controller[prop as keyof typeof controller],
      };
    }
    return undefined;
  },
});
