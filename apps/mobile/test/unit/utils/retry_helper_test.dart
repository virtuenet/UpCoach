// Unit tests for RetryHelper utility
//
// Tests exponential backoff, retry logic, and error handling

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/utils/retry_helper.dart';

void main() {
  group('RetryConfig', () {
    test('should have correct default values', () {
      const config = RetryConfig();

      expect(config.maxAttempts, 3);
      expect(config.initialDelay, const Duration(seconds: 1));
      expect(config.maxDelay, const Duration(seconds: 30));
      expect(config.backoffMultiplier, 2.0);
      expect(config.useJitter, true);
      expect(config.shouldRetry, isNull);
    });

    test('should create API config with correct values', () {
      const config = RetryConfig.api;

      expect(config.maxAttempts, 3);
      expect(config.initialDelay, const Duration(milliseconds: 500));
      expect(config.maxDelay, const Duration(seconds: 10));
    });

    test('should create network config with correct values', () {
      const config = RetryConfig.network;

      expect(config.maxAttempts, 5);
      expect(config.initialDelay, const Duration(seconds: 1));
      expect(config.maxDelay, const Duration(seconds: 30));
    });

    test('should create quick config with correct values', () {
      const config = RetryConfig.quick;

      expect(config.maxAttempts, 2);
      expect(config.initialDelay, const Duration(milliseconds: 200));
      expect(config.maxDelay, const Duration(seconds: 2));
    });

    test('copyWith should create new config with modified values', () {
      const original = RetryConfig();
      final modified = original.copyWith(
        maxAttempts: 5,
        initialDelay: const Duration(milliseconds: 100),
      );

      expect(modified.maxAttempts, 5);
      expect(modified.initialDelay, const Duration(milliseconds: 100));
      // Unchanged values should remain the same
      expect(modified.maxDelay, original.maxDelay);
      expect(modified.backoffMultiplier, original.backoffMultiplier);
      expect(modified.useJitter, original.useJitter);
    });

    test('copyWith should preserve shouldRetry callback', () {
      bool customRetry(Object error) => error.toString().contains('retry');

      final original = RetryConfig(shouldRetry: customRetry);
      final modified = original.copyWith(maxAttempts: 10);

      expect(modified.shouldRetry, equals(customRetry));
    });
  });

  group('RetryHelper.retry', () {
    test('should succeed on first attempt', () async {
      int attempts = 0;

      final result = await RetryHelper.retry<String>(
        operation: () async {
          attempts++;
          return 'success';
        },
        config: const RetryConfig(maxAttempts: 3),
      );

      expect(result, 'success');
      expect(attempts, 1);
    });

    test('should retry on failure and eventually succeed', () async {
      int attempts = 0;

      final result = await RetryHelper.retry<String>(
        operation: () async {
          attempts++;
          if (attempts < 3) {
            throw Exception('Temporary failure');
          }
          return 'success after retry';
        },
        config: const RetryConfig(
          maxAttempts: 5,
          initialDelay: Duration(milliseconds: 10),
          useJitter: false,
        ),
      );

      expect(result, 'success after retry');
      expect(attempts, 3);
    });

    test('should throw after exhausting all attempts', () async {
      int attempts = 0;

      expect(
        () => RetryHelper.retry<String>(
          operation: () async {
            attempts++;
            throw Exception('Persistent failure');
          },
          config: const RetryConfig(
            maxAttempts: 3,
            initialDelay: Duration(milliseconds: 10),
            useJitter: false,
          ),
        ),
        throwsException,
      );

      // Wait for retry attempts to complete
      await Future.delayed(const Duration(milliseconds: 100));
      expect(attempts, 3);
    });

    test('should call onRetry callback on each retry', () async {
      int attempts = 0;
      final retryAttempts = <int>[];
      final retryErrors = <Object>[];

      await RetryHelper.retry<String>(
        operation: () async {
          attempts++;
          if (attempts < 3) {
            throw Exception('Failure $attempts');
          }
          return 'success';
        },
        config: const RetryConfig(
          maxAttempts: 5,
          initialDelay: Duration(milliseconds: 10),
          useJitter: false,
        ),
        onRetry: (attempt, error) {
          retryAttempts.add(attempt);
          retryErrors.add(error);
        },
      );

      expect(retryAttempts, [1, 2]);
      expect(retryErrors.length, 2);
    });

    test('should call onAttempt callback on each attempt', () async {
      final attemptNumbers = <int>[];

      await RetryHelper.retry<String>(
        operation: () async => 'success',
        config: const RetryConfig(maxAttempts: 3),
        onAttempt: (attempt) {
          attemptNumbers.add(attempt);
        },
      );

      expect(attemptNumbers, [1]);
    });

    test('should respect shouldRetry callback', () async {
      int attempts = 0;

      expect(
        () => RetryHelper.retry<String>(
          operation: () async {
            attempts++;
            throw Exception('Non-retryable error');
          },
          config: RetryConfig(
            maxAttempts: 5,
            initialDelay: const Duration(milliseconds: 10),
            shouldRetry: (error) => false, // Never retry
          ),
        ),
        throwsException,
      );

      await Future.delayed(const Duration(milliseconds: 50));
      expect(attempts, 1); // Only one attempt, no retries
    });

    test('should only retry matching errors', () async {
      int attempts = 0;

      try {
        await RetryHelper.retry<String>(
          operation: () async {
            attempts++;
            if (attempts == 1) {
              throw Exception('retryable error');
            } else if (attempts == 2) {
              throw Exception('fatal error'); // Not retryable
            }
            return 'success';
          },
          config: RetryConfig(
            maxAttempts: 5,
            initialDelay: const Duration(milliseconds: 10),
            useJitter: false,
            shouldRetry: (error) => error.toString().contains('retryable'),
          ),
        );
        fail('Should have thrown');
      } catch (e) {
        expect(e.toString(), contains('fatal'));
      }

      expect(attempts, 2); // First attempt + one retry
    });
  });

  group('RetryHelper.retryWithResult', () {
    test('should return success result', () async {
      final result = await RetryHelper.retryWithResult<String>(
        operation: () async => 'success',
        config: const RetryConfig(maxAttempts: 3),
      );

      expect(result.isSuccess, true);
      expect(result.isFailure, false);
      expect(result.data, 'success');
      expect(result.error, isNull);
      expect(result.attempts, 1);
      expect(result.totalDuration, isA<Duration>());
    });

    test('should return failure result after exhausting attempts', () async {
      final result = await RetryHelper.retryWithResult<String>(
        operation: () async => throw Exception('Always fails'),
        config: const RetryConfig(
          maxAttempts: 2,
          initialDelay: Duration(milliseconds: 10),
          useJitter: false,
        ),
      );

      expect(result.isSuccess, false);
      expect(result.isFailure, true);
      expect(result.data, isNull);
      expect(result.error, isA<Exception>());
      expect(result.attempts, 2);
    });

    test('should track total duration', () async {
      final result = await RetryHelper.retryWithResult<String>(
        operation: () async {
          await Future.delayed(const Duration(milliseconds: 50));
          return 'success';
        },
        config: const RetryConfig(maxAttempts: 1),
      );

      expect(result.totalDuration.inMilliseconds, greaterThanOrEqualTo(50));
    });

    test('should return failure immediately for non-retryable errors',
        () async {
      final result = await RetryHelper.retryWithResult<String>(
        operation: () async => throw Exception('Critical error'),
        config: RetryConfig(
          maxAttempts: 5,
          shouldRetry: (error) => false,
        ),
      );

      expect(result.isFailure, true);
      expect(result.attempts, 1);
    });
  });

  group('RetryHelper.isRetryableError', () {
    test('should identify network errors as retryable', () {
      expect(RetryHelper.isRetryableError(Exception('socket error')), true);
      expect(
          RetryHelper.isRetryableError(Exception('Connection failed')), true);
      expect(RetryHelper.isRetryableError(Exception('timeout occurred')), true);
      expect(
          RetryHelper.isRetryableError(Exception('network unavailable')), true);
    });

    test('should identify server errors as retryable', () {
      expect(
          RetryHelper.isRetryableError(Exception('500 Internal Server Error')),
          true);
      expect(RetryHelper.isRetryableError(Exception('502 Bad Gateway')), true);
      expect(RetryHelper.isRetryableError(Exception('503 Service Unavailable')),
          true);
      expect(
          RetryHelper.isRetryableError(Exception('504 Gateway Timeout')), true);
    });

    test('should identify rate limiting as retryable', () {
      expect(RetryHelper.isRetryableError(Exception('429 Too Many Requests')),
          true);
      expect(
          RetryHelper.isRetryableError(Exception('rate limit exceeded')), true);
    });

    test('should not identify client errors as retryable', () {
      expect(RetryHelper.isRetryableError(Exception('400 Bad Request')), false);
      expect(
          RetryHelper.isRetryableError(Exception('401 Unauthorized')), false);
      expect(RetryHelper.isRetryableError(Exception('403 Forbidden')), false);
      expect(RetryHelper.isRetryableError(Exception('404 Not Found')), false);
    });

    test('should not identify validation errors as retryable', () {
      expect(RetryHelper.isRetryableError(Exception('Invalid input')), false);
      expect(RetryHelper.isRetryableError(Exception('Email already exists')),
          false);
    });
  });

  group('RetryFutureExtension', () {
    test('should add retry capability to futures', () async {
      int attempts = 0;

      Future<String> operation() async {
        attempts++;
        if (attempts < 2) {
          throw Exception('Temporary failure');
        }
        return 'success';
      }

      final result = await operation.withRetry(
        config: const RetryConfig(
          maxAttempts: 3,
          initialDelay: Duration(milliseconds: 10),
          useJitter: false,
        ),
      );

      expect(result, 'success');
      expect(attempts, 2);
    });
  });

  group('RetryResult', () {
    test('should correctly report success state', () {
      const result = RetryResult<String>(
        data: 'test',
        attempts: 1,
        totalDuration: Duration(milliseconds: 100),
      );

      expect(result.isSuccess, true);
      expect(result.isFailure, false);
      expect(result.data, 'test');
      expect(result.error, isNull);
    });

    test('should correctly report failure state', () {
      final error = Exception('test error');
      final result = RetryResult<String>(
        error: error,
        attempts: 3,
        totalDuration: const Duration(milliseconds: 500),
      );

      expect(result.isSuccess, false);
      expect(result.isFailure, true);
      expect(result.data, isNull);
      expect(result.error, equals(error));
    });
  });
}
