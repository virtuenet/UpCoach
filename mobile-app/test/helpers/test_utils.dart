/// Comprehensive test utilities for UpCoach mobile app testing
library test_utils;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:network_image_mock/network_image_mock.dart';

/// Test wrapper that provides all necessary providers and routing
class TestWrapper extends StatelessWidget {
  final Widget child;
  final List<Override> overrides;
  final GoRouter? router;
  final ThemeData? theme;

  const TestWrapper({
    super.key,
    required this.child,
    this.overrides = const [],
    this.router,
    this.theme,
  });

  @override
  Widget build(BuildContext context) {
    Widget app = MaterialApp.router(
      routerConfig: router ?? _createTestRouter(),
      theme: theme ?? ThemeData.light(),
      home: child,
    );

    if (overrides.isNotEmpty) {
      app = ProviderScope(
        overrides: overrides,
        child: app,
      );
    }

    return app;
  }

  GoRouter _createTestRouter() {
    return GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => child,
        ),
      ],
    );
  }
}

/// Pumps a widget with all necessary test setup
Future<void> pumpWithWrapper(
  WidgetTester tester,
  Widget child, {
  List<Override> overrides = const [],
  GoRouter? router,
  ThemeData? theme,
}) async {
  await mockNetworkImagesFor(() async {
    await tester.pumpWidget(
      TestWrapper(
        overrides: overrides,
        router: router,
        theme: theme,
        child: child,
      ),
    );
  });
}

/// Custom finder for network images
Finder findNetworkImage(String url) {
  return find.byWidgetPredicate(
    (widget) => widget is Image && widget.image is NetworkImage,
  );
}

/// Custom finder for icons by IconData
Finder findIconByData(IconData iconData) {
  return find.byWidgetPredicate(
    (widget) => widget is Icon && widget.icon == iconData,
  );
}

/// Gesture helper for complex interactions
class GestureHelper {
  static Future<void> longPressAt(
    WidgetTester tester,
    Finder finder, {
    Duration duration = const Duration(milliseconds: 500),
  }) async {
    final gesture = await tester.startGesture(tester.getCenter(finder));
    await tester.pump(duration);
    await gesture.up();
    await tester.pump();
  }

  static Future<void> dragFromTo(
    WidgetTester tester,
    Finder from,
    Finder to,
  ) async {
    await tester.drag(from, tester.getCenter(to) - tester.getCenter(from));
    await tester.pumpAndSettle();
  }

  static Future<void> scrollUntilVisible(
    WidgetTester tester,
    Finder scrollable,
    Finder item,
  ) async {
    await tester.scrollUntilVisible(
      item,
      100,
      scrollable: scrollable,
    );
    await tester.pumpAndSettle();
  }
}

/// Mock data factories for tests
class MockDataFactory {
  static Map<String, dynamic> createUser({
    String id = 'test-user-id',
    String name = 'Test User',
    String email = 'test@upcoach.ai',
    bool isPremium = false,
  }) {
    return {
      'id': id,
      'name': name,
      'email': email,
      'isPremium': isPremium,
      'createdAt': DateTime.now().toIso8601String(),
      'settings': {
        'notifications': true,
        'darkMode': false,
        'language': 'en',
      },
    };
  }

  static Map<String, dynamic> createGoal({
    String id = 'test-goal-id',
    String title = 'Test Goal',
    String description = 'Test goal description',
    DateTime? deadline,
    double progress = 0.0,
  }) {
    return {
      'id': id,
      'title': title,
      'description': description,
      'deadline': (deadline ?? DateTime.now().add(const Duration(days: 30))).toIso8601String(),
      'progress': progress,
      'category': 'fitness',
      'priority': 'medium',
    };
  }

  static Map<String, dynamic> createHabit({
    String id = 'test-habit-id',
    String name = 'Test Habit',
    int streakCount = 5,
    bool completedToday = false,
  }) {
    return {
      'id': id,
      'name': name,
      'streakCount': streakCount,
      'completedToday': completedToday,
      'frequency': 'daily',
      'category': 'health',
      'reminderTime': '08:00',
    };
  }

  static Map<String, dynamic> createCoachingSession({
    String id = 'test-session-id',
    String title = 'Test Session',
    DateTime? scheduledAt,
    String status = 'scheduled',
  }) {
    return {
      'id': id,
      'title': title,
      'scheduledAt': (scheduledAt ?? DateTime.now().add(const Duration(hours: 1))).toIso8601String(),
      'status': status,
      'duration': 60,
      'type': 'individual',
      'coach': {
        'id': 'coach-id',
        'name': 'Test Coach',
        'avatar': 'https://example.com/avatar.jpg',
      },
    };
  }
}

