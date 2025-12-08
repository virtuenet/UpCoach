import 'package:logger/logger.dart' as pkg_logger;

/// Global logger instance for the app
final logger = AppLogger();

/// App logger wrapper for consistent logging across the app
class AppLogger {
  final pkg_logger.Logger _logger = pkg_logger.Logger(
    printer: pkg_logger.PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 80,
      colors: true,
      printEmojis: true,
      dateTimeFormat: pkg_logger.DateTimeFormat.onlyTimeAndSinceStart,
    ),
  );

  /// Log verbose message
  void v(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.t(message, time: time, error: error, stackTrace: stackTrace);
  }

  /// Log debug message
  void d(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.d(message, time: time, error: error, stackTrace: stackTrace);
  }

  /// Log info message
  void i(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.i(message, time: time, error: error, stackTrace: stackTrace);
  }

  /// Log warning message
  void w(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.w(message, time: time, error: error, stackTrace: stackTrace);
  }

  /// Log error message
  void e(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.e(message, time: time, error: error, stackTrace: stackTrace);
  }

  /// Log fatal message
  void f(dynamic message,
      {DateTime? time, Object? error, StackTrace? stackTrace}) {
    _logger.f(message, time: time, error: error, stackTrace: stackTrace);
  }
}
