# Visual Regression Testing Framework

## Overview

This document outlines the implementation of a comprehensive visual regression testing framework for the UpCoach platform, ensuring UI consistency across multiple platforms (Flutter mobile app, React admin/CMS panels, and Next.js landing page) and preventing unintended visual changes during development.

## Current Visual Testing Infrastructure

### Existing Setup
```
visual-tests/
├── tests/
│   └── landing-page.spec.ts
├── package.json
└── playwright.config.ts
```

### Current Limitations
- Limited coverage (only landing page)
- No mobile app visual testing
- No component-level testing
- No baseline management system
- No automated baseline updates

## Visual Testing Strategy

### Multi-Platform Approach

```
┌─────────────────────────────────────────────────────────────┐
│                   Visual Testing Architecture               │
├─────────────────────────────────────────────────────────────┤
│  Flutter Mobile App    │  React Admin Panel  │  Next.js     │
│  (Golden Tests)        │  (Playwright)       │  (Playwright) │
├─────────────────────────────────────────────────────────────┤
│  Component Testing     │  Page Testing       │  E2E Testing  │
│  Widget Screenshots    │  Layout Validation  │  User Flows   │
├─────────────────────────────────────────────────────────────┤
│               Centralized Baseline Management               │
│              (Percy.io / Chromatic / Self-hosted)           │
└─────────────────────────────────────────────────────────────┘
```

### Coverage Matrix

| Platform | Component Level | Page Level | Cross-browser | Mobile Viewports | Accessibility |
|----------|----------------|------------|---------------|------------------|---------------|
| Flutter Mobile | ✅ Golden Tests | ✅ Integration | N/A | ✅ Native | ✅ Semantics |
| Admin Panel | ✅ Storybook | ✅ Playwright | ✅ Chrome/FF/Safari | ✅ Responsive | ✅ Axe Core |
| CMS Panel | ✅ Storybook | ✅ Playwright | ✅ Chrome/FF/Safari | ✅ Responsive | ✅ Axe Core |
| Landing Page | ✅ Components | ✅ Playwright | ✅ Chrome/FF/Safari | ✅ Responsive | ✅ Lighthouse |

## Implementation Phase 1: Enhanced Playwright Setup

### 1.1 Comprehensive Playwright Configuration

```typescript
// visual-tests/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Tablet devices
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'tablet-firefox',
      use: {
        ...devices['iPad Pro'],
        channel: 'firefox'
      },
    },

    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'mobile-edge',
      use: { ...devices['Galaxy S9+'] },
    }
  ],

  expect: {
    // Visual comparison settings
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'strict',
      maxDiffPixels: 1000
    },
    toMatchScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 500
    }
  },

  webServer: [
    {
      command: 'npm run start:admin',
      port: 1006,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start:cms',
      port: 1007,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start:landing',
      port: 1005,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start:api',
      port: 1080,
      reuseExistingServer: !process.env.CI,
    }
  ]
});
```

### 1.2 Admin Panel Visual Tests

