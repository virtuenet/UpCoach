# Testing Framework Coordination - Comprehensive Quality Assurance

## Task Assignment: QA Test Automation Lead + Security Audit Expert

### Testing Strategy Overview

The UpCoach platform requires comprehensive testing across multiple dimensions to ensure production readiness. This coordination plan establishes testing frameworks for all identified incomplete features and ensures quality gates are met before deployment.

## Current Testing Infrastructure Analysis

### ✅ EXISTING TESTING FOUNDATION
1. **Test Configuration**: Jest, Playwright, and comprehensive test scripts in package.json
2. **Coverage Tools**: nyc, coverage reporting, and quality assessment scripts
3. **Security Testing**: Existing security test suite and dependency auditing
4. **Performance Testing**: k6 load testing and Lighthouse performance auditing

### 🔄 TESTING GAPS TO ADDRESS
1. **Mobile App Feature Testing**: Share, language selection, upload retry mechanisms
2. **Real-time Dashboard Testing**: WebSocket/SSE connection testing
3. **Calendar Component Testing**: Date handling and event scheduling
4. **OAuth Security Testing**: Enhanced authentication flow validation
5. **Cross-platform Integration Testing**: Mobile-backend-web integration flows

## Comprehensive Testing Implementation Plan

### PHASE 1: Mobile App Feature Testing Framework

#### Flutter Test Enhancement
**Target**: Complete testing for all mobile TODO implementations

```dart
// New file: /mobile-app/test/integration/features_integration_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Mobile App Features Integration Tests', () {
    testWidgets('Share functionality should work across platforms', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to saved articles
      await tester.tap(find.byKey(Key('saved_articles_tab')));
      await tester.pumpAndSettle();

      // Find and tap share button
      await tester.tap(find.byIcon(Icons.share_outlined));
      await tester.pumpAndSettle();

      // Verify share dialog appears (platform-specific)
      if (Platform.isAndroid) {
        expect(find.text('Share'), findsOneWidget);
      } else if (Platform.isIOS) {
        expect(find.byType(CupertinoActionSheet), findsOneWidget);
      }
    });

    testWidgets('Language selection should persist and update UI', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to settings
      await tester.tap(find.byKey(Key('settings_tab')));
      await tester.pumpAndSettle();

      // Tap language settings
      await tester.tap(find.byKey(Key('language_settings')));
      await tester.pumpAndSettle();

      // Select Spanish
      await tester.tap(find.text('Español'));
      await tester.pumpAndSettle();

      // Verify UI updates to Spanish
      expect(find.text('Configuración'), findsOneWidget);

      // Verify persistence after app restart
      await tester.binding.defaultBinaryMessenger.send('restart', null);
      await tester.pumpAndSettle();

      expect(find.text('Configuración'), findsOneWidget);
    });

    testWidgets('Upload retry mechanism should handle network failures', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Mock network failure
      await tester.binding.defaultBinaryMessenger.send('mock_network_failure', null);

      // Navigate to profile edit
      await tester.tap(find.byKey(Key('edit_profile')));
      await tester.pumpAndSettle();

      // Select and upload image
      await tester.tap(find.byKey(Key('upload_photo')));
      await tester.pumpAndSettle();

      // Verify retry mechanism kicks in
      expect(find.text('Retrying upload...'), findsOneWidget);

      // Restore network
      await tester.binding.defaultBinaryMessenger.send('restore_network', null);
      await tester.pumpAndSettle();

      // Verify successful upload
      expect(find.text('Upload successful'), findsOneWidget);
    });

    testWidgets('Voice journal search should return relevant results', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to voice journal
      await tester.tap(find.byKey(Key('voice_journal_tab')));
      await tester.pumpAndSettle();

      // Enter search query
      await tester.enterText(find.byKey(Key('search_field')), 'productivity');
      await tester.pumpAndSettle();

      // Verify filtered results
      expect(find.byKey(Key('filtered_entries')), findsWidgets);

      // Verify search results are relevant
      final entryTexts = tester.widgetList(find.byKey(Key('entry_text')));
      expect(entryTexts.any((widget) =>
        widget.toString().toLowerCase().contains('productivity')), isTrue);
    });
  });
}
```

