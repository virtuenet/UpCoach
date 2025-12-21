import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import '../analytics/analytics_service.dart';

/// Check if Firebase is initialized
bool get _isFirebaseInitialized {
  try {
    Firebase.app();
    return true;
  } catch (_) {
    return false;
  }
}

/// Error information for display and reporting
class ErrorInfo {
  final dynamic error;
  final StackTrace? stackTrace;
  final String? context;
  final DateTime timestamp;
  final bool isFatal;

  ErrorInfo({
    required this.error,
    this.stackTrace,
    this.context,
    this.isFatal = false,
  }) : timestamp = DateTime.now();

  String get errorType => error.runtimeType.toString();
  String get errorMessage => error.toString();

  Map<String, dynamic> toJson() => {
        'error_type': errorType,
        'error_message': errorMessage,
        'context': context,
        'timestamp': timestamp.toIso8601String(),
        'is_fatal': isFatal,
      };
}

/// Global error handler singleton
class ErrorHandler {
  static final ErrorHandler _instance = ErrorHandler._internal();
  factory ErrorHandler() => _instance;
  ErrorHandler._internal();

  final _errorStreamController = StreamController<ErrorInfo>.broadcast();
  Stream<ErrorInfo> get errorStream => _errorStreamController.stream;

  final List<ErrorInfo> _recentErrors = [];
  List<ErrorInfo> get recentErrors => List.unmodifiable(_recentErrors);

  static const int _maxRecentErrors = 50;

  /// Initialize global error handling
  void initialize() {
    // Handle Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      _handleFlutterError(details);
    };

    // Handle errors outside Flutter framework
    PlatformDispatcher.instance.onError = (error, stack) {
      _handlePlatformError(error, stack);
      return true;
    };

    debugPrint('✅ ErrorHandler initialized');
  }

  /// Handle Flutter framework errors
  void _handleFlutterError(FlutterErrorDetails details) {
    final errorInfo = ErrorInfo(
      error: details.exception,
      stackTrace: details.stack,
      context: details.context?.toDescription(),
      isFatal: true,
    );

    _recordError(errorInfo);

    // Report to Crashlytics (only if Firebase is initialized)
    if (_isFirebaseInitialized) {
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    }

    // In debug mode, also print to console
    if (kDebugMode) {
      FlutterError.dumpErrorToConsole(details);
    }
  }

  /// Handle platform/async errors
  void _handlePlatformError(Object error, StackTrace stack) {
    final errorInfo = ErrorInfo(
      error: error,
      stackTrace: stack,
      context: 'Platform/Async Error',
      isFatal: true,
    );

    _recordError(errorInfo);

    // Report to Crashlytics (only if Firebase is initialized)
    if (_isFirebaseInitialized) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    }
  }

  /// Record a non-fatal error
  void recordError(
    dynamic error, {
    StackTrace? stackTrace,
    String? context,
    bool fatal = false,
  }) {
    final errorInfo = ErrorInfo(
      error: error,
      stackTrace: stackTrace,
      context: context,
      isFatal: fatal,
    );

    _recordError(errorInfo);

    // Report to Crashlytics (only if Firebase is initialized)
    if (_isFirebaseInitialized) {
      FirebaseCrashlytics.instance.recordError(
        error,
        stackTrace,
        reason: context,
        fatal: fatal,
      );
    }

    // Track in analytics
    AnalyticsService().trackError(
      error,
      stackTrace: stackTrace,
      reason: context,
      fatal: fatal,
    );
  }

  /// Internal error recording
  void _recordError(ErrorInfo errorInfo) {
    _recentErrors.add(errorInfo);
    if (_recentErrors.length > _maxRecentErrors) {
      _recentErrors.removeAt(0);
    }

    _errorStreamController.add(errorInfo);

    debugPrint('🔴 Error recorded: ${errorInfo.errorType}');
    if (errorInfo.context != null) {
      debugPrint('   Context: ${errorInfo.context}');
    }
  }

  /// Log a message to Crashlytics
  void log(String message) {
    if (_isFirebaseInitialized) {
      FirebaseCrashlytics.instance.log(message);
    } else {
      debugPrint('📝 Log: $message');
    }
  }

  /// Clear recent errors
  void clearRecentErrors() {
    _recentErrors.clear();
  }

  void dispose() {
    _errorStreamController.close();
  }
}

/// Error boundary widget that catches errors in its child widget tree
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(BuildContext, ErrorInfo)? errorBuilder;
  final void Function(ErrorInfo)? onError;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.errorBuilder,
    this.onError,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  ErrorInfo? _error;

  @override
  void initState() {
    super.initState();
  }

  // ignore: unused_element
  void _handleError(Object error, StackTrace stack) {
    final errorInfo = ErrorInfo(
      error: error,
      stackTrace: stack,
      context: 'ErrorBoundary',
    );

    setState(() {
      _error = errorInfo;
    });

    widget.onError?.call(errorInfo);
    ErrorHandler()
        .recordError(error, stackTrace: stack, context: 'ErrorBoundary');
  }

  void _retry() {
    setState(() {
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(context, _error!);
      }
      return _DefaultErrorWidget(
        error: _error!,
        onRetry: _retry,
      );
    }

    return widget.child;
  }
}

/// Default error display widget
class _DefaultErrorWidget extends StatelessWidget {
  final ErrorInfo error;
  final VoidCallback? onRetry;

  const _DefaultErrorWidget({
    required this.error,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      child: Container(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: theme.colorScheme.error,
                ),
                const SizedBox(height: 24),
                Text(
                  'Something went wrong',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'We encountered an unexpected error. Our team has been notified.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.textTheme.bodySmall?.color,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.errorContainer
                          .withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Debug Info:',
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${error.errorType}: ${error.errorMessage}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                          ),
                          maxLines: 5,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                if (onRetry != null)
                  ElevatedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Try Again'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// App-level error widget for fatal errors
class AppErrorWidget extends StatelessWidget {
  final FlutterErrorDetails details;

  const AppErrorWidget({
    super.key,
    required this.details,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 80,
                  color: Colors.red,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Oops! Something went wrong',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'The app encountered a critical error. Please restart the app.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: 24),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: SingleChildScrollView(
                        child: Text(
                          '${details.exception}\n\n${details.stack}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Zone error handler for wrapping the app
Future<void> runAppWithErrorHandling(Widget app) async {
  // Initialize error handler
  ErrorHandler().initialize();

  // Set custom error widget for release mode
  if (kReleaseMode) {
    ErrorWidget.builder = (FlutterErrorDetails details) {
      return AppErrorWidget(details: details);
    };
  }

  // Run app in a zone to catch async errors
  runZonedGuarded(
    () {
      runApp(app);
    },
    (error, stackTrace) {
      ErrorHandler().recordError(
        error,
        stackTrace: stackTrace,
        context: 'Zoned Error',
        fatal: true,
      );
    },
  );
}
