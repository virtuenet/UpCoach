import { EventEmitter } from 'events';

export interface RealtimeMetrics {
  activeUsersNow: number;
  goalsCompletedToday: number;
  revenueToday: number;
  apiRequestsPerSecond: number;
  systemHealth: { apiResponseTime: number; databaseLatency: number; cacheHitRate: number; errorRate: number; };
}

export class EventStreamingService extends EventEmitter {
  private static instance: EventStreamingService;
  private metrics: RealtimeMetrics = {
    activeUsersNow: 0,
    goalsCompletedToday: 0,
    revenueToday: 0,
    apiRequestsPerSecond: 0,
    systemHealth: { apiResponseTime: 0, databaseLatency: 0, cacheHitRate: 0, errorRate: 0 },
  };

  private constructor() { super(); }

  static getInstance(): EventStreamingService {
    if (!EventStreamingService.instance) {
      EventStreamingService.instance = new EventStreamingService();
    }
    return EventStreamingService.instance;
  }

  async publishEvent(event: any): Promise<void> {
    this.emit('realtime:event', event);
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    return this.metrics;
  }

  updateMetrics(updates: Partial<RealtimeMetrics>): void {
    Object.assign(this.metrics, updates);
    this.emit('metrics:updated', this.metrics);
  }
}

export const eventStreamingService = EventStreamingService.getInstance();
