"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdvancedAnalyticsController_1 = require("../controllers/AdvancedAnalyticsController");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Admin routes
router.post('/cohorts', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.createCohort);
router.get('/cohorts', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getCohorts);
router.get('/cohorts/:cohortId/retention', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getCohortRetention);
router.post('/cohorts/compare', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.compareCohorts);
router.post('/funnels', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.createFunnel);
router.get('/funnels', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getFunnels);
router.get('/funnels/:funnelId/analytics', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getFunnelAnalytics);
router.get('/feature-adoption', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getFeatureAdoption);
router.get('/revenue', (0, roleAuth_1.requireRole)('admin'), AdvancedAnalyticsController_1.advancedAnalyticsController.getRevenueAnalytics);
// User routes (for tracking)
router.post('/track/activity', AdvancedAnalyticsController_1.advancedAnalyticsController.trackActivity);
router.post('/track/funnel', ...AdvancedAnalyticsController_1.advancedAnalyticsController.trackFunnelStep);
router.get('/user/lifecycle-stage', AdvancedAnalyticsController_1.advancedAnalyticsController.getUserLifecycleStage);
exports.default = router;
//# sourceMappingURL=advancedAnalytics.js.map