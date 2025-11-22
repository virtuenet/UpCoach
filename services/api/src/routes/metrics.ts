import { Router } from 'express';
import { AdminMetricsController } from '../controllers/AdminMetricsController';
import { authMiddleware as authenticate } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticate, AdminMetricsController.getOverview);

export default router;


