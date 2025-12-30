import 'package:flutter/material.dart';
import 'dart:async';

/// Wearable widget types
enum WearableWidgetType {
  compact,
  detailed,
  progress,
  stats,
}

/// Wearable platform
enum WearablePlatform {
  appleWatch,
  wearOS,
  unknown,
}

/// Widget data model
class WearableWidgetData {
  final String title;
  final String? subtitle;
  final int? value;
  final int? maxValue;
  final String? unit;
  final IconData? icon;
  final Color? color;
  final DateTime lastUpdated;

  const WearableWidgetData({
    required this.title,
    this.subtitle,
    this.value,
    this.maxValue,
    this.unit,
    this.icon,
    this.color,
    DateTime? lastUpdated,
  }) : lastUpdated = lastUpdated ?? const DateTime(2025);

  factory WearableWidgetData.streak({required int days}) {
    return WearableWidgetData(
      title: 'Streak',
      value: days,
      unit: 'days',
      icon: Icons.local_fire_department,
      color: Colors.orange,
    );
  }

  factory WearableWidgetData.habitProgress({
    required int completed,
    required int total,
  }) {
    return WearableWidgetData(
      title: 'Today',
      value: completed,
      maxValue: total,
      unit: 'habits',
      icon: Icons.check_circle,
      color: Colors.green,
    );
  }

  factory WearableWidgetData.steps({required int steps, int goal = 10000}) {
    return WearableWidgetData(
      title: 'Steps',
      value: steps,
      maxValue: goal,
      unit: 'steps',
      icon: Icons.directions_walk,
      color: Colors.blue,
    );
  }
}

/// Gesture types for wearable interaction
enum WearableGesture {
  tap,
  doubleTap,
  longPress,
  swipeLeft,
  swipeRight,
  swipeUp,
  swipeDown,
}

/// Wearable widget builder for creating optimized widgets for smartwatches
class WearableWidgetBuilder {
  final WearablePlatform platform;
  final double screenSize;
  final bool isRound;

  const WearableWidgetBuilder({
    this.platform = WearablePlatform.unknown,
    this.screenSize = 44.0, // Default Apple Watch 44mm
    this.isRound = false,
  });

  // ============================================================================
  // Widget Builders
  // ============================================================================