#### Unit Test Coverage for Mobile Features
```dart
// Enhanced unit tests for new mobile features
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:upcoach_mobile/services/share_service.dart';
import 'package:upcoach_mobile/services/language_service.dart';
import 'package:upcoach_mobile/services/upload_service.dart';

void main() {
  group('ShareService Tests', () {
    late ShareService shareService;
    late MockSharePlus mockSharePlus;

    setUp(() {
      mockSharePlus = MockSharePlus();
      shareService = ShareService(sharePlugin: mockSharePlus);
    });

    test('should format article share content correctly', () async {
      final article = Article(
        title: 'Test Article',
        excerpt: 'Test excerpt',
        id: '123'
      );

      await shareService.shareArticle(article);

      verify(mockSharePlus.share(argThat(contains('Test Article'))));
      verify(mockSharePlus.share(argThat(contains('Test excerpt'))));
      verify(mockSharePlus.share(argThat(contains('Read more in UpCoach'))));
    });

    test('should handle share cancellation gracefully', () async {
      when(mockSharePlus.share(any)).thenThrow(ShareCancelledException());

      expect(() => shareService.shareArticle(mockArticle),
        returnsNormally);
    });
  });

  group('LanguageService Tests', () {
    late LanguageService languageService;
    late MockSharedPreferences mockPrefs;

    setUp(() {
      mockPrefs = MockSharedPreferences();
      languageService = LanguageService(prefs: mockPrefs);
    });

    test('should save language preference', () async {
      await languageService.setLanguage('es');

      verify(mockPrefs.setString('language', 'es'));
    });

    test('should load saved language preference', () async {
      when(mockPrefs.getString('language')).thenReturn('es');

      final language = await languageService.getCurrentLanguage();

      expect(language, equals('es'));
    });

    test('should fallback to system language when no preference saved', () async {
      when(mockPrefs.getString('language')).thenReturn(null);

      final language = await languageService.getCurrentLanguage();

      expect(language, equals('en')); // System default
    });
  });

  group('UploadService Tests', () => {
    late UploadService uploadService;
    late MockHttpClient mockHttpClient;

    setUp(() {
      mockHttpClient = MockHttpClient();
      uploadService = UploadService(httpClient: mockHttpClient);
    });

    test('should retry upload on network failure', () async {
      // First two attempts fail, third succeeds
      when(mockHttpClient.post(any, body: any))
        .thenThrow(SocketException('Network error'))
        .thenThrow(SocketException('Network error'))
        .thenAnswer((_) async => Response('{"success": true}', 200));

      final result = await uploadService.uploadWithRetry(mockFile);

      expect(result.success, isTrue);
      verify(mockHttpClient.post(any, body: any)).called(3);
    });

    test('should give up after max retry attempts', () async {
      when(mockHttpClient.post(any, body: any))
        .thenThrow(SocketException('Network error'));

      expect(() => uploadService.uploadWithRetry(mockFile),
        throwsA(isA<UploadFailedException>()));

      verify(mockHttpClient.post(any, body: any)).called(3);
    });

    test('should use exponential backoff between retries', () async {
      final stopwatch = Stopwatch()..start();

      when(mockHttpClient.post(any, body: any))
        .thenThrow(SocketException('Network error'))
        .thenThrow(SocketException('Network error'))
        .thenAnswer((_) async => Response('{"success": true}', 200));

      await uploadService.uploadWithRetry(mockFile);

      stopwatch.stop();
      // Should take at least 6 seconds (2 + 4 second delays)
      expect(stopwatch.elapsedMilliseconds, greaterThan(6000));
    });
  });
}
```

### PHASE 2: Backend API Testing Framework