```typescript
// visual-tests/tests/admin-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'admin@test.com',
            name: 'Test Admin',
            role: 'admin'
          },
          token: 'mock-token'
        })
      });
    });

    // Mock dashboard data
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1250,
          activeCoaches: 45,
          totalSessions: 3200,
          revenueThisMonth: 45000
        })
      });
    });

    await page.goto('http://localhost:1006/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Dashboard Layout', () => {
    test('should render dashboard with all components', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Full page screenshot
      await expect(page).toHaveScreenshot('admin-dashboard-full.png');

      // Individual component screenshots
      await expect(page.locator('[data-testid="stats-cards"]'))
        .toHaveScreenshot('dashboard-stats-cards.png');

      await expect(page.locator('[data-testid="user-growth-chart"]'))
        .toHaveScreenshot('dashboard-user-growth-chart.png');

      await expect(page.locator('[data-testid="recent-activities"]'))
        .toHaveScreenshot('dashboard-recent-activities.png');
    });

    test('should render responsive dashboard on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('admin-dashboard-tablet.png');
    });

    test('should render dashboard in dark mode', async ({ page }) => {
      // Toggle dark mode
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500); // Wait for theme transition

      await expect(page).toHaveScreenshot('admin-dashboard-dark.png');
    });
  });

  test.describe('User Management', () => {
    test('should render user list with filters', async ({ page }) => {
      await page.goto('http://localhost:1006/users');

      // Mock user data
      await page.route('**/api/users**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                status: 'active',
                lastLogin: '2023-12-01T10:00:00Z'
              },
              {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'coach',
                status: 'active',
                lastLogin: '2023-12-01T09:30:00Z'
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 50,
              totalPages: 5
            }
          })
        });
      });

      await page.waitForLoadState('networkidle');

      // User list with filters
      await expect(page).toHaveScreenshot('admin-user-list.png');

      // Filter controls
      await expect(page.locator('[data-testid="user-filters"]'))
        .toHaveScreenshot('admin-user-filters.png');

      // User table
      await expect(page.locator('[data-testid="user-table"]'))
        .toHaveScreenshot('admin-user-table.png');
    });

    test('should render user creation modal', async ({ page }) => {
      await page.goto('http://localhost:1006/users');
      await page.click('[data-testid="create-user-button"]');

      await expect(page.locator('[data-testid="create-user-modal"]'))
        .toHaveScreenshot('admin-create-user-modal.png');
    });

    test('should render user edit form', async ({ page }) => {
      await page.goto('http://localhost:1006/users/1/edit');

      // Mock user edit data
      await page.route('**/api/users/1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            profile: {
              bio: 'Fitness enthusiast',
              preferences: {
                theme: 'light',
                notifications: true
              }
            }
          })
        });
      });

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('admin-user-edit-form.png');
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should render analytics with charts', async ({ page }) => {
      await page.goto('http://localhost:1006/analytics');

      // Mock analytics data
      await page.route('**/api/analytics/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userGrowth: [
              { month: 'Jan', users: 100 },
              { month: 'Feb', users: 150 },
              { month: 'Mar', users: 200 }
            ],
            sessionStats: {
              totalSessions: 5000,
              averageDuration: 45,
              completionRate: 85
            },
            revenueData: [
              { period: 'Q1', revenue: 10000 },
              { period: 'Q2', revenue: 15000 },
              { period: 'Q3', revenue: 18000 }
            ]
          })
        });
      });

      await page.waitForLoadState('networkidle');

      // Full analytics page
      await expect(page).toHaveScreenshot('admin-analytics-full.png');

      // Individual chart components
      await expect(page.locator('[data-testid="user-growth-chart"]'))
        .toHaveScreenshot('admin-analytics-user-growth.png');

      await expect(page.locator('[data-testid="session-stats-chart"]'))
        .toHaveScreenshot('admin-analytics-session-stats.png');

      await expect(page.locator('[data-testid="revenue-chart"]'))
        .toHaveScreenshot('admin-analytics-revenue.png');
    });
  });

  test.describe('Settings Pages', () => {
    test('should render system settings', async ({ page }) => {
      await page.goto('http://localhost:1006/settings');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('admin-settings-system.png');
    });

    test('should render user roles management', async ({ page }) => {
      await page.goto('http://localhost:1006/settings/roles');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('admin-settings-roles.png');
    });
  });
});
```

### 1.3 CMS Panel Visual Tests

