import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../models/task_model.dart';

class TaskListTile extends StatelessWidget {
  final TaskModel task;
  final VoidCallback? onTap;
  final VoidCallback? onToggleComplete;
  final VoidCallback? onDelete;

  const TaskListTile({
    super.key,
    required this.task,
    this.onTap,
    this.onToggleComplete,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(task.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppTheme.errorColor,
        child: const Icon(
          Icons.delete,
          color: Colors.white,
        ),
      ),
      confirmDismiss: (direction) async {
        return await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Delete Task'),
            content: Text('Are you sure you want to delete "${task.title}"?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Delete'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                ),
              ),
            ],
          ),
        );
      },
      onDismissed: (direction) => onDelete?.call(),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        elevation: task.isCompleted ? 0 : 2,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Row(
              children: [
                // Checkbox
                InkWell(
                  onTap: onToggleComplete,
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: task.isCompleted 
                            ? AppTheme.successColor 
                            : _getPriorityColor(task.priority),
                        width: 2,
                      ),
                      color: task.isCompleted 
                          ? AppTheme.successColor 
                          : Colors.transparent,
                    ),
                    child: task.isCompleted
                        ? const Icon(
                            Icons.check,
                            size: 16,
                            color: Colors.white,
                          )
                        : null,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                
                // Task details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          decoration: task.isCompleted 
                              ? TextDecoration.lineThrough 
                              : null,
                          color: task.isCompleted 
                              ? AppTheme.textSecondary 
                              : AppTheme.textPrimary,
                        ),
                      ),
                      
                      if (task.description != null) ...[
                        const SizedBox(height: UIConstants.spacingXS),
                        Text(
                          task.description!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                            decoration: task.isCompleted 
                                ? TextDecoration.lineThrough 
                                : null,
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: UIConstants.spacingSM),
                      
                      // Task metadata
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          // Category chip
                          _buildChip(
                            label: task.categoryLabel,
                            icon: _getCategoryIcon(task.category),
                            color: _getCategoryColor(task.category),
                          ),
                          
                          // Priority chip (only if not completed)
                          if (!task.isCompleted)
                            _buildChip(
                              label: task.priorityLabel,
                              color: _getPriorityColor(task.priority),
                            ),
                          
                          // Due date chip
                          if (task.dueDate != null)
                            _buildChip(
                              label: _formatDueDate(task.dueDate!),
                              icon: Icons.calendar_today,
                              color: _getDueDateColor(task),
                            ),
                          
                          // Tags
                          ...task.tags.map((tag) => _buildChip(
                            label: tag,
                            color: AppTheme.primaryColor.withOpacity(0.7),
                          )),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Chevron
                const Icon(
                  Icons.chevron_right,
                  color: AppTheme.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChip({
    required String label,
    IconData? icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: UIConstants.spacingXS),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.low:
        return Colors.grey;
      case TaskPriority.medium:
        return Colors.blue;
      case TaskPriority.high:
        return Colors.orange;
      case TaskPriority.urgent:
        return AppTheme.errorColor;
    }
  }

  Color _getCategoryColor(TaskCategory category) {
    switch (category) {
      case TaskCategory.personal:
        return Colors.purple;
      case TaskCategory.work:
        return Colors.blue;
      case TaskCategory.health:
        return Colors.green;
      case TaskCategory.finance:
        return Colors.amber;
      case TaskCategory.education:
        return Colors.indigo;
      case TaskCategory.other:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(TaskCategory category) {
    switch (category) {
      case TaskCategory.personal:
        return Icons.person;
      case TaskCategory.work:
        return Icons.work;
      case TaskCategory.health:
        return Icons.favorite;
      case TaskCategory.finance:
        return Icons.attach_money;
      case TaskCategory.education:
        return Icons.school;
      case TaskCategory.other:
        return Icons.category;
    }
  }

  Color _getDueDateColor(TaskModel task) {
    if (task.isCompleted) return AppTheme.textSecondary;
    if (task.isOverdue) return AppTheme.errorColor;
    if (task.isDueToday) return AppTheme.warningColor;
    if (task.isDueTomorrow) return AppTheme.infoColor;
    return AppTheme.textSecondary;
  }

  String _formatDueDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    
    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      return 'Tomorrow';
    } else if (dateOnly == today.subtract(const Duration(days: 1))) {
      return 'Yesterday';
    } else if (dateOnly.isBefore(today)) {
      return 'Overdue';
    } else {
      return DateFormat('MMM d').format(date);
    }
  }
} 