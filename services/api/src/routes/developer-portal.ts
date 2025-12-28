import express, { Request, Response } from 'express';
import { apiKeyService, APIKeyScope, APIKeyTier } from '../platform/APIKeyService';
import { webhookService, WebhookEventType } from '../platform/WebhookService';
import { developerPortalService } from '../platform/DeveloperPortalService';

const router = express.Router();

/**
 * Get Developer Dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // Assumes user middleware
    const dashboard = await developerPortalService.getDashboard(userId);
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List API Keys
 */
router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const keys = await apiKeyService.getUserAPIKeys(userId);
    res.json({ keys });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create API Key
 */
router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, tier, scopes } = req.body;

    const result = await apiKeyService.generateAPIKey(userId, name, {
      tier: tier as APIKeyTier,
      scopes: scopes as APIKeyScope[],
      rateLimit: {
        requestsPerHour: tier === 'free' ? 100 : tier === 'developer' ? 1000 : 10000,
        requestsPerDay: tier === 'free' ? 1000 : tier === 'developer' ? 10000 : 100000,
        burstLimit: tier === 'free' ? 10 : tier === 'developer' ? 50 : 200,
      },
    });

    res.status(201).json({
      key: result.key,
      rawKey: result.rawKey,
      warning: 'Store this key securely. It will not be shown again.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Revoke API Key
 */
router.delete('/api-keys/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    await apiKeyService.revokeAPIKey(keyId, 'User requested revocation');
    res.json({ message: 'API key revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List Webhooks
 */
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const webhooks = await webhookService.getUserSubscriptions(userId);
    res.json({ webhooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create Webhook
 */
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { url, events } = req.body;

    const webhook = await webhookService.createSubscription(
      userId,
      url,
      events as WebhookEventType[]
    );

    res.status(201).json(webhook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete Webhook
 */
router.delete('/webhooks/:webhookId', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    await webhookService.deleteSubscription(webhookId);
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test Webhook Endpoint
 */
router.post('/webhooks/test', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await webhookService.testEndpoint(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Documentation
 */
router.get('/docs', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const docs = await developerPortalService.getDocumentation(category as string);
    res.json({ documentation: docs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Code Examples
 */
router.get('/examples', async (req: Request, res: Response) => {
  try {
    const { language, category } = req.query;
    const examples = await developerPortalService.getCodeExamples(
      language as string,
      category as string
    );
    res.json({ examples });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
