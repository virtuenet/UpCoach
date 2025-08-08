import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import userEvent from "@testing-library/user-event";

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  // Add any global providers here
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

// Mock analytics tracking
export const mockAnalytics = {
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackAppDownload: jest.fn(),
  trackFormSubmit: jest.fn(),
  trackModalView: jest.fn(),
  trackPricingView: jest.fn(),
  trackPlanSelect: jest.fn(),
  trackCTAClick: jest.fn(),
};

// Mock API responses
export const mockApiResponses = {
  leadCapture: {
    success: {
      success: true,
      message: "Lead captured successfully",
      data: {
        id: "lead-123",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      },
    },
    error: {
      success: false,
      error: "Failed to capture lead",
    },
  },
  newsletter: {
    success: {
      success: true,
      message: "Subscribed successfully",
    },
    error: {
      success: false,
      error: "Email already subscribed",
    },
  },
};

// Test data generators
export const generateTestUser = (overrides = {}) => ({
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateTestLead = (overrides = {}) => ({
  name: "John Doe",
  email: "john@company.com",
  company: "Acme Inc",
  role: "manager",
  interest: "productivity",
  marketingConsent: true,
  source: "test",
  ...overrides,
});

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  const results = [];

  // Check for alt text on images
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.alt) {
      results.push(`Image missing alt text: ${img.src}`);
    }
  });

  // Check for form labels
  const inputs = container.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const id = input.id;
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      if (!label) {
        results.push(`Input missing label: ${id}`);
      }
    }
  });

  // Check for heading hierarchy
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1) {
      results.push(
        `Heading hierarchy issue: ${heading.tagName} after H${lastLevel}`,
      );
    }
    lastLevel = level;
  });

  return results;
};

// Performance testing helpers
export const measureRenderTime = async (
  component: () => ReactElement,
): Promise<number> => {
  const start = performance.now();
  render(component());
  const end = performance.now();
  return end - start;
};

// Mock IntersectionObserver with controls
export class MockIntersectionObserver {
  private callbacks: Map<Element, IntersectionObserverCallback> = new Map();
  private observer: IntersectionObserver;

  constructor() {
    this.observer = {
      observe: (target: Element) => {
        // Store callback for manual triggering
      },
      unobserve: (target: Element) => {
        this.callbacks.delete(target);
      },
      disconnect: () => {
        this.callbacks.clear();
      },
    } as any;

    global.IntersectionObserver = jest.fn((callback) => {
      this.callbacks.set(document.body, callback);
      return this.observer;
    }) as any;
  }

  triggerIntersection(entries: Partial<IntersectionObserverEntry>[]) {
    this.callbacks.forEach((callback) => {
      callback(entries as IntersectionObserverEntry[], this.observer);
    });
  }
}

// Wait for animations to complete
export const waitForAnimation = (duration = 1000) =>
  new Promise((resolve) => setTimeout(resolve, duration));

// Mock fetch with response queue
export class MockFetch {
  private responses: Array<{ response: any; error?: boolean }> = [];
  private callCount = 0;

  addResponse(response: any, error = false) {
    this.responses.push({ response, error });
    return this;
  }

  init() {
    global.fetch = jest.fn(() => {
      const { response, error } = this.responses[this.callCount] || {
        response: {},
        error: false,
      };
      this.callCount++;

      if (error) {
        return Promise.reject(new Error(response));
      }

      return Promise.resolve({
        ok: true,
        json: async () => response,
        ...response,
      } as Response);
    });
  }

  reset() {
    this.responses = [];
    this.callCount = 0;
    (global.fetch as jest.Mock).mockClear();
  }

  getCalls() {
    return (global.fetch as jest.Mock).mock.calls;
  }
}
