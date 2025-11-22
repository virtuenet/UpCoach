import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Landing Page
 *
 * These tests capture screenshots of key components and compare
 * them against baseline images to detect visual regressions.
 */

test.describe('Landing Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          animation-fill-mode: forwards !important;
        }
        
        /* Stop any JavaScript-based animations */
        * {
          animation-play-state: paused !important;
        }
        
        /* Disable smooth scrolling */
        html {
          scroll-behavior: auto !important;
        }
      `,
    });

    // Wait a bit for any JavaScript animations to settle
    await page.waitForTimeout(1000);
  });

  test('Hero section visual snapshot', async ({ page }) => {
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Wait for any lazy-loaded images
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot of hero section
    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [page.locator('[class*="animate"]')], // Mask any animated elements
      maxDiffPixelRatio: 0.05, // Allow up to 5% difference
    });
  });

  test('Full page visual snapshot', async ({ page }) => {
    // Scroll to load all lazy-loaded content
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for all images to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page-full.png', {
      fullPage: true,
    });
  });

  test('Features section visual snapshot', async ({ page }) => {
    const featuresSection = page.locator('section:has-text("Features")');
    await featuresSection.scrollIntoViewIfNeeded();
    await expect(featuresSection).toBeVisible();

    await expect(featuresSection).toHaveScreenshot('features-section.png');
  });

  test('Pricing section visual snapshot', async ({ page }) => {
    const pricingSection = page.locator('section:has-text("Pricing")');
    await pricingSection.scrollIntoViewIfNeeded();
    await expect(pricingSection).toBeVisible();

    await expect(pricingSection).toHaveScreenshot('pricing-section.png');
  });

  test('Footer visual snapshot', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    await expect(footer).toHaveScreenshot('footer.png');
  });

  test('Mobile navigation visual snapshot', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // Click mobile menu button
    const menuButton = page.locator('button[aria-label="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300); // Wait for menu animation

      // Take screenshot of mobile menu
      await expect(page).toHaveScreenshot('mobile-menu.png');
    }
  });

  test('Lead capture form visual snapshot', async ({ page }) => {
    // Trigger lead capture modal (if exists)
    const leadButton = page.locator('button:has-text("Get Started")').first();
    if (await leadButton.isVisible()) {
      await leadButton.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      await expect(modal).toHaveScreenshot('lead-capture-modal.png');
    }
  });

  test('Dark mode visual snapshot', async ({ page }) => {
    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('button[aria-label="Toggle dark mode"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(300); // Wait for theme transition

      // Take screenshot in dark mode
      await expect(page).toHaveScreenshot('landing-page-dark.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('Component Interaction Visual Tests', () => {
  test('Button hover states', async ({ page }) => {
    await page.goto('/');

    const primaryButton = page.locator('button.primary').first();
    await primaryButton.scrollIntoViewIfNeeded();

    // Capture hover state
    await primaryButton.hover();
    await expect(primaryButton).toHaveScreenshot('button-hover.png');
  });

  test('Form field focus states', async ({ page }) => {
    await page.goto('/');

    // Open lead form if available
    const leadButton = page.locator('button:has-text("Get Started")').first();
    if (await leadButton.isVisible()) {
      await leadButton.click();

      const emailField = page.locator('input[type="email"]');
      await expect(emailField).toBeVisible();

      // Capture focus state
      await emailField.focus();
      await expect(emailField).toHaveScreenshot('input-focus.png');
    }
  });

  test('Loading states', async ({ page }) => {
    await page.goto('/');

    // Intercept API calls to simulate loading
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 1000);
    });

    // Trigger an action that causes loading
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Capture loading state
      const loadingIndicator = page.locator('.loading, .spinner').first();
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toHaveScreenshot('loading-state.png');
      }
    }
  });
});

test.describe('Responsive Design Visual Tests', () => {
  const viewports = [
    { name: 'desktop-4k', width: 3840, height: 2160 },
    { name: 'desktop-1080p', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'mobile-small', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    test(`Landing page at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe('Cross-browser Visual Tests', () => {
  test('Hero section consistency across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    const heroSection = page.locator('section').first();

    await expect(heroSection).toHaveScreenshot(`hero-${browserName}.png`);
  });

  test('CSS grid layout consistency', async ({ page, browserName }) => {
    await page.goto('/');
    const gridSection = page.locator('.grid, [class*="grid"]').first();

    if (await gridSection.isVisible()) {
      await gridSection.scrollIntoViewIfNeeded();
      await expect(gridSection).toHaveScreenshot(`grid-${browserName}.png`);
    }
  });
});

test.describe('Accessibility Visual Tests', () => {
  test('High contrast mode', async ({ page }) => {
    await page.goto('/');

    // Enable high contrast mode via CSS
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(2) !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot('high-contrast.png', {
      fullPage: true,
    });
  });

  test('Focus indicators visibility', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Capture the focused element
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toHaveScreenshot('focus-indicator.png');
    }
  });
});

test.describe('Error State Visual Tests', () => {
  test('Form validation error states', async ({ page }) => {
    await page.goto('/');

    // Open lead form
    const leadButton = page.locator('button:has-text("Get Started")').first();
    if (await leadButton.isVisible()) {
      await leadButton.click();

      // Submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for error messages
      await page.waitForTimeout(500);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('form-errors.png');
    }
  });

  test('404 page visual', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
    });
  });
});
