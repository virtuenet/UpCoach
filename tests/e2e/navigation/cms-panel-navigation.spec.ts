import { test, expect } from '@playwright/test';

/**
 * CMS Panel Navigation Test Suite
 * Tests navigation hierarchy, sidebar rendering, and breadcrumb functionality
 */

// Test data for navigation structure
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
  { name: 'Content', href: '/content', icon: 'FileText' },
  { name: 'Courses', href: '/courses', icon: 'BookOpen' },
  { name: 'Media Library', href: '/media', icon: 'Image' },
  { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { name: 'Settings', href: '/settings', icon: 'Settings' },
];

const nestedRoutes = [
  { path: '/content/create', parent: 'Content', title: 'Create Article' },
  { path: '/content/edit/123', parent: 'Content', title: 'Edit Article' },
  { path: '/courses/create', parent: 'Courses', title: 'Create Course' },
];

test.describe('CMS Panel Navigation Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.goto('http://localhost:8007/login');
    
    // Simulate login process - adjust based on actual auth implementation
    await page.fill('[data-testid="email-input"]', 'admin@upcoach.ai');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test.describe('Sidebar Navigation Rendering', () => {
    test('should render all main navigation items', async ({ page }) => {
      // Verify sidebar is visible
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();

      // Check each navigation item
      for (const item of navigationItems) {
        const navLink = page.locator(`[data-testid="nav-${item.name.toLowerCase().replace(' ', '-')}"]`);
        await expect(navLink).toBeVisible();
        await expect(navLink).toHaveText(item.name);
        await expect(navLink).toHaveAttribute('href', item.href);
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      // Test each main route for active state
      for (const item of navigationItems) {
        await page.goto(`http://localhost:8007${item.href}`);
        
        const activeNavLink = page.locator(`[data-testid="nav-${item.name.toLowerCase().replace(' ', '-')}"]`);
        await expect(activeNavLink).toHaveClass(/bg-secondary-100|text-secondary-900/);
      }
    });

    test('should maintain active state on page refresh', async ({ page }) => {
      await page.goto('http://localhost:8007/content');
      await page.reload();
      
      const activeNavLink = page.locator('[data-testid="nav-content"]');
      await expect(activeNavLink).toHaveClass(/bg-secondary-100|text-secondary-900/);
    });
  });

  test.describe('Navigation State Management', () => {
    test('should navigate correctly between main sections', async ({ page }) => {
      for (const item of navigationItems) {
        await page.click(`[data-testid="nav-${item.name.toLowerCase().replace(' ', '-')}"]`);
        await expect(page).toHaveURL(`*${item.href}`);
        
        // Verify page content loads
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test('should handle dashboard root redirect', async ({ page }) => {
      await page.goto('http://localhost:8007/');
      await expect(page).toHaveURL('**/dashboard');
    });

    test('should handle 404 redirects', async ({ page }) => {
      await page.goto('http://localhost:8007/nonexistent-route');
      await expect(page).toHaveURL('**/dashboard'); // Should redirect to dashboard
    });
  });

  test.describe('Nested Route Navigation', () => {
    test('should navigate to nested create routes', async ({ page }) => {
      // Test content creation route
      await page.goto('http://localhost:8007/content');
      await page.click('[data-testid="create-article-button"]');
      await expect(page).toHaveURL('**/content/create');
      
      // Verify parent navigation still shows active
      const contentNav = page.locator('[data-testid="nav-content"]');
      await expect(contentNav).toHaveClass(/bg-secondary-100|text-secondary-900/);
    });

    test('should navigate to nested edit routes', async ({ page }) => {
      // Navigate to content list
      await page.goto('http://localhost:8007/content');
      
      // Click edit button on first article (if exists)
      const editButton = page.locator('[data-testid="edit-article"]:first-of-type');
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page).toHaveURL(/.*\/content\/edit\/\d+/);
        
        // Verify parent navigation still shows active
        const contentNav = page.locator('[data-testid="nav-content"]');
        await expect(contentNav).toHaveClass(/bg-secondary-100|text-secondary-900/);
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

    test('should show mobile menu toggle', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]');
      await expect(mobileMenuButton).toBeVisible();
    });

    test('should open and close mobile sidebar', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      const mobileSidebar = page.locator('[data-testid="mobile-sidebar"]');
      await expect(mobileSidebar).toBeVisible();
      
      // Close mobile menu
      await page.click('[data-testid="mobile-menu-close"]');
      await expect(mobileSidebar).toBeHidden();
    });

    test('should navigate via mobile menu', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      // Open mobile menu and navigate
      await page.click('[data-testid="mobile-menu-toggle"]');
      await page.click('[data-testid="mobile-nav-content"]');
      
      await expect(page).toHaveURL('**/content');
      
      // Verify mobile menu closes after navigation
      const mobileSidebar = page.locator('[data-testid="mobile-sidebar"]');
      await expect(mobileSidebar).toBeHidden();
    });
  });

  test.describe('Authentication Integration', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Clear auth state
      await page.context().clearCookies();
      await page.goto('http://localhost:8007/dashboard');
      
      await expect(page).toHaveURL('**/login');
    });

    test('should show user info in sidebar', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      const userSection = page.locator('[data-testid="user-section"]');
      await expect(userSection).toBeVisible();
      
      const logoutButton = page.locator('[data-testid="logout-button"]');
      await expect(logoutButton).toBeVisible();
    });

    test('should logout and redirect to login', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL('**/login');
    });
  });

  test.describe('Accessibility Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      // Focus first navigation item
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      
      // Navigate through sidebar items
      for (const item of navigationItems) {
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(`*${item.href}`);
        await page.keyboard.press('Tab');
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toHaveAttribute('role', 'navigation');
      await expect(sidebar).toHaveAttribute('aria-label', /navigation|menu/i);
      
      // Check navigation items have proper labels
      for (const item of navigationItems) {
        const navLink = page.locator(`[data-testid="nav-${item.name.toLowerCase().replace(' ', '-')}"]`);
        await expect(navLink).toHaveAttribute('aria-label', new RegExp(item.name, 'i'));
      }
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show loading states during navigation', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      // Mock slow navigation
      await page.route('**/content', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      await page.click('[data-testid="nav-content"]');
      
      // Check for loading indicator
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for content to load
      await expect(page.locator('main')).toBeVisible();
      await expect(loadingIndicator).toBeHidden();
    });

    test('should handle navigation errors gracefully', async ({ page }) => {
      await page.goto('http://localhost:8007/dashboard');
      
      // Mock navigation error
      await page.route('**/analytics', route => {
        route.abort('failed');
      });
      
      await page.click('[data-testid="nav-analytics"]');
      
      // Should show error state or fallback
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });
  });
});

