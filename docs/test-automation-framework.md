# Test Automation Framework Implementation Guide

## Overview

This document provides specific implementation guidance for the UpCoach testing automation framework, including tool recommendations, configuration examples, and integration patterns.

## Framework Architecture

### 1. Backend API Testing Framework

**Primary Framework:** Jest + TypeScript + Supertest
**Configuration:** Already excellent in `jest.config.comprehensive.js`

#### Enhanced Test Structure
```typescript
// services/api/src/tests/framework/BaseTestCase.ts
export abstract class BaseTestCase {
  protected app: Application;
  protected testDb: Database;

  async setUp(): Promise<void> {
    this.app = await createTestApplication();
    this.testDb = await createTestDatabase();
    await this.seedTestData();
  }

  async tearDown(): Promise<void> {
    await this.cleanupTestData();
    await this.testDb.close();
  }

  protected abstract seedTestData(): Promise<void>;
  protected abstract cleanupTestData(): Promise<void>;
}
```

#### API Contract Testing Framework
```typescript
// packages/test-contracts/src/framework/ContractTester.ts
export class APIContractTester {
  constructor(private schema: OpenAPISchema) {}

  async validateRequest(endpoint: string, payload: any): Promise<ValidationResult> {
    // Validate request against OpenAPI schema
    return this.schema.validateRequest(endpoint, payload);
  }

  async validateResponse(endpoint: string, response: any): Promise<ValidationResult> {
    // Validate response against OpenAPI schema
    return this.schema.validateResponse(endpoint, response);
  }
}
```

### 2. Frontend Testing Framework

**CMS Panel:** Vitest + React Testing Library + MSW
**Admin Panel:** Jest + React Testing Library + MSW

