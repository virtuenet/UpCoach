import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

import { streakGuardianService } from '../../services/gamification/StreakGuardianService';
import { logger } from '../../utils/logger';

export class StreakGuardianController {
  list = async (req: Request, res: Response) => {
    try {
      const guardians = await streakGuardianService.listGuardians(req.userId);
      res.json({ success: true, data: guardians });
    } catch (error) {
      logger.error('Failed to list guardians', { error });
      res.status(500).json({ success: false, error: 'Unable to load guardians' });
    }
  };

  invite = [
    body('email').isEmail(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      try {
        const guardian = await streakGuardianService.inviteGuardian(req.userId, req.body.email);
        res.json({ success: true, data: guardian });
      } catch (error) {
        logger.error('Failed to invite guardian', { error });
        res.status(400).json({ success: false, error: (error as Error).message });
      }
    },
  ];

  accept = [
    param('ownerId').isUUID(),
    body('accept').isBoolean(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      try {
        await streakGuardianService.respondToInvite(
          req.userId,
          req.params.ownerId,
          Boolean(req.body.accept)
        );
        res.json({ success: true });
      } catch (error) {
        logger.error('Failed to respond to guardian invite', { error });
        res.status(400).json({ success: false, error: (error as Error).message });
      }
    },
  ];

  remove = [
    param('guardianId').isUUID(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      await streakGuardianService.removeGuardian(req.userId, req.params.guardianId);
      res.json({ success: true });
    },
  ];

  cheer = [
    param('linkId').isUUID(),
    body('message').isString().isLength({ min: 3, max: 240 }),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      try {
        await streakGuardianService.sendCheer(req.userId, req.params.linkId, req.body.message);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
      }
    },
  ];
}

export const streakGuardianController = new StreakGuardianController();

