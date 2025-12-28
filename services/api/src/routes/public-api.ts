import express, { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../platform/APIKeyService';
import { rateLimitingService } from '../platform/RateLimitingService';
import { apiAnalyticsService } from '../platform/APIAnalyticsService';

const router = express.Router();

/**
 * API Key Authentication Middleware
 */
async function authenticateAPIKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const apiKey = authHeader.substring(7);
  const ipAddress = req.ip || req.connection.remoteAddress || '';

  const validation = await apiKeyService.validateAPIKey(apiKey, undefined, ipAddress);

  if (!validation.valid) {
    res.status(401).json({ error: validation.error });
    return;
  }

  // Check rate limit
  const rateLimit = await apiKeyService.checkRateLimit(validation.key!.id);

  if (!rateLimit.allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    });
    return;
  }

  // Attach key to request
  (req as any).apiKey = validation.key;
  (req as any).rateLimit = rateLimit;

  next();
}

/**
 * Record API Usage Middleware
 */
async function recordUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const startTime = Date.now();

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  (res as any).json = function (body: any) {
    const responseTime = Date.now() - startTime;
    const apiKey = (req as any).apiKey;

    if (apiKey) {
      // Record usage
      apiKeyService.recordUsage(apiKey.id, {
        timestamp: new Date(),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });

      // Record analytics
      apiAnalyticsService.recordRequest({
        keyId: apiKey.id,
        userId: apiKey.userId,
        timestamp: new Date(),
        method: req.method,
        endpoint: req.path,
        statusCode: res.statusCode,
        responseTime,
        requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0,
        responseSize: JSON.stringify(body).length,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    }

    return originalJson(body);
  };

  next();
}

// Apply middlewares to all public API routes
router.use(authenticateAPIKey);
router.use(recordUsage);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 */
router.get('/users/me', async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  res.json({
    id: apiKey.userId,
    message: 'User details endpoint',
  });
});

/**
 * @swagger
 * /api/v1/goals:
 *   get:
 *     summary: List user goals
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get('/goals', async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  res.json({
    goals: [],
    message: 'Goals endpoint - to be implemented',
  });
});

/**
 * @swagger
 * /api/v1/goals:
 *   post:
 *     summary: Create new goal
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created
 */
router.post('/goals', async (req: Request, res: Response) => {
  res.status(201).json({
    message: 'Goal created - to be implemented',
    data: req.body,
  });
});

/**
 * @swagger
 * /api/v1/habits:
 *   get:
 *     summary: List user habits
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of habits
 */
router.get('/habits', async (req: Request, res: Response) => {
  res.json({
    habits: [],
    message: 'Habits endpoint - to be implemented',
  });
});

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const metrics = await apiAnalyticsService.getKeyMetrics(apiKey.id, startDate, endDate);

  res.json(metrics);
});

export default router;
