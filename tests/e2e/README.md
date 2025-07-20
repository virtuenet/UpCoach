# Clerk Authentication Tests

This directory contains end-to-end tests for the Clerk authentication integration in the UpCoach application.

## Test Files

### `specs/clerk-auth.spec.js`
Comprehensive tests for Clerk authentication functionality including:
- ✅ Unauthenticated state verification
- ✅ Authentication UI components (Sign In/Sign Up buttons)
- ✅ Protected route testing
- ✅ Protected API route testing
- ✅ Responsive design verification
- ✅ Middleware integration testing
- ✅ Header component integration
- ✅ Environment configuration validation

### `specs/clerk-auth-utils-demo.spec.js`
Demonstration tests showing how to use the utility functions for:
- 🔧 Mocking authenticated/unauthenticated states
- 🔧 Testing user-specific features
- 🔧 Testing role-based access
- 🔧 Testing API integration with authentication

### `utils/clerk-test-utils.js`
Utility functions for testing authenticated scenarios:
- `mockAuthenticatedUser()` - Mock user authentication state
- `mockUnauthenticatedUser()` - Mock unauthenticated state
- `verifyUnauthenticatedUI()` - Verify UI shows correct unauthenticated state
- `verifyAuthenticatedUI()` - Verify UI shows correct authenticated state
- `testProtectedRoute()` - Test protected route behavior
- `testProtectedAPIRoute()` - Test protected API endpoint behavior

## Prerequisites

### 1. Install Dependencies
```bash
# Install Playwright
npm install -D @playwright/test playwright

# Install browser
npx playwright install chromium
```

### 2. Environment Setup
Create `landing-page/.env.local` with your Clerk keys:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
```

### 3. Start the Application
```bash
cd landing-page
npm run dev
```
The application should be running on `http://localhost:3000`

## Running Tests

### Run All Clerk Tests
```bash
npx playwright test specs/clerk-auth.spec.js --config=tests/e2e/playwright.config.js
```

### Run Specific Test Groups
```bash
# Run only unauthenticated state tests
npx playwright test --grep "Unauthenticated State" --config=tests/e2e/playwright.config.js

# Run only protected route tests
npx playwright test --grep "Protected Routes" --config=tests/e2e/playwright.config.js

# Run only API protection tests
npx playwright test --grep "API Route Protection" --config=tests/e2e/playwright.config.js
```

### Run with Different Browsers
```bash
# Chrome
npx playwright test --browser=chromium --config=tests/e2e/playwright.config.js

# Firefox
npx playwright test --browser=firefox --config=tests/e2e/playwright.config.js

# Safari
npx playwright test --browser=webkit --config=tests/e2e/playwright.config.js
```

### Debug Mode
```bash
npx playwright test --debug --config=tests/e2e/playwright.config.js
```

### Run Utility Demo Tests
```bash
npx playwright test specs/clerk-auth-utils-demo.spec.js --config=tests/e2e/playwright.config.js
```

## Test Coverage

### ✅ Current Coverage
- [x] Sign In/Sign Up button visibility when unauthenticated
- [x] User button and dashboard link hidden when unauthenticated
- [x] Protected routes redirect when not authenticated
- [x] Protected API routes return 401 when not authenticated
- [x] Header component structure and styling
- [x] Responsive design on mobile and tablet
- [x] Clerk middleware integration
- [x] No JavaScript errors on page load
- [x] Environment variable configuration

### 🔄 Future Test Scenarios (with real Clerk setup)
- [ ] Complete sign-in/sign-up flow
- [ ] User profile management
- [ ] Session management
- [ ] Multi-factor authentication
- [ ] Social login providers
- [ ] Organization/team features
- [ ] User metadata handling

## Testing Patterns

### Mock Authenticated User
```javascript
const testUser = await mockAuthenticatedUser(page, {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  publicMetadata: { plan: 'premium' }
});
```

### Test Protected Routes
```javascript
await testProtectedRoute(page, '/dashboard', '/');
```

### Test API Protection
```javascript
await testProtectedAPIRoute(page, '/api/user', 401);
```

### Verify UI State
```javascript
await verifyUnauthenticatedUI(page);
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   npm install -D @playwright/test playwright
   ```

2. **Browser not installed**
   ```bash
   npx playwright install
   ```

3. **Server not running**
   ```bash
   cd landing-page && npm run dev
   ```

4. **Environment variables missing**
   - Ensure `.env.local` exists in `landing-page/` directory
   - Verify Clerk keys are correct

5. **Tests timing out**
   - Increase timeout in `playwright.config.js`
   - Check if server is responding at `http://localhost:3000`

### Debug Tips

- Use `--headed` flag to see browser during tests
- Use `--debug` flag to step through tests
- Check browser console for JavaScript errors
- Verify network requests in browser dev tools

## CI/CD Integration

These tests are designed to run in CI environments. Make sure to:
1. Set environment variables in CI
2. Start the application before running tests
3. Use headless mode in CI (`--headed=false`)
4. Configure appropriate timeouts for CI environment

## Contributing

When adding new authentication tests:
1. Follow existing test patterns
2. Use utility functions from `clerk-test-utils.js`
3. Add appropriate documentation
4. Test in both authenticated and unauthenticated states
5. Consider responsive design implications 