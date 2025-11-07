/**
 * Conditional export for AIController
 * In test environment, exports mock to prevent model initialization
 * In production, exports real controller
 */

// Check if we're in test environment BEFORE any imports
if (process.env.NODE_ENV === 'test') {
  // Export mock implementation for tests
  const mockFn = async () => ({ success: true });

  export const aiController = {
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
} else {
  // Import and export real controller for production
  // This import only happens in non-test environment
  export { aiController } from './AIController';
}
