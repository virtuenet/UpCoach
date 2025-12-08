import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

class CreateHabitScreen extends ConsumerStatefulWidget {
  final Habit? habitToEdit;

  const CreateHabitScreen({super.key, this.habitToEdit});

  @override
  ConsumerState<CreateHabitScreen> createState() => _CreateHabitScreenState();
}

class _CreateHabitScreenState extends ConsumerState<CreateHabitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetValueController = TextEditingController(text: '1');
  final _unitController = TextEditingController();
  final _customIntervalController = TextEditingController();

  HabitType _selectedType = HabitType.simple;
  HabitFrequency _selectedFrequency = HabitFrequency.daily;
  HabitCategory _selectedCategory = HabitCategory.other;
  String _selectedColor = '#4A90E2';
  String _selectedIcon = '🎯';
  final List<int> _selectedWeekdays = [];
  DateTime? _startDate;
  DateTime? _endDate;
  bool _hasReminder = false;
  TimeOfDay? _reminderTime;

  final List<String> _availableIcons = [
    '🎯',
    '💪',
    '📚',
    '🧘',
    '🏃',
    '💧',
    '🍎',
    '🎨',
    '💰',
    '🎵',
    '📝',
    '🌱',
    '☀️',
    '🌙',
    '⭐',
    '🔥',
    '💡',
    '🎪',
    '🎭',
    '🎨',
    '📊',
    '🏆',
    '🎖️',
    '👑',
  ];

  final List<String> _availableColors = [
    '#4A90E2',
    '#50C878',
    '#F39C12',
    '#E74C3C',
    '#9B59B6',
    '#1ABC9C',
    '#34495E',
    '#F1C40F',
    '#E67E22',
    '#95A5A6',
    '#3498DB',
    '#2ECC71',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _targetValueController.dispose();
    _unitController.dispose();
    _customIntervalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Habit'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: habitState.isSaving ? null : _saveHabit,
            child: habitState.isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(color: Colors.white, fontSize: 16),
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
            _buildSection(
              title: 'Basic Information',
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Habit Name *',
                    hintText: 'e.g., Drink 8 glasses of water',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.edit),
                  ),
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Please enter a habit name';
                    }
                    return null;
                  },
                  textCapitalization: TextCapitalization.sentences,
                ),
                const SizedBox(height: UIConstants.spacingMD),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description (Optional)',
                    hintText: 'Why is this habit important to you?',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.description),
                  ),
                  maxLines: 3,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Habit Type
            _buildSection(
              title: 'Habit Type',
              children: [
                _buildTypeSelector(),
                if (_selectedType != HabitType.simple) ...[
                  const SizedBox(height: UIConstants.spacingMD),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _targetValueController,
                          decoration: const InputDecoration(
                            labelText: 'Target',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) {
                            if (value?.isEmpty ?? true) {
                              return 'Required';
                            }
                            if (int.tryParse(value!) == null) {
                              return 'Invalid number';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: UIConstants.spacingMD),
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: _unitController,
                          decoration: InputDecoration(
                            labelText: _selectedType == HabitType.time
                                ? 'minutes'
                                : 'Unit',
                            border: const OutlineInputBorder(),
                            hintText: _getUnitHint(),
                          ),
                          enabled: _selectedType != HabitType.time,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Frequency
            _buildSection(
              title: 'Frequency',
              children: [
                _buildFrequencySelector(),
                if (_selectedFrequency == HabitFrequency.weekly) ...[
                  const SizedBox(height: UIConstants.spacingMD),
                  _buildWeekdaySelector(),
                ],
                if (_selectedFrequency == HabitFrequency.custom) ...[
                  const SizedBox(height: UIConstants.spacingMD),
                  TextFormField(
                    controller: _customIntervalController,
                    decoration: const InputDecoration(
                      labelText: 'Every X days',
                      border: OutlineInputBorder(),
                      suffixText: 'days',
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (_selectedFrequency == HabitFrequency.custom) {
                        if (value?.isEmpty ?? true) {
                          return 'Please enter interval';
                        }
                        final interval = int.tryParse(value!);
                        if (interval == null || interval < 1) {
                          return 'Must be at least 1 day';
                        }
                      }
                      return null;
                    },
                  ),
                ],
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Customization
            _buildSection(
              title: 'Customization',
              children: [
                _buildCategorySelector(),
                const SizedBox(height: UIConstants.spacingMD),
                _buildIconSelector(),
                const SizedBox(height: UIConstants.spacingMD),
                _buildColorSelector(),
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Schedule (Optional)
            _buildSection(
              title: 'Schedule (Optional)',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ListTile(
                        title: const Text('Start Date'),
                        subtitle: Text(
                            _startDate?.toString().split(' ')[0] ?? 'Not set'),
                        trailing: const Icon(Icons.calendar_today),
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _startDate ?? DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 365)),
                          );
                          if (date != null) {
                            setState(() {
                              _startDate = date;
                            });
                          }
                        },
                      ),
                    ),
                    Expanded(
                      child: ListTile(
                        title: const Text('End Date'),
                        subtitle: Text(
                            _endDate?.toString().split(' ')[0] ?? 'Not set'),
                        trailing: const Icon(Icons.calendar_today),
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _endDate ??
                                DateTime.now().add(const Duration(days: 30)),
                            firstDate: _startDate ?? DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 365)),
                          );
                          if (date != null) {
                            setState(() {
                              _endDate = date;
                            });
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Reminders
            _buildSection(
              title: 'Reminders',
              children: [
                SwitchListTile(
                  title: const Text('Enable Reminder'),
                  subtitle: Text(_hasReminder && _reminderTime != null
                      ? 'Daily at ${_reminderTime!.format(context)}'
                      : 'No reminder set'),
                  value: _hasReminder,
                  onChanged: (value) {
                    setState(() {
                      _hasReminder = value;
                      if (value && _reminderTime == null) {
                        _reminderTime = const TimeOfDay(hour: 9, minute: 0);
                      }
                    });
                  },
                ),
                if (_hasReminder)
                  ListTile(
                    title: const Text('Reminder Time'),
                    subtitle: Text(_reminderTime?.format(context) ?? 'Not set'),
                    trailing: const Icon(Icons.access_time),
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: _reminderTime ??
                            const TimeOfDay(hour: 9, minute: 0),
                      );
                      if (time != null) {
                        setState(() {
                          _reminderTime = time;
                        });
                      }
                    },
                  ),
              ],
            ),

            const SizedBox(height: UIConstants.spacingXL),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
      {required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryColor,
          ),
        ),
        const SizedBox(height: UIConstants.spacingMD),
        ...children,
      ],
    );
  }

  Widget _buildTypeSelector() {
    return RadioGroup<HabitType>(
      groupValue: _selectedType,
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _selectedType = value;
            if (value == HabitType.time) {
              _unitController.text = 'minutes';
            }
          });
        }
      },
      child: Column(
        children: HabitType.values.map((type) {
          return RadioListTile<HabitType>(
            title: Text(_getTypeTitle(type)),
            subtitle: Text(_getTypeDescription(type)),
            value: type,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFrequencySelector() {
    return RadioGroup<HabitFrequency>(
      groupValue: _selectedFrequency,
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _selectedFrequency = value;
          });
        }
      },
      child: Column(
        children: HabitFrequency.values.map((frequency) {
          return RadioListTile<HabitFrequency>(
            title: Text(_getFrequencyTitle(frequency)),
            subtitle: Text(_getFrequencyDescription(frequency)),
            value: frequency,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildWeekdaySelector() {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Days:',
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Wrap(
          spacing: 8,
          children: List.generate(7, (index) {
            final dayNumber = index + 1;
            final isSelected = _selectedWeekdays.contains(dayNumber);

            return FilterChip(
              label: Text(weekdays[index]),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _selectedWeekdays.add(dayNumber);
                  } else {
                    _selectedWeekdays.remove(dayNumber);
                  }
                });
              },
              selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
              checkmarkColor: AppTheme.primaryColor,
            );
          }),
        ),
      ],
    );
  }

  Widget _buildCategorySelector() {
    return DropdownButtonFormField<HabitCategory>(
      initialValue: _selectedCategory,
      decoration: const InputDecoration(
        labelText: 'Category',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.category),
      ),
      items: HabitCategory.values.map((category) {
        return DropdownMenuItem(
          value: category,
          child: Text(_getCategoryName(category)),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedCategory = value!;
        });
      },
    );
  }

  Widget _buildIconSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Icon:',
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        SizedBox(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _availableIcons.length,
            itemBuilder: (context, index) {
              final icon = _availableIcons[index];
              final isSelected = _selectedIcon == icon;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedIcon = icon;
                  });
                },
                child: Container(
                  width: 50,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primaryColor.withValues(alpha: 0.2)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(
                      color: isSelected
                          ? AppTheme.primaryColor
                          : Colors.grey.shade300,
                      width: 2,
                    ),
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
      ],
    );
  }

  Widget _buildColorSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Color:',
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableColors.map((color) {
            final isSelected = _selectedColor == color;

            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedColor = color;
                });
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Color(int.parse('0xFF${color.substring(1)}')),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? Colors.black : Colors.grey.shade300,
                    width: isSelected ? 3 : 1,
                  ),
                ),
                child: isSelected
                    ? const Icon(Icons.check, color: Colors.white)
                    : null,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Future<void> _saveHabit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedFrequency == HabitFrequency.weekly &&
        _selectedWeekdays.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one day for weekly habits'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final habit = Habit(
      id: '', // Will be set by service
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      type: _selectedType,
      frequency: _selectedFrequency,
      category: _selectedCategory,
      icon: _selectedIcon,
      color: _selectedColor,
      targetValue: int.tryParse(_targetValueController.text) ?? 1,
      unit: _unitController.text.trim(),
      createdAt: DateTime.now(),
      weekdays: _selectedWeekdays,
      customInterval: _selectedFrequency == HabitFrequency.custom
          ? int.tryParse(_customIntervalController.text)
          : null,
      startDate: _startDate,
      endDate: _endDate,
      hasReminder: _hasReminder,
      reminderTime: _hasReminder && _reminderTime != null
          ? DateTime(2000, 1, 1, _reminderTime!.hour, _reminderTime!.minute)
          : null,
    );

    final success = await ref.read(habitProvider.notifier).createHabit(habit);

    if (success && mounted) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${habit.name} created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  String _getTypeTitle(HabitType type) {
    switch (type) {
      case HabitType.simple:
        return 'Simple Habit';
      case HabitType.count:
        return 'Count Habit';
      case HabitType.time:
        return 'Time Habit';
      case HabitType.value:
        return 'Value Habit';
    }
  }

  String _getTypeDescription(HabitType type) {
    switch (type) {
      case HabitType.simple:
        return 'Yes/No completion (e.g., "Did I meditate?")';
      case HabitType.count:
        return 'Track number of times (e.g., "10 push-ups")';
      case HabitType.time:
        return 'Track duration (e.g., "30 minutes reading")';
      case HabitType.value:
        return 'Track numeric value (e.g., "8 glasses of water")';
    }
  }

  String _getFrequencyTitle(HabitFrequency frequency) {
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

  String _getFrequencyDescription(HabitFrequency frequency) {
    switch (frequency) {
      case HabitFrequency.daily:
        return 'Every day';
      case HabitFrequency.weekly:
        return 'Select specific days of the week';
      case HabitFrequency.monthly:
        return 'Once per month';
      case HabitFrequency.custom:
        return 'Custom interval in days';
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

  String _getUnitHint() {
    switch (_selectedType) {
      case HabitType.simple:
        return '';
      case HabitType.count:
        return 'times, reps, etc.';
      case HabitType.time:
        return 'minutes';
      case HabitType.value:
        return 'glasses, pages, etc.';
    }
  }
}
