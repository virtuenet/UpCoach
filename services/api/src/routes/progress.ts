import { Router } from 'express';

import { progressTheaterController } from '../controllers/analytics/ProgressTheaterController';
import { authMiddleware as authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/highlights', (req, res, next) => progressTheaterController.list(req, res, next));

export default router;

