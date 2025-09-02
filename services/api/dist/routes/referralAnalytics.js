"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReferralAnalyticsController_1 = require("../controllers/ReferralAnalyticsController");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authMiddleware);
router.use((0, roleAuth_1.requireRole)('admin'));
// Get referral statistics
router.get('/referrals/stats', ReferralAnalyticsController_1.referralAnalyticsController.getReferralStats);
// Get all referrals with filtering
router.get('/referrals', ReferralAnalyticsController_1.referralAnalyticsController.getAllReferrals);
// Update referral status
router.put('/referrals/:id/status', ReferralAnalyticsController_1.referralAnalyticsController.updateReferralStatus);
// Process referral payment
router.post('/referrals/process-payment', ReferralAnalyticsController_1.referralAnalyticsController.processReferralPayment);
// Get referral programs
router.get('/referrals/programs', ReferralAnalyticsController_1.referralAnalyticsController.getReferralPrograms);
exports.default = router;
//# sourceMappingURL=referralAnalytics.js.map