/**
 * Coach Intelligence ML Controller
 * API endpoints for ML-powered coaching features
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mlService from '../services/coaching/CoachIntelligenceMLServiceComplete';
import '../types/express';
import MLDataPipeline from '../services/ml/MLDataPipeline';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';
import { authLimiter, createRateLimiter } from '../middleware/rateLimiter';

// Initialize services
const dataPipeline = MLDataPipeline;

// Rate limiting for ML endpoints
const mlRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many ML requests, please try again later',
});

/**
 * Coach Intelligence ML Controller
 */
export class CoachIntelligenceMLController {
  /**
   * Calculate NPS Score
   * @route GET /api/ml/nps/:userId
   */
  static calculateNPSScore = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const { timeframe = '30d' } = req.query;

      // Validate input
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // Check user authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Calculate NPS score
      const npsResult = await mlService.calculateNPSScore(
        userId,
        timeframe as string
      );

      // Log analytics event
      logger.info('NPS score calculated', {
        userId,
        score: npsResult.score,
        category: npsResult.category,
      });

      res.json({
        success: true,
        data: npsResult,
      });
    }
  );

  /**
   * Track Skill Improvement
   * @route POST /api/ml/skills/track
   */
  static trackSkillImprovement = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, skillId, score, context } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Track skill improvement
      const assessment = await mlService.trackSkillImprovement(
        userId,
        skillId,
        score,
        context
      );

      logger.info('Skill improvement tracked', {
        userId,
        skillId,
        improvement: assessment.improvement,
      });

      res.json({
        success: true,
        data: assessment,
      });
    }
  );

  /**
   * Get Skill Assessment History
   * @route GET /api/ml/skills/:userId/:skillId
   */
  static getSkillAssessmentHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, skillId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Get assessment history from database
      // This would fetch from user_skill_assessments table
      const history = []; // Placeholder - implement database query

      res.json({
        success: true,
        data: {
          userId,
          skillId,
          assessments: history,
          total: history.length,
        },
      });
    }
  );

  /**
   * Generate Goal Insights
   * @route GET /api/ml/goals/insights/:userId
   */
  static generateGoalInsights = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const { goalId } = req.query;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Generate insights
      const insights = await mlService.generateGoalInsights(
        userId,
        goalId as string
      );

      logger.info('Goal insights generated', {
        userId,
        insightCount: insights.length,
      });

      res.json({
        success: true,
        data: insights,
      });
    }
  );

  /**
   * Predict Goal Success
   * @route GET /api/ml/goals/predict/:userId/:goalId
   */
  static predictGoalSuccess = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, goalId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Predict goal success
      const prediction = await mlService.predictGoalSuccess(userId, goalId);

      logger.info('Goal success predicted', {
        userId,
        goalId,
        probability: prediction.probability,
        riskLevel: prediction.riskLevel,
      });

      res.json({
        success: true,
        data: prediction,
      });
    }
  );

  /**
   * Analyze User Patterns
   * @route GET /api/ml/patterns/:userId
   */
  static analyzeUserPatterns = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Analyze patterns
      const patterns = await mlService.analyzeUserPatterns(userId);

      logger.info('User patterns analyzed', {
        userId,
        patternCount: patterns.length,
      });

      res.json({
        success: true,
        data: patterns,
      });
    }
  );

  /**
   * Generate Coaching Recommendations
   * @route POST /api/ml/recommendations
   */
  static generateCoachingRecommendations = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, context } = req.body;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Generate recommendations
      const recommendations = await mlService.generateCoachingRecommendations(
        userId,
        context
      );

      logger.info('Coaching recommendations generated', {
        userId,
        recommendationCount: recommendations.length,
      });

      res.json({
        success: true,
        data: recommendations,
      });
    }
  );

  /**
   * Calculate User Percentiles
   * @route GET /api/ml/percentiles/:userId
   */
  static calculateUserPercentiles = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const { metrics } = req.query;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Parse metrics if provided
      const targetMetrics = metrics
        ? (metrics as string).split(',')
        : undefined;

      // Calculate percentiles
      const percentiles = await mlService.calculateUserPercentiles(
        userId,
        targetMetrics
      );

      logger.info('User percentiles calculated', {
        userId,
        metricsCount: percentiles.length,
      });

      res.json({
        success: true,
        data: percentiles,
      });
    }
  );

  /**
   * Detect Behavioral Anomalies
   * @route GET /api/ml/anomalies/:userId
   */
  static detectBehavioralAnomalies = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Detect anomalies
      const anomalies = await mlService.detectBehavioralAnomalies(userId);

      // Log critical anomalies
      const criticalAnomalies = anomalies.filter(
        (a) => a.severity === 'critical'
      );
      if (criticalAnomalies.length > 0) {
        logger.warn('Critical anomalies detected', {
          userId,
          anomalies: criticalAnomalies,
        });
      }

      res.json({
        success: true,
        data: anomalies,
      });
    }
  );

  /**
   * Generate Personalized Insights
   * @route GET /api/ml/insights/:userId
   */
  static generatePersonalizedInsights = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Generate insights
      const insights = await mlService.generatePersonalizedInsights(userId);

      logger.info('Personalized insights generated', {
        userId,
        insightCount: insights.length,
      });

      res.json({
        success: true,
        data: insights,
      });
    }
  );

  /**
   * Generate Coaching Effectiveness Report
   * @route GET /api/ml/effectiveness/:coachId
   */
  static generateCoachingEffectivenessReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { coachId } = req.params;

      // Check authorization (only admin or the coach themselves)
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== coachId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Generate report
      const report = await mlService.generateCoachingEffectivenessReport(
        coachId
      );

      logger.info('Coaching effectiveness report generated', {
        coachId,
      });

      res.json({
        success: true,
        data: report,
      });
    }
  );

  // ==================== Data Pipeline Endpoints ====================

  /**
   * Process User Features
   * @route POST /api/ml/features/process
   */
  static processUserFeatures = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, features, useCache = true, validate = true } = req.body;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Process features
      const featureVector = await dataPipeline.processUserData(userId, {
        features,
        useCache,
        validate,
      });

      logger.info('User features processed', {
        userId,
        featureCount: featureVector.features.length,
        processingTime: featureVector.metadata.processingTime,
      });

      res.json({
        success: true,
        data: featureVector,
      });
    }
  );

  /**
   * Batch Process Users
   * @route POST /api/ml/features/batch
   */
  static batchProcessUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userIds, batchSize = 10, parallel = true } = req.body;

      // Admin only endpoint
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      // Validate input
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('User IDs array is required', 400);
      }

      // Process batch
      const results = await dataPipeline.batchProcessUsers(userIds, {
        batchSize,
        parallel,
      });

      logger.info('Batch processing completed', {
        userCount: userIds.length,
        successCount: results.length,
      });

      res.json({
        success: true,
        data: {
          processed: results.length,
          total: userIds.length,
          results: results.map((r) => ({
            userId: r.userId,
            featureCount: r.features.length,
            timestamp: r.timestamp,
          })),
        },
      });
    }
  );

  /**
   * Stream Process Real-time Event
   * @route POST /api/ml/stream/event
   */
  static streamProcessEvent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId, eventType, eventData } = req.body;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Process event
      await dataPipeline.streamProcess(userId, {
        type: eventType,
        data: eventData,
        timestamp: new Date(),
      });

      logger.info('Stream event processed', {
        userId,
        eventType,
      });

      res.json({
        success: true,
        message: 'Event processed successfully',
      });
    }
  );

  // ==================== Model Management Endpoints ====================

  /**
   * Get Model Status
   * @route GET /api/ml/models/status
   */
  static getModelStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Admin only endpoint
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      // Get model statuses
      const models = [
        { name: 'nps_predictor', status: 'active', version: '1.0.0' },
        { name: 'skill_tracker', status: 'active', version: '1.0.0' },
        { name: 'goal_predictor', status: 'active', version: '1.0.0' },
        { name: 'pattern_detector', status: 'active', version: '1.0.0' },
        { name: 'insight_generator', status: 'active', version: '1.0.0' },
      ];

      res.json({
        success: true,
        data: models,
      });
    }
  );

  /**
   * Check Model Drift
   * @route GET /api/ml/models/drift
   */
  static checkModelDrift = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Admin only endpoint
      if (req.user?.role !== 'admin') {
        throw new AppError('Admin access required', 403);
      }

      // Check drift for all models
      // This would be implemented with actual drift detection
      const driftReports = [
        {
          model: 'nps_predictor',
          driftScore: 0.02,
          driftDetected: false,
          lastChecked: new Date(),
        },
        {
          model: 'goal_predictor',
          driftScore: 0.08,
          driftDetected: false,
          lastChecked: new Date(),
        },
      ];

      res.json({
        success: true,
        data: driftReports,
      });
    }
  );

  // ==================== Privacy and Compliance Endpoints ====================

  /**
   * Get User ML Consent Status
   * @route GET /api/ml/consent/:userId
   */
  static getUserConsent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Get consent status from database
      // This would fetch from ml_user_consent table
      const consent = {
        userId,
        mlFeaturesConsent: true,
        dataAnalysisConsent: true,
        personalizationConsent: true,
        thirdPartySharingConsent: false,
        consentDate: new Date(),
        consentVersion: '1.0.0',
      };

      res.json({
        success: true,
        data: consent,
      });
    }
  );

  /**
   * Update User ML Consent
   * @route PUT /api/ml/consent/:userId
   */
  static updateUserConsent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const consentData = req.body;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Update consent in database
      // This would update ml_user_consent table
      const updatedConsent = {
        userId,
        ...consentData,
        consentDate: new Date(),
        consentVersion: '1.0.0',
      };

      logger.info('ML consent updated', {
        userId,
        consent: consentData,
      });

      res.json({
        success: true,
        data: updatedConsent,
      });
    }
  );

  /**
   * Delete User ML Data (GDPR)
   * @route DELETE /api/ml/data/:userId
   */
  static deleteUserMLData = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Delete all ML-related data for the user
      // This would delete from all ML tables
      logger.warn('User ML data deletion requested', { userId });

      res.json({
        success: true,
        message: 'User ML data deletion initiated',
      });
    }
  );

  // ==================== Dashboard Endpoints ====================

  /**
   * Get ML Dashboard Summary
   * @route GET /api/ml/dashboard/:userId
   */
  static getMLDashboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      // Check authorization
      const isAdmin = req.user?.role === 'admin';
      if (req.user?.id !== userId && !isAdmin) {
        throw new AppError('Unauthorized access', 403);
      }

      // Gather dashboard data
      const [
        npsScore,
        patterns,
        insights,
        percentiles,
        recommendations,
      ] = await Promise.all([
        mlService.calculateNPSScore(userId),
        mlService.analyzeUserPatterns(userId),
        mlService.generatePersonalizedInsights(userId),
        mlService.calculateUserPercentiles(userId),
        mlService.generateCoachingRecommendations(userId),
      ]);

      res.json({
        success: true,
        data: {
          npsScore: npsScore.score,
          npsCategory: npsScore.category,
          topPatterns: patterns.slice(0, 3),
          topInsights: insights.slice(0, 3),
          keyPercentiles: percentiles.slice(0, 3),
          topRecommendations: recommendations.slice(0, 3),
          lastUpdated: new Date(),
        },
      });
    }
  );
}

// Export rate limiter for use in routes
export { mlRateLimiter };