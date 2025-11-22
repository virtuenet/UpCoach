// clerk-test-utils.js
// Utility functions for testing Clerk authentication scenarios

/**
 * Mock authenticated state for testing purposes
 * Note: This is for testing scenarios where you need to simulate an authenticated user
 * without actually going through the sign-in flow
 */
async function mockAuthenticatedUser(page, userInfo = {}) {
  const defaultUser = {
    id: 'user_test123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    ...userInfo,
  };

  // Mock Clerk's auth state in the browser
  await page.addInitScript(user => {
    // Mock Clerk's global state
    window.__CLERK_USER = user;
    window.__CLERK_SESSION = {
      id: 'sess_test123',
      status: 'active',
      user: user,
    };

    // Mock localStorage auth state
    localStorage.setItem(
      '__clerk_session',
      JSON.stringify({
        id: 'sess_test123',
        status: 'active',
      })
    );
  }, defaultUser);

  return defaultUser;
}

/**
 * Mock unauthenticated state for testing
 */
async function mockUnauthenticatedUser(page) {
  await page.addInitScript(() => {
    window.__CLERK_USER = null;
    window.__CLERK_SESSION = null;
    localStorage.removeItem('__clerk_session');
  });
}

/**
 * Wait for Clerk to finish loading/initializing
 */
async function waitForClerkToLoad(page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      return window.Clerk !== undefined || document.querySelector('[data-clerk-provider]') !== null;
    },
    { timeout }
  );
}

/**
 * Helper to test protected route behavior
 */
async function testProtectedRoute(page, routePath, expectedRedirect = '/') {
  await page.goto(routePath);

  // Wait for potential redirect
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  const urlPath = new URL(currentUrl).pathname;

  // Should either be redirected or not showing protected content
  if (urlPath === routePath) {
    // If still on the route, check that protected content is not visible
    const protectedContent = page.locator('[data-testid="protected-content"]');
    await expect(protectedContent).not.toBeVisible();
  } else {
    // Should be redirected to expected path
    expect(urlPath).toBe(expectedRedirect);
  }
}

/**
 * Helper to test API route protection
 */
async function testProtectedAPIRoute(page, apiPath, expectedStatus = 401) {
  const response = await page.request.get(apiPath);
  expect(response.status()).toBe(expectedStatus);

  if (expectedStatus === 401) {
    const responseText = await response.text();
    expect(responseText).toBe('Unauthorized');
  }

  return response;
}

/**
 * Helper to check authentication UI state
 */
async function verifyUnauthenticatedUI(page) {
  // Check sign in button is visible
  const signInButton = page.locator('button:has-text("Sign In")');
  await expect(signInButton).toBeVisible();

  // Check sign up button is visible
  const signUpButton = page.locator('button:has-text("Get Started")');
  await expect(signUpButton).toBeVisible();

  // Check user button is not visible
  const userButton = page.locator('.cl-userButton, [data-testid="user-button"]');
  await expect(userButton).not.toBeVisible();

  // Check dashboard link is not visible
  const dashboardLink = page.locator('a[href="/dashboard"]');
  await expect(dashboardLink).not.toBeVisible();
}

/**
 * Helper to check authenticated UI state
 */
async function verifyAuthenticatedUI(page) {
  // Check sign in/up buttons are not visible
  const signInButton = page.locator('button:has-text("Sign In")');
  const signUpButton = page.locator('button:has-text("Get Started")');

  await expect(signInButton).not.toBeVisible();
  await expect(signUpButton).not.toBeVisible();

  // Check user button is visible
  const userButton = page.locator('.cl-userButton, [data-testid="user-button"]');
  await expect(userButton).toBeVisible();

  // Check dashboard link is visible
  const dashboardLink = page.locator('a[href="/dashboard"]');
  await expect(dashboardLink).toBeVisible();
}

/**
 * Helper to simulate sign-in modal interaction
 * Note: This assumes you have test credentials or are testing in a development environment
 */
async function attemptSignIn(page, email, password) {
  const signInButton = page.locator('button:has-text("Sign In")');
  await signInButton.click();

  // Wait for modal to appear
  await page.waitForTimeout(1000);

  // Try to find email input in Clerk modal
  const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]');
  const passwordInput = page.locator(
    'input[type="password"], input[name="password"], input[id*="password"]'
  );

  if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Look for submit button
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Sign in"), button:has-text("Continue")'
    );
    await submitButton.click();

    // Wait for authentication to complete
    await page.waitForTimeout(2000);
  }
}

/**
 * Helper to check for console errors related to Clerk
 */
async function checkForClerkErrors(page) {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' && (msg.text().includes('Clerk') || msg.text().includes('clerk'))) {
      errors.push(msg.text());
    }
  });

  // Return function to get collected errors
  return () => errors;
}

/**
 * Helper to test middleware configuration
 */
async function testMiddlewareProtection(page, protectedPaths = ['/dashboard']) {
  for (const path of protectedPaths) {
    await testProtectedRoute(page, path);
  }
}

module.exports = {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  waitForClerkToLoad,
  testProtectedRoute,
  testProtectedAPIRoute,
  verifyUnauthenticatedUI,
  verifyAuthenticatedUI,
  attemptSignIn,
  checkForClerkErrors,
  testMiddlewareProtection,
};
