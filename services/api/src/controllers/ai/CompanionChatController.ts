import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

import { companionChatService } from '../../services/ai/CompanionChatService';

export class CompanionChatController {
  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await companionChatService.getHistory(req.user!.id);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  sendMessage = [
    body('message').isString().isLength({ min: 1, max: 2000 }),
    async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const reply = await companionChatService.sendMessage(req.user!.id, req.body.message);
        res.json({ success: true, data: reply });
      } catch (error) {
        next(error);
      }
    },
  ];

  async reset(req: Request, res: Response, next: NextFunction) {
    try {
      await companionChatService.resetHistory(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const companionChatController = new CompanionChatController();