```typescript
// visual-tests/tests/cms-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CMS Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for CMS
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'editor@test.com',
            name: 'Test Editor',
            role: 'editor'
          },
          token: 'mock-editor-token'
        })
      });
    });

    await page.goto('http://localhost:1007/login');
    await page.fill('[data-testid="email"]', 'editor@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Content Dashboard', () => {
    test('should render content overview', async ({ page }) => {
      // Mock content statistics
      await page.route('**/api/content/stats', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalArticles: 150,
            publishedArticles: 120,
            draftArticles: 30,
            scheduledArticles: 5,
            totalViews: 50000,
            averageReadTime: 4.5
          })
        });
      });

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('cms-dashboard-overview.png');

      // Content statistics cards
      await expect(page.locator('[data-testid="content-stats"]'))
        .toHaveScreenshot('cms-content-stats.png');
    });

    test('should render recent articles widget', async ({ page }) => {
      // Mock recent articles
      await page.route('**/api/content/articles/recent', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            articles: [
              {
                id: '1',
                title: 'Getting Started with Fitness',
                status: 'published',
                author: 'John Coach',
                publishedAt: '2023-12-01T10:00:00Z'
              },
              {
                id: '2',
                title: 'Nutrition Basics',
                status: 'draft',
                author: 'Jane Expert',
                createdAt: '2023-11-30T15:00:00Z'
              }
            ]
          })
        });
      });

      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="recent-articles"]'))
        .toHaveScreenshot('cms-recent-articles.png');
    });
  });

  test.describe('Article Editor', () => {
    test('should render article creation form', async ({ page }) => {
      await page.goto('http://localhost:1007/articles/create');
      await page.waitForLoadState('networkidle');

      // Full editor layout
      await expect(page).toHaveScreenshot('cms-article-editor-full.png');

      // Editor toolbar
      await expect(page.locator('[data-testid="editor-toolbar"]'))
        .toHaveScreenshot('cms-editor-toolbar.png');

      // Article metadata form
      await expect(page.locator('[data-testid="article-metadata"]'))
        .toHaveScreenshot('cms-article-metadata.png');
    });

    test('should render rich text editor with content', async ({ page }) => {
      await page.goto('http://localhost:1007/articles/create');

      // Add content to editor
      await page.fill('[data-testid="article-title"]', 'Sample Article Title');
      await page.fill('[data-testid="article-content"]', 'This is sample article content with **bold text** and *italic text*.');

      await page.waitForTimeout(500); // Wait for content to render

      await expect(page.locator('[data-testid="rich-text-editor"]'))
        .toHaveScreenshot('cms-rich-text-editor-with-content.png');
    });

    test('should render article preview mode', async ({ page }) => {
      await page.goto('http://localhost:1007/articles/1/edit');

      // Mock article data
      await page.route('**/api/content/articles/1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            title: 'Fitness Fundamentals',
            content: 'Complete guide to fitness fundamentals...',
            status: 'draft',
            author: 'Expert Coach',
            tags: ['fitness', 'beginner', 'health']
          })
        });
      });

      await page.waitForLoadState('networkidle');

      // Switch to preview mode
      await page.click('[data-testid="preview-mode-toggle"]');
      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="article-preview"]'))
        .toHaveScreenshot('cms-article-preview.png');
    });
  });

  test.describe('Media Library', () => {
    test('should render media library grid', async ({ page }) => {
      await page.goto('http://localhost:1007/media');

      // Mock media files
      await page.route('**/api/content/media**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            media: [
              {
                id: '1',
                filename: 'fitness-image-1.jpg',
                url: 'https://via.placeholder.com/300x200/0066cc/ffffff?text=Fitness+1',
                type: 'image',
                size: 156789,
                uploadedAt: '2023-12-01T10:00:00Z'
              },
              {
                id: '2',
                filename: 'nutrition-video.mp4',
                url: 'https://via.placeholder.com/300x200/cc6600/ffffff?text=Video',
                type: 'video',
                size: 5467890,
                uploadedAt: '2023-11-30T14:00:00Z'
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 45,
              totalPages: 3
            }
          })
        });
      });

      await page.waitForLoadState('networkidle');

      // Media grid layout
      await expect(page).toHaveScreenshot('cms-media-library-grid.png');

      // Media filters
      await expect(page.locator('[data-testid="media-filters"]'))
        .toHaveScreenshot('cms-media-filters.png');
    });

    test('should render media upload modal', async ({ page }) => {
      await page.goto('http://localhost:1007/media');
      await page.click('[data-testid="upload-media-button"]');

      await expect(page.locator('[data-testid="media-upload-modal"]'))
        .toHaveScreenshot('cms-media-upload-modal.png');
    });
  });

  test.describe('Content Workflow', () => {
    test('should render publishing workflow', async ({ page }) => {
      await page.goto('http://localhost:1007/workflow');

      // Mock workflow data
      await page.route('**/api/content/workflow**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pendingReview: [
              {
                id: '1',
                title: 'Article Awaiting Review',
                author: 'Content Writer',
                submittedAt: '2023-12-01T09:00:00Z'
              }
            ],
            scheduled: [
              {
                id: '2',
                title: 'Upcoming Article',
                author: 'Senior Editor',
                scheduledFor: '2023-12-05T08:00:00Z'
              }
            ]
          })
        });
      });

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('cms-publishing-workflow.png');
    });
  });
});
```

### 1.4 Landing Page Visual Tests