  Widget buildCompactWidget(WearableWidgetData data) {
    return Container(
      constraints: BoxConstraints(
        maxWidth: screenSize,
        maxHeight: screenSize,
      ),
      decoration: BoxDecoration(
        color: data.color?.withOpacity(0.1),
        borderRadius: isRound ? null : BorderRadius.circular(8),
        shape: isRound ? BoxShape.circle : BoxShape.rectangle,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (data.icon != null)
            Icon(
              data.icon,
              size: _getIconSize(WearableWidgetType.compact),
              color: data.color,
            ),
          const SizedBox(height: 4),
          Text(
            '${data.value ?? 0}',
            style: TextStyle(
              fontSize: _getFontSize(WearableWidgetType.compact, large: true),
              fontWeight: FontWeight.bold,
              color: data.color,
            ),
          ),
          if (data.unit != null)
            Text(
              data.unit!,
              style: TextStyle(
                fontSize: _getFontSize(WearableWidgetType.compact, large: false),
                color: Colors.grey,
              ),
            ),
        ],
      ),
    );
  }

  Widget buildDetailedWidget(WearableWidgetData data) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            data.color?.withOpacity(0.2) ?? Colors.grey.withOpacity(0.2),
            data.color?.withOpacity(0.05) ?? Colors.grey.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: isRound ? null : BorderRadius.circular(12),
        shape: isRound ? BoxShape.circle : BoxShape.rectangle,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (data.icon != null)
            Icon(
              data.icon,
              size: _getIconSize(WearableWidgetType.detailed),
              color: data.color,
            ),
          const SizedBox(height: 8),
          Text(
            data.title,
            style: TextStyle(
              fontSize: _getFontSize(WearableWidgetType.detailed, large: false),
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${data.value ?? 0}',
                style: TextStyle(
                  fontSize: _getFontSize(WearableWidgetType.detailed, large: true),
                  fontWeight: FontWeight.bold,
                  color: data.color,
                ),
              ),
              if (data.maxValue != null) ...[
                Text(
                  ' / ${data.maxValue}',
                  style: TextStyle(
                    fontSize: _getFontSize(WearableWidgetType.detailed, large: false),
                    color: Colors.grey,
                  ),
                ),
              ],
              if (data.unit != null)
                Text(
                  ' ${data.unit}',
                  style: TextStyle(
                    fontSize: _getFontSize(WearableWidgetType.detailed, large: false),
                    color: Colors.grey,
                  ),
                ),
            ],
          ),
          if (data.subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              data.subtitle!,
              style: TextStyle(
                fontSize: _getFontSize(WearableWidgetType.detailed, large: false) - 2,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget buildProgressWidget(WearableWidgetData data) {
    final progress = data.maxValue != null && data.maxValue! > 0
        ? (data.value ?? 0) / data.maxValue!
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            data.title,
            style: TextStyle(
              fontSize: _getFontSize(WearableWidgetType.progress, large: false),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: screenSize * 0.6,
                height: screenSize * 0.6,
                child: CircularProgressIndicator(
                  value: progress.clamp(0.0, 1.0),
                  strokeWidth: 8,
                  backgroundColor: Colors.grey.withOpacity(0.2),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    data.color ?? Colors.blue,
                  ),
                ),
              ),
              Column(
                children: [
                  Text(
                    '${data.value ?? 0}',
                    style: TextStyle(
                      fontSize: _getFontSize(WearableWidgetType.progress, large: true),
                      fontWeight: FontWeight.bold,
                      color: data.color,
                    ),
                  ),
                  if (data.maxValue != null)
                    Text(
                      'of ${data.maxValue}',
                      style: TextStyle(
                        fontSize: _getFontSize(WearableWidgetType.progress, large: false),
                        color: Colors.grey,
                      ),
                    ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${(progress * 100).toInt()}% Complete',
            style: TextStyle(
              fontSize: _getFontSize(WearableWidgetType.progress, large: false),
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildStatsWidget(List<WearableWidgetData> stats) {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Today\'s Stats',
            style: TextStyle(
              fontSize: _getFontSize(WearableWidgetType.stats, large: false),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...stats.map((stat) => _buildStatRow(stat)),
        ],
      ),
    );
  }

  Widget _buildStatRow(WearableWidgetData data) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (data.icon != null) ...[
                Icon(
                  data.icon,
                  size: 16,
                  color: data.color,
                ),
                const SizedBox(width: 8),
              ],
              Text(
                data.title,
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
          Text(
            '${data.value ?? 0}${data.unit != null ? ' ${data.unit}' : ''}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: data.color,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // Gesture Controls
  // ============================================================================

  Widget withGesture({
    required Widget child,
    VoidCallback? onTap,
    VoidCallback? onDoubleTap,
    VoidCallback? onLongPress,
    VoidCallback? onSwipeLeft,
    VoidCallback? onSwipeRight,
    VoidCallback? onSwipeUp,
    VoidCallback? onSwipeDown,
  }) {
    return GestureDetector(
      onTap: onTap,
      onDoubleTap: onDoubleTap,
      onLongPress: onLongPress,
      onHorizontalDragEnd: (details) {
        if (details.primaryVelocity! > 0) {
          onSwipeRight?.call();
        } else if (details.primaryVelocity! < 0) {
          onSwipeLeft?.call();
        }
      },
      onVerticalDragEnd: (details) {
        if (details.primaryVelocity! > 0) {
          onSwipeDown?.call();
        } else if (details.primaryVelocity! < 0) {
          onSwipeUp?.call();
        }
      },
      child: child,
    );
  }

  // ============================================================================
  // Real-time Data Updates
  // ============================================================================

  Widget withRealTimeUpdates({
    required Widget Function(WearableWidgetData data) builder,
    required Stream<WearableWidgetData> dataStream,
    required WearableWidgetData initialData,
  }) {
    return StreamBuilder<WearableWidgetData>(
      stream: dataStream,
      initialData: initialData,
      builder: (context, snapshot) {
        return builder(snapshot.data ?? initialData);
      },
    );
  }

  // ============================================================================
  // Customizable Layouts
  // ============================================================================

  Widget buildCustomLayout({
    required List<Widget> widgets,
    WearableLayoutType layout = WearableLayoutType.column,
  }) {
    switch (layout) {
      case WearableLayoutType.column:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: widgets,
        );
      case WearableLayoutType.row:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: widgets,
        );
      case WearableLayoutType.grid:
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          children: widgets,
        );
      case WearableLayoutType.stack:
        return Stack(
          alignment: Alignment.center,
          children: widgets,
        );
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  double _getIconSize(WearableWidgetType type) {
    switch (type) {
      case WearableWidgetType.compact:
        return screenSize * 0.25;
      case WearableWidgetType.detailed:
        return screenSize * 0.3;
      case WearableWidgetType.progress:
        return screenSize * 0.2;
      case WearableWidgetType.stats:
        return 16;
    }
  }

  double _getFontSize(WearableWidgetType type, {required bool large}) {
    final base = screenSize * 0.2;
    switch (type) {
      case WearableWidgetType.compact:
        return large ? base * 0.8 : base * 0.4;
      case WearableWidgetType.detailed:
        return large ? base * 1.0 : base * 0.5;
      case WearableWidgetType.progress:
        return large ? base * 0.9 : base * 0.45;
      case WearableWidgetType.stats:
        return large ? 14 : 12;
    }
  }

  // ============================================================================
  // Platform-specific Optimizations
  // ============================================================================

  Widget optimizeForPlatform(Widget child) {
    switch (platform) {
      case WearablePlatform.appleWatch:
        return _appleWatchOptimizations(child);
      case WearablePlatform.wearOS:
        return _wearOSOptimizations(child);
      case WearablePlatform.unknown:
        return child;
    }
  }

  Widget _appleWatchOptimizations(Widget child) {
    // Add Apple Watch specific optimizations
    return child;
  }

  Widget _wearOSOptimizations(Widget child) {
    // Add Wear OS specific optimizations
    return child;
  }
}

/// Layout types for wearable widgets
enum WearableLayoutType {
  column,
  row,
  grid,
  stack,
}
