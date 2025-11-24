import { Request, Response, NextFunction } from 'express';

import { dailyPulseService, PulsePeriod } from '../../services/ai/DailyPulseService';
import { logger } from '../../utils/logger';

export class DailyPulseController {
  async getPulse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || req.query.userId;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required to fetch daily pulse.' });
      }

      const period = (req.query.period as PulsePeriod) || dailyPulseService.getPeriodForNow();
      const pulse = await dailyPulseService.getPulse(userId, period);

      res.json({
        success: true,
        pulse,
      });
    } catch (error) {
      logger.error('Failed to fetch daily pulse', { error });
      next(error);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.body?.period as PulsePeriod) || dailyPulseService.getPeriodForNow();
      await dailyPulseService.broadcastPulse(period);

      res.json({
        success: true,
        message: `Broadcast triggered for ${period} pulse`,
      });
    } catch (error) {
      logger.error('Failed to broadcast daily pulse', { error });
      next(error);
    }
  }
}

export const dailyPulseController = new DailyPulseController();

