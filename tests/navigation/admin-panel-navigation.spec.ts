import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - replace with actual auth flow
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@upcoach.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Sidebar Navigation', () => {
    test('should render all main navigation items', async ({ page }) => {
      const expectedNavItems = [
        'System Overview',
        'User Management',
        'Content Moderation',
        'Advanced Analytics',
        'Financial Management',
        'System Configuration'
      ];

      for (const item of expectedNavItems) {
        await expect(page.locator(`[data-mcp="sidebar-nav-item"]:has-text("${item}")`)).toBeVisible();
      }
    });

    test('should expand/collapse navigation groups', async ({ page }) => {
      // Test User Management expansion
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("User Management")');
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Users")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Roles & Permissions")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("User Activity")')).toBeVisible();

      // Test collapse
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("User Management")');
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Users")')).toBeHidden();
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/users');
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("User Management")')).toBeVisible();

      await page.goto('/analytics/users');
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("Advanced Analytics")')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display correct breadcrumbs for nested routes', async ({ page }) => {
      await page.goto('/users/roles');

      const breadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(breadcrumbs).toEqual(['User Management', 'Roles & Permissions']);
    });

    test('should display breadcrumbs for analytics pages', async ({ page }) => {
      await page.goto('/analytics/content');

      const breadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(breadcrumbs).toEqual(['Advanced Analytics', 'Content Performance']);
    });

    test('should display breadcrumbs for financial pages', async ({ page }) => {
      await page.goto('/financial/subscriptions');

      const breadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(breadcrumbs).toEqual(['Financial Management', 'Subscriptions']);
    });

    test('breadcrumb links should be clickable', async ({ page }) => {
      await page.goto('/moderation/pending');

      // Click on parent breadcrumb
      await page.click('[data-mcp="breadcrumb-link"]:has-text("Content Moderation")');
      await page.waitForURL('/moderation');

      expect(page.url()).toContain('/moderation');
    });
  });

  test.describe('Route Navigation', () => {
    test('should navigate to dashboard from any page', async ({ page }) => {
      await page.goto('/users');
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("System Overview")');
      await page.waitForURL('/dashboard');

      expect(page.url()).toContain('/dashboard');
    });

    test('should navigate through user management pages', async ({ page }) => {
      await page.goto('/users');

      // Navigate to roles page
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("User Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Roles & Permissions")');
      await page.waitForURL('/users/roles');

      // Navigate to activity page
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("User Activity")');
      await page.waitForURL('/users/activity');

      expect(page.url()).toContain('/users/activity');
    });

    test('should navigate through moderation pages', async ({ page }) => {
      await page.goto('/moderation');

      // Navigate to pending moderation
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Moderation")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Pending Review")');
      await page.waitForURL('/moderation/pending');

      // Check for badge on pending items
      await expect(page.locator('[data-mcp="nav-badge"]:has-text("New")')).toBeVisible();
    });

    test('should navigate through analytics pages', async ({ page }) => {
      await page.goto('/analytics');

      // Navigate to user metrics
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Advanced Analytics")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("User Metrics")');
      await page.waitForURL('/analytics/users');

      // Navigate to system health
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("System Health")');
      await page.waitForURL('/analytics/system');

      expect(page.url()).toContain('/analytics/system');
    });
  });

  test.describe('Navigation State Persistence', () => {
    test('should maintain sidebar state on page refresh', async ({ page }) => {
      await page.goto('/users/roles');

      // Expand navigation and navigate
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("User Management")');
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Roles & Permissions")')).toBeVisible();

      // Refresh page
      await page.reload();

      // Check that navigation state is maintained
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Roles & Permissions")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("User Management")')).toBeVisible();
    });

    test('should restore navigation state after browser back/forward', async ({ page }) => {
      await page.goto('/dashboard');
      await page.goto('/users');
      await page.goto('/analytics');

      // Go back
      await page.goBack();
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("User Management")')).toBeVisible();

      // Go forward
      await page.goForward();
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("Advanced Analytics")')).toBeVisible();
    });
  });

  test.describe('User Menu Navigation', () => {
    test('should display user menu and logout', async ({ page }) => {
      await page.click('[data-mcp="user-menu-button"]');

      await expect(page.locator('[data-mcp="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-mcp="user-menu-item"]:has-text("Settings")')).toBeVisible();
      await expect(page.locator('[data-mcp="user-menu-item"]:has-text("Logout")')).toBeVisible();
    });

    test('should navigate to settings from user menu', async ({ page }) => {
      await page.click('[data-mcp="user-menu-button"]');
      await page.click('[data-mcp="user-menu-item"]:has-text("Settings")');

      // Assuming settings redirects to system settings or profile settings
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/settings/);
    });

    test('should logout and redirect to login', async ({ page }) => {
      await page.click('[data-mcp="user-menu-button"]');
      await page.click('[data-mcp="user-menu-item"]:has-text("Logout")');

      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should toggle mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');

      // Check that sidebar is hidden on mobile
      await expect(page.locator('[data-mcp="sidebar"]')).toBeHidden();

      // Click hamburger menu
      await page.click('[data-mcp="mobile-nav-toggle"]');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();

      // Close sidebar
      await page.click('[data-mcp="sidebar-close"]');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeHidden();
    });

    test('should show permanent sidebar on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/dashboard');

      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-mcp="mobile-nav-toggle"]')).toBeHidden();
    });
  });

  test.describe('Notification Badge', () => {
    test('should display notification count in header', async ({ page }) => {
      // Mock notifications
      await page.route('**/api/notifications/count', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 5 })
        });
      });

      await page.goto('/dashboard');
      await expect(page.locator('[data-mcp="notification-badge"]:has-text("5")')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 navigation gracefully', async ({ page }) => {
      await page.goto('/non-existent-route');

      // Should redirect to dashboard due to catch-all route
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });

    test('should handle unauthorized routes', async ({ page }) => {
      // Mock auth failure
      await page.route('**/api/auth/verify', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });

      await page.goto('/users');
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });
  });
});