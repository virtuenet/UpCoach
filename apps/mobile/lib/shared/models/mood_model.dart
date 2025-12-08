import 'package:equatable/equatable.dart';

enum MoodLevel {
  veryBad,
  bad,
  neutral,
  good,
  veryGood,
}

enum MoodCategory {
  happy,
  sad,
  angry,
  anxious,
  excited,
  calm,
  stressed,
  energetic,
  tired,
  grateful,
  frustrated,
  confident,
  lonely,
  content,
  overwhelmed,
}

class MoodModel extends Equatable {
  final String id;
  final String userId;
  final MoodLevel level;
  final List<MoodCategory> categories;
  final String? note;
  final List<String> activities;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  const MoodModel({
    required this.id,
    required this.userId,
    required this.level,
    this.categories = const [],
    this.note,
    this.activities = const [],
    required this.timestamp,
    this.metadata,
  });

  factory MoodModel.fromJson(Map<String, dynamic> json) {
    return MoodModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      level: MoodLevel.values.firstWhere(
        (e) => e.name == json['level'],
        orElse: () => MoodLevel.neutral,
      ),
      categories: (json['categories'] as List<dynamic>?)
              ?.map((c) => MoodCategory.values.firstWhere(
                    (e) => e.name == c,
                    orElse: () => MoodCategory.content,
                  ))
              .toList() ??
          [],
      note: json['note'] as String?,
      activities: (json['activities'] as List<dynamic>?)?.cast<String>() ?? [],
      timestamp: DateTime.parse(json['timestamp'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'level': level.name,
      'categories': categories.map((c) => c.name).toList(),
      'note': note,
      'activities': activities,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }

  MoodModel copyWith({
    String? id,
    String? userId,
    MoodLevel? level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
    DateTime? timestamp,
    Map<String, dynamic>? metadata,
  }) {
    return MoodModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      level: level ?? this.level,
      categories: categories ?? this.categories,
      note: note ?? this.note,
      activities: activities ?? this.activities,
      timestamp: timestamp ?? this.timestamp,
      metadata: metadata ?? this.metadata,
    );
  }

  String get levelEmoji {
    switch (level) {
      case MoodLevel.veryBad:
        return '😢';
      case MoodLevel.bad:
        return '😕';
      case MoodLevel.neutral:
        return '😐';
      case MoodLevel.good:
        return '🙂';
      case MoodLevel.veryGood:
        return '😄';
    }
  }

  String get levelLabel {
    switch (level) {
      case MoodLevel.veryBad:
        return 'Very Bad';
      case MoodLevel.bad:
        return 'Bad';
      case MoodLevel.neutral:
        return 'Neutral';
      case MoodLevel.good:
        return 'Good';
      case MoodLevel.veryGood:
        return 'Very Good';
    }
  }

  static String getCategoryLabel(MoodCategory category) {
    switch (category) {
      case MoodCategory.happy:
        return 'Happy';
      case MoodCategory.sad:
        return 'Sad';
      case MoodCategory.angry:
        return 'Angry';
      case MoodCategory.anxious:
        return 'Anxious';
      case MoodCategory.excited:
        return 'Excited';
      case MoodCategory.calm:
        return 'Calm';
      case MoodCategory.stressed:
        return 'Stressed';
      case MoodCategory.energetic:
        return 'Energetic';
      case MoodCategory.tired:
        return 'Tired';
      case MoodCategory.grateful:
        return 'Grateful';
      case MoodCategory.frustrated:
        return 'Frustrated';
      case MoodCategory.confident:
        return 'Confident';
      case MoodCategory.lonely:
        return 'Lonely';
      case MoodCategory.content:
        return 'Content';
      case MoodCategory.overwhelmed:
        return 'Overwhelmed';
    }
  }

  static String getCategoryEmoji(MoodCategory category) {
    switch (category) {
      case MoodCategory.happy:
        return '😊';
      case MoodCategory.sad:
        return '😢';
      case MoodCategory.angry:
        return '😠';
      case MoodCategory.anxious:
        return '😰';
      case MoodCategory.excited:
        return '🤗';
      case MoodCategory.calm:
        return '😌';
      case MoodCategory.stressed:
        return '😫';
      case MoodCategory.energetic:
        return '⚡';
      case MoodCategory.tired:
        return '😴';
      case MoodCategory.grateful:
        return '🙏';
      case MoodCategory.frustrated:
        return '😤';
      case MoodCategory.confident:
        return '💪';
      case MoodCategory.lonely:
        return '😔';
      case MoodCategory.content:
        return '☺️';
      case MoodCategory.overwhelmed:
        return '🤯';
    }
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        level,
        categories,
        note,
        activities,
        timestamp,
        metadata,
      ];
}
