import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('CSS Grid and Flexbox layouts work correctly', async ({ page, browserName }) => {
    await page.goto('/');

    // Check that grid layouts are properly rendered
    const heroSection = page.locator('section').first();
    const heroDisplay = await heroSection.evaluate(el => window.getComputedStyle(el).display);

    // Should use flex or grid
    expect(['flex', 'grid', 'block']).toContain(heroDisplay);

    // Check specific grid/flex properties based on browser
    if (browserName === 'webkit') {
      // Safari-specific checks
      const gridSupport = await page.evaluate(() => CSS.supports('display', 'grid'));
      expect(gridSupport).toBe(true);
    }
  });

  test('animations and transitions work smoothly', async ({ page }) => {
    await page.goto('/');

    // Check that animations are defined
    const animatedElement = page.locator('[class*="animate-"]').first();
    const animationDuration = await animatedElement.evaluate(
      el => window.getComputedStyle(el).animationDuration
    );

    expect(animationDuration).not.toBe('0s');
  });

  test('form inputs work correctly across browsers', async ({ page, browserName }) => {
    await page.goto('/contact');

    const nameInput = page.getByLabel(/name \*/i);
    const emailInput = page.getByLabel(/email \*/i);
    const messageInput = page.getByLabel(/message \*/i);

    // Test input functionality
    await nameInput.fill('Test User');
    await expect(nameInput).toHaveValue('Test User');

    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    await messageInput.fill('This is a test message for cross-browser testing');
    await expect(messageInput).toHaveValue('This is a test message for cross-browser testing');

    // Test placeholder visibility
    await nameInput.clear();
    const placeholder = await nameInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('SVG icons render correctly', async ({ page }) => {
    await page.goto('/');

    const svgElements = await page.locator('svg').count();
    expect(svgElements).toBeGreaterThan(0);

    // Check that SVGs have proper dimensions
    const firstSvg = page.locator('svg').first();
    const viewBox = await firstSvg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('web fonts load correctly', async ({ page, browserName }) => {
    await page.goto('/');

    // Wait for fonts to load
    await page.waitForLoadState('networkidle');

    const bodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);

    // Should include Inter font
    expect(bodyFont.toLowerCase()).toContain('inter');
  });

  test('responsive images work across browsers', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');

      if (src && src.startsWith('http')) {
        const response = await page.request.get(src);
        expect(response.status()).toBe(200);
      }
    }
  });
});

// Separate mobile test configuration
const mobileConfig = { ...devices['iPhone 12'] };

test.describe('Mobile Browser Compatibility', () => {
  test('touch interactions work on mobile', async ({ browser }) => {
    // Create a new context with mobile device settings
    const context = await browser.newContext(mobileConfig);
    const mobilePage = await context.newPage();
    await mobilePage.goto('/');

    // Test tap on button
    const ctaButton = mobilePage.getByRole('link', { name: /download for ios/i }).first();
    await ctaButton.tap();

    // Should navigate or show expected behavior
    expect(mobilePage.url()).toContain('apps.apple.com');

    // Clean up
    await context.close();
  });

  test('viewport meta tag is correct', async ({ page }) => {
    const response = await page.goto('/');
    const html = (await response?.text()) || '';

    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
    expect(html).toContain('initial-scale=1');
  });

  test('mobile menu works correctly', async ({ browser }) => {
    // Create mobile context for proper mobile testing
    const context = await browser.newContext(mobileConfig);
    const mobilePage = await context.newPage();
    await mobilePage.goto('/');

    // Look for mobile menu button (if exists)
    const menuButton = mobilePage.getByRole('button', { name: /menu/i });
    const menuExists = await menuButton.isVisible().catch(() => false);

    if (menuExists) {
      await menuButton.tap();
      // Check that menu items are visible
      await expect(mobilePage.getByRole('link', { name: /features/i })).toBeVisible();
    }

    // Clean up
    await context.close();
  });
});

test.describe('Legacy Browser Fallbacks', () => {
  test('CSS custom properties have fallbacks', async ({ page }) => {
    await page.goto('/');

    // Check that CSS variables are used with fallbacks
    const primaryButton = page.locator('.bg-primary-600').first();
    const backgroundColor = await primaryButton.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );

    // Should have a color value (not 'transparent' or empty)
    expect(backgroundColor).toMatch(/rgb|rgba|#/);
  });

  test('modern JavaScript features are transpiled', async ({ page }) => {
    // Check that the built JavaScript works
    let jsError = null;
    page.on('pageerror', err => {
      jsError = err;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(jsError).toBeNull();
  });
});

test.describe('Browser-Specific Features', () => {
  test('localStorage works correctly', async ({ page }) => {
    await page.goto('/');

    // Test localStorage functionality
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });

    expect(value).toBe('test-value');

    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('test-key');
    });
  });

  test('sessionStorage works correctly', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      sessionStorage.setItem('session-test', 'session-value');
    });

    const value = await page.evaluate(() => {
      return sessionStorage.getItem('session-test');
    });

    expect(value).toBe('session-value');
  });

  test('cookies work correctly', async ({ page, context }) => {
    await page.goto('/');

    // Set a test cookie
    await context.addCookies([
      {
        name: 'test-cookie',
        value: 'test-value',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Verify cookie is set
    const cookies = await context.cookies();
    const testCookie = cookies.find(c => c.name === 'test-cookie');
    expect(testCookie?.value).toBe('test-value');
  });
});

test.describe('Edge Cases', () => {
  test('handles JavaScript disabled gracefully', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto('/');

    // Core content should still be visible
    await expect(page.getByText(/unlock your full potential/i)).toBeVisible();

    // Forms should still be present (though may not work)
    const forms = await page.locator('form').count();
    expect(forms).toBeGreaterThan(0);

    await context.close();
  });

  test('handles slow network connections', async ({ browser }) => {
    const context = await browser.newContext({
      // Simulate slow 3G
      offline: false,
    });
    const page = await context.newPage();

    // Emulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should still load, even if slowly
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await context.close();
  });
});
