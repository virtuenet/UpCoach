"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CoachController_1 = require("../controllers/CoachController");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.get('/coaches/search', CoachController_1.coachController.searchCoaches);
router.get('/coaches/:id', CoachController_1.coachController.getCoachDetails);
router.get('/coaches/:id/availability', CoachController_1.coachController.getCoachAvailability);
router.get('/coaches/:coachId/packages', CoachController_1.coachController.getCoachPackages);
// Authenticated routes
router.use(auth_1.authMiddleware);
// Client routes
router.post('/sessions/book', CoachController_1.coachController.bookSession);
router.post('/sessions/:id/payment', CoachController_1.coachController.processPayment);
router.post('/sessions/:sessionId/review', CoachController_1.coachController.submitReview);
router.post('/packages/:id/purchase', CoachController_1.coachController.purchasePackage);
router.get('/client/sessions', CoachController_1.coachController.getClientSessions);
router.post('/sessions/:id/cancel', CoachController_1.coachController.cancelSession);
// Coach routes (require coach role)
router.get('/coach/dashboard', (0, roleAuth_1.requireRole)('coach'), CoachController_1.coachController.getCoachDashboard);
// Admin routes (require admin role)
router.get('/coaches/admin/list', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminGetCoaches);
router.get('/coaches/admin/sessions', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminGetSessions);
router.get('/coaches/admin/reviews', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminGetReviews);
router.get('/coaches/admin/stats', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminGetStats);
router.put('/coaches/admin/:id/status', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminUpdateCoachStatus);
router.put('/coaches/admin/:id/verify', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminVerifyCoach);
router.put('/coaches/admin/:id/feature', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminFeatureCoach);
router.delete('/coaches/admin/reviews/:id', (0, roleAuth_1.requireRole)('admin'), CoachController_1.coachController.adminDeleteReview);
exports.default = router;
//# sourceMappingURL=coach.js.map