```typescript
// visual-tests/tests/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1005');
  });

  test.describe('Homepage Layout', () => {
    test('should render complete homepage', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Full page screenshot with scroll
      await expect(page).toHaveScreenshot('landing-homepage-full.png', {
        fullPage: true
      });
    });

    test('should render hero section', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="hero-section"]'))
        .toHaveScreenshot('landing-hero-section.png');
    });

    test('should render features section', async ({ page }) => {
      await page.waitForSelector('[data-testid="features-section"]');

      await expect(page.locator('[data-testid="features-section"]'))
        .toHaveScreenshot('landing-features-section.png');
    });

    test('should render testimonials section', async ({ page }) => {
      await page.waitForSelector('[data-testid="testimonials-section"]');

      await expect(page.locator('[data-testid="testimonials-section"]'))
        .toHaveScreenshot('landing-testimonials-section.png');
    });

    test('should render pricing section', async ({ page }) => {
      await page.waitForSelector('[data-testid="pricing-section"]');

      await expect(page.locator('[data-testid="pricing-section"]'))
        .toHaveScreenshot('landing-pricing-section.png');
    });

    test('should render footer', async ({ page }) => {
      await page.waitForSelector('[data-testid="footer"]');

      await expect(page.locator('[data-testid="footer"]'))
        .toHaveScreenshot('landing-footer.png');
    });
  });

  test.describe('Navigation', () => {
    test('should render navigation bar', async ({ page }) => {
      await expect(page.locator('[data-testid="navigation"]'))
        .toHaveScreenshot('landing-navigation.png');
    });

    test('should render mobile navigation menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.click('[data-testid="mobile-menu-toggle"]');

      await expect(page.locator('[data-testid="mobile-menu"]'))
        .toHaveScreenshot('landing-mobile-menu.png');
    });
  });

  test.describe('Interactive Elements', () => {
    test('should render CTA buttons in hover state', async ({ page }) => {
      const ctaButton = page.locator('[data-testid="primary-cta"]');
      await ctaButton.hover();

      await expect(ctaButton)
        .toHaveScreenshot('landing-cta-hover.png');
    });

    test('should render signup modal', async ({ page }) => {
      await page.click('[data-testid="signup-button"]');

      await expect(page.locator('[data-testid="signup-modal"]'))
        .toHaveScreenshot('landing-signup-modal.png');
    });
  });

  test.describe('Responsive Design', () => {
    test('should render on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('landing-tablet-view.png', {
        fullPage: true
      });
    });

    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('landing-mobile-view.png', {
        fullPage: true
      });
    });
  });
});
```

## Implementation Phase 2: Flutter Golden Tests

### 2.1 Flutter Golden Test Setup

```dart
// mobile-app/test/golden/golden_test_config.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

class GoldenTestConfig {
  static Future<void> initialize() async {
    await loadAppFonts();
  }

  static const devices = [
    Device.phone,
    Device.iphone11,
    Device.tabletPortrait,
    Device.tabletLandscape,
  ];

  static Widget wrapWithApp(Widget child) {
    return MaterialApp(
      theme: ThemeData(
        primarySwatch: Colors.blue,
        fontFamily: 'Poppins',
      ),
      home: Scaffold(body: child),
      debugShowCheckedModeBanner: false,
    );
  }

  static Widget wrapWithProviders(Widget child) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MockAuthProvider()),
        ChangeNotifierProvider(create: (_) => MockThemeProvider()),
      ],
      child: wrapWithApp(child),
    );
  }
}
```

### 2.2 Widget Golden Tests

```dart
// mobile-app/test/golden/widgets/bottom_navigation_golden_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:upcoach_mobile/widgets/bottom_navigation.dart';
import '../golden_test_config.dart';

void main() {
  group('BottomNavigation Golden Tests', () {
    setUpAll(() async {
      await GoldenTestConfig.initialize();
    });

    testGoldens('should render bottom navigation with all tabs', (tester) async {
      final widget = GoldenTestConfig.wrapWithProviders(
        const BottomNavigationWidget(currentIndex: 0),
      );

      await tester.pumpWidgetBuilder(
        widget,
        surfaceSize: const Size(375, 80),
      );

      await screenMatchesGolden(tester, 'bottom_navigation_default');
    });

    testGoldens('should render bottom navigation with active tab', (tester) async {
      final widget = GoldenTestConfig.wrapWithProviders(
        const BottomNavigationWidget(currentIndex: 2),
      );

      await tester.pumpWidgetBuilder(
        widget,
        surfaceSize: const Size(375, 80),
      );

      await screenMatchesGolden(tester, 'bottom_navigation_active_tab');
    });

    testGoldens('should render bottom navigation on different devices', (tester) async {
      final widget = GoldenTestConfig.wrapWithProviders(
        const BottomNavigationWidget(currentIndex: 1),
      );

      await tester.pumpDeviceBuilder(
        DeviceBuilder()
          ..overrideDevicesForAllScenarios(devices: GoldenTestConfig.devices)
          ..addScenario(
            widget: widget,
            name: 'bottom_navigation_devices',
          ),
      );

      await screenMatchesGolden(tester, 'bottom_navigation_devices');
    });
  });
}
```

### 2.3 Screen Golden Tests