#### OAuth Security Testing Enhancement
```typescript
// Enhanced OAuth security testing
// File: /services/api/src/__tests__/security/oauth-security.test.ts

import { GoogleAuthService } from '../../services/auth/GoogleAuthService';
import { TestSecurityContext } from '../utils/security-test-utils';

describe('OAuth Security Tests', () => {
  let authService: GoogleAuthService;
  let securityContext: TestSecurityContext;

  beforeEach(() => {
    authService = GoogleAuthService.getInstance();
    securityContext = new TestSecurityContext();
  });

  describe('Token Security', () => {
    it('should validate token signature correctly', async () => {
      const validToken = securityContext.generateValidToken();
      const invalidToken = securityContext.generateInvalidToken();

      expect(await authService.verifyIdToken(validToken)).toBeTruthy();
      await expect(authService.verifyIdToken(invalidToken))
        .rejects.toThrow('Invalid token signature');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = securityContext.generateExpiredToken();

      await expect(authService.verifyIdToken(expiredToken))
        .rejects.toThrow('Token has expired');
    });

    it('should validate audience correctly', async () => {
      const wrongAudienceToken = securityContext.generateTokenWithWrongAudience();

      await expect(authService.verifyIdToken(wrongAudienceToken))
        .rejects.toThrow('Invalid audience');
    });
  });

  describe('PKCE Security', () => {
    it('should validate code verifier correctly', async () => {
      const { codeVerifier, codeChallenge } = securityContext.generatePKCEPair();

      const result = await authService.validatePKCE(codeVerifier, codeChallenge);
      expect(result).toBe(true);
    });

    it('should reject invalid code verifier', async () => {
      const { codeChallenge } = securityContext.generatePKCEPair();
      const invalidVerifier = 'invalid-verifier';

      const result = await authService.validatePKCE(invalidVerifier, codeChallenge);
      expect(result).toBe(false);
    });
  });

  describe('State Parameter Security', () => {
    it('should validate state parameter against CSRF attacks', async () => {
      const state = securityContext.generateSecureState();

      expect(await authService.validateState(state)).toBe(true);
    });

    it('should reject tampered state parameters', async () => {
      const tamperedState = 'tampered-state';

      expect(await authService.validateState(tamperedState)).toBe(false);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on authentication attempts', async () => {
      const token = securityContext.generateValidToken();

      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() =>
        authService.verifyIdToken(token)
      );

      const results = await Promise.allSettled(promises);
      const rateLimitedRequests = results.filter(result =>
        result.status === 'rejected' &&
        result.reason.message.includes('Rate limit')
      );

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });
});
```

#### Real-time API Testing
```typescript
// Real-time dashboard API testing
// File: /services/api/src/__tests__/integration/realtime-dashboard.test.ts

import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import { EventSource } from 'eventsource';
import request from 'supertest';
import app from '../../app';

describe('Real-time Dashboard API Tests', () => {
  let server: Server;
  let wsServer: WebSocketServer;

  beforeAll(() => {
    server = createServer(app);
    wsServer = new WebSocketServer({ server });
  });

  afterAll(() => {
    wsServer.close();
    server.close();
  });

  describe('Server-Sent Events', () => {
    it('should establish SSE connection for dashboard updates', (done) => {
      const eventSource = new EventSource('http://localhost:3000/dashboard/realtime');

      eventSource.onopen = () => {
        expect(eventSource.readyState).toBe(EventSource.OPEN);
        done();
      };

      eventSource.onerror = (error) => {
        done(error);
      };
    });

    it('should receive real-time metrics updates', (done) => {
      const eventSource = new EventSource('http://localhost:3000/dashboard/realtime');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        expect(data).toHaveProperty('activeUsers');
        expect(data).toHaveProperty('goalCompletions');
        expect(data).toHaveProperty('systemHealth');

        eventSource.close();
        done();
      };

      // Trigger a metrics update
      setTimeout(() => {
        request(app)
          .post('/test/trigger-metrics-update')
          .send({ activeUsers: 100, goalCompletions: 50 })
          .end(() => {});
      }, 100);
    });

    it('should handle connection cleanup on client disconnect', async () => {
      const eventSource = new EventSource('http://localhost:3000/dashboard/realtime');

      await new Promise(resolve => {
        eventSource.onopen = resolve;
      });

      const connectionsBefore = wsServer.clients.size;
      eventSource.close();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const connectionsAfter = wsServer.clients.size;
      expect(connectionsAfter).toBeLessThan(connectionsBefore);
    });
  });

  describe('WebSocket Dashboard Updates', () => {
    it('should broadcast analytics updates to all connected clients', (done) => {
      const WebSocket = require('ws');
      const ws1 = new WebSocket('ws://localhost:3000/dashboard/ws');
      const ws2 = new WebSocket('ws://localhost:3000/dashboard/ws');

      let receivedCount = 0;
      const expectedMessage = { type: 'analytics', data: { users: 150 } };

      const messageHandler = (message: string) => {
        const data = JSON.parse(message);
        expect(data).toEqual(expectedMessage);

        receivedCount++;
        if (receivedCount === 2) {
          ws1.close();
          ws2.close();
          done();
        }
      };

      ws1.on('message', messageHandler);
      ws2.on('message', messageHandler);

      // Both connected, trigger broadcast
      Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ]).then(() => {
        // Trigger broadcast
        request(app)
          .post('/test/broadcast-analytics')
          .send(expectedMessage.data)
          .end(() => {});
      });
    });
  });
});
```

