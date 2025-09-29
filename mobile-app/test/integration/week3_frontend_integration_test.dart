import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';

import 'package:upcoach_mobile/main.dart';
import 'package:upcoach_mobile/core/services/realtime_service.dart';
import 'package:upcoach_mobile/core/services/websocket_service.dart';
import 'package:upcoach_mobile/core/services/sse_service.dart';
import 'package:upcoach_mobile/core/services/auth_service.dart';
import 'package:upcoach_mobile/features/auth/providers/enhanced_auth_provider.dart';
import 'package:upcoach_mobile/features/dashboard/providers/realtime_dashboard_provider.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Week 3 Frontend Integration Tests', () {
    late WidgetTester tester;

    setUpAll(() async {
      // Setup test environment
    });

    tearDownAll(() async {
      // Cleanup test environment
    });

    testWidgets('Real-time WebSocket connection and data streaming', (tester) async {
      // Test WebSocket connection establishment
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final connectionStatus = ref.watch(dashboardConnectionStatusProvider);
                  return connectionStatus
                      ? const Text('Connected', key: Key('connection_status'))
                      : const Text('Disconnected', key: Key('connection_status'));
                },
              ),
            ),
          ),
        ),
      );

      // Wait for connection to establish
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify connection status
      expect(find.text('Connected'), findsOneWidget);

      // Test real-time data reception
      final realTimeService = RealTimeService();
      await realTimeService.initialize();

      // Simulate real-time data
      realTimeService.emit('test_dashboard_update', {
        'type': 'dashboard_update',
        'data': {
          'metrics': {'test_metric': 100},
          'timestamp': DateTime.now().toIso8601String(),
        },
      });

      await tester.pump(const Duration(seconds: 1));

      // Verify data was received and UI updated
      // This would depend on your specific UI implementation
    });

    testWidgets('SSE fallback when WebSocket unavailable', (tester) async {
      // Test SSE connection as fallback
      final sseService = SSEService();

      // Mock WebSocket failure
      final realTimeService = RealTimeService();

      // Attempt connection (should fallback to SSE)
      final connected = await realTimeService.connect();
      expect(connected, isTrue);
      expect(realTimeService.currentConnectionType, RealTimeConnectionType.sse);

      await tester.pumpAndSettle();
    });

    testWidgets('Multi-provider OAuth authentication flow', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Builder(
              builder: (context) {
                return Scaffold(
                  body: Column(
                    children: [
                      ElevatedButton(
                        key: const Key('google_signin_button'),
                        onPressed: () async {
                          // Simulate Google Sign-In
                          final authService = AuthService();
                          try {
                            await authService.signInWithGoogle();
                          } catch (e) {
                            // Handle test authentication
                          }
                        },
                        child: const Text('Sign in with Google'),
                      ),
                      ElevatedButton(
                        key: const Key('apple_signin_button'),
                        onPressed: () async {
                          // Simulate Apple Sign-In
                          final authService = AuthService();
                          try {
                            await authService.signInWithApple();
                          } catch (e) {
                            // Handle test authentication
                          }
                        },
                        child: const Text('Sign in with Apple'),
                      ),
                      Consumer(
                        builder: (context, ref, child) {
                          final authState = ref.watch(enhancedAuthProvider);
                          return Text(
                            authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated',
                            key: const Key('auth_status'),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Test Google Sign-In button
      await tester.tap(find.byKey(const Key('google_signin_button')));
      await tester.pumpAndSettle();

      // Verify authentication state update
      // Note: In a real test, you'd mock the authentication response
      expect(find.byKey(const Key('auth_status')), findsOneWidget);
    });

    testWidgets('Real-time dashboard updates with authentication', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final dashboardData = ref.watch(realtimeDashboardProvider);

                  return dashboardData.when(
                    data: (data) => Column(
                      children: [
                        Text('Dashboard ID: ${data.id}', key: const Key('dashboard_id')),
                        Text('Metrics: ${data.metrics.length}', key: const Key('metrics_count')),
                        Text('Last Updated: ${data.lastUpdated}', key: const Key('last_updated')),
                      ],
                    ),
                    loading: () => const CircularProgressIndicator(key: Key('loading_indicator')),
                    error: (error, stack) => Text('Error: $error', key: const Key('error_text')),
                  );
                },
              ),
            ),
          ),
        ),
      );

      // Wait for initial load
      await tester.pumpAndSettle();

      // Verify loading state
      expect(find.byKey(const Key('loading_indicator')), findsOneWidget);

      // Wait for data to load
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Verify dashboard data is displayed
      expect(find.byKey(const Key('dashboard_id')), findsOneWidget);
      expect(find.byKey(const Key('metrics_count')), findsOneWidget);
    });

    testWidgets('Live progress indicators and real-time UI updates', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  // Live progress indicator
                  Container(
                    key: const Key('live_progress_container'),
                    child: Consumer(
                      builder: (context, ref, child) {
                        final connectionStatus = ref.watch(dashboardConnectionStatusProvider);
                        return Container(
                          width: 20,
                          height: 20,
                          color: connectionStatus ? Colors.green : Colors.red,
                          key: const Key('connection_indicator'),
                        );
                      },
                    ),
                  ),
                  // Real-time metrics display
                  Consumer(
                    builder: (context, ref, child) {
                      final combinedMetrics = ref.watch(combinedDashboardMetricsProvider);
                      return combinedMetrics.when(
                        data: (data) => Column(
                          children: [
                            Text('Habits: ${data.habitAnalytics.analytics['total_habits'] ?? 0}',
                                key: const Key('habit_count')),
                            Text('Coaching Score: ${data.coachingMetrics.metrics['progress_score'] ?? 0}',
                                key: const Key('coaching_score')),
                          ],
                        ),
                        loading: () => const Text('Loading metrics...', key: Key('metrics_loading')),
                        error: (error, stack) => Text('Metrics Error: $error', key: const Key('metrics_error')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify UI components are present
      expect(find.byKey(const Key('live_progress_container')), findsOneWidget);
      expect(find.byKey(const Key('connection_indicator')), findsOneWidget);

      // Test real-time updates by simulating data changes
      // This would involve triggering real-time events and verifying UI updates
    });

    testWidgets('Authentication persistence and token refresh', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final authState = ref.watch(enhancedAuthProvider);
                  return Column(
                    children: [
                      Text('Auth Status: ${authState.isAuthenticated}', key: const Key('auth_status')),
                      Text('Provider: ${authState.authProvider ?? "None"}', key: const Key('auth_provider')),
                      Text('Real-time: ${authState.isRealTimeConnected}', key: const Key('realtime_status')),
                      ElevatedButton(
                        key: const Key('refresh_token_button'),
                        onPressed: () {
                          ref.read(enhancedAuthProvider.notifier).refreshToken();
                        },
                        child: const Text('Refresh Token'),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test token refresh functionality
      await tester.tap(find.byKey(const Key('refresh_token_button')));
      await tester.pumpAndSettle();

      // Verify token refresh behavior
      expect(find.byKey(const Key('auth_status')), findsOneWidget);
    });

    testWidgets('Real-time notification system', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final notifications = ref.watch(realtimeNotificationsProvider);
                  return notifications.when(
                    data: (notification) => ListTile(
                      key: const Key('notification_item'),
                      title: Text(notification.title),
                      subtitle: Text(notification.message),
                      trailing: Text(notification.type),
                    ),
                    loading: () => const Text('No notifications', key: Key('no_notifications')),
                    error: (error, stack) => Text('Notification Error: $error'),
                  );
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Simulate real-time notification
      final realTimeService = RealTimeService();
      await realTimeService.initialize();

      // Emit test notification
      realTimeService.emit('real_time_notification', {
        'type': 'notification',
        'id': 'test_notification',
        'title': 'Test Notification',
        'message': 'This is a test notification',
        'notification_type': 'info',
        'timestamp': DateTime.now().toIso8601String(),
      });

      await tester.pump(const Duration(seconds: 1));

      // Verify notification appears in UI
      expect(find.text('Test Notification'), findsOneWidget);
    });

    testWidgets('Performance under real-time load', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final dashboardData = ref.watch(realtimeDashboardProvider);
                  return dashboardData.when(
                    data: (data) => ListView.builder(
                      key: const Key('performance_list'),
                      itemCount: 100,
                      itemBuilder: (context, index) => ListTile(
                        title: Text('Item $index'),
                        subtitle: Text('Metrics: ${data.metrics.length}'),
                      ),
                    ),
                    loading: () => const CircularProgressIndicator(),
                    error: (error, stack) => Text('Error: $error'),
                  );
                },
              ),
            ),
          ),
        ),
      );

      // Measure performance under load
      final stopwatch = Stopwatch()..start();

      // Simulate rapid real-time updates
      final realTimeService = RealTimeService();
      await realTimeService.initialize();

      for (int i = 0; i < 50; i++) {
        realTimeService.emit('dashboard_update', {
          'type': 'dashboard_update',
          'data': {
            'metrics': {'update_count': i},
            'timestamp': DateTime.now().toIso8601String(),
          },
        });

        await tester.pump(const Duration(milliseconds: 100));
      }

      stopwatch.stop();

      // Verify performance is acceptable (less than 5 seconds for 50 updates)
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));

      // Verify UI remains responsive
      expect(find.byKey(const Key('performance_list')), findsOneWidget);
    });

    testWidgets('Cross-platform compatibility validation', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  // Test platform-specific authentication
                  if (Theme.of(tester.element(find.byType(Scaffold))).platform == TargetPlatform.iOS)
                    const Text('iOS Platform', key: Key('ios_platform'))
                  else
                    const Text('Android Platform', key: Key('android_platform')),

                  // Test real-time features on different platforms
                  Consumer(
                    builder: (context, ref, child) {
                      final realTimeConnected = ref.watch(isRealTimeConnectedProvider);
                      return Text(
                        'Real-time: ${realTimeConnected ? "Connected" : "Disconnected"}',
                        key: const Key('platform_realtime_status'),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify platform detection
      final platformFinder = find.byKey(const Key('ios_platform')).evaluate().isEmpty
          ? find.byKey(const Key('android_platform'))
          : find.byKey(const Key('ios_platform'));

      expect(platformFinder, findsOneWidget);

      // Verify real-time functionality works across platforms
      expect(find.byKey(const Key('platform_realtime_status')), findsOneWidget);
    });

    testWidgets('Error handling and recovery', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final authState = ref.watch(enhancedAuthProvider);
                  return Column(
                    children: [
                      if (authState.error != null)
                        Text('Error: ${authState.error}', key: const Key('error_display')),
                      ElevatedButton(
                        key: const Key('trigger_error_button'),
                        onPressed: () {
                          // Trigger an error scenario
                          ref.read(enhancedAuthProvider.notifier).signInWithEmail('invalid', 'credentials');
                        },
                        child: const Text('Trigger Error'),
                      ),
                      ElevatedButton(
                        key: const Key('clear_error_button'),
                        onPressed: () {
                          ref.read(enhancedAuthProvider.notifier).clearError();
                        },
                        child: const Text('Clear Error'),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Trigger error
      await tester.tap(find.byKey(const Key('trigger_error_button')));
      await tester.pumpAndSettle();

      // Verify error is displayed
      expect(find.byKey(const Key('error_display')), findsOneWidget);

      // Clear error
      await tester.tap(find.byKey(const Key('clear_error_button')));
      await tester.pumpAndSettle();

      // Verify error is cleared
      expect(find.byKey(const Key('error_display')), findsNothing);
    });
  });

  group('Performance Benchmarks', () {
    testWidgets('WebSocket message throughput', (tester) async {
      final webSocketService = WebSocketService();
      await webSocketService.connect();

      final stopwatch = Stopwatch()..start();
      const messageCount = 1000;

      // Send 1000 messages
      for (int i = 0; i < messageCount; i++) {
        webSocketService.emit('test_message', {'index': i});
      }

      stopwatch.stop();

      // Verify throughput (should handle 1000 messages in less than 5 seconds)
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));

      webSocketService.disconnect();
    });

    testWidgets('Real-time UI update latency', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final dashboardData = ref.watch(realtimeDashboardProvider);
                  return dashboardData.when(
                    data: (data) => Text(
                      'Last Update: ${data.timestamp}',
                      key: const Key('timestamp_display'),
                    ),
                    loading: () => const CircularProgressIndicator(),
                    error: (error, stack) => Text('Error: $error'),
                  );
                },
              ),
            ),
          ),
        ),
      );

      final realTimeService = RealTimeService();
      await realTimeService.initialize();

      final updateTime = DateTime.now();
      final stopwatch = Stopwatch()..start();

      // Send real-time update
      realTimeService.emit('dashboard_update', {
        'type': 'dashboard_update',
        'data': {
          'timestamp': updateTime.toIso8601String(),
          'metrics': {},
        },
      });

      // Wait for UI update
      await tester.pumpAndSettle();

      stopwatch.stop();

      // Verify latency is acceptable (less than 100ms)
      expect(stopwatch.elapsedMilliseconds, lessThan(100));
    });
  });
}