```dart
// mobile-app/test/golden/screens/dashboard_golden_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:upcoach_mobile/screens/dashboard_screen.dart';
import '../golden_test_config.dart';

void main() {
  group('Dashboard Screen Golden Tests', () {
    setUpAll(() async {
      await GoldenTestConfig.initialize();
    });

    testGoldens('should render dashboard with sample data', (tester) async {
      // Mock dashboard data
      final mockDashboardData = DashboardData(
        userName: 'John Doe',
        streakCount: 15,
        todaysTasks: 3,
        completedTasks: 2,
        weeklyProgress: 0.75,
        recentActivities: [
          Activity(name: 'Morning Workout', completed: true),
          Activity(name: 'Meditation', completed: true),
          Activity(name: 'Reading', completed: false),
        ],
      );

      final widget = GoldenTestConfig.wrapWithProviders(
        DashboardScreen(data: mockDashboardData),
      );

      await tester.pumpWidgetBuilder(
        widget,
        surfaceSize: const Size(375, 812), // iPhone 11 size
      );

      await screenMatchesGolden(tester, 'dashboard_with_data');
    });

    testGoldens('should render dashboard in dark mode', (tester) async {
      final widget = MaterialApp(
        theme: ThemeData.dark(),
        home: DashboardScreen(data: mockDashboardData),
        debugShowCheckedModeBanner: false,
      );

      await tester.pumpWidgetBuilder(
        widget,
        surfaceSize: const Size(375, 812),
      );

      await screenMatchesGolden(tester, 'dashboard_dark_mode');
    });

    testGoldens('should render dashboard on different devices', (tester) async {
      final widget = GoldenTestConfig.wrapWithProviders(
        DashboardScreen(data: mockDashboardData),
      );

      await tester.pumpDeviceBuilder(
        DeviceBuilder()
          ..overrideDevicesForAllScenarios(devices: [
            Device.phone,
            Device.iphone11,
            Device.tabletPortrait,
          ])
          ..addScenario(
            widget: widget,
            name: 'dashboard_responsive',
          ),
      );

      await screenMatchesGolden(tester, 'dashboard_responsive');
    });
  });
}
```

## Implementation Phase 3: Baseline Management System

### 3.1 Automated Baseline Management

