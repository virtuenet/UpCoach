import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';

import '../../../shared/models/habit_model.dart';

class HabitCard extends StatelessWidget {
  final Habit habit;
  final List<HabitCompletion> completions;
  final VoidCallback? onTap;
  final VoidCallback? onToggle;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const HabitCard({
    super.key,
    required this.habit,
    required this.completions,
    this.onTap,
    this.onToggle,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final progress = habit.getProgressForDate(today, completions);
    final isCompleted = progress >= 1.0;
    final streakText =
        habit.currentStreak > 0 ? '🔥 ${habit.currentStreak}' : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  // Icon with background
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Color(int.parse('0xFF${habit.color.substring(1)}'))
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                    ),
                    child: Center(
                      child: Text(
                        habit.icon,
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                  ),

                  const SizedBox(width: UIConstants.spacingMD),

                  // Habit info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                habit.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (streakText.isNotEmpty) ...[
                              const SizedBox(width: UIConstants.spacingSM),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.orange.shade100,
                                  borderRadius: BorderRadius.circular(
                                      UIConstants.radiusLG),
                                ),
                                child: Text(
                                  streakText,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange.shade700,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: UIConstants.spacingXS),
                        Row(
                          children: [
                            Text(
                              habit.frequencyDescription,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(width: UIConstants.spacingSM),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _getCategoryColor(habit.category)
                                    .withValues(alpha: 0.2),
                                borderRadius:
                                    BorderRadius.circular(UIConstants.radiusMD),
                              ),
                              child: Text(
                                _getCategoryName(habit.category),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _getCategoryColor(habit.category),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // More options
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'toggle':
                          onToggle?.call();
                          break;
                        case 'edit':
                          onEdit?.call();
                          break;
                        case 'delete':
                          onDelete?.call();
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'toggle',
                        child: Row(
                          children: [
                            Icon(habit.isActive
                                ? Icons.pause
                                : Icons.play_arrow),
                            const SizedBox(width: UIConstants.spacingSM),
                            Text(habit.isActive ? 'Pause' : 'Resume'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit),
                            SizedBox(width: UIConstants.spacingSM),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, color: Colors.red),
                            SizedBox(width: UIConstants.spacingSM),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: UIConstants.spacingMD),

              // Progress indicator
              if (habit.type != HabitType.simple) ...[
                Row(
                  children: [
                    Expanded(
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color(int.parse('0xFF${habit.color.substring(1)}')),
                        ),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(width: UIConstants.spacingMD),
                    Text(
                      _getProgressText(habit, completions, today),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: UIConstants.spacingSM),
              ],

              // Description (if available)
              if (habit.description.isNotEmpty) ...[
                Text(
                  habit.description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: UIConstants.spacingSM),
              ],

              // Action buttons
              Row(
                children: [
                  // Activity status
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: habit.isActive
                          ? Colors.green.shade100
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          habit.isActive
                              ? Icons.check_circle
                              : Icons.pause_circle,
                          size: 16,
                          color: habit.isActive
                              ? Colors.green.shade700
                              : Colors.grey.shade600,
                        ),
                        const SizedBox(width: UIConstants.spacingXS),
                        Text(
                          habit.isActive ? 'Active' : 'Paused',
                          style: TextStyle(
                            fontSize: 12,
                            color: habit.isActive
                                ? Colors.green.shade700
                                : Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // Completion status for today
                  if (habit.isScheduledForDate(today)) ...[
                    if (isCompleted)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.shade100,
                          borderRadius:
                              BorderRadius.circular(UIConstants.radiusXL),
                          border: Border.all(color: Colors.green.shade300),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.check_circle,
                              size: 16,
                              color: Colors.green.shade700,
                            ),
                            const SizedBox(width: UIConstants.spacingXS),
                            Text(
                              'Completed',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ElevatedButton.icon(
                        onPressed: () => _showCompletionDialog(context),
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Complete'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(
                              int.parse('0xFF${habit.color.substring(1)}')),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                  ] else
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius:
                            BorderRadius.circular(UIConstants.radiusMD),
                      ),
                      child: Text(
                        'Not today',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCompletionDialog(BuildContext context) {
    if (habit.type == HabitType.simple) {
      // Simple completion - just complete it
      _completeHabit(context, 1, '', null);
      return;
    }

    // Show dialog for other types
    showDialog(
      context: context,
      builder: (context) => _CompletionDialog(
        habit: habit,
        onComplete: (value, notes, duration) {
          _completeHabit(context, value, notes, duration);
        },
      ),
    );
  }

  void _completeHabit(
      BuildContext context, int value, String notes, int? duration) {
    // This would typically call a callback to the parent widget
    // For now, show a success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${habit.name} completed!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  String _getProgressText(
      Habit habit, List<HabitCompletion> completions, DateTime date) {
    final dayCompletions = completions.where((c) {
      final completedDate = c.completedAt;
      return c.habitId == habit.id &&
          completedDate.year == date.year &&
          completedDate.month == date.month &&
          completedDate.day == date.day;
    }).toList();

    if (dayCompletions.isEmpty) {
      return '0/${habit.targetValue} ${habit.unit}';
    }

    switch (habit.type) {
      case HabitType.simple:
        return dayCompletions.isNotEmpty ? 'Done' : 'Pending';
      case HabitType.count:
      case HabitType.value:
        final totalValue =
            dayCompletions.fold<int>(0, (sum, c) => sum + c.value);
        return '$totalValue/${habit.targetValue} ${habit.unit}';
      case HabitType.time:
        final totalDuration =
            dayCompletions.fold<int>(0, (sum, c) => sum + (c.duration ?? 0));
        return '$totalDuration/${habit.targetValue} min';
    }
  }

  Color _getCategoryColor(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return Colors.green;
      case HabitCategory.fitness:
        return Colors.orange;
      case HabitCategory.productivity:
        return Colors.blue;
      case HabitCategory.mindfulness:
        return Colors.purple;
      case HabitCategory.learning:
        return Colors.teal;
      case HabitCategory.social:
        return Colors.pink;
      case HabitCategory.creative:
        return Colors.amber;
      case HabitCategory.financial:
        return Colors.indigo;
      case HabitCategory.other:
        return Colors.grey;
    }
  }

  String _getCategoryName(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return 'Health';
      case HabitCategory.fitness:
        return 'Fitness';
      case HabitCategory.productivity:
        return 'Productivity';
      case HabitCategory.mindfulness:
        return 'Mindfulness';
      case HabitCategory.learning:
        return 'Learning';
      case HabitCategory.social:
        return 'Social';
      case HabitCategory.creative:
        return 'Creative';
      case HabitCategory.financial:
        return 'Financial';
      case HabitCategory.other:
        return 'Other';
    }
  }
}

class _CompletionDialog extends StatefulWidget {
  final Habit habit;
  final Function(int value, String notes, int? duration) onComplete;

  const _CompletionDialog({
    required this.habit,
    required this.onComplete,
  });

  @override
  _CompletionDialogState createState() => _CompletionDialogState();
}

class _CompletionDialogState extends State<_CompletionDialog> {
  late final TextEditingController _valueController;
  late final TextEditingController _notesController;
  late final TextEditingController _durationController;

  @override
  void initState() {
    super.initState();
    _valueController =
        TextEditingController(text: widget.habit.targetValue.toString());
    _notesController = TextEditingController();
    _durationController =
        TextEditingController(text: widget.habit.targetValue.toString());
  }

  @override
  void dispose() {
    _valueController.dispose();
    _notesController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Complete ${widget.habit.name}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.habit.type == HabitType.count ||
              widget.habit.type == HabitType.value)
            TextField(
              controller: _valueController,
              decoration: InputDecoration(
                labelText:
                    widget.habit.type == HabitType.count ? 'Count' : 'Value',
                suffixText: widget.habit.unit,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
          if (widget.habit.type == HabitType.time) ...[
            TextField(
              controller: _durationController,
              decoration: const InputDecoration(
                labelText: 'Duration',
                suffixText: 'minutes',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: UIConstants.spacingMD),
          ],
          const SizedBox(height: UIConstants.spacingMD),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Notes (Optional)',
              hintText: 'How did it go?',
              border: OutlineInputBorder(),
            ),
            maxLines: 2,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _complete,
          child: const Text('Complete'),
        ),
      ],
    );
  }

  void _complete() {
    int value = 1;
    int? duration;

    if (widget.habit.type == HabitType.count ||
        widget.habit.type == HabitType.value) {
      value = int.tryParse(_valueController.text) ?? 1;
    }

    if (widget.habit.type == HabitType.time) {
      duration =
          int.tryParse(_durationController.text) ?? widget.habit.targetValue;
    }

    widget.onComplete(value, _notesController.text, duration);
    context.pop();
  }
}