#### Component Testing Pattern
```typescript
// apps/cms-panel/src/tests/utils/renderWithProviders.tsx
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <MemoryRouter>
            {children}
          </MemoryRouter>
        </Provider>
      </QueryClientProvider>
    );
  }

  return { store, queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

#### Enhanced Component Test Example
```typescript
// apps/cms-panel/src/components/ContentEditor/ContentEditor.test.tsx
describe('ContentEditor', () => {
  let mockQueryClient: QueryClient;

  beforeEach(() => {
    mockQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
  });

  it('should handle content creation workflow', async () => {
    const { user } = renderWithProviders(
      <ContentEditor />,
      { queryClient: mockQueryClient }
    );

    // Test rich text editing
    const editor = screen.getByRole('textbox', { name: /content/i });
    await user.type(editor, 'Test content');

    // Test media upload
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(uploadButton, file);

    // Test publish workflow
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText(/published successfully/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Mobile Testing Framework

**Framework:** Flutter Test + Golden Tests + Integration Tests

#### Widget Test Framework Enhancement
```dart
// mobile-app/test/framework/widget_test_base.dart
abstract class WidgetTestBase {
  late WidgetTester tester;
  late MockGoRouter mockRouter;
  late MockAuthService mockAuthService;

  @mustCallSuper
  Future<void> setUp(WidgetTester tester) async {
    this.tester = tester;
    mockRouter = MockGoRouter();
    mockAuthService = MockAuthService();

    await tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/shared_preferences'),
      (MethodCall methodCall) async {
        return <String, dynamic>{};
      },
    );
  }

  Widget buildTestWidget(Widget child) {
    return MaterialApp(
      home: MultiProvider(
        providers: [
          Provider<AuthService>.value(value: mockAuthService),
          Provider<GoRouter>.value(value: mockRouter),
        ],
        child: child,
      ),
    );
  }
}
```

#### Golden Test Framework
```dart
// mobile-app/test/golden/golden_test_framework.dart
class GoldenTestFramework {
  static Future<void> testGolden(
    String description,
    Widget widget, {
    List<Device> devices = const [Device.phone, Device.tablet],
    List<ThemeData> themes = const [],
    List<Locale> locales = const [Locale('en')],
  }) async {
    testWidgets(description, (WidgetTester tester) async {
      for (final device in devices) {
        for (final theme in themes.isEmpty ? [ThemeData()] : themes) {
          for (final locale in locales) {
            await tester.binding.setSurfaceSize(device.size);

            await tester.pumpWidget(
              MaterialApp(
                theme: theme,
                locale: locale,
                home: widget,
              ),
            );

            await expectLater(
              find.byType(MaterialApp),
              matchesGoldenFile(
                'goldens/${description}_${device.name}_${theme.brightness.name}_${locale.languageCode}.png'
              ),
            );
          }
        }
      }
    });
  }
}
```

### 4. E2E Testing Framework

**Framework:** Playwright + TypeScript

#### Enhanced Page Object Model
```typescript
// tests/e2e/framework/BasePage.ts
export abstract class BasePage {
  constructor(protected page: Page) {}

  abstract get url(): string;
  abstract get pageTitle(): string;

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="page-loaded"]');
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `tests/e2e/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
```

#### CMS Content Management E2E Tests
```typescript
// tests/e2e/specs/cms-panel/content-management.spec.ts
import { test, expect } from '@playwright/test';
import { CMSLoginPage } from '../pages/CMSLoginPage';
import { ContentEditorPage } from '../pages/ContentEditorPage';

test.describe('CMS Content Management', () => {
  let loginPage: CMSLoginPage;
  let editorPage: ContentEditorPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new CMSLoginPage(page);
    editorPage = new ContentEditorPage(page);

    await loginPage.navigate();
    await loginPage.loginAsContentEditor();
  });

  test('should create and publish article', async () => {
    await editorPage.navigate();
    await editorPage.createNewArticle();

    await editorPage.setTitle('Test Article');
    await editorPage.setContent('This is a test article content.');
    await editorPage.uploadFeaturedImage('test-image.jpg');

    await editorPage.preview();
    await expect(editorPage.previewTitle).toHaveText('Test Article');

    await editorPage.publish();
    await expect(editorPage.publishedBanner).toBeVisible();
  });

  test('should handle concurrent editing', async ({ browser }) => {
    // Test simultaneous editing by multiple users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const editor1 = new ContentEditorPage(page1);
    const editor2 = new ContentEditorPage(page2);

    // Both users open the same article
    await editor1.openExistingArticle('article-123');
    await editor2.openExistingArticle('article-123');

    // User 1 makes changes
    await editor1.setTitle('Updated by User 1');

    // User 2 should see conflict warning
    await editor2.setTitle('Updated by User 2');
    await expect(editor2.conflictWarning).toBeVisible();
  });
});
```

## Security Testing Implementation

### 1. OWASP ZAP Integration
```typescript
// tests/security/framework/ZAPScanner.ts
export class ZAPSecurityScanner {
  private zapClient: ZapClient;

  constructor(private targetUrl: string) {
    this.zapClient = new ZapClient({
      proxy: 'http://localhost:8080'
    });
  }

  async performBasicScan(): Promise<SecurityScanResult> {
    // Spider the application
    await this.zapClient.spider.scan(this.targetUrl);
    await this.waitForSpiderCompletion();

    // Perform active scan
    await this.zapClient.ascan.scan(this.targetUrl);
    await this.waitForScanCompletion();

    // Generate report
    const alerts = await this.zapClient.core.alerts();
    return this.processAlerts(alerts);
  }

  async performAuthenticatedScan(credentials: AuthCredentials): Promise<SecurityScanResult> {
    // Configure authentication
    await this.configureAuthentication(credentials);

    // Perform authenticated scan
    return this.performBasicScan();
  }
}
```

### 2. Authentication Security Tests
```typescript
// tests/security/auth-security.test.ts
describe('Authentication Security', () => {
  test('should prevent brute force attacks', async () => {
    const attempts = [];

    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      );
    }

    const responses = await Promise.all(attempts);

    // Should be rate limited after 5 attempts
    expect(responses.slice(5).every(r => r.status === 429)).toBe(true);
  });

  test('should enforce strong password policies', async () => {
    const weakPasswords = [
      'password',
      '123456',
      'password123',
      'short'
    ];

    for (const password of weakPasswords) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password,
          confirmPassword: password
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password does not meet security requirements');
    }
  });
});
```

## Performance Testing Implementation

### 1. K6 Load Testing Framework
```javascript
// tests/performance/load-test-framework.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should be less than 10%
    response_time: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_duration: ['p(90)<400', 'p(95)<500', 'p(99)<1000'],
  },
};

