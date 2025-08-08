import { Router } from 'express';
import { advancedAnalyticsController } from '../controllers/AdvancedAnalyticsController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Admin routes
router.post('/cohorts', requireRole(['admin']), ...advancedAnalyticsController.createCohort);
router.get('/cohorts', requireRole(['admin']), advancedAnalyticsController.getCohorts);
router.get('/cohorts/:cohortId/retention', requireRole(['admin']), ...advancedAnalyticsController.getCohortRetention);
router.post('/cohorts/compare', requireRole(['admin']), ...advancedAnalyticsController.compareCohorts);

router.post('/funnels', requireRole(['admin']), ...advancedAnalyticsController.createFunnel);
router.get('/funnels', requireRole(['admin']), advancedAnalyticsController.getFunnels);
router.get('/funnels/:funnelId/analytics', requireRole(['admin']), ...advancedAnalyticsController.getFunnelAnalytics);

router.get('/feature-adoption', requireRole(['admin']), ...advancedAnalyticsController.getFeatureAdoption);
router.get('/revenue', requireRole(['admin']), ...advancedAnalyticsController.getRevenueAnalytics);

// User routes (for tracking)
router.post('/track/activity', ...advancedAnalyticsController.trackActivity);
router.post('/track/funnel', ...advancedAnalyticsController.trackFunnelStep);
router.get('/user/lifecycle-stage', advancedAnalyticsController.getUserLifecycleStage);

export default router;