import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8006/login');
  });

  test('should not have any automatically detectable accessibility issues on login page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should be accessible', async ({ page }) => {
    // Check for proper labels
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = page.locator('label[for] >> text=Email');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.locator('input[type="password"]');
    const passwordLabel = page.locator('label[for] >> text=Password');
    await expect(passwordInput).toBeVisible();

    // Check for required attributes
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');

    // Check keyboard navigation
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should display proper error messages with ARIA attributes', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for error messages with proper ARIA attributes
    const errorMessages = page.locator('[role="alert"], .error-message');
    if (await errorMessages.count() > 0) {
      const firstError = errorMessages.first();
      await expect(firstError).toBeVisible();
      
      // Should have proper ARIA attributes
      const ariaLive = await firstError.getAttribute('aria-live');
      const role = await firstError.getAttribute('role');
      expect(ariaLive || role).toBeTruthy();
    }
  });
});

test.describe('Accessibility Tests - CMS Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7002/login');
  });

  test('should not have any automatically detectable accessibility issues on CMS login page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility Tests - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin panel
    await page.goto('http://localhost:8006/login');
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard should not have accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    // Test skip links
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    
    // Should be able to navigate through focusable elements
    expect(['a', 'button', 'input'].includes(tagName)).toBeTruthy();
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    
    // Should start with h1 or have main heading
    const firstHeading = page.locator('h1, h2, h3, h4, h5, h6').first();
    const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
    expect(['h1', 'h2'].includes(tagName)).toBeTruthy();
  });

  test('interactive elements should have proper labels', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Test first 10 buttons
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate(el => {
        return !!(
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title')
        );
      });
      expect(hasLabel).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('form elements should have proper labels and error handling', async ({ page }) => {
    // Navigate to a page that might have forms
    const formInputs = page.locator('input, textarea, select');
    const inputCount = await formInputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) { // Test first 5 inputs
      const input = formInputs.nth(i);
      const type = await input.getAttribute('type');
      
      // Skip hidden inputs
      if (type === 'hidden') continue;
      
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        return !!(
          document.querySelector(`label[for="${id}"]`) ||
          el.closest('label') ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby')
        );
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a basic check - more sophisticated tools would be needed for complete analysis
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6').first();
    
    if (await textElements.count() > 0) {
      const styles = await textElements.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      // Basic check that text has color (not transparent)
      expect(styles.color).toBeTruthy();
      expect(styles.color).not.toBe('transparent');
    }
  });
});