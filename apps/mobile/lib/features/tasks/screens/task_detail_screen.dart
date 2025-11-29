import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/task_model.dart';
import '../providers/task_provider.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final TaskModel task;

  const TaskDetailScreen({
    super.key,
    required this.task,
  });

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  late TaskModel _task;
  bool _isEditing = false;
  bool _isLoading = false;

  // Edit controllers
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _tagsController;
  late TaskPriority _priority;
  late TaskCategory _category;
  late TaskStatus _status;
  DateTime? _dueDate;
  TimeOfDay? _dueTime;

  @override
  void initState() {
    super.initState();
    _task = widget.task;
    _initializeControllers();
  }

  void _initializeControllers() {
    _titleController = TextEditingController(text: _task.title);
    _descriptionController = TextEditingController(text: _task.description ?? '');
    _tagsController = TextEditingController(text: _task.tags.join(', '));
    _priority = _task.priority;
    _category = _task.category;
    _status = _task.status;
    _dueDate = _task.dueDate;
    if (_task.dueDate != null) {
      _dueTime = TimeOfDay.fromDateTime(_task.dueDate!);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() {
        _dueDate = date;
      });
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _dueTime ?? TimeOfDay.now(),
    );
    
    if (time != null) {
      setState(() {
        _dueTime = time;
      });
    }
  }

  DateTime? _getCombinedDateTime() {
    if (_dueDate == null) return null;
    
    final date = _dueDate!;
    final time = _dueTime ?? const TimeOfDay(hour: 23, minute: 59);
    
    return DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
  }

  List<String> _getTags() {
    final tagsText = _tagsController.text.trim();
    if (tagsText.isEmpty) return [];
    
    return tagsText
        .split(',')
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList();
  }

  Future<void> _saveChanges() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Title cannot be empty'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(taskProvider.notifier).updateTask(
        taskId: _task.id,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isEmpty 
            ? null 
            : _descriptionController.text.trim(),
        priority: _priority,
        status: _status,
        category: _category,
        dueDate: _getCombinedDateTime(),
        tags: _getTags(),
      );

      // Update local task
      setState(() {
        _task = _task.copyWith(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty 
              ? null 
              : _descriptionController.text.trim(),
          priority: _priority,
          status: _status,
          category: _category,
          dueDate: _getCombinedDateTime(),
          tags: _getTags(),
        );
        _isEditing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Task updated successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update task: $e'),
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

  Future<void> _deleteTask() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Are you sure you want to delete "${_task.title}"?'),
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
        await ref.read(taskProvider.notifier).deleteTask(_task.id);
        if (mounted) {
          context.pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Task deleted successfully'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete task: $e'),
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
        title: const Text('Task Details'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() {
                  _isEditing = true;
                });
              },
            )
          else
            TextButton(
              onPressed: _isLoading ? null : _saveChanges,
              child: const Text('Save'),
            ),
        ],
      ),
      body: _isEditing ? _buildEditView() : _buildDetailView(),
    );
  }

  Widget _buildDetailView() {
    return ListView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      children: [
        // Task completion status
        Card(
          child: CheckboxListTile(
            title: Text(
              _task.title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                decoration: _task.isCompleted 
                    ? TextDecoration.lineThrough 
                    : null,
              ),
            ),
            value: _task.isCompleted,
            onChanged: (value) {
              ref.read(taskProvider.notifier).toggleTaskCompletion(_task.id);
              setState(() {
                _task = _task.copyWith(
                  status: value! ? TaskStatus.completed : TaskStatus.pending,
                );
              });
            },
          ),
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Task details
        Card(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_task.description != null && _task.description!.isNotEmpty) ...[
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Text(
                    _task.description!,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                ],
                
                _buildInfoRow('Category', _task.categoryLabel, 
                    icon: _getCategoryIcon(_task.category)),
                const SizedBox(height: UIConstants.spacingMD),
                
                _buildInfoRow('Priority', _task.priorityLabel,
                    color: _getPriorityColor(_task.priority)),
                const SizedBox(height: UIConstants.spacingMD),
                
                _buildInfoRow('Status', _getStatusLabel(_task.status),
                    color: _getStatusColor(_task.status)),
                const SizedBox(height: UIConstants.spacingMD),
                
                if (_task.dueDate != null) ...[
                  _buildInfoRow(
                    'Due Date',
                    DateFormat('MMM d, yyyy - h:mm a').format(_task.dueDate!),
                    icon: Icons.calendar_today,
                    color: _getDueDateColor(),
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                ],
                
                if (_task.tags.isNotEmpty) ...[
                  Text(
                    'Tags',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _task.tags.map((tag) => Chip(
                      label: Text(tag),
                      backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                    )).toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Timestamps
        Card(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow(
                  'Created',
                  DateFormat('MMM d, yyyy - h:mm a').format(_task.createdAt),
                  icon: Icons.access_time,
                ),
                const SizedBox(height: UIConstants.spacingMD),
                _buildInfoRow(
                  'Last Updated',
                  DateFormat('MMM d, yyyy - h:mm a').format(_task.updatedAt),
                  icon: Icons.update,
                ),
                if (_task.completedAt != null) ...[
                  const SizedBox(height: UIConstants.spacingMD),
                  _buildInfoRow(
                    'Completed',
                    DateFormat('MMM d, yyyy - h:mm a').format(_task.completedAt!),
                    icon: Icons.check_circle,
                    color: AppTheme.successColor,
                  ),
                ],
              ],
            ),
          ),
        ),
        
        const SizedBox(height: UIConstants.spacingXL),
        
        // Delete button
        OutlinedButton.icon(
          onPressed: _deleteTask,
          icon: const Icon(Icons.delete),
          label: const Text('Delete Task'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.errorColor,
            side: const BorderSide(color: AppTheme.errorColor),
          ),
        ),
      ],
    );
  }

  Widget _buildEditView() {
    return ListView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      children: [
        // Title
        TextFormField(
          controller: _titleController,
          decoration: const InputDecoration(
            labelText: 'Task Title',
            hintText: 'Enter task title',
            prefixIcon: Icon(Icons.title),
          ),
          textCapitalization: TextCapitalization.sentences,
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Description
        TextFormField(
          controller: _descriptionController,
          decoration: const InputDecoration(
            labelText: 'Description (optional)',
            hintText: 'Enter task description',
            prefixIcon: Icon(Icons.description),
            alignLabelWithHint: true,
          ),
          maxLines: 3,
          textCapitalization: TextCapitalization.sentences,
        ),
        
        const SizedBox(height: UIConstants.spacingLG),
        
        // Status
        Text(
          'Status',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Wrap(
          spacing: 8,
          children: TaskStatus.values.map((status) {
            return ChoiceChip(
              label: Text(_getStatusLabel(status)),
              selected: _status == status,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _status = status;
                  });
                }
              },
            );
          }).toList(),
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
          children: TaskCategory.values.map((category) {
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
          children: TaskPriority.values.map((priority) {
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
        
        // Due Date & Time
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: _selectDate,
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Due Date',
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _dueDate == null
                        ? 'Select date'
                        : DateFormat('MMM d, yyyy').format(_dueDate!),
                  ),
                ),
              ),
            ),
            const SizedBox(width: UIConstants.spacingMD),
            Expanded(
              child: InkWell(
                onTap: _dueDate == null ? null : _selectTime,
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Time',
                    prefixIcon: const Icon(Icons.access_time),
                    enabled: _dueDate != null,
                  ),
                  child: Text(
                    _dueTime == null
                        ? 'Select time'
                        : _dueTime!.format(context),
                    style: TextStyle(
                      color: _dueDate == null
                          ? AppTheme.textSecondary
                          : null,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Tags
        TextFormField(
          controller: _tagsController,
          decoration: const InputDecoration(
            labelText: 'Tags (optional)',
            hintText: 'Enter tags separated by commas',
            prefixIcon: Icon(Icons.label),
          ),
          textCapitalization: TextCapitalization.words,
        ),
        
        const SizedBox(height: UIConstants.spacingXL),
        
        // Action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _isLoading ? null : () {
                  setState(() {
                    _isEditing = false;
                    _initializeControllers();
                  });
                },
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(width: UIConstants.spacingMD),
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveChanges,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {
    IconData? icon,
    Color? color,
  }) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(
            icon,
            size: 20,
            color: color ?? AppTheme.textSecondary,
          ),
          const SizedBox(width: UIConstants.spacingSM),
        ],
        Text(
          '$label: ',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: AppTheme.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: color != null ? FontWeight.w600 : null,
          ),
        ),
      ],
    );
  }

  String _getCategoryLabel(TaskCategory category) => _task.categoryLabel;
  String _getPriorityLabel(TaskPriority priority) => _task.priorityLabel;
  
  String _getStatusLabel(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return 'Pending';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.completed:
        return 'Completed';
      case TaskStatus.cancelled:
        return 'Cancelled';
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

  Color _getStatusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return AppTheme.warningColor;
      case TaskStatus.inProgress:
        return AppTheme.infoColor;
      case TaskStatus.completed:
        return AppTheme.successColor;
      case TaskStatus.cancelled:
        return AppTheme.textSecondary;
    }
  }

  Color _getDueDateColor() {
    if (_task.isCompleted) return AppTheme.textSecondary;
    if (_task.isOverdue) return AppTheme.errorColor;
    if (_task.isDueToday) return AppTheme.warningColor;
    if (_task.isDueTomorrow) return AppTheme.infoColor;
    return AppTheme.textSecondary;
  }
} 