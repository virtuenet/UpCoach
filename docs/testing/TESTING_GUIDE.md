# UpCoach Landing Page Testing Guide

## Overview

This guide covers the comprehensive testing strategy for the UpCoach landing page, including unit tests, integration tests, E2E tests, and accessibility testing.

## Test Structure

```
landing-page/
├── src/
│   ├── components/
│   │   └── __tests__/        # Component unit tests
│   └── services/
│       └── __tests__/        # Service unit tests
├── e2e/                      # End-to-end tests
│   ├── homepage.spec.ts
│   ├── lead-capture.spec.ts
│   ├── performance.spec.ts
│   ├── cross-browser.spec.ts
│   └── accessibility.spec.ts
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup file
└── playwright.config.ts      # Playwright configuration
```

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test NewsletterForm.test.tsx
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test homepage.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in UI mode (recommended for debugging)
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

### Accessibility Tests

```bash
# Install axe-core for Playwright
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npx playwright test accessibility.spec.ts
```

## Test Coverage

### Unit Test Coverage

Our Jest configuration enforces the following coverage thresholds:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### E2E Test Coverage

E2E tests cover:

- ✅ Homepage functionality
- ✅ Navigation flows
- ✅ Form submissions
- ✅ Lead capture modals
- ✅ Performance metrics
- ✅ Cross-browser compatibility
- ✅ Accessibility standards
- ✅ Mobile responsiveness

## Test Categories

### 1. Component Unit Tests

Located in `src/components/__tests__/`

**NewsletterForm.test.tsx**

- Email validation
- Submission flow
- Error handling
- Analytics tracking
- All three variants (inline, hero, modal)

**ContactForm.test.tsx**

- Field validation
- Form submission
- Error states
- Success states
- All three variants

### 2. Service Unit Tests

Located in `src/services/__tests__/`

**experiments.test.ts**

- Variant assignment
- Weight distribution
- Target audience matching
- Conversion tracking
- Storage persistence

**analytics.test.ts**

- Event tracking
- Custom dimensions
- Web Vitals reporting
- Error handling

### 3. E2E Tests

**homepage.spec.ts**

- Page structure
- Navigation
- Content visibility
- Link functionality
- Interactive elements

**lead-capture.spec.ts**

- Modal triggers (time, exit-intent, scroll)
- Form validation
- Submission flow
- Session persistence

**performance.spec.ts**

- Load time metrics
- Core Web Vitals (LCP, FID, CLS)
- Resource optimization
- JavaScript bundle sizes

**cross-browser.spec.ts**

- Browser-specific features
- CSS compatibility
- JavaScript functionality
- Mobile interactions

**accessibility.spec.ts**

- WCAG compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA attributes

## Best Practices

### Writing Tests

1. **Use descriptive test names**

   ```typescript
   test("newsletter form validates email format and shows error message", async () => {
     // test implementation
   });
   ```

2. **Follow AAA pattern**

   ```typescript
   test('contact form submits successfully', async () => {
     // Arrange
     render(<ContactForm />);

     // Act
     await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
     await userEvent.click(screen.getByRole('button', { name: /submit/i }));

     // Assert
     expect(screen.getByText(/success/i)).toBeVisible();
   });
   ```

3. **Test user behavior, not implementation**

   ```typescript
   // Good
   await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));

   // Avoid
   await userEvent.click(screen.getByTestId("submit-btn"));
   ```

4. **Use proper async handling**

   ```typescript
   // Wait for elements
   await waitFor(() => {
     expect(screen.getByText(/success/i)).toBeVisible();
   });

   // Wait for disappearance
   await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
   ```

### Debugging Tests

1. **Use Playwright UI mode**

   ```bash
   npx playwright test --ui
   ```

2. **Debug specific tests**

   ```bash
   npx playwright test --debug homepage.spec.ts
   ```

3. **View test artifacts**

   ```bash
   # Screenshots on failure
   test-results/homepage-spec-ts-homepage-has-correct-title/screenshot.png

   # Videos
   test-results/homepage-spec-ts-homepage-has-correct-title/video.webm

   # Traces
   npx playwright show-trace trace.zip
   ```

## Continuous Integration

### GitHub Actions Configuration

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in test: `test.setTimeout(60000)`
   - Check for proper async handling
   - Ensure test environment is clean

2. **Flaky tests**
   - Use proper waitFor assertions
   - Avoid arbitrary delays
   - Mock external dependencies

3. **Coverage not meeting threshold**
   - Add tests for edge cases
   - Test error scenarios
   - Cover all component variants

### Mocking

1. **Mock external services**

   ```typescript
   jest.mock("@/services/analytics", () => ({
     trackEvent: jest.fn(),
   }));
   ```

2. **Mock API responses**
   ```typescript
   global.fetch = jest.fn(() =>
     Promise.resolve({
       ok: true,
       json: async () => ({ success: true }),
     }),
   );
   ```

## Performance Testing

Monitor these metrics:

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.8s

## Accessibility Testing

Ensure compliance with:

- WCAG 2.1 Level AA
- Section 508
- ADA requirements

Key areas:

- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management
- ARIA labels and roles

## Maintenance

- Review and update tests with each feature change
- Keep dependencies up to date
- Monitor test execution time
- Refactor tests to reduce duplication
- Document complex test scenarios
