# Visual Regression Testing

This directory contains visual regression tests for the UpCoach platform using Playwright.

## Overview

Visual regression testing helps catch unintended UI changes by comparing screenshots of the application against baseline images. Any visual differences are flagged for review.

## Setup

1. Install dependencies:
```bash
cd visual-tests
npm install
```

2. Install browsers:
```bash
npm run install:browsers
```

## Running Tests

### Run all visual tests:
```bash
npm test
```

### Run tests in UI mode (interactive):
```bash
npm run test:ui
```

### Debug tests:
```bash
npm run test:debug
```

### Update baseline screenshots:
```bash
npm run test:update
```

### View test report:
```bash
npm run test:report
```

## Test Structure

```
visual-tests/
├── tests/
│   └── landing-page.spec.ts    # Landing page visual tests
├── playwright.config.ts        # Playwright configuration
├── package.json               # Dependencies and scripts
└── test-results/              # Test results (gitignored)
```

## Test Categories

### 1. Component Visual Tests
- Hero section
- Features section
- Pricing section
- Footer
- Forms and modals

### 2. Responsive Design Tests
- Multiple viewport sizes
- Mobile menu states
- Tablet layouts

### 3. Interaction States
- Hover effects
- Focus states
- Loading indicators
- Error states

### 4. Cross-browser Tests
- Chrome/Chromium
- Firefox
- Safari/WebKit
- Mobile browsers

### 5. Accessibility Tests
- High contrast mode
- Focus indicators
- Screen reader compatibility

## Configuration

The `playwright.config.ts` file contains:
- Screenshot comparison thresholds
- Browser configurations
- Viewport sizes
- Reporter settings

### Threshold Settings
```typescript
toHaveScreenshot: { 
  threshold: 0.2,        // 20% difference threshold
  maxDiffPixels: 100,    // Max 100 pixels can differ
  animations: 'disabled' // Disable animations
}
```

## CI/CD Integration

### GitHub Actions Example:
```yaml
- name: Install Playwright
  run: |
    cd visual-tests
    npm ci
    npm run install:browsers

- name: Run Visual Tests
  run: |
    cd visual-tests
    npm run test:ci

- name: Upload Screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: visual-tests/test-results/
```

## Best Practices

### 1. Consistent Environment
- Use the same OS/browser versions in CI as baselines
- Disable animations and transitions
- Wait for network idle before screenshots

### 2. Selective Testing
- Focus on critical UI components
- Test responsive breakpoints
- Include error and loading states

### 3. Maintenance
- Review and update baselines regularly
- Document intentional UI changes
- Use descriptive test names

### 4. Performance
- Limit full-page screenshots
- Use component-level screenshots when possible
- Run tests in parallel

## Troubleshooting

### Screenshots Don't Match
1. Check if UI has legitimately changed
2. Review threshold settings
3. Update baselines if changes are intentional

### Tests are Flaky
1. Add proper wait conditions
2. Disable animations
3. Use stable selectors

### Tests are Slow
1. Reduce number of full-page screenshots
2. Use headless mode
3. Parallelize test execution

## Updating Baselines

When UI changes are intentional:

```bash
# Update all baselines
npm run test:update

# Update specific test
npx playwright test landing-page.spec.ts --update-snapshots

# Update for specific browser
npx playwright test --project=chromium --update-snapshots
```

## Screenshot Storage

Baseline screenshots are stored in:
- `tests/landing-page.spec.ts-snapshots/`

Failed comparisons are saved in:
- `test-results/`

## Viewing Differences

When tests fail, Playwright generates:
1. Expected image (baseline)
2. Actual image (current)
3. Diff image (highlighting differences)

View these in the HTML report:
```bash
npm run test:report
```

## Advanced Usage

### Custom Screenshot Options
```typescript
await expect(page).toHaveScreenshot('custom.png', {
  fullPage: true,
  clip: { x: 0, y: 0, width: 800, height: 600 },
  mask: [page.locator('.dynamic-content')],
  maxDiffPixelRatio: 0.1
});
```

### Conditional Testing
```typescript
test('Dark mode', async ({ page }) => {
  const darkModeSupported = await page.evaluate(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  if (darkModeSupported) {
    // Run dark mode tests
  }
});
```

## Integration with Design System

Visual tests can help ensure design system compliance:
1. Component consistency
2. Color palette adherence
3. Typography standards
4. Spacing and layout rules

## Contributing

1. Write descriptive test names
2. Group related tests
3. Add comments for complex scenarios
4. Keep tests maintainable and DRY