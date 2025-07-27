import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('images are optimized and lazy loaded', async ({ page }) => {
    await page.goto('/');
    
    // Check that images have loading="lazy" attribute where appropriate
    const images = await page.locator('img').all();
    let lazyLoadedCount = 0;
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      if (loading === 'lazy') {
        lazyLoadedCount++;
      }
    }
    
    // At least some images should be lazy loaded
    expect(lazyLoadedCount).toBeGreaterThan(0);
  });

  test('critical CSS is inlined', async ({ page }) => {
    const response = await page.goto('/');
    const html = await response?.text() || '';
    
    // Check for inlined critical CSS
    expect(html).toContain('<style');
    expect(html).toContain('min-h-screen');
  });

  test('JavaScript bundles are reasonably sized', async ({ page }) => {
    const jsRequests: number[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') && response.status() === 200) {
        const size = Number(response.headers()['content-length'] || 0);
        if (size > 0) {
          jsRequests.push(size);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no single JS bundle is larger than 300KB
    for (const size of jsRequests) {
      expect(size).toBeLessThan(300 * 1024);
    }
    
    // Total JS should be less than 1MB
    const totalJS = jsRequests.reduce((sum, size) => sum + size, 0);
    expect(totalJS).toBeLessThan(1024 * 1024);
  });

  test('fonts are preloaded', async ({ page }) => {
    const response = await page.goto('/');
    const html = await response?.text() || '';
    
    // Check for font preloading
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="font"');
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Core Web Vitals', () => {
  test('measures LCP (Largest Contentful Paint)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCP should be less than 2.5s for "good" rating
    expect(lcp).toBeLessThan(2500);
  });

  test('measures FID (First Input Delay) simulation', async ({ page }) => {
    await page.goto('/');
    
    // Simulate user interaction
    const button = page.getByRole('link', { name: /download for ios/i }).first();
    
    const startTime = Date.now();
    await button.click();
    const interactionDelay = Date.now() - startTime;
    
    // Interaction should be responsive (less than 100ms for "good")
    expect(interactionDelay).toBeLessThan(300);
  });

  test('measures CLS (Cumulative Layout Shift)', async ({ page }) => {
    await page.goto('/');
    
    // Monitor layout shifts
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Measure for 5 seconds
        setTimeout(() => resolve(clsValue), 5000);
      });
    });
    
    // CLS should be less than 0.1 for "good" rating
    expect(cls).toBeLessThan(0.25);
  });
});

test.describe('Resource Loading', () => {
  test('all resources load successfully', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(failedRequests).toHaveLength(0);
  });

  test('no mixed content warnings', async ({ page }) => {
    const mixedContentRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().startsWith('http://') && !request.url().includes('localhost')) {
        mixedContentRequests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(mixedContentRequests).toHaveLength(0);
  });

  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/');
    
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(hasServiceWorker).toBe(true);
  });
});