### PHASE 3: Frontend Component Testing Framework

#### Calendar Component Testing
```typescript
// Comprehensive calendar component testing
// File: /apps/cms-panel/src/components/ui/__tests__/Calendar.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../Calendar';
import { format, addDays, startOfMonth } from 'date-fns';

describe('Calendar Component', () => {
  const mockOnSelect = jest.fn();
  const defaultProps = {
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Basic Functionality', () => {
    it('should render current month by default', () => {
      render(<Calendar {...defaultProps} />);

      const currentMonth = format(new Date(), 'MMMM yyyy');
      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    });

    it('should navigate to previous month', async () => {
      const user = userEvent.setup();
      render(<Calendar {...defaultProps} />);

      const prevButton = screen.getByLabelText(/previous month/i);
      await user.click(prevButton);

      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const expectedMonth = format(prevMonth, 'MMMM yyyy');

      expect(screen.getByText(expectedMonth)).toBeInTheDocument();
    });

    it('should navigate to next month', async () => {
      const user = userEvent.setup();
      render(<Calendar {...defaultProps} />);

      const nextButton = screen.getByLabelText(/next month/i);
      await user.click(nextButton);

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
      const expectedMonth = format(nextMonth, 'MMMM yyyy');

      expect(screen.getByText(expectedMonth)).toBeInTheDocument();
    });

    it('should call onSelect when date is clicked', async () => {
      const user = userEvent.setup();
      render(<Calendar {...defaultProps} />);

      const dayButton = screen.getByText('15');
      await user.click(dayButton);

      expect(mockOnSelect).toHaveBeenCalledWith(expect.any(Date));

      const calledDate = mockOnSelect.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(15);
    });
  });

  describe('Event Display', () => {
    const events = [
      {
        date: new Date(2024, 0, 15),
        title: 'Published Article',
        type: 'published' as const
      },
      {
        date: new Date(2024, 0, 20),
        title: 'Scheduled Post',
        type: 'scheduled' as const
      },
      {
        date: new Date(2024, 0, 25),
        title: 'Draft Content',
        type: 'draft' as const
      }
    ];

    it('should display event indicators', () => {
      render(
        <Calendar
          {...defaultProps}
          events={events}
          currentMonth={new Date(2024, 0, 1)}
        />
      );

      // Should show event indicators for dates with events
      const eventIndicators = screen.getAllByTestId(/event-indicator/i);
      expect(eventIndicators).toHaveLength(3);
    });

    it('should display correct event type indicators', () => {
      render(
        <Calendar
          {...defaultProps}
          events={events}
          currentMonth={new Date(2024, 0, 1)}
        />
      );

      const publishedIndicator = screen.getByTestId('event-indicator-published');
      const scheduledIndicator = screen.getByTestId('event-indicator-scheduled');
      const draftIndicator = screen.getByTestId('event-indicator-draft');

      expect(publishedIndicator).toHaveClass('bg-green-500');
      expect(scheduledIndicator).toHaveClass('bg-yellow-500');
      expect(draftIndicator).toHaveClass('bg-gray-500');
    });

    it('should limit event indicators to 3 per day', () => {
      const manyEvents = Array(5).fill(null).map((_, index) => ({
        date: new Date(2024, 0, 15),
        title: `Event ${index + 1}`,
        type: 'published' as const
      }));

      render(
        <Calendar
          {...defaultProps}
          events={manyEvents}
          currentMonth={new Date(2024, 0, 1)}
        />
      );

      const dayCell = screen.getByText('15').closest('button');
      const indicators = dayCell?.querySelectorAll('[data-testid*="event-indicator"]');
      expect(indicators).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Calendar {...defaultProps} />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByLabelText(/previous month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next month/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Calendar {...defaultProps} />);

      const firstDayButton = screen.getByText('1');
      firstDayButton.focus();

      // Arrow key navigation
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('2')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('9')).toHaveFocus(); // Next week

      // Enter to select
      await user.keyboard('{Enter}');
      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should announce month changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<Calendar {...defaultProps} />);

      const nextButton = screen.getByLabelText(/next month/i);
      await user.click(nextButton);

      // Should have live region announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/month changed/i);
      });
    });
  });

  describe('Date Picker Integration', () => {
    it('should integrate with DatePicker component', async () => {
      const user = userEvent.setup();
      const { DatePicker } = await import('../DatePicker');

      const mockOnChange = jest.fn();
      render(<DatePicker onSelect={mockOnChange} />);

      // Open calendar
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Select date
      const dayButton = screen.getByText('15');
      await user.click(dayButton);

      expect(mockOnChange).toHaveBeenCalled();

      // Calendar should close
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
    });
  });
});
```

