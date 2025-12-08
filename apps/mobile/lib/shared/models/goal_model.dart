import 'package:equatable/equatable.dart';

enum GoalPriority {
  low,
  medium,
  high,
}

enum GoalStatus {
  active,
  paused,
  completed,
  cancelled,
}

enum GoalCategory {
  career,
  health,
  financial,
  personal,
  education,
  relationship,
  other,
}

class GoalModel extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final GoalCategory category;
  final GoalPriority priority;
  final GoalStatus status;
  final DateTime targetDate;
  final double progress; // 0.0 to 1.0
  final List<String> milestones;
  final List<String> completedMilestones;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? metadata;

  const GoalModel({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.targetDate,
    required this.progress,
    this.milestones = const [],
    this.completedMilestones = const [],
    required this.createdAt,
    required this.updatedAt,
    this.metadata,
  });

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    return GoalModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: GoalCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => GoalCategory.other,
      ),
      priority: GoalPriority.values.firstWhere(
        (e) => e.name == json['priority'],
        orElse: () => GoalPriority.medium,
      ),
      status: GoalStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => GoalStatus.active,
      ),
      targetDate: DateTime.parse(json['target_date'] as String),
      progress: (json['progress'] as num).toDouble(),
      milestones: (json['milestones'] as List<dynamic>?)?.cast<String>() ?? [],
      completedMilestones:
          (json['completed_milestones'] as List<dynamic>?)?.cast<String>() ??
              [],
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'description': description,
      'category': category.name,
      'priority': priority.name,
      'status': status.name,
      'target_date': targetDate.toIso8601String(),
      'progress': progress,
      'milestones': milestones,
      'completed_milestones': completedMilestones,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  GoalModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    GoalCategory? category,
    GoalPriority? priority,
    GoalStatus? status,
    DateTime? targetDate,
    double? progress,
    List<String>? milestones,
    List<String>? completedMilestones,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? metadata,
  }) {
    return GoalModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      targetDate: targetDate ?? this.targetDate,
      progress: progress ?? this.progress,
      milestones: milestones ?? this.milestones,
      completedMilestones: completedMilestones ?? this.completedMilestones,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      metadata: metadata ?? this.metadata,
    );
  }

  bool get isActive => status == GoalStatus.active;
  bool get isCompleted => status == GoalStatus.completed;
  bool get isPaused => status == GoalStatus.paused;
  bool get isCancelled => status == GoalStatus.cancelled;

  int get daysRemaining {
    final now = DateTime.now();
    return targetDate.difference(now).inDays;
  }

  bool get isOverdue {
    return DateTime.now().isAfter(targetDate) && !isCompleted;
  }

  int get totalMilestones => milestones.length;
  int get completedMilestonesCount => completedMilestones.length;

  double get milestoneProgress {
    if (totalMilestones == 0) return 0.0;
    return completedMilestonesCount / totalMilestones;
  }

  String get categoryLabel {
    switch (category) {
      case GoalCategory.career:
        return 'Career';
      case GoalCategory.health:
        return 'Health';
      case GoalCategory.financial:
        return 'Financial';
      case GoalCategory.personal:
        return 'Personal';
      case GoalCategory.education:
        return 'Education';
      case GoalCategory.relationship:
        return 'Relationship';
      case GoalCategory.other:
        return 'Other';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case GoalPriority.low:
        return 'Low';
      case GoalPriority.medium:
        return 'Medium';
      case GoalPriority.high:
        return 'High';
    }
  }

  String get statusLabel {
    switch (status) {
      case GoalStatus.active:
        return 'Active';
      case GoalStatus.paused:
        return 'Paused';
      case GoalStatus.completed:
        return 'Completed';
      case GoalStatus.cancelled:
        return 'Cancelled';
    }
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        description,
        category,
        priority,
        status,
        targetDate,
        progress,
        milestones,
        completedMilestones,
        createdAt,
        updatedAt,
        metadata,
      ];
}
