import { Router } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { analyticsInsightsService } from '../services/analytics/AnalyticsInsightsService';

const router = Router();

const adherenceQuerySchema = z.object({
  days: z
    .string()
    .transform(value => Number(value))
    .refine(value => value > 0 && value <= 90, { message: 'days must be between 1 and 90' })
    .optional(),
});

const engagementQuerySchema = z.object({
  days: z
    .string()
    .transform(value => Number(value))
    .refine(value => value > 0 && value <= 90, { message: 'days must be between 1 and 90' })
    .optional(),
});

router.get(
  '/goals/overview',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const overview = await analyticsInsightsService.getGoalOverview(req.user!.id);
    res.json({
      success: true,
      data: overview,
    });
  })
);

router.get(
  '/habits/adherence',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { days = 14 } = adherenceQuerySchema.parse(req.query);
    const data = await analyticsInsightsService.getHabitAdherence(req.user!.id, days);
    res.json({
      success: true,
      data: {
        days,
        adherence: data,
      },
    });
  })
);

router.get(
  '/engagement/trends',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { days = 21 } = engagementQuerySchema.parse(req.query);
    const data = await analyticsInsightsService.getEngagementTrends(req.user!.id, days);
    res.json({
      success: true,
      data: {
        days,
        trends: data,
      },
    });
  })
);

export default router;


