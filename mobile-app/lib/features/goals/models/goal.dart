import 'package:freezed_annotation/freezed_annotation.dart';

part 'goal.freezed.dart';
part 'goal.g.dart';

/// Simplified Goal model with basic CRUD operations
@freezed
class Goal with _$Goal {
  const factory Goal({
    required String id,
    required String title,
    String? description,
    String? category,
    DateTime? targetDate,
    @Default('active') String status, // active, completed, paused, cancelled
    @Default(0) int progress, // 0-100 percentage
    @Default(0) int priority, // 0 = low, 1 = medium, 2 = high
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default('pending') String syncStatus,
  }) = _Goal;

  factory Goal.fromJson(Map<String, dynamic> json) =>
      _$GoalFromJson(json);

  factory Goal.fromDatabase(Map<String, dynamic> map) {
    return Goal(
      id: map['id'] as String,
      title: map['title'] as String,
      description: map['description'] as String?,
      category: map['category'] as String?,
      targetDate: map['target_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['target_date'] as int)
          : null,
      status: map['status'] as String? ?? 'active',
      progress: map['progress'] as int? ?? 0,
      priority: map['priority'] as int? ?? 0,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
      updatedAt: map['updated_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int)
          : null,
      syncStatus: map['sync_status'] as String? ?? 'pending',
    );
  }
}

extension GoalExtension on Goal {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'target_date': targetDate?.millisecondsSinceEpoch,
      'status': status,
      'progress': progress,
      'priority': priority,
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt?.millisecondsSinceEpoch,
      'sync_status': syncStatus,
    };
  }

  String get priorityLabel {
    switch (priority) {
      case 2:
        return 'High';
      case 1:
        return 'Medium';
      default:
        return 'Low';
    }
  }

  bool get isOverdue {
    if (targetDate == null) return false;
    return DateTime.now().isAfter(targetDate!) && status != 'completed';
  }

  int get daysRemaining {
    if (targetDate == null) return -1;
    return targetDate!.difference(DateTime.now()).inDays;
  }
}

/// Simplified Goal Milestone model
@freezed
class GoalMilestone with _$GoalMilestone {
  const factory GoalMilestone({
    required String id,
    required String goalId,
    required String title,
    @Default(false) bool isCompleted,
    DateTime? completedAt,
  }) = _GoalMilestone;

  factory GoalMilestone.fromJson(Map<String, dynamic> json) =>
      _$GoalMilestoneFromJson(json);

  factory GoalMilestone.fromDatabase(Map<String, dynamic> map) {
    return GoalMilestone(
      id: map['id'] as String,
      goalId: map['goal_id'] as String,
      title: map['title'] as String,
      isCompleted: (map['is_completed'] as int? ?? 0) == 1,
      completedAt: map['completed_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['completed_at'] as int)
          : null,
    );
  }
}

extension GoalMilestoneExtension on GoalMilestone {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'goal_id': goalId,
      'title': title,
      'is_completed': isCompleted ? 1 : 0,
      'completed_at': completedAt?.millisecondsSinceEpoch,
    };
  }
}