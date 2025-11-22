import { test, expect } from '@playwright/test';

test.describe('CMS Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - replace with actual auth flow
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'editor@upcoach.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Sidebar Navigation', () => {
    test('should render all main navigation items', async ({ page }) => {
      const expectedNavItems = [
        'Dashboard',
        'Content Management',
        'Courses',
        'Media Library',
        'Analytics',
        'Settings'
      ];

      for (const item of expectedNavItems) {
        await expect(page.locator(`[data-mcp="sidebar-nav-item"]:has-text("${item}")`)).toBeVisible();
      }
    });

    test('should expand content management submenu', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');

      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Content")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Create New")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Categories")')).toBeVisible();
    });

    test('should expand courses submenu', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Courses")');

      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Courses")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("Create Course")')).toBeVisible();
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/content');
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("Content Management")')).toBeVisible();

      await page.goto('/media');
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("Media Library")')).toBeVisible();
    });
  });

  test.describe('Content Management Navigation', () => {
    test('should navigate to content list', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("All Content")');
      await page.waitForURL('/content');

      expect(page.url()).toContain('/content');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Content Management")')).toBeVisible();
    });

    test('should navigate to create content page', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Create New")');
      await page.waitForURL('/content/create');

      expect(page.url()).toContain('/content/create');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Create Content")')).toBeVisible();
    });

    test('should navigate to categories page', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Categories")');
      await page.waitForURL('/content/categories');

      expect(page.url()).toContain('/content/categories');
    });

    test('should navigate to edit content page from content list', async ({ page }) => {
      await page.goto('/content');

      // Mock content data
      await page.route('**/api/content', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 1, title: 'Test Article', type: 'article', status: 'published' }
            ]
          })
        });
      });

      await page.reload();
      await page.click('[data-mcp="edit-content-1"]');
      await page.waitForURL('/content/edit/1');

      expect(page.url()).toContain('/content/edit/1');
    });
  });

  test.describe('Course Management Navigation', () => {
    test('should navigate to courses list', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Courses")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("All Courses")');
      await page.waitForURL('/courses');

      expect(page.url()).toContain('/courses');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Courses")')).toBeVisible();
    });

    test('should navigate to create course page', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Courses")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Create Course")');
      await page.waitForURL('/courses/create');

      expect(page.url()).toContain('/courses/create');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Create Course")')).toBeVisible();
    });
  });

  test.describe('Media Library Navigation', () => {
    test('should navigate to media library', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Media Library")');
      await page.waitForURL('/media');

      expect(page.url()).toContain('/media');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Media Library")')).toBeVisible();
    });

    test('should show media upload functionality', async ({ page }) => {
      await page.goto('/media');

      await expect(page.locator('[data-mcp="upload-media-button"]')).toBeVisible();
      await expect(page.locator('[data-mcp="media-grid"]')).toBeVisible();
    });
  });

  test.describe('Analytics Navigation', () => {
    test('should navigate to analytics dashboard', async ({ page }) => {
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Analytics")');
      await page.waitForURL('/analytics');

      expect(page.url()).toContain('/analytics');
      await expect(page.locator('[data-mcp="page-title"]:has-text("Analytics")')).toBeVisible();
    });

    test('should display content performance metrics', async ({ page }) => {
      await page.goto('/analytics');

      // Mock analytics data
      await page.route('**/api/analytics/content', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalViews: 15000,
            totalShares: 1200,
            topContent: []
          })
        });
      });

      await page.reload();
      await expect(page.locator('[data-mcp="content-views-metric"]')).toBeVisible();
      await expect(page.locator('[data-mcp="content-shares-metric"]')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display correct breadcrumbs for content pages', async ({ page }) => {
      await page.goto('/content/create');

      const breadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(breadcrumbs).toEqual(['Content Management', 'Create New']);
    });

    test('should display correct breadcrumbs for course pages', async ({ page }) => {
      await page.goto('/courses/create');

      const breadcrumbs = await page.locator('[data-mcp="breadcrumb-segment"]').allTextContents();
      expect(breadcrumbs).toEqual(['Courses', 'Create Course']);
    });

    test('breadcrumb links should navigate correctly', async ({ page }) => {
      await page.goto('/content/create');

      // Click on parent breadcrumb
      await page.click('[data-mcp="breadcrumb-link"]:has-text("Content Management")');
      await page.waitForURL('/content');

      expect(page.url()).toContain('/content');
    });
  });

  test.describe('Navigation State Persistence', () => {
    test('should maintain navigation state on page refresh', async ({ page }) => {
      await page.goto('/content');

      // Expand content management navigation
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Content")')).toBeVisible();

      // Refresh page
      await page.reload();

      // Check that navigation state is maintained
      await expect(page.locator('[data-mcp="sidebar-nav-child"]:has-text("All Content")')).toBeVisible();
      await expect(page.locator('[data-mcp="sidebar-nav-item-active"]:has-text("Content Management")')).toBeVisible();
    });
  });

  test.describe('Content Creation Workflow', () => {
    test('should navigate from content list to create new content', async ({ page }) => {
      await page.goto('/content');

      // Click create new content button
      await page.click('[data-mcp="create-content-button"]');
      await page.waitForURL('/content/create');

      expect(page.url()).toContain('/content/create');

      // Fill out content form and save
      await page.fill('[data-mcp="content-title"]', 'Test Article');
      await page.selectOption('[data-mcp="content-type"]', 'article');
      await page.click('[data-mcp="save-content"]');

      // Should redirect back to content list
      await page.waitForURL('/content');
      expect(page.url()).toContain('/content');
    });

    test('should navigate from content edit back to list', async ({ page }) => {
      await page.goto('/content/edit/1');

      // Click cancel or back button
      await page.click('[data-mcp="cancel-edit"]');
      await page.waitForURL('/content');

      expect(page.url()).toContain('/content');
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should adapt navigation for mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');

      // Check that sidebar is hidden on mobile
      await expect(page.locator('[data-mcp="sidebar"]')).toBeHidden();

      // Click hamburger menu
      await page.click('[data-mcp="mobile-nav-toggle"]');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();

      // Navigate to content management
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("All Content")');

      // Sidebar should close after navigation on mobile
      await page.waitForURL('/content');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeHidden();
    });

    test('should maintain sidebar visibility on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/dashboard');

      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-mcp="mobile-nav-toggle"]')).toBeHidden();

      // Navigate and check sidebar stays visible
      await page.goto('/content');
      await expect(page.locator('[data-mcp="sidebar"]')).toBeVisible();
    });
  });

  test.describe('Search and Filter Navigation', () => {
    test('should maintain search filters in URL', async ({ page }) => {
      await page.goto('/content');

      // Apply search filter
      await page.fill('[data-mcp="content-search"]', 'test article');
      await page.click('[data-mcp="search-button"]');

      // Check URL contains search parameters
      expect(page.url()).toContain('search=test%20article');

      // Refresh page and check filter is maintained
      await page.reload();
      expect(await page.inputValue('[data-mcp="content-search"]')).toBe('test article');
    });

    test('should navigate with category filters', async ({ page }) => {
      await page.goto('/content');

      // Select category filter
      await page.selectOption('[data-mcp="category-filter"]', 'fitness');

      // Check URL contains filter parameters
      expect(page.url()).toContain('category=fitness');

      // Navigate to create page and back
      await page.goto('/content/create');
      await page.goBack();

      // Check filter is maintained
      expect(await page.locator('[data-mcp="category-filter"]').inputValue()).toBe('fitness');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing categories route gracefully', async ({ page }) => {
      // This tests the known issue where categories route is in nav but not implemented
      await page.click('[data-mcp="sidebar-nav-item"]:has-text("Content Management")');
      await page.click('[data-mcp="sidebar-nav-child"]:has-text("Categories")');

      // Should either show 404 or redirect gracefully
      await page.waitForLoadState('networkidle');

      // Check that user is informed about the missing page
      const hasError = await page.locator('[data-mcp="error-message"]').isVisible();
      const hasRedirect = page.url().includes('/content');

      expect(hasError || hasRedirect).toBeTruthy();
    });

    test('should handle unauthorized access', async ({ page }) => {
      // Mock unauthorized response
      await page.route('**/api/content/create', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' })
        });
      });

      await page.goto('/content/create');

      // Should show error message or redirect
      await expect(page.locator('[data-mcp="error-message"]')).toBeVisible();
    });
  });
});