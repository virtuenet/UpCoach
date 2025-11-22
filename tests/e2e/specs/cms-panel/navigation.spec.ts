import { test, expect } from '@playwright/test';

test.describe('CMS Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('CMS Panel Dashboard Navigation (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login for CMS panel (adjust credentials as needed)
    await page.goto('/login');
    
    // Check if login form exists and fill it
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', 'editor@upcoach.ai');
      await page.fill('input[type="password"]', 'editor123');
      await page.click('button[type="submit"]');
    }
    
    // If already authenticated or after login, go to dashboard
    await page.goto('/dashboard');
  });

  test('should display CMS navigation menu', async ({ page }) => {
    // Check for main navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Content')).toBeVisible();
    await expect(page.locator('text=Courses')).toBeVisible();
    await expect(page.locator('text=Media Library')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should navigate between CMS sections', async ({ page }) => {
    // Navigate to Content
    await page.click('text=Content');
    await expect(page).toHaveURL(/\/content/);
    
    // Navigate to Courses
    await page.click('text=Courses');
    await expect(page).toHaveURL(/\/courses/);
    
    // Navigate to Media Library
    await page.click('text=Media Library');
    await expect(page).toHaveURL(/\/media/);
  });

  test('should have consistent navigation UI', async ({ page }) => {
    // Check for logo/brand
    await expect(page.locator('text=UpCoach')).toBeVisible();
    
    // Check navigation is accessible
    const navigation = page.locator('[role="navigation"], nav');
    await expect(navigation).toBeVisible();
  });

  test('should support responsive navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu trigger
    const mobileMenu = page.locator('button[aria-label*="menu"], button[aria-label*="navigation"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      // Navigation should be accessible
      await expect(page.locator('text=Dashboard')).toBeVisible();
    }
  });

  test('should maintain active state for current page', async ({ page }) => {
    // Navigate to content page
    await page.click('text=Content');
    
    // The content navigation item should show as active
    const contentNav = page.locator('a[href="/content"], a[href*="content"]').first();
    
    // Check for active styling (this might vary based on implementation)
    const classes = await contentNav.getAttribute('class');
    expect(classes).toMatch(/active|selected|current/i);
  });
});