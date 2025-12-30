import 'package:flutter/material.dart';
import 'dart:async';

/// Widget type for wearables
enum WearableWidgetType {
  habitTracker,
  goalProgress,
  streakCounter,
  quickAction,
  statistics,
  timer,
}

/// Widget size category
enum WidgetSize {
  small,
  medium,
  large,
  extraLarge,
}

/// Widget data model
class WearableWidgetData {
  final String id;
  final WearableWidgetType type;
  final String title;
  final dynamic value;
  final Map<String, dynamic>? metadata;
  final DateTime lastUpdated;

  const WearableWidgetData({
    required this.id,
    required this.type,
    required this.title,
    required this.value,
    this.metadata,
    required this.lastUpdated,
  });
}

/// Gesture type for interactions
enum WidgetGesture {
  tap,
  doubleTap,
  longPress,
  swipeLeft,
  swipeRight,
  swipeUp,
  swipeDown,
}

/// Widget configuration
class WidgetConfig {
  final WidgetSize size;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool showLabels;
  final bool showIcons;
  final Duration refreshInterval;
  final Map<WidgetGesture, VoidCallback>? gestures;

  const WidgetConfig({
    this.size = WidgetSize.medium,
    this.backgroundColor,
    this.foregroundColor,
    this.showLabels = true,
    this.showIcons = true,
    this.refreshInterval = const Duration(minutes: 5),
    this.gestures,
  });
}

/// Builder for creating wearable widgets
class WearableWidgetBuilder {
  final WidgetConfig config;
  final StreamController<WearableWidgetData> _dataController =
      StreamController<WearableWidgetData>.broadcast();
  
  Timer? _refreshTimer;

  WearableWidgetBuilder({
    this.config = const WidgetConfig(),
  }) {
    _startAutoRefresh();
  }

  // ============================================================================
  // Widget Factory Methods
  // ============================================================================

  Widget buildWidget(WearableWidgetData data) {
    switch (data.type) {
      case WearableWidgetType.habitTracker:
        return _buildHabitTrackerWidget(data);
      case WearableWidgetType.goalProgress:
        return _buildGoalProgressWidget(data);
      case WearableWidgetType.streakCounter:
        return _buildStreakCounterWidget(data);
      case WearableWidgetType.quickAction:
        return _buildQuickActionWidget(data);
      case WearableWidgetType.statistics:
        return _buildStatisticsWidget(data);
      case WearableWidgetType.timer:
        return _buildTimerWidget(data);
    }
  }

  // ============================================================================
  // Habit Tracker Widget
  // ============================================================================

