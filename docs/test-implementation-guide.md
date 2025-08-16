# UpCoach Test Implementation Guide

## Quick Start

This guide provides practical implementation steps for the UpCoach test automation strategy.

## 1. Setting Up Test Infrastructure

### Install Required Dependencies

```bash
# Root level dependencies
npm install -D @upcoach/test-contracts @upcoach/test-utils
npm install -D @pact-foundation/pact jest-pact
npm install -D @percy/cli @percy/playwright
npm install -D artillery @artillery/plugin-expect

# Backend specific
cd backend
npm install -D supertest @types/supertest
npm install -D jest-extended jest-mock-extended

# Frontend specific (for each app)
cd admin-panel
npm install -D @testing-library/react @testing-library/user-event
npm install -D @testing-library/jest-dom msw vitest-fetch-mock

# Mobile app
cd mobile-app
flutter pub add --dev golden_toolkit mockito build_runner
flutter pub add --dev integration_test flutter_driver
```

### Configure Test Environments

Create `.env.test` files for each service:

```bash
# backend/.env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/upcoach_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
STRIPE_SECRET_KEY=sk_test_xxx
OPENAI_API_KEY=test-key

# admin-panel/.env.test
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=test
```

## 2. Implementing Unit Tests

### Backend Unit Test Example

```typescript
// backend/src/services/__tests__/UnifiedCacheService.test.ts
import { UnifiedCacheService } from '../UnifiedCacheService';
import { createMockRedisClient } from '@upcoach/test-utils';

describe('UnifiedCacheService', () => {
  let cacheService: UnifiedCacheService;
  let mockRedis: jest.Mocked<RedisClient>;

  beforeEach(() => {
    mockRedis = createMockRedisClient();
    cacheService = new UnifiedCacheService(mockRedis);
  });

  describe('set', () => {
    it('should store value with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      await cacheService.set(key, value);
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        key,
        300, // default TTL
        JSON.stringify(value)
      );
    });

    it('should handle serialization errors', async () => {
      const circularRef: any = { data: 'test' };
      circularRef.self = circularRef;
      
      await expect(
        cacheService.set('key', circularRef)
      ).rejects.toThrow('Serialization error');
    });
  });
});
```

### Frontend Component Test Example

```typescript
// admin-panel/src/components/__tests__/FinancialDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialDashboard } from '../FinancialDashboard';
import { createMonthlySnapshots } from '@upcoach/test-utils';
import { server } from '../../test/mocks/server';
import { rest } from 'msw';

describe('FinancialDashboard', () => {
  it('displays MRR with growth indicator', async () => {
    const mockData = createMonthlySnapshots(3);
    
    server.use(
      rest.get('/api/dashboard/financial', (req, res, ctx) => {
        return res(ctx.json({ snapshots: mockData }));
      })
    );
    
    render(<FinancialDashboard />);
    
    await waitFor(() => {
      const mrrElement = screen.getByTestId('mrr-value');
      expect(mrrElement).toHaveTextContent('$12,000');
      
      const growthElement = screen.getByTestId('mrr-growth');
      expect(growthElement).toHaveTextContent('+8.3%');
      expect(growthElement).toHaveClass('text-green-600');
    });
  });

  it('filters data by date range', async () => {
    const user = userEvent.setup();
    render(<FinancialDashboard />);
    
    const dateRangePicker = screen.getByLabelText('Date Range');
    await user.click(dateRangePicker);
    
    const lastMonthOption = screen.getByText('Last 30 days');
    await user.click(lastMonthOption);
    
    await waitFor(() => {
      expect(screen.getByTestId('chart-title')).toHaveTextContent(
        'Financial Metrics - Last 30 days'
      );
    });
  });
});
```

## 3. Implementing Integration Tests

### API Integration Test