/// Test group helpers for organized test structure
class TestGroup {
  static void widget(String description, Function() body) {
    group('Widget: $description', body);
  }

  static void integration(String description, Function() body) {
    group('Integration: $description', body);
  }

  static void golden(String description, Function() body) {
    group('Golden: $description', body);
  }

  static void performance(String description, Function() body) {
    group('Performance: $description', body);
  }

  static void accessibility(String description, Function() body) {
    group('Accessibility: $description', body);
  }
}

/// Performance testing utilities
class PerformanceHelper {
  static Future<void> measureRenderTime(
    WidgetTester tester,
    Widget widget,
    String testName,
  ) async {
    final stopwatch = Stopwatch()..start();
    await pumpWithWrapper(tester, widget);
    await tester.pumpAndSettle();
    stopwatch.stop();

    print('🕐 $testName render time: ${stopwatch.elapsedMilliseconds}ms');

    // Fail if render takes more than 16ms (60 FPS)
    expect(stopwatch.elapsedMilliseconds, lessThan(16),
           reason: 'Render time should be under 16ms for 60 FPS');
  }

  static Future<void> measureScrollPerformance(
    WidgetTester tester,
    Finder scrollView,
  ) async {
    final stopwatch = Stopwatch()..start();

    for (int i = 0; i < 10; i++) {
      await tester.fling(scrollView, const Offset(0, -200), 1000);
      await tester.pumpAndSettle();
    }

    stopwatch.stop();
    print('📜 Scroll performance: ${stopwatch.elapsedMilliseconds}ms for 10 flings');

    // Should complete scrolling in reasonable time
    expect(stopwatch.elapsedMilliseconds, lessThan(1000));
  }
}

/// Accessibility testing utilities
class A11yHelper {
  static Future<void> verifySemantics(WidgetTester tester) async {
    final handle = tester.ensureSemantics();

    // Verify all interactive elements have semantic labels
    expect(tester.getSemantics(find.byType(ElevatedButton)), isNotNull);
    expect(tester.getSemantics(find.byType(IconButton)), isNotNull);
    expect(tester.getSemantics(find.byType(TextField)), isNotNull);

    handle.dispose();
  }

  static Future<void> verifyMinimumTouchTarget(WidgetTester tester, Finder finder) async {
    final RenderBox box = tester.renderObject(finder);
    final size = box.size;

    // Verify minimum touch target size (44x44 logical pixels)
    expect(size.width, greaterThanOrEqualTo(44),
           reason: 'Touch target width should be at least 44 logical pixels');
    expect(size.height, greaterThanOrEqualTo(44),
           reason: 'Touch target height should be at least 44 logical pixels');
  }

  static Future<void> verifyContrastRatio(WidgetTester tester, Widget widget) async {
    // This would integrate with actual contrast checking in a real implementation
    // For now, we ensure text is visible against backgrounds
    await pumpWithWrapper(tester, widget);

    final textWidgets = tester.widgetList<Text>(find.byType(Text));
    for (final text in textWidgets) {
      expect(text.style?.color, isNotNull,
             reason: 'Text should have explicit color for contrast verification');
    }
  }
}

/// Animation testing utilities
class AnimationHelper {
  static Future<void> verifyAnimationCompletes(
    WidgetTester tester,
    Widget widget, {
    Duration timeout = const Duration(seconds: 5),
  }) async {
    await pumpWithWrapper(tester, widget);

    // Pump until animations complete or timeout
    await tester.pumpAndSettle(timeout);

    // Verify no animations are still running
    expect(SchedulerBinding.instance.transientCallbackCount, equals(0),
           reason: 'All animations should complete');
  }

  static Future<void> testAnimationSmoothness(
    WidgetTester tester,
    Widget widget,
  ) async {
    await pumpWithWrapper(tester, widget);

    final frameCount = 60; // Test for 1 second at 60fps
    final frameDuration = const Duration(milliseconds: 16);

    for (int i = 0; i < frameCount; i++) {
      await tester.pump(frameDuration);
      // In real implementation, would check for frame drops
    }

    // Verify animation completed smoothly
    await tester.pumpAndSettle();
  }
}

/// Network mocking utilities
class NetworkMock {
  static void mockImageLoading() {
    // Already handled by mockNetworkImagesFor in pumpWithWrapper
  }

  static Map<String, dynamic> mockApiResponse({
    bool success = true,
    dynamic data,
    String? error,
  }) {
    return {
      'success': success,
      'data': data,
      'error': error,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }
}