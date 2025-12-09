import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/toast_service.dart';

/// Custom app exception types
enum AppErrorType {
  network,
  server,
  authentication,
  validation,
  notFound,
  timeout,
  cancelled,
  unknown,
}

/// Application-specific exception
class AppException implements Exception {
  final String message;
  final AppErrorType type;
  final String? code;
  final dynamic originalError;
  final StackTrace? stackTrace;

  const AppException({
    required this.message,
    this.type = AppErrorType.unknown,
    this.code,
    this.originalError,
    this.stackTrace,
  });

  @override
  String toString() => message;

  /// Create from various error types
  factory AppException.fromError(Object error, [StackTrace? stackTrace]) {
    if (error is AppException) return error;

    if (error is DioException) {
      return AppException._fromDioError(error, stackTrace);
    }

    if (error is SocketException) {
      return AppException(
        message: 'No internet connection',
        type: AppErrorType.network,
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    if (error is TimeoutException) {
      return AppException(
        message: 'Request timed out. Please try again.',
        type: AppErrorType.timeout,
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    if (error is FormatException) {
      return AppException(
        message: 'Invalid data format received',
        type: AppErrorType.validation,
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    return AppException(
      message: error.toString(),
      type: AppErrorType.unknown,
      originalError: error,
      stackTrace: stackTrace,
    );
  }

  factory AppException._fromDioError(DioException error,
      [StackTrace? stackTrace]) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return AppException(
          message: 'Connection timed out. Please check your internet.',
          type: AppErrorType.timeout,
          originalError: error,
          stackTrace: stackTrace,
        );

      case DioExceptionType.connectionError:
        return AppException(
          message: 'Unable to connect. Please check your internet.',
          type: AppErrorType.network,
          originalError: error,
          stackTrace: stackTrace,
        );

      case DioExceptionType.cancel:
        return AppException(
          message: 'Request was cancelled',
          type: AppErrorType.cancelled,
          originalError: error,
          stackTrace: stackTrace,
        );

      case DioExceptionType.badResponse:
        return _parseHttpError(error, stackTrace);

      case DioExceptionType.badCertificate:
        return AppException(
          message: 'Security certificate error',
          type: AppErrorType.network,
          originalError: error,
          stackTrace: stackTrace,
        );

      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return AppException(
            message: 'No internet connection',
            type: AppErrorType.network,
            originalError: error,
            stackTrace: stackTrace,
          );
        }
        return AppException(
          message: 'Something went wrong. Please try again.',
          type: AppErrorType.unknown,
          originalError: error,
          stackTrace: stackTrace,
        );
    }
  }

  static AppException _parseHttpError(DioException error,
      [StackTrace? stackTrace]) {
    final statusCode = error.response?.statusCode;
    final data = error.response?.data;

    String message = 'Something went wrong';
    String? code;

    // Try to extract message from response
    if (data is Map<String, dynamic>) {
      message = data['message'] ?? data['error'] ?? message;
      code = data['code']?.toString();
    }

    switch (statusCode) {
      case 400:
        return AppException(
          message: message.isNotEmpty ? message : 'Invalid request',
          type: AppErrorType.validation,
          code: code ?? 'BAD_REQUEST',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 401:
        return AppException(
          message: 'Please log in to continue',
          type: AppErrorType.authentication,
          code: code ?? 'UNAUTHORIZED',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 403:
        return AppException(
          message: 'You don\'t have permission to do this',
          type: AppErrorType.authentication,
          code: code ?? 'FORBIDDEN',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 404:
        return AppException(
          message: message.isNotEmpty ? message : 'Resource not found',
          type: AppErrorType.notFound,
          code: code ?? 'NOT_FOUND',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 422:
        return AppException(
          message: message.isNotEmpty ? message : 'Invalid input data',
          type: AppErrorType.validation,
          code: code ?? 'VALIDATION_ERROR',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 429:
        return AppException(
          message: 'Too many requests. Please wait a moment.',
          type: AppErrorType.server,
          code: code ?? 'RATE_LIMITED',
          originalError: error,
          stackTrace: stackTrace,
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return AppException(
          message: 'Server error. Please try again later.',
          type: AppErrorType.server,
          code: code ?? 'SERVER_ERROR',
          originalError: error,
          stackTrace: stackTrace,
        );

      default:
        return AppException(
          message: message,
          type: AppErrorType.unknown,
          code: code,
          originalError: error,
          stackTrace: stackTrace,
        );
    }
  }
}

/// Global error handler for the app
class ErrorHandler {
  static final ErrorHandler _instance = ErrorHandler._internal();
  factory ErrorHandler() => _instance;
  ErrorHandler._internal();

  final ToastService _toastService = ToastService();

  /// Handle an error and optionally show a toast
  AppException handle(Object error, [StackTrace? stackTrace]) {
    final appError = AppException.fromError(error, stackTrace);

    // Log in debug mode
    if (kDebugMode) {
      debugPrint('ErrorHandler: ${appError.type} - ${appError.message}');
      if (stackTrace != null) {
        debugPrint('Stack trace: $stackTrace');
      }
    }

    return appError;
  }

  /// Handle error and show appropriate toast
  AppException handleAndShow(Object error, [StackTrace? stackTrace]) {
    final appError = handle(error, stackTrace);
    _showErrorToast(appError);
    return appError;
  }

  /// Handle error with retry option
  AppException handleWithRetry(Object error, VoidCallback onRetry,
      [StackTrace? stackTrace]) {
    final appError = handle(error, stackTrace);
    _toastService.showErrorWithRetry(appError.message, onRetry);
    return appError;
  }

  /// Show appropriate toast for error type
  void _showErrorToast(AppException error) {
    switch (error.type) {
      case AppErrorType.network:
        _toastService.showNetworkError();
        break;
      case AppErrorType.timeout:
        _toastService.showError('Connection timed out. Please try again.');
        break;
      case AppErrorType.authentication:
        _toastService.showWarning(error.message);
        break;
      case AppErrorType.cancelled:
        // Don't show toast for cancelled requests
        break;
      default:
        _toastService.showError(error.message);
    }
  }

  /// Check if error is recoverable (can be retried)
  bool isRecoverable(Object error) {
    final appError =
        error is AppException ? error : AppException.fromError(error);
    return appError.type == AppErrorType.network ||
        appError.type == AppErrorType.timeout ||
        appError.type == AppErrorType.server;
  }
}

/// Provider for ErrorHandler
final errorHandlerProvider = Provider<ErrorHandler>((ref) {
  return ErrorHandler();
});

/// Extension for easier error handling in async operations
extension ErrorHandlingExtension<T> on Future<T> {
  /// Handle errors and show toast
  Future<T?> handleErrors({
    VoidCallback? onRetry,
    bool showToast = true,
  }) async {
    try {
      return await this;
    } catch (error, stackTrace) {
      if (onRetry != null) {
        ErrorHandler().handleWithRetry(error, onRetry, stackTrace);
      } else if (showToast) {
        ErrorHandler().handleAndShow(error, stackTrace);
      } else {
        ErrorHandler().handle(error, stackTrace);
      }
      return null;
    }
  }
}
