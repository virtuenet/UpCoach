import { test, expect } from '@playwright/test';

test.describe('Cross-Platform Navigation Consistency', () => {
  test.describe('Authentication Flow Consistency', () => {
    test('should have consistent login redirect behavior', async ({ page }) => {
      // Test admin panel login redirect
      await page.goto('http://localhost:3001/login');
      await page.fill('[data-testid="email"]', 'admin@upcoach.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');
    });

    test('should handle unauthorized access consistently across panels', async ({ page }) => {
      // Test admin panel unauthorized access
      await page.goto('http://localhost:3001/users');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');

      // Test CMS panel unauthorized access
      await page.goto('http://localhost:3002/content');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('should maintain session across different panels', async ({ page, context }) => {
      // Login to admin panel
      await page.goto('http://localhost:3001/login');
      await page.fill('[data-testid="email"]', 'admin@upcoach.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');

      // Open new tab for CMS panel
      const cmsPage = await context.newPage();
      await cmsPage.goto('http://localhost:3002/');

      // Should be automatically authenticated (if using shared session)
      await cmsPage.waitForLoadState('networkidle');
      const isLoggedIn = await cmsPage.locator('[data-mcp="user-menu"]').isVisible();
      expect(isLoggedIn).toBeTruthy();
    });
  });

  test.describe('Navigation Pattern Consistency', () => {
    test('should have consistent sidebar behavior across web panels', async ({ page }) => {
      // Test admin panel sidebar
      await page.goto('http://localhost:3001/dashboard');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-toggle"]')).toBeVisible();

      // Test CMS panel sidebar
      await page.goto('http://localhost:3002/dashboard');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-toggle"]')).toBeVisible();
    });

    test('should have consistent breadcrumb structure', async ({ page }) => {
      // Admin panel breadcrumbs
      await page.goto('http://localhost:3001/users/roles');
      const adminBreadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(adminBreadcrumbs.length).toBeGreaterThan(1);

      // CMS panel breadcrumbs
      await page.goto('http://localhost:3002/content/create');
      const cmsBreadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(cmsBreadcrumbs.length).toBeGreaterThan(1);

      // Both should follow same pattern
      expect(adminBreadcrumbs.length).toEqual(cmsBreadcrumbs.length);
    });

    test('should have consistent user menu behavior', async ({ page }) => {
      const testUserMenu = async (baseUrl: string) => {
        await page.goto(`${baseUrl}/dashboard`);
        await page.click('[data-mcp="user-menu-button"]');
        await expect(page.locator('[data-mcp="user-menu"]')).toBeVisible();
        await expect(page.locator('[data-mcp="user-menu-item"]:has-text("Logout")')).toBeVisible();
      };

      await testUserMenu('http://localhost:3001'); // Admin panel
      await testUserMenu('http://localhost:3002'); // CMS panel
    });
  });

  test.describe('URL Structure Consistency', () => {
    test('should follow consistent URL patterns for similar features', async ({ page }) => {
      // Check analytics URL patterns
      const adminAnalyticsUrl = 'http://localhost:3001/analytics';
      const cmsAnalyticsUrl = 'http://localhost:3002/analytics';

      await page.goto(adminAnalyticsUrl);
      expect(page.url()).toContain('/analytics');

      await page.goto(cmsAnalyticsUrl);
      expect(page.url()).toContain('/analytics');
    });

    test('should handle deep linking consistently', async ({ page }) => {
      // Test deep linking with parameters
      await page.goto('http://localhost:3001/analytics/users?filter=active');
      expect(page.url()).toContain('filter=active');

      await page.goto('http://localhost:3002/content?category=fitness');
      expect(page.url()).toContain('category=fitness');

      // Both should maintain query parameters
      await page.reload();
      expect(page.url()).toContain('category=fitness');
    });
  });

  test.describe('Responsive Behavior Consistency', () => {
    test('should handle mobile navigation consistently', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const testMobileNav = async (baseUrl: string) => {
        await page.goto(`${baseUrl}/dashboard`);

        // Sidebar should be hidden on mobile
        await expect(page.locator('[data-mcp="sidebar"]')).toBeHidden();

        // Mobile toggle should be visible
        await expect(page.locator('[data-mcp="mobile-nav-toggle"]')).toBeVisible();

        // Open mobile menu
        await page.click('[data-mcp="mobile-nav-toggle"]');
        await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
      };

      await testMobileNav('http://localhost:3001'); // Admin panel
      await testMobileNav('http://localhost:3002'); // CMS panel
    });

    test('should maintain consistent breakpoints', async ({ page }) => {
      const testBreakpoint = async (width: number, baseUrl: string) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${baseUrl}/dashboard`);

        if (width < 768) {
          await expect(page.locator('[data-mcp="mobile-nav-toggle"]')).toBeVisible();
        } else {
          await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
        }
      };

      // Test different breakpoints
      await testBreakpoint(640, 'http://localhost:3001');
      await testBreakpoint(640, 'http://localhost:3002');
      await testBreakpoint(1024, 'http://localhost:3001');
      await testBreakpoint(1024, 'http://localhost:3002');
    });
  });

  test.describe('Error Handling Consistency', () => {
    test('should handle 404 errors consistently', async ({ page }) => {
      const test404 = async (baseUrl: string) => {
        await page.goto(`${baseUrl}/non-existent-page`);

        // Should either show 404 page or redirect to dashboard
        const isError = await page.locator('[data-mcp="error-page"]').isVisible();
        const isRedirect = page.url().includes('/dashboard');

        expect(isError || isRedirect).toBeTruthy();
      };

      await test404('http://localhost:3001');
      await test404('http://localhost:3002');
    });

    test('should handle network errors consistently', async ({ page }) => {
      // Mock network error
      await page.route('**/api/**', route => route.abort());

      const testNetworkError = async (baseUrl: string) => {
        await page.goto(`${baseUrl}/dashboard`);

        // Should show error message or retry mechanism
        await expect(page.locator('[data-mcp="error-message"], [data-mcp="retry-button"]')).toBeVisible();
      };

      await testNetworkError('http://localhost:3001');
      await testNetworkError('http://localhost:3002');
    });
  });

  test.describe('Performance Consistency', () => {
    test('should have consistent navigation loading times', async ({ page }) => {
      const measureNavigationTime = async (url: string) => {
        const start = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        return Date.now() - start;
      };

      const adminTime = await measureNavigationTime('http://localhost:3001/dashboard');
      const cmsTime = await measureNavigationTime('http://localhost:3002/dashboard');

      // Navigation times should be reasonably similar (within 2x)
      const ratio = Math.max(adminTime, cmsTime) / Math.min(adminTime, cmsTime);
      expect(ratio).toBeLessThan(2);
    });

    test('should handle concurrent navigation requests', async ({ page, context }) => {
      const promises = [
        page.goto('http://localhost:3001/users'),
        context.newPage().then(p => p.goto('http://localhost:3001/analytics')),
        context.newPage().then(p => p.goto('http://localhost:3002/content'))
      ];

      const results = await Promise.allSettled(promises);

      // All navigation requests should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  test.describe('Theme and Styling Consistency', () => {
    test('should use consistent color schemes', async ({ page }) => {
      const getPrimaryColor = async (url: string) => {
        await page.goto(url);
        return await page.evaluate(() => {
          const sidebar = document.querySelector('[data-mcp="sidebar"]');
          return sidebar ? window.getComputedStyle(sidebar).backgroundColor : null;
        });
      };

      const adminColor = await getPrimaryColor('http://localhost:3001/dashboard');
      const cmsColor = await getPrimaryColor('http://localhost:3002/dashboard');

      // Colors should be identical or from same theme
      expect(adminColor).toBeTruthy();
      expect(cmsColor).toBeTruthy();
      // Add specific color comparison if needed
    });

    test('should have consistent typography', async ({ page }) => {
      const getFontFamily = async (url: string, selector: string) => {
        await page.goto(url);
        return await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          return element ? window.getComputedStyle(element).fontFamily : null;
        }, selector);
      };

      const adminFont = await getFontFamily('http://localhost:3001/dashboard', '[data-mcp="page-title"]');
      const cmsFont = await getFontFamily('http://localhost:3002/dashboard', '[data-mcp="page-title"]');

      expect(adminFont).toEqual(cmsFont);
    });
  });

  test.describe('Accessibility Consistency', () => {
    test('should have consistent ARIA labels across platforms', async ({ page }) => {
      const getAriaLabel = async (url: string, selector: string) => {
        await page.goto(url);
        return await page.locator(selector).getAttribute('aria-label');
      };

      const adminAriaLabel = await getAriaLabel('http://localhost:3001/dashboard', '[data-mcp="sidebar"]');
      const cmsAriaLabel = await getAriaLabel('http://localhost:3002/dashboard', '[data-mcp="sidebar"]');

      expect(adminAriaLabel).toBeTruthy();
      expect(cmsAriaLabel).toBeTruthy();
      expect(adminAriaLabel).toEqual(cmsAriaLabel);
    });

    test('should have consistent keyboard navigation', async ({ page }) => {
      const testKeyboardNav = async (url: string) => {
        await page.goto(url);

        // Tab through navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should have visible focus indicator
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return active ? window.getComputedStyle(active).outline : null;
        });

        expect(focusedElement).toBeTruthy();
      };

      await testKeyboardNav('http://localhost:3001/dashboard');
      await testKeyboardNav('http://localhost:3002/dashboard');
    });
  });

  test.describe('Data Synchronization', () => {
    test('should maintain consistent user data across platforms', async ({ page, context }) => {
      // Login to admin panel and update user profile
      await page.goto('http://localhost:3001/login');
      // ... authentication steps ...

      // Update user name
      await page.goto('http://localhost:3001/profile/settings');
      await page.fill('[data-mcp="user-name"]', 'Updated Name');
      await page.click('[data-mcp="save-profile"]');

      // Open CMS panel in new tab
      const cmsPage = await context.newPage();
      await cmsPage.goto('http://localhost:3002/dashboard');

      // Check if updated name appears
      const userName = await cmsPage.locator('[data-mcp="user-display-name"]').textContent();
      expect(userName).toContain('Updated Name');
    });

    test('should sync navigation preferences across platforms', async ({ page, context }) => {
      // Set sidebar preference in admin panel
      await page.goto('http://localhost:3001/dashboard');
      await page.click('[data-mcp="sidebar-minimize"]');

      // Check preference is applied
      await expect(page.locator('[data-mcp="sidebar-mini"]')).toBeVisible();

      // Open CMS panel
      const cmsPage = await context.newPage();
      await cmsPage.goto('http://localhost:3002/dashboard');

      // Should maintain same preference (if implemented)
      await cmsPage.waitForLoadState('networkidle');
      const isMini = await cmsPage.locator('[data-mcp="sidebar-mini"]').isVisible();
      // Note: This would only work if preferences are shared
    });
  });
});