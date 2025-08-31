import { Router, Request, Response } from 'express';
import { csrfToken } from '../middleware/csrf';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/csrf-token
 * Get a CSRF token for the current session
 */
router.get('/csrf-token', csrfToken(), async (req: Request, _res: Response) => {
  try {
    // Generate token using the middleware
    const token = await (req as any).csrfToken();

    _res.json({
      success: true,
      token,
      expiresIn: parseInt(process.env.CSRF_TOKEN_EXPIRY || '3600', 10),
    });
  } catch (error) {
    logger.error('Failed to generate CSRF token:', error);
    _res.status(500).json({
      success: false,
      error: 'Failed to generate security token',
    });
  }
});

export default router;