```typescript
// backend/tests/integration/user-flow.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../helpers';
import { UserFactory, SubscriptionFactory } from '@upcoach/test-utils';

describe('User Registration and Subscription Flow', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('completes full user journey', async () => {
    // 1. Register new user
    const userData = UserFactory.build();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: userData.email,
        password: 'SecurePass123!',
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
    
    expect(registerResponse.status).toBe(201);
    const { token, userId } = registerResponse.body;
    
    // 2. Complete onboarding
    const onboardingResponse = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goals: ['weight-loss', 'stress-reduction'],
        preferences: { coachingStyle: 'supportive' },
      });
    
    expect(onboardingResponse.status).toBe(200);
    
    // 3. Create subscription
    const subscriptionResponse = await request(app)
      .post('/api/subscriptions/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        plan: 'premium',
        paymentMethodId: 'pm_test_123',
      });
    
    expect(subscriptionResponse.status).toBe(201);
    expect(subscriptionResponse.body).toMatchObject({
      status: 'active',
      plan: 'premium',
    });
    
    // 4. Verify user dashboard access
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body).toHaveProperty('subscription');
    expect(dashboardResponse.body).toHaveProperty('goals');
  });
});
```

## 4. Implementing E2E Tests

### Playwright E2E Test

```typescript
// tests/e2e/admin-financial-management.spec.ts
import { test, expect } from '@playwright/test';
import { AdminUserFactory } from '@upcoach/test-utils';

test.describe('Admin Financial Management', () => {
  let adminUser: any;
  
  test.beforeEach(async ({ page }) => {
    // Create admin user and login
    adminUser = AdminUserFactory.build();
    await page.goto('/admin/login');
    await page.fill('[name="email"]', adminUser.email);
    await page.fill('[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });
  
  test('view and export financial reports', async ({ page }) => {
    // Navigate to financial dashboard
    await page.click('[data-testid="nav-financial"]');
    await expect(page).toHaveURL('/admin/financial');
    
    // Verify MRR display
    const mrrCard = page.locator('[data-testid="mrr-card"]');
    await expect(mrrCard).toBeVisible();
    await expect(mrrCard).toContainText('Monthly Recurring Revenue');
    
    // Change date range
    await page.click('[data-testid="date-range-picker"]');
    await page.click('text=Last Quarter');
    
    // Wait for chart update
    await page.waitForResponse('**/api/dashboard/financial**');
    
    // Export report
    await page.click('[data-testid="export-button"]');
    await page.click('text=Export as CSV');
    
    // Verify download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('financial-report');
    expect(download.suggestedFilename()).toContain('.csv');
  });
  
  test('manage subscription pricing', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    
    // Edit premium plan pricing
    await page.click('[data-testid="edit-premium-plan"]');
    
    const priceInput = page.locator('[name="price"]');
    await priceInput.clear();
    await priceInput.fill('39.99');
    
    await page.click('[data-testid="save-changes"]');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText(
      'Pricing updated successfully'
    );
    
    // Verify price change reflected
    await page.reload();
    await expect(
      page.locator('[data-testid="premium-plan-price"]')
    ).toContainText('$39.99');
  });
});
```

## 5. Implementing Contract Tests

### Provider Contract Test

```typescript
// backend/tests/contracts/user-service.provider.test.ts
import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import { app } from '../../src/app';

describe('User Service Provider Contract Tests', () => {
  const server = app.listen(8080);
  
  afterAll(() => {
    server.close();
  });
  
  it('validates the expectations of AdminPanel consumer', () => {
    const opts = {
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:8080',
      pactUrls: [
        path.resolve(__dirname, '../../../pacts/adminpanel-userservice.json'),
      ],
      stateHandlers: {
        'user with id 123 exists': async () => {
          await seedTestUser({ id: '123' });
        },
        'provider is ready to create users': async () => {
          await clearTestDatabase();
        },
      },
      requestFilter: (req: any) => {
        // Add auth token for protected endpoints
        req.headers['Authorization'] = 'Bearer test-token';
      },
    };
    
    return new Verifier(opts).verifyProvider();
  });
});
```

### Consumer Contract Test

