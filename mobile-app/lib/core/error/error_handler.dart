import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Centralized error handling with proper boundaries and recovery
class ErrorHandler {
  static final ErrorHandler _instance = ErrorHandler._internal();
  factory ErrorHandler() => _instance;
  ErrorHandler._internal();

  /// Global error callback
  Function(AppError error)? _onError;

  /// Set global error handler
  void setErrorCallback(Function(AppError error) callback) {
    _onError = callback;
  }

  /// Handle error with appropriate response
  void handleError(dynamic error, {String? context, bool silent = false}) {
    final appError = _parseError(error, context: context);

    if (!silent) {
      _onError?.call(appError);
    }

    _logError(appError);

    // Handle critical errors
    if (appError.isCritical) {
      _handleCriticalError(appError);
    }
  }

  /// Parse error into AppError
  AppError _parseError(dynamic error, {String? context}) {
    if (error is AppError) {
      return error;
    }

    if (error is DatabaseException) {
      return AppError(
        message: error.message,
        type: ErrorType.database,
        originalError: error.originalError,
        context: context,
        isCritical: false,
      );
    }

    if (error is OutOfMemoryError) {
      return AppError(
        message: 'The app is running out of memory. Please close other apps and try again.',
        type: ErrorType.memory,
        originalError: error,
        context: context,
        isCritical: true,
      );
    }

    if (error is NetworkException) {
      return AppError(
        message: error.message,
        type: ErrorType.network,
        originalError: error.originalError,
        context: context,
        isCritical: false,
      );
    }

    if (error is PermissionException) {
      return AppError(
        message: error.message,
        type: ErrorType.permission,
        originalError: error,
        context: context,
        isCritical: false,
      );
    }

    // Default error
    return AppError(
      message: error.toString(),
      type: ErrorType.unknown,
      originalError: error,
      context: context,
      isCritical: false,
    );
  }

  /// Log error for debugging
  void _logError(AppError error) {
    if (kDebugMode) {
      debugPrint('═══════════════════════════════════════');
      debugPrint('ERROR: ${error.type.name.toUpperCase()}');
      debugPrint('Message: ${error.message}');
      if (error.context != null) {
        debugPrint('Context: ${error.context}');
      }
      if (error.originalError != null) {
        debugPrint('Original: ${error.originalError}');
      }
      debugPrint('Critical: ${error.isCritical}');
      debugPrint('Time: ${DateTime.now()}');
      debugPrint('═══════════════════════════════════════');
    }
  }

  /// Handle critical errors that require app recovery
  void _handleCriticalError(AppError error) {
    // In production, you might want to:
    // 1. Send error to crash reporting service
    // 2. Show recovery dialog
    // 3. Attempt automatic recovery
    // 4. Force restart if necessary

    if (error.type == ErrorType.memory) {
      _attemptMemoryRecovery();
    }
  }

  /// Attempt to recover from memory issues
  void _attemptMemoryRecovery() {
    // Clear image cache
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();

    // Force garbage collection (suggestion only)
    // The actual GC is controlled by Dart runtime
    debugPrint('Attempting memory recovery...');
  }
}

/// Application error model
class AppError {
  final String message;
  final ErrorType type;
  final dynamic originalError;
  final String? context;
  final bool isCritical;
  final DateTime timestamp;

  AppError({
    required this.message,
    required this.type,
    this.originalError,
    this.context,
    this.isCritical = false,
  }) : timestamp = DateTime.now();

