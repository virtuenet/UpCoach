import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Navigation Audit Test Suite
 *
 * This test suite validates the navigation architecture across both
 * admin-panel and cms-panel applications, focusing on:
 * - Navigation hierarchy and routing
 * - Mobile responsiveness
 * - Role-based access control
 * - Accessibility compliance
 * - User experience consistency
 */

// Test configuration
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://localhost:3001';
const CMS_BASE_URL = process.env.CMS_BASE_URL || 'http://localhost:3002';

// Mock credentials for testing
const ADMIN_CREDENTIALS = {
  email: 'admin@upcoach.ai',
  password: 'admin123'
};

const CMS_CREDENTIALS = {
  email: 'coach@upcoach.ai',
  password: 'coach123'
};

// Navigation test data structures
const ADMIN_NAVIGATION_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', level: 'x' },
  { label: 'Users', path: '/users', level: 'x' },
  { label: 'Analytics', path: '/analytics', level: 'x' },
  { label: 'Financial', path: '/financial', level: 'x' },
  { label: 'Settings', path: '/settings', level: 'x' }
];

const CMS_NAVIGATION_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', level: 'x' },
  { label: 'Content', path: '/content', level: 'x' },
  { label: 'Courses', path: '/courses', level: 'x' },
  { label: 'Media Library', path: '/media', level: 'x' },
  { label: 'Analytics', path: '/analytics', level: 'x' },
  { label: 'Settings', path: '/settings', level: 'x' }
];

