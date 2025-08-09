import { Router } from 'express';
import { coachController } from '../controllers/CoachController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = Router();

// Public routes (no authentication required)
router.get('/coaches/search', coachController.searchCoaches);
router.get('/coaches/:id', coachController.getCoachDetails);
router.get('/coaches/:id/availability', coachController.getCoachAvailability);
router.get('/coaches/:coachId/packages', coachController.getCoachPackages);

// Authenticated routes
router.use(authenticateToken);

// Client routes
router.post('/sessions/book', coachController.bookSession);
router.post('/sessions/:id/payment', coachController.processPayment);
router.post('/sessions/:sessionId/review', coachController.submitReview);
router.post('/packages/:id/purchase', coachController.purchasePackage);
router.get('/client/sessions', coachController.getClientSessions);
router.post('/sessions/:id/cancel', coachController.cancelSession);

// Coach routes (require coach role)
router.get('/coach/dashboard', requireRole('coach'), coachController.getCoachDashboard);

// Admin routes (require admin role)
router.get('/coaches/admin/list', requireRole('admin'), coachController.adminGetCoaches);
router.get('/coaches/admin/sessions', requireRole('admin'), coachController.adminGetSessions);
router.get('/coaches/admin/reviews', requireRole('admin'), coachController.adminGetReviews);
router.get('/coaches/admin/stats', requireRole('admin'), coachController.adminGetStats);
router.put('/coaches/admin/:id/status', requireRole('admin'), coachController.adminUpdateCoachStatus);
router.put('/coaches/admin/:id/verify', requireRole('admin'), coachController.adminVerifyCoach);
router.put('/coaches/admin/:id/feature', requireRole('admin'), coachController.adminFeatureCoach);
router.delete('/coaches/admin/reviews/:id', requireRole('admin'), coachController.adminDeleteReview);

export default router;