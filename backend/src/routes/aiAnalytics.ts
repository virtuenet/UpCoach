import { Router } from 'express';
import { aiAnalyticsController } from '../controllers/AIAnalyticsController';
import { referralAnalyticsController } from '../controllers/ReferralAnalyticsController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Get AI metrics
router.get('/ai/metrics', aiAnalyticsController.getAIMetrics);

// Get recent AI interactions
router.get('/ai/interactions', aiAnalyticsController.getAIInteractions);

// Get AI usage data for charts
router.get('/ai/usage', aiAnalyticsController.getAIUsageData);

// Get AI health status
router.get('/ai/health', aiAnalyticsController.getAIHealthStatus);

// Clear AI cache (admin action)
router.post('/ai/cache/clear', aiAnalyticsController.clearAICache);

// Referral analytics routes
router.get('/referrals/stats', referralAnalyticsController.getReferralStats);
router.get('/referrals', referralAnalyticsController.getAllReferrals);
router.put('/referrals/:id/status', referralAnalyticsController.updateReferralStatus);
router.post('/referrals/process-payment', referralAnalyticsController.processReferralPayment);
router.get('/referrals/programs', referralAnalyticsController.getReferralPrograms);

export default router;
