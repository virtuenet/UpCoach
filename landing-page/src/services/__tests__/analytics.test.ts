import * as analytics from "../analytics";

describe("Analytics Service", () => {
  let mockGtag: jest.Mock;

  beforeEach(() => {
    // Mock window.gtag
    mockGtag = jest.fn();
    global.window = Object.create(window);
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
    });

    // Mock env variable
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("pageview", () => {
    it("tracks page views with correct parameters", () => {
      analytics.pageview("/about");

      expect(mockGtag).toHaveBeenCalledWith("config", "G-TEST123", {
        page_path: "/about",
      });
    });

    it("does nothing when gtag is not loaded", () => {
      delete (window as any).gtag;

      analytics.pageview("/about");

      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe("event", () => {
    it("tracks custom events with parameters", () => {
      analytics.event("button_click", {
        button_name: "Subscribe",
        location: "header",
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "button_click", {
        button_name: "Subscribe",
        location: "header",
        send_to: "G-TEST123",
      });
    });

    it("tracks events without parameters", () => {
      analytics.event("page_scroll");

      expect(mockGtag).toHaveBeenCalledWith("event", "page_scroll", {
        send_to: "G-TEST123",
      });
    });
  });

  describe("Specific Event Tracking", () => {
    it("tracks newsletter signup", () => {
      analytics.trackNewsletterSignup("footer");

      expect(mockGtag).toHaveBeenCalledWith("event", "newsletter_signup", {
        event_category: "engagement",
        event_label: "footer",
        value: 1,
        send_to: "G-TEST123",
      });
    });

    it("tracks contact form submission", () => {
      analytics.trackContactForm("sidebar");

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "contact_form_submission",
        {
          event_category: "engagement",
          event_label: "sidebar",
          value: 1,
          send_to: "G-TEST123",
        },
      );
    });

    it("tracks lead capture", () => {
      analytics.trackLeadCapture("exit-intent");

      expect(mockGtag).toHaveBeenCalledWith("event", "lead_capture", {
        event_category: "conversion",
        event_label: "exit-intent",
        value: 1,
        send_to: "G-TEST123",
      });
    });

    it("tracks CTA clicks with location", () => {
      analytics.trackCTAClick("Start Free Trial", "hero-section");

      expect(mockGtag).toHaveBeenCalledWith("event", "cta_click", {
        event_category: "navigation",
        event_label: "Start Free Trial",
        cta_location: "hero-section",
        send_to: "G-TEST123",
      });
    });

    it("tracks app download clicks", () => {
      analytics.trackAppDownload("ios", "pricing-page");

      expect(mockGtag).toHaveBeenCalledWith("event", "app_download_click", {
        event_category: "conversion",
        event_label: "ios",
        download_location: "pricing-page",
        send_to: "G-TEST123",
      });
    });

    it("tracks demo interactions", () => {
      analytics.trackDemoInteraction("voice-journal", "play");

      expect(mockGtag).toHaveBeenCalledWith("event", "demo_interaction", {
        event_category: "engagement",
        event_label: "voice-journal",
        demo_action: "play",
        send_to: "G-TEST123",
      });
    });

    it("tracks pricing view", () => {
      analytics.trackPricingView();

      expect(mockGtag).toHaveBeenCalledWith("event", "pricing_view", {
        event_category: "conversion",
        value: 1,
        send_to: "G-TEST123",
      });
    });

    it("tracks plan selection", () => {
      analytics.trackPlanSelect("Pro", "annual");

      expect(mockGtag).toHaveBeenCalledWith("event", "plan_select", {
        event_category: "conversion",
        event_label: "Pro",
        billing_cycle: "annual",
        send_to: "G-TEST123",
      });
    });

    it("tracks FAQ expansions", () => {
      analytics.trackFAQExpand("How does billing work?");

      expect(mockGtag).toHaveBeenCalledWith("event", "faq_expand", {
        event_category: "engagement",
        event_label: "How does billing work?",
        send_to: "G-TEST123",
      });
    });

    it("tracks social link clicks", () => {
      analytics.trackSocialClick("Twitter");

      expect(mockGtag).toHaveBeenCalledWith("event", "social_link_click", {
        event_category: "navigation",
        event_label: "Twitter",
        send_to: "G-TEST123",
      });
    });
  });

  describe("Web Vitals", () => {
    it("tracks web vitals with rating", () => {
      analytics.trackWebVitals({
        name: "LCP",
        value: 2300,
        rating: "good",
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "web_vitals", {
        event_category: "performance",
        event_label: "LCP",
        value: 2300,
        metric_rating: "good",
        non_interaction: true,
        send_to: "G-TEST123",
      });
    });

    it("rounds web vitals values", () => {
      analytics.trackWebVitals({
        name: "CLS",
        value: 0.123456,
        rating: "needs-improvement",
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "web_vitals",
        expect.objectContaining({
          value: 0,
        }),
      );
    });
  });

  describe("Enhanced Ecommerce", () => {
    it("tracks ecommerce events with items", () => {
      analytics.trackEcommerceEvent("purchase", {
        currency: "USD",
        value: 29.99,
        items: [
          {
            item_id: "pro-monthly",
            item_name: "Pro Monthly Subscription",
            price: 29.99,
            quantity: 1,
          },
        ],
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "purchase", {
        currency: "USD",
        value: 29.99,
        items: [
          {
            item_id: "pro-monthly",
            item_name: "Pro Monthly Subscription",
            price: 29.99,
            quantity: 1,
          },
        ],
        send_to: "G-TEST123",
      });
    });
  });

  describe("User Properties", () => {
    it("sets user properties", () => {
      analytics.setUserProperties({
        user_type: "premium",
        signup_date: "2024-01-15",
      });

      expect(mockGtag).toHaveBeenCalledWith("set", "user_properties", {
        user_type: "premium",
        signup_date: "2024-01-15",
      });
    });
  });

  describe("Custom Dimensions", () => {
    it("sets custom dimensions", () => {
      analytics.setCustomDimension("experiment_variant", "variant-a");

      expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
        experiment_variant: "variant-a",
      });
    });
  });

  describe("Error Handling", () => {
    it("handles missing gtag gracefully", () => {
      delete (window as any).gtag;

      // These should not throw
      expect(() => {
        analytics.trackNewsletterSignup("footer");
        analytics.trackWebVitals({ name: "FCP", value: 1800, rating: "good" });
        analytics.setUserProperties({ test: "value" });
      }).not.toThrow();
    });

    it("handles missing measurement ID", () => {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

      analytics.event("test_event");

      expect(mockGtag).toHaveBeenCalledWith("event", "test_event", {
        send_to: undefined,
      });
    });
  });
});
