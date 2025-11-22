import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

class EditHabitScreen extends ConsumerStatefulWidget {
  final Habit habit;

  const EditHabitScreen({
    super.key,
    required this.habit,
  });

  @override
  ConsumerState<EditHabitScreen> createState() => _EditHabitScreenState();
}

class _EditHabitScreenState extends ConsumerState<EditHabitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetValueController = TextEditingController();
  final _unitController = TextEditingController();

  late HabitCategory _selectedCategory;
  late HabitFrequency _selectedFrequency;
  late String _selectedIcon;
  late bool _isActive;
  late List<int> _selectedWeekdays;
  late TimeOfDay? _reminderTime;
  late HabitDifficulty? _selectedDifficulty;
  late Color _selectedColor;
  int? _customInterval;

  bool _isLoading = false;

  final List<String> _availableIcons = [
    '🎯', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎨', '💼',
    '🎵', '🌱', '💰', '🏠', '🚗', '📱', '☕', '🍎', '🚴', '🏊',
    '🎮', '📝', '📊', '🔥', '⚡', '🌟', '💎', '🏆', '🎊', '🚀'
  ];

  final List<Color> _availableColors = [
    Colors.blue,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.red,
    Colors.teal,
    Colors.indigo,
    Colors.pink,
    Colors.amber,
    Colors.cyan,
  ];

  @override
  void initState() {
    super.initState();
    _initializeFields();
  }

  void _initializeFields() {
    _nameController.text = widget.habit.name;
    _descriptionController.text = widget.habit.description;
    _targetValueController.text = widget.habit.targetValue?.toString() ?? '';
    _unitController.text = widget.habit.unit ?? '';

    _selectedCategory = widget.habit.category;
    _selectedFrequency = widget.habit.frequency;
    _selectedIcon = widget.habit.icon.isNotEmpty ? widget.habit.icon : '🎯';
    _isActive = widget.habit.isActive;
    _selectedWeekdays = List.from(widget.habit.weekdays);
    _reminderTime = widget.habit.reminderTime;
    _selectedDifficulty = widget.habit.difficulty;
    _selectedColor = widget.habit.color ?? Colors.blue;
    _customInterval = widget.habit.customInterval;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _targetValueController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Habit'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(UIConstants.spacingMD),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _saveHabit,
              child: const Text(
                'Save',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          children: [
            // Basic Information
            _buildBasicInfoSection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Icon and Color Selection
            _buildCustomizationSection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Category and Difficulty
            _buildCategorySection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Frequency Settings
            _buildFrequencySection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Target and Units
            _buildTargetSection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Reminder Settings
            _buildReminderSection(),
            const SizedBox(height: UIConstants.spacingLG),

            // Status Toggle
            _buildStatusSection(),
            const SizedBox(height: UIConstants.spacingXL),

            // Action Buttons
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Basic Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Habit Name *',
                hintText: 'e.g., Morning Exercise',
                prefixIcon: Icon(Icons.edit),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a habit name';
                }
                if (value.trim().length < 2) {
                  return 'Habit name must be at least 2 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: UIConstants.spacingMD),

            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                hintText: 'What does this habit involve?',
                prefixIcon: Icon(Icons.description),
              ),
              maxLines: 3,
              maxLength: 200,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomizationSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customization',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            // Icon Selection
            Text(
              'Choose an Icon',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            SizedBox(
              height: 60,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _availableIcons.length,
                itemBuilder: (context, index) {
                  final icon = _availableIcons[index];
                  final isSelected = icon == _selectedIcon;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedIcon = icon),
                    child: Container(
                      width: 50,
                      height: 50,
                      margin: const EdgeInsets.only(right: UIConstants.spacingSM),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryColor.withOpacity(0.2)
                            : Colors.grey.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                        border: isSelected
                            ? Border.all(color: AppTheme.primaryColor, width: 2)
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          icon,
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            // Color Selection
            Text(
              'Choose a Color',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _availableColors.length,
                itemBuilder: (context, index) {
                  final color = _availableColors[index];
                  final isSelected = color == _selectedColor;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedColor = color),
                    child: Container(
                      width: 32,
                      height: 32,
                      margin: const EdgeInsets.only(right: UIConstants.spacingSM),
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: isSelected
                            ? Border.all(color: Colors.black, width: 3)
                            : Border.all(color: Colors.grey.shade300),
                      ),
                      child: isSelected
                          ? const Icon(Icons.check, color: Colors.white, size: 16)
                          : null,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategorySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Category & Difficulty',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            DropdownButtonFormField<HabitCategory>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Category',
                prefixIcon: Icon(Icons.category),
              ),
              items: HabitCategory.values.map((category) {
                return DropdownMenuItem(
                  value: category,
                  child: Text(_getCategoryName(category)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedCategory = value);
                }
              },
            ),
            const SizedBox(height: UIConstants.spacingMD),

            DropdownButtonFormField<HabitDifficulty?>(
              value: _selectedDifficulty,
              decoration: const InputDecoration(
                labelText: 'Difficulty (Optional)',
                prefixIcon: Icon(Icons.fitness_center),
              ),
              items: [
                const DropdownMenuItem<HabitDifficulty?>(
                  value: null,
                  child: Text('Not set'),
                ),
                ...HabitDifficulty.values.map((difficulty) {
                  return DropdownMenuItem(
                    value: difficulty,
                    child: Text(_getDifficultyName(difficulty)),
                  );
                }),
              ],
              onChanged: (value) => setState(() => _selectedDifficulty = value),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFrequencySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Frequency',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            DropdownButtonFormField<HabitFrequency>(
              value: _selectedFrequency,
              decoration: const InputDecoration(
                labelText: 'How often?',
                prefixIcon: Icon(Icons.repeat),
              ),
              items: HabitFrequency.values.map((frequency) {
                return DropdownMenuItem(
                  value: frequency,
                  child: Text(_getFrequencyName(frequency)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedFrequency = value);
                }
              },
            ),

            // Weekly frequency specific options
            if (_selectedFrequency == HabitFrequency.weekly) ...[
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                'Select Days',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Wrap(
                spacing: 8,
                children: List.generate(7, (index) {
                  final weekday = index + 1;
                  final isSelected = _selectedWeekdays.contains(weekday);
                  final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                  return FilterChip(
                    label: Text(dayNames[index]),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedWeekdays.add(weekday);
                        } else {
                          _selectedWeekdays.remove(weekday);
                        }
                      });
                    },
                    selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                    checkmarkColor: AppTheme.primaryColor,
                  );
                }),
              ),
            ],

            // Custom frequency specific options
            if (_selectedFrequency == HabitFrequency.custom) ...[
              const SizedBox(height: UIConstants.spacingMD),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Every X days',
                  hintText: 'e.g., 3 (every 3 days)',
                  prefixIcon: Icon(Icons.schedule),
                ),
                keyboardType: TextInputType.number,
                initialValue: _customInterval?.toString(),
                validator: (value) {
                  if (_selectedFrequency == HabitFrequency.custom) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter interval';
                    }
                    final interval = int.tryParse(value);
                    if (interval == null || interval < 1) {
                      return 'Please enter a valid number';
                    }
                  }
                  return null;
                },
                onChanged: (value) {
                  _customInterval = int.tryParse(value);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTargetSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Target & Units',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _targetValueController,
                    decoration: const InputDecoration(
                      labelText: 'Target Value (Optional)',
                      hintText: 'e.g., 30',
                      prefixIcon: Icon(Icons.flag),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: TextFormField(
                    controller: _unitController,
                    decoration: const InputDecoration(
                      labelText: 'Unit',
                      hintText: 'e.g., minutes',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Set a target value if your habit is measurable (e.g., "30 minutes", "5 pages", "2 liters")',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReminderSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reminders',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.alarm),
              title: const Text('Reminder Time'),
              subtitle: Text(
                _reminderTime != null
                    ? _reminderTime!.format(context)
                    : 'No reminder set',
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_reminderTime != null)
                    IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _reminderTime = null),
                    ),
                  IconButton(
                    icon: const Icon(Icons.access_time),
                    onPressed: _selectReminderTime,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Status',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Active'),
              subtitle: Text(
                _isActive
                    ? 'This habit is currently active'
                    : 'This habit is paused',
              ),
              value: _isActive,
              onChanged: (value) => setState(() => _isActive = value),
              secondary: Icon(
                _isActive ? Icons.play_arrow : Icons.pause,
                color: _isActive ? Colors.green : Colors.orange,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _saveHabit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingMD),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text(
                    'Save Changes',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: UIConstants.spacingMD),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isLoading ? null : () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingMD),
            ),
            child: const Text(
              'Cancel',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectReminderTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _reminderTime ?? const TimeOfDay(hour: 9, minute: 0),
    );

    if (time != null) {
      setState(() => _reminderTime = time);
    }
  }

  Future<void> _saveHabit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Validate weekly frequency
    if (_selectedFrequency == HabitFrequency.weekly && _selectedWeekdays.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one day for weekly habits'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final updatedHabit = widget.habit.copyWith(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _selectedCategory,
        frequency: _selectedFrequency,
        icon: _selectedIcon,
        isActive: _isActive,
        weekdays: _selectedWeekdays,
        reminderTime: _reminderTime,
        difficulty: _selectedDifficulty,
        color: _selectedColor,
        targetValue: _targetValueController.text.isNotEmpty
            ? double.tryParse(_targetValueController.text)
            : null,
        unit: _unitController.text.isNotEmpty ? _unitController.text.trim() : null,
        customInterval: _customInterval,
        updatedAt: DateTime.now(),
      );

      final habitNotifier = ref.read(habitProvider.notifier);
      final success = await habitNotifier.updateHabit(updatedHabit);

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Habit updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to update habit. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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

  String _getDifficultyName(HabitDifficulty difficulty) {
    switch (difficulty) {
      case HabitDifficulty.easy:
        return 'Easy';
      case HabitDifficulty.medium:
        return 'Medium';
      case HabitDifficulty.hard:
        return 'Hard';
      case HabitDifficulty.expert:
        return 'Expert';
    }
  }

  String _getFrequencyName(HabitFrequency frequency) {
    switch (frequency) {
      case HabitFrequency.daily:
        return 'Daily';
      case HabitFrequency.weekly:
        return 'Weekly';
      case HabitFrequency.monthly:
        return 'Monthly';
      case HabitFrequency.custom:
        return 'Custom';
    }
  }
}

// Add these enums if they don't exist in the habit model
enum HabitDifficulty {
  easy,
  medium,
  hard,
  expert,
}