  Widget _buildHabitTrackerWidget(WearableWidgetData data) {
    final habits = data.value as List<Map<String, dynamic>>? ?? [];
    final completedCount = habits.where((h) => h['completed'] == true).length;

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (config.showIcons)
            Icon(
              Icons.check_circle_outline,
              size: _getIconSize(),
              color: config.foregroundColor ?? Colors.green,
            ),
          const SizedBox(height: 8),
          Text(
            '$completedCount/${habits.length}',
            style: TextStyle(
              fontSize: _getTitleFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
            ),
          ),
          if (config.showLabels)
            Text(
              'Habits',
              style: TextStyle(
                fontSize: _getLabelFontSize(),
                color: config.foregroundColor?.withOpacity(0.7),
              ),
            ),
        ],
      ),
    );
  }

  // ============================================================================
  // Goal Progress Widget
  // ============================================================================

  Widget _buildGoalProgressWidget(WearableWidgetData data) {
    final progress = (data.value as num?)?.toDouble() ?? 0.0;
    final target = (data.metadata?['target'] as num?)?.toDouble() ?? 100.0;
    final percentage = (progress / target * 100).clamp(0, 100);

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: _getProgressSize(),
            height: _getProgressSize(),
            child: CircularProgressIndicator(
              value: percentage / 100,
              strokeWidth: 8,
              backgroundColor: Colors.grey.withOpacity(0.2),
              valueColor: AlwaysStoppedAnimation<Color>(
                config.foregroundColor ?? Colors.blue,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${percentage.toInt()}%',
            style: TextStyle(
              fontSize: _getTitleFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
            ),
          ),
          if (config.showLabels)
            Text(
              data.title,
              style: TextStyle(
                fontSize: _getLabelFontSize(),
                color: config.foregroundColor?.withOpacity(0.7),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
        ],
      ),
    );
  }

  // ============================================================================
  // Streak Counter Widget
  // ============================================================================

  Widget _buildStreakCounterWidget(WearableWidgetData data) {
    final streak = (data.value as int?) ?? 0;
    final icon = data.metadata?['icon'] as String? ?? '🔥';

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            icon,
            style: TextStyle(fontSize: _getIconSize()),
          ),
          const SizedBox(height: 8),
          Text(
            '$streak',
            style: TextStyle(
              fontSize: _getTitleFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
            ),
          ),
          if (config.showLabels)
            Text(
              'Day Streak',
              style: TextStyle(
                fontSize: _getLabelFontSize(),
                color: config.foregroundColor?.withOpacity(0.7),
              ),
            ),
        ],
      ),
    );
  }

  // ============================================================================
  // Quick Action Widget
  // ============================================================================

  Widget _buildQuickActionWidget(WearableWidgetData data) {
    final action = data.metadata?['action'] as String? ?? 'Tap';
    final icon = data.metadata?['icon'] as IconData? ?? Icons.touch_app;

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: _getIconSize(),
            color: config.foregroundColor,
          ),
          const SizedBox(height: 8),
          Text(
            data.title,
            style: TextStyle(
              fontSize: _getTitleFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
            ),
            textAlign: TextAlign.center,
          ),
          if (config.showLabels)
            Text(
              action,
              style: TextStyle(
                fontSize: _getLabelFontSize(),
                color: config.foregroundColor?.withOpacity(0.7),
              ),
            ),
        ],
      ),
    );
  }

  // ============================================================================
  // Statistics Widget
  // ============================================================================

  Widget _buildStatisticsWidget(WearableWidgetData data) {
    final stats = data.value as Map<String, dynamic>? ?? {};

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            data.title,
            style: TextStyle(
              fontSize: _getLabelFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
            ),
          ),
          const SizedBox(height: 8),
          ...stats.entries.take(3).map((entry) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: TextStyle(
                        fontSize: _getLabelFontSize() * 0.8,
                        color: config.foregroundColor?.withOpacity(0.7),
                      ),
                    ),
                    Text(
                      '${entry.value}',
                      style: TextStyle(
                        fontSize: _getLabelFontSize() * 0.8,
                        fontWeight: FontWeight.bold,
                        color: config.foregroundColor,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  // ============================================================================
  // Timer Widget
  // ============================================================================

  Widget _buildTimerWidget(WearableWidgetData data) {
    final seconds = (data.value as int?) ?? 0;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    final isRunning = data.metadata?['running'] as bool? ?? false;

    return _WearableCard(
      config: config,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isRunning ? Icons.timer : Icons.timer_off,
            size: _getIconSize(),
            color: config.foregroundColor,
          ),
          const SizedBox(height: 8),
          Text(
            '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}',
            style: TextStyle(
              fontSize: _getTitleFontSize(),
              fontWeight: FontWeight.bold,
              color: config.foregroundColor,
              fontFeatures: [const FontFeature.tabularFigures()],
            ),
          ),
          if (config.showLabels)
            Text(
              isRunning ? 'Running' : 'Paused',
              style: TextStyle(
                fontSize: _getLabelFontSize(),
                color: config.foregroundColor?.withOpacity(0.7),
              ),
            ),
        ],
      ),
    );
  }

  // ============================================================================
  // Size Calculations
  // ============================================================================

  double _getIconSize() {
    switch (config.size) {
      case WidgetSize.small:
        return 24;
      case WidgetSize.medium:
        return 32;
      case WidgetSize.large:
        return 40;
      case WidgetSize.extraLarge:
        return 48;
    }
  }

  double _getTitleFontSize() {
    switch (config.size) {
      case WidgetSize.small:
        return 16;
      case WidgetSize.medium:
        return 20;
      case WidgetSize.large:
        return 24;
      case WidgetSize.extraLarge:
        return 28;
    }
  }

  double _getLabelFontSize() {
    switch (config.size) {
      case WidgetSize.small:
        return 10;
      case WidgetSize.medium:
        return 12;
      case WidgetSize.large:
        return 14;
      case WidgetSize.extraLarge:
        return 16;
    }
  }

  double _getProgressSize() {
    switch (config.size) {
      case WidgetSize.small:
        return 40;
      case WidgetSize.medium:
        return 60;
      case WidgetSize.large:
        return 80;
      case WidgetSize.extraLarge:
        return 100;
    }
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  void updateData(WearableWidgetData data) {
    _dataController.add(data);
  }

  Stream<WearableWidgetData> get dataStream => _dataController.stream;

  // ============================================================================
  // Auto Refresh
  // ============================================================================

  void _startAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(config.refreshInterval, (_) {
      // Trigger refresh callback if provided
    });
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  void dispose() {
    _refreshTimer?.cancel();
    _dataController.close();
  }
}

// ============================================================================
// Wearable Card Wrapper
// ============================================================================

class _WearableCard extends StatelessWidget {
  final WidgetConfig config;
  final Widget child;

  const _WearableCard({
    required this.config,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => config.gestures?[WidgetGesture.tap]?.call(),
      onDoubleTap: () => config.gestures?[WidgetGesture.doubleTap]?.call(),
      onLongPress: () => config.gestures?[WidgetGesture.longPress]?.call(),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: config.backgroundColor ?? Colors.grey[900],
          borderRadius: BorderRadius.circular(16),
        ),
        child: child,
      ),
    );
  }
}
