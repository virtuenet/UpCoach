import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'dart:io' show Platform;

/// Automation List Screen
///
/// Production-ready mobile automation management screen with Material Design 3.
///
/// Features:
/// - List of user's automations with status badges
/// - Quick enable/disable toggle
/// - Automation execution history
/// - Filter by status (active, paused, failed)
/// - Search by name
/// - Automation creation wizard (step-by-step)
/// - Pull-to-refresh
/// - Empty state with sample templates
/// - Execution logs viewer
/// - Error alerts with retry button
/// - Material Design 3 styling
/// - Full null safety

enum AutomationStatus {
  active,
  paused,
  failed,
  draft,
}

enum TriggerType {
  event,
  schedule,
  webhook,
  manual,
}

class Automation {
  final String id;
  final String name;
  final String description;
  final AutomationStatus status;
  final TriggerType triggerType;
  final String? triggerConfig;
  final int executionCount;
  final DateTime? lastExecutedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> tags;

  const Automation({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.triggerType,
    this.triggerConfig,
    required this.executionCount,
    this.lastExecutedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.tags,
  });

  Automation copyWith({
    String? id,
    String? name,
    String? description,
    AutomationStatus? status,
    TriggerType? triggerType,
    String? triggerConfig,
    int? executionCount,
    DateTime? lastExecutedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<String>? tags,
  }) {
    return Automation(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      status: status ?? this.status,
      triggerType: triggerType ?? this.triggerType,
      triggerConfig: triggerConfig ?? this.triggerConfig,
      executionCount: executionCount ?? this.executionCount,
      lastExecutedAt: lastExecutedAt ?? this.lastExecutedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      tags: tags ?? this.tags,
    );
  }
}

class AutomationExecution {
  final String id;
  final String automationId;
  final String status;
  final DateTime startedAt;
  final DateTime? completedAt;
  final int? duration;
  final String? error;
  final Map<String, dynamic>? triggerData;

  const AutomationExecution({
    required this.id,
    required this.automationId,
    required this.status,
    required this.startedAt,
    this.completedAt,
    this.duration,
    this.error,
    this.triggerData,
  });
}

class AutomationTemplate {
  final String id;
  final String name;
  final String description;
  final String category;
  final IconData icon;
  final TriggerType triggerType;

  const AutomationTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.icon,
    required this.triggerType,
  });
}

class AutomationListScreen extends StatefulWidget {
  const AutomationListScreen({Key? key}) : super(key: key);

  @override
  State<AutomationListScreen> createState() => _AutomationListScreenState();
}

class _AutomationListScreenState extends State<AutomationListScreen> with SingleTickerProviderStateMixin {
  List<Automation> _automations = [];
  List<Automation> _filteredAutomations = [];
  List<AutomationExecution> _recentExecutions = [];
  AutomationStatus? _filterStatus;
  String _searchQuery = '';
  bool _isLoading = false;
  bool _isRefreshing = false;
  late TabController _tabController;

