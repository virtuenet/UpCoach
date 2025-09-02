interface MarketingEvent {
    userId: string;
    event: string;
    properties?: Record<string, any>;
    timestamp?: Date;
}
export declare class MarketingAutomationService {
    private campaigns;
    private segmentEngine;
    private contentPersonalizer;
    constructor();
    private initializeDefaultCampaigns;
    trackEvent(event: MarketingEvent): Promise<void>;
    private processCampaignTriggers;
    private scheduleCampaignDelivery;
    private matchesAudience;
    private sendToMixpanel;
    private sendToGA4;
    private sendToSegment;
    private matchesConditions;
    private selectABTestVariant;
    private matchesBehavior;
    private scheduleDelivery;
    private deliverCampaign;
}
export declare const marketingAutomation: MarketingAutomationService;
export {};
//# sourceMappingURL=MarketingAutomation.d.ts.map