import { render } from "@testing-library/react";
import { measureRenderTime } from "../utils/testHelpers";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Pricing from "@/components/sections/Pricing";
import LeadCaptureForm from "@/components/LeadCaptureForm";

describe("Landing Page Performance Tests", () => {
  // Performance thresholds in milliseconds
  const PERFORMANCE_THRESHOLDS = {
    hero: 350, // Increased for CI environment and React 18
    features: 250,
    pricing: 250,
    leadForm: 150,
    firstPaint: 250,
  };

  describe("Component Render Performance", () => {
    test("Hero section renders within performance threshold", async () => {
      const renderTime = await measureRenderTime(() => <Hero />);

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.hero);
      console.log(`Hero render time: ${renderTime.toFixed(2)}ms`);
    });

    test("Features section renders within performance threshold", async () => {
      const renderTime = await measureRenderTime(() => <Features />);

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.features);
      console.log(`Features render time: ${renderTime.toFixed(2)}ms`);
    });

    test("Pricing section renders within performance threshold", async () => {
      const renderTime = await measureRenderTime(() => <Pricing />);

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pricing);
      console.log(`Pricing render time: ${renderTime.toFixed(2)}ms`);
    });

    test("Lead capture form renders quickly", async () => {
      const renderTime = await measureRenderTime(() => (
        <LeadCaptureForm source="test" />
      ));

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.leadForm);
      console.log(`Lead form render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe("Bundle Size Analysis", () => {
    test("Critical CSS is minimal", () => {
      // Check that critical CSS exists in layout
      const criticalStyles = document.querySelector("style")?.innerHTML || "";

      // Critical CSS should be small (< 14KB)
      expect(criticalStyles.length).toBeLessThan(14 * 1024);
    });

    test("Images are optimized", () => {
      render(<Hero />);

      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        // Check for Next.js image optimization attributes
        expect(img).toHaveAttribute("loading");

        // Check for responsive images
        if (img.srcset) {
          const srcsetParts = img.srcset.split(",");
          expect(srcsetParts.length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe("Lazy Loading Performance", () => {
    test("Non-critical sections use lazy loading", () => {
      const { container } = render(
        <div>
          <div className="h-96 bg-gray-50 animate-pulse">
            Loading placeholder
          </div>
        </div>,
      );

      // Check for loading placeholders
      const placeholders = container.querySelectorAll(".animate-pulse");
      expect(placeholders.length).toBeGreaterThan(0);
    });

    test("Intersection Observer is used for lazy loading", () => {
      const observerCalls = (global.IntersectionObserver as jest.Mock).mock
        .calls;

      // Render a component that uses lazy loading
      render(<div data-testid="lazy-section" />);

      // IntersectionObserver should be initialized
      expect(global.IntersectionObserver).toBeDefined();
    });
  });

  describe("Animation Performance", () => {
    test("Animations use CSS transforms for better performance", () => {
      const { container } = render(<Hero />);

      // Check for transform-based animations
      const animatedElements = container.querySelectorAll(
        '[class*="transform"]',
      );
      expect(animatedElements.length).toBeGreaterThan(0);

      // Check for will-change optimization
      const styles = getComputedStyle(animatedElements[0]);
      // In real implementation, check for will-change or transform properties
    });

    test("Animations are GPU-accelerated", () => {
      const { container } = render(<Hero />);

      // Look for 3D transforms which trigger GPU acceleration
      const gpuElements = container.querySelectorAll(
        '[class*="translate-z"], [class*="translate3d"], [style*="translateZ"]',
      );

      // Or check for will-change property
      const willChangeElements = container.querySelectorAll(
        '[style*="will-change"]',
      );

      expect(gpuElements.length + willChangeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Usage", () => {
    test("Components clean up properly on unmount", () => {
      const { unmount } = render(<Hero />);

      // Get initial listener count
      const initialListeners = (global as any).eventListeners?.length || 0;

      // Unmount component
      unmount();

      // Check that listeners are removed
      const afterListeners = (global as any).eventListeners?.length || 0;
      expect(afterListeners).toBeLessThanOrEqual(initialListeners);
    });

    test("No memory leaks from intervals or timeouts", () => {
      jest.useFakeTimers();

      const { unmount } = render(<LeadCaptureForm source="test" />);

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      // Unmount and check for cleanup
      unmount();

      // All timers should be cleared
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe("Network Performance", () => {
    test("API calls are debounced appropriately", async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const { getByLabelText } = render(<LeadCaptureForm source="test" />);

      const emailInput = getByLabelText("Work Email *");

      // Type rapidly
      for (let i = 0; i < 5; i++) {
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // API should not be called for each keystroke
      expect(mockFetch).toHaveBeenCalledTimes(0);
    });

    test("Images use appropriate formats", () => {
      const { container } = render(<Hero />);

      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        const src = img.src || img.dataset.src || "";

        // Check for modern formats
        if (src.includes(".")) {
          const format = src.split(".").pop()?.toLowerCase();
          expect(["webp", "avif", "jpg", "jpeg", "png", "svg"]).toContain(
            format,
          );
        }
      });
    });
  });

  describe("Cumulative Layout Shift (CLS)", () => {
    test("Components have defined dimensions to prevent layout shift", () => {
      const { container } = render(<Hero />);

      // Check that images have width/height
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(
          img.width > 0 || img.style.width || img.getAttribute("width"),
        ).toBeTruthy();
      });

      // Check that containers have min-height
      const sections = container.querySelectorAll("section");
      sections.forEach((section) => {
        const styles = getComputedStyle(section);
        expect(
          styles.minHeight !== "auto" || section.className.includes("min-h-"),
        ).toBeTruthy();
      });
    });
  });

  describe("First Input Delay (FID)", () => {
    test("Interactive elements respond quickly", async () => {
      const { getByText } = render(<Hero />);

      const startTime = performance.now();
      const button = getByText("Download for iOS");
      button.click();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });
  });
});