```typescript
// admin-panel/tests/contracts/user-service.consumer.test.ts
import { pactWith } from 'jest-pact';
import { userServicePact, userInteractions } from '@upcoach/test-contracts';
import { UserService } from '../../src/services/UserService';

pactWith(
  { consumer: 'AdminPanel', provider: 'UserService' },
  (provider) => {
    describe('User Service Consumer Contract', () => {
      let userService: UserService;
      
      beforeEach(() => {
        userService = new UserService({
          baseUrl: provider.mockService.baseUrl,
        });
      });
      
      it('fetches user by ID', async () => {
        await provider.addInteraction(userInteractions.getUserById);
        
        const user = await userService.getById('123');
        
        expect(user).toHaveProperty('id', '123');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      });
      
      it('creates new user', async () => {
        await provider.addInteraction(userInteractions.createUser);
        
        const newUser = await userService.create({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'user',
        });
        
        expect(newUser).toHaveProperty('id');
        expect(newUser.email).toBe('newuser@example.com');
      });
    });
  }
);
```

## 6. Implementing Visual Regression Tests

### Percy Visual Tests

```typescript
// visual-tests/admin-dashboard.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Admin Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@test.upcoach.ai');
    await page.fill('[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });
  
  test('financial dashboard components', async ({ page }) => {
    await page.goto('/admin/financial');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="mrr-chart"]');
    await page.waitForTimeout(1000); // Ensure animations complete
    
    // Take snapshots at different viewport sizes
    await percySnapshot(page, 'Financial Dashboard - Desktop');
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await percySnapshot(page, 'Financial Dashboard - Tablet');
    
    await page.setViewportSize({ width: 375, height: 812 });
    await percySnapshot(page, 'Financial Dashboard - Mobile');
  });
  
  test('dark mode variations', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // Enable dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Theme transition
    
    await page.goto('/admin/financial');
    await percySnapshot(page, 'Financial Dashboard - Dark Mode');
  });
});
```

## 7. Running Tests

### Local Development

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run visual regression tests
npm run test:visual

# Run performance tests
npm run test:performance
```

### CI/CD Pipeline

```bash
# GitHub Actions will automatically run on:
# - Pull requests to main/develop
# - Pushes to main
# - Daily scheduled runs at 2 AM UTC

# Manual trigger
gh workflow run test-pipeline.yml
```

### Test Reports

Access test reports at:
- Coverage: `http://localhost:8000/coverage`
- E2E Report: `http://localhost:9323` (Playwright report)
- Performance: `http://localhost:3000/reports/performance`
- Dashboard: `http://localhost:3000/test-dashboard`

## 8. Debugging Failed Tests

### Enable Debug Mode

```bash
# Playwright debug mode
PWDEBUG=1 npm run test:e2e

# Jest debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Flutter debug
flutter test --start-paused
```

### View Test Artifacts

```bash
# Download artifacts from CI
gh run download <run-id>

# View Playwright traces
npx playwright show-trace trace.zip

# View coverage report
open coverage/index.html
```

## 9. Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Test Isolation**: Each test should be independent and not rely on other tests
3. **Mock External Services**: Use MSW for API mocking, avoid real network calls
4. **Use Factories**: Leverage test factories for consistent test data
5. **Parallel Execution**: Run tests in parallel where possible
6. **Cleanup**: Always clean up test data after tests complete
7. **Assertions**: Use specific assertions rather than generic ones
8. **Wait Strategies**: Use proper wait mechanisms instead of hard-coded delays

## 10. Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Flaky tests | Add proper wait conditions, check for race conditions |
| Slow tests | Use test parallelization, optimize database queries |
| Memory leaks | Ensure proper cleanup in afterEach/afterAll hooks |
| Port conflicts | Use dynamic port allocation or Docker containers |
| Coverage gaps | Add tests for edge cases and error scenarios |

## Resources

- [Test Plan Documentation](./test-plan.md)
- [CI/CD Pipeline](.github/workflows/test-pipeline.yml)
- [Test Utils Package](packages/test-utils/README.md)
- [Contract Schemas](packages/test-contracts/README.md)

---

*For questions or support, contact the QA team at qa-team@upcoach.ai*