import 'dart:async';
import 'dart:isolate';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// Crash reporting service for mobile app
class CrashReporter {
  static final CrashReporter _instance = CrashReporter._internal();
  factory CrashReporter() => _instance;
  CrashReporter._internal();

  final List<CrashReport> _reports = [];
  final List<Breadcrumb> _breadcrumbs = [];
  final Map<String, dynamic> _userContext = {};
  final Map<String, String> _tags = {};

  bool _isInitialized = false;
  static const int _maxReports = 100;
  static const int _maxBreadcrumbs = 50;

  /// Initialize crash reporting
  Future<void> initialize() async {
    if (_isInitialized) return;

    _isInitialized = true;
    _setupFlutterErrorHandling();
    _setupIsolateErrorHandling();
    _setupZoneErrorHandling();

    debugPrint('[CrashReporter] Initialized');
  }

  /// Set user context
  void setUser(String? userId, {String? email, String? username}) {
    _userContext['userId'] = userId;
    _userContext['email'] = email;
    _userContext['username'] = username;
  }

  /// Set tag
  void setTag(String key, String value) {
    _tags[key] = value;
  }

  /// Remove tag
  void removeTag(String key) {
    _tags.remove(key);
  }

  /// Add breadcrumb
  void addBreadcrumb(
    String message, {
    BreadcrumbType type = BreadcrumbType.info,
    Map<String, dynamic>? data,
  }) {
    final breadcrumb = Breadcrumb(
      timestamp: DateTime.now(),
      message: message,
      type: type,
      data: data,
    );

    _breadcrumbs.add(breadcrumb);
    while (_breadcrumbs.length > _maxBreadcrumbs) {
      _breadcrumbs.removeAt(0);
    }
  }

  /// Capture exception
  Future<void> captureException(
    dynamic exception,
    StackTrace? stackTrace, {
    String? context,
    Map<String, dynamic>? extra,
    CrashSeverity severity = CrashSeverity.error,
    bool fatal = false,
  }) async {
    final report = CrashReport(
      id: _generateId(),
      timestamp: DateTime.now(),
      exception: exception.toString(),
      exceptionType: exception.runtimeType.toString(),
      stackTrace: stackTrace?.toString(),
      context: context,
      extra: extra,
      severity: severity,
      fatal: fatal,
      userContext: Map.from(_userContext),
      tags: Map.from(_tags),
      breadcrumbs: List.from(_breadcrumbs),
      deviceInfo: await _getDeviceInfo(),
    );

    _reports.add(report);
    while (_reports.length > _maxReports) {
      _reports.removeAt(0);
    }

    // Log critical/fatal errors
    if (fatal || severity == CrashSeverity.critical) {
      debugPrint('[CrashReporter] FATAL: ${exception.toString()}');
      debugPrint('[CrashReporter] Stack: $stackTrace');
    }

    // In production, would send to crash reporting service
    await _sendToBackend(report);
  }

  /// Capture message
  Future<void> captureMessage(
    String message, {
    CrashSeverity severity = CrashSeverity.info,
    Map<String, dynamic>? extra,
  }) async {
    final report = CrashReport(
      id: _generateId(),
      timestamp: DateTime.now(),
      exception: message,
      exceptionType: 'Message',
      severity: severity,
      extra: extra,
      userContext: Map.from(_userContext),
      tags: Map.from(_tags),
      breadcrumbs: List.from(_breadcrumbs),
      deviceInfo: await _getDeviceInfo(),
    );

    _reports.add(report);
    while (_reports.length > _maxReports) {
      _reports.removeAt(0);
    }

    await _sendToBackend(report);
  }

  /// Get crash reports
  List<CrashReport> getReports({int limit = 20}) {
    return _reports.reversed.take(limit).toList();
  }

  /// Get breadcrumbs
  List<Breadcrumb> getBreadcrumbs() {
    return List.from(_breadcrumbs);
  }

  /// Clear reports
  void clearReports() {
    _reports.clear();
  }

  /// Clear breadcrumbs
  void clearBreadcrumbs() {
    _breadcrumbs.clear();
  }

  void _setupFlutterErrorHandling() {
    FlutterError.onError = (FlutterErrorDetails details) {
      captureException(
        details.exception,
        details.stack,
        context: 'FlutterError: ${details.context?.toString()}',
        severity: CrashSeverity.error,
        fatal: details.silent == false,
      );

      // Still print to console in debug mode
      if (kDebugMode) {
        FlutterError.dumpErrorToConsole(details);
      }
    };

    // Handle errors in the platform dispatcher
    PlatformDispatcher.instance.onError = (error, stack) {
      captureException(
        error,
        stack,
        context: 'PlatformDispatcher',
        severity: CrashSeverity.critical,
        fatal: true,
      );
      return true;
    };
  }

