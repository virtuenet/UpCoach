import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';

/// Configuration for retry behavior
class RetryConfig {
  /// Maximum number of retry attempts
  final int maxAttempts;

  /// Initial delay between retries
  final Duration initialDelay;

  /// Maximum delay between retries
  final Duration maxDelay;

  /// Multiplier for exponential backoff
  final double backoffMultiplier;

  /// Whether to add jitter to delays
  final bool useJitter;

  /// Condition to check if error should trigger retry
  final bool Function(Object error)? shouldRetry;

  const RetryConfig({
    this.maxAttempts = 3,
    this.initialDelay = const Duration(seconds: 1),
    this.maxDelay = const Duration(seconds: 30),
    this.backoffMultiplier = 2.0,
    this.useJitter = true,
    this.shouldRetry,
  });

  /// Create a copy with modified properties
  RetryConfig copyWith({
    int? maxAttempts,
    Duration? initialDelay,
    Duration? maxDelay,
    double? backoffMultiplier,
    bool? useJitter,
    bool Function(Object error)? shouldRetry,
  }) {
    return RetryConfig(
      maxAttempts: maxAttempts ?? this.maxAttempts,
      initialDelay: initialDelay ?? this.initialDelay,
      maxDelay: maxDelay ?? this.maxDelay,
      backoffMultiplier: backoffMultiplier ?? this.backoffMultiplier,
      useJitter: useJitter ?? this.useJitter,
      shouldRetry: shouldRetry ?? this.shouldRetry,
    );
  }

  /// Default config for API calls
  static const api = RetryConfig(
    maxAttempts: 3,
    initialDelay: Duration(milliseconds: 500),
    maxDelay: Duration(seconds: 10),
  );

  /// Config for network-sensitive operations
  static const network = RetryConfig(
    maxAttempts: 5,
    initialDelay: Duration(seconds: 1),
    maxDelay: Duration(seconds: 30),
  );

  /// Config for quick operations
  static const quick = RetryConfig(
    maxAttempts: 2,
    initialDelay: Duration(milliseconds: 200),
    maxDelay: Duration(seconds: 2),
  );
}

/// Result of a retry operation
class RetryResult<T> {
  final T? data;
  final Object? error;
  final int attempts;
  final Duration totalDuration;

  const RetryResult({
    this.data,
    this.error,
    required this.attempts,
    required this.totalDuration,
  });

  bool get isSuccess => error == null;
  bool get isFailure => error != null;
}

/// Utility class for retrying operations with exponential backoff
class RetryHelper {
  static final _random = Random();

  /// Execute an operation with retry logic
  static Future<T> retry<T>({
    required Future<T> Function() operation,
    RetryConfig config = const RetryConfig(),
    void Function(int attempt, Object error)? onRetry,
    void Function(int attempt)? onAttempt,
  }) async {
    int attempts = 0;
    Duration currentDelay = config.initialDelay;

    while (true) {
      attempts++;
      onAttempt?.call(attempts);

      try {
        return await operation();
      } catch (error) {
        // Check if we should retry this error
        if (config.shouldRetry != null && !config.shouldRetry!(error)) {
          rethrow;
        }

        // Check if we've exhausted retries
        if (attempts >= config.maxAttempts) {
          debugPrint('RetryHelper: All $attempts attempts failed');
          rethrow;
        }

        // Notify about retry
        debugPrint(
            'RetryHelper: Attempt $attempts failed, retrying in ${currentDelay.inMilliseconds}ms');
        onRetry?.call(attempts, error);

        // Wait before retrying
        await Future.delayed(
            _getDelayWithJitter(currentDelay, config.useJitter));

        // Calculate next delay with exponential backoff
        currentDelay = Duration(
          milliseconds: min(
            (currentDelay.inMilliseconds * config.backoffMultiplier).round(),
            config.maxDelay.inMilliseconds,
          ),
        );
      }
    }
  }

  /// Execute an operation and return a result object
  static Future<RetryResult<T>> retryWithResult<T>({
    required Future<T> Function() operation,
    RetryConfig config = const RetryConfig(),
    void Function(int attempt, Object error)? onRetry,
  }) async {
    final stopwatch = Stopwatch()..start();
    int attempts = 0;
    Duration currentDelay = config.initialDelay;

    while (true) {
      attempts++;

      try {
        final result = await operation();
        stopwatch.stop();
        return RetryResult(
          data: result,
          attempts: attempts,
          totalDuration: stopwatch.elapsed,
        );
      } catch (error) {
        // Check if we should retry this error
        if (config.shouldRetry != null && !config.shouldRetry!(error)) {
          stopwatch.stop();
          return RetryResult(
            error: error,
            attempts: attempts,
            totalDuration: stopwatch.elapsed,
          );
        }

        // Check if we've exhausted retries
        if (attempts >= config.maxAttempts) {
          stopwatch.stop();
          return RetryResult(
            error: error,
            attempts: attempts,
            totalDuration: stopwatch.elapsed,
          );
        }

        // Notify about retry
        onRetry?.call(attempts, error);

        // Wait before retrying
        await Future.delayed(
            _getDelayWithJitter(currentDelay, config.useJitter));

        // Calculate next delay
        currentDelay = Duration(
          milliseconds: min(
            (currentDelay.inMilliseconds * config.backoffMultiplier).round(),
            config.maxDelay.inMilliseconds,
          ),
        );
      }
    }
  }

  /// Add jitter to delay to prevent thundering herd
  static Duration _getDelayWithJitter(Duration delay, bool useJitter) {
    if (!useJitter) return delay;

    // Add +/- 25% jitter
    final jitterFactor = 0.75 + (_random.nextDouble() * 0.5);
    return Duration(
      milliseconds: (delay.inMilliseconds * jitterFactor).round(),
    );
  }

  /// Check if an error is retryable (common network/API errors)
  static bool isRetryableError(Object error) {
    final errorString = error.toString().toLowerCase();

    // Network errors
    if (errorString.contains('socket') ||
        errorString.contains('connection') ||
        errorString.contains('timeout') ||
        errorString.contains('network')) {
      return true;
    }

    // Server errors (5xx)
    if (errorString.contains('500') ||
        errorString.contains('502') ||
        errorString.contains('503') ||
        errorString.contains('504')) {
      return true;
    }

    // Rate limiting
    if (errorString.contains('429') || errorString.contains('rate limit')) {
      return true;
    }

    return false;
  }
}

/// Extension for easier retry on futures
extension RetryFutureExtension<T> on Future<T> Function() {
  /// Execute this future with retry logic
  Future<T> withRetry({
    RetryConfig config = const RetryConfig(),
    void Function(int attempt, Object error)? onRetry,
  }) {
    return RetryHelper.retry(
      operation: this,
      config: config,
      onRetry: onRetry,
    );
  }
}