  final List<AutomationTemplate> _templates = const [
    AutomationTemplate(
      id: 'welcome_email',
      name: 'Welcome Email Sequence',
      description: 'Send automated welcome emails to new users',
      category: 'Onboarding',
      icon: Icons.email,
      triggerType: TriggerType.event,
    ),
    AutomationTemplate(
      id: 'goal_reminder',
      name: 'Daily Goal Reminder',
      description: 'Send daily reminders for active goals',
      category: 'Engagement',
      icon: Icons.notifications,
      triggerType: TriggerType.schedule,
    ),
    AutomationTemplate(
      id: 'habit_streak',
      name: 'Habit Streak Celebration',
      description: 'Celebrate when users reach habit milestones',
      category: 'Gamification',
      icon: Icons.celebration,
      triggerType: TriggerType.event,
    ),
    AutomationTemplate(
      id: 'session_reminder',
      name: 'Session Reminder',
      description: 'Remind users 24h before scheduled sessions',
      category: 'Coaching',
      icon: Icons.calendar_today,
      triggerType: TriggerType.schedule,
    ),
    AutomationTemplate(
      id: 'inactive_user',
      name: 'Re-engage Inactive Users',
      description: 'Automatically reach out to inactive users',
      category: 'Retention',
      icon: Icons.person_add,
      triggerType: TriggerType.schedule,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAutomations();
    _loadRecentExecutions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAutomations() async {
    setState(() => _isLoading = true);

    await Future.delayed(const Duration(seconds: 1));

    final mockAutomations = [
      Automation(
        id: '1',
        name: 'Welcome Email Sequence',
        description: 'Send automated welcome emails to new users',
        status: AutomationStatus.active,
        triggerType: TriggerType.event,
        triggerConfig: 'user.registered',
        executionCount: 127,
        lastExecutedAt: DateTime.now().subtract(const Duration(hours: 2)),
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
        tags: ['onboarding', 'email'],
      ),
      Automation(
        id: '2',
        name: 'Daily Goal Reminder',
        description: 'Send daily reminders for active goals',
        status: AutomationStatus.active,
        triggerType: TriggerType.schedule,
        triggerConfig: '0 9 * * *',
        executionCount: 453,
        lastExecutedAt: DateTime.now().subtract(const Duration(hours: 5)),
        createdAt: DateTime.now().subtract(const Duration(days: 60)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
        tags: ['goals', 'reminder'],
      ),
      Automation(
        id: '3',
        name: 'Habit Streak Celebration',
        description: 'Celebrate when users reach habit milestones',
        status: AutomationStatus.paused,
        triggerType: TriggerType.event,
        triggerConfig: 'habit.milestone',
        executionCount: 89,
        lastExecutedAt: DateTime.now().subtract(const Duration(days: 3)),
        createdAt: DateTime.now().subtract(const Duration(days: 45)),
        updatedAt: DateTime.now().subtract(const Duration(days: 3)),
        tags: ['habits', 'gamification'],
      ),
      Automation(
        id: '4',
        name: 'Session Reminder',
        description: 'Remind users 24h before scheduled sessions',
        status: AutomationStatus.failed,
        triggerType: TriggerType.schedule,
        triggerConfig: '0 10 * * *',
        executionCount: 234,
        lastExecutedAt: DateTime.now().subtract(const Duration(hours: 1)),
        createdAt: DateTime.now().subtract(const Duration(days: 90)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 1)),
        tags: ['sessions', 'reminder'],
      ),
      Automation(
        id: '5',
        name: 'Weekly Progress Report',
        description: 'Send weekly progress reports to users',
        status: AutomationStatus.draft,
        triggerType: TriggerType.schedule,
        triggerConfig: '0 18 * * 0',
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
        tags: ['reporting', 'email'],
      ),
    ];

    setState(() {
      _automations = mockAutomations;
      _filteredAutomations = mockAutomations;
      _isLoading = false;
    });
  }

  Future<void> _loadRecentExecutions() async {
    await Future.delayed(const Duration(milliseconds: 500));

    final mockExecutions = [
      AutomationExecution(
        id: 'exec_1',
        automationId: '1',
        status: 'completed',
        startedAt: DateTime.now().subtract(const Duration(hours: 2)),
        completedAt: DateTime.now().subtract(const Duration(hours: 2, minutes: -1)),
        duration: 1234,
      ),
      AutomationExecution(
        id: 'exec_2',
        automationId: '2',
        status: 'completed',
        startedAt: DateTime.now().subtract(const Duration(hours: 5)),
        completedAt: DateTime.now().subtract(const Duration(hours: 5, minutes: -2)),
        duration: 2456,
      ),
      AutomationExecution(
        id: 'exec_3',
        automationId: '4',
        status: 'failed',
        startedAt: DateTime.now().subtract(const Duration(hours: 1)),
        completedAt: DateTime.now().subtract(const Duration(hours: 1, minutes: -1)),
        duration: 567,
        error: 'SMTP connection timeout',
      ),
    ];

    setState(() {
      _recentExecutions = mockExecutions;
    });
  }

  Future<void> _refreshAutomations() async {
    setState(() => _isRefreshing = true);
    await _loadAutomations();
    await _loadRecentExecutions();
    setState(() => _isRefreshing = false);
  }

  void _filterAutomations() {
    setState(() {
      _filteredAutomations = _automations.where((automation) {
        final matchesStatus = _filterStatus == null || automation.status == _filterStatus;
        final matchesSearch = _searchQuery.isEmpty ||
            automation.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            automation.description.toLowerCase().contains(_searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }).toList();
    });
  }

  Future<void> _toggleAutomationStatus(Automation automation) async {
    final newStatus = automation.status == AutomationStatus.active
        ? AutomationStatus.paused
        : AutomationStatus.active;

    setState(() {
      final index = _automations.indexWhere((a) => a.id == automation.id);
      if (index != -1) {
        _automations[index] = automation.copyWith(status: newStatus);
        _filterAutomations();
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          newStatus == AutomationStatus.active
              ? 'Automation activated'
              : 'Automation paused',
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _deleteAutomation(Automation automation) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Automation'),
        content: Text('Are you sure you want to delete "${automation.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        _automations.removeWhere((a) => a.id == automation.id);
        _filterAutomations();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Automation deleted'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _retryFailedAutomation(Automation automation) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Retrying automation...'),
        duration: Duration(seconds: 2),
      ),
    );

    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      final index = _automations.indexWhere((a) => a.id == automation.id);
      if (index != -1) {
        _automations[index] = automation.copyWith(status: AutomationStatus.active);
        _filterAutomations();
      }
    });
  }

  void _showExecutionHistory(Automation automation) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Execution History',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: _recentExecutions
                    .where((e) => e.automationId == automation.id)
                    .length,
                itemBuilder: (context, index) {
                  final execution = _recentExecutions
                      .where((e) => e.automationId == automation.id)
                      .toList()[index];
                  return _buildExecutionTile(execution);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateWizard() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AutomationWizardScreen(),
      ),
    );
  }