#### Real-time Dashboard Testing
```typescript
// Real-time dashboard frontend testing
// File: /apps/admin-panel/src/pages/__tests__/DashboardPage.test.tsx

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from '../DashboardPage';
import { RealtimeDataService } from '../../services/RealtimeDataService';

// Mock the realtime service
jest.mock('../../services/RealtimeDataService');

describe('Dashboard Page Real-time Features', () => {
  let mockRealtimeService: jest.Mocked<RealtimeDataService>;

  beforeEach(() => {
    mockRealtimeService = new RealtimeDataService() as jest.Mocked<RealtimeDataService>;
    (RealtimeDataService as jest.Mock).mockReturnValue(mockRealtimeService);
  });

  it('should establish real-time connection on mount', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRealtimeService.connectRealtime).toHaveBeenCalled();
    });
  });

  it('should update metrics when real-time data is received', async () => {
    const mockUpdateCallback = jest.fn();
    mockRealtimeService.connectRealtime.mockImplementation((callback) => {
      mockUpdateCallback.mockImplementation(callback);
      return Promise.resolve();
    });

    render(<DashboardPage />);

    // Simulate real-time update
    const newData = {
      activeUsers: 150,
      goalCompletions: 75,
      systemHealth: 'good'
    };

    act(() => {
      mockUpdateCallback(newData);
    });

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Active users
      expect(screen.getByText('75')).toBeInTheDocument();  // Goal completions
    });
  });

  it('should handle connection failures gracefully', async () => {
    mockRealtimeService.connectRealtime.mockRejectedValue(
      new Error('Connection failed')
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });

    // Should show retry option
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    const refreshButton = screen.getByLabelText(/refresh dashboard/i);
    await user.click(refreshButton);

    expect(mockRealtimeService.triggerRefresh).toHaveBeenCalled();
  });

  it('should show loading state during refresh', async () => {
    const user = userEvent.setup();

    // Mock slow API call
    mockRealtimeService.triggerRefresh.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<DashboardPage />);

    const refreshButton = screen.getByLabelText(/refresh dashboard/i);
    await user.click(refreshButton);

    // Should show loading indicator
    expect(refreshButton).toHaveClass('animate-spin');
    expect(refreshButton).toBeDisabled();
  });

  it('should toggle auto-refresh functionality', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    const autoRefreshToggle = screen.getByText(/auto-refresh/i);
    await user.click(autoRefreshToggle);

    // Should enable auto-refresh
    expect(screen.getByText('Auto-refresh ON')).toBeInTheDocument();
    expect(mockRealtimeService.enableAutoRefresh).toHaveBeenCalled();

    // Click again to disable
    await user.click(autoRefreshToggle);
    expect(screen.getByText('Auto-refresh OFF')).toBeInTheDocument();
    expect(mockRealtimeService.disableAutoRefresh).toHaveBeenCalled();
  });
});
```

