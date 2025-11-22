import { Router, Request, Response } from 'express';
import { body } from 'express-validator';

import onboardingController from '../controllers/OnboardingController';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get onboarding status
router.get('/status', (req: Request, res: Response) =>
  onboardingController.getOnboardingStatus(req, res)
);

// Complete onboarding
router.post(
  '/complete',
  [
    body('profile.name').notEmpty().isString().withMessage('Name is required'),
    body('profile.age').optional().isInt({ min: 13, max: 120 }),
    body('profile.occupation').optional().isString(),
    body('profile.timezone').optional().isString(),
    body('goals.primaryGoal').notEmpty().isString(),
    body('goals.specificGoals').isArray().notEmpty().withMessage('At least one goal is required'),
    body('goals.timeline').notEmpty().isIn(['1-3 months', '3-6 months', '6-12 months', '1+ years']),
    body('preferences.coachingStyle')
      .notEmpty()
      .isIn(['supportive', 'challenging', 'analytical', 'holistic']),
    body('preferences.challenges').optional().isString(),
    body('availability.commitmentLevel').notEmpty().isIn(['daily', 'regular', 'weekly']),
  ],
  validateRequest,
  (req: Request, res: Response) => onboardingController.completeOnboarding(req, res)
);

// Skip onboarding
router.post('/skip', (req: Request, res: Response) =>
  onboardingController.skipOnboarding(req, res)
);

export default router;