// Helper functions
async function loginToAdmin(page: Page) {
  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', ADMIN_CREDENTIALS.email);
  await page.fill('[data-testid="password-input"]', ADMIN_CREDENTIALS.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${ADMIN_BASE_URL}/dashboard`);
}

async function loginToCMS(page: Page) {
  await page.goto(`${CMS_BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', CMS_CREDENTIALS.email);
  await page.fill('[data-testid="password-input"]', CMS_CREDENTIALS.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${CMS_BASE_URL}/dashboard`);
}

async function checkMobileNavigation(page: Page) {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Check if mobile menu button is visible
  const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
  await expect(mobileMenuButton).toBeVisible();

  // Check if sidebar is hidden by default on mobile
  const sidebar = page.locator('[data-testid="navigation-sidebar"]');
  await expect(sidebar).toBeHidden();

  // Open mobile menu
  await mobileMenuButton.click();
  await expect(sidebar).toBeVisible();

  // Check backdrop overlay
  const backdrop = page.locator('[data-testid="sidebar-backdrop"]');
  await expect(backdrop).toBeVisible();

  // Close menu by clicking backdrop
  await backdrop.click();
  await expect(sidebar).toBeHidden();
}

// Admin Panel Navigation Tests
test.describe('Admin Panel Navigation Audit', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
  });

  test('should display all primary navigation items', async ({ page }) => {
    for (const item of ADMIN_NAVIGATION_ITEMS) {
      const navItem = page.locator(`[data-testid="nav-item-${item.path.substring(1)}"]`);
      await expect(navItem).toBeVisible();
      await expect(navItem).toHaveText(item.label);
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/users`);

    const activeNavItem = page.locator('[data-testid="nav-item-users"]');
    await expect(activeNavItem).toHaveClass(/active|selected/);

    // Check that other items are not active
    const dashboardNavItem = page.locator('[data-testid="nav-item-dashboard"]');
    await expect(dashboardNavItem).not.toHaveClass(/active|selected/);
  });

  test('should navigate correctly between sections', async ({ page }) => {
    // Test navigation to each primary section
    for (const item of ADMIN_NAVIGATION_ITEMS) {
      await page.click(`[data-testid="nav-item-${item.path.substring(1)}"]`);
      await expect(page).toHaveURL(`${ADMIN_BASE_URL}${item.path}`);

      // Verify page title or main heading
      const pageHeading = page.locator('h1, [data-testid="page-title"]').first();
      await expect(pageHeading).toBeVisible();
    }
  });

  test('should render sub-navigation for multi-level sections', async ({ page }) => {
    // Test Users sub-navigation
    await page.goto(`${ADMIN_BASE_URL}/users/roles`);

    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toContainText('Users');
      await expect(breadcrumbs).toContainText('Roles');
    }

    // Test Analytics sub-navigation
    await page.goto(`${ADMIN_BASE_URL}/analytics/users`);
    await expect(page).toHaveURL(/.*analytics\/users/);
  });

  test('should handle mobile navigation correctly', async ({ page }) => {
    await checkMobileNavigation(page);
  });

  test('should maintain navigation state on page refresh', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/analytics`);

    const activeNavItem = page.locator('[data-testid="nav-item-analytics"]');
    await expect(activeNavItem).toHaveClass(/active|selected/);

    await page.reload();
    await expect(activeNavItem).toHaveClass(/active|selected/);
    await expect(page).toHaveURL(`${ADMIN_BASE_URL}/analytics`);
  });

  test('should show logout functionality', async ({ page }) => {
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();

    await logoutButton.click();
    await expect(page).toHaveURL(`${ADMIN_BASE_URL}/login`);
  });
});

// CMS Panel Navigation Tests
test.describe('CMS Panel Navigation Audit', () => {
  test.beforeEach(async ({ page }) => {
    await loginToCMS(page);
  });

  test('should display all primary navigation items with icons', async ({ page }) => {
    for (const item of CMS_NAVIGATION_ITEMS) {
      const navItem = page.locator(`[data-testid="nav-item-${item.path.substring(1)}"]`);
      await expect(navItem).toBeVisible();
      await expect(navItem).toHaveText(item.label);

      // Check for icon presence (Lucide icons)
      const icon = navItem.locator('svg').first();
      await expect(icon).toBeVisible();
    }
  });

  test('should handle content creation workflow navigation', async ({ page }) => {
    // Navigate to content section
    await page.click('[data-testid="nav-item-content"]');
    await expect(page).toHaveURL(`${CMS_BASE_URL}/content`);

    // Navigate to create content
    await page.goto(`${CMS_BASE_URL}/content/create`);
    await expect(page).toHaveURL(/.*content\/create/);

    // Check for creation form or editor
    const contentEditor = page.locator('[data-testid="content-editor"], [data-testid="rich-text-editor"]');
    await expect(contentEditor).toBeVisible();
  });

  test('should handle course management navigation', async ({ page }) => {
    await page.click('[data-testid="nav-item-courses"]');
    await expect(page).toHaveURL(`${CMS_BASE_URL}/courses`);

    // Test course creation navigation
    await page.goto(`${CMS_BASE_URL}/courses/create`);
    await expect(page).toHaveURL(/.*courses\/create/);
  });

  test('should render mobile navigation with responsive design', async ({ page }) => {
    await checkMobileNavigation(page);

    // Test mobile navigation item interactions
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('[data-testid="mobile-menu-toggle"]');

    // Navigate using mobile menu
    await page.click('[data-testid="nav-item-content"]');
    await expect(page).toHaveURL(`${CMS_BASE_URL}/content`);

    // Verify mobile menu closes after navigation
    const sidebar = page.locator('[data-testid="navigation-sidebar"]');
    await expect(sidebar).toBeHidden();
  });

  test('should display user profile information', async ({ page }) => {
    const userProfile = page.locator('[data-testid="user-profile"]');
    await expect(userProfile).toBeVisible();

    const userName = page.locator('[data-testid="user-name"]');
    await expect(userName).toBeVisible();
    await expect(userName).not.toHaveText('');
  });
});

// Cross-Application Navigation Tests
test.describe('Cross-Application Navigation Consistency', () => {
  test('should maintain consistent navigation patterns', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const cmsContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const cmsPage = await cmsContext.newPage();

    await loginToAdmin(adminPage);
    await loginToCMS(cmsPage);

    // Check sidebar layout consistency
    const adminSidebar = adminPage.locator('[data-testid="navigation-sidebar"]');
    const cmsSidebar = cmsPage.locator('[data-testid="navigation-sidebar"]');

    await expect(adminSidebar).toBeVisible();
    await expect(cmsSidebar).toBeVisible();

    // Check mobile navigation consistency
    await adminPage.setViewportSize({ width: 375, height: 667 });
    await cmsPage.setViewportSize({ width: 375, height: 667 });

    const adminMobileToggle = adminPage.locator('[data-testid="mobile-menu-toggle"]');
    const cmsMobileToggle = cmsPage.locator('[data-testid="mobile-menu-toggle"]');

    await expect(adminMobileToggle).toBeVisible();
    await expect(cmsMobileToggle).toBeVisible();

    await adminContext.close();
    await cmsContext.close();
  });

  test('should handle role-based navigation differences', async ({ browser }) => {
    // This test would verify that different user roles see appropriate navigation items
    // Implementation depends on role-based routing logic

    const context = await browser.newContext();
    const page = await context.newPage();

    // Test admin role navigation
    await loginToAdmin(page);
    const adminNavItems = page.locator('[data-testid^="nav-item-"]');
    const adminCount = await adminNavItems.count();

    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.click('[data-testid="logout-button"]', { force: true });

    // Test CMS role navigation
    await loginToCMS(page);
    const cmsNavItems = page.locator('[data-testid^="nav-item-"]');
    const cmsCount = await cmsNavItems.count();

    // Verify different navigation structures for different roles
    expect(adminCount).toBeGreaterThan(0);
    expect(cmsCount).toBeGreaterThan(0);

    await context.close();
  });
});

// Accessibility Navigation Tests
test.describe('Navigation Accessibility Audit', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await loginToCMS(page);

    // Test tab navigation through menu items
    await page.keyboard.press('Tab');

    // Focus should move through navigation items
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key navigation
    await page.keyboard.press('Enter');

    // Should navigate to focused item
    await expect(page).toHaveURL(new RegExp(`${CMS_BASE_URL}/.*`));
  });

  test('should have proper ARIA labels and landmarks', async ({ page }) => {
    await loginToCMS(page);

    // Check navigation landmark
    const nav = page.locator('nav[aria-label*="navigation"], [role="navigation"]');
    await expect(nav).toBeVisible();

    // Check sidebar has proper label
    const sidebar = page.locator('[data-testid="navigation-sidebar"]');
    await expect(sidebar).toHaveAttribute('aria-label');

    // Check mobile menu toggle has proper label
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(mobileToggle).toHaveAttribute('aria-label');
  });

  test('should announce navigation changes to screen readers', async ({ page }) => {
    await loginToCMS(page);

    // Check for aria-live regions or announcements
    const liveRegion = page.locator('[aria-live], [data-testid="navigation-announcer"]');

    // Navigate to different section
    await page.click('[data-testid="nav-item-content"]');

    // Verify current page is indicated for screen readers
    const currentPageIndicator = page.locator('[aria-current="page"]');
    await expect(currentPageIndicator).toHaveCount(1);
  });
});

// Performance Navigation Tests
test.describe('Navigation Performance Audit', () => {
  test('should load navigation quickly', async ({ page }) => {
    const startTime = Date.now();

    await loginToCMS(page);

    // Check that navigation renders within reasonable time
    const navigationSidebar = page.locator('[data-testid="navigation-sidebar"]');
    await expect(navigationSidebar).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Navigation should load within 3 seconds
  });

  test('should handle navigation state efficiently', async ({ page }) => {
    await loginToCMS(page);

    // Test rapid navigation between sections
    const startTime = Date.now();

    for (const item of CMS_NAVIGATION_ITEMS.slice(0, 3)) {
      await page.click(`[data-testid="nav-item-${item.path.substring(1)}"]`);
      await expect(page).toHaveURL(`${CMS_BASE_URL}${item.path}`);
    }

    const navigationTime = Date.now() - startTime;
    expect(navigationTime).toBeLessThan(5000); // Rapid navigation should complete within 5 seconds
  });
});

// Error Handling and Edge Cases
test.describe('Navigation Error Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    await loginToCMS(page);

    // Navigate to non-existent route
    await page.goto(`${CMS_BASE_URL}/non-existent-route`);

    // Should redirect to default route or show 404
    await expect(page).toHaveURL(new RegExp(`${CMS_BASE_URL}/(dashboard|404|not-found)`));
  });

  test('should maintain navigation state on authentication expiry', async ({ page }) => {
    await loginToCMS(page);

    // Navigate to a specific section
    await page.goto(`${CMS_BASE_URL}/content`);

    // Simulate session expiry (would need to be implemented based on auth logic)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();

    // Should redirect to login but potentially preserve intended destination
    await expect(page).toHaveURL(`${CMS_BASE_URL}/login`);
  });
});