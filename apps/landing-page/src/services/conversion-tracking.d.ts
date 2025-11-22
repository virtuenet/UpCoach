export declare enum ConversionType {
    SIGNUP = "signup",
    LEAD_CAPTURE = "lead_capture",
    NEWSLETTER = "newsletter",
    APP_DOWNLOAD = "app_download",
    PRICING_VIEW = "pricing_view",
    PLAN_SELECT = "plan_select",
    DEMO_WATCH = "demo_watch",
    CONTACT_FORM = "contact_form",
    FAQ_INTERACTION = "faq_interaction",
    SCROLL_DEPTH = "scroll_depth",
    TIME_ON_PAGE = "time_on_page"
}
export declare enum FunnelStage {
    AWARENESS = "awareness",
    INTEREST = "interest",
    CONSIDERATION = "consideration",
    INTENT = "intent",
    EVALUATION = "evaluation",
    PURCHASE = "purchase"
}
export declare const ConversionValues: Record<ConversionType, number>;
export declare function initializeConversionTracking(): void;
export declare function trackConversion(type: ConversionType, stage: FunnelStage, metadata?: Record<string, any>): void;
export declare function trackSignup(email: string, source?: string): void;
export declare function trackLeadCapture(formData: Record<string, any>): void;
export declare function trackNewsletterSignup(email: string): void;
export declare function trackAppDownload(platform: 'ios' | 'android'): void;
export declare function trackPricingView(): void;
export declare function trackPlanSelect(plan: string, price: string): void;
export declare function trackDemoWatch(duration: number): void;
export declare function trackContactForm(formData: Record<string, any>): void;
export declare function trackFAQInteraction(question: string): void;
export declare function getConversionRate(conversions: number, visitors: number): number;
export declare function calculateLTV(averageOrderValue: number, purchaseFrequency: number, customerLifespan: number): number;
export declare function getAttributionModel(): 'first-touch' | 'last-touch' | 'linear' | 'time-decay';
export declare function retryFailedConversions(): void;
//# sourceMappingURL=conversion-tracking.d.ts.map