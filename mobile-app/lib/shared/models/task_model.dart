import 'package:equatable/equatable.dart';

enum TaskPriority {
  low,
  medium,
  high,
  urgent,
}

enum TaskStatus {
  pending,
  inProgress,
  completed,
  cancelled,
}

enum TaskCategory {
  personal,
  work,
  health,
  finance,
  education,
  other,
}

class TaskModel extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final TaskPriority priority;
  final TaskStatus status;
  final TaskCategory category;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? metadata;

  const TaskModel({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.priority,
    required this.status,
    required this.category,
    this.dueDate,
    this.completedAt,
    this.tags = const [],
    required this.createdAt,
    required this.updatedAt,
    this.metadata,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: TaskPriority.values.firstWhere(
        (e) => e.name == json['priority'],
        orElse: () => TaskPriority.medium,
      ),
      status: TaskStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TaskStatus.pending,
      ),
      category: TaskCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => TaskCategory.other,
      ),
      dueDate: json['due_date'] != null 
          ? DateTime.parse(json['due_date'] as String) 
          : null,
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at'] as String) 
          : null,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
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
      'priority': priority.name,
      'status': status.name,
      'category': category.name,
      'due_date': dueDate?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'tags': tags,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  TaskModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    TaskPriority? priority,
    TaskStatus? status,
    TaskCategory? category,
    DateTime? dueDate,
    DateTime? completedAt,
    List<String>? tags,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? metadata,
  }) {
    return TaskModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      category: category ?? this.category,
      dueDate: dueDate ?? this.dueDate,
      completedAt: completedAt ?? this.completedAt,
      tags: tags ?? this.tags,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      metadata: metadata ?? this.metadata,
    );
  }

  bool get isCompleted => status == TaskStatus.completed;
  bool get isPending => status == TaskStatus.pending;
  bool get isInProgress => status == TaskStatus.inProgress;
  bool get isCancelled => status == TaskStatus.cancelled;
  
  bool get isOverdue {
    if (dueDate == null || isCompleted || isCancelled) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  bool get isDueToday {
    if (dueDate == null) return false;
    final now = DateTime.now();
    return dueDate!.year == now.year && 
           dueDate!.month == now.month && 
           dueDate!.day == now.day;
  }

  bool get isDueTomorrow {
    if (dueDate == null) return false;
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return dueDate!.year == tomorrow.year && 
           dueDate!.month == tomorrow.month && 
           dueDate!.day == tomorrow.day;
  }

  String get priorityLabel {
    switch (priority) {
      case TaskPriority.low:
        return 'Low';
      case TaskPriority.medium:
        return 'Medium';
      case TaskPriority.high:
        return 'High';
      case TaskPriority.urgent:
        return 'Urgent';
    }
  }

  String get categoryLabel {
    switch (category) {
      case TaskCategory.personal:
        return 'Personal';
      case TaskCategory.work:
        return 'Work';
      case TaskCategory.health:
        return 'Health';
      case TaskCategory.finance:
        return 'Finance';
      case TaskCategory.education:
        return 'Education';
      case TaskCategory.other:
        return 'Other';
    }
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        description,
        priority,
        status,
        category,
        dueDate,
        completedAt,
        tags,
        createdAt,
        updatedAt,
        metadata,
      ];
} 