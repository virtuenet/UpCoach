import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/errors/error_handler.dart';

/// A widget that handles AsyncValue states (loading, error, data)
class AsyncValueWidget<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget Function()? loading;
  final Widget Function(Object error, StackTrace? stackTrace)? error;
  final VoidCallback? onRetry;
  final bool skipLoadingOnRefresh;
  final bool skipErrorOnRefresh;

  const AsyncValueWidget({
    super.key,
    required this.value,
    required this.data,
    this.loading,
    this.error,
    this.onRetry,
    this.skipLoadingOnRefresh = true,
    this.skipErrorOnRefresh = false,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () {
        // Show previous data during refresh if available
        if (skipLoadingOnRefresh && value.hasValue) {
          return data(value.value as T);
        }
        return loading?.call() ?? const LoadingStateWidget();
      },
      error: (err, stack) {
        // Show previous data during refresh error if available
        if (skipErrorOnRefresh && value.hasValue) {
          return data(value.value as T);
        }
        return error?.call(err, stack) ??
            ErrorStateWidget(
              error: err,
              onRetry: onRetry,
            );
      },
    );
  }
}

/// A sliver version of AsyncValueWidget for use in CustomScrollView
class AsyncValueSliverWidget<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget Function()? loading;
  final Widget Function(Object error, StackTrace? stackTrace)? error;
  final VoidCallback? onRetry;

  const AsyncValueSliverWidget({
    super.key,
    required this.value,
    required this.data,
    this.loading,
    this.error,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () =>
          loading?.call() ??
          const SliverFillRemaining(child: LoadingStateWidget()),
      error: (err, stack) =>
          error?.call(err, stack) ??
          SliverFillRemaining(
            child: ErrorStateWidget(error: err, onRetry: onRetry),
          ),
    );
  }
}

/// Standard loading state widget
class LoadingStateWidget extends StatelessWidget {
  final String? message;
  final double size;

  const LoadingStateWidget({
    super.key,
    this.message,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              color: AppTheme.primaryColor,
              strokeWidth: 3,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Standard error state widget with retry button
class ErrorStateWidget extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  final String? customMessage;
  final IconData? icon;

  const ErrorStateWidget({
    super.key,
    required this.error,
    this.onRetry,
    this.customMessage,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final appError = AppException.fromError(error);
    final errorIcon = icon ?? _getIconForError(appError);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                errorIcon,
                size: 48,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _getTitleForError(appError),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              customMessage ?? appError.message,
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getIconForError(AppException error) {
    switch (error.type) {
      case AppErrorType.network:
        return Icons.wifi_off_rounded;
      case AppErrorType.timeout:
        return Icons.timer_off_rounded;
      case AppErrorType.server:
        return Icons.cloud_off_rounded;
      case AppErrorType.authentication:
        return Icons.lock_outline_rounded;
      case AppErrorType.notFound:
        return Icons.search_off_rounded;
      case AppErrorType.validation:
        return Icons.error_outline_rounded;
      default:
        return Icons.warning_amber_rounded;
    }
  }

  String _getTitleForError(AppException error) {
    switch (error.type) {
      case AppErrorType.network:
        return 'No Connection';
      case AppErrorType.timeout:
        return 'Request Timeout';
      case AppErrorType.server:
        return 'Server Error';
      case AppErrorType.authentication:
        return 'Authentication Required';
      case AppErrorType.notFound:
        return 'Not Found';
      case AppErrorType.validation:
        return 'Invalid Data';
      default:
        return 'Something Went Wrong';
    }
  }
}

/// Empty state widget for when data is empty
class EmptyStateWidget extends StatelessWidget {
  final String title;
  final String? message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyStateWidget({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.inbox_rounded,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 48,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
              textAlign: TextAlign.center,
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Inline loading indicator for buttons or small areas
class InlineLoadingWidget extends StatelessWidget {
  final double size;
  final Color? color;

  const InlineLoadingWidget({
    super.key,
    this.size = 20,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: color ?? Colors.white,
      ),
    );
  }
}

/// Skeleton loading placeholder
class SkeletonWidget extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;

  const SkeletonWidget({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Pull-to-refresh wrapper
class RefreshableWidget extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;

  const RefreshableWidget({
    super.key,
    required this.child,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppTheme.primaryColor,
      child: child,
    );
  }
}
