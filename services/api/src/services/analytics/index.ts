/**
 * Analytics Services Index
 *
 * Comprehensive analytics services for the UpCoach platform
 */

// Core analytics services
export * from './CoachAnalyticsService';
export * from './RevenueAnalyticsService';
export * from './EngagementMetricsService';

// Re-export common types for convenience
export type {
  AnalyticsPeriod,
  TrendDataPoint,
} from './CoachAnalyticsService';
