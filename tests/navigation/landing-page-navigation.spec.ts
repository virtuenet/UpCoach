import { test, expect } from '@playwright/test';

test.describe('Landing Page Navigation', () => {
  test.describe('Header Navigation', () => {
    test('should render main navigation items', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('[data-mcp="header-nav"]')).toBeVisible();
      await expect(page.locator('text=UpCoach')).toBeVisible();
      await expect(page.locator('text=Features')).toBeVisible();
      await expect(page.locator('text=Pricing')).toBeVisible();
      await expect(page.locator('text=About')).toBeVisible();
    });

    test('should navigate to features page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Features');
      await page.waitForURL('/features');

      expect(page.url()).toContain('/features');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Features")')).toBeVisible();
    });

    test('should navigate to pricing page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Pricing');
      await page.waitForURL('/pricing');

      expect(page.url()).toContain('/pricing');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Pricing")')).toBeVisible();
    });

    test('should navigate to about page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=About');
      await page.waitForURL('/about');

      expect(page.url()).toContain('/about');
      await expect(page.locator('[data-mcp="page-title"]:has-text("About")')).toBeVisible();
    });

    test('should navigate back to home from logo', async ({ page }) => {
      await page.goto('/features');
      await page.click('text=UpCoach');
      await page.waitForURL('/');

      expect(page.url()).toMatch(/\/$|\/$/);
    });
  });

  test.describe('Authentication Navigation', () => {
    test('should show sign in and get started buttons when logged out', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.locator('text=Get Started')).toBeVisible();
    });

    test('should open sign in modal', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign In');

      // Assuming Clerk modal opens
      await expect(page.locator('[data-mcp="sign-in-modal"]')).toBeVisible();
    });

    test('should open sign up modal', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Get Started');

      // Assuming Clerk modal opens
      await expect(page.locator('[data-mcp="sign-up-modal"]')).toBeVisible();
    });

    test('should show dashboard link when authenticated', async ({ page }) => {
      // Mock authenticated state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session-token');
      });

      await page.goto('/');

      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('[data-mcp="user-button"]')).toBeVisible();
    });

    test('should navigate to dashboard when authenticated', async ({ page }) => {
      // Mock authenticated state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session-token');
      });

      await page.goto('/');
      await page.click('text=Dashboard');

      // Should navigate to dashboard (might be external URL)
      await page.waitForTimeout(1000); // Give time for navigation
      expect(page.url()).toContain('dashboard');
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should show mobile menu toggle on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto('/');

      await expect(page.locator('[data-mcp="mobile-menu-toggle"]')).toBeVisible();

      // Desktop navigation should be hidden
      await expect(page.locator('[data-mcp="desktop-nav"]')).toBeHidden();
    });

    test('should toggle mobile navigation menu', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto('/');

      // Open mobile menu
      await page.click('[data-mcp="mobile-menu-toggle"]');
      await expect(page.locator('[data-mcp="mobile-nav"]')).toBeVisible();

      // Check all navigation items are present
      await expect(page.locator('[data-mcp="mobile-nav"] text=Features')).toBeVisible();
      await expect(page.locator('[data-mcp="mobile-nav"] text=Pricing')).toBeVisible();
      await expect(page.locator('[data-mcp="mobile-nav"] text=About')).toBeVisible();

      // Close mobile menu
      await page.click('[data-mcp="mobile-menu-close"]');
      await expect(page.locator('[data-mcp="mobile-nav"]')).toBeHidden();
    });

    test('should navigate from mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto('/');

      // Open mobile menu and navigate
      await page.click('[data-mcp="mobile-menu-toggle"]');
      await page.click('[data-mcp="mobile-nav"] text=Features');
      await page.waitForURL('/features');

      expect(page.url()).toContain('/features');

      // Mobile menu should close after navigation
      await expect(page.locator('[data-mcp="mobile-nav"]')).toBeHidden();
    });

    test('should show desktop navigation on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');

      await expect(page.locator('[data-mcp="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-mcp="mobile-menu-toggle"]')).toBeHidden();
    });
  });

  test.describe('Sticky Header Behavior', () => {
    test('should maintain sticky header position on scroll', async ({ page }) => {
      await page.goto('/');

      // Get initial header position
      const header = page.locator('[data-mcp="header"]');
      await expect(header).toBeVisible();

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, 1000);
      });

      // Header should still be visible (sticky)
      await expect(header).toBeVisible();

      // Check that header has sticky class or style
      const isSticky = await header.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'sticky' || style.position === 'fixed';
      });

      expect(isSticky).toBeTruthy();
    });

    test('should maintain navigation functionality while scrolled', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, 1000);
      });

      // Navigation should still work
      await page.click('text=Features');
      await page.waitForURL('/features');

      expect(page.url()).toContain('/features');
    });
  });

  test.describe('Page Transitions', () => {
    test('should maintain smooth transitions between pages', async ({ page }) => {
      await page.goto('/');

      // Navigate to features
      await page.click('text=Features');
      await page.waitForURL('/features');

      // Check page loaded properly
      await expect(page.locator('[data-mcp="page-content"]')).toBeVisible();

      // Navigate to pricing
      await page.click('text=Pricing');
      await page.waitForURL('/pricing');

      await expect(page.locator('[data-mcp="page-content"]')).toBeVisible();
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/');
      await page.goto('/features');
      await page.goto('/pricing');

      // Go back
      await page.goBack();
      await page.waitForURL('/features');
      expect(page.url()).toContain('/features');

      // Go back again
      await page.goBack();
      await page.waitForURL('/');
      expect(page.url()).toMatch(/\/$|\/$/);

      // Go forward
      await page.goForward();
      await page.waitForURL('/features');
      expect(page.url()).toContain('/features');
    });
  });

  test.describe('SEO and Metadata', () => {
    test('should have correct page titles for each route', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/UpCoach/);

      await page.goto('/features');
      await expect(page).toHaveTitle(/Features.*UpCoach/);

      await page.goto('/pricing');
      await expect(page).toHaveTitle(/Pricing.*UpCoach/);

      await page.goto('/about');
      await expect(page).toHaveTitle(/About.*UpCoach/);
    });

    test('should have appropriate meta descriptions', async ({ page }) => {
      await page.goto('/');

      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.length).toBeGreaterThan(50);
    });

    test('should have canonical URLs set correctly', async ({ page }) => {
      await page.goto('/features');

      const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonicalUrl).toContain('/features');
    });
  });

  test.describe('CTA Navigation', () => {
    test('should navigate to sign up from hero CTA', async ({ page }) => {
      await page.goto('/');

      await page.click('[data-mcp="hero-cta"]');

      // Should open sign up modal or navigate to sign up
      await expect(page.locator('[data-mcp="sign-up-modal"]')).toBeVisible();
    });

    test('should navigate to pricing from feature CTAs', async ({ page }) => {
      await page.goto('/features');

      await page.click('[data-mcp="feature-cta"]');
      await page.waitForURL('/pricing');

      expect(page.url()).toContain('/pricing');
    });

    test('should handle multiple CTAs consistently', async ({ page }) => {
      await page.goto('/');

      const ctaButtons = page.locator('[data-mcp*="cta"]');
      const count = await ctaButtons.count();

      // All CTA buttons should be clickable and have proper attributes
      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i);
        await expect(button).toBeVisible();

        const hasHref = await button.getAttribute('href');
        const hasOnClick = await button.getAttribute('onclick');

        expect(hasHref || hasOnClick).toBeTruthy();
      }
    });
  });

  test.describe('Footer Navigation', () => {
    test('should render footer navigation links', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('[data-mcp="footer-nav"]')).toBeVisible();

      // Check for common footer links
      await expect(page.locator('[data-mcp="footer-nav"] text=Privacy Policy')).toBeVisible();
      await expect(page.locator('[data-mcp="footer-nav"] text=Terms of Service')).toBeVisible();
      await expect(page.locator('[data-mcp="footer-nav"] text=Contact')).toBeVisible();
    });

    test('should navigate to contact page from footer', async ({ page }) => {
      await page.goto('/');

      await page.click('[data-mcp="footer-nav"] text=Contact');
      await page.waitForURL('/contact');

      expect(page.url()).toContain('/contact');
    });
  });

  test.describe('Accessibility Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Tab through navigation items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should focus on first navigation item
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      expect(['Features', 'Pricing', 'About', 'Sign In']).toContain(focusedElement);
    });

    test('should handle Enter key on navigation items', async ({ page }) => {
      await page.goto('/');

      // Focus on Features link and press Enter
      await page.focus('text=Features');
      await page.keyboard.press('Enter');
      await page.waitForURL('/features');

      expect(page.url()).toContain('/features');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');

      const nav = page.locator('[data-mcp="header-nav"]');
      const ariaLabel = await nav.getAttribute('aria-label');

      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('navigation');
    });

    test('should announce page changes to screen readers', async ({ page }) => {
      await page.goto('/');

      // Check for ARIA live region or page announcements
      const liveRegion = page.locator('[aria-live]');
      await expect(liveRegion).toBeAttached();
    });
  });
});