```typescript
// tools/visual-testing/baseline-manager.ts
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface BaselineMetadata {
  version: string;
  createdAt: string;
  branch: string;
  commitHash: string;
  platform: string;
  viewport: string;
  theme: string;
}

class BaselineManager {
  private baselineDir: string;
  private metadataFile: string;

  constructor(baselineDir: string = 'visual-tests/baselines') {
    this.baselineDir = baselineDir;
    this.metadataFile = path.join(baselineDir, 'metadata.json');
  }

  async createBaseline(
    testName: string,
    screenshotPath: string,
    metadata: Partial<BaselineMetadata>
  ): Promise<void> {
    const baselineMetadata: BaselineMetadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      branch: this.getCurrentBranch(),
      commitHash: this.getCurrentCommit(),
      platform: 'web',
      viewport: '1920x1080',
      theme: 'light',
      ...metadata
    };

    const baselinePath = this.getBaselinePath(testName, baselineMetadata);
    await this.ensureDirectoryExists(path.dirname(baselinePath));

    // Copy screenshot to baseline location
    await fs.copyFile(screenshotPath, baselinePath);

    // Update metadata
    await this.updateMetadata(testName, baselineMetadata);

    console.log(`✅ Created baseline: ${baselinePath}`);
  }

  async updateBaseline(
    testName: string,
    newScreenshotPath: string,
    reason: string
  ): Promise<void> {
    const metadata = await this.getMetadata(testName);

    if (!metadata) {
      throw new Error(`No baseline metadata found for test: ${testName}`);
    }

    // Create backup of old baseline
    const oldBaselinePath = this.getBaselinePath(testName, metadata);
    const backupPath = `${oldBaselinePath}.backup.${Date.now()}`;
    await fs.copyFile(oldBaselinePath, backupPath);

    // Update baseline
    await fs.copyFile(newScreenshotPath, oldBaselinePath);

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      version: this.incrementVersion(metadata.version),
      createdAt: new Date().toISOString(),
      commitHash: this.getCurrentCommit(),
      updateReason: reason
    };

    await this.updateMetadata(testName, updatedMetadata);

    console.log(`🔄 Updated baseline: ${oldBaselinePath}`);
    console.log(`📁 Backup created: ${backupPath}`);
  }

  async validateBaseline(
    testName: string,
    currentScreenshotPath: string,
    threshold: number = 0.2
  ): Promise<ValidationResult> {
    const metadata = await this.getMetadata(testName);

    if (!metadata) {
      return {
        valid: false,
        reason: 'No baseline found',
        action: 'CREATE_BASELINE'
      };
    }

    const baselinePath = this.getBaselinePath(testName, metadata);

    // Compare images using Playwright's image comparison
    const comparison = await this.compareImages(
      baselinePath,
      currentScreenshotPath,
      threshold
    );

    return {
      valid: comparison.passed,
      reason: comparison.passed ? 'Images match' : 'Visual differences detected',
      action: comparison.passed ? 'PASS' : 'REVIEW_REQUIRED',
      diffPath: comparison.diffPath,
      pixelDifference: comparison.pixelDifference,
      threshold
    };
  }

  private async compareImages(
    baselinePath: string,
    currentPath: string,
    threshold: number
  ): Promise<ImageComparison> {
    try {
      // Use Playwright's image comparison
      const { execSync } = require('child_process');
      const command = `npx playwright test-image-diff "${baselinePath}" "${currentPath}" --threshold=${threshold}`;

      execSync(command, { stdio: 'pipe' });

      return {
        passed: true,
        pixelDifference: 0,
        diffPath: null
      };
    } catch (error: any) {
      const diffPath = `${currentPath}.diff.png`;

      return {
        passed: false,
        pixelDifference: this.extractPixelDifference(error.message),
        diffPath
      };
    }
  }

  private getBaselinePath(testName: string, metadata: BaselineMetadata): string {
    const filename = `${testName}-${metadata.platform}-${metadata.viewport}-${metadata.theme}.png`;
    return path.join(this.baselineDir, metadata.platform, filename);
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getCurrentCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  private async updateMetadata(testName: string, metadata: BaselineMetadata): Promise<void> {
    let allMetadata: Record<string, BaselineMetadata> = {};

    try {
      const content = await fs.readFile(this.metadataFile, 'utf8');
      allMetadata = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    allMetadata[testName] = metadata;

    await fs.writeFile(
      this.metadataFile,
      JSON.stringify(allMetadata, null, 2),
      'utf8'
    );
  }

  private async getMetadata(testName: string): Promise<BaselineMetadata | null> {
    try {
      const content = await fs.readFile(this.metadataFile, 'utf8');
      const allMetadata = JSON.parse(content);
      return allMetadata[testName] || null;
    } catch {
      return null;
    }
  }

  private extractPixelDifference(errorMessage: string): number {
    const match = errorMessage.match(/(\d+) pixels? different/);
    return match ? parseInt(match[1]) : 0;
  }
}

interface ValidationResult {
  valid: boolean;
  reason: string;
  action: 'PASS' | 'CREATE_BASELINE' | 'REVIEW_REQUIRED';
  diffPath?: string;
  pixelDifference?: number;
  threshold?: number;
}

interface ImageComparison {
  passed: boolean;
  pixelDifference: number;
  diffPath: string | null;
}

export { BaselineManager, ValidationResult, BaselineMetadata };
```

### 3.2 Visual Testing Workflow Integration

```typescript
// tools/visual-testing/workflow-integration.ts
import { BaselineManager } from './baseline-manager';

class VisualTestingWorkflow {
  private baselineManager: BaselineManager;

  constructor() {
    this.baselineManager = new BaselineManager();
  }

  async handleTestResult(
    testName: string,
    screenshotPath: string,
    platform: string,
    viewport: string,
    theme: string = 'light'
  ): Promise<WorkflowResult> {
    const metadata = {
      platform,
      viewport,
      theme
    };

    const validation = await this.baselineManager.validateBaseline(
      testName,
      screenshotPath
    );

    switch (validation.action) {
      case 'PASS':
        return {
          status: 'PASSED',
          message: `Visual test passed for ${testName}`,
          action: 'CONTINUE'
        };

      case 'CREATE_BASELINE':
        await this.baselineManager.createBaseline(
          testName,
          screenshotPath,
          metadata
        );
        return {
          status: 'BASELINE_CREATED',
          message: `New baseline created for ${testName}`,
          action: 'CONTINUE'
        };

      case 'REVIEW_REQUIRED':
        return await this.handleReviewRequired(
          testName,
          screenshotPath,
          validation
        );

      default:
        throw new Error(`Unknown validation action: ${validation.action}`);
    }
  }

  private async handleReviewRequired(
    testName: string,
    screenshotPath: string,
    validation: ValidationResult
  ): Promise<WorkflowResult> {
    // In CI environment, fail the test
    if (process.env.CI) {
      return {
        status: 'FAILED',
        message: `Visual differences detected in ${testName}. Pixel difference: ${validation.pixelDifference}`,
        action: 'FAIL_BUILD',
        diffPath: validation.diffPath
      };
    }

    // In local development, provide options
    return {
      status: 'REVIEW_REQUIRED',
      message: `Visual differences detected in ${testName}. Please review and approve changes.`,
      action: 'MANUAL_REVIEW',
      diffPath: validation.diffPath,
      reviewOptions: {
        approve: () => this.approveChanges(testName, screenshotPath),
        reject: () => this.rejectChanges(testName),
        ignore: () => this.ignoreChanges(testName)
      }
    };
  }

  private async approveChanges(testName: string, screenshotPath: string): Promise<void> {
    await this.baselineManager.updateBaseline(
      testName,
      screenshotPath,
      'Manual approval of visual changes'
    );
    console.log(`✅ Approved visual changes for ${testName}`);
  }

  private async rejectChanges(testName: string): Promise<void> {
    console.log(`❌ Rejected visual changes for ${testName}`);
  }

  private async ignoreChanges(testName: string): Promise<void> {
    console.log(`⏭️  Ignoring visual changes for ${testName} (this run only)`);
  }
}

interface WorkflowResult {
  status: 'PASSED' | 'FAILED' | 'BASELINE_CREATED' | 'REVIEW_REQUIRED';
  message: string;
  action: 'CONTINUE' | 'FAIL_BUILD' | 'MANUAL_REVIEW';
  diffPath?: string;
  reviewOptions?: {
    approve: () => Promise<void>;
    reject: () => Promise<void>;
    ignore: () => Promise<void>;
  };
}

export { VisualTestingWorkflow, WorkflowResult };
```

