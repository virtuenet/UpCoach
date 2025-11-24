import { Request, Response, NextFunction } from 'express';

import { progressHighlightService } from '../../services/analytics/ProgressHighlightService';

export class ProgressTheaterController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const highlights = await progressHighlightService.generateHighlights(req.user!.id);
      res.json({ success: true, data: highlights });
    } catch (error) {
      next(error);
    }
  }
}

export const progressTheaterController = new ProgressTheaterController();

