/**
 * Real-time Service for Admin Panel
 *
 * Provides methods to interact with the real-time API endpoints
 * for predictions, streaming, engagement, and safety monitoring.
 */

import { apiClient } from './api';

// ============================================================================
// Types
// ============================================================================

export interface EngagementMetrics {
  activeUsers: number;
  activeSessions: number;
  avgSessionDuration: number;
  peakConcurrentUsers: number;
  messagesSent: number;
  aiResponsesGenerated: number;
  goalsInProgress: number;
  habitsTrackedToday: number;
  churnRiskUsers: number;
  engagementScore: number;
}

export interface ActiveUser {
  userId: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  lastActivity: number;
  currentPage?: string;
  sessionDuration: number;
  actionsCount: number;
  metadata?: Record<string, unknown>;
}

export interface ChurnAlert {
  id: string;
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: string[];
  detectedAt: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export interface SafetyDetection {
  id: string;
  contentId: string;
  userId: string;
  content: string;
  source: string;
  detectedAt: number;
  category: string;
  severity: string;
  confidence: number;
  matchedRules: string[];
  action: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewOutcome?: string;
  notes?: string;
}

export interface SafetyStats {
  totalChecks: number;
  detectionsByCategory: Record<string, number>;
  detectionsBySeverity: Record<string, number>;
  actionsTaken: Record<string, number>;
  falsePositiveRate: number;
  averageProcessingTimeMs: number;
  activeEscalations: number;
}

export interface SafetyEscalation {
  id: string;
  detectionId: string;
  userId: string;
  category: string;
  severity: string;
  content: string;
  createdAt: number;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: number;
}

export interface SafetyRule {
  id: string;
  name: string;
  category: string;
  severity: string;
  patterns: string[];
  keywords: string[];
  action: string;
  autoResponse?: string;
  escalationTarget?: string;
  enabled: boolean;
}

export interface StreamStats {
  totalStreamsCreated: number;
  activeStreams: number;
  totalTokensStreamed: number;
  averageLatencyToFirstToken: number;
  streamsByProvider: Record<string, number>;
  streamsByStatus: Record<string, number>;
}

export interface PredictionStats {
  totalPredictions: number;
  cacheHitRate: number;
  averageLatencyMs: number;
  modelsCached: number;
  p95LatencyMs: number;
  predictionsByType: Record<string, number>;
}

export interface EventStats {
  eventBus: {
    publishedEvents: number;
    processedEvents: number;
    failedEvents: number;
    subscriptionCount: number;
    eventsPerSecond: number;
    deadLetterQueueSize: number;
  };
  eventStore: {
    totalEvents: number;
    streamCount: number;
    snapshotCount: number;
    averageEventsPerStream: number;
  };
}

export interface RealtimeHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    predictions: { status: string; modelsCached: number };
    streaming: { status: string; activeStreams: number };
    safety: { status: string; totalChecks: number };
    engagement: { status: string; activeUsers: number };
  };
  timestamp: number;
}

// ============================================================================
// API Methods
// ============================================================================

export const realtimeService = {
  // Engagement Monitoring
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    const response = await apiClient.get('/api/realtime/engagement/metrics');
    return response.data.data;
  },

  async getActiveUsers(status?: string, limit?: number): Promise<ActiveUser[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (limit) params.set('limit', limit.toString());
    const response = await apiClient.get(`/api/realtime/engagement/users?${params}`);
    return response.data.data;
  },

  async getChurnAlerts(includeAcknowledged = false): Promise<ChurnAlert[]> {
    const response = await apiClient.get(
      `/api/realtime/engagement/churn-alerts?includeAcknowledged=${includeAcknowledged}`
    );
    return response.data.data;
  },

  async acknowledgeChurnAlert(alertId: string): Promise<void> {
    await apiClient.post(`/api/realtime/engagement/churn-alerts/${alertId}/acknowledge`);
  },

  // Safety Detection
  async getSafetyStats(): Promise<SafetyStats> {
    const response = await apiClient.get('/api/realtime/safety/stats');
    return response.data.data;
  },

  async getSafetyDetections(options?: {
    userId?: string;
    category?: string;
    severity?: string;
    reviewed?: boolean;
    limit?: number;
  }): Promise<SafetyDetection[]> {
    const params = new URLSearchParams();
    if (options?.userId) params.set('userId', options.userId);
    if (options?.category) params.set('category', options.category);
    if (options?.severity) params.set('severity', options.severity);
    if (options?.reviewed !== undefined) params.set('reviewed', options.reviewed.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    const response = await apiClient.get(`/api/realtime/safety/detections?${params}`);
    return response.data.data;
  },

  async reviewDetection(
    detectionId: string,
    outcome: 'confirmed' | 'false_positive' | 'adjusted',
    notes?: string
  ): Promise<void> {
    await apiClient.post(`/api/realtime/safety/detections/${detectionId}/review`, {
      outcome,
      notes,
    });
  },

  async getEscalations(): Promise<SafetyEscalation[]> {
    const response = await apiClient.get('/api/realtime/safety/escalations');
    return response.data.data;
  },

  async resolveEscalation(
    escalationId: string,
    resolution: string,
    dismiss = false
  ): Promise<void> {
    await apiClient.post(`/api/realtime/safety/escalations/${escalationId}/resolve`, {
      resolution,
      dismiss,
    });
  },

  async getSafetyRules(): Promise<SafetyRule[]> {
    const response = await apiClient.get('/api/realtime/safety/rules');
    return response.data.data;
  },

  // Streaming
  async getStreamStats(): Promise<StreamStats> {
    const response = await apiClient.get('/api/realtime/stream/stats');
    return response.data.data;
  },

  // Predictions
  async getPredictionStats(): Promise<PredictionStats> {
    const response = await apiClient.get('/api/realtime/predictions/stats');
    return response.data.data;
  },

  // Events
  async getEventStats(): Promise<EventStats> {
    const response = await apiClient.get('/api/realtime/events/stats');
    return response.data.data;
  },

  async getDeadLetterQueue(): Promise<unknown[]> {
    const response = await apiClient.get('/api/realtime/events/dead-letter');
    return response.data.data;
  },

  // Health Check
  async getHealth(): Promise<RealtimeHealth> {
    const response = await apiClient.get('/api/realtime/health');
    return response.data;
  },
};

export default realtimeService;
