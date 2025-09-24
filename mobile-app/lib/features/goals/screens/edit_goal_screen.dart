import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/goal_model.dart';
import '../providers/goal_provider.dart';
import '../widgets/milestone_editor.dart';
import '../widgets/goal_category_selector.dart';

class EditGoalScreen extends ConsumerStatefulWidget {
  final String goalId;

  const EditGoalScreen({
    required this.goalId,
    super.key,
  });

  @override
  ConsumerState<EditGoalScreen> createState() => _EditGoalScreenState();
}

class _EditGoalScreenState extends ConsumerState<EditGoalScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetValueController = TextEditingController();
  final _unitController = TextEditingController();

  late Goal _originalGoal;
  GoalCategory? _selectedCategory;
  GoalType? _selectedType;
  DateTime? _targetDate;
  List<Milestone> _milestones = [];
  bool _isLoading = true;
  bool _isSaving = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _loadGoalData();
  }

  Future<void> _loadGoalData() async {
    try {
      final goalState = ref.read(goalProvider);
      final goal = goalState.goals.firstWhere((g) => g.id == widget.goalId);

      setState(() {
        _originalGoal = goal;
        _titleController.text = goal.title;
        _descriptionController.text = goal.description ?? '';
        _targetValueController.text = goal.targetValue?.toString() ?? '';
        _unitController.text = goal.unit ?? '';
        _selectedCategory = goal.category;
        _selectedType = goal.type;
        _targetDate = goal.targetDate;
        _milestones = List.from(goal.milestones);
        _isLoading = false;
      });

      // Listen for changes
      _titleController.addListener(_onFieldChanged);
      _descriptionController.addListener(_onFieldChanged);
      _targetValueController.addListener(_onFieldChanged);
      _unitController.addListener(_onFieldChanged);
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load goal: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  void _onFieldChanged() {
    if (!_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _targetValueController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    // Show confirmation if removing milestones
    if (_milestones.length < _originalGoal.milestones.length) {
      final confirmed = await _showRemoveMilestoneConfirmation();
      if (!confirmed) return;
    }

    setState(() => _isSaving = true);

    try {
      final updatedGoal = _originalGoal.copyWith(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _selectedCategory!,
        type: _selectedType!,
        targetDate: _targetDate,
        targetValue: double.tryParse(_targetValueController.text),
        unit: _unitController.text.trim(),
        milestones: _milestones,
        updatedAt: DateTime.now(),
      );

      final success = await ref.read(goalProvider.notifier).updateGoal(updatedGoal);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Goal updated successfully')),
        );
        context.pop(true); // Return true to indicate changes were saved
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update goal: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<bool> _showRemoveMilestoneConfirmation() async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Milestones?'),
        content: const Text(
          'You are removing some milestones. This action cannot be undone. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    ) ?? false;
  }

  Future<bool> _onWillPop() async {
    if (!_hasChanges) return true;

    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard Changes?'),
        content: const Text(
          'You have unsaved changes. Do you want to discard them?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Discard'),
          ),
        ],
      ),
    ) ?? false;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Goal')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Edit Goal'),
          actions: [
            if (_hasChanges)
              TextButton(
                onPressed: _isSaving ? null : _saveChanges,
                child: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save'),
              ),
          ],
        ),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            children: [
              // Goal Title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Goal Title',
                  hintText: 'What do you want to achieve?',
                  prefixIcon: Icon(Icons.flag),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a goal title';
                  }
                  if (value.length > 100) {
                    return 'Title must be less than 100 characters';
                  }
                  return null;
                },
                maxLength: 100,
              ),
              const SizedBox(height: UIConstants.spacingMD),

              // Goal Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'Add more details about your goal',
                  prefixIcon: Icon(Icons.description),
                ),
                maxLines: 3,
                maxLength: 500,
              ),
              const SizedBox(height: UIConstants.spacingMD),

              // Goal Type and Category Row
              Row(
                children: [
                  // Goal Type
                  Expanded(
                    child: DropdownButtonFormField<GoalType>(
                      value: _selectedType,
                      decoration: const InputDecoration(
                        labelText: 'Type',
                        prefixIcon: Icon(Icons.category),
                      ),
                      items: GoalType.values.map((type) {
                        return DropdownMenuItem(
                          value: type,
                          child: Text(_getTypeName(type)),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value;
                          _hasChanges = true;
                        });
                      },
                      validator: (value) =>
                          value == null ? 'Please select a type' : null,
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingMD),

                  // Goal Category
                  Expanded(
                    child: DropdownButtonFormField<GoalCategory>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        prefixIcon: Icon(Icons.label),
                      ),
                      items: GoalCategory.values.map((category) {
                        return DropdownMenuItem(
                          value: category,
                          child: Row(
                            children: [
                              Icon(
                                _getCategoryIcon(category),
                                size: 16,
                                color: _getCategoryColor(category),
                              ),
                              const SizedBox(width: 8),
                              Text(_getCategoryName(category)),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCategory = value;
                          _hasChanges = true;
                        });
                      },
                      validator: (value) =>
                          value == null ? 'Please select a category' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.spacingMD),

              // Target Value and Unit (for measurable goals)
              if (_selectedType == GoalType.measurable) ...[
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _targetValueController,
                        decoration: const InputDecoration(
                          labelText: 'Target Value',
                          hintText: '0',
                          prefixIcon: Icon(Icons.trending_up),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (_selectedType == GoalType.measurable) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter a target value';
                            }
                            if (double.tryParse(value) == null) {
                              return 'Please enter a valid number';
                            }
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: UIConstants.spacingMD),
                    Expanded(
                      child: TextFormField(
                        controller: _unitController,
                        decoration: const InputDecoration(
                          labelText: 'Unit',
                          hintText: 'kg, km, etc.',
                        ),
                        maxLength: 20,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: UIConstants.spacingMD),
              ],

              // Target Date
              Card(
                child: ListTile(
                  leading: const Icon(Icons.calendar_today),
                  title: const Text('Target Date'),
                  subtitle: Text(
                    _targetDate != null
                        ? DateFormat('MMMM d, yyyy').format(_targetDate!)
                        : 'No target date set',
                  ),
                  trailing: _targetDate != null
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            setState(() {
                              _targetDate = null;
                              _hasChanges = true;
                            });
                          },
                        )
                      : null,
                  onTap: _selectTargetDate,
                ),
              ),
              const SizedBox(height: UIConstants.spacingLG),

              // Milestones Section
              _buildMilestonesSection(),
              const SizedBox(height: UIConstants.spacingLG),

              // Additional Options
              _buildAdditionalOptions(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMilestonesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Milestones',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            IconButton(
              icon: const Icon(Icons.add_circle),
              onPressed: _addMilestone,
            ),
          ],
        ),
        const SizedBox(height: UIConstants.spacingSM),
        if (_milestones.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.flag_outlined,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    Text(
                      'No milestones added',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: UIConstants.spacingXS),
                    Text(
                      'Break down your goal into smaller steps',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _milestones.length,
            onReorder: (oldIndex, newIndex) {
              setState(() {
                if (newIndex > oldIndex) newIndex--;
                final milestone = _milestones.removeAt(oldIndex);
                _milestones.insert(newIndex, milestone);
                _hasChanges = true;
              });
            },
            itemBuilder: (context, index) {
              final milestone = _milestones[index];
              return Card(
                key: ValueKey(milestone.id),
                margin: const EdgeInsets.only(bottom: UIConstants.spacingSM),
                child: ListTile(
                  leading: Checkbox(
                    value: milestone.isCompleted,
                    onChanged: (value) {
                      setState(() {
                        _milestones[index] = milestone.copyWith(
                          isCompleted: value ?? false,
                          completedAt: value == true ? DateTime.now() : null,
                        );
                        _hasChanges = true;
                      });
                    },
                  ),
                  title: Text(
                    milestone.title,
                    style: milestone.isCompleted
                        ? const TextStyle(decoration: TextDecoration.lineThrough)
                        : null,
                  ),
                  subtitle: milestone.targetDate != null
                      ? Text(
                          'Due: ${DateFormat('MMM d').format(milestone.targetDate!)}',
                        )
                      : null,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _editMilestone(index),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _removeMilestone(index),
                      ),
                      const Icon(Icons.drag_handle),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildAdditionalOptions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Additional Options',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SwitchListTile(
              title: const Text('Make goal public'),
              subtitle: const Text('Share progress with your coach and team'),
              value: _originalGoal.isPublic ?? false,
              onChanged: (value) {
                setState(() {
                  _originalGoal = _originalGoal.copyWith(isPublic: value);
                  _hasChanges = true;
                });
              },
            ),
            SwitchListTile(
              title: const Text('Enable reminders'),
              subtitle: const Text('Get notified about milestones and progress'),
              value: _originalGoal.hasReminders ?? true,
              onChanged: (value) {
                setState(() {
                  _originalGoal = _originalGoal.copyWith(hasReminders: value);
                  _hasChanges = true;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectTargetDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );

    if (picked != null) {
      setState(() {
        _targetDate = picked;
        _hasChanges = true;
      });
    }
  }

  void _addMilestone() async {
    final result = await showDialog<Milestone>(
      context: context,
      builder: (context) => MilestoneEditorDialog(
        milestone: null,
        goalTargetDate: _targetDate,
      ),
    );

    if (result != null) {
      setState(() {
        _milestones.add(result);
        _hasChanges = true;
      });
    }
  }

  void _editMilestone(int index) async {
    final result = await showDialog<Milestone>(
      context: context,
      builder: (context) => MilestoneEditorDialog(
        milestone: _milestones[index],
        goalTargetDate: _targetDate,
      ),
    );

    if (result != null) {
      setState(() {
        _milestones[index] = result;
        _hasChanges = true;
      });
    }
  }

  void _removeMilestone(int index) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Milestone'),
        content: Text('Remove "${_milestones[index].title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    ) ?? false;

    if (confirmed) {
      setState(() {
        _milestones.removeAt(index);
        _hasChanges = true;
      });
    }
  }

  String _getTypeName(GoalType type) {
    switch (type) {
      case GoalType.simple:
        return 'Simple';
      case GoalType.measurable:
        return 'Measurable';
      case GoalType.milestone:
        return 'Milestone-based';
      case GoalType.habit:
        return 'Habit-linked';
    }
  }

  String _getCategoryName(GoalCategory category) {
    switch (category) {
      case GoalCategory.health:
        return 'Health';
      case GoalCategory.fitness:
        return 'Fitness';
      case GoalCategory.career:
        return 'Career';
      case GoalCategory.education:
        return 'Education';
      case GoalCategory.financial:
        return 'Financial';
      case GoalCategory.personal:
        return 'Personal';
      case GoalCategory.relationships:
        return 'Relationships';
      case GoalCategory.spiritual:
        return 'Spiritual';
      case GoalCategory.other:
        return 'Other';
    }
  }

  IconData _getCategoryIcon(GoalCategory category) {
    switch (category) {
      case GoalCategory.health:
        return Icons.favorite;
      case GoalCategory.fitness:
        return Icons.fitness_center;
      case GoalCategory.career:
        return Icons.work;
      case GoalCategory.education:
        return Icons.school;
      case GoalCategory.financial:
        return Icons.attach_money;
      case GoalCategory.personal:
        return Icons.person;
      case GoalCategory.relationships:
        return Icons.people;
      case GoalCategory.spiritual:
        return Icons.self_improvement;
      case GoalCategory.other:
        return Icons.category;
    }
  }

  Color _getCategoryColor(GoalCategory category) {
    switch (category) {
      case GoalCategory.health:
        return Colors.red;
      case GoalCategory.fitness:
        return Colors.orange;
      case GoalCategory.career:
        return Colors.blue;
      case GoalCategory.education:
        return Colors.purple;
      case GoalCategory.financial:
        return Colors.green;
      case GoalCategory.personal:
        return Colors.teal;
      case GoalCategory.relationships:
        return Colors.pink;
      case GoalCategory.spiritual:
        return Colors.indigo;
      case GoalCategory.other:
        return Colors.grey;
    }
  }
}

// Milestone Editor Dialog
class MilestoneEditorDialog extends StatefulWidget {
  final Milestone? milestone;
  final DateTime? goalTargetDate;

  const MilestoneEditorDialog({
    this.milestone,
    this.goalTargetDate,
    super.key,
  });

  @override
  State<MilestoneEditorDialog> createState() => _MilestoneEditorDialogState();
}

class _MilestoneEditorDialogState extends State<MilestoneEditorDialog> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime? _targetDate;

  @override
  void initState() {
    super.initState();
    if (widget.milestone != null) {
      _titleController.text = widget.milestone!.title;
      _descriptionController.text = widget.milestone!.description ?? '';
      _targetDate = widget.milestone!.targetDate;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.milestone == null ? 'Add Milestone' : 'Edit Milestone'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Milestone Title',
                hintText: 'What needs to be achieved?',
              ),
              autofocus: true,
              maxLength: 100,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
                hintText: 'Add more details',
              ),
              maxLines: 2,
              maxLength: 200,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today),
              title: const Text('Target Date'),
              subtitle: Text(
                _targetDate != null
                    ? DateFormat('MMMM d, yyyy').format(_targetDate!)
                    : 'No date set',
              ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: widget.goalTargetDate ?? DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() => _targetDate = picked);
                }
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            if (_titleController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please enter a milestone title')),
              );
              return;
            }

            final milestone = Milestone(
              id: widget.milestone?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
              title: _titleController.text.trim(),
              description: _descriptionController.text.trim().isEmpty
                  ? null
                  : _descriptionController.text.trim(),
              targetDate: _targetDate,
              isCompleted: widget.milestone?.isCompleted ?? false,
              completedAt: widget.milestone?.completedAt,
              createdAt: widget.milestone?.createdAt ?? DateTime.now(),
            );

            Navigator.of(context).pop(milestone);
          },
          child: Text(widget.milestone == null ? 'Add' : 'Save'),
        ),
      ],
    );
  }
}