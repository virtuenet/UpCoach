import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/habit_model.dart';

class DailyHabitsView extends StatelessWidget {
  final List<Habit> habits;
  final List<HabitCompletion> completions;
  final Function(String habitId, int value, String notes, int? duration) onHabitComplete;
  final Function(String habitId) onHabitUndo;

  const DailyHabitsView({
    super.key,
    required this.habits,
    required this.completions,
    required this.onHabitComplete,
    required this.onHabitUndo,
  });

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final todayHabits = habits.where((h) => h.isActive && h.isScheduledForDate(today)).toList();
    
    if (todayHabits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wb_sunny_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'No habits for today',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Take a well-deserved break or add some habits!',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final completedHabits = todayHabits.where((habit) => 
      habit.getProgressForDate(today, completions) >= 1.0).length;
    
    final totalHabits = todayHabits.length;
    final completionRate = totalHabits > 0 ? completedHabits / totalHabits : 0.0;

    return Column(
      children: [
        // Progress Header
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            children: [
              Text(
                'Today\'s Progress',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              
              // Circular Progress
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 120,
                    height: 120,
                    child: CircularProgressIndicator(
                      value: completionRate,
                      strokeWidth: 8,
                      backgroundColor: Colors.white.withOpacity(0.3),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${(completionRate * 100).round()}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '$completedHabits of $totalHabits',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              Text(
                _getMotivationalMessage(completionRate),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),

        // Habits List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: todayHabits.length,
            itemBuilder: (context, index) {
              final habit = todayHabits[index];
              return _DailyHabitCard(
                habit: habit,
                completions: completions,
                onComplete: onHabitComplete,
                onUndo: onHabitUndo,
              );
            },
          ),
        ),
      ],
    );
  }

  String _getMotivationalMessage(double completionRate) {
    if (completionRate == 1.0) {
      return '🎉 Perfect day! You\'re on fire!';
    } else if (completionRate >= 0.8) {
      return '🌟 Almost there! Keep pushing!';
    } else if (completionRate >= 0.5) {
      return '💪 You\'re doing great! Keep going!';
    } else if (completionRate > 0) {
      return '🚀 Good start! Every step counts!';
    } else {
      return '🌅 New day, new opportunities!';
    }
  }
}

class _DailyHabitCard extends StatelessWidget {
  final Habit habit;
  final List<HabitCompletion> completions;
  final Function(String habitId, int value, String notes, int? duration) onComplete;
  final Function(String habitId) onUndo;

  const _DailyHabitCard({
    required this.habit,
    required this.completions,
    required this.onComplete,
    required this.onUndo,
  });

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final progress = habit.getProgressForDate(today, completions);
    final isCompleted = progress >= 1.0;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                // Icon
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: Color(int.parse('0xFF${habit.color.substring(1)}')).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      habit.icon,
                      style: const TextStyle(fontSize: 24),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Habit info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        habit.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          decoration: isCompleted ? TextDecoration.lineThrough : null,
                          color: isCompleted ? Colors.grey.shade600 : null,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        habit.typeDescription,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      if (habit.currentStreak > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Text('🔥', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: 4),
                            Text(
                              '${habit.currentStreak} day streak',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                
                // Completion button/status
                if (isCompleted)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check,
                      color: Colors.green.shade700,
                      size: 20,
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => _showCompletionDialog(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Color(int.parse('0xFF${habit.color.substring(1)}')).withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.add,
                        color: Color(int.parse('0xFF${habit.color.substring(1)}')),
                        size: 20,
                      ),
                    ),
                  ),
              ],
            ),
            
            // Progress indicator for non-simple habits
            if (habit.type != HabitType.simple) ...[
              const SizedBox(height: 12),
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
                  const SizedBox(width: 12),
                  Text(
                    _getProgressText(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
            
            // Action buttons when completed
            if (isCompleted) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => onUndo(habit.id),
                      icon: const Icon(Icons.undo, size: 16),
                      label: const Text('Undo'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange,
                        side: const BorderSide(color: Colors.orange),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showCompletionDialog(context),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add More'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(int.parse('0xFF${habit.color.substring(1)}')),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showCompletionDialog(BuildContext context) {
    if (habit.type == HabitType.simple) {
      onComplete(habit.id, 1, '', null);
      return;
    }

    showDialog(
      context: context,
      builder: (context) => _CompletionDialog(
        habit: habit,
        onComplete: (value, notes, duration) {
          onComplete(habit.id, value, notes, duration);
        },
      ),
    );
  }

  String _getProgressText() {
    final today = DateTime.now();
    final dayCompletions = completions.where((c) {
      final completedDate = c.completedAt;
      return c.habitId == habit.id &&
             completedDate.year == today.year &&
             completedDate.month == today.month &&
             completedDate.day == today.day;
    }).toList();

    switch (habit.type) {
      case HabitType.simple:
        return dayCompletions.isNotEmpty ? 'Done' : 'Pending';
      case HabitType.count:
      case HabitType.value:
        final totalValue = dayCompletions.fold<int>(0, (sum, c) => sum + c.value);
        return '$totalValue/${habit.targetValue} ${habit.unit}';
      case HabitType.time:
        final totalDuration = dayCompletions.fold<int>(0, (sum, c) => sum + (c.duration ?? 0));
        return '$totalDuration/${habit.targetValue} min';
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
    _valueController = TextEditingController(text: widget.habit.targetValue.toString());
    _notesController = TextEditingController();
    _durationController = TextEditingController(text: widget.habit.targetValue.toString());
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
          if (widget.habit.type == HabitType.count || widget.habit.type == HabitType.value)
            TextField(
              controller: _valueController,
              decoration: InputDecoration(
                labelText: widget.habit.type == HabitType.count ? 'Count' : 'Value',
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
            const SizedBox(height: 16),
          ],
          
          if (widget.habit.type != HabitType.time) const SizedBox(height: 16),
          
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
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _complete,
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(int.parse('0xFF${widget.habit.color.substring(1)}')),
            foregroundColor: Colors.white,
          ),
          child: const Text('Complete'),
        ),
      ],
    );
  }

  void _complete() {
    int value = 1;
    int? duration;

    if (widget.habit.type == HabitType.count || widget.habit.type == HabitType.value) {
      value = int.tryParse(_valueController.text) ?? 1;
    }

    if (widget.habit.type == HabitType.time) {
      duration = int.tryParse(_durationController.text) ?? widget.habit.targetValue;
    }

    widget.onComplete(value, _notesController.text, duration);
    Navigator.pop(context);
  }
} 