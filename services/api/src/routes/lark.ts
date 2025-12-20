/**
 * Lark Webhook Routes
 * Handles incoming Lark webhook events for bot commands, notifications, and widget data
 */

import { Router, Request, Response } from 'express';

import { getLarkService, isLarkConfigured } from '../services/lark';
import { logger } from '../utils/logger';

// Widget data types
interface CoachPipelineData {
  totalCoaches: number;
  activeCoaches: number;
  pendingOnboarding: number;
  avgRating: number;
  byStatus: Record<string, number>;
  recentSignups: Array<{
    id: string;
    name: string;
    specialization: string;
    signupDate: Date;
    status: string;
  }>;
}

interface SupportTicketData {
  total: number;
  open: number;
  averageResolutionTime: number;
  byPriority: Record<string, number>;
  recentTickets: Array<{
    id: string;
    subject: string;
    clientName: string;
    priority: string;
    status: string;
    createdAt: Date;
  }>;
}

interface PayoutData {
  totalPending: number;
  totalPaidThisMonth: number;
  pendingCount: number;
  byStatus: Record<string, number>;
  recentPayouts: Array<{
    id: string;
    coachName: string;
    amount: number;
    status: string;
    periodStart: Date;
    periodEnd: Date;
  }>;
}

interface SessionData {
  todaySessions: number;
  completedToday: number;
  noShowCount: number;
  upcomingSessions: Array<{
    coachName: string;
    clientName: string;
    startTime: Date;
    type: string;
  }>;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  metadata?: Record<string, string>;
}

interface SyncStatus {
  lastSyncTime: Date;
  recordsSynced: number;
  pendingChanges: number;
  errors: number;
  isHealthy: boolean;
}

const router = Router();

/**
 * Lark webhook endpoint
 * Receives events from Lark platform
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (!isLarkConfigured()) {
    logger.warn('Lark webhook received but Lark is not configured');
    return res.status(503).json({
      code: -1,
      msg: 'Lark integration not configured',
    });
  }

  const larkService = getLarkService();
  if (!larkService) {
    logger.error('Lark service not initialized');
    return res.status(503).json({
      code: -1,
      msg: 'Lark service not available',
    });
  }

  try {
    const response = await larkService.handleWebhook({
      body: req.body,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });

    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    logger.error('Lark webhook error', {
      error: (error as Error).message,
      body: req.body,
    });
    return res.status(500).json({
      code: -1,
      msg: 'Internal server error',
    });
  }
});

/**
 * Health check for Lark integration
 */
router.get('/health', (_req: Request, res: Response) => {
  const configured = isLarkConfigured();
  const service = getLarkService();

  return res.json({
    status: configured && service ? 'healthy' : 'not_configured',
    configured,
    serviceInitialized: !!service,
  });
});

/**
 * Send a test notification (admin only)
 */
router.post('/test-notification', async (req: Request, res: Response) => {
  if (!isLarkConfigured()) {
    return res.status(503).json({
      code: -1,
      msg: 'Lark integration not configured',
    });
  }

  const larkService = getLarkService();
  if (!larkService) {
    return res.status(503).json({
      code: -1,
      msg: 'Lark service not available',
    });
  }

  try {
    const { type = 'text', message = 'Test notification from UpCoach', chatId } = req.body;

    const publisher = larkService.getNotificationPublisher();

    if (type === 'text') {
      await publisher.sendText(message, chatId ? { receiveId: chatId } : undefined);
    } else {
      await publisher.send(
        {
          title: 'Test Notification',
          message,
          level: 'info',
          category: 'system',
        },
        chatId ? { receiveId: chatId } : undefined
      );
    }

    return res.json({
      code: 0,
      msg: 'Notification sent successfully',
    });
  } catch (error) {
    logger.error('Failed to send test notification', { error: (error as Error).message });
    return res.status(500).json({
      code: -1,
      msg: `Failed to send notification: ${(error as Error).message}`,
    });
  }
});

/**
 * Get bot commands list
 */
router.get('/commands', (_req: Request, res: Response) => {
  const commands = [
    { name: 'help', description: 'Show available commands' },
    { name: 'status', description: 'Show system health status' },
    { name: 'coaches', description: 'Show coach overview' },
    { name: 'sessions', description: "Show today's sessions" },
    { name: 'clients', description: 'Show client overview and recent signups' },
    { name: 'alerts', description: 'Show ML/Security alerts' },
    { name: 'revenue', description: 'Show daily MRR summary' },
  ];

  return res.json({
    prefix: '/upcoach',
    commands,
  });
});

// ============================================================================
// Widget Data Endpoints (for Admin Panel)
// ============================================================================

/**
 * Get coach pipeline data for widget
 */
router.get('/widgets/coach-pipeline', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database queries
    // In production, this would query the Coach model and aggregate data
    const now = new Date();

    const data: CoachPipelineData = {
      totalCoaches: 42,
      activeCoaches: 38,
      pendingOnboarding: 4,
      avgRating: 4.7,
      byStatus: {
        active: 38,
        pending_onboarding: 4,
        inactive: 3,
        suspended: 0,
      },
      recentSignups: [
        {
          id: 'coach-001',
          name: 'Sarah Johnson',
          specialization: 'Career Coaching',
          signupDate: new Date(now.getTime() - 2 * 60 * 60000),
          status: 'pending_onboarding',
        },
        {
          id: 'coach-002',
          name: 'Michael Chen',
          specialization: 'Life Coaching',
          signupDate: new Date(now.getTime() - 24 * 60 * 60000),
          status: 'active',
        },
        {
          id: 'coach-003',
          name: 'Emily Davis',
          specialization: 'Fitness Coaching',
          signupDate: new Date(now.getTime() - 48 * 60 * 60000),
          status: 'active',
        },
      ],
    };

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch coach pipeline data', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch coach pipeline data',
    });
  }
});