## Implementation Phase 4: CI/CD Integration

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/visual-regression-testing.yml
name: Visual Regression Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  visual-tests-web:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        platform: [admin-panel, cms-panel, landing-page]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd visual-tests && npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Start services
        run: |
          docker-compose up -d postgres redis
          npm run start:test:parallel &
          sleep 30 # Wait for services to start

      - name: Wait for services to be ready
        run: |
          npx wait-on http://localhost:1005 http://localhost:1006 http://localhost:1007 http://localhost:1080

      - name: Run visual tests
        env:
          BROWSER: ${{ matrix.browser }}
          PLATFORM: ${{ matrix.platform }}
        run: |
          cd visual-tests
          npx playwright test tests/${{ matrix.platform }}.spec.ts --project=${{ matrix.browser }}-desktop

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-results-${{ matrix.platform }}-${{ matrix.browser }}
          path: |
            visual-tests/test-results/
            visual-tests/playwright-report/

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-diff-screenshots-${{ matrix.platform }}-${{ matrix.browser }}
          path: visual-tests/test-results/**/*.png

  visual-tests-mobile:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'

      - name: Install Flutter dependencies
        run: |
          cd mobile-app
          flutter pub get

      - name: Run Flutter golden tests
        run: |
          cd mobile-app
          flutter test test/golden/ --update-goldens

      - name: Upload Flutter golden failures
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: flutter-golden-failures
          path: mobile-app/test/failures/

  visual-baseline-update:
    needs: [visual-tests-web, visual-tests-mobile]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Update visual baselines
        run: |
          npm run visual:update-baselines

      - name: Commit updated baselines
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add visual-tests/baselines/
          git diff --staged --quiet || git commit -m "Update visual test baselines [skip ci]"
          git push
```

### 4.2 Visual Test Reporting

```typescript
// tools/visual-testing/reporter.ts
import { promises as fs } from 'fs';
import path from 'path';

interface VisualTestResult {
  testName: string;
  platform: string;
  browser: string;
  viewport: string;
  status: 'PASSED' | 'FAILED' | 'NEW_BASELINE';
  pixelDifference?: number;
  threshold: number;
  screenshotPath?: string;
  diffPath?: string;
  executionTime: number;
}

class VisualTestReporter {
  private results: VisualTestResult[] = [];

  addResult(result: VisualTestResult): void {
    this.results.push(result);
  }

