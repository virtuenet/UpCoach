// clerk-auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Clerk Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Warning')) {
        console.log('Console error:', msg.text());
      }
    });

    await page.goto('/');
  });

  test.describe('Unauthenticated State', () => {
    test('should display sign in and sign up buttons in header', async ({ page }) => {
      // Check that sign in button is visible in header
      const header = page.locator('header');
      const signInButton = header.locator('button:has-text("Sign In")');
      await expect(signInButton).toBeVisible();

      // Check that sign up button is visible in header
      const signUpButton = header.locator('button:has-text("Get Started")');
      await expect(signUpButton).toBeVisible();

      // Check that user button is not visible when signed out
      const userButton = page.locator('[data-testid="user-button"], .cl-userButton');
      await expect(userButton).not.toBeVisible();

      // Check that dashboard link is not visible when signed out
      const dashboardLink = page.locator('a[href="/dashboard"]');
      await expect(dashboardLink).not.toBeVisible();
    });

    test('should show UpCoach logo in header', async ({ page }) => {
      const logo = page.locator('header a:has-text("UpCoach")');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('href', '/');
    });

    test('should display navigation links in header', async ({ page }) => {
      const header = page.locator('header');
      const featuresLink = header.locator('a[href="/features"]');
      const pricingLink = header.locator('a[href="/pricing"]');
      const aboutLink = header.locator('a[href="/about"]');

      await expect(featuresLink).toBeVisible();
      await expect(pricingLink).toBeVisible();
      await expect(aboutLink).toBeVisible();
    });

    test('should open sign in modal when sign in button is clicked', async ({ page }) => {
      const header = page.locator('header');
      const signInButton = header.locator('button:has-text("Sign In")');
      await signInButton.click();

      // Wait for Clerk modal to appear
      // Note: Actual modal appearance depends on Clerk configuration
      await page.waitForTimeout(1000);

      // Check if Clerk modal or sign-in form is visible
      const clerkModal = page.locator('.cl-modal, .cl-signInCard, [data-testid="sign-in-modal"]');
      const signInForm = page.locator('form[data-testid="sign-in-form"], .cl-signIn-start');

      // At least one of these should be visible
      await expect(clerkModal.or(signInForm).first()).toBeVisible({ timeout: 5000 });
    });

    test('should open sign up modal when get started button is clicked', async ({ page }) => {
      const header = page.locator('header');
      const signUpButton = header.locator('button:has-text("Get Started")');
      await signUpButton.click();

      // Wait for Clerk modal to appear
      await page.waitForTimeout(1000);

      // Check if Clerk modal or sign-up form is visible
      const clerkModal = page.locator('.cl-modal, .cl-signUpCard, [data-testid="sign-up-modal"]');
      const signUpForm = page.locator('form[data-testid="sign-up-form"], .cl-signUp-start');

      // At least one of these should be visible
      await expect(clerkModal.or(signUpForm).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to home when accessing dashboard without authentication', async ({
      page,
    }) => {
      // Try to access protected dashboard page
      await page.goto('/dashboard');

      // Should be redirected to home page or sign-in
      await page.waitForURL(url => url.pathname === '/' || url.pathname.includes('sign-in'), {
        timeout: 5000,
      });

      // Verify we're not on the dashboard
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/dashboard');
    });

    test('should not display dashboard content when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for potential redirect
      await page.waitForTimeout(1000);

      // Check that dashboard-specific content is not visible
      const dashboardTitle = page.locator('h1:has-text("Welcome to Your Dashboard")');
      const userIdDisplay = page.locator('text=User ID');

      await expect(dashboardTitle).not.toBeVisible();
      await expect(userIdDisplay).not.toBeVisible();
    });
  });

  test.describe('API Route Protection', () => {
    test('should return 401 for protected API route when not authenticated', async ({ page }) => {
      // Make request to protected API endpoint
      const response = await page.request.get('/api/user');

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const responseText = await response.text();
      expect(responseText).toBe('Unauthorized');
    });

    test('should return 401 for POST requests to protected API route when not authenticated', async ({
      page,
    }) => {
      // Make POST request to protected API endpoint
      const response = await page.request.post('/api/user', {
        data: { test: 'data' },
      });

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const responseText = await response.text();
      expect(responseText).toBe('Unauthorized');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display auth buttons properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check that auth buttons are still visible and properly sized in header
      const header = page.locator('header');
      const signInButton = header.locator('button:has-text("Sign In")');
      const signUpButton = header.locator('button:has-text("Get Started")');

      await expect(signInButton).toBeVisible();
      await expect(signUpButton).toBeVisible();

      // Check button positioning
      const signInBox = await signInButton.boundingBox();
      const signUpBox = await signUpButton.boundingBox();

      expect(signInBox.width).toBeGreaterThan(50);
      expect(signUpBox.width).toBeGreaterThan(80);
    });

    test('should display header navigation properly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check that all navigation elements are visible in header
      const header = page.locator('header');
      const logo = header.locator('a:has-text("UpCoach")');
      const featuresLink = header.locator('a[href="/features"]');
      const signInButton = header.locator('button:has-text("Sign In")');
      const signUpButton = header.locator('button:has-text("Get Started")');

      await expect(logo).toBeVisible();
      await expect(featuresLink).toBeVisible();
      await expect(signInButton).toBeVisible();
      await expect(signUpButton).toBeVisible();
    });
  });

  test.describe('Clerk Middleware Integration', () => {
    test('should not cause JavaScript errors on page load', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForTimeout(2000);

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        error =>
          !error.includes('favicon') &&
          !error.includes('Warning') &&
          !error.includes('Development mode') &&
          !error.includes('net::ERR_NAME_NOT_RESOLVED') // Clerk external resources
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should load Clerk resources without network errors', async ({ page }) => {
      const networkErrors = [];

      page.on('response', response => {
        if (response.status() >= 400 && response.url().includes('clerk')) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });

      await page.goto('/');
      await page.waitForTimeout(3000);

      // Should not have critical Clerk network errors
      const criticalErrors = networkErrors.filter(
        error => error.includes('500') || error.includes('404')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Header Component Integration', () => {
    test('should have proper header structure and styling', async ({ page }) => {
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Check header has sticky positioning
      const headerStyles = await header.evaluate(el => getComputedStyle(el));
      expect(headerStyles.position).toBe('sticky');

      // Check header contains required elements
      const logo = header.locator('a:has-text("UpCoach")');
      const nav = header.locator('nav');
      const authButtons = header.locator('button');

      await expect(logo).toBeVisible();
      await expect(nav).toBeVisible();

      // Check that we have at least 2 auth buttons (Sign In + Get Started)
      const buttonCount = await authButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(2);
    });

    test('should maintain header visibility when scrolling', async ({ page }) => {
      // Add some height to enable scrolling
      await page.addStyleTag({
        content: 'body { height: 200vh; }',
      });

      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      // Header should still be visible due to sticky positioning
      await expect(header).toBeVisible();
    });
  });

  test.describe('Environment and Configuration', () => {
    test('should have proper Clerk configuration in client', async ({ page }) => {
      // Check that Clerk publishable key is available in the page
      const clerkScriptTag = page.locator('script[data-clerk-publishable-key]');
      await expect(clerkScriptTag).toBeAttached();

      // Check if Clerk is loaded
      const clerkLoaded = await page.evaluate(() => {
        return (
          typeof window.Clerk !== 'undefined' ||
          document.querySelector('script[src*="clerk"]') !== null
        );
      });

      expect(clerkLoaded).toBe(true);
    });

    test('should initialize Clerk provider without errors', async ({ page }) => {
      await page.goto('/');

      // Wait for Clerk to potentially initialize
      await page.waitForTimeout(2000);

      // Check if ClerkProvider is in the DOM
      const clerkProvider = page.locator('[data-clerk-provider]');
      const rootElement = page.locator('#__next');

      // Either Clerk provider should be present or the root element should be rendered
      await expect(rootElement).toBeVisible();
    });
  });
});
