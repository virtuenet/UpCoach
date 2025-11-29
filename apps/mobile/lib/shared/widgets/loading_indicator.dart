import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Loading indicator widget with consistent styling
class LoadingIndicator extends StatelessWidget {
  final double size;
  final double strokeWidth;
  final Color? color;
  final String? message;

  const LoadingIndicator({
    super.key,
    this.size = 48.0,
    this.strokeWidth = 4.0,
    this.color,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              strokeWidth: strokeWidth,
              valueColor: AlwaysStoppedAnimation<Color>(
                color ?? AppColors.primary,
              ),
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Full screen loading indicator
class FullScreenLoader extends StatelessWidget {
  final String? message;
  final Color? backgroundColor;

  const FullScreenLoader({
    super.key,
    this.message,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: backgroundColor ?? Colors.black.withValues(alpha: 0.5),
      child: LoadingIndicator(
        message: message,
        color: Colors.white,
      ),
    );
  }
}

/// Inline loading indicator for buttons
class ButtonLoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;

  const ButtonLoadingIndicator({
    super.key,
    this.size = 20.0,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2.0,
        valueColor: AlwaysStoppedAnimation<Color>(
          color ?? Colors.white,
        ),
      ),
    );
  }
}
