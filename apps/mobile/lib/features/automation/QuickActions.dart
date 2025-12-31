import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Quick Actions Widget
///
/// Flutter widget for quick automation access on mobile.
///
/// Features:
/// - Pre-built quick action cards
/// - One-tap template deployment
/// - Recent automations
/// - Suggested automations based on behavior
/// - Template preview bottom sheet
/// - AI assistant chat (mobile)
/// - Material Design 3
/// - Full Dart typing with null safety

class QuickActions extends StatefulWidget {
  final String userId;
  final String organizationId;

  const QuickActions({
    Key? key,
    required this.userId,
    required this.organizationId,
  }) : super(key: key);

  @override
  State<QuickActions> createState() => _QuickActionsState();
}

class _QuickActionsState extends State<QuickActions> {
  bool _isLoading = false;
  List<QuickActionTemplate> _quickActions = [];
  List<AutomationWorkflow> _recentAutomations = [];
  List<QuickActionTemplate> _suggestedActions = [];
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadQuickActions();
    _loadRecentAutomations();
    _loadSuggestedActions();
  }

  Future<void> _loadQuickActions() async {
    setState(() => _isLoading = true);

    try {
      _quickActions = [
        QuickActionTemplate(
          id: 'daily-reminder',
          name: 'Send Daily Reminder',
          description: 'Send automated daily reminders to clients',
          icon: Icons.alarm,
          color: Colors.blue,
          category: 'engagement',
          estimatedSetupTime: 2,
          variables: [
            TemplateVariable(
              key: 'reminderTime',
              label: 'Reminder Time',
              type: VariableType.time,
              required: true,
              defaultValue: '08:00',
            ),
            TemplateVariable(
              key: 'message',
              label: 'Reminder Message',
              type: VariableType.text,
              required: true,
              defaultValue: 'Don\'t forget your daily check-in!',
            ),
          ],
        ),
        QuickActionTemplate(
          id: 'milestone-celebration',
          name: 'Celebrate Milestone',
          description: 'Automatically celebrate client milestones',
          icon: Icons.celebration,
          color: Colors.orange,
          category: 'engagement',
          estimatedSetupTime: 3,
          variables: [
            TemplateVariable(
              key: 'milestoneType',
              label: 'Milestone Type',
              type: VariableType.select,
              required: true,
              options: [
                VariableOption(label: 'Goal Completed', value: 'goal_completed'),
                VariableOption(label: '7-day Streak', value: 'streak_7'),
                VariableOption(label: '30-day Streak', value: 'streak_30'),
              ],
            ),
          ],
        ),
        QuickActionTemplate(
          id: 'weekly-report',
          name: 'Weekly Report',
          description: 'Send weekly progress reports to clients',
          icon: Icons.bar_chart,
          color: Colors.green,
          category: 'analytics',
          estimatedSetupTime: 5,
          variables: [
            TemplateVariable(
              key: 'reportDay',
              label: 'Report Day',
              type: VariableType.select,
              required: true,
              options: [
                VariableOption(label: 'Monday', value: 'MON'),
                VariableOption(label: 'Friday', value: 'FRI'),
                VariableOption(label: 'Sunday', value: 'SUN'),
              ],
            ),
            TemplateVariable(
              key: 'reportTime',
              label: 'Report Time',
              type: VariableType.time,
              required: true,
              defaultValue: '09:00',
            ),
          ],
        ),
        QuickActionTemplate(
          id: 'inactive-check',
          name: 'Inactive User Check',
          description: 'Re-engage inactive clients automatically',
          icon: Icons.person_search,
          color: Colors.purple,
          category: 'engagement',
          estimatedSetupTime: 4,
          variables: [
            TemplateVariable(
              key: 'inactiveDays',
              label: 'Days of Inactivity',
              type: VariableType.number,
              required: true,
              defaultValue: '14',
            ),
          ],
        ),
        QuickActionTemplate(
          id: 'goal-progress',
          name: 'Goal Progress Update',
          description: 'Send goal progress updates to clients',
          icon: Icons.track_changes,
          color: Colors.teal,
          category: 'goals',
          estimatedSetupTime: 3,
          variables: [
            TemplateVariable(
              key: 'frequency',
              label: 'Update Frequency',
              type: VariableType.select,
              required: true,
              options: [
                VariableOption(label: 'Daily', value: 'daily'),
                VariableOption(label: 'Weekly', value: 'weekly'),
                VariableOption(label: 'Monthly', value: 'monthly'),
              ],
            ),
          ],
        ),
      ];
    } catch (e) {
      _showErrorSnackBar('Failed to load quick actions: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadRecentAutomations() async {
    try {
      final response = await http.get(
        Uri.parse('/api/automation/workflows/recent'),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
          'X-Organization-Id': widget.organizationId,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _recentAutomations = (data['workflows'] as List)
              .map((w) => AutomationWorkflow.fromJson(w))
              .toList();
        });
      }
    } catch (e) {
      print('Failed to load recent automations: $e');
    }
  }

  Future<void> _loadSuggestedActions() async {
    try {
      final response = await http.get(
        Uri.parse('/api/automation/suggestions'),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
          'X-Organization-Id': widget.organizationId,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _suggestedActions = (data['suggestions'] as List)
              .map((s) => QuickActionTemplate.fromJson(s))
              .toList();
        });
      }
    } catch (e) {
      print('Failed to load suggested actions: $e');
    }
  }

  Future<String> _getAuthToken() async {
    // Get auth token from secure storage
    return 'mock_token';
  }

  void _showTemplatePreview(QuickActionTemplate template) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _TemplatePreviewSheet(
        template: template,
        onInstall: () => _installTemplate(template),
      ),
    );
  }

  Future<void> _installTemplate(QuickActionTemplate template) async {
    Navigator.pop(context); // Close preview sheet

    final variables = await _showVariableConfigDialog(template);
    if (variables == null) return;

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('/api/automation/templates/install'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
          'X-Organization-Id': widget.organizationId,
        },
        body: json.encode({
          'templateId': template.id,
          'variableValues': variables,
        }),
      );

      if (response.statusCode == 200) {
        _showSuccessSnackBar('Automation installed successfully!');
        await _loadRecentAutomations();
      } else {
        throw Exception('Installation failed');
      }
    } catch (e) {
      _showErrorSnackBar('Failed to install automation: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<Map<String, dynamic>?> _showVariableConfigDialog(
    QuickActionTemplate template,
  ) async {
    final variables = <String, dynamic>{};

    for (var variable in template.variables) {
      variables[variable.key] = variable.defaultValue ?? '';
    }

    return showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _VariableConfigDialog(
        template: template,
        initialValues: variables,
      ),
    );
  }

  void _showAIAssistant() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _AIAssistantSheet(),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quick Actions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.smart_toy),
            onPressed: _showAIAssistant,
            tooltip: 'AI Assistant',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildTabBar(),
                Expanded(
                  child: _selectedIndex == 0
                      ? _buildQuickActionsTab()
                      : _selectedIndex == 1
                          ? _buildRecentTab()
                          : _buildSuggestedTab(),
                ),
              ],
            ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _TabButton(
              label: 'Quick Actions',
              icon: Icons.bolt,
              isSelected: _selectedIndex == 0,
              onTap: () => setState(() => _selectedIndex = 0),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _TabButton(
              label: 'Recent',
              icon: Icons.history,
              isSelected: _selectedIndex == 1,
              onTap: () => setState(() => _selectedIndex = 1),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _TabButton(
              label: 'Suggested',
              icon: Icons.lightbulb,
              isSelected: _selectedIndex == 2,
              onTap: () => setState(() => _selectedIndex = 2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _quickActions.length,
      itemBuilder: (context, index) {
        final action = _quickActions[index];
        return _QuickActionCard(
          action: action,
          onTap: () => _showTemplatePreview(action),
        );
      },
    );
  }

  Widget _buildRecentTab() {
    if (_recentAutomations.isEmpty) {
      return const Center(
        child: Text('No recent automations'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _recentAutomations.length,
      itemBuilder: (context, index) {
        final automation = _recentAutomations[index];
        return _RecentAutomationCard(automation: automation);
      },
    );
  }

  Widget _buildSuggestedTab() {
    if (_suggestedActions.isEmpty) {
      return const Center(
        child: Text('No suggestions available'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _suggestedActions.length,
      itemBuilder: (context, index) {
        final action = _suggestedActions[index];
        return _QuickActionCard(
          action: action,
          onTap: () => _showTemplatePreview(action),
          showBadge: true,
        );
      },
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Theme.of(context).primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.grey[600],
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[600],
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final QuickActionTemplate action;
  final VoidCallback onTap;
  final bool showBadge;

  const _QuickActionCard({
    required this.action,
    required this.onTap,
    this.showBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: action.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  action.icon,
                  color: action.color,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            action.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        if (showBadge)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.orange,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Suggested',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      action.description,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.timer, size: 16, color: Colors.grey[400]),
                        const SizedBox(width: 4),
                        Text(
                          '${action.estimatedSetupTime} min setup',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentAutomationCard extends StatelessWidget {
  final AutomationWorkflow automation;

  const _RecentAutomationCard({required this.automation});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(automation.status),
          child: Icon(
            _getStatusIcon(automation.status),
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text(automation.name),
        subtitle: Text(
          'Last run: ${_formatDate(automation.lastRun)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Chip(
          label: Text(
            automation.status,
            style: const TextStyle(fontSize: 10),
          ),
          backgroundColor: _getStatusColor(automation.status).withOpacity(0.2),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'paused':
        return Colors.orange;
      case 'error':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Icons.check_circle;
      case 'paused':
        return Icons.pause_circle;
      case 'error':
        return Icons.error;
      default:
        return Icons.circle;
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Never';
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _TemplatePreviewSheet extends StatelessWidget {
  final QuickActionTemplate template;
  final VoidCallback onInstall;

  const _TemplatePreviewSheet({
    required this.template,
    required this.onInstall,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: template.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      template.icon,
                      color: template.color,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          template.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          template.category,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                template.description,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'Configuration Required',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: template.variables.length,
                  itemBuilder: (context, index) {
                    final variable = template.variables[index];
                    return ListTile(
                      leading: Icon(
                        _getVariableIcon(variable.type),
                        color: Colors.blue,
                      ),
                      title: Text(variable.label),
                      subtitle: Text(
                        variable.required ? 'Required' : 'Optional',
                        style: TextStyle(
                          color: variable.required ? Colors.red : Colors.grey,
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onInstall,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Install & Configure',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  IconData _getVariableIcon(VariableType type) {
    switch (type) {
      case VariableType.text:
        return Icons.text_fields;
      case VariableType.number:
        return Icons.numbers;
      case VariableType.time:
        return Icons.access_time;
      case VariableType.select:
        return Icons.list;
      default:
        return Icons.settings;
    }
  }
}

class _VariableConfigDialog extends StatefulWidget {
  final QuickActionTemplate template;
  final Map<String, dynamic> initialValues;

  const _VariableConfigDialog({
    required this.template,
    required this.initialValues,
  });

  @override
  State<_VariableConfigDialog> createState() => _VariableConfigDialogState();
}

class _VariableConfigDialogState extends State<_VariableConfigDialog> {
  late Map<String, dynamic> _values;

  @override
  void initState() {
    super.initState();
    _values = Map.from(widget.initialValues);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Configure Variables'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: widget.template.variables.map((variable) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildVariableField(variable),
            );
          }).toList(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, _values),
          child: const Text('Install'),
        ),
      ],
    );
  }

  Widget _buildVariableField(TemplateVariable variable) {
    if (variable.type == VariableType.select && variable.options != null) {
      return DropdownButtonFormField<String>(
        value: _values[variable.key] ?? variable.defaultValue,
        decoration: InputDecoration(
          labelText: variable.label,
          border: const OutlineInputBorder(),
        ),
        items: variable.options!
            .map((option) => DropdownMenuItem(
                  value: option.value,
                  child: Text(option.label),
                ))
            .toList(),
        onChanged: (value) {
          setState(() {
            _values[variable.key] = value;
          });
        },
      );
    }

    return TextFormField(
      initialValue: _values[variable.key]?.toString() ?? variable.defaultValue,
      decoration: InputDecoration(
        labelText: variable.label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: variable.type == VariableType.number
          ? TextInputType.number
          : TextInputType.text,
      onChanged: (value) {
        setState(() {
          _values[variable.key] = value;
        });
      },
    );
  }
}

class _AIAssistantSheet extends StatefulWidget {
  const _AIAssistantSheet();

  @override
  State<_AIAssistantSheet> createState() => _AIAssistantSheetState();
}

class _AIAssistantSheetState extends State<_AIAssistantSheet> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(
        text: _controller.text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
    });

    _controller.clear();

    // Simulate AI response
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _messages.add(ChatMessage(
          text: 'I can help you with that! Let me suggest some automation templates...',
          isUser: false,
          timestamp: DateTime.now(),
        ));
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text(
            'AI Workflow Assistant',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[_messages.length - 1 - index];
                return _ChatBubble(message: message);
              },
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    hintText: 'Ask me anything...',
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.send),
                onPressed: _sendMessage,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isUser ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: message.isUser ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }
}

// Data Models

class QuickActionTemplate {
  final String id;
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final String category;
  final int estimatedSetupTime;
  final List<TemplateVariable> variables;

  QuickActionTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.category,
    required this.estimatedSetupTime,
    required this.variables,
  });

  factory QuickActionTemplate.fromJson(Map<String, dynamic> json) {
    return QuickActionTemplate(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: Icons.bolt, // Default icon
      color: Colors.blue, // Default color
      category: json['category'] as String,
      estimatedSetupTime: json['estimatedSetupTime'] as int,
      variables: (json['variables'] as List?)
              ?.map((v) => TemplateVariable.fromJson(v))
              .toList() ??
          [],
    );
  }
}

class TemplateVariable {
  final String key;
  final String label;
  final VariableType type;
  final bool required;
  final String? defaultValue;
  final List<VariableOption>? options;

  TemplateVariable({
    required this.key,
    required this.label,
    required this.type,
    required this.required,
    this.defaultValue,
    this.options,
  });

  factory TemplateVariable.fromJson(Map<String, dynamic> json) {
    return TemplateVariable(
      key: json['key'] as String,
      label: json['label'] as String,
      type: VariableType.values.firstWhere(
        (e) => e.toString() == 'VariableType.${json['type']}',
        orElse: () => VariableType.text,
      ),
      required: json['required'] as bool,
      defaultValue: json['defaultValue'] as String?,
      options: (json['options'] as List?)
          ?.map((o) => VariableOption.fromJson(o))
          .toList(),
    );
  }
}

class VariableOption {
  final String label;
  final String value;

  VariableOption({required this.label, required this.value});

  factory VariableOption.fromJson(Map<String, dynamic> json) {
    return VariableOption(
      label: json['label'] as String,
      value: json['value'] as String,
    );
  }
}

enum VariableType { text, number, time, select }

class AutomationWorkflow {
  final String id;
  final String name;
  final String status;
  final DateTime? lastRun;

  AutomationWorkflow({
    required this.id,
    required this.name,
    required this.status,
    this.lastRun,
  });

  factory AutomationWorkflow.fromJson(Map<String, dynamic> json) {
    return AutomationWorkflow(
      id: json['id'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      lastRun: json['lastRun'] != null
          ? DateTime.parse(json['lastRun'] as String)
          : null,
    );
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}