### PHASE 4: Integration and E2E Testing

#### Cross-Platform Integration Tests
```typescript
// End-to-end integration testing
// File: /tests/e2e/integration/complete-workflow.spec.ts

import { test, expect, Page } from '@playwright/test';

test.describe('Complete Platform Integration', () => {
  let adminPage: Page;
  let mobileContext: any;

  test.beforeAll(async ({ browser }) => {
    // Set up admin panel context
    const adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();

    // Set up mobile context (simulated)
    mobileContext = await browser.newContext({
      userAgent: 'Mobile Safari',
      viewport: { width: 375, height: 667 }
    });
  });

  test('should sync data between mobile app and admin dashboard', async () => {
    // Admin creates content
    await adminPage.goto('/cms/content/new');
    await adminPage.fill('[data-testid="content-title"]', 'Test Article');
    await adminPage.fill('[data-testid="content-body"]', 'This is a test article');
    await adminPage.click('[data-testid="publish-btn"]');

    // Wait for content to be published
    await expect(adminPage.locator('[data-testid="success-message"]'))
      .toContainText('Content published successfully');

    // Check that content appears in mobile API
    const response = await adminPage.request.get('/api/content');
    const content = await response.json();

    expect(content.data).toContainEqual(
      expect.objectContaining({
        title: 'Test Article',
        status: 'published'
      })
    );

    // Simulate mobile app user interaction
    await adminPage.request.post('/api/user-engagement', {
      data: {
        contentId: content.data[0].id,
        action: 'view',
        timestamp: new Date().toISOString()
      }
    });

    // Check that engagement shows up in admin dashboard
    await adminPage.goto('/dashboard');
    await adminPage.waitForSelector('[data-testid="realtime-metrics"]');

    await expect(adminPage.locator('[data-testid="content-views"]'))
      .toContainText('1');
  });

  test('should handle OAuth authentication flow end-to-end', async ({ page }) => {
    // Start OAuth flow
    await page.goto('/login');
    await page.click('[data-testid="google-login-btn"]');

    // Should redirect to Google OAuth
    await page.waitForURL(/accounts.google.com/);

    // Mock Google OAuth response
    await page.route('/oauth/callback*', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard?token=mock-jwt-token'
        }
      });
    });

    // Complete OAuth flow
    await page.goto('/oauth/callback?code=mock-auth-code&state=mock-state');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should have authentication token
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeTruthy();

    // Should be able to access protected resources
    const response = await page.request.get('/api/user/profile');
    expect(response.status()).toBe(200);
  });

  test('should handle file upload with retry mechanism', async ({ page }) => {
    await page.goto('/profile/edit');

    // Mock network failure
    await page.route('/api/upload', route => route.abort(), { times: 2 });

    // Select file for upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/profile-photo.jpg');

    // Should show retry attempts
    await expect(page.locator('[data-testid="upload-status"]'))
      .toContainText('Retrying upload... (1/3)');

    await expect(page.locator('[data-testid="upload-status"]'))
      .toContainText('Retrying upload... (2/3)');

    // Remove network failure mock for third attempt
    await page.unroute('/api/upload');
    await page.route('/api/upload', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, url: '/uploads/profile-photo.jpg' })
      });
    });

    // Should eventually succeed
    await expect(page.locator('[data-testid="upload-status"]'))
      .toContainText('Upload successful');

    // Should display uploaded image
    await expect(page.locator('[data-testid="profile-photo"]'))
      .toHaveAttribute('src', /profile-photo\.jpg/);
  });

  test('should maintain real-time connection across page navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Establish WebSocket connection
    let wsMessages: any[] = [];
    await page.evaluateHandle(() => {
      const ws = new WebSocket('ws://localhost:3000/dashboard/ws');
      ws.onmessage = (event) => {
        (window as any).wsMessages = (window as any).wsMessages || [];
        (window as any).wsMessages.push(JSON.parse(event.data));
      };
      return ws;
    });

    // Navigate to different page
    await page.goto('/analytics');

    // Navigate back to dashboard
    await page.goto('/dashboard');

    // Should reconnect automatically
    await page.waitForFunction(() => {
      return (window as any).wsMessages && (window as any).wsMessages.length > 0;
    });

    // Verify connection is working
    const messages = await page.evaluate(() => (window as any).wsMessages);
    expect(messages.length).toBeGreaterThan(0);
  });
});
```

