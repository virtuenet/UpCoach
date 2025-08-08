import { Router } from 'express';
import { referralAnalyticsController } from '../controllers/ReferralAnalyticsController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get referral statistics
router.get('/referrals/stats', referralAnalyticsController.getReferralStats);

// Get all referrals with filtering
router.get('/referrals', referralAnalyticsController.getAllReferrals);

// Update referral status
router.put('/referrals/:id/status', referralAnalyticsController.updateReferralStatus);

// Process referral payment
router.post('/referrals/process-payment', referralAnalyticsController.processReferralPayment);

// Get referral programs
router.get('/referrals/programs', referralAnalyticsController.getReferralPrograms);

export default router;