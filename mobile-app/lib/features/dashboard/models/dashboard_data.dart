import 'package:json_annotation/json_annotation.dart';

part 'dashboard_data.g.dart';

@JsonSerializable()
class DashboardData {
  final String id;
  final String userId;
  final Map<String, dynamic> metrics;
  final DashboardSummary summary;
  final List<DashboardWidget> widgets;
  final DateTime timestamp;
  final DateTime lastUpdated;

  DashboardData({
    required this.id,
    required this.userId,
    required this.metrics,
    required this.summary,
    required this.widgets,
    required this.timestamp,
    required this.lastUpdated,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) =>
      _$DashboardDataFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardDataToJson(this);

  DashboardData copyWith({
    String? id,
    String? userId,
    Map<String, dynamic>? metrics,
    DashboardSummary? summary,
    List<DashboardWidget>? widgets,
    DateTime? timestamp,
    DateTime? lastUpdated,
  }) {
    return DashboardData(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      metrics: metrics ?? this.metrics,
      summary: summary ?? this.summary,
      widgets: widgets ?? this.widgets,
      timestamp: timestamp ?? this.timestamp,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

@JsonSerializable()
class DashboardSummary {
  final int totalHabits;
  final int completedToday;
  final double completionRate;
  final int currentStreak;
  final int longestStreak;
  final int totalPoints;
  final String level;
  final double progressToNextLevel;

  DashboardSummary({
    required this.totalHabits,
    required this.completedToday,
    required this.completionRate,
    required this.currentStreak,
    required this.longestStreak,
    required this.totalPoints,
    required this.level,
    required this.progressToNextLevel,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      _$DashboardSummaryFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardSummaryToJson(this);
}

@JsonSerializable()
class DashboardWidget {
  final String id;
  final String type;
  final String title;
  final Map<String, dynamic> data;
  final DashboardWidgetConfig config;
  final int position;
  final bool isVisible;

  DashboardWidget({
    required this.id,
    required this.type,
    required this.title,
    required this.data,
    required this.config,
    required this.position,
    required this.isVisible,
  });

  factory DashboardWidget.fromJson(Map<String, dynamic> json) =>
      _$DashboardWidgetFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardWidgetToJson(this);
}

@JsonSerializable()
class DashboardWidgetConfig {
  final String size;
  final String color;
  final bool showHeader;
  final bool allowRefresh;
  final int refreshInterval;

  DashboardWidgetConfig({
    required this.size,
    required this.color,
    required this.showHeader,
    required this.allowRefresh,
    required this.refreshInterval,
  });

  factory DashboardWidgetConfig.fromJson(Map<String, dynamic> json) =>
      _$DashboardWidgetConfigFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardWidgetConfigToJson(this);
}