class DailyPulseAction {
  DailyPulseAction({
    required this.title,
    required this.description,
    required this.category,
    required this.timeframe,
  });

  final String title;
  final String description;
  final String category;
  final String timeframe;

  factory DailyPulseAction.fromJson(Map<String, dynamic> json) {
    return DailyPulseAction(
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'general',
      timeframe: json['timeframe'] as String? ?? 'today',
    );
  }
}

class DailyPulse {
  DailyPulse({
    required this.id,
    required this.period,
    required this.generatedAt,
    required this.headline,
    required this.summary,
    required this.encouragement,
    this.gratitudePrompt,
    required this.metrics,
    required this.recommendedActions,
  });

  final String id;
  final String period;
  final DateTime generatedAt;
  final String headline;
  final String summary;
  final String encouragement;
  final String? gratitudePrompt;
  final Map<String, dynamic> metrics;
  final List<DailyPulseAction> recommendedActions;

  factory DailyPulse.fromJson(Map<String, dynamic> json) {
    return DailyPulse(
      id: json['id'] as String? ?? '',
      period: json['period'] as String? ?? 'morning',
      generatedAt: DateTime.tryParse(json['generatedAt'] as String? ?? '') ??
          DateTime.now(),
      headline: json['headline'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      encouragement: json['encouragement'] as String? ?? '',
      gratitudePrompt: json['gratitudePrompt'] as String?,
      metrics: (json['metrics'] as Map<String, dynamic>?) ?? const {},
      recommendedActions: (json['recommendedActions'] as List<dynamic>? ?? [])
          .map((action) =>
              DailyPulseAction.fromJson(action as Map<String, dynamic>))
          .toList(),
    );
  }
}
