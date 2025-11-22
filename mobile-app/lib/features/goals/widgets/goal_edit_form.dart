import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../models/goal.dart';
import '../providers/goals_provider.dart';

class GoalEditForm extends ConsumerStatefulWidget {
  final Goal? goal;
  final VoidCallback? onSave;

  const GoalEditForm({
    Key? key,
    this.goal,
    this.onSave,
  }) : super(key: key);

  @override
  ConsumerState<GoalEditForm> createState() => _GoalEditFormState();
}

class _GoalEditFormState extends ConsumerState<GoalEditForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _targetValueController;
  late TextEditingController _currentValueController;

  GoalCategory _selectedCategory = GoalCategory.personal;
  GoalPriority _selectedPriority = GoalPriority.medium;
  DateTime _targetDate = DateTime.now().add(const Duration(days: 30));
  bool _isPublic = false;
  bool _enableReminders = true;
  List<String> _milestones = [];
  final TextEditingController _milestoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.goal?.title ?? '');
    _descriptionController = TextEditingController(text: widget.goal?.description ?? '');
    _targetValueController = TextEditingController(text: widget.goal?.targetValue?.toString() ?? '');
    _currentValueController = TextEditingController(text: widget.goal?.currentValue?.toString() ?? '0');

    if (widget.goal != null) {
      _selectedCategory = widget.goal!.category;
      _selectedPriority = widget.goal!.priority;
      _targetDate = widget.goal!.targetDate;
      _isPublic = widget.goal!.isPublic;
      _enableReminders = widget.goal!.enableReminders;
      _milestones = List.from(widget.goal!.milestones);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _targetValueController.dispose();
    _currentValueController.dispose();
    _milestoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(
          widget.goal == null ? 'Create Goal' : 'Edit Goal',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _saveGoal,
            child: Text(
              'Save',
              style: TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title Field
            _buildSectionCard(
              title: 'Goal Details',
              children: [
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: 'Goal Title',
                    hintText: 'e.g., Run a Marathon',
                    prefixIcon: Icon(
                      CupertinoIcons.flag_fill,
                      color: AppTheme.primaryColor,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: AppTheme.primaryColor,
                        width: 2,
                      ),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a goal title';
                    }
                    if (value.length < 3) {
                      return 'Title must be at least 3 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Description',
                    hintText: 'What do you want to achieve?',
                    alignLabelWithHint: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: AppTheme.primaryColor,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Category and Priority
            _buildSectionCard(
              title: 'Category & Priority',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdownField<GoalCategory>(
                        label: 'Category',
                        value: _selectedCategory,
                        items: GoalCategory.values,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _selectedCategory = value;
                            });
                          }
                        },
                        itemBuilder: (category) => Row(
                          children: [
                            Icon(
                              _getCategoryIcon(category),
                              size: 20,
                              color: _getCategoryColor(category),
                            ),
                            const SizedBox(width: 8),
                            Text(_getCategoryName(category)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDropdownField<GoalPriority>(
                        label: 'Priority',
                        value: _selectedPriority,
                        items: GoalPriority.values,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _selectedPriority = value;
                            });
                          }
                        },
                        itemBuilder: (priority) => Row(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: _getPriorityColor(priority),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(_getPriorityName(priority)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Progress Tracking
            _buildSectionCard(
              title: 'Progress Tracking',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _currentValueController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          labelText: 'Current Progress',
                          suffixText: 'units',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppTheme.primaryColor,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _targetValueController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          labelText: 'Target',
                          suffixText: 'units',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppTheme.primaryColor,
                              width: 2,
                            ),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Required';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildProgressIndicator(),
              ],
            ),
            const SizedBox(height: 16),

            // Target Date
            _buildSectionCard(
              title: 'Timeline',
              children: [
                InkWell(
                  onTap: _selectTargetDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          CupertinoIcons.calendar,
                          color: AppTheme.primaryColor,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Target Date',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat('MMMM d, yyyy').format(_targetDate),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _getDaysRemaining(),
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Milestones
            _buildSectionCard(
              title: 'Milestones',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _milestoneController,
                        decoration: InputDecoration(
                          hintText: 'Add a milestone',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppTheme.primaryColor,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      onPressed: _addMilestone,
                      icon: const Icon(Icons.add),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
                if (_milestones.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ..._milestones.asMap().entries.map((entry) {
                    return _buildMilestoneChip(entry.key, entry.value);
                  }).toList(),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // Settings
            _buildSectionCard(
              title: 'Settings',
              children: [
                SwitchListTile(
                  title: const Text('Public Goal'),
                  subtitle: Text(
                    'Share progress with the community',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  value: _isPublic,
                  onChanged: (value) {
                    setState(() {
                      _isPublic = value;
                    });
                  },
                  activeColor: AppTheme.primaryColor,
                  contentPadding: EdgeInsets.zero,
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Enable Reminders'),
                  subtitle: Text(
                    'Get notified about your goal progress',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  value: _enableReminders,
                  onChanged: (value) {
                    setState(() {
                      _enableReminders = value;
                    });
                  },
                  activeColor: AppTheme.primaryColor,
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDropdownField<T>({
    required String label,
    required T value,
    required List<T> items,
    required Function(T?) onChanged,
    required Widget Function(T) itemBuilder,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppTheme.primaryColor,
            width: 2,
          ),
        ),
      ),
      items: items.map((item) {
        return DropdownMenuItem<T>(
          value: item,
          child: itemBuilder(item),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildProgressIndicator() {
    final current = double.tryParse(_currentValueController.text) ?? 0;
    final target = double.tryParse(_targetValueController.text) ?? 100;
    final progress = target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Progress',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            Text(
              '${(progress * 100).toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          minHeight: 8,
          backgroundColor: Colors.grey.shade200,
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
        ),
      ],
    );
  }

  Widget _buildMilestoneChip(int index, String milestone) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              milestone,
              style: const TextStyle(fontSize: 14),
            ),
          ),
          IconButton(
            onPressed: () {
              setState(() {
                _milestones.removeAt(index);
              });
            },
            icon: Icon(
              CupertinoIcons.xmark,
              size: 16,
              color: Colors.grey.shade600,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  void _addMilestone() {
    if (_milestoneController.text.isNotEmpty) {
      setState(() {
        _milestones.add(_milestoneController.text);
        _milestoneController.clear();
      });
    }
  }

  void _selectTargetDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _targetDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppTheme.primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _targetDate = picked;
      });
    }
  }

  String _getDaysRemaining() {
    final days = _targetDate.difference(DateTime.now()).inDays;
    if (days < 0) {
      return 'Overdue';
    } else if (days == 0) {
      return 'Today';
    } else if (days == 1) {
      return '1 day';
    } else {
      return '$days days';
    }
  }

  IconData _getCategoryIcon(GoalCategory category) {
    switch (category) {
      case GoalCategory.health:
        return CupertinoIcons.heart_fill;
      case GoalCategory.career:
        return CupertinoIcons.briefcase_fill;
      case GoalCategory.personal:
        return CupertinoIcons.person_fill;
      case GoalCategory.financial:
        return CupertinoIcons.money_dollar_circle_fill;
      case GoalCategory.education:
        return CupertinoIcons.book_fill;
      case GoalCategory.relationship:
        return CupertinoIcons.person_2_fill;
    }
  }

  Color _getCategoryColor(GoalCategory category) {
    switch (category) {
      case GoalCategory.health:
        return Colors.red;
      case GoalCategory.career:
        return Colors.blue;
      case GoalCategory.personal:
        return Colors.purple;
      case GoalCategory.financial:
        return Colors.green;
      case GoalCategory.education:
        return Colors.orange;
      case GoalCategory.relationship:
        return Colors.pink;
    }
  }

  String _getCategoryName(GoalCategory category) {
    return category.name.substring(0, 1).toUpperCase() + category.name.substring(1);
  }

  Color _getPriorityColor(GoalPriority priority) {
    switch (priority) {
      case GoalPriority.low:
        return Colors.grey;
      case GoalPriority.medium:
        return Colors.orange;
      case GoalPriority.high:
        return Colors.red;
    }
  }

  String _getPriorityName(GoalPriority priority) {
    return priority.name.substring(0, 1).toUpperCase() + priority.name.substring(1);
  }

  void _saveGoal() {
    if (_formKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();

      // Create or update goal
      final goal = Goal(
        id: widget.goal?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: _titleController.text,
        description: _descriptionController.text,
        category: _selectedCategory,
        priority: _selectedPriority,
        targetDate: _targetDate,
        targetValue: double.tryParse(_targetValueController.text),
        currentValue: double.tryParse(_currentValueController.text) ?? 0,
        milestones: _milestones,
        isPublic: _isPublic,
        enableReminders: _enableReminders,
        createdAt: widget.goal?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Save goal (implement actual save logic)
      widget.onSave?.call();

      // Show success feedback
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text(widget.goal == null ? 'Goal created successfully!' : 'Goal updated successfully!'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );

      Navigator.pop(context, goal);
    }
  }
}