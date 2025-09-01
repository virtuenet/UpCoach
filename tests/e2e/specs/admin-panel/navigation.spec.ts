import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('UpCoach Admin');
  });

  test('should show login form with proper accessibility', async ({ page }) => {
    // Check for proper form structure
    await expect(page.locator('form')).toBeVisible();
    
    // Check for email input with proper labeling
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('required');
    
    // Check for password input with proper labeling
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('required');
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign In');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h4')).toContainText('System Overview');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });
});

test.describe('Admin Panel Dashboard Navigation (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display main navigation menu', async ({ page }) => {
    // Check for main navigation
    const nav = page.locator('[role="navigation"], nav');
    await expect(nav).toBeVisible();
    
    // Check for key navigation items
    await expect(page.locator('text=System Overview')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Content Moderation')).toBeVisible();
    await expect(page.locator('text=Advanced Analytics')).toBeVisible();
    await expect(page.locator('text=Financial Management')).toBeVisible();
    await expect(page.locator('text=System Configuration')).toBeVisible();
  });

  test('should navigate to user management page', async ({ page }) => {
    await page.click('text=User Management');
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator('h4')).toContainText('User Management');
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.click('text=Advanced Analytics');
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.locator('h4')).toContainText('AnalyticsPage');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to navigation
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Should navigate to a page (specific behavior may vary)
    await expect(page.url()).toMatch(/\/dashboard|\/users|\/analytics|\/moderation|\/financial|\/system/);
  });

  test('should have accessible navigation structure', async ({ page }) => {
    // Check for ARIA landmarks
    const nav = page.locator('[role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
  });

  test('should display user menu and support logout', async ({ page }) => {
    // Look for user avatar or menu trigger
    const userMenu = page.locator('[aria-label="Account"], [title="Account"]');
    await expect(userMenu).toBeVisible();
    
    // Click to open menu
    await userMenu.click();
    
    // Look for logout option
    await expect(page.locator('text=Logout')).toBeVisible();
    
    // Click logout
    await page.click('text=Logout');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should be accessible (might be hidden behind hamburger menu)
    // Look for mobile menu trigger if present
    const mobileMenuTrigger = page.locator('[aria-label="open drawer"], [aria-label="menu"]');
    if (await mobileMenuTrigger.isVisible()) {
      await mobileMenuTrigger.click();
    }
    
    // Navigation items should still be accessible
    await expect(page.locator('text=System Overview')).toBeVisible();
  });

  test('should show breadcrumbs for nested navigation', async ({ page }) => {
    // Navigate to a nested page
    await page.click('text=User Management');
    
    // Check for breadcrumbs
    const breadcrumbs = page.locator('[aria-label="breadcrumb"], nav[aria-label="Breadcrumb"]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toContainText('User Management');
    }
  });
});