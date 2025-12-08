import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';

/// Types of toast notifications
enum ToastType {
  success,
  error,
  warning,
  info,
}

/// Toast style containing background color and icon
class _ToastStyle {
  final Color backgroundColor;
  final IconData icon;

  const _ToastStyle(this.backgroundColor, this.icon);
}

/// Toast configuration
class ToastConfig {
  final String message;
  final ToastType type;
  final Duration duration;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool dismissible;

  const ToastConfig({
    required this.message,
    this.type = ToastType.info,
    this.duration = const Duration(seconds: 3),
    this.actionLabel,
    this.onAction,
    this.dismissible = true,
  });
}

/// Service for showing toast notifications throughout the app
class ToastService {
  static final ToastService _instance = ToastService._internal();
  factory ToastService() => _instance;
  ToastService._internal();

  GlobalKey<ScaffoldMessengerState>? _messengerKey;

  /// Set the scaffold messenger key for showing snackbars
  void setMessengerKey(GlobalKey<ScaffoldMessengerState> key) {
    _messengerKey = key;
  }

  /// Get the scaffold messenger state
  ScaffoldMessengerState? get _messenger => _messengerKey?.currentState;

  /// Show a success toast
  void showSuccess(String message,
      {String? actionLabel, VoidCallback? onAction}) {
    _show(ToastConfig(
      message: message,
      type: ToastType.success,
      actionLabel: actionLabel,
      onAction: onAction,
    ));
  }

  /// Show an error toast
  void showError(String message,
      {String? actionLabel, VoidCallback? onAction, Duration? duration}) {
    _show(ToastConfig(
      message: message,
      type: ToastType.error,
      duration: duration ?? const Duration(seconds: 4),
      actionLabel: actionLabel,
      onAction: onAction,
    ));
  }

  /// Show a warning toast
  void showWarning(String message,
      {String? actionLabel, VoidCallback? onAction}) {
    _show(ToastConfig(
      message: message,
      type: ToastType.warning,
      actionLabel: actionLabel,
      onAction: onAction,
    ));
  }

  /// Show an info toast
  void showInfo(String message, {String? actionLabel, VoidCallback? onAction}) {
    _show(ToastConfig(
      message: message,
      type: ToastType.info,
      actionLabel: actionLabel,
      onAction: onAction,
    ));
  }

  /// Show a toast with retry action
  void showErrorWithRetry(String message, VoidCallback onRetry) {
    _show(ToastConfig(
      message: message,
      type: ToastType.error,
      duration: const Duration(seconds: 5),
      actionLabel: 'Retry',
      onAction: onRetry,
    ));
  }

  /// Show a network error toast
  void showNetworkError({VoidCallback? onRetry}) {
    _show(ToastConfig(
      message: 'No internet connection. Please check your network.',
      type: ToastType.error,
      duration: const Duration(seconds: 5),
      actionLabel: onRetry != null ? 'Retry' : null,
      onAction: onRetry,
    ));
  }

  /// Show a loading toast (returns a function to dismiss it)
  VoidCallback showLoading(String message) {
    final snackBar = SnackBar(
      content: Row(
        children: [
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(child: Text(message)),
        ],
      ),
      duration: const Duration(days: 1), // Indefinite
      backgroundColor: AppTheme.infoColor,
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );

    _messenger?.showSnackBar(snackBar);

    return () => _messenger?.hideCurrentSnackBar();
  }

  /// Show a custom toast
  void _show(ToastConfig config) {
    if (_messenger == null) {
      debugPrint('ToastService: Messenger not set, cannot show toast');
      return;
    }

    // Hide any existing snackbar
    _messenger!.hideCurrentSnackBar();

    final style = _getStyleForType(config.type);

    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(style.icon, color: Colors.white, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              config.message,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      duration: config.duration,
      backgroundColor: style.backgroundColor,
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      action: config.actionLabel != null
          ? SnackBarAction(
              label: config.actionLabel!,
              textColor: Colors.white,
              onPressed: () {
                _messenger!.hideCurrentSnackBar();
                config.onAction?.call();
              },
            )
          : null,
      dismissDirection: config.dismissible
          ? DismissDirection.horizontal
          : DismissDirection.none,
    );

    _messenger!.showSnackBar(snackBar);
  }

  /// Get background color and icon for toast type
  _ToastStyle _getStyleForType(ToastType type) {
    switch (type) {
      case ToastType.success:
        return _ToastStyle(AppTheme.successColor, Icons.check_circle_outline);
      case ToastType.error:
        return _ToastStyle(AppTheme.errorColor, Icons.error_outline);
      case ToastType.warning:
        return _ToastStyle(AppTheme.warningColor, Icons.warning_amber_outlined);
      case ToastType.info:
        return _ToastStyle(AppTheme.infoColor, Icons.info_outline);
    }
  }

  /// Clear all toasts
  void clearAll() {
    _messenger?.clearSnackBars();
  }
}

/// Provider for ToastService
final toastServiceProvider = Provider<ToastService>((ref) {
  return ToastService();
});

/// Extension on BuildContext for easy toast access
extension ToastExtension on BuildContext {
  void showSuccessToast(String message) {
    ToastService().showSuccess(message);
  }

  void showErrorToast(String message) {
    ToastService().showError(message);
  }

  void showWarningToast(String message) {
    ToastService().showWarning(message);
  }

  void showInfoToast(String message) {
    ToastService().showInfo(message);
  }
}