/**
 * Get support ticket data for widget
 */
router.get('/widgets/support-tickets', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database/Lark Base queries
    const now = new Date();

    const data: SupportTicketData = {
      total: 156,
      open: 12,
      averageResolutionTime: 4.5 * 60 * 60 * 1000, // 4.5 hours in ms
      byPriority: {
        low: 45,
        medium: 78,
        high: 28,
        urgent: 5,
      },
      recentTickets: [
        {
          id: 'ticket-001',
          subject: 'Unable to connect with coach',
          clientName: 'John Doe',
          priority: 'high',
          status: 'open',
          createdAt: new Date(now.getTime() - 30 * 60000),
        },
        {
          id: 'ticket-002',
          subject: 'Payment not processed',
          clientName: 'Jane Smith',
          priority: 'urgent',
          status: 'open',
          createdAt: new Date(now.getTime() - 2 * 60 * 60000),
        },
        {
          id: 'ticket-003',
          subject: 'Feature request: Dark mode',
          clientName: 'Bob Wilson',
          priority: 'low',
          status: 'open',
          createdAt: new Date(now.getTime() - 5 * 60 * 60000),
        },
      ],
    };

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch support ticket data', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support ticket data',
    });
  }
});

/**
 * Get payout data for widget
 */
router.get('/widgets/payouts', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database/Lark Base queries
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const data: PayoutData = {
      totalPending: 12500,
      totalPaidThisMonth: 45000,
      pendingCount: 8,
      byStatus: {
        pending: 8,
        approved: 3,
        paid: 42,
        rejected: 1,
      },
      recentPayouts: [
        {
          id: 'payout-001',
          coachName: 'Sarah Johnson',
          amount: 2500,
          status: 'pending',
          periodStart,
          periodEnd,
        },
        {
          id: 'payout-002',
          coachName: 'Michael Chen',
          amount: 3200,
          status: 'approved',
          periodStart,
          periodEnd,
        },
        {
          id: 'payout-003',
          coachName: 'Emily Davis',
          amount: 1800,
          status: 'paid',
          periodStart,
          periodEnd,
        },
      ],
    };

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch payout data', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payout data',
    });
  }
});

/**
 * Get session data for widget
 */
router.get('/widgets/sessions', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database queries
    const now = new Date();

    const data: SessionData = {
      todaySessions: 28,
      completedToday: 15,
      noShowCount: 2,
      upcomingSessions: [
        {
          coachName: 'Sarah Johnson',
          clientName: 'John Doe',
          startTime: new Date(now.getTime() + 30 * 60000),
          type: 'Career',
        },
        {
          coachName: 'Michael Chen',
          clientName: 'Jane Smith',
          startTime: new Date(now.getTime() + 60 * 60000),
          type: 'Life',
        },
        {
          coachName: 'Emily Davis',
          clientName: 'Bob Wilson',
          startTime: new Date(now.getTime() + 90 * 60000),
          type: 'Fitness',
        },
      ],
    };

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch session data', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch session data',
    });
  }
});

/**
 * Get activity feed for widget
 */
router.get('/widgets/activity', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual activity log queries
    const now = new Date();

    const activities: ActivityItem[] = [
      {
        id: 'activity-001',
        type: 'coach_signup',
        message: 'New coach signed up: Sarah Johnson',
        level: 'success',
        timestamp: new Date(now.getTime() - 5 * 60000),
        metadata: { entity: 'Coach', coachId: 'coach-001' },
      },
      {
        id: 'activity-002',
        type: 'ticket_created',
        message: 'Support ticket opened by John Doe',
        level: 'warning',
        timestamp: new Date(now.getTime() - 30 * 60000),
        metadata: { entity: 'Ticket', ticketId: 'ticket-001' },
      },
      {
        id: 'activity-003',
        type: 'payout_approved',
        message: 'Payout approved for Michael Chen ($3,200)',
        level: 'success',
        timestamp: new Date(now.getTime() - 60 * 60000),
        metadata: { entity: 'Payout', payoutId: 'payout-002' },
      },
      {
        id: 'activity-004',
        type: 'session_completed',
        message: 'Session completed: Emily Davis with Bob Wilson',
        level: 'info',
        timestamp: new Date(now.getTime() - 2 * 60 * 60000),
        metadata: { entity: 'Session', sessionId: 'session-001' },
      },
      {
        id: 'activity-005',
        type: 'sync_completed',
        message: 'Lark sync completed: 15 records updated',
        level: 'info',
        timestamp: new Date(now.getTime() - 3 * 60 * 60000),
        metadata: { entity: 'Sync', syncId: 'sync-001' },
      },
    ];

    return res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Failed to fetch activity feed', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
    });
  }
});

/**
 * Get sync status for widget
 */
router.get('/widgets/sync-status', async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual sync status from SyncEngine
    const data: SyncStatus = {
      lastSyncTime: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      recordsSynced: 156,
      pendingChanges: 3,
      errors: 0,
      isHealthy: true,
    };

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch sync status', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sync status',
    });
  }
});

/**
 * Trigger manual sync
 */
router.post('/widgets/sync', async (_req: Request, res: Response) => {
  if (!isLarkConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Lark integration not configured',
    });
  }

  try {
    // TODO: Trigger actual sync via SyncEngine
    logger.info('Manual sync triggered');

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return res.json({
      success: true,
      message: 'Sync completed successfully',
      recordsSynced: 12,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to trigger sync', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
    });
  }
});

export default router;
