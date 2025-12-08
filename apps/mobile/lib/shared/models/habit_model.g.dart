// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'habit_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$HabitImpl _$$HabitImplFromJson(Map<String, dynamic> json) => _$HabitImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      type: $enumDecodeNullable(_$HabitTypeEnumMap, json['type']) ??
          HabitType.simple,
      frequency:
          $enumDecodeNullable(_$HabitFrequencyEnumMap, json['frequency']) ??
              HabitFrequency.daily,
      category: $enumDecodeNullable(_$HabitCategoryEnumMap, json['category']) ??
          HabitCategory.other,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const [],
      icon: json['icon'] as String? ?? '',
      color: json['color'] as String? ?? '#4A90E2',
      targetValue: (json['targetValue'] as num?)?.toInt() ?? 1,
      unit: json['unit'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      isActive: json['isActive'] as bool? ?? true,
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      totalCompletions: (json['totalCompletions'] as num?)?.toInt() ?? 0,
      weekdays: (json['weekdays'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList() ??
          const [],
      customInterval: (json['customInterval'] as num?)?.toInt(),
      lastCompletedAt: json['lastCompletedAt'] == null
          ? null
          : DateTime.parse(json['lastCompletedAt'] as String),
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      hasReminder: json['hasReminder'] as bool? ?? false,
      reminderTime: json['reminderTime'] == null
          ? null
          : DateTime.parse(json['reminderTime'] as String),
      reminderMessage: json['reminderMessage'] as String? ?? '',
    );

Map<String, dynamic> _$$HabitImplToJson(_$HabitImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'type': _$HabitTypeEnumMap[instance.type]!,
      'frequency': _$HabitFrequencyEnumMap[instance.frequency]!,
      'category': _$HabitCategoryEnumMap[instance.category]!,
      'tags': instance.tags,
      'icon': instance.icon,
      'color': instance.color,
      'targetValue': instance.targetValue,
      'unit': instance.unit,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'isActive': instance.isActive,
      'currentStreak': instance.currentStreak,
      'longestStreak': instance.longestStreak,
      'totalCompletions': instance.totalCompletions,
      'weekdays': instance.weekdays,
      'customInterval': instance.customInterval,
      'lastCompletedAt': instance.lastCompletedAt?.toIso8601String(),
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'hasReminder': instance.hasReminder,
      'reminderTime': instance.reminderTime?.toIso8601String(),
      'reminderMessage': instance.reminderMessage,
    };

const _$HabitTypeEnumMap = {
  HabitType.simple: 'simple',
  HabitType.count: 'count',
  HabitType.time: 'time',
  HabitType.value: 'value',
};

const _$HabitFrequencyEnumMap = {
  HabitFrequency.daily: 'daily',
  HabitFrequency.weekly: 'weekly',
  HabitFrequency.monthly: 'monthly',
  HabitFrequency.custom: 'custom',
};

const _$HabitCategoryEnumMap = {
  HabitCategory.health: 'health',
  HabitCategory.fitness: 'fitness',
  HabitCategory.productivity: 'productivity',
  HabitCategory.mindfulness: 'mindfulness',
  HabitCategory.learning: 'learning',
  HabitCategory.social: 'social',
  HabitCategory.creative: 'creative',
  HabitCategory.financial: 'financial',
  HabitCategory.other: 'other',
};

_$HabitCompletionImpl _$$HabitCompletionImplFromJson(
        Map<String, dynamic> json) =>
    _$HabitCompletionImpl(
      id: json['id'] as String,
      habitId: json['habitId'] as String,
      completedAt: DateTime.parse(json['completedAt'] as String),
      value: (json['value'] as num?)?.toInt() ?? 1,
      notes: json['notes'] as String? ?? '',
      duration: (json['duration'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$HabitCompletionImplToJson(
        _$HabitCompletionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'habitId': instance.habitId,
      'completedAt': instance.completedAt.toIso8601String(),
      'value': instance.value,
      'notes': instance.notes,
      'duration': instance.duration,
      'createdAt': instance.createdAt.toIso8601String(),
    };

_$HabitStreakImpl _$$HabitStreakImplFromJson(Map<String, dynamic> json) =>
    _$HabitStreakImpl(
      id: json['id'] as String,
      habitId: json['habitId'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      length: (json['length'] as num?)?.toInt() ?? 1,
      isActive: json['isActive'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$HabitStreakImplToJson(_$HabitStreakImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'habitId': instance.habitId,
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'length': instance.length,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
    };

_$HabitAchievementImpl _$$HabitAchievementImplFromJson(
        Map<String, dynamic> json) =>
    _$HabitAchievementImpl(
      id: json['id'] as String,
      habitId: json['habitId'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      threshold: (json['threshold'] as num).toInt(),
      unlockedAt: DateTime.parse(json['unlockedAt'] as String),
      icon: json['icon'] as String? ?? '',
      isShown: json['isShown'] as bool? ?? false,
    );

Map<String, dynamic> _$$HabitAchievementImplToJson(
        _$HabitAchievementImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'habitId': instance.habitId,
      'type': instance.type,
      'title': instance.title,
      'description': instance.description,
      'threshold': instance.threshold,
      'unlockedAt': instance.unlockedAt.toIso8601String(),
      'icon': instance.icon,
      'isShown': instance.isShown,
    };
