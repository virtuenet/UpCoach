import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/goal_model.dart';
import '../providers/goal_provider.dart';

class GoalDetailScreen extends ConsumerStatefulWidget {
  final GoalModel goal;

  const GoalDetailScreen({
    super.key,
    required this.goal,
  });

  @override
  ConsumerState<GoalDetailScreen> createState() => _GoalDetailScreenState();
}

class _GoalDetailScreenState extends ConsumerState<GoalDetailScreen> {
  late GoalModel _goal;
  double _progressValue = 0.0;
  bool _isEditingProgress = false;

  @override
  void initState() {
    super.initState();
    _goal = widget.goal;
    _progressValue = _goal.progress;
  }

  void _updateProgress() async {
    await ref.read(goalProvider.notifier).updateProgress(
      _goal.id,
      _progressValue,
    );
    setState(() {
      _goal = _goal.copyWith(progress: _progressValue);
      _isEditingProgress = false;
    });
  }

  void _toggleMilestone(String milestone) async {
    await ref.read(goalProvider.notifier).toggleMilestone(
      _goal.id,
      milestone,
    );
    
    // Update local state
    setState(() {
      final isCompleted = _goal.completedMilestones.contains(milestone);
      List<String> updatedMilestones;
      
      if (isCompleted) {
        updatedMilestones = _goal.completedMilestones
            .where((m) => m != milestone)
            .toList();
      } else {
        updatedMilestones = [..._goal.completedMilestones, milestone];
      }
      
      _goal = _goal.copyWith(completedMilestones: updatedMilestones);
    });
  }

  Future<void> _deleteGoal() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Goal'),
        content: Text('Are you sure you want to delete "${_goal.title}"?'),
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

    if (confirm == true) {
      try {
        await ref.read(goalProvider.notifier).deleteGoal(_goal.id);
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Goal deleted successfully'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete goal: $e'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Goal Details'),
        actions: [
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: AppTheme.errorColor),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: AppTheme.errorColor)),
                  ],
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'delete') {
                _deleteGoal();
              }
              // TODO: Implement edit functionality
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: _getCategoryColor(_goal.category).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          _getCategoryIcon(_goal.category),
                          color: _getCategoryColor(_goal.category),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _goal.title,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                _buildChip(
                                  _goal.categoryLabel,
                                  _getCategoryColor(_goal.category),
                                ),
                                const SizedBox(width: 8),
                                _buildChip(
                                  _goal.priorityLabel,
                                  _getPriorityColor(_goal.priority),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  if (_goal.description != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _goal.description!,
                      style: TextStyle(
                        fontSize: 16,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: 16),
                  
                  // Target date
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 20,
                        color: _goal.isOverdue 
                            ? AppTheme.errorColor 
                            : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Target: ${DateFormat('MMMM d, yyyy').format(_goal.targetDate)}',
                        style: TextStyle(
                          color: _goal.isOverdue 
                              ? AppTheme.errorColor 
                              : AppTheme.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _goal.isOverdue 
                            ? 'Overdue' 
                            : '${_goal.daysRemaining} days left',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: _goal.isOverdue 
                              ? AppTheme.errorColor 
                              : AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Progress card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (!_isEditingProgress)
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _isEditingProgress = true;
                            });
                          },
                          child: const Text('Update'),
                        ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  if (_isEditingProgress) ...[
                    Slider(
                      value: _progressValue,
                      onChanged: (value) {
                        setState(() {
                          _progressValue = value;
                        });
                      },
                      divisions: 20,
                      label: '${(_progressValue * 100).toInt()}%',
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _progressValue = _goal.progress;
                              _isEditingProgress = false;
                            });
                          },
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          onPressed: _updateProgress,
                          child: const Text('Save'),
                        ),
                      ],
                    ),
                  ] else ...[
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 120,
                          height: 120,
                          child: CircularProgressIndicator(
                            value: _goal.progress,
                            strokeWidth: 12,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              _getProgressColor(_goal.progress),
                            ),
                          ),
                        ),
                        Text(
                          '${(_goal.progress * 100).toInt()}%',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                  
                  const SizedBox(height: 16),
                  
                  LinearProgressIndicator(
                    value: _goal.progress,
                    minHeight: 8,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getProgressColor(_goal.progress),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Milestones card
          if (_goal.milestones.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Milestones',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${_goal.completedMilestonesCount}/${_goal.totalMilestones}',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 8),
                    
                    LinearProgressIndicator(
                      value: _goal.milestoneProgress,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _getProgressColor(_goal.milestoneProgress),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    ..._goal.milestones.map((milestone) {
                      final isCompleted = _goal.completedMilestones.contains(milestone);
                      return CheckboxListTile(
                        title: Text(
                          milestone,
                          style: TextStyle(
                            decoration: isCompleted 
                                ? TextDecoration.lineThrough 
                                : null,
                          ),
                        ),
                        value: isCompleted,
                        onChanged: (value) => _toggleMilestone(milestone),
                        controlAffinity: ListTileControlAffinity.leading,
                      );
                    }),
                  ],
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Stats card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Statistics',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildStatRow('Status', _goal.statusLabel,
                      color: _getStatusColor(_goal.status)),
                  const SizedBox(height: 8),
                  _buildStatRow(
                    'Created',
                    DateFormat('MMM d, yyyy').format(_goal.createdAt),
                  ),
                  const SizedBox(height: 8),
                  _buildStatRow(
                    'Last Updated',
                    DateFormat('MMM d, yyyy').format(_goal.updatedAt),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppTheme.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }

  Color _getCategoryColor(GoalCategory category) {
    switch (category) {
      case GoalCategory.career:
        return Colors.blue;
      case GoalCategory.health:
        return Colors.green;
      case GoalCategory.financial:
        return Colors.amber;
      case GoalCategory.personal:
        return Colors.purple;
      case GoalCategory.education:
        return Colors.indigo;
      case GoalCategory.relationship:
        return Colors.pink;
      case GoalCategory.other:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(GoalCategory category) {
    switch (category) {
      case GoalCategory.career:
        return Icons.work;
      case GoalCategory.health:
        return Icons.favorite;
      case GoalCategory.financial:
        return Icons.attach_money;
      case GoalCategory.personal:
        return Icons.person;
      case GoalCategory.education:
        return Icons.school;
      case GoalCategory.relationship:
        return Icons.people;
      case GoalCategory.other:
        return Icons.category;
    }
  }

  Color _getPriorityColor(GoalPriority priority) {
    switch (priority) {
      case GoalPriority.low:
        return Colors.grey;
      case GoalPriority.medium:
        return AppTheme.warningColor;
      case GoalPriority.high:
        return AppTheme.errorColor;
    }
  }

  Color _getStatusColor(GoalStatus status) {
    switch (status) {
      case GoalStatus.active:
        return AppTheme.successColor;
      case GoalStatus.paused:
        return AppTheme.warningColor;
      case GoalStatus.completed:
        return AppTheme.primaryColor;
      case GoalStatus.cancelled:
        return AppTheme.textSecondary;
    }
  }

  Color _getProgressColor(double progress) {
    if (progress >= 0.8) return AppTheme.successColor;
    if (progress >= 0.5) return AppTheme.warningColor;
    return AppTheme.errorColor;
  }
} 