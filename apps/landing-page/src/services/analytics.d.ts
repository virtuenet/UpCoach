export declare const GA_EVENTS: {
    readonly NEWSLETTER_SIGNUP: "newsletter_signup";
    readonly CONTACT_FORM_SUBMIT: "contact_form_submission";
    readonly LEAD_CAPTURE: "lead_capture";
    readonly CTA_CLICK: "cta_click";
    readonly NAVIGATION_CLICK: "navigation_click";
    readonly SOCIAL_LINK_CLICK: "social_link_click";
    readonly VIDEO_PLAY: "video_play";
    readonly DEMO_INTERACTION: "demo_interaction";
    readonly FAQ_EXPAND: "faq_expand";
    readonly APP_DOWNLOAD_CLICK: "app_download_click";
    readonly PRICING_VIEW: "pricing_view";
    readonly PLAN_SELECT: "plan_select";
    readonly WEB_VITALS: "web_vitals";
    readonly PAGE_VIEW: "page_view";
};
export declare const pageview: (url: string) => void;
export declare const event: (action: string, parameters?: Record<string, any>) => void;
export declare const trackEvent: (action: string, parameters?: Record<string, any>) => void;
export declare const trackNewsletterSignup: (source: string) => void;
export declare const trackContactForm: (formType: string) => void;
export declare const trackLeadCapture: (trigger: string) => void;
export declare const trackCTAClick: (ctaName: string, location: string) => void;
export declare const trackAppDownload: (platform: "ios" | "android", location: string) => void;
export declare const trackDemoInteraction: (feature: string, action: string) => void;
export declare const trackPricingView: () => void;
export declare const trackPlanSelect: (plan: string, billing: "monthly" | "annual") => void;
export declare const trackWebVitals: (metric: {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
}) => void;
export declare const trackFAQExpand: (question: string) => void;
export declare const trackSocialClick: (platform: string) => void;
export declare const trackEcommerceEvent: (eventName: string, parameters: {
    currency?: string;
    value?: number;
    items?: Array<{
        item_id: string;
        item_name: string;
        price: number;
        quantity?: number;
    }>;
}) => void;
export declare const setUserProperties: (properties: Record<string, any>) => void;
export declare const setCustomDimension: (name: string, value: string) => void;
export declare const trackFormSubmit: (formName: string, source: string) => void;
export declare const trackModalView: (modalName: string, trigger: string) => void;
//# sourceMappingURL=analytics.d.ts.map