// Enhanced Conversion Tracking System
import { event } from './analytics';
import { trackExperimentConversion } from './experiments';
// Conversion types
export var ConversionType;
(function (ConversionType) {
    ConversionType["SIGNUP"] = "signup";
    ConversionType["LEAD_CAPTURE"] = "lead_capture";
    ConversionType["NEWSLETTER"] = "newsletter";
    ConversionType["APP_DOWNLOAD"] = "app_download";
    ConversionType["PRICING_VIEW"] = "pricing_view";
    ConversionType["PLAN_SELECT"] = "plan_select";
    ConversionType["DEMO_WATCH"] = "demo_watch";
    ConversionType["CONTACT_FORM"] = "contact_form";
    ConversionType["FAQ_INTERACTION"] = "faq_interaction";
    ConversionType["SCROLL_DEPTH"] = "scroll_depth";
    ConversionType["TIME_ON_PAGE"] = "time_on_page";
})(ConversionType || (ConversionType = {}));
// Conversion funnel stages
export var FunnelStage;
(function (FunnelStage) {
    FunnelStage["AWARENESS"] = "awareness";
    FunnelStage["INTEREST"] = "interest";
    FunnelStage["CONSIDERATION"] = "consideration";
    FunnelStage["INTENT"] = "intent";
    FunnelStage["EVALUATION"] = "evaluation";
    FunnelStage["PURCHASE"] = "purchase";
})(FunnelStage || (FunnelStage = {}));
// Conversion value calculator
export const ConversionValues = {
    [ConversionType.SIGNUP]: 100,
    [ConversionType.LEAD_CAPTURE]: 50,
    [ConversionType.NEWSLETTER]: 20,
    [ConversionType.APP_DOWNLOAD]: 80,
    [ConversionType.PRICING_VIEW]: 10,
    [ConversionType.PLAN_SELECT]: 60,
    [ConversionType.DEMO_WATCH]: 30,
    [ConversionType.CONTACT_FORM]: 40,
    [ConversionType.FAQ_INTERACTION]: 5,
    [ConversionType.SCROLL_DEPTH]: 2,
    [ConversionType.TIME_ON_PAGE]: 1,
};
// Session tracking
class SessionTracker {
    constructor() {
        this.pageViews = [];
        this.conversions = [];
        this.sessionId = this.getOrCreateSessionId();
        this.startTime = Date.now();
        this.trackPageView();
        this.setupEventListeners();
    }
    getOrCreateSessionId() {
        const key = 'upcoach_session_id';
        let sessionId = sessionStorage.getItem(key);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem(key, sessionId);
        }
        return sessionId;
    }
    trackPageView() {
        if (typeof window !== 'undefined') {
            this.pageViews.push(window.location.pathname);
        }
    }
    setupEventListeners() {
        if (typeof window === 'undefined')
            return;
        // Track scroll depth
        let maxScroll = 0;
        let scrollTracked = { 25: false, 50: false, 75: false, 90: false };
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                Object.entries(scrollTracked).forEach(([threshold, tracked]) => {
                    if (!tracked && scrollPercent >= parseInt(threshold)) {
                        scrollTracked[threshold] = true;
                        this.trackConversion(ConversionType.SCROLL_DEPTH, FunnelStage.INTEREST, {
                            scroll_depth: threshold,
                        });
                    }
                });
            }
        });
        // Track time on page
        const timeThresholds = [30, 60, 120, 300]; // seconds
        const timeTracked = new Set();
        setInterval(() => {
            const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
            timeThresholds.forEach(threshold => {
                if (!timeTracked.has(threshold) && timeOnPage >= threshold) {
                    timeTracked.add(threshold);
                    this.trackConversion(ConversionType.TIME_ON_PAGE, FunnelStage.INTEREST, {
                        time_on_page: threshold,
                    });
                }
            });
        }, 5000);
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.flushConversions();
        });
    }
    trackConversion(type, stage, metadata) {
        const conversion = {
            type,
            value: ConversionValues[type],
            funnel_stage: stage,
            source: this.getUTMParam('utm_source'),
            medium: this.getUTMParam('utm_medium'),
            campaign: this.getUTMParam('utm_campaign'),
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            session_id: this.sessionId,
            timestamp: Date.now(),
            metadata,
        };
        this.conversions.push(conversion);
        this.sendConversion(conversion);
    }
    getUTMParam(param) {
        if (typeof window === 'undefined')
            return undefined;
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param) || undefined;
    }
    sendConversion(conversion) {
        // Send to analytics
        event('conversion', conversion);
        // Send to experiments if applicable
        const activeExperiments = localStorage.getItem('upcoach_experiments');
        if (activeExperiments) {
            try {
                const experiments = JSON.parse(activeExperiments);
                Object.keys(experiments).forEach(experimentId => {
                    trackExperimentConversion(experimentId, conversion.type, conversion.value);
                });
            }
            catch (e) {
                console.error('Failed to track experiment conversion:', e);
            }
        }
        // Send to backend
        this.sendToBackend(conversion);
    }
    async sendToBackend(conversion) {
        try {
            await fetch('/api/conversions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(conversion),
            });
        }
        catch (error) {
            console.error('Failed to send conversion:', error);
            // Store failed conversions for retry
            this.storeFailedConversion(conversion);
        }
    }
    storeFailedConversion(conversion) {
        const key = 'upcoach_failed_conversions';
        const failed = localStorage.getItem(key);
        const conversions = failed ? JSON.parse(failed) : [];
        conversions.push(conversion);
        localStorage.setItem(key, JSON.stringify(conversions));
    }
    flushConversions() {
        // Send any remaining conversions
        if (this.conversions.length > 0) {
            navigator.sendBeacon('/api/conversions/batch', JSON.stringify(this.conversions));
        }
    }
    getSessionData() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews,
            conversions: this.conversions,
        };
    }
}
// Global session tracker instance
let sessionTracker = null;
// Initialize tracker
export function initializeConversionTracking() {
    if (typeof window !== 'undefined' && !sessionTracker) {
        sessionTracker = new SessionTracker();
    }
}
// Public API for tracking conversions
export function trackConversion(type, stage, metadata) {
    if (!sessionTracker) {
        initializeConversionTracking();
    }
    sessionTracker?.trackConversion(type, stage, metadata);
}
// Specific conversion tracking functions
export function trackSignup(email, source) {
    trackConversion(ConversionType.SIGNUP, FunnelStage.PURCHASE, {
        email,
        source,
    });
}
export function trackLeadCapture(formData) {
    trackConversion(ConversionType.LEAD_CAPTURE, FunnelStage.INTENT, {
        ...formData,
    });
}
export function trackNewsletterSignup(email) {
    trackConversion(ConversionType.NEWSLETTER, FunnelStage.INTEREST, {
        email,
    });
}
export function trackAppDownload(platform) {
    trackConversion(ConversionType.APP_DOWNLOAD, FunnelStage.PURCHASE, {
        platform,
    });
}
export function trackPricingView() {
    trackConversion(ConversionType.PRICING_VIEW, FunnelStage.CONSIDERATION);
}
export function trackPlanSelect(plan, price) {
    trackConversion(ConversionType.PLAN_SELECT, FunnelStage.EVALUATION, {
        plan,
        price,
    });
}
export function trackDemoWatch(duration) {
    trackConversion(ConversionType.DEMO_WATCH, FunnelStage.INTEREST, {
        duration,
    });
}
export function trackContactForm(formData) {
    trackConversion(ConversionType.CONTACT_FORM, FunnelStage.INTENT, {
        ...formData,
    });
}
export function trackFAQInteraction(question) {
    trackConversion(ConversionType.FAQ_INTERACTION, FunnelStage.CONSIDERATION, {
        question,
    });
}
// Conversion rate optimization helpers
export function getConversionRate(conversions, visitors) {
    return visitors > 0 ? (conversions / visitors) * 100 : 0;
}
export function calculateLTV(averageOrderValue, purchaseFrequency, customerLifespan) {
    return averageOrderValue * purchaseFrequency * customerLifespan;
}
export function getAttributionModel() {
    // This could be configurable
    return 'last-touch';
}
// Retry failed conversions
export function retryFailedConversions() {
    const key = 'upcoach_failed_conversions';
    const failed = localStorage.getItem(key);
    if (failed) {
        try {
            const conversions = JSON.parse(failed);
            conversions.forEach(async (conversion) => {
                try {
                    await fetch('/api/conversions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(conversion),
                    });
                }
                catch (error) {
                    console.error('Retry failed for conversion:', error);
                }
            });
            // Clear after attempting retry
            localStorage.removeItem(key);
        }
        catch (e) {
            console.error('Failed to retry conversions:', e);
        }
    }
}
// Auto-initialize on load
if (typeof window !== 'undefined') {
    initializeConversionTracking();
    // Retry failed conversions on page load
    setTimeout(retryFailedConversions, 5000);
}
//# sourceMappingURL=conversion-tracking.js.map