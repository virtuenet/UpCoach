import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/mood_model.dart';
import '../providers/mood_provider.dart';

class CreateMoodScreen extends ConsumerStatefulWidget {
  final MoodModel? existingMood;

  const CreateMoodScreen({
    super.key,
    this.existingMood,
  });

  @override
  ConsumerState<CreateMoodScreen> createState() => _CreateMoodScreenState();
}

class _CreateMoodScreenState extends ConsumerState<CreateMoodScreen> {
  late MoodLevel _selectedLevel;
  final Set<MoodCategory> _selectedCategories = {};
  final _noteController = TextEditingController();
  final _activityController = TextEditingController();
  final List<String> _activities = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.existingMood != null) {
      _selectedLevel = widget.existingMood!.level;
      _selectedCategories.addAll(widget.existingMood!.categories);
      _noteController.text = widget.existingMood!.note ?? '';
      _activities.addAll(widget.existingMood!.activities);
    } else {
      _selectedLevel = MoodLevel.neutral;
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    _activityController.dispose();
    super.dispose();
  }

  void _addActivity() {
    final activity = _activityController.text.trim();
    if (activity.isNotEmpty) {
      setState(() {
        _activities.add(activity);
        _activityController.clear();
      });
    }
  }

  void _removeActivity(int index) {
    setState(() {
      _activities.removeAt(index);
    });
  }

  Future<void> _saveMood() async {
    setState(() {
      _isLoading = true;
    });

    try {
      if (widget.existingMood != null) {
        await ref.read(moodProvider.notifier).updateMoodEntry(
          moodId: widget.existingMood!.id,
          level: _selectedLevel,
          categories: _selectedCategories.toList(),
          note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
          activities: _activities,
        );
      } else {
        await ref.read(moodProvider.notifier).createMoodEntry(
          level: _selectedLevel,
          categories: _selectedCategories.toList(),
          note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
          activities: _activities,
        );
      }

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.existingMood != null 
                  ? 'Mood updated successfully' 
                  : 'Mood logged successfully',
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save mood: $e'),
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

  Future<void> _deleteMood() async {
    if (widget.existingMood == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Mood Entry'),
        content: const Text('Are you sure you want to delete this mood entry?'),
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
        await ref.read(moodProvider.notifier).deleteMoodEntry(widget.existingMood!.id);
        if (mounted) {
          context.pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Mood entry deleted'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete mood: $e'),
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
        title: Text(widget.existingMood != null ? 'Edit Mood' : 'Log Your Mood'),
        actions: [
          if (widget.existingMood != null)
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _deleteMood,
            ),
          TextButton(
            onPressed: _isLoading ? null : _saveMood,
            child: const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          // Mood Level Selection
          Text(
            'How are you feeling?',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingLG),
          
          // Mood level selector
          Container(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: MoodLevel.values.map((level) {
                final isSelected = _selectedLevel == level;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedLevel = level;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isSelected
                          ? _getMoodColor(level)
                          : _getMoodColor(level).withOpacity(0.3),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: _getMoodColor(level).withOpacity(0.5),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ]
                          : [],
                    ),
                    child: Center(
                      child: Text(
                        _getMoodEmoji(level),
                        style: TextStyle(
                          fontSize: isSelected ? 32 : 24,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          
          Text(
            _getMoodLabel(_selectedLevel),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: _getMoodColor(_selectedLevel),
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: UIConstants.spacingXL),
          
          // Mood Categories
          Text(
            'What describes your mood?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: MoodCategory.values.map((category) {
              final isSelected = _selectedCategories.contains(category);
              return FilterChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(MoodModel.getCategoryEmoji(category)),
                    const SizedBox(width: UIConstants.spacingXS),
                    Text(MoodModel.getCategoryLabel(category)),
                  ],
                ),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedCategories.add(category);
                    } else {
                      _selectedCategories.remove(category);
                    }
                  });
                },
                selectedColor: AppTheme.primaryColor.withOpacity(0.2),
              );
            }).toList(),
          ),
          
          const SizedBox(height: UIConstants.spacingXL),
          
          // Activities
          Text(
            'What have you been doing?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _activityController,
                  decoration: const InputDecoration(
                    hintText: 'Add an activity',
                    prefixIcon: Icon(Icons.local_activity),
                  ),
                  textCapitalization: TextCapitalization.sentences,
                  onSubmitted: (_) => _addActivity(),
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              IconButton(
                onPressed: _addActivity,
                icon: const Icon(Icons.add_circle),
                color: AppTheme.primaryColor,
              ),
            ],
          ),
          
          if (_activities.isNotEmpty) ...[
            const SizedBox(height: UIConstants.spacingSM),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _activities.asMap().entries.map((entry) {
                return Chip(
                  label: Text(entry.value),
                  onDeleted: () => _removeActivity(entry.key),
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                );
              }).toList(),
            ),
          ],
          
          const SizedBox(height: UIConstants.spacingXL),
          
          // Note
          Text(
            'Any thoughts to share?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(
              hintText: 'Write your thoughts here...',
              prefixIcon: Icon(Icons.note),
              alignLabelWithHint: true,
            ),
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
          ),
          
          const SizedBox(height: UIConstants.spacingXL),
          
          // Save button
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _saveMood,
            icon: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.save),
            label: Text(
              _isLoading 
                  ? 'Saving...' 
                  : widget.existingMood != null 
                      ? 'Update Mood' 
                      : 'Save Mood',
            ),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
    );
  }

  Color _getMoodColor(MoodLevel level) {
    switch (level) {
      case MoodLevel.veryBad:
        return Colors.red;
      case MoodLevel.bad:
        return Colors.orange;
      case MoodLevel.neutral:
        return Colors.amber;
      case MoodLevel.good:
        return Colors.lightGreen;
      case MoodLevel.veryGood:
        return Colors.green;
    }
  }

  String _getMoodEmoji(MoodLevel level) {
    switch (level) {
      case MoodLevel.veryBad:
        return '😢';
      case MoodLevel.bad:
        return '😕';
      case MoodLevel.neutral:
        return '😐';
      case MoodLevel.good:
        return '🙂';
      case MoodLevel.veryGood:
        return '😄';
    }
  }

  String _getMoodLabel(MoodLevel level) {
    switch (level) {
      case MoodLevel.veryBad:
        return 'Very Bad';
      case MoodLevel.bad:
        return 'Bad';
      case MoodLevel.neutral:
        return 'Neutral';
      case MoodLevel.good:
        return 'Good';
      case MoodLevel.veryGood:
        return 'Very Good';
    }
  }
} 