import { Request } from 'express';
interface TrackingEvent {
    userId?: number;
    anonymousId?: string;
    event: string;
    properties?: Record<string, any>;
    context?: Record<string, any>;
    timestamp?: Date;
}
interface UserTraits {
    userId: number;
    email?: string;
    name?: string;
    plan?: string;
    role?: string;
    createdAt?: Date;
    lastLogin?: Date;
    customTraits?: Record<string, any>;
}
export declare class AnalyticsService {
    private mixpanelToken;
    private googleAnalyticsId;
    private segmentWriteKey?;
    private amplitudeApiKey?;
    private batchQueue;
    private batchInterval;
    constructor();
    track(event: TrackingEvent): Promise<void>;
    identify(traits: UserTraits): Promise<void>;
    trackPageView(req: Request, pagePath: string, pageTitle?: string): Promise<void>;
    trackUserAction(userId: number, action: string, properties?: Record<string, any>): Promise<void>;
    trackConversion(userId: number, conversionType: string, value?: number, currency?: string, properties?: Record<string, any>): Promise<void>;
    trackRevenue(userId: number, amount: number, currency?: string, productId?: string, properties?: Record<string, any>): Promise<void>;
    trackError(error: Error, context?: Record<string, any>, userId?: number): Promise<void>;
    getUserAnalytics(userId: number): Promise<any>;
    private flushBatch;
    private sendToMixpanel;
    private sendToSegment;
    private sendToAmplitude;
    private sendGoogleAnalyticsConversion;
    private identifyMixpanel;
    private identifySegment;
    private identifyAmplitude;
    private isCriticalEvent;
    private sendRealTimeEvent;
    private extractCampaignParams;
    private getUserSessionCount;
    private getUserEventCount;
    private getUserLastActive;
    private calculateEngagementScore;
    private getUserSegment;
    destroy(): void;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=AnalyticsService.d.ts.map