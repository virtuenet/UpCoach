// Google Analytics event tracking utilities

interface Window {
  gtag: (command: 'config' | 'event' | 'js' | 'set', targetId: string, config?: any) => void;
  dataLayer: any[];
}

export const GA_EVENTS = {
  // Engagement events
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  CONTACT_FORM_SUBMIT: 'contact_form_submission',
  LEAD_CAPTURE: 'lead_capture',

  // Navigation events
  CTA_CLICK: 'cta_click',
  NAVIGATION_CLICK: 'navigation_click',
  SOCIAL_LINK_CLICK: 'social_link_click',

  // Content events
  VIDEO_PLAY: 'video_play',
  DEMO_INTERACTION: 'demo_interaction',
  FAQ_EXPAND: 'faq_expand',

  // Conversion events
  APP_DOWNLOAD_CLICK: 'app_download_click',
  PRICING_VIEW: 'pricing_view',
  PLAN_SELECT: 'plan_select',

  // Performance events
  WEB_VITALS: 'web_vitals',
  PAGE_VIEW: 'page_view',
} as const;

// Helper to check if GA is loaded
const isGALoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
};

// Track page views
export const pageview = (url: string) => {
  if (!isGALoaded()) return;

  (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  });
};

// Track custom events
export const event = (action: string, parameters?: Record<string, any>) => {
  if (!isGALoaded()) return;

  (window as any).gtag('event', action, {
    ...parameters,
    send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  });
};

// Alias for backward compatibility
export const trackEvent = event;

// Specific event tracking functions
export const trackNewsletterSignup = (source: string) => {
  event(GA_EVENTS.NEWSLETTER_SIGNUP, {
    event_category: 'engagement',
    event_label: source,
    value: 1,
  });
};

export const trackContactForm = (formType: string) => {
  event(GA_EVENTS.CONTACT_FORM_SUBMIT, {
    event_category: 'engagement',
    event_label: formType,
    value: 1,
  });
};

export const trackLeadCapture = (trigger: string) => {
  event(GA_EVENTS.LEAD_CAPTURE, {
    event_category: 'conversion',
    event_label: trigger,
    value: 1,
  });
};

export const trackCTAClick = (ctaName: string, location: string) => {
  event(GA_EVENTS.CTA_CLICK, {
    event_category: 'navigation',
    event_label: ctaName,
    cta_location: location,
  });
};

export const trackAppDownload = (platform: 'ios' | 'android', location: string) => {
  event(GA_EVENTS.APP_DOWNLOAD_CLICK, {
    event_category: 'conversion',
    event_label: platform,
    download_location: location,
  });
};

export const trackDemoInteraction = (feature: string, action: string) => {
  event(GA_EVENTS.DEMO_INTERACTION, {
    event_category: 'engagement',
    event_label: feature,
    demo_action: action,
  });
};

export const trackPricingView = () => {
  event(GA_EVENTS.PRICING_VIEW, {
    event_category: 'conversion',
    value: 1,
  });
};

export const trackPlanSelect = (plan: string, billing: 'monthly' | 'annual') => {
  event(GA_EVENTS.PLAN_SELECT, {
    event_category: 'conversion',
    event_label: plan,
    billing_cycle: billing,
  });
};

export const trackWebVitals = (metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}) => {
  event(GA_EVENTS.WEB_VITALS, {
    event_category: 'performance',
    event_label: metric.name,
    value: Math.round(metric.value),
    metric_rating: metric.rating,
    non_interaction: true,
  });
};

export const trackFAQExpand = (question: string) => {
  event(GA_EVENTS.FAQ_EXPAND, {
    event_category: 'engagement',
    event_label: question,
  });
};

export const trackSocialClick = (platform: string) => {
  event(GA_EVENTS.SOCIAL_LINK_CLICK, {
    event_category: 'navigation',
    event_label: platform,
  });
};

// Enhanced Ecommerce tracking
export const trackEcommerceEvent = (
  eventName: string,
  parameters: {
    currency?: string;
    value?: number;
    items?: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity?: number;
    }>;
  }
) => {
  if (!isGALoaded()) return;

  (window as any).gtag('event', eventName, {
    ...parameters,
    send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  });
};

// User properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isGALoaded()) return;

  (window as any).gtag('set', 'user_properties', properties);
};

// Custom dimensions
export const setCustomDimension = (name: string, value: string) => {
  if (!isGALoaded()) return;

  (window as any).gtag('event', 'page_view', {
    [name]: value,
  });
};

// Track form submission
export const trackFormSubmit = (formName: string, source: string) => {
  event('form_submit', {
    event_category: 'conversion',
    event_label: formName,
    form_source: source,
  });
};

// Track modal view
export const trackModalView = (modalName: string, trigger: string) => {
  event('modal_view', {
    event_category: 'engagement',
    event_label: modalName,
    modal_trigger: trigger,
  });
};