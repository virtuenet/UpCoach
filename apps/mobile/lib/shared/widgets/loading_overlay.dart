import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/ui_constants.dart';
import '../../core/theme/app_theme.dart';

// Provider for managing loading state
final loadingOverlayProvider =
    StateNotifierProvider<LoadingOverlayNotifier, LoadingState>((ref) {
  return LoadingOverlayNotifier();
});

class LoadingState {
  final bool isLoading;
  final String? message;
  final double? progress;
  final bool canDismiss;

  const LoadingState({
    this.isLoading = false,
    this.message,
    this.progress,
    this.canDismiss = false,
  });

  LoadingState copyWith({
    bool? isLoading,
    String? message,
    double? progress,
    bool? canDismiss,
  }) {
    return LoadingState(
      isLoading: isLoading ?? this.isLoading,
      message: message ?? this.message,
      progress: progress ?? this.progress,
      canDismiss: canDismiss ?? this.canDismiss,
    );
  }
}

class LoadingOverlayNotifier extends StateNotifier<LoadingState> {
  LoadingOverlayNotifier() : super(const LoadingState());

  void show({String? message, bool canDismiss = false}) {
    state = state.copyWith(
      isLoading: true,
      message: message,
      progress: null,
      canDismiss: canDismiss,
    );
  }

  void showWithProgress({String? message, double? progress}) {
    state = state.copyWith(
      isLoading: true,
      message: message,
      progress: progress,
      canDismiss: false,
    );
  }

  void updateProgress(double progress, {String? message}) {
    state = state.copyWith(
      progress: progress,
      message: message ?? state.message,
    );
  }

  void hide() {
    state = const LoadingState();
  }
}

/// Loading overlay widget that displays a progress indicator
class LoadingOverlay extends ConsumerWidget {
  final Widget child;

  const LoadingOverlay({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loadingState = ref.watch(loadingOverlayProvider);

    return Stack(
      children: [
        child,
        if (loadingState.isLoading)
          GestureDetector(
            onTap: loadingState.canDismiss
                ? () => ref.read(loadingOverlayProvider.notifier).hide()
                : null,
            child: Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: Center(
                child: Card(
                  child: Container(
                    padding: const EdgeInsets.all(UIConstants.spacingLG),
                    constraints: const BoxConstraints(
                      minWidth: 200,
                      maxWidth: 300,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (loadingState.progress != null)
                          CircularProgressIndicator(
                            value: loadingState.progress,
                            strokeWidth:
                                UIConstants.loadingIndicatorStrokeWidth,
                          )
                        else
                          const CircularProgressIndicator(
                            strokeWidth:
                                UIConstants.loadingIndicatorStrokeWidth,
                          ),
                        if (loadingState.message != null) ...[
                          const SizedBox(height: UIConstants.spacingMD),
                          Text(
                            loadingState.message!,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ],
                        if (loadingState.progress != null) ...[
                          const SizedBox(height: UIConstants.spacingSM),
                          Text(
                            '${(loadingState.progress! * 100).toInt()}%',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                          ),
                        ],
                        if (loadingState.canDismiss) ...[
                          const SizedBox(height: UIConstants.spacingMD),
                          Text(
                            'Tap to dismiss',
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textSecondary,
                                    ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Extension methods for easy loading overlay usage
extension LoadingOverlayExtension on WidgetRef {
  void showLoading({String? message, bool canDismiss = false}) {
    read(loadingOverlayProvider.notifier).show(
      message: message,
      canDismiss: canDismiss,
    );
  }

  void showLoadingWithProgress({String? message, double? progress}) {
    read(loadingOverlayProvider.notifier).showWithProgress(
      message: message,
      progress: progress,
    );
  }

  void updateLoadingProgress(double progress, {String? message}) {
    read(loadingOverlayProvider.notifier).updateProgress(
      progress,
      message: message,
    );
  }

  void hideLoading() {
    read(loadingOverlayProvider.notifier).hide();
  }
}

/// Shimmer loading widget for content placeholders
class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoading({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(
      begin: -2,
      end: 2,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutSine,
    ));
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(_animation.value - 1, 0),
              end: Alignment(_animation.value + 1, 0),
              colors: [
                Colors.grey.shade300,
                Colors.grey.shade200,
                Colors.grey.shade300,
              ],
            ),
          ),
        );
      },
    );
  }
}