  void _setupIsolateErrorHandling() {
    Isolate.current.addErrorListener(RawReceivePort((pair) async {
      final List<dynamic> errorAndStacktrace = pair as List<dynamic>;
      await captureException(
        errorAndStacktrace.first,
        StackTrace.fromString(errorAndStacktrace.last.toString()),
        context: 'Isolate error',
        severity: CrashSeverity.error,
      );
    }).sendPort);
  }

  void _setupZoneErrorHandling() {
    // Zone error handling is typically set up in main()
    // This is a placeholder for documentation
  }

  Future<Map<String, dynamic>> _getDeviceInfo() async {
    // In production, would use device_info_plus package
    return {
      'platform': defaultTargetPlatform.name,
      'isDebug': kDebugMode,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }

  Future<void> _sendToBackend(CrashReport report) async {
    // In production, would send to backend/Sentry/Crashlytics
    debugPrint('[CrashReporter] Report captured: ${report.id}');
  }

  String _generateId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${_randomString(8)}';
  }

  String _randomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.write(chars[(DateTime.now().microsecond + i) % chars.length]);
    }
    return buffer.toString();
  }
}

/// Crash severity levels
enum CrashSeverity {
  debug,
  info,
  warning,
  error,
  critical,
}

/// Breadcrumb types
enum BreadcrumbType {
  navigation,
  http,
  info,
  error,
  user,
  system,
}

/// Breadcrumb entry
class Breadcrumb {
  final DateTime timestamp;
  final String message;
  final BreadcrumbType type;
  final Map<String, dynamic>? data;

  Breadcrumb({
    required this.timestamp,
    required this.message,
    required this.type,
    this.data,
  });

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'message': message,
    'type': type.name,
    'data': data,
  };
}

/// Crash report
class CrashReport {
  final String id;
  final DateTime timestamp;
  final String exception;
  final String exceptionType;
  final String? stackTrace;
  final String? context;
  final Map<String, dynamic>? extra;
  final CrashSeverity severity;
  final bool fatal;
  final Map<String, dynamic> userContext;
  final Map<String, String> tags;
  final List<Breadcrumb> breadcrumbs;
  final Map<String, dynamic> deviceInfo;

  CrashReport({
    required this.id,
    required this.timestamp,
    required this.exception,
    required this.exceptionType,
    this.stackTrace,
    this.context,
    this.extra,
    required this.severity,
    this.fatal = false,
    required this.userContext,
    required this.tags,
    required this.breadcrumbs,
    required this.deviceInfo,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'timestamp': timestamp.toIso8601String(),
    'exception': exception,
    'exceptionType': exceptionType,
    'stackTrace': stackTrace,
    'context': context,
    'extra': extra,
    'severity': severity.name,
    'fatal': fatal,
    'userContext': userContext,
    'tags': tags,
    'breadcrumbs': breadcrumbs.map((b) => b.toJson()).toList(),
    'deviceInfo': deviceInfo,
  };
}

/// Error boundary widget for Flutter
class ErrorBoundaryWidget extends StatefulWidget {
  final Widget child;
  final Widget Function(Object error, StackTrace? stackTrace)? errorBuilder;
  final void Function(Object error, StackTrace? stackTrace)? onError;

  const ErrorBoundaryWidget({
    super.key,
    required this.child,
    this.errorBuilder,
    this.onError,
  });

  @override
  State<ErrorBoundaryWidget> createState() => _ErrorBoundaryWidgetState();
}

class _ErrorBoundaryWidgetState extends State<ErrorBoundaryWidget> {
  Object? _error;
  StackTrace? _stackTrace;

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(_error!, _stackTrace);
      }
      return _buildDefaultErrorWidget();
    }

    return ErrorWidget.builder = (FlutterErrorDetails details) {
      if (!mounted) return const SizedBox.shrink();

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _error = details.exception;
            _stackTrace = details.stack;
          });

          CrashReporter().captureException(
            details.exception,
            details.stack,
            context: 'ErrorBoundary',
          );

          widget.onError?.call(details.exception, details.stack);
        }
      });

      return _buildDefaultErrorWidget();
    };
  }

  Widget _buildDefaultErrorWidget() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.red,
            size: 48,
          ),
          const SizedBox(height: 16),
          const Text(
            'Something went wrong',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error?.toString() ?? 'Unknown error',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _error = null;
                _stackTrace = null;
              });
            },
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}
