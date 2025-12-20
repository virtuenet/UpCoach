/**
 * Real-time WebSocket Handlers
 *
 * Integrates all real-time services with WebSocket connections for live updates.
 * Handles subscriptions, broadcasting, and client management.
 *
 * Features:
 * - Prediction subscriptions (churn, engagement, goals)
 * - Live engagement monitoring subscriptions
 * - AI streaming integration
 * - Safety alert broadcasts
 * - Event bus integration for cross-service communication
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { eventBus, Event } from '../events/EventBus';
import { realtimePredictionService, PredictionType, PredictionResult } from './RealtimePredictionService';
import { liveEngagementMonitor, EngagementMetrics, ChurnRiskAlert } from './LiveEngagementMonitor';
import { streamingAIService, StreamChunk, StreamResult } from './StreamingAIService';
import { realtimeSafetyDetection, SafetyDetection } from './RealtimeSafetyDetection';
import logger from '../../utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ClientSubscription {
  id: string;
  type: SubscriptionType;
  userId: string;
  socketId: string;
  filters?: Record<string, unknown>;
  createdAt: number;
}

export type SubscriptionType =
  | 'predictions'
  | 'engagement'
  | 'ai_stream'
  | 'safety_alerts'
  | 'metrics'
  | 'user_activity';

export interface RealtimeMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  correlationId?: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  roles?: string[];
}

interface HandlerStats {
  connectedClients: number;
  subscriptionsByType: Record<SubscriptionType, number>;
  messagesDelivered: number;
  messagesFailed: number;
  averageLatencyMs: number;
}

// ============================================================================
// WebSocket Handlers Implementation
// ============================================================================

export class RealtimeWebSocketHandlers {
  private static instance: RealtimeWebSocketHandlers;

  private io: SocketServer | null = null;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private clientSubscriptions: Map<string, Set<string>> = new Map(); // socketId -> subscription IDs
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socket IDs

  // Service subscription IDs for cleanup
  private predictionSubscriptions: Map<string, string> = new Map();
  private engagementSubscriptions: Map<string, string> = new Map();
  private streamCallbacks: Map<string, (chunk: StreamChunk) => void> = new Map();

  // Statistics
  private stats: HandlerStats = {
    connectedClients: 0,
    subscriptionsByType: {} as Record<SubscriptionType, number>,
    messagesDelivered: 0,
    messagesFailed: 0,
    averageLatencyMs: 0,
  };
  private deliveryLatencies: number[] = [];

  private initialized = false;

  private constructor() {}

  public static getInstance(): RealtimeWebSocketHandlers {
    if (!RealtimeWebSocketHandlers.instance) {
      RealtimeWebSocketHandlers.instance = new RealtimeWebSocketHandlers();
    }
    return RealtimeWebSocketHandlers.instance;
  }

  /**
   * Initialize handlers with Socket.IO server
   */
  async initialize(io: SocketServer): Promise<void> {
    if (this.initialized) return;

    this.io = io;

    // Set up connection handling
    io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    // Subscribe to global events
    await this.subscribeToGlobalEvents();

    this.initialized = true;
    logger.info('[RealtimeWS] WebSocket handlers initialized');
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    const socketId = socket.id;

    this.stats.connectedClients++;

    // Track user sockets
    if (userId) {
      const userSocketSet = this.userSockets.get(userId) || new Set();
      userSocketSet.add(socketId);
      this.userSockets.set(userId, userSocketSet);
    }

    // Initialize subscription tracking for this client
    this.clientSubscriptions.set(socketId, new Set());

    logger.info(`[RealtimeWS] Client connected: ${socketId}, user: ${userId}`);

    // Register event handlers
    this.registerSocketHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Send connection confirmation
    socket.emit('realtime:connected', {
      socketId,
      timestamp: Date.now(),
      serverVersion: '1.0.0',
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    const socketId = socket.id;

    this.stats.connectedClients--;

    // Clean up user socket tracking
    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    // Clean up all subscriptions for this client
    const subscriptionIds = this.clientSubscriptions.get(socketId);
    if (subscriptionIds) {
      for (const subId of subscriptionIds) {
        this.removeSubscription(subId);
      }
    }
    this.clientSubscriptions.delete(socketId);

    logger.info(`[RealtimeWS] Client disconnected: ${socketId}`);
  }

  /**
   * Register all socket event handlers
   */
  private registerSocketHandlers(socket: AuthenticatedSocket): void {
    const userId = socket.userId;

    // Prediction subscriptions
    socket.on('subscribe:predictions', (data: { types: PredictionType[] }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      this.handlePredictionSubscription(socket, userId, data.types);
    });

    socket.on('unsubscribe:predictions', () => {
      this.handlePredictionUnsubscription(socket);
    });

    // Request immediate prediction
    socket.on('request:prediction', async (data: { type: PredictionType; input?: unknown }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      await this.handlePredictionRequest(socket, userId, data);
    });

    // Engagement monitoring subscriptions (admin only)
    socket.on('subscribe:engagement', (data: { filters?: Record<string, unknown> }) => {
      if (!this.isAdmin(socket)) {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }
      this.handleEngagementSubscription(socket, data.filters);
    });

    socket.on('unsubscribe:engagement', () => {
      this.handleEngagementUnsubscription(socket);
    });

    // AI streaming
    socket.on('stream:start', async (data: { prompt: string; options?: Record<string, unknown> }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      await this.handleStreamStart(socket, userId, data);
    });

    socket.on('stream:cancel', (data: { streamId: string }) => {
      this.handleStreamCancel(socket, data.streamId);
    });

    // Safety alerts subscription (admin only)
    socket.on('subscribe:safety', () => {
      if (!this.isAdmin(socket)) {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }
      this.handleSafetySubscription(socket);
    });

    socket.on('unsubscribe:safety', () => {
      this.handleSafetyUnsubscription(socket);
    });

    // Metrics subscription (admin only)
    socket.on('subscribe:metrics', () => {
      if (!this.isAdmin(socket)) {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }
      this.handleMetricsSubscription(socket);
    });

    // User activity tracking
    socket.on('activity:heartbeat', (data: { activity: string; metadata?: Record<string, unknown> }) => {
      if (userId) {
        this.handleActivityHeartbeat(userId, socket.id, data);
      }
    });
  }

  // ============================================================================
  // Prediction Handlers
  // ============================================================================

  private handlePredictionSubscription(
    socket: AuthenticatedSocket,
    userId: string,
    types: PredictionType[]
  ): void {
    const subscriptionId = uuidv4();

    // Subscribe to prediction service
    const serviceSubId = realtimePredictionService.subscribe(
      userId,
      types,
      (result: PredictionResult) => {
        this.sendToSocket(socket, 'prediction:update', result);
      }
    );

    // Track subscription
    const subscription: ClientSubscription = {
      id: subscriptionId,
      type: 'predictions',
      userId,
      socketId: socket.id,
      filters: { types },
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.clientSubscriptions.get(socket.id)?.add(subscriptionId);
    this.predictionSubscriptions.set(socket.id, serviceSubId);
    this.updateSubscriptionStats('predictions', 1);

    socket.emit('subscribed:predictions', {
      subscriptionId,
      types,
      timestamp: Date.now(),
    });

    logger.debug(`[RealtimeWS] Prediction subscription created: ${subscriptionId} for user ${userId}`);
  }

  private handlePredictionUnsubscription(socket: AuthenticatedSocket): void {
    const serviceSubId = this.predictionSubscriptions.get(socket.id);
    if (serviceSubId) {
      realtimePredictionService.unsubscribe(serviceSubId);
      this.predictionSubscriptions.delete(socket.id);
    }

    // Remove tracking
    const clientSubs = this.clientSubscriptions.get(socket.id);
    if (clientSubs) {
      for (const subId of clientSubs) {
        const sub = this.subscriptions.get(subId);
        if (sub?.type === 'predictions') {
          this.subscriptions.delete(subId);
          this.updateSubscriptionStats('predictions', -1);
        }
      }
    }

    socket.emit('unsubscribed:predictions', { timestamp: Date.now() });
  }

  private async handlePredictionRequest(
    socket: AuthenticatedSocket,
    userId: string,
    data: { type: PredictionType; input?: unknown }
  ): Promise<void> {
    try {
      const result = await realtimePredictionService.predict(
        data.type,
        userId,
        data.input || {}
      );

      this.sendToSocket(socket, 'prediction:result', {
        type: data.type,
        result,
        timestamp: Date.now(),
      });
    } catch (error) {
      socket.emit('prediction:error', {
        type: data.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  // ============================================================================
  // Engagement Monitoring Handlers
  // ============================================================================

  private handleEngagementSubscription(
    socket: AuthenticatedSocket,
    filters?: Record<string, unknown>
  ): void {
    const subscriptionId = uuidv4();

    // Subscribe to all engagement update types
    const metricsSubId = liveEngagementMonitor.subscribe(
      'metrics',
      (metrics: EngagementMetrics) => {
        this.sendToSocket(socket, 'engagement:metrics', metrics);
      },
      filters
    );

    const alertsSubId = liveEngagementMonitor.subscribe(
      'churn_alert',
      (alert: ChurnRiskAlert) => {
        this.sendToSocket(socket, 'engagement:churn_alert', alert);
      },
      filters
    );

    // Store subscriptions for cleanup
    this.engagementSubscriptions.set(`${socket.id}:metrics`, metricsSubId);
    this.engagementSubscriptions.set(`${socket.id}:alerts`, alertsSubId);

    const subscription: ClientSubscription = {
      id: subscriptionId,
      type: 'engagement',
      userId: socket.userId || 'admin',
      socketId: socket.id,
      filters,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.clientSubscriptions.get(socket.id)?.add(subscriptionId);
    this.updateSubscriptionStats('engagement', 1);

    // Send current state
    socket.emit('subscribed:engagement', {
      subscriptionId,
      currentMetrics: liveEngagementMonitor.getCurrentMetrics(),
      activeUsers: liveEngagementMonitor.getActiveUsers().length,
      activeSessions: liveEngagementMonitor.getActiveSessions().length,
      churnAlerts: liveEngagementMonitor.getChurnAlerts().length,
      timestamp: Date.now(),
    });

    logger.debug(`[RealtimeWS] Engagement subscription created: ${subscriptionId}`);
  }

  private handleEngagementUnsubscription(socket: AuthenticatedSocket): void {
    // Unsubscribe from service
    const metricsSubId = this.engagementSubscriptions.get(`${socket.id}:metrics`);
    const alertsSubId = this.engagementSubscriptions.get(`${socket.id}:alerts`);

    if (metricsSubId) liveEngagementMonitor.unsubscribe(metricsSubId);
    if (alertsSubId) liveEngagementMonitor.unsubscribe(alertsSubId);

    this.engagementSubscriptions.delete(`${socket.id}:metrics`);
    this.engagementSubscriptions.delete(`${socket.id}:alerts`);

    // Remove tracking
    const clientSubs = this.clientSubscriptions.get(socket.id);
    if (clientSubs) {
      for (const subId of clientSubs) {
        const sub = this.subscriptions.get(subId);
        if (sub?.type === 'engagement') {
          this.subscriptions.delete(subId);
          this.updateSubscriptionStats('engagement', -1);
        }
      }
    }

    socket.emit('unsubscribed:engagement', { timestamp: Date.now() });
  }

  // ============================================================================
  // AI Streaming Handlers
  // ============================================================================

  private async handleStreamStart(
    socket: AuthenticatedSocket,
    userId: string,
    data: { prompt: string; options?: Record<string, unknown> }
  ): Promise<void> {
    try {
      // Create stream
      const streamId = await streamingAIService.createStream({
        userId,
        prompt: data.prompt,
        options: data.options as any,
      });

      // Create callback for this stream
      const callback = (chunk: StreamChunk) => {
        this.sendToSocket(socket, 'stream:chunk', {
          streamId,
          chunk,
        });
      };

      this.streamCallbacks.set(streamId, callback);

      // Start streaming to callback
      await streamingAIService.streamToCallback(
        streamId,
        callback,
        (result: StreamResult) => {
          this.sendToSocket(socket, 'stream:complete', {
            streamId,
            content: result.content,
            metrics: result.metrics,
            safetyFlags: result.safetyFlags,
          });
          this.streamCallbacks.delete(streamId);
        },
        (error: Error) => {
          socket.emit('stream:error', {
            streamId,
            error: error.message,
            timestamp: Date.now(),
          });
          this.streamCallbacks.delete(streamId);
        }
      );

      socket.emit('stream:started', {
        streamId,
        timestamp: Date.now(),
      });
    } catch (error) {
      socket.emit('stream:error', {
        error: error instanceof Error ? error.message : 'Failed to start stream',
        timestamp: Date.now(),
      });
    }
  }

  private handleStreamCancel(socket: AuthenticatedSocket, streamId: string): void {
    streamingAIService.cancelStream(streamId, 'User cancelled');
    this.streamCallbacks.delete(streamId);

    socket.emit('stream:cancelled', {
      streamId,
      timestamp: Date.now(),
    });
  }

  // ============================================================================
  // Safety Alert Handlers
  // ============================================================================

  private handleSafetySubscription(socket: AuthenticatedSocket): void {
    const subscriptionId = uuidv4();

    // Register for safety detection events
    const safetyHandler = (data: { userId: string; detections: SafetyDetection[] }) => {
      this.sendToSocket(socket, 'safety:detection', data);
    };

    realtimeSafetyDetection.on('safetyDetection', safetyHandler);

    // Store handler for cleanup
    (socket as any)._safetyHandler = safetyHandler;

    const subscription: ClientSubscription = {
      id: subscriptionId,
      type: 'safety_alerts',
      userId: socket.userId || 'admin',
      socketId: socket.id,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.clientSubscriptions.get(socket.id)?.add(subscriptionId);
    this.updateSubscriptionStats('safety_alerts', 1);

    socket.emit('subscribed:safety', {
      subscriptionId,
      unreviewedCount: realtimeSafetyDetection.getUnreviewedDetections().length,
      escalationCount: realtimeSafetyDetection.getOpenEscalations().length,
      timestamp: Date.now(),
    });
  }

  private handleSafetyUnsubscription(socket: AuthenticatedSocket): void {
    const handler = (socket as any)._safetyHandler;
    if (handler) {
      realtimeSafetyDetection.off('safetyDetection', handler);
    }

    // Remove tracking
    const clientSubs = this.clientSubscriptions.get(socket.id);
    if (clientSubs) {
      for (const subId of clientSubs) {
        const sub = this.subscriptions.get(subId);
        if (sub?.type === 'safety_alerts') {
          this.subscriptions.delete(subId);
          this.updateSubscriptionStats('safety_alerts', -1);
        }
      }
    }

    socket.emit('unsubscribed:safety', { timestamp: Date.now() });
  }

  // ============================================================================
  // Metrics Subscription
  // ============================================================================

  private handleMetricsSubscription(socket: AuthenticatedSocket): void {
    const subscriptionId = uuidv4();

    const subscription: ClientSubscription = {
      id: subscriptionId,
      type: 'metrics',
      userId: socket.userId || 'admin',
      socketId: socket.id,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.clientSubscriptions.get(socket.id)?.add(subscriptionId);
    this.updateSubscriptionStats('metrics', 1);

    // Send initial metrics
    socket.emit('subscribed:metrics', {
      subscriptionId,
      initialMetrics: this.getAggregatedMetrics(),
      timestamp: Date.now(),
    });

    // Set up periodic metrics push (every 5 seconds)
    const metricsInterval = setInterval(() => {
      if (socket.connected) {
        this.sendToSocket(socket, 'metrics:update', this.getAggregatedMetrics());
      } else {
        clearInterval(metricsInterval);
      }
    }, 5000);

    (socket as any)._metricsInterval = metricsInterval;
  }

  // ============================================================================
  // Activity Tracking
  // ============================================================================

  private handleActivityHeartbeat(
    userId: string,
    socketId: string,
    data: { activity: string; metadata?: Record<string, unknown> }
  ): void {
    // Track activity in engagement monitor
    liveEngagementMonitor.trackActivity({
      userId,
      type: data.activity as any,
      timestamp: Date.now(),
      metadata: {
        ...data.metadata,
        socketId,
      },
    });
  }

  // ============================================================================
  // Global Event Subscriptions
  // ============================================================================

  private async subscribeToGlobalEvents(): Promise<void> {
    // Subscribe to high-priority events that need broadcasting
    await eventBus.subscribe('safety.alert.*', async (event: Event) => {
      this.broadcastToAdmins('safety:alert', event.payload);
    });

    await eventBus.subscribe('engagement.churn.*', async (event: Event) => {
      this.broadcastToAdmins('engagement:churn', event.payload);
    });

    await eventBus.subscribe('system.alert.*', async (event: Event) => {
      this.broadcastToAdmins('system:alert', event.payload);
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private sendToSocket(socket: Socket, event: string, data: unknown): void {
    const startTime = Date.now();

    try {
      socket.emit(event, {
        ...data as object,
        _sentAt: startTime,
      });

      this.stats.messagesDelivered++;
      this.updateDeliveryLatency(Date.now() - startTime);
    } catch (error) {
      this.stats.messagesFailed++;
      logger.error(`[RealtimeWS] Failed to send to socket ${socket.id}: ${error}`);
    }
  }

  private broadcastToAdmins(event: string, data: unknown): void {
    if (!this.io) return;

    for (const [, subscription] of this.subscriptions) {
      if (subscription.type === 'safety_alerts' || subscription.type === 'metrics') {
        const socket = this.io.sockets.sockets.get(subscription.socketId);
        if (socket) {
          this.sendToSocket(socket, event, data);
        }
      }
    }
  }

  private broadcastToUser(userId: string, event: string, data: unknown): void {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || !this.io) return;

    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        this.sendToSocket(socket, event, data);
      }
    }
  }

  private isAdmin(socket: AuthenticatedSocket): boolean {
    return socket.roles?.includes('admin') || socket.roles?.includes('super_admin') || false;
  }

  private removeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);
    this.updateSubscriptionStats(subscription.type, -1);
  }

  private updateSubscriptionStats(type: SubscriptionType, delta: number): void {
    this.stats.subscriptionsByType[type] = (this.stats.subscriptionsByType[type] || 0) + delta;
  }

  private updateDeliveryLatency(latencyMs: number): void {
    this.deliveryLatencies.push(latencyMs);
    if (this.deliveryLatencies.length > 1000) {
      this.deliveryLatencies.shift();
    }
    this.stats.averageLatencyMs =
      this.deliveryLatencies.reduce((a, b) => a + b, 0) / this.deliveryLatencies.length;
  }

  private getAggregatedMetrics(): Record<string, unknown> {
    return {
      websocket: this.getStats(),
      predictions: realtimePredictionService.getStats(),
      engagement: liveEngagementMonitor.getCurrentMetrics(),
      streaming: streamingAIService.getStats(),
      safety: realtimeSafetyDetection.getStats(),
      timestamp: Date.now(),
    };
  }

  // ============================================================================
  // Public Query Methods
  // ============================================================================

  /**
   * Get handler statistics
   */
  getStats(): HandlerStats {
    return { ...this.stats };
  }

  /**
   * Get active subscriptions count by type
   */
  getSubscriptionCounts(): Record<SubscriptionType, number> {
    return { ...this.stats.subscriptionsByType };
  }

  /**
   * Get connected clients for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Broadcast message to specific user
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    this.broadcastToUser(userId, event, data);
  }

  /**
   * Broadcast message to all admins
   */
  sendToAdmins(event: string, data: unknown): void {
    this.broadcastToAdmins(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, {
      ...data as object,
      _sentAt: Date.now(),
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const realtimeWebSocketHandlers = RealtimeWebSocketHandlers.getInstance();

export function createRealtimeWebSocketHandlers(): RealtimeWebSocketHandlers {
  return RealtimeWebSocketHandlers.getInstance();
}
