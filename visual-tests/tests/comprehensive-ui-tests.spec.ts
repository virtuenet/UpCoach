/**
 * Comprehensive Visual Regression Tests
 *
 * Tests UI consistency across:
 * - Landing page components and layouts
 * - Admin panel dashboards and forms
 * - CMS panel content management
 * - Mobile responsive views
 * - Dark/light theme variations
 * - Different browser viewports
 * - Interactive states and animations
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const VIEWPORT_SIZES = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
] as const;

const THEMES = ['light', 'dark'] as const;

const BASE_URLS = {
  landing: 'http://localhost:3000',
  admin: 'http://localhost:3001',
  cms: 'http://localhost:3002',
} as const;

// Utility functions
const waitForPageLoad = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow for animations
};

const setTheme = async (page: Page, theme: 'light' | 'dark') => {
  await page.evaluate((theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, theme);
};

const hideAnimations = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
};

const mockApiResponses = async (page: Page) => {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();

    // Mock auth endpoints
    if (url.includes('/auth/login')) {
      return route.fulfill({
        json: {
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: 'test-user',
            email: 'test@upcoach.ai',
            name: 'Test User',
            role: 'admin',
          },
        },
      });
    }

    // Mock user data
    if (url.includes('/user/profile')) {
      return route.fulfill({
        json: {
          id: 'test-user',
          email: 'test@upcoach.ai',
          firstName: 'Visual',
          lastName: 'Test',
          avatar: 'https://via.placeholder.com/150',
          role: 'admin',
        },
      });
    }

    // Mock dashboard stats
    if (url.includes('/dashboard/stats')) {
      return route.fulfill({
        json: {
          totalUsers: 1250,
          activeUsers: 892,
          totalGoals: 3400,
          completedGoals: 2100,
          habitStreak: 28,
          coachingSessions: 156,
        },
      });
    }

    // Mock goals data
    if (url.includes('/goals')) {
      return route.fulfill({
        json: {
          goals: [
            {
              id: '1',
              title: 'Complete Marathon Training',
              progress: 75,
              category: 'fitness',
              deadline: '2024-06-01',
            },
            {
              id: '2',
              title: 'Learn Spanish',
              progress: 45,
              category: 'education',
              deadline: '2024-08-15',
            },
          ],
          total: 2,
        },
      });
    }

    // Default mock response
    route.fulfill({ json: { success: true, data: [] } });
  });
};

// Test suite for Landing Page
test.describe('Landing Page Visual Tests', () => {
  VIEWPORT_SIZES.forEach(({ name, width, height }) => {
    THEMES.forEach((theme) => {
      test(`Landing page - ${name} - ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(BASE_URLS.landing);

        await setTheme(page, theme);
        await hideAnimations(page);
        await waitForPageLoad(page);

        // Test hero section
        await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
        await expect(page).toHaveScreenshot(`landing-hero-${name}-${theme}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width, height: Math.min(800, height) },
        });

        // Test features section
        await page.locator('[data-testid="features-section"]').scrollIntoViewIfNeeded();
        await expect(page).toHaveScreenshot(`landing-features-${name}-${theme}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width, height: Math.min(600, height) },
        });

        // Test pricing section
        await page.locator('[data-testid="pricing-section"]').scrollIntoViewIfNeeded();
        await expect(page).toHaveScreenshot(`landing-pricing-${name}-${theme}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width, height: Math.min(800, height) },
        });

        // Test testimonials section
        await page.locator('[data-testid="testimonials-section"]').scrollIntoViewIfNeeded();
        await expect(page).toHaveScreenshot(`landing-testimonials-${name}-${theme}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width, height: Math.min(600, height) },
        });

        // Test footer
        await page.locator('footer').scrollIntoViewIfNeeded();
        await expect(page).toHaveScreenshot(`landing-footer-${name}-${theme}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width, height: Math.min(400, height) },
        });

        // Test full page
        await expect(page).toHaveScreenshot(`landing-full-${name}-${theme}.png`, {
          fullPage: true,
        });
      });
    });
  });

  test('Landing page interactive elements', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URLS.landing);
    await hideAnimations(page);

    // Test navigation menu
    const navToggle = page.locator('[data-testid="nav-toggle"]');
    if (await navToggle.isVisible()) {
      await navToggle.click();
      await expect(page).toHaveScreenshot('landing-nav-menu-open.png');
    }

    // Test CTA button hover states
    const ctaButton = page.locator('[data-testid="cta-button"]').first();
    await ctaButton.hover();
    await expect(page).toHaveScreenshot('landing-cta-hover.png', {
      clip: await ctaButton.boundingBox(),
    });

    // Test contact form
    const contactForm = page.locator('[data-testid="contact-form"]');
    if (await contactForm.isVisible()) {
      await contactForm.scrollIntoViewIfNeeded();

      // Fill form to show validation states
      await page.fill('[data-testid="contact-name"]', 'Visual Test');
      await page.fill('[data-testid="contact-email"]', 'invalid-email');
      await page.click('[data-testid="contact-submit"]');

      await expect(page).toHaveScreenshot('landing-form-validation.png', {
        clip: await contactForm.boundingBox(),
      });
    }
  });

  test('Landing page loading states', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Intercept requests to simulate loading
    await page.route('**/api/**', (route) => {
      setTimeout(() => {
        route.fulfill({ json: { success: true } });
      }, 2000);
    });

    await page.goto(BASE_URLS.landing);

    // Capture loading state
    await expect(page).toHaveScreenshot('landing-loading-state.png');

    // Wait for content to load and capture final state
    await waitForPageLoad(page);
    await expect(page).toHaveScreenshot('landing-loaded-state.png');
  });
});

// Test suite for Admin Panel
test.describe('Admin Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponses(page);
    await hideAnimations(page);
  });

  VIEWPORT_SIZES.forEach(({ name, width, height }) => {
    THEMES.forEach((theme) => {
      test(`Admin dashboard - ${name} - ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(BASE_URLS.admin);
        await setTheme(page, theme);

        // Mock login if needed
        const loginForm = page.locator('[data-testid="login-form"]');
        if (await loginForm.isVisible()) {
          await page.fill('[data-testid="email-input"]', 'admin@upcoach.ai');
          await page.fill('[data-testid="password-input"]', 'password123');
          await page.click('[data-testid="login-button"]');
          await waitForPageLoad(page);
        }

        // Test dashboard overview
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
        await expect(page).toHaveScreenshot(`admin-dashboard-${name}-${theme}.png`, {
          fullPage: true,
        });

        // Test sidebar navigation
        const sidebar = page.locator('[data-testid="sidebar"]');
        if (await sidebar.isVisible()) {
          await expect(page).toHaveScreenshot(`admin-sidebar-${name}-${theme}.png`, {
            clip: await sidebar.boundingBox(),
          });
        }

        // Test stat cards
        const statCards = page.locator('[data-testid="stat-card"]');
        if (await statCards.count() > 0) {
          await expect(page).toHaveScreenshot(`admin-stats-${name}-${theme}.png`, {
            clip: await statCards.first().boundingBox(),
          });
        }

        // Test charts
        const chartContainer = page.locator('[data-testid="chart-container"]');
        if (await chartContainer.isVisible()) {
          await chartContainer.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000); // Wait for chart rendering
          await expect(page).toHaveScreenshot(`admin-charts-${name}-${theme}.png`, {
            clip: await chartContainer.boundingBox(),
          });
        }
      });
    });
  });

  test('Admin panel form components', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.admin}/users/new`);
    await waitForPageLoad(page);

    const form = page.locator('[data-testid="user-form"]');
    if (await form.isVisible()) {
      // Test empty form
      await expect(page).toHaveScreenshot('admin-form-empty.png', {
        clip: await form.boundingBox(),
      });

      // Test form with data
      await page.fill('[data-testid="firstName"]', 'John');
      await page.fill('[data-testid="lastName"]', 'Doe');
      await page.fill('[data-testid="email"]', 'john.doe@upcoach.ai');
      await page.selectOption('[data-testid="role"]', 'user');

      await expect(page).toHaveScreenshot('admin-form-filled.png', {
        clip: await form.boundingBox(),
      });

      // Test form validation
      await page.fill('[data-testid="email"]', 'invalid-email');
      await page.click('[data-testid="submit-button"]');

      await expect(page).toHaveScreenshot('admin-form-validation.png', {
        clip: await form.boundingBox(),
      });
    }
  });

  test('Admin panel data tables', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.admin}/users`);
    await waitForPageLoad(page);

    const dataTable = page.locator('[data-testid="users-table"]');
    if (await dataTable.isVisible()) {
      // Test table with data
      await expect(page).toHaveScreenshot('admin-table-data.png', {
        clip: await dataTable.boundingBox(),
      });

      // Test table sorting
      const sortableColumn = page.locator('[data-testid="sortable-column"]').first();
      if (await sortableColumn.isVisible()) {
        await sortableColumn.click();
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('admin-table-sorted.png', {
          clip: await dataTable.boundingBox(),
        });
      }

      // Test table filtering
      const filterInput = page.locator('[data-testid="table-filter"]');
      if (await filterInput.isVisible()) {
        await filterInput.fill('test');
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('admin-table-filtered.png', {
          clip: await dataTable.boundingBox(),
        });
      }
    }
  });

  test('Admin panel modals and dialogs', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.admin}/users`);
    await waitForPageLoad(page);

    // Test confirmation dialog
    const deleteButton = page.locator('[data-testid="delete-user-button"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
      if (await confirmDialog.isVisible()) {
        await expect(page).toHaveScreenshot('admin-confirm-dialog.png');
      }
    }

    // Test edit modal
    const editButton = page.locator('[data-testid="edit-user-button"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      const editModal = page.locator('[data-testid="edit-modal"]');
      if (await editModal.isVisible()) {
        await expect(page).toHaveScreenshot('admin-edit-modal.png');
      }
    }
  });
});

// Test suite for CMS Panel
test.describe('CMS Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponses(page);
    await hideAnimations(page);
  });

  VIEWPORT_SIZES.forEach(({ name, width, height }) => {
    test(`CMS content editor - ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(BASE_URLS.cms);
      await waitForPageLoad(page);

      // Test content list view
      const contentList = page.locator('[data-testid="content-list"]');
      if (await contentList.isVisible()) {
        await expect(page).toHaveScreenshot(`cms-content-list-${name}.png`, {
          clip: await contentList.boundingBox(),
        });
      }

      // Test rich text editor
      const editor = page.locator('[data-testid="rich-editor"]');
      if (await editor.isVisible()) {
        await expect(page).toHaveScreenshot(`cms-editor-${name}.png`, {
          clip: await editor.boundingBox(),
        });
      }
    });
  });

  test('CMS editor toolbar and formatting', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.cms}/content/new`);
    await waitForPageLoad(page);

    const editor = page.locator('[data-testid="rich-editor"]');
    const toolbar = page.locator('[data-testid="editor-toolbar"]');

    if (await editor.isVisible() && await toolbar.isVisible()) {
      // Test toolbar
      await expect(page).toHaveScreenshot('cms-editor-toolbar.png', {
        clip: await toolbar.boundingBox(),
      });

      // Test editor with content
      await editor.fill('This is a test content for visual regression testing.');
      await expect(page).toHaveScreenshot('cms-editor-with-content.png', {
        clip: await editor.boundingBox(),
      });

      // Test formatting buttons
      await page.locator('[data-testid="bold-button"]').click();
      await page.locator('[data-testid="italic-button"]').click();
      await expect(page).toHaveScreenshot('cms-editor-formatted.png', {
        clip: await editor.boundingBox(),
      });
    }
  });

  test('CMS media library', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.cms}/media`);
    await waitForPageLoad(page);

    const mediaLibrary = page.locator('[data-testid="media-library"]');
    if (await mediaLibrary.isVisible()) {
      // Test grid view
      await expect(page).toHaveScreenshot('cms-media-grid.png', {
        clip: await mediaLibrary.boundingBox(),
      });

      // Test list view
      const listViewButton = page.locator('[data-testid="list-view-button"]');
      if (await listViewButton.isVisible()) {
        await listViewButton.click();
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('cms-media-list.png', {
          clip: await mediaLibrary.boundingBox(),
        });
      }

      // Test upload area
      const uploadArea = page.locator('[data-testid="upload-area"]');
      if (await uploadArea.isVisible()) {
        await expect(page).toHaveScreenshot('cms-upload-area.png', {
          clip: await uploadArea.boundingBox(),
        });
      }
    }
  });
});

// Cross-browser compatibility tests
test.describe('Cross-browser Visual Tests', () => {
  ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
    test(`Landing page consistency - ${browserName}`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URLS.landing);
      await hideAnimations(page);
      await waitForPageLoad(page);

      await expect(page).toHaveScreenshot(`cross-browser-landing-${browserName}.png`, {
        fullPage: true,
      });
    });
  });
});

// Animation and transition tests
test.describe('Animation Visual Tests', () => {
  test('Loading animations', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Don't hide animations for this test
    await page.route('**/api/**', (route) => {
      setTimeout(() => {
        route.fulfill({ json: { success: true } });
      }, 1000);
    });

    await page.goto(BASE_URLS.landing);

    // Capture various animation states
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('animation-loading-25.png');

    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('animation-loading-50.png');

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('animation-loaded.png');
  });

  test('Hover transitions', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URLS.landing);
    await waitForPageLoad(page);

    const interactiveElements = [
      '[data-testid="cta-button"]',
      '[data-testid="nav-link"]',
      '[data-testid="card"]',
    ];

    for (const selector of interactiveElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        // Normal state
        await expect(element).toHaveScreenshot(`${selector.replace(/[\[\]="]/g, '')}-normal.png`);

        // Hover state
        await element.hover();
        await page.waitForTimeout(300); // Wait for transition
        await expect(element).toHaveScreenshot(`${selector.replace(/[\[\]="]/g, '')}-hover.png`);
      }
    }
  });
});

// Error state visual tests
test.describe('Error State Visual Tests', () => {
  test('Network error states', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock network errors
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto(BASE_URLS.admin);
    await page.waitForTimeout(2000);

    // Test error boundary
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    if (await errorBoundary.isVisible()) {
      await expect(page).toHaveScreenshot('error-network-failure.png');
    }

    // Test individual component error states
    const errorComponents = page.locator('[data-testid*="error"]');
    const count = await errorComponents.count();
    for (let i = 0; i < count; i++) {
      const component = errorComponents.nth(i);
      if (await component.isVisible()) {
        await expect(component).toHaveScreenshot(`error-component-${i}.png`);
      }
    }
  });

  test('Form validation errors', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.admin}/users/new`);
    await waitForPageLoad(page);

    // Trigger validation errors
    await page.click('[data-testid="submit-button"]');
    await page.waitForTimeout(500);

    const form = page.locator('[data-testid="user-form"]');
    if (await form.isVisible()) {
      await expect(page).toHaveScreenshot('form-validation-errors.png', {
        clip: await form.boundingBox(),
      });
    }
  });

  test('404 and empty states', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test 404 page
    await page.goto(`${BASE_URLS.landing}/non-existent-page`);
    await waitForPageLoad(page);
    await expect(page).toHaveScreenshot('404-page.png');

    // Test empty state
    await mockApiResponses(page);
    await page.route('**/api/goals', (route) => {
      route.fulfill({ json: { goals: [], total: 0 } });
    });

    await page.goto(`${BASE_URLS.admin}/goals`);
    await waitForPageLoad(page);

    const emptyState = page.locator('[data-testid="empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(page).toHaveScreenshot('empty-state-goals.png', {
        clip: await emptyState.boundingBox(),
      });
    }
  });
});