## Performance Testing Framework

### Load Testing Configuration
```javascript
// Enhanced load testing for new features
// File: /tests/performance/feature-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let options = {
  scenarios: {
    // Mobile app API load testing
    mobile_api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp to 200 users
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      env: { SCENARIO: 'mobile_api' },
    },

    // Real-time dashboard load testing
    realtime_dashboard: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      env: { SCENARIO: 'realtime' },
    },

    // File upload load testing
    file_upload_load: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 5 },   // Start with 5 uploads/sec
        { duration: '5m', target: 10 },  // Increase to 10 uploads/sec
        { duration: '2m', target: 0 },   // Ramp down
      ],
      env: { SCENARIO: 'upload' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    'realtime_connection_time': ['p(95)<2000'], // WebSocket connection under 2s
  },
};

const errorRate = new Rate('errors');

export default function() {
  const scenario = __ENV.SCENARIO;

  switch(scenario) {
    case 'mobile_api':
      testMobileAPI();
      break;
    case 'realtime':
      testRealtimeDashboard();
      break;
    case 'upload':
      testFileUpload();
      break;
    default:
      testMobileAPI();
  }

  sleep(1);
}

function testMobileAPI() {
  // Test share functionality API
  let response = http.get('http://localhost:3000/api/content/articles');
  check(response, {
    'articles loaded': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test language preference API
  response = http.put('http://localhost:3000/api/user/language', {
    language: 'es'
  });
  check(response, {
    'language updated': (r) => r.status === 200,
  });

  // Test voice journal search
  response = http.get('http://localhost:3000/api/voice-journal/search?q=productivity');
  check(response, {
    'search results returned': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
  });
}

function testRealtimeDashboard() {
  // Test SSE connection establishment
  const startTime = Date.now();
  let response = http.get('http://localhost:3000/dashboard/realtime', {
    headers: { 'Accept': 'text/event-stream' }
  });

  const connectionTime = Date.now() - startTime;

  check(response, {
    'SSE connection established': (r) => r.status === 200,
    'connection time acceptable': () => connectionTime < 2000,
  });

  // Test dashboard API endpoints
  response = http.get('http://localhost:3000/api/dashboard/analytics');
  check(response, {
    'analytics data loaded': (r) => r.status === 200,
    'analytics response time < 1s': (r) => r.timings.duration < 1000,
  });
}

function testFileUpload() {
  const file = open('test-files/sample-image.jpg', 'b');

  const response = http.post('http://localhost:3000/api/upload', {
    file: http.file(file, 'sample-image.jpg', 'image/jpeg'),
  });

  check(response, {
    'file upload successful': (r) => r.status === 200,
    'upload time acceptable': (r) => r.timings.duration < 5000,
  });

  errorRate.add(response.status !== 200);
}
```

## Security Testing Framework

