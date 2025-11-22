import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = '/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/design-review-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('UpCoach Design Review', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('Landing Page - Desktop Design Review', async () => {
    // Phase 1: Desktop Viewport (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-desktop-full.png'),
      fullPage: true
    });

    // Test interactive elements
    const buttons = page.locator('button, [role="button"], a[href]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Test hover state
        await button.hover();
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `landing-desktop-button-${i}-hover.png`)
        });
      }
    }

    // Test navigation
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const navCount = await navLinks.count();
    console.log(`Found ${navCount} navigation links`);

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Take screenshot of above-the-fold content
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-desktop-hero.png'),
      clip: { x: 0, y: 0, width: 1440, height: 900 }
    });

    console.log('Console errors:', consoleErrors);
  });

  test('Landing Page - Tablet Responsiveness', async () => {
    // Phase 2: Tablet Viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-tablet-full.png'),
      fullPage: true
    });

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    console.log('Has horizontal scroll on tablet:', hasHorizontalScroll);
  });

  test('Landing Page - Mobile Responsiveness', async () => {
    // Phase 3: Mobile Viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-mobile-full.png'),
      fullPage: true
    });

    // Test touch targets (minimum 44px)
    const touchTargets = await page.locator('button, [role="button"], a[href], input, select, textarea').evaluateAll((elements) => {
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          text: el.textContent?.trim() || el.getAttribute('aria-label') || 'No text'
        };
      });
    });

    const smallTouchTargets = touchTargets.filter(target =>
      target.width < 44 || target.height < 44
    );

    console.log('Small touch targets (< 44px):', smallTouchTargets);
  });

  test('Accessibility Audit', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log('First focusable element:', focusedElement);

    // Test focus visibility
    const focusedElementScreenshot = await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-focus-first.png')
    });

    // Check for missing alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    console.log('Images without alt text:', imagesWithoutAlt);

    // Check for form labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.filter(input => {
        const id = input.getAttribute('id');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledby = input.getAttribute('aria-labelledby');
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
      }).length;
    });

    console.log('Form inputs without proper labels:', inputsWithoutLabels);
  });

  test('Color Contrast Analysis', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Extract text elements and their computed styles
    const textElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button'));
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim().substring(0, 50) || '',
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      }).filter(item => item.text.length > 0);
    });

    console.log('Text elements for contrast analysis:', textElements.slice(0, 10));
  });

  test('Performance and Loading States', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Start performance monitoring
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Capture loading state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing-loading.png')
    });

    await page.waitForLoadState('networkidle');

    // Test form validation if forms exist
    const forms = await page.locator('form').count();
    console.log('Number of forms found:', forms);

    if (forms > 0) {
      // Test first form
      const firstForm = page.locator('form').first();
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]');

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'landing-form-validation.png')
        });
      }
    }
  });
});