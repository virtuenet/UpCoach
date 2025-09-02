"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AIAnalyticsController_1 = require("../controllers/AIAnalyticsController");
const ReferralAnalyticsController_1 = require("../controllers/ReferralAnalyticsController");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authMiddleware);
router.use((0, roleAuth_1.requireRole)('admin'));
// Get AI metrics
router.get('/ai/metrics', AIAnalyticsController_1.aiAnalyticsController.getAIMetrics);
// Get recent AI interactions
router.get('/ai/interactions', AIAnalyticsController_1.aiAnalyticsController.getAIInteractions);
// Get AI usage data for charts
router.get('/ai/usage', AIAnalyticsController_1.aiAnalyticsController.getAIUsageData);
// Get AI health status
router.get('/ai/health', AIAnalyticsController_1.aiAnalyticsController.getAIHealthStatus);
// Clear AI cache (admin action)
router.post('/ai/cache/clear', AIAnalyticsController_1.aiAnalyticsController.clearAICache);
// Referral analytics routes
router.get('/referrals/stats', ReferralAnalyticsController_1.referralAnalyticsController.getReferralStats);
router.get('/referrals', ReferralAnalyticsController_1.referralAnalyticsController.getAllReferrals);
router.put('/referrals/:id/status', ReferralAnalyticsController_1.referralAnalyticsController.updateReferralStatus);
router.post('/referrals/process-payment', ReferralAnalyticsController_1.referralAnalyticsController.processReferralPayment);
router.get('/referrals/programs', ReferralAnalyticsController_1.referralAnalyticsController.getReferralPrograms);
exports.default = router;
//# sourceMappingURL=aiAnalytics.js.map