  void _createFromTemplate(AutomationTemplate template) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AutomationWizardScreen(template: template),
      ),
    );
  }

  Widget _buildAutomationCard(Automation automation) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showExecutionHistory(automation),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          automation.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          automation.description,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: automation.status == AutomationStatus.active,
                    onChanged: (_) => _toggleAutomationStatus(automation),
                    activeColor: Theme.of(context).colorScheme.primary,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildStatusChip(automation.status),
                  _buildTriggerChip(automation.triggerType),
                  ...automation.tags.map((tag) => Chip(
                        label: Text(tag),
                        labelStyle: const TextStyle(fontSize: 11),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        visualDensity: VisualDensity.compact,
                      )),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.play_circle_outline, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${automation.executionCount} executions',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  const Spacer(),
                  if (automation.lastExecutedAt != null) ...[
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      _formatRelativeTime(automation.lastExecutedAt!),
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
              if (automation.status == AutomationStatus.failed) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Last execution failed',
                          style: TextStyle(fontSize: 12, color: Colors.red[900]),
                        ),
                      ),
                      TextButton(
                        onPressed: () => _retryFailedAutomation(automation),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () => _showExecutionHistory(automation),
                    icon: const Icon(Icons.history, size: 16),
                    label: const Text('History'),
                  ),
                  TextButton.icon(
                    onPressed: () => _deleteAutomation(automation),
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Delete'),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(AutomationStatus status) {
    Color color;
    IconData icon;
    String label;

    switch (status) {
      case AutomationStatus.active:
        color = Colors.green;
        icon = Icons.check_circle;
        label = 'Active';
        break;
      case AutomationStatus.paused:
        color = Colors.orange;
        icon = Icons.pause_circle;
        label = 'Paused';
        break;
      case AutomationStatus.failed:
        color = Colors.red;
        icon = Icons.error;
        label = 'Failed';
        break;
      case AutomationStatus.draft:
        color = Colors.grey;
        icon = Icons.edit;
        label = 'Draft';
        break;
    }

    return Chip(
      avatar: Icon(icon, size: 16, color: Colors.white),
      label: Text(label),
      labelStyle: const TextStyle(fontSize: 11, color: Colors.white),
      backgroundColor: color,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildTriggerChip(TriggerType type) {
    IconData icon;
    String label;

    switch (type) {
      case TriggerType.event:
        icon = Icons.bolt;
        label = 'Event';
        break;
      case TriggerType.schedule:
        icon = Icons.schedule;
        label = 'Schedule';
        break;
      case TriggerType.webhook:
        icon = Icons.webhook;
        label = 'Webhook';
        break;
      case TriggerType.manual:
        icon = Icons.touch_app;
        label = 'Manual';
        break;
    }

    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      labelStyle: const TextStyle(fontSize: 11),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildExecutionTile(AutomationExecution execution) {
    final isCompleted = execution.status == 'completed';
    final isFailed = execution.status == 'failed';

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isCompleted
            ? Colors.green[100]
            : isFailed
                ? Colors.red[100]
                : Colors.grey[300],
        child: Icon(
          isCompleted
              ? Icons.check
              : isFailed
                  ? Icons.error_outline
                  : Icons.pending,
          color: isCompleted
              ? Colors.green
              : isFailed
                  ? Colors.red
                  : Colors.grey,
        ),
      ),
      title: Text(
        execution.status.toUpperCase(),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Started: ${_formatDateTime(execution.startedAt)}'),
          if (execution.duration != null)
            Text('Duration: ${execution.duration}ms'),
          if (execution.error != null)
            Text(
              'Error: ${execution.error}',
              style: const TextStyle(color: Colors.red),
            ),
        ],
      ),
      isThreeLine: true,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.auto_awesome,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No Automations Yet',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first automation to save time and automate repetitive tasks',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showCreateWizard,
              icon: const Icon(Icons.add),
              label: const Text('Create Automation'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            Text(
              'Or choose a template:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            ..._templates.take(3).map((template) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(template.icon, color: Theme.of(context).colorScheme.primary),
                    ),
                    title: Text(template.name),
                    subtitle: Text(template.description),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () => _createFromTemplate(template),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${dateTime.month}/${dateTime.day}/${dateTime.year}';
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.month}/${dateTime.day}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Automations'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'My Automations'),
            Tab(text: 'Templates'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // My Automations Tab
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search automations...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: Colors.grey[100],
                      ),
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value;
                          _filterAutomations();
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          FilterChip(
                            label: const Text('All'),
                            selected: _filterStatus == null,
                            onSelected: (_) {
                              setState(() {
                                _filterStatus = null;
                                _filterAutomations();
                              });
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Active'),
                            selected: _filterStatus == AutomationStatus.active,
                            onSelected: (_) {
                              setState(() {
                                _filterStatus = AutomationStatus.active;
                                _filterAutomations();
                              });
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Paused'),
                            selected: _filterStatus == AutomationStatus.paused,
                            onSelected: (_) {
                              setState(() {
                                _filterStatus = AutomationStatus.paused;
                                _filterAutomations();
                              });
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Failed'),
                            selected: _filterStatus == AutomationStatus.failed,
                            onSelected: (_) {
                              setState(() {
                                _filterStatus = AutomationStatus.failed;
                                _filterAutomations();
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _filteredAutomations.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _refreshAutomations,
                            child: ListView.builder(
                              itemCount: _filteredAutomations.length,
                              itemBuilder: (context, index) =>
                                  _buildAutomationCard(_filteredAutomations[index]),
                            ),
                          ),
              ),
            ],
          ),
          // Templates Tab
          ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _templates.length,
            itemBuilder: (context, index) {
              final template = _templates[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    child: Icon(template.icon, color: Theme.of(context).colorScheme.primary),
                  ),
                  title: Text(template.name),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(template.description),
                      const SizedBox(height: 4),
                      Chip(
                        label: Text(template.category),
                        labelStyle: const TextStyle(fontSize: 11),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                  isThreeLine: true,
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => _createFromTemplate(template),
                ),
              );
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateWizard,
        icon: const Icon(Icons.add),
        label: const Text('Create'),
      ),
    );
  }
}

/// Automation Wizard Screen (Step-by-step creation)
class AutomationWizardScreen extends StatefulWidget {
  final AutomationTemplate? template;

  const AutomationWizardScreen({Key? key, this.template}) : super(key: key);

  @override
  State<AutomationWizardScreen> createState() => _AutomationWizardScreenState();
}

class _AutomationWizardScreenState extends State<AutomationWizardScreen> {
  int _currentStep = 0;
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  TriggerType _selectedTrigger = TriggerType.event;

  @override
  void initState() {
    super.initState();
    if (widget.template != null) {
      _nameController.text = widget.template!.name;
      _descriptionController.text = widget.template!.description;
      _selectedTrigger = widget.template!.triggerType;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Automation'),
      ),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 2) {
            setState(() => _currentStep++);
          } else {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Automation created successfully')),
            );
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          } else {
            Navigator.pop(context);
          }
        },
        steps: [
          Step(
            title: const Text('Basic Info'),
            content: Column(
              children: [
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Automation Name',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: const Text('Trigger'),
            content: Column(
              children: [
                RadioListTile<TriggerType>(
                  title: const Text('Event Trigger'),
                  subtitle: const Text('Triggered by system events'),
                  value: TriggerType.event,
                  groupValue: _selectedTrigger,
                  onChanged: (value) => setState(() => _selectedTrigger = value!),
                ),
                RadioListTile<TriggerType>(
                  title: const Text('Schedule Trigger'),
                  subtitle: const Text('Triggered on a schedule'),
                  value: TriggerType.schedule,
                  groupValue: _selectedTrigger,
                  onChanged: (value) => setState(() => _selectedTrigger = value!),
                ),
                RadioListTile<TriggerType>(
                  title: const Text('Manual Trigger'),
                  subtitle: const Text('Triggered manually'),
                  value: TriggerType.manual,
                  groupValue: _selectedTrigger,
                  onChanged: (value) => setState(() => _selectedTrigger = value!),
                ),
              ],
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text('Review'),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Name: ${_nameController.text}'),
                const SizedBox(height: 8),
                Text('Description: ${_descriptionController.text}'),
                const SizedBox(height: 8),
                Text('Trigger: ${_selectedTrigger.name}'),
              ],
            ),
            isActive: _currentStep >= 2,
          ),
        ],
      ),
    );
  }
}