  async generateReport(): Promise<void> {
    const reportData = {
      summary: this.generateSummary(),
      results: this.results,
      timestamp: new Date().toISOString(),
      environment: {
        platform: process.platform,
        nodeVersion: process.version,
        ciEnvironment: process.env.CI ? 'GitHub Actions' : 'Local'
      }
    };

    // Generate JSON report
    await fs.writeFile(
      'visual-tests/reports/visual-test-report.json',
      JSON.stringify(reportData, null, 2)
    );

    // Generate HTML report
    await this.generateHTMLReport(reportData);

    // Generate Slack/Teams notification if in CI
    if (process.env.CI) {
      await this.sendNotification(reportData.summary);
    }
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const newBaselines = this.results.filter(r => r.status === 'NEW_BASELINE').length;

    return {
      total,
      passed,
      failed,
      newBaselines,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) : '0',
      totalExecutionTime: this.results.reduce((sum, r) => sum + r.executionTime, 0)
    };
  }

  private async generateHTMLReport(reportData: any): Promise<void> {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .new-baseline { color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; }
        .screenshot { max-width: 200px; border-radius: 4px; }
        .diff-image { max-width: 300px; }
    </style>
</head>
<body>
    <h1>Visual Regression Test Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${reportData.summary.total}</p>
        <p><strong>Passed:</strong> <span class="passed">${reportData.summary.passed}</span></p>
        <p><strong>Failed:</strong> <span class="failed">${reportData.summary.failed}</span></p>
        <p><strong>New Baselines:</strong> <span class="new-baseline">${reportData.summary.newBaselines}</span></p>
        <p><strong>Pass Rate:</strong> ${reportData.summary.passRate}%</p>
        <p><strong>Execution Time:</strong> ${(reportData.summary.totalExecutionTime / 1000).toFixed(2)}s</p>
    </div>

    <h2>Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Platform</th>
                <th>Browser</th>
                <th>Status</th>
                <th>Pixel Diff</th>
                <th>Screenshot</th>
                <th>Diff</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.results.map((result: VisualTestResult) => `
                <tr>
                    <td>${result.testName}</td>
                    <td>${result.platform}</td>
                    <td>${result.browser}</td>
                    <td class="${result.status.toLowerCase().replace('_', '-')}">${result.status}</td>
                    <td>${result.pixelDifference || 'N/A'}</td>
                    <td>
                        ${result.screenshotPath ? `<img src="${result.screenshotPath}" class="screenshot" alt="Screenshot">` : 'N/A'}
                    </td>
                    <td>
                        ${result.diffPath ? `<img src="${result.diffPath}" class="diff-image" alt="Diff">` : 'N/A'}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <footer>
        <p><small>Generated on ${reportData.timestamp} | Environment: ${reportData.environment.ciEnvironment}</small></p>
    </footer>
</body>
</html>`;

    await fs.writeFile('visual-tests/reports/visual-test-report.html', htmlTemplate);
  }

  private async sendNotification(summary: any): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const color = summary.failed > 0 ? 'danger' : 'good';
    const message = {
      text: 'Visual Regression Test Results',
      attachments: [
        {
          color,
          fields: [
            { title: 'Total Tests', value: summary.total, short: true },
            { title: 'Passed', value: summary.passed, short: true },
            { title: 'Failed', value: summary.failed, short: true },
            { title: 'Pass Rate', value: `${summary.passRate}%`, short: true }
          ]
        }
      ]
    };

    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        console.error('Failed to send Slack notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export { VisualTestReporter, VisualTestResult };
```

## Success Metrics & Monitoring

### Visual Testing KPIs

```typescript
const visualTestingKPIs = {
  coverage: {
    componentsCovered: 95, // Target: 95% of UI components
    pagesCovered: 100, // Target: 100% of pages
    viewportsCovered: 100, // Target: All supported viewports
    browsersCovered: 100 // Target: All supported browsers
  },

  quality: {
    falsePositiveRate: 5, // Target: <5% false positives
    testStability: 98, // Target: 98% consistent results
    baselineAccuracy: 99 // Target: 99% accurate baselines
  },

  performance: {
    executionTime: 600, // Target: <10 minutes total
    baselineUpdateTime: 120, // Target: <2 minutes for updates
    reportGenerationTime: 60 // Target: <1 minute for reports
  },

  maintenance: {
    baselineUpdateFrequency: 2, // Target: <2 updates per week
    testMaintenanceTime: 4, // Target: <4 hours per month
    automationCoverage: 90 // Target: 90% automated baseline management
  }
};
```

## Conclusion

This visual regression testing framework provides comprehensive coverage across all UpCoach platforms while maintaining efficiency and reliability. The implementation includes:

1. **Multi-platform Support**: Playwright for web applications and Golden Tests for Flutter
2. **Automated Baseline Management**: Intelligent baseline creation and updates
3. **CI/CD Integration**: Seamless integration with development workflows
4. **Comprehensive Reporting**: Detailed HTML and JSON reports with diff visualization
5. **Scalable Architecture**: Designed to handle growing test suites efficiently

The framework ensures visual consistency across platforms while providing developers with confidence in UI changes and preventing visual regressions in production.