export default function() {
  // Test API endpoints
  const responses = http.batch([
    ['GET', `${__ENV.BASE_URL}/api/users/profile`],
    ['GET', `${__ENV.BASE_URL}/api/content/articles`],
    ['POST', `${__ENV.BASE_URL}/api/content/search`, { query: 'test' }],
  ]);

  responses.forEach((response) => {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
  });

  sleep(1);
}
```

### 2. Frontend Performance Testing
```typescript
// tests/performance/lighthouse-ci.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:7002/cms',
        'http://localhost:8006/admin',
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
  },
};
```

## Accessibility Testing Implementation

### 1. Automated Accessibility Testing
```typescript
// tests/accessibility/a11y-test-framework.ts
import { toHaveNoViolations } from 'jest-axe';
import { configureAxe } from 'jest-axe';

expect.extend(toHaveNoViolations);

const axe = configureAxe({
  rules: {
    // Customize rules as needed
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
  },
});

export async function testAccessibility(
  component: ReactWrapper | HTMLElement,
  options?: AxeOptions
): Promise<void> {
  const results = await axe(component, options);
  expect(results).toHaveNoViolations();
}

// Usage in component tests
test('ContentEditor should be accessible', async () => {
  const { container } = render(<ContentEditor />);
  await testAccessibility(container);
});
```

### 2. Screen Reader Testing Framework
```typescript
// tests/accessibility/screen-reader-tests.ts
import { test, expect } from '@playwright/test';

test.describe('Screen Reader Accessibility', () => {
  test('should provide proper screen reader announcements', async ({ page }) => {
    // Enable screen reader mode
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/cms/content/new');

    // Test form labels
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveAttribute('aria-label', 'Article title');

    // Test error announcements
    await page.click('button[type="submit"]');
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/cms/dashboard');

    // Test tab order
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to main content');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Main navigation');

    // Test escape key functionality
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

## Test Data Management

### 1. Test Data Factory Framework
```typescript
// packages/test-utils/src/factories/enhanced-factories.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

export const userFactory = Factory.define<User>(({ sequence }) => ({
  id: sequence,
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  role: 'user',
  createdAt: faker.date.past(),
  preferences: {
    notifications: true,
    theme: 'light',
    language: 'en',
  },
}));

export const contentFactory = Factory.define<Content>(({ sequence }) => ({
  id: sequence,
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  status: 'draft',
  authorId: userFactory.build().id,
  tags: faker.lorem.words(3).split(' '),
  metadata: {
    wordCount: faker.number.int({ min: 100, max: 1000 }),
    readingTime: faker.number.int({ min: 1, max: 10 }),
  },
}));

// Usage in tests
const testUser = userFactory.build({ role: 'admin' });
const testContent = contentFactory.buildList(5, { status: 'published' });
```

### 2. Database Test Utilities
```typescript
// packages/test-utils/src/database/test-db-manager.ts
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private connections: Map<string, Database> = new Map();

  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  async createTestDatabase(testName: string): Promise<Database> {
    const dbName = `test_${testName}_${Date.now()}`;
    const connection = await createConnection({
      ...baseConfig,
      database: dbName,
    });

    await connection.runMigrations();
    this.connections.set(testName, connection);

    return connection;
  }

  async seedTestData(testName: string, seedData: any[]): Promise<void> {
    const connection = this.connections.get(testName);
    if (!connection) throw new Error(`No connection found for test: ${testName}`);

    await connection.transaction(async (manager) => {
      for (const data of seedData) {
        await manager.save(data);
      }
    });
  }

  async cleanupTestDatabase(testName: string): Promise<void> {
    const connection = this.connections.get(testName);
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
      this.connections.delete(testName);
    }
  }
}
```

This test automation framework provides a comprehensive foundation for achieving the 85%+ coverage target while maintaining high quality standards across all testing categories.