  /// Get user-friendly message
  String get userMessage {
    switch (type) {
      case ErrorType.network:
        return 'Unable to connect. Please check your internet connection and try again.';
      case ErrorType.database:
        return 'There was an issue saving your data. Please try again.';
      case ErrorType.permission:
        return 'This feature requires additional permissions. Please check your settings.';
      case ErrorType.memory:
        return 'The app is running low on memory. Please try closing other apps.';
      case ErrorType.validation:
        return message; // Validation messages are already user-friendly
      case ErrorType.authentication:
        return 'Authentication failed. Please log in again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /// Get recovery suggestion
  String? get recoverySuggestion {
    switch (type) {
      case ErrorType.network:
        return 'Try:\n• Checking your WiFi or mobile data\n• Restarting the app\n• Trying again in a few moments';
      case ErrorType.database:
        return 'Try:\n• Restarting the app\n• Clearing app cache in settings\n• Freeing up device storage';
      case ErrorType.memory:
        return 'Try:\n• Closing other apps\n• Restarting your device\n• Clearing app cache';
      case ErrorType.permission:
        return 'Go to Settings > App Permissions to grant the required permissions.';
      default:
        return null;
    }
  }
}

/// Error types
enum ErrorType {
  network,
  database,
  permission,
  memory,
  validation,
  authentication,
  unknown,
}

/// Custom exceptions
class DatabaseException implements Exception {
  final String message;
  final dynamic originalError;

  DatabaseException(this.message, [this.originalError]);

  @override
  String toString() => 'DatabaseException: $message';
}

class NetworkException implements Exception {
  final String message;
  final dynamic originalError;

  NetworkException(this.message, [this.originalError]);

  @override
  String toString() => 'NetworkException: $message';
}

class PermissionException implements Exception {
  final String message;
  final String permission;

  PermissionException(this.message, this.permission);

  @override
  String toString() => 'PermissionException: $message (Permission: $permission)';
}

class ValidationException implements Exception {
  final String message;
  final Map<String, String>? fieldErrors;

  ValidationException(this.message, [this.fieldErrors]);

  @override
  String toString() => 'ValidationException: $message';
}

/// Error recovery strategies
class ErrorRecovery {
  /// Retry with exponential backoff
  static Future<T> retryWithBackoff<T>({
    required Future<T> Function() operation,
    int maxAttempts = 3,
    Duration initialDelay = const Duration(seconds: 1),
  }) async {
    int attempts = 0;
    Duration delay = initialDelay;

    while (attempts < maxAttempts) {
      try {
        return await operation();
      } catch (e) {
        attempts++;

        if (attempts >= maxAttempts) {
          rethrow;
        }

        await Future.delayed(delay);
        delay *= 2; // Exponential backoff
      }
    }

    throw Exception('Max retry attempts reached');
  }

  /// Execute with timeout
  static Future<T> withTimeout<T>({
    required Future<T> Function() operation,
    Duration timeout = const Duration(seconds: 30),
    String? timeoutMessage,
  }) async {
    try {
      return await operation().timeout(
        timeout,
        onTimeout: () {
          throw NetworkException(
            timeoutMessage ?? 'Operation timed out after ${timeout.inSeconds} seconds',
          );
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Execute with error boundary
  static Future<T?> withErrorBoundary<T>({
    required Future<T> Function() operation,
    T? fallbackValue,
    bool silent = false,
  }) async {
    try {
      return await operation();
    } catch (e) {
      if (!silent) {
        ErrorHandler().handleError(e, silent: true);
      }
      return fallbackValue;
    }
  }
}

/// Memory management utilities
class MemoryManager {
  static final MemoryManager _instance = MemoryManager._internal();
  factory MemoryManager() => _instance;
  MemoryManager._internal();

  /// Check available memory (estimation)
  bool isMemoryLow() {
    // This is a simplified check
    // In production, you'd use platform channels to get actual memory info
    try {
      // Try to allocate a test list
      final test = List.filled(1000000, 0);
      test.clear();
      return false;
    } catch (e) {
      return true;
    }
  }

  /// Clear caches to free memory
  void clearCaches() {
    // Clear image cache
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();

    debugPrint('Caches cleared to free memory');
  }

  /// Monitor memory usage
  void startMemoryMonitoring() {
    // In production, implement periodic memory checks
    // and warnings when memory is low
  }
}