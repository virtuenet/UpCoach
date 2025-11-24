class ProgressHighlight {
  ProgressHighlight({
    required this.id,
    required this.sentiment,
    required this.title,
    required this.summary,
    required this.metricLabel,
    required this.metricValue,
    required this.sharePrompt,
    required this.createdAt,
  });

  final String id;
  final String sentiment;
  final String title;
  final String summary;
  final String metricLabel;
  final String metricValue;
  final String sharePrompt;
  final DateTime createdAt;

  factory ProgressHighlight.fromJson(Map<String, dynamic> json) {
    return ProgressHighlight(
      id: json['id'] as String? ?? '',
      sentiment: json['sentiment'] as String? ?? 'momentum',
      title: json['title'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      metricLabel: json['metricLabel'] as String? ?? '',
      metricValue: json['metricValue'] as String? ?? '',
      sharePrompt: json['sharePrompt'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

