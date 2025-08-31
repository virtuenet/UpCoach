import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/goal_model.dart';
import '../providers/goal_provider.dart';

class CreateGoalScreen extends ConsumerStatefulWidget {
  const CreateGoalScreen({super.key});

  @override
  ConsumerState<CreateGoalScreen> createState() => _CreateGoalScreenState();
}

class _CreateGoalScreenState extends ConsumerState<CreateGoalScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _milestoneController = TextEditingController();
  
  GoalCategory _category = GoalCategory.personal;
  GoalPriority _priority = GoalPriority.medium;
  DateTime? _targetDate;
  final List<String> _milestones = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _milestoneController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now().add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 1825)), // 5 years
    );
    
    if (date != null) {
      setState(() {
        _targetDate = date;
      });
    }
  }

  void _addMilestone() {
    final milestone = _milestoneController.text.trim();
    if (milestone.isNotEmpty) {
      setState(() {
        _milestones.add(milestone);
        _milestoneController.clear();
      });
    }
  }

  void _removeMilestone(int index) {
    setState(() {
      _milestones.removeAt(index);
    });
  }

  Future<void> _createGoal() async {
    if (!_formKey.currentState!.validate()) return;
    if (_targetDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a target date'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(goalProvider.notifier).createGoal(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isEmpty 
            ? null 
            : _descriptionController.text.trim(),
        category: _category,
        priority: _priority,
        targetDate: _targetDate!,
        milestones: _milestones,
      );

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Goal created successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create goal: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Goal'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _createGoal,
            child: const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          children: [
            // Title
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Goal Title',
                hintText: 'Enter your goal',
                prefixIcon: Icon(Icons.flag),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a title';
                }
                return null;
              },
              textCapitalization: TextCapitalization.sentences,
            ),
            
            const SizedBox(height: UIConstants.spacingMD),
            
            // Description
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
                hintText: 'Describe your goal',
                prefixIcon: Icon(Icons.description),
                alignLabelWithHint: true,
              ),
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
            ),
            
            const SizedBox(height: UIConstants.spacingLG),
            
            // Category
            Text(
              'Category',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Wrap(
              spacing: 8,
              children: GoalCategory.values.map((category) {
                return ChoiceChip(
                  label: Text(_getCategoryLabel(category)),
                  selected: _category == category,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _category = category;
                      });
                    }
                  },
                  avatar: Icon(
                    _getCategoryIcon(category),
                    size: 18,
                  ),
                );
              }).toList(),
            ),
            
            const SizedBox(height: UIConstants.spacingLG),
            
            // Priority
            Text(
              'Priority',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Wrap(
              spacing: 8,
              children: GoalPriority.values.map((priority) {
                return ChoiceChip(
                  label: Text(_getPriorityLabel(priority)),
                  selected: _priority == priority,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _priority = priority;
                      });
                    }
                  },
                  selectedColor: _getPriorityColor(priority).withOpacity(0.3),
                );
              }).toList(),
            ),
            
            const SizedBox(height: UIConstants.spacingLG),
            
            // Target Date
            InkWell(
              onTap: _selectDate,
              borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Target Date',
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _targetDate == null
                      ? 'Select target date'
                      : DateFormat('MMMM d, yyyy').format(_targetDate!),
                ),
              ),
            ),
            
            const SizedBox(height: UIConstants.spacingLG),
            
            // Milestones
            Text(
              'Milestones',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            
            // Milestone input
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _milestoneController,
                    decoration: const InputDecoration(
                      hintText: 'Add a milestone',
                      prefixIcon: Icon(Icons.check_box_outline_blank),
                    ),
                    textCapitalization: TextCapitalization.sentences,
                    onFieldSubmitted: (_) => _addMilestone(),
                  ),
                ),
                const SizedBox(width: UIConstants.spacingSM),
                IconButton(
                  onPressed: _addMilestone,
                  icon: const Icon(Icons.add_circle),
                  color: AppTheme.primaryColor,
                ),
              ],
            ),
            
            const SizedBox(height: UIConstants.spacingSM),
            
            // Milestones list
            if (_milestones.isEmpty)
              Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Text(
                  'No milestones added yet',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              )
            else
              ...List.generate(_milestones.length, (index) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.check_box_outline_blank),
                    title: Text(_milestones[index]),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () => _removeMilestone(index),
                      color: AppTheme.errorColor,
                    ),
                  ),
                );
              }),
            
            const SizedBox(height: UIConstants.spacingXL),
            
            // Create button
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _createGoal,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.flag),
              label: Text(_isLoading ? 'Creating...' : 'Create Goal'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCategoryLabel(GoalCategory category) {
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

  String _getPriorityLabel(GoalPriority priority) {
    switch (priority) {
      case GoalPriority.low:
        return 'Low';
      case GoalPriority.medium:
        return 'Medium';
      case GoalPriority.high:
        return 'High';
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
} 