### Penetration Testing Suite
```typescript
// Comprehensive security testing
// File: /tests/security/penetration-test-suite.ts

import { PenetrationTester } from './utils/PenetrationTester';
import { SQLInjectionTester } from './utils/SQLInjectionTester';
import { XSSTester } from './utils/XSSTester';
import { AuthenticationTester } from './utils/AuthenticationTester';

describe('Security Penetration Testing', () => {
  let penTester: PenetrationTester;

  beforeAll(() => {
    penTester = new PenetrationTester({
      baseUrl: 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY
    });
  });

  describe('OAuth Security Penetration Tests', () => {
    it('should resist token manipulation attacks', async () => {
      const authTester = new AuthenticationTester();

      // Test JWT token manipulation
      const validToken = await authTester.getValidToken();
      const manipulatedToken = authTester.manipulateToken(validToken);

      const response = await penTester.makeAuthenticatedRequest(
        '/api/user/profile',
        manipulatedToken
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should prevent CSRF attacks on OAuth endpoints', async () => {
      const csrfToken = await penTester.extractCSRFToken('/login');

      // Attempt request without CSRF token
      const response = await penTester.post('/oauth/callback', {
        code: 'auth-code',
        state: 'state-value'
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF');
    });

    it('should validate state parameter correctly', async () => {
      // Attempt OAuth callback with invalid state
      const response = await penTester.get('/oauth/callback', {
        params: {
          code: 'valid-auth-code',
          state: 'invalid-state-value'
        }
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid state');
    });
  });

  describe('API Security Tests', () => {
    it('should prevent SQL injection in search endpoints', async () => {
      const sqlTester = new SQLInjectionTester();
      const maliciousQueries = sqlTester.generatePayloads();

      for (const payload of maliciousQueries) {
        const response = await penTester.get('/api/voice-journal/search', {
          params: { q: payload }
        });

        expect(response.status).not.toBe(500);
        expect(response.body).not.toContain('SQL');
        expect(response.body).not.toContain('ERROR');
      }
    });

    it('should sanitize file upload inputs', async () => {
      const maliciousFiles = [
        { name: '../../../etc/passwd', content: 'system-file' },
        { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'file.exe', content: 'executable-content' }
      ];

      for (const file of maliciousFiles) {
        const response = await penTester.uploadFile('/api/upload', file);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid file');
      }
    });

    it('should prevent XSS in content management', async () => {
      const xssTester = new XSSTester();
      const xssPayloads = xssTester.generatePayloads();

      for (const payload of xssPayloads) {
        const response = await penTester.post('/api/content', {
          title: payload,
          body: 'Test content'
        });

        if (response.status === 200) {
          // Verify content is properly escaped
          const content = await penTester.get(`/api/content/${response.body.id}`);
          expect(content.body.title).not.toContain('<script>');
          expect(content.body.title).toContain('&lt;script&gt;');
        }
      }
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const responses = await Promise.all(
        Array(20).fill(null).map(() =>
          penTester.post('/api/auth/verify', { token: 'invalid-token' })
        )
      );

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce upload rate limits', async () => {
      const file = { name: 'test.jpg', content: 'fake-image-data' };

      const responses = await Promise.all(
        Array(10).fill(null).map(() =>
          penTester.uploadFile('/api/upload', file)
        )
      );

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## Testing Execution Schedule

### Week 4: Comprehensive Testing Implementation

**Day 22-24: Core Feature Testing**
- Implement mobile app feature testing suite
- Create backend API integration tests
- Develop frontend component test coverage

**Day 24-26: Security and Performance Testing**
- Execute penetration testing suite
- Run load testing scenarios
- Validate security hardening implementations

**Day 26-28: Integration and E2E Testing**
- Cross-platform integration testing
- End-to-end workflow validation
- Production environment simulation testing

## Quality Gates and Success Criteria

### Testing Coverage Requirements
- [ ] Unit test coverage > 90% for all new features
- [ ] Integration test coverage for all API endpoints
- [ ] E2E test coverage for complete user workflows
- [ ] Security test coverage for all attack vectors
- [ ] Performance test coverage for all critical paths

### Performance Benchmarks
- [ ] API response times < 500ms (95th percentile)
- [ ] Real-time connection establishment < 2s
- [ ] File upload handling < 5s for 10MB files
- [ ] Dashboard load time < 3s
- [ ] Mobile app feature responsiveness < 200ms

### Security Standards
- [ ] Zero critical security vulnerabilities
- [ ] OAuth 2.0 compliance verified
- [ ] GDPR compliance maintained
- [ ] All XSS/SQL injection attempts blocked
- [ ] Rate limiting effective against attacks

This comprehensive testing framework ensures all implemented features meet production quality standards with robust security, performance, and reliability guarantees.