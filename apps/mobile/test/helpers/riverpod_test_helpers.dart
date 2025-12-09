// Riverpod Test Helpers and Utilities
//
// This file provides utilities for testing with Riverpod providers,
// including mock containers, override helpers, and async testing utilities.

import 'dart:async' as async;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override, ProviderListenable;

/// Creates a ProviderContainer for unit testing with optional overrides
ProviderContainer createContainer({
  List<Override> overrides = const [],
  ProviderContainer? parent,
  List<ProviderObserver>? observers,
}) {
  return ProviderContainer(
    overrides: overrides,
    parent: parent,
    observers: observers ?? [],
  );
}

/// Creates a testable widget wrapped with ProviderScope
Widget createRiverpodTestWidget({
  required Widget child,
  List<Override> overrides = const [],
  ThemeData? theme,
  Locale? locale,
  List<NavigatorObserver>? navigatorObservers,
  GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      home: Scaffold(body: child),
      theme: theme ?? ThemeData.light(),
      locale: locale ?? const Locale('en', 'US'),
      navigatorObservers: navigatorObservers ?? [],
      scaffoldMessengerKey: scaffoldMessengerKey,
    ),
  );
}

/// Creates a full app wrapper for integration testing
Widget createFullAppTestWidget({
  required Widget child,
  List<Override> overrides = const [],
  ThemeData? theme,
  ThemeData? darkTheme,
  ThemeMode? themeMode,
  GlobalKey<NavigatorState>? navigatorKey,
  GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      home: child,
      theme: theme ?? ThemeData.light(),
      darkTheme: darkTheme ?? ThemeData.dark(),
      themeMode: themeMode ?? ThemeMode.light,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: scaffoldMessengerKey,
      debugShowCheckedModeBanner: false,
    ),
  );
}

/// Helper to pump widget with Riverpod and settle
Future<void> pumpRiverpodWidget(
  WidgetTester tester,
  Widget widget, {
  List<Override> overrides = const [],
  Duration? settleDuration,
}) async {
  await tester.pumpWidget(
    createRiverpodTestWidget(
      child: widget,
      overrides: overrides,
    ),
  );
  await tester
      .pumpAndSettle(settleDuration ?? const Duration(milliseconds: 100));
}

/// Test observer for tracking provider state changes
/// Note: In Riverpod 3.x, ProviderObserver uses ProviderObserverContext
final class TestProviderObserver extends ProviderObserver {
  final List<ProviderEvent> events = [];

  @override
  void didAddProvider(
    ProviderObserverContext context,
    Object? value,
  ) {
    events.add(ProviderEvent(
      type: ProviderEventType.add,
      providerName: context.provider.name ?? 'unnamed',
      value: value,
    ));
  }

  @override
  void didUpdateProvider(
    ProviderObserverContext context,
    Object? previousValue,
    Object? newValue,
  ) {
    events.add(ProviderEvent(
      type: ProviderEventType.update,
      providerName: context.provider.name ?? 'unnamed',
      previousValue: previousValue,
      value: newValue,
    ));
  }

  @override
  void didDisposeProvider(
    ProviderObserverContext context,
  ) {
    events.add(ProviderEvent(
      type: ProviderEventType.dispose,
      providerName: context.provider.name ?? 'unnamed',
    ));
  }

  void clear() => events.clear();

  List<ProviderEvent> eventsFor(String providerName) {
    return events.where((e) => e.providerName == providerName).toList();
  }
}

enum ProviderEventType { add, update, dispose }

class ProviderEvent {
  final ProviderEventType type;
  final String providerName;
  final Object? previousValue;
  final Object? value;

  ProviderEvent({
    required this.type,
    required this.providerName,
    this.previousValue,
    this.value,
  });
}

/// Helper for testing AsyncValue states
class AsyncValueTestHelper<T> {
  final List<AsyncValue<T>> states = [];

  void record(AsyncValue<T> state) {
    states.add(state);
  }

  void clear() => states.clear();

  bool get hasLoading => states.any((s) => s.isLoading);
  bool get hasError => states.any((s) => s.hasError);
  bool get hasData => states.any((s) => s.hasValue);

  AsyncValue<T>? get lastState => states.isNotEmpty ? states.last : null;
  List<AsyncValue<T>> get loadingStates =>
      states.where((s) => s.isLoading).toList();
  List<AsyncValue<T>> get errorStates =>
      states.where((s) => s.hasError).toList();
  List<AsyncValue<T>> get dataStates =>
      states.where((s) => s.hasValue).toList();
}

/// Mock notifier for testing Notifier providers
class MockNotifier<T> extends Notifier<T> {
  MockNotifier(this._initialState);

  final T _initialState;

  @override
  T build() => _initialState;

  void setState(T newState) {
    state = newState;
  }
}

/// Helper for creating mock providers that return a fixed value
Provider<T> createMockProvider<T>(T value) {
  return Provider<T>((ref) => value);
}

/// Helper for creating mock async providers
FutureProvider<T> createMockAsyncProvider<T>(T value) {
  return FutureProvider<T>((ref) async => value);
}

/// Helper for creating mock async providers that throw
FutureProvider<T> createMockErrorProvider<T>(Object error) {
  return FutureProvider<T>((ref) async => throw error);
}

/// Extension for easier testing of AsyncValue
extension AsyncValueTestExtension<T> on AsyncValue<T> {
  /// Expect this AsyncValue to be in loading state
  void expectLoading() {
    expect(isLoading, isTrue, reason: 'Expected AsyncValue to be loading');
  }

  /// Expect this AsyncValue to have data
  void expectData([T? expectedValue]) {
    expect(hasValue, isTrue, reason: 'Expected AsyncValue to have data');
    if (expectedValue != null) {
      expect(value, equals(expectedValue));
    }
  }

  /// Expect this AsyncValue to have error
  void expectError([Object? expectedError]) {
    expect(hasError, isTrue, reason: 'Expected AsyncValue to have error');
    if (expectedError != null) {
      expect(error, equals(expectedError));
    }
  }
}

/// Helper to wait for a provider to emit a specific value
Future<T> waitForProviderValue<T>(
  ProviderContainer container,
  ProviderListenable<T> provider, {
  bool Function(T value)? condition,
  Duration timeout = const Duration(seconds: 5),
}) async {
  final completer = async.Completer<T>();
  final subscription = container.listen<T>(
    provider,
    (previous, next) {
      if (condition == null || condition(next)) {
        if (!completer.isCompleted) {
          completer.complete(next);
        }
      }
    },
  );

  try {
    return await completer.future.timeout(timeout);
  } finally {
    subscription.close();
  }
}
