// clerk-auth-utils-demo.spec.js
// Demonstration of how to use Clerk test utilities for authenticated scenarios

const { test, expect } = require('@playwright/test');
const {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  verifyUnauthenticatedUI,
  verifyAuthenticatedUI,
  testProtectedAPIRoute,
  testMiddlewareProtection,
} = require('../utils/clerk-test-utils');

test.describe('Clerk Authentication Utils Demo', () => {
  test.describe('Using Test Utilities', () => {
    test('should demonstrate unauthenticated state verification', async ({ page }) => {
      await mockUnauthenticatedUser(page);
      await page.goto('/');

      // Use utility to verify unauthenticated UI
      await verifyUnauthenticatedUI(page);
    });

    test('should demonstrate mocked authenticated state', async ({ page }) => {
      // Mock an authenticated user
      const testUser = await mockAuthenticatedUser(page, {
        email: 'demo@upcoach.ai',
        firstName: 'Demo',
        lastName: 'User',
      });

      await page.goto('/');

      // Note: In a real application with proper Clerk setup, this would show authenticated UI
      // For now, we can test that the user data is available in the browser context
      const userData = await page.evaluate(() => window.__CLERK_USER);
      expect(userData.email).toBe('demo@upcoach.ai');
      expect(userData.firstName).toBe('Demo');
    });

    test('should demonstrate API route testing utility', async ({ page }) => {
      await mockUnauthenticatedUser(page);

      // Use utility to test protected API route
      await testProtectedAPIRoute(page, '/api/user', 401);
    });

    test('should demonstrate middleware protection testing', async ({ page }) => {
      await mockUnauthenticatedUser(page);

      // Test multiple protected routes
      await testMiddlewareProtection(page, ['/dashboard']);
    });
  });

  test.describe('Manual Testing Examples', () => {
    test('should provide example of testing with real authentication flow', async ({ page }) => {
      // This test demonstrates how you would test with real Clerk authentication
      // when you have proper test environment and credentials

      await page.goto('/');

      // Click sign in button
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();

      // Wait for Clerk modal
      await page.waitForTimeout(1000);

      // In a real test with valid Clerk setup, you would:
      // 1. Fill in test credentials
      // 2. Submit the form
      // 3. Wait for authentication to complete
      // 4. Verify authenticated state

      console.log(
        'Sign-in modal triggered - in a real test environment, you would complete the authentication flow here'
      );
    });

    test('should demonstrate testing protected dashboard access', async ({ page }) => {
      // Test accessing dashboard when unauthenticated
      await page.goto('/dashboard');

      // Should redirect or show sign-in
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        // If still on dashboard, verify protected content is not shown
        const protectedContent = page.locator('h1:has-text("Welcome to Your Dashboard")');
        await expect(protectedContent).not.toBeVisible();
      } else {
        // Should be redirected away from dashboard
        expect(currentUrl).not.toContain('/dashboard');
      }
    });
  });

  test.describe('Testing Patterns for Future Development', () => {
    test('should show pattern for testing user-specific features', async ({ page }) => {
      // Example: Testing a feature that requires specific user data
      const testUser = await mockAuthenticatedUser(page, {
        id: 'user_premium123',
        email: 'premium@upcoach.ai',
        publicMetadata: { plan: 'premium' },
      });

      // In a real implementation, you would:
      // 1. Navigate to a premium feature
      // 2. Verify the feature is accessible
      // 3. Test feature functionality

      expect(testUser.publicMetadata.plan).toBe('premium');
    });

    test('should show pattern for testing role-based access', async ({ page }) => {
      // Example: Testing admin-only features
      const adminUser = await mockAuthenticatedUser(page, {
        id: 'user_admin123',
        email: 'admin@upcoach.ai',
        publicMetadata: { role: 'admin' },
      });

      // In a real implementation, you would:
      // 1. Navigate to admin-only pages
      // 2. Verify admin features are visible
      // 3. Test admin functionality

      expect(adminUser.publicMetadata.role).toBe('admin');
    });

    test('should show pattern for testing API integration', async ({ page }) => {
      // Mock authenticated user
      await mockAuthenticatedUser(page, {
        id: 'user_api_test123',
      });

      // In a real implementation with proper Clerk setup:
      // 1. Make authenticated API requests
      // 2. Verify proper user context in API responses
      // 3. Test user-specific data operations

      // For now, we can test that unauthenticated requests fail
      const response = await page.request.get('/api/user');
      expect(response.status()).toBe(401);
    });
  });
});