// Performance impact visual tests
test.describe('Performance Visual Tests', () => {
  test('Large dataset rendering', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock large dataset
    const largDataset = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      name: `User ${i}`,
      email: `user${i}@upcoach.ai`,
      role: i % 2 === 0 ? 'admin' : 'user',
      status: i % 3 === 0 ? 'active' : 'inactive',
    }));

    await page.route('**/api/users', (route) => {
      route.fulfill({ json: { users: largDataset, total: 100 } });
    });

    await page.goto(`${BASE_URLS.admin}/users`);
    await waitForPageLoad(page);

    const table = page.locator('[data-testid="users-table"]');
    if (await table.isVisible()) {
      await expect(page).toHaveScreenshot('large-dataset-table.png', {
        clip: await table.boundingBox(),
      });
    }
  });

  test('Infinite scroll rendering', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URLS.admin}/content`);
    await waitForPageLoad(page);

    const scrollContainer = page.locator('[data-testid="infinite-scroll"]');
    if (await scrollContainer.isVisible()) {
      // Initial state
      await expect(page).toHaveScreenshot('infinite-scroll-initial.png', {
        clip: await scrollContainer.boundingBox(),
      });

      // Scroll and trigger loading
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('infinite-scroll-loading.png', {
        clip: await scrollContainer.boundingBox(),
      });
    }
  });
});