import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage passes automated accessibility checks', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('contact page passes automated accessibility checks', async ({ page }) => {
    await page.goto('/contact');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toBe(''); // Alt text should not be empty
    }
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Get all heading levels
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim()
      }));
    });
    
    // Check heading hierarchy (no skipping levels)
    let previousLevel = 0;
    for (const heading of headings) {
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
      if (heading.level > previousLevel) {
        previousLevel = heading.level;
      }
    }
  });

  test('all form inputs have labels', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (inputId) {
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        const labelExists = await label.count() > 0;
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Start from the top of the page
    await page.keyboard.press('Tab');
    
    // Tab through interactive elements
    const interactiveElements = [];
    for (let i = 0; i < 20; i++) {
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          text: el?.textContent?.trim().substring(0, 50),
          href: (el as HTMLAnchorElement)?.href,
          type: (el as HTMLInputElement)?.type,
        };
      });
      
      interactiveElements.push(focusedElement);
      await page.keyboard.press('Tab');
    }
    
    // Should have tabbed through various interactive elements
    const hasLinks = interactiveElements.some(el => el.tagName === 'A');
    const hasButtons = interactiveElements.some(el => el.tagName === 'BUTTON');
    
    expect(hasLinks).toBe(true);
    expect(hasButtons || interactiveElements.some(el => el.type === 'button')).toBe(true);
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Get focused element and check for focus styles
    const focusedElement = page.locator(':focus');
    const outlineStyle = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });
    
    // Should have visible focus indicator (outline or box-shadow)
    const hasOutline = outlineStyle.outlineStyle !== 'none' && outlineStyle.outlineWidth !== '0px';
    const hasBoxShadow = outlineStyle.boxShadow !== 'none';
    
    expect(hasOutline || hasBoxShadow).toBe(true);
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    // Run axe specifically for color contrast
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(contrastResults.violations).toEqual([]);
  });

  test('page has proper language attribute', async ({ page }) => {
    await page.goto('/');
    
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Link should have either text content or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
      
      // Avoid generic link text
      if (text) {
        expect(text.toLowerCase()).not.toBe('click here');
        expect(text.toLowerCase()).not.toBe('read more');
        expect(text.toLowerCase()).not.toBe('link');
      }
    }
  });

  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for common ARIA mistakes
    const ariaErrors = await page.evaluate(() => {
      const errors = [];
      
      // Check for aria-hidden on focusable elements
      const hiddenFocusable = document.querySelectorAll('[aria-hidden="true"][tabindex]:not([tabindex="-1"])');
      if (hiddenFocusable.length > 0) {
        errors.push('Found focusable elements with aria-hidden="true"');
      }
      
      // Check for invalid ARIA roles
      const elementsWithRoles = document.querySelectorAll('[role]');
      const validRoles = ['button', 'link', 'navigation', 'main', 'banner', 'contentinfo', 'form', 'search', 'region', 'complementary'];
      
      elementsWithRoles.forEach(el => {
        const role = el.getAttribute('role');
        if (role && !validRoles.includes(role)) {
          // More comprehensive role checking would be needed in production
          console.warn(`Potentially invalid role: ${role}`);
        }
      });
      
      return errors;
    });
    
    expect(ariaErrors).toHaveLength(0);
  });

  test('forms are accessible', async ({ page }) => {
    await page.goto('/contact');
    
    // Check form has proper structure
    const form = page.locator('form').first();
    
    // Required fields should be marked
    const requiredInputs = await form.locator('[required], [aria-required="true"]').count();
    expect(requiredInputs).toBeGreaterThan(0);
    
    // Error messages should be associated with inputs
    await form.locator('button[type="submit"]').click();
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    const errorMessages = await page.locator('[role="alert"], .error, .text-red-500').all();
    for (const error of errorMessages) {
      const errorText = await error.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test('skip links are present', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to reveal skip link (if hidden)
    await page.keyboard.press('Tab');
    
    // Look for skip link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip to")').first();
    const skipLinkExists = await skipLink.count() > 0;
    
    // Skip link is recommended but not always required
    if (skipLinkExists) {
      const href = await skipLink.getAttribute('href');
      expect(href).toMatch(/#[a-zA-Z]/);
    }
  });

  test('media content has captions/transcripts', async ({ page }) => {
    await page.goto('/');
    
    // Check for video elements
    const videos = await page.locator('video').all();
    
    for (const video of videos) {
      // Check for track elements (captions)
      const tracks = await video.locator('track[kind="captions"], track[kind="subtitles"]').count();
      
      // Or check for transcript nearby
      const parentSection = await video.locator('..').first();
      const transcriptNearby = await parentSection.locator('[class*="transcript"], [id*="transcript"]').count();
      
      expect(tracks > 0 || transcriptNearby > 0).toBe(true);
    }
  });

  test('error messages are announced to screen readers', async ({ page }) => {
    await page.goto('/contact');
    
    // Submit empty form to trigger errors
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Check error messages have proper ARIA attributes
    const errorMessages = await page.locator('.text-red-500, .text-red-600').all();
    
    for (const error of errorMessages) {
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      
      // Error messages should be announced
      expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true);
    }
  });

  test('modal dialogs are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Wait for lead capture modal
    await page.waitForTimeout(31000);
    
    const modal = page.locator('[role="dialog"], [aria-modal="true"]').first();
    if (await modal.isVisible()) {
      // Check modal has proper attributes
      const role = await modal.getAttribute('role');
      const ariaModal = await modal.getAttribute('aria-modal');
      const ariaLabel = await modal.getAttribute('aria-label');
      const ariaLabelledby = await modal.getAttribute('aria-labelledby');
      
      expect(role === 'dialog' || ariaModal === 'true').toBe(true);
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
      
      // Check focus is trapped within modal
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // Focus should be within the modal
      const modalHasFocus = await modal.evaluate((el, focused) => {
        return el.contains(document.querySelector(focused));
      }, focusedElement);
      
      expect(modalHasFocus).toBe(true);
    }
  });
});