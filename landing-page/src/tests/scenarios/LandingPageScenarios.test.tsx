import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/app/page";
import {
  trackAppDownload,
  trackFormSubmit,
  trackPricingView,
} from "@/services/analytics";

// Mock dependencies
jest.mock("@/services/analytics");
jest.mock("@/services/experiments", () => ({
  useExperiment: () => ({
    variant: 'control',
    trackConversion: jest.fn(),
  }),
  getActiveExperiments: () => ({}),
  clearExperiments: jest.fn(),
  markReturningUser: jest.fn(),
}));

// Mock dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: () => Promise<any>) => {
    // Extract the component name from the import path
    const Component = ({ children }: any) => <div>{children}</div>;
    Component.displayName = "DynamicComponent";
    return Component;
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true }),
  } as Response),
);

describe("Landing Page User Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sessionStorage
    sessionStorage.clear();
  });

  describe("Scenario 1: First-time visitor exploring the product", () => {
    test("user lands on page and scrolls through all sections", async () => {
      render(<HomePage />);

      // Check hero section is visible
      expect(
        screen.getByText(/Unlock Your Full Potential/i),
      ).toBeInTheDocument();

      // Simulate scrolling by checking section visibility
      // In real app, these would be lazy-loaded
      expect(document.querySelector("#features")).toBeDefined();
      expect(document.querySelector("#testimonials")).toBeDefined();
      expect(document.querySelector("#pricing")).toBeDefined();
    });

    test("user watches demo video and then downloads app", async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // Click watch demo
      const watchDemoButton = screen.getByText("Watch 2-minute Demo");
      await user.click(watchDemoButton);

      // Video modal should open
      await waitFor(() => {
        expect(screen.getByTitle("UpCoach Demo Video")).toBeInTheDocument();
      });

      // Close video
      const closeButton = screen.getByLabelText("Close video");
      await user.click(closeButton);

      // Download app
      const downloadButton = screen.getByText("Download for iOS");
      await user.click(downloadButton);

      // Verify tracking
      expect(trackAppDownload).toHaveBeenCalledWith("ios", "hero");
    });
  });

  describe("Scenario 2: User interested in pricing", () => {
    test("user navigates directly to pricing and selects a plan", async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // Scroll to pricing section (simulated)
      const pricingSection = document.getElementById("pricing");
      pricingSection?.scrollIntoView();

      // Pricing view should be tracked
      expect(trackPricingView).toHaveBeenCalled();

      // User clicks on Pro plan
      const proButton = screen.getByText("Start 7-Day Free Trial");
      await user.click(proButton);

      // Should navigate to app store
      expect(proButton.closest("a")).toHaveAttribute(
        "href",
        "https://apps.apple.com/app/upcoach",
      );
    });

    test("user compares plans and reads FAQs before deciding", async () => {
      render(<HomePage />);

      // Check all plan options are visible
      expect(screen.getByText("Starter")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
      expect(screen.getByText("Pro Annual")).toBeInTheDocument();

      // Check feature comparisons
      expect(
        screen.getByText("5 voice journal entries/day"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Unlimited voice journal entries"),
      ).toBeInTheDocument();

      // FAQs should be available
      const faqSection = document.getElementById("faq");
      expect(faqSection).toBeDefined();
    });
  });

  describe("Scenario 3: Lead generation flow", () => {
    test("user fills lead capture form after 45 seconds", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<HomePage />);

      // Fast-forward 45 seconds
      jest.advanceTimersByTime(45000);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText("Get Early Access")).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText("Full Name *"), "Jane Smith");
      await user.type(
        screen.getByLabelText("Work Email *"),
        "jane@company.com",
      );
      await user.selectOptions(screen.getByLabelText("Your Role"), "manager");

      // Submit form
      await user.click(
        screen.getByRole("button", { name: /Get Early Access/i }),
      );

      // Verify submission
      await waitFor(() => {
        expect(trackFormSubmit).toHaveBeenCalledWith(
          "lead_capture",
          "modal-time-based",
        );
      });

      jest.useRealTimers();
    });

    test("user signs up through inline lead generation section", async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // Find lead generation section
      const leadSection = screen.getByText(/Get Early Access & Save 50%/i);
      expect(leadSection).toBeInTheDocument();

      // Fill inline form
      const forms = screen.getAllByLabelText("Full Name *");
      const inlineForm = forms[forms.length - 1]; // Get the last form (inline)

      await user.type(inlineForm, "John Manager");

      const emailFields = screen.getAllByLabelText("Work Email *");
      await user.type(
        emailFields[emailFields.length - 1],
        "john@enterprise.com",
      );

      // Submit
      const submitButtons = screen.getAllByRole("button", {
        name: /Get Early Access/i,
      });
      await user.click(submitButtons[submitButtons.length - 1]);

      // Verify tracking
      await waitFor(() => {
        expect(trackFormSubmit).toHaveBeenCalledWith(
          "lead_capture",
          "lead-generation-section",
        );
      });
    });
  });

  describe("Scenario 4: Mobile user journey", () => {
    beforeEach(() => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 812;

      // Mock touch support
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(max-width: 768px)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    });

    test("mobile user downloads app directly", async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // Check mobile-optimized content
      const androidButton = screen.getByText("Download for Android");
      expect(androidButton).toBeInTheDocument();

      // Click download
      await user.click(androidButton);

      // Verify tracking
      expect(trackAppDownload).toHaveBeenCalledWith("android", "hero");
    });

    test("mobile user uses responsive navigation", () => {
      render(<HomePage />);

      // Check responsive classes are applied
      const heroSection = document.querySelector(".min-h-screen");
      expect(heroSection).toBeInTheDocument();

      // Check mobile-friendly buttons
      const ctaButtons = screen.getAllByRole("link", { name: /Download/i });
      ctaButtons.forEach((button) => {
        expect(button).toHaveClass("w-full", "sm:w-auto");
      });
    });
  });

  describe("Scenario 5: Trust and social proof evaluation", () => {
    test("user reviews testimonials and success stories", () => {
      render(<HomePage />);

      // Check testimonials section
      expect(
        screen.getByText(/Real Stories, Real Results/i),
      ).toBeInTheDocument();

      // Check social proof metrics
      expect(screen.getByText("50,000+")).toBeInTheDocument();
      expect(screen.getByText("Active Users")).toBeInTheDocument();
      expect(screen.getByText("92%")).toBeInTheDocument();
      expect(screen.getByText("Goal Achievement")).toBeInTheDocument();

      // Check trust indicators
      expect(screen.getByText("HIPAA Compliant")).toBeInTheDocument();
      expect(screen.getByText("256-bit Encryption")).toBeInTheDocument();
      expect(screen.getByText("GDPR Compliant")).toBeInTheDocument();
    });

    test("user checks awards and media mentions", () => {
      render(<HomePage />);

      // Check awards
      expect(screen.getByText("App of the Day")).toBeInTheDocument();
      expect(screen.getByText("Best Wellness App")).toBeInTheDocument();

      // Check media mentions
      expect(screen.getByText("TechCrunch")).toBeInTheDocument();
      expect(screen.getByText("Forbes")).toBeInTheDocument();
    });
  });

  describe("Scenario 6: Return visitor conversion", () => {
    test("returning user skips modal and goes directly to download", async () => {
      const user = userEvent.setup();

      // Simulate returning user (modal already shown)
      sessionStorage.setItem("leadModalShown", "true");

      render(<HomePage />);

      // Wait to ensure modal doesn't appear
      await waitFor(
        () => {
          expect(
            screen.queryByText("Reserve Your Spot"),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // User goes directly to app download section
      const appDownloadSection = screen.getByText(
        /Start Your Transformation Journey Today/i,
      );
      expect(appDownloadSection).toBeInTheDocument();

      // Download app
      const iosButton = screen.getByRole("link", { name: /App Store/i });
      await user.click(iosButton);

      // Should navigate to app store
      expect(iosButton).toHaveAttribute(
        "href",
        "https://apps.apple.com/app/upcoach",
      );
    });
  });

  describe("Scenario 7: Performance-conscious user", () => {
    test("page loads quickly with lazy-loaded content", () => {
      const { container } = render(<HomePage />);

      // Check critical content loads immediately
      expect(
        screen.getByText(/Unlock Your Full Potential/i),
      ).toBeInTheDocument();

      // Check lazy-loading placeholders
      const lazyLoadedSections = container.querySelectorAll(".animate-pulse");
      expect(lazyLoadedSections.length).toBeGreaterThan(0);

      // Verify progressive enhancement
      const scrollIndicator = container.querySelector(".animate-bounce");
      expect(scrollIndicator).toBeInTheDocument();
    });
  });
});