/**
 * Breadcrumb Navigation Tests
 * Note: Currently not implemented in CMS Panel, these tests will fail
 * Include as documentation for future implementation
 */
test.describe('Breadcrumb Navigation (Future Implementation)', () => {
  test.skip('should display breadcrumbs for nested routes', async ({ page }) => {
    await page.goto('http://localhost:8007/content/create');
    
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toBeVisible();
    
    // Should show: Home > Content > Create
    const breadcrumbItems = page.locator('[data-testid="breadcrumb-item"]');
    await expect(breadcrumbItems).toHaveCount(3);
    
    await expect(breadcrumbItems.nth(0)).toHaveText('Home');
    await expect(breadcrumbItems.nth(1)).toHaveText('Content');
    await expect(breadcrumbItems.nth(2)).toHaveText('Create');
  });

  test.skip('should support breadcrumb navigation', async ({ page }) => {
    await page.goto('http://localhost:8007/content/create');
    
    // Click on Content breadcrumb
    await page.click('[data-testid="breadcrumb-content"]');
    await expect(page).toHaveURL('**/content');
    
    // Click on Home breadcrumb
    await page.goto('http://localhost:8007/content/create');
    await page.click('[data-testid="breadcrumb-home"]');
    await expect(page).toHaveURL('**/dashboard');
  });
});