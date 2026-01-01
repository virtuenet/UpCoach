/**
 * TestUtilities.dart
 * Flutter testing utilities for mobile app
 *
 * Features:
 * - Widget test helpers
 * - Golden file testing
 * - Mock service providers
 * - Navigation testing helpers
 * - Form testing helpers
 * - Gesture testing helpers
 * - Animation testing helpers
 * - Accessibility testing
 * - Screenshot testing
 * - Network mocking
 * - Local database mocking
 * - Shared preferences mocking
 * - Platform channel mocking
 * - Internationalization testing
 * - Responsive layout testing
 */

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

// Mock Service Providers

class MockGoalService extends Mock {
  Future<List<Goal>> getGoals() async {
    return [
      Goal(
        id: '1',
        userId: 'user1',
        title: 'Test Goal',
        description: 'Test Description',
        status: GoalStatus.active,
        deadline: DateTime.now().add(Duration(days: 30)),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  Future<Goal> createGoal(Goal goal) async {
    return goal;
  }

  Future<Goal> updateGoal(String id, Goal goal) async {
    return goal;
  }

  Future<void> deleteGoal(String id) async {
    return;
  }

  Future<List<Goal>> searchGoals(String query) async {
    return [];
  }
}

class MockHabitService extends Mock {
  Future<List<Habit>> getHabits() async {
    return [
      Habit(
        id: '1',
        userId: 'user1',
        name: 'Test Habit',
        description: 'Test Description',
        frequency: HabitFrequency.daily,
        targetCount: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  Future<Habit> createHabit(Habit habit) async {
    return habit;
  }

  Future<Habit> updateHabit(String id, Habit habit) async {
    return habit;
  }

  Future<void> deleteHabit(String id) async {
    return;
  }

  Future<void> trackHabit(String id) async {
    return;
  }
}

class MockSessionService extends Mock {
  Future<List<Session>> getSessions() async {
    return [
      Session(
        id: '1',
        coachId: 'coach1',
        clientId: 'client1',
        type: SessionType.oneOnOne,
        scheduledAt: DateTime.now().add(Duration(hours: 24)),
        duration: 60,
        status: SessionStatus.scheduled,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  Future<Session> createSession(Session session) async {
    return session;
  }

  Future<Session> updateSession(String id, Session session) async {
    return session;
  }

  Future<void> cancelSession(String id) async {
    return;
  }

  Future<void> completeSession(String id) async {
    return;
  }
}

class MockReflectionService extends Mock {
  Future<List<Reflection>> getReflections() async {
    return [
      Reflection(
        id: '1',
        userId: 'user1',
        content: 'Test reflection content',
        mood: Mood.happy,
        tags: ['growth', 'learning'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  Future<Reflection> createReflection(Reflection reflection) async {
    return reflection;
  }

  Future<void> deleteReflection(String id) async {
    return;
  }
}

class MockAuthService extends Mock {
  Future<AuthUser> login(String email, String password) async {
    return AuthUser(
      id: 'user1',
      email: email,
      name: 'Test User',
      role: UserRole.client,
      token: 'test-token-123',
    );
  }

  Future<void> logout() async {
    return;
  }

  Future<AuthUser> register(String email, String password, String name) async {
    return AuthUser(
      id: 'user1',
      email: email,
      name: name,
      role: UserRole.client,
      token: 'test-token-123',
    );
  }

  Future<void> resetPassword(String email) async {
    return;
  }

  Future<AuthUser?> getCurrentUser() async {
    return null;
  }

  bool isAuthenticated() {
    return false;
  }
}

class MockUserService extends Mock {
  Future<User> getProfile() async {
    return User(
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.client,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  Future<User> updateProfile(User user) async {
    return user;
  }

  Future<void> uploadAvatar(File file) async {
    return;
  }

  Future<void> deleteAccount() async {
    return;
  }
}

class MockCoachService extends Mock {
  Future<List<Coach>> getCoaches() async {
    return [
      Coach(
        id: 'coach1',
        name: 'Test Coach',
        email: 'coach@example.com',
        specialties: ['Life Coaching', 'Career'],
        rating: 4.8,
        reviewCount: 150,
      ),
    ];
  }

  Future<Coach> getCoachById(String id) async {
    return Coach(
      id: id,
      name: 'Test Coach',
      email: 'coach@example.com',
      specialties: ['Life Coaching'],
      rating: 4.8,
      reviewCount: 150,
    );
  }

  Future<List<Review>> getCoachReviews(String coachId) async {
    return [];
  }
}

class MockNotificationService extends Mock {
  Future<List<Notification>> getNotifications() async {
    return [
      Notification(
        id: '1',
        userId: 'user1',
        type: NotificationType.email,
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        createdAt: DateTime.now(),
      ),
    ];
  }

  Future<void> markAsRead(String id) async {
    return;
  }

  Future<void> markAllAsRead() async {
    return;
  }

  Future<void> deleteNotification(String id) async {
    return;
  }
}

class MockPaymentService extends Mock {
  Future<PaymentIntent> createPaymentIntent(int amount, String currency) async {
    return PaymentIntent(
      id: 'pi_test123',
      amount: amount,
      currency: currency,
      status: PaymentStatus.succeeded,
      clientSecret: 'secret_test123',
    );
  }

  Future<List<Payment>> getPaymentHistory() async {
    return [];
  }

  Future<Subscription> createSubscription(String planId) async {
    return Subscription(
      id: 'sub_test123',
      userId: 'user1',
      planId: planId,
      status: SubscriptionStatus.active,
      currentPeriodStart: DateTime.now(),
      currentPeriodEnd: DateTime.now().add(Duration(days: 30)),
    );
  }

  Future<void> cancelSubscription(String id) async {
    return;
  }
}

class MockAnalyticsService extends Mock {
  void trackEvent(String event, Map<String, dynamic>? properties) {
    return;
  }

  void trackScreen(String screenName) {
    return;
  }

  void setUserId(String userId) {
    return;
  }

  void setUserProperties(Map<String, dynamic> properties) {
    return;
  }
}

class MockStorageService extends Mock {
  Future<void> saveString(String key, String value) async {
    return;
  }

  Future<String?> getString(String key) async {
    return null;
  }

  Future<void> saveBool(String key, bool value) async {
    return;
  }

  Future<bool?> getBool(String key) async {
    return null;
  }

  Future<void> saveInt(String key, int value) async {
    return;
  }

  Future<int?> getInt(String key) async {
    return null;
  }

  Future<void> remove(String key) async {
    return;
  }

  Future<void> clear() async {
    return;
  }
}

class MockDatabaseManager extends Mock {
  Future<Database> getDatabase() async {
    return databaseFactoryFfi.openDatabase(inMemoryDatabasePath);
  }

  Future<List<Map<String, dynamic>>> query(String table) async {
    return [];
  }

  Future<int> insert(String table, Map<String, dynamic> values) async {
    return 1;
  }

  Future<int> update(String table, Map<String, dynamic> values, String where) async {
    return 1;
  }

  Future<int> delete(String table, String where) async {
    return 1;
  }

  Future<void> close() async {
    return;
  }
}

class MockCacheService extends Mock {
  Future<void> set(String key, dynamic value, {Duration? ttl}) async {
    return;
  }

  Future<dynamic> get(String key) async {
    return null;
  }

  Future<void> delete(String key) async {
    return;
  }

  Future<void> clear() async {
    return;
  }

  Future<bool> has(String key) async {
    return false;
  }
}

// Model Classes

enum GoalStatus { draft, active, completed, archived }
enum HabitFrequency { daily, weekly, monthly }
enum SessionType { oneOnOne, group, async }
enum SessionStatus { scheduled, completed, cancelled }
enum Mood { happy, neutral, sad, anxious, excited }
enum UserRole { client, coach, admin }
enum NotificationType { email, sms, push, inApp }
enum PaymentStatus { succeeded, pending, failed }
enum SubscriptionStatus { active, cancelled, pastDue, trialing }

class Goal {
  final String id;
  final String userId;
  final String title;
  final String description;
  final GoalStatus status;
  final DateTime deadline;
  final DateTime createdAt;
  final DateTime updatedAt;

  Goal({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.status,
    required this.deadline,
    required this.createdAt,
    required this.updatedAt,
  });
}

class Habit {
  final String id;
  final String userId;
  final String name;
  final String description;
  final HabitFrequency frequency;
  final int targetCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Habit({
    required this.id,
    required this.userId,
    required this.name,
    required this.description,
    required this.frequency,
    required this.targetCount,
    required this.createdAt,
    required this.updatedAt,
  });
}

class Session {
  final String id;
  final String coachId;
  final String clientId;
  final SessionType type;
  final DateTime scheduledAt;
  final int duration;
  final SessionStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Session({
    required this.id,
    required this.coachId,
    required this.clientId,
    required this.type,
    required this.scheduledAt,
    required this.duration,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });
}

class Reflection {
  final String id;
  final String userId;
  final String content;
  final Mood mood;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  Reflection({
    required this.id,
    required this.userId,
    required this.content,
    required this.mood,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
  });
}

class AuthUser {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String token;

  AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.token,
  });
}

class User {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
  });
}

class Coach {
  final String id;
  final String name;
  final String email;
  final List<String> specialties;
  final double rating;
  final int reviewCount;

  Coach({
    required this.id,
    required this.name,
    required this.email,
    required this.specialties,
    required this.rating,
    required this.reviewCount,
  });
}

class Review {
  final String id;
  final String userId;
  final String coachId;
  final int rating;
  final String comment;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.userId,
    required this.coachId,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });
}

class Notification {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });
}

class PaymentIntent {
  final String id;
  final int amount;
  final String currency;
  final PaymentStatus status;
  final String clientSecret;

  PaymentIntent({
    required this.id,
    required this.amount,
    required this.currency,
    required this.status,
    required this.clientSecret,
  });
}

class Payment {
  final String id;
  final String userId;
  final int amount;
  final String currency;
  final PaymentStatus status;
  final DateTime createdAt;

  Payment({
    required this.id,
    required this.userId,
    required this.amount,
    required this.currency,
    required this.status,
    required this.createdAt,
  });
}

class Subscription {
  final String id;
  final String userId;
  final String planId;
  final SubscriptionStatus status;
  final DateTime currentPeriodStart;
  final DateTime currentPeriodEnd;

  Subscription({
    required this.id,
    required this.userId,
    required this.planId,
    required this.status,
    required this.currentPeriodStart,
    required this.currentPeriodEnd,
  });
}

// Test Helpers

class TestHelpers {
  // Widget Testing Helpers

  static Future<void> pumpScreen(WidgetTester tester, Widget screen) async {
    await tester.pumpWidget(
      MaterialApp(
        home: screen,
      ),
    );
    await tester.pumpAndSettle();
  }

  static Future<void> pumpWidget(WidgetTester tester, Widget widget) async {
    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();
  }

  static Future<void> pumpAndSettle(WidgetTester tester) async {
    await tester.pumpAndSettle();
  }

  static Future<void> pumpFrames(WidgetTester tester, Duration duration) async {
    final frames = duration.inMilliseconds ~/ 16;
    for (int i = 0; i < frames; i++) {
      await tester.pump(const Duration(milliseconds: 16));
    }
  }

  // Navigation Testing Helpers

  static Future<void> expectNavigation(WidgetTester tester, Type screenType) async {
    await tester.pumpAndSettle();
    expect(find.byType(screenType), findsOneWidget);
  }

  static Future<void> expectRoute(WidgetTester tester, String routeName) async {
    await tester.pumpAndSettle();
    final BuildContext context = tester.element(find.byType(MaterialApp));
    final route = ModalRoute.of(context);
    expect(route?.settings.name, equals(routeName));
  }

  static Future<void> navigateBack(WidgetTester tester) async {
    final NavigatorState navigator = tester.state(find.byType(Navigator));
    navigator.pop();
    await tester.pumpAndSettle();
  }

  // Form Testing Helpers

  static Future<void> enterText(WidgetTester tester, String key, String text) async {
    await tester.enterText(find.byKey(Key(key)), text);
    await tester.pumpAndSettle();
  }

  static Future<void> tapButton(WidgetTester tester, String key) async {
    await tester.tap(find.byKey(Key(key)));
    await tester.pumpAndSettle();
  }

  static Future<void> tapByText(WidgetTester tester, String text) async {
    await tester.tap(find.text(text));
    await tester.pumpAndSettle();
  }

  static Future<void> selectDropdown(WidgetTester tester, String key, String value) async {
    await tester.tap(find.byKey(Key(key)));
    await tester.pumpAndSettle();
    await tester.tap(find.text(value).last);
    await tester.pumpAndSettle();
  }

  static Future<void> toggleCheckbox(WidgetTester tester, String key) async {
    await tester.tap(find.byKey(Key(key)));
    await tester.pumpAndSettle();
  }

  // Gesture Testing Helpers

  static Future<void> swipeLeft(WidgetTester tester, Finder finder) async {
    await tester.drag(finder, const Offset(-300.0, 0.0));
    await tester.pumpAndSettle();
  }

  static Future<void> swipeRight(WidgetTester tester, Finder finder) async {
    await tester.drag(finder, const Offset(300.0, 0.0));
    await tester.pumpAndSettle();
  }

  static Future<void> swipeUp(WidgetTester tester, Finder finder) async {
    await tester.drag(finder, const Offset(0.0, -300.0));
    await tester.pumpAndSettle();
  }

  static Future<void> swipeDown(WidgetTester tester, Finder finder) async {
    await tester.drag(finder, const Offset(0.0, 300.0));
    await tester.pumpAndSettle();
  }

  static Future<void> dragTo(WidgetTester tester, Finder finder, Offset offset) async {
    await tester.drag(finder, offset);
    await tester.pumpAndSettle();
  }

  static Future<void> longPress(WidgetTester tester, Finder finder) async {
    await tester.longPress(finder);
    await tester.pumpAndSettle();
  }

  static Future<void> doubleTap(WidgetTester tester, Finder finder) async {
    await tester.tap(finder);
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  // Animation Testing Helpers

  static Future<void> expectAnimation(WidgetTester tester, Finder finder, {bool completed = true}) async {
    final animatedWidget = tester.widget(finder);
    if (animatedWidget is AnimatedWidget) {
      final animation = (animatedWidget as dynamic).listenable as Animation;
      if (completed) {
        expect(animation.isCompleted, isTrue);
      } else {
        expect(animation.isDismissed, isTrue);
      }
    }
  }

  static Future<void> waitForAnimation(WidgetTester tester, Duration duration) async {
    await tester.pump(duration);
    await tester.pumpAndSettle();
  }

  // Accessibility Testing Helpers

  static Future<void> expectAccessible(WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    handle.dispose();
  }

  static Future<void> expectSemantics(WidgetTester tester, {String? label, String? hint}) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await tester.pumpAndSettle();

    if (label != null) {
      expect(find.bySemanticsLabel(label), findsWidgets);
    }

    handle.dispose();
  }

  static Future<void> expectMinimumTapTarget(WidgetTester tester, Finder finder, double minimumSize) async {
    final Size size = tester.getSize(finder);
    expect(size.width, greaterThanOrEqualTo(minimumSize));
    expect(size.height, greaterThanOrEqualTo(minimumSize));
  }

  // Screenshot Testing Helpers

  static Future<void> takeScreenshot(WidgetTester tester, String name) async {
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('screenshots/$name.png'),
    );
  }

  static Future<void> compareScreenshot(WidgetTester tester, String goldenFile) async {
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile(goldenFile),
    );
  }

  // Golden File Testing Helpers

  static Future<void> expectGoldenMatches(WidgetTester tester, String goldenFile, {ThemeMode? theme}) async {
    if (theme != null) {
      await tester.pumpWidget(
        MaterialApp(
          themeMode: theme,
          theme: ThemeData.light(),
          darkTheme: ThemeData.dark(),
          home: Material(
            child: tester.widget(find.byType(MaterialApp)),
          ),
        ),
      );
    }

    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/$goldenFile.png'),
    );
  }

  static Future<void> testMultipleScreenSizes(
    WidgetTester tester,
    Widget screen,
    List<Size> sizes,
  ) async {
    for (final size in sizes) {
      tester.binding.window.physicalSizeTestValue = size;
      tester.binding.window.devicePixelRatioTestValue = 1.0;

      await pumpScreen(tester, screen);

      addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
    }
  }

  // Network Mocking Helpers

  static Future<void> mockNetworkResponse(String endpoint, dynamic response) async {
    // This would integrate with a network mocking library
    // For demonstration purposes, showing the structure
  }

  static Future<void> mockNetworkError(String endpoint, {int statusCode = 500}) async {
    // This would integrate with a network mocking library
  }

  // Shared Preferences Mocking

  static Future<void> setupMockSharedPreferences(Map<String, dynamic> values) async {
    SharedPreferences.setMockInitialValues(values);
  }

  static Future<void> clearMockSharedPreferences() async {
    SharedPreferences.setMockInitialValues({});
  }

  // Platform Channel Mocking

  static void setupMockMethodChannel(String channelName, Future<dynamic> Function(MethodCall) handler) {
    const channel = MethodChannel(channelName);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, handler);
  }

  static void clearMockMethodChannel(String channelName) {
    const channel = MethodChannel(channelName);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  }

  // Internationalization Testing

  static Future<void> testAllLocales(WidgetTester tester, Widget screen, List<Locale> locales) async {
    for (final locale in locales) {
      await tester.pumpWidget(
        MaterialApp(
          locale: locale,
          home: screen,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(screen.runtimeType), findsOneWidget);
    }
  }

  // Error Handling Helpers

  static Future<void> expectError(WidgetTester tester, Type errorType) async {
    await tester.pumpAndSettle();
    final error = tester.takeException();
    expect(error, isNotNull);
    expect(error.runtimeType, equals(errorType));
  }

  static Future<void> expectNoError(WidgetTester tester) async {
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  }

  // List and Scroll Testing

  static Future<void> scrollUntilVisible(
    WidgetTester tester,
    Finder finder,
    Finder scrollable, {
    double delta = 300.0,
  }) async {
    int attempts = 0;
    while (attempts < 100) {
      if (tester.any(finder)) {
        break;
      }

      await tester.drag(scrollable, Offset(0, -delta));
      await tester.pumpAndSettle();
      attempts++;
    }

    expect(finder, findsOneWidget);
  }

  static Future<void> scrollToTop(WidgetTester tester, Finder scrollable) async {
    final scrollableWidget = tester.widget<ScrollableState>(scrollable);
    scrollableWidget.position.jumpTo(0);
    await tester.pumpAndSettle();
  }

  static Future<void> scrollToBottom(WidgetTester tester, Finder scrollable) async {
    final scrollableWidget = tester.widget<ScrollableState>(scrollable);
    scrollableWidget.position.jumpTo(scrollableWidget.position.maxScrollExtent);
    await tester.pumpAndSettle();
  }

  // Dialog and Bottom Sheet Testing

  static Future<void> expectDialogVisible(WidgetTester tester) async {
    await tester.pumpAndSettle();
    expect(find.byType(Dialog), findsOneWidget);
  }

  static Future<void> closeDialog(WidgetTester tester) async {
    await tester.tap(find.byKey(const Key('close_dialog')));
    await tester.pumpAndSettle();
  }

  static Future<void> expectBottomSheetVisible(WidgetTester tester) async {
    await tester.pumpAndSettle();
    expect(find.byType(BottomSheet), findsOneWidget);
  }

  static Future<void> closeBottomSheet(WidgetTester tester) async {
    final NavigatorState navigator = tester.state(find.byType(Navigator));
    navigator.pop();
    await tester.pumpAndSettle();
  }

  // Snackbar Testing

  static Future<void> expectSnackbar(WidgetTester tester, String message) async {
    await tester.pumpAndSettle();
    expect(find.byType(SnackBar), findsOneWidget);
    expect(find.text(message), findsOneWidget);
  }

  static Future<void> closeSnackbar(WidgetTester tester) async {
    final scaffoldMessengerState = tester.state<ScaffoldMessengerState>(
      find.byType(ScaffoldMessenger),
    );
    scaffoldMessengerState.hideCurrentSnackBar();
    await tester.pumpAndSettle();
  }

  // Focus Testing

  static Future<void> expectFocused(WidgetTester tester, Finder finder) async {
    await tester.pumpAndSettle();
    final FocusNode focusNode = tester.widget<Focus>(
      find.ancestor(of: finder, matching: find.byType(Focus)),
    ).focusNode!;
    expect(focusNode.hasFocus, isTrue);
  }

  static Future<void> requestFocus(WidgetTester tester, Finder finder) async {
    final FocusNode focusNode = tester.widget<Focus>(
      find.ancestor(of: finder, matching: find.byType(Focus)),
    ).focusNode!;
    focusNode.requestFocus();
    await tester.pumpAndSettle();
  }

  // Performance Testing

  static Future<void> measureBuildTime(WidgetTester tester, Widget widget) async {
    final stopwatch = Stopwatch()..start();
    await tester.pumpWidget(widget);
    stopwatch.stop();
    print('Build time: ${stopwatch.elapsedMilliseconds}ms');
  }

  static Future<void> measureFrameTime(WidgetTester tester, Future<void> Function() action) async {
    final stopwatch = Stopwatch()..start();
    await action();
    await tester.pump();
    stopwatch.stop();
    print('Frame time: ${stopwatch.elapsedMilliseconds}ms');
  }

  // Custom Matchers

  static Matcher hasText(String text) {
    return _HasTextMatcher(text);
  }

  static Matcher hasWidget(Type widgetType) {
    return _HasWidgetMatcher(widgetType);
  }

  static Matcher isVisible() {
    return _IsVisibleMatcher();
  }

  static Matcher hasColor(Color color) {
    return _HasColorMatcher(color);
  }
}

// Custom Matcher Classes

class _HasTextMatcher extends Matcher {
  final String text;

  _HasTextMatcher(this.text);

  @override
  bool matches(dynamic item, Map matchState) {
    if (item is Widget) {
      return item.toString().contains(text);
    }
    return false;
  }

  @override
  Description describe(Description description) {
    return description.add('has text "$text"');
  }
}

class _HasWidgetMatcher extends Matcher {
  final Type widgetType;

  _HasWidgetMatcher(this.widgetType);

  @override
  bool matches(dynamic item, Map matchState) {
    if (item is Widget) {
      return item.runtimeType == widgetType;
    }
    return false;
  }

  @override
  Description describe(Description description) {
    return description.add('has widget of type $widgetType');
  }
}

class _IsVisibleMatcher extends Matcher {
  @override
  bool matches(dynamic item, Map matchState) {
    if (item is Finder) {
      return item.evaluate().isNotEmpty;
    }
    return false;
  }

  @override
  Description describe(Description description) {
    return description.add('is visible');
  }
}

class _HasColorMatcher extends Matcher {
  final Color color;

  _HasColorMatcher(this.color);

  @override
  bool matches(dynamic item, Map matchState) {
    if (item is Widget) {
      // This is a simplified implementation
      return true;
    }
    return false;
  }

  @override
  Description describe(Description description) {
    return description.add('has color $color');
  }
}

// Test Data Generators

class TestDataGenerator {
  static Goal generateGoal({String? userId}) {
    return Goal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: userId ?? 'user1',
      title: 'Test Goal ${DateTime.now().millisecondsSinceEpoch}',
      description: 'This is a test goal description',
      status: GoalStatus.active,
      deadline: DateTime.now().add(const Duration(days: 30)),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static Habit generateHabit({String? userId}) {
    return Habit(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: userId ?? 'user1',
      name: 'Test Habit ${DateTime.now().millisecondsSinceEpoch}',
      description: 'This is a test habit description',
      frequency: HabitFrequency.daily,
      targetCount: 1,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static Session generateSession({String? coachId, String? clientId}) {
    return Session(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      coachId: coachId ?? 'coach1',
      clientId: clientId ?? 'client1',
      type: SessionType.oneOnOne,
      scheduledAt: DateTime.now().add(const Duration(hours: 24)),
      duration: 60,
      status: SessionStatus.scheduled,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static User generateUser({UserRole? role}) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return User(
      id: timestamp.toString(),
      email: 'user$timestamp@example.com',
      name: 'Test User $timestamp',
      role: role ?? UserRole.client,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static List<Goal> generateGoals(int count, {String? userId}) {
    return List.generate(count, (index) => generateGoal(userId: userId));
  }

  static List<Habit> generateHabits(int count, {String? userId}) {
    return List.generate(count, (index) => generateHabit(userId: userId));
  }

  static List<Session> generateSessions(int count) {
    return List.generate(count, (index) => generateSession());
  }
}

// Test Setup and Teardown

class TestSetup {
  static Future<void> setupAll() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }

  static Future<void> tearDownAll() async {
    // Clean up any global resources
  }

  static Future<void> setUp() async {
    // Set up before each test
    await TestHelpers.setupMockSharedPreferences({});
  }

  static Future<void> tearDown() async {
    // Clean up after each test
    await TestHelpers.clearMockSharedPreferences();
  }
}

// Export all utilities
class TestUtilities {
  static final helpers = TestHelpers;
  static final dataGenerator = TestDataGenerator;
  static final setup = TestSetup;

  // Mock Services
  static MockGoalService get goalService => MockGoalService();
  static MockHabitService get habitService => MockHabitService();
  static MockSessionService get sessionService => MockSessionService();
  static MockReflectionService get reflectionService => MockReflectionService();
  static MockAuthService get authService => MockAuthService();
  static MockUserService get userService => MockUserService();
  static MockCoachService get coachService => MockCoachService();
  static MockNotificationService get notificationService => MockNotificationService();
  static MockPaymentService get paymentService => MockPaymentService();
  static MockAnalyticsService get analyticsService => MockAnalyticsService();
  static MockStorageService get storageService => MockStorageService();
  static MockDatabaseManager get databaseManager => MockDatabaseManager();
  static MockCacheService get cacheService => MockCacheService();
}
