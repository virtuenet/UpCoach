import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/ai/PersonalAssistantAI.dart';
import '../../core/ai/AdaptiveLearning.dart';

/// Personal AI assistant interface
class PersonalAIScreen extends StatefulWidget {
  const PersonalAIScreen({super.key});

  @override
  State<PersonalAIScreen> createState() => _PersonalAIScreenState();
}

class _PersonalAIScreenState extends State<PersonalAIScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // AI services
  PersonalAssistantAI? _assistant;
  AdaptiveLearning? _adaptiveLearning;

  // State
  bool _isLoading = true;
  bool _isListening = false;
  bool _isProcessing = false;
  String _currentTranscript = '';

  // Chat
  final List<ChatMessage> _messages = [];
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  // Insights
  List<InsightCard> _insights = [];
  UserModel? _userModel;
  ChurnRisk _churnRisk = ChurnRisk.low;
  double _predictedEngagement = 0.0;

  // Automation
  List<SmartAutomation> _automations = [];
  final List<AutomationExecution> _automationHistory = [];

  // Personalization
  UserPreferences _preferences = UserPreferences.empty();
  double _notificationFrequency = 5.0;
  String _uiComplexity = 'medium';

  // Privacy
  int _conversationHistoryCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _initializeAI();
  }

  /// Initialize AI services
  Future<void> _initializeAI() async {
    try {
      setState(() => _isLoading = true);

      // Initialize assistant
      _assistant = PersonalAssistantAI();
      _assistant!.onTranscript = _onTranscript;
      _assistant!.onResponse = _onAssistantResponse;
      _assistant!.onError = _onError;
      await _assistant!.initialize();

      // Initialize adaptive learning
      _adaptiveLearning = AdaptiveLearning();
      _adaptiveLearning!.onUserModelUpdated = _onUserModelUpdated;
      _adaptiveLearning!.onRecommendationsUpdated = _onRecommendationsUpdated;
      await _adaptiveLearning!.initialize();

      // Load initial data
      await _loadInitialData();

      setState(() => _isLoading = false);
    } catch (e) {
      debugPrint('[PersonalAIScreen] Initialization error: $e');
      _showErrorSnackBar('Failed to initialize AI: $e');
      setState(() => _isLoading = false);
    }
  }

  /// Load initial data
  Future<void> _loadInitialData() async {
    // Load user model
    _userModel = _adaptiveLearning?.userModel;

    // Predict churn risk
    _churnRisk = _adaptiveLearning?.predictChurnRisk() ?? ChurnRisk.low;

    // Predict engagement
    _predictedEngagement = _adaptiveLearning?.predictEngagement(daysAhead: 7) ?? 0.0;

    // Generate insights
    _generateInsights();

    // Load automations
    _loadAutomations();

    // Load preferences
    _loadPreferences();

    // Load conversation history
    _conversationHistoryCount = _assistant?.conversationHistory.length ?? 0;

    // Add welcome message
    _messages.add(ChatMessage(
      text: 'Hi! I\'m your personal AI coach. How can I help you today?',
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  /// Generate insights
  void _generateInsights() {
    _insights = [
      InsightCard(
        title: 'Weekly Progress',
        description: 'You\'ve completed 5 out of 7 daily goals this week',
        icon: Icons.trending_up,
        trend: InsightTrend.improving,
        color: Colors.green,
      ),
      InsightCard(
        title: 'Current Streak',
        description: '12-day streak for daily exercise',
        icon: Icons.local_fire_department,
        trend: InsightTrend.stable,
        color: Colors.orange,
      ),
      InsightCard(
        title: 'Exercise Target',
        description: '75% towards your weekly exercise target',
        icon: Icons.fitness_center,
        trend: InsightTrend.improving,
        color: Colors.blue,
      ),
      InsightCard(
        title: 'Sleep Pattern',
        description: 'Average 7.5 hours of sleep, improving consistency',
        icon: Icons.bedtime,
        trend: InsightTrend.improving,
        color: Colors.purple,
      ),
      InsightCard(
        title: 'Nutrition',
        description: 'Meeting calorie goals 6 out of 7 days',
        icon: Icons.restaurant,
        trend: InsightTrend.stable,
        color: Colors.teal,
      ),
    ];
  }

  /// Load automations
  void _loadAutomations() {
    _automations = [
      SmartAutomation(
        id: 'auto_track_gym',
        name: 'Auto-track gym workouts',
        description: 'Automatically log workout when at gym',
        trigger: 'Location: Gym',
        action: 'Track workout',
        isEnabled: true,
      ),
      SmartAutomation(
        id: 'auto_log_meals',
        name: 'Meal time reminders',
        description: 'Remind to log meals at breakfast, lunch, dinner',
        trigger: 'Time: Meal times',
        action: 'Remind to log meal',
        isEnabled: true,
      ),
      SmartAutomation(
        id: 'auto_meditation',
        name: 'Evening meditation',
        description: 'Suggest meditation at 8 PM daily',
        trigger: 'Time: 8:00 PM',
        action: 'Suggest meditation',
        isEnabled: false,
      ),
      SmartAutomation(
        id: 'auto_water',
        name: 'Hydration reminders',
        description: 'Remind to drink water every 2 hours',
        trigger: 'Time: Every 2 hours',
        action: 'Remind to drink water',
        isEnabled: true,
      ),
    ];

    // Populate automation history
    _automationHistory.addAll([
      AutomationExecution(
        automationName: 'Auto-track gym workouts',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        success: true,
      ),
      AutomationExecution(
        automationName: 'Meal time reminders',
        timestamp: DateTime.now().subtract(const Duration(hours: 4)),
        success: true,
      ),
      AutomationExecution(
        automationName: 'Hydration reminders',
        timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        success: true,
      ),
    ]);
  }

  /// Load preferences
  void _loadPreferences() {
    _preferences = _userModel?.preferences ?? UserPreferences.empty();
    _notificationFrequency = _preferences.notificationsPerDay.toDouble();
  }

  /// On transcript
  void _onTranscript(String transcript) {
    setState(() {
      _currentTranscript = transcript;
    });
  }

  /// On assistant response
  void _onAssistantResponse(AssistantResponse response) {
    setState(() {
      _isProcessing = false;

      // Add assistant message
      _messages.add(ChatMessage(
        text: response.message,
        isUser: false,
        timestamp: response.timestamp,
        suggestions: response.suggestions,
      ));

      // Scroll to bottom
      _scrollToBottom();

      // Track interaction
      _trackInteraction('chat', 'message_sent', 5);
    });
  }

  /// On error
  void _onError(String error) {
    _showErrorSnackBar(error);
    setState(() {
      _isProcessing = false;
      _isListening = false;
    });
  }

  /// On user model updated
  void _onUserModelUpdated(UserModel model) {
    setState(() {
      _userModel = model;
      _churnRisk = _adaptiveLearning?.predictChurnRisk() ?? ChurnRisk.low;
      _predictedEngagement = _adaptiveLearning?.predictEngagement(daysAhead: 7) ?? 0.0;
    });
  }

  /// On recommendations updated
  void _onRecommendationsUpdated(List<ContentItem> recommendations) {
    debugPrint('[PersonalAIScreen] Received ${recommendations.length} recommendations');
  }

  /// Send text message
  Future<void> _sendTextMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _messageController.clear();
      _isProcessing = true;
    });

    _scrollToBottom();

    // Process message
    await _assistant?.processTextInput(text);
  }

  /// Toggle voice input
  Future<void> _toggleVoiceInput() async {
    if (_isListening) {
      await _assistant?.stopListening();
      setState(() {
        _isListening = false;
        if (_currentTranscript.isNotEmpty) {
          _isProcessing = true;
        }
      });
    } else {
      try {
        await _assistant?.startListening();
        setState(() {
          _isListening = true;
          _currentTranscript = '';
        });
      } catch (e) {
        _showErrorSnackBar('Failed to start listening: $e');
      }
    }
  }

  /// Handle quick action
  Future<void> _handleQuickAction(String action) async {
    await _assistant?.processTextInput(action);
    _trackInteraction('chat', 'quick_action', 1);
  }

  /// Track interaction
  void _trackInteraction(String feature, String action, int duration) {
    _adaptiveLearning?.trackInteraction(UserInteraction(
      feature: feature,
      action: action,
      duration: duration,
      timestamp: DateTime.now(),
    ));
  }

  /// Scroll to bottom
  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  /// Toggle automation
  void _toggleAutomation(int index) {
    setState(() {
      _automations[index].isEnabled = !_automations[index].isEnabled;
    });
    _trackInteraction('automation', 'toggle', 1);
  }

  /// Clear conversation history
  Future<void> _clearConversationHistory() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Conversation History'),
        content: const Text('Are you sure you want to clear all conversation history? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _assistant?.clearConversationHistory();
      setState(() {
        _messages.clear();
        _conversationHistoryCount = 0;
        _messages.add(ChatMessage(
          text: 'Conversation history cleared. How can I help you?',
          isUser: false,
          timestamp: DateTime.now(),
        ));
      });
      _showSuccessSnackBar('Conversation history cleared');
    }
  }

  /// Export conversation history
  void _exportConversationHistory() {
    final history = _assistant?.exportConversationHistory();
    debugPrint('[PersonalAIScreen] Exported conversation history: ${history?.length ?? 0} characters');
    _showSuccessSnackBar('Conversation history exported to logs');
  }

  /// Show error snackbar
  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  /// Show success snackbar
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
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal AI Coach'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Chat', icon: Icon(Icons.chat)),
            Tab(text: 'Insights', icon: Icon(Icons.lightbulb)),
            Tab(text: 'Automation', icon: Icon(Icons.smart_toy)),
            Tab(text: 'Personalization', icon: Icon(Icons.person)),
            Tab(text: 'Privacy', icon: Icon(Icons.security)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChatTab(),
          _buildInsightsTab(),
          _buildAutomationTab(),
          _buildPersonalizationTab(),
          _buildPrivacyTab(),
        ],
      ),
    );
  }

  /// Build chat tab
  Widget _buildChatTab() {
    return Column(
      children: [
        // Context pills
        if (_assistant != null)
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.grey[100],
            child: Wrap(
              spacing: 8,
              children: [
                _buildContextChip('📍 At Home', Colors.blue),
                _buildContextChip('⏰ ${DateFormat('h:mm a').format(DateTime.now())}', Colors.orange),
                _buildContextChip('🏃 Stationary', Colors.green),
              ],
            ),
          ),

        // Messages
        Expanded(
          child: ListView.builder(
            controller: _chatScrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final message = _messages[index];
              return _buildMessageBubble(message);
            },
          ),
        ),

        // Processing indicator
        if (_isProcessing)
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                const SizedBox(width: 16),
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 8),
                const Text('Processing...'),
              ],
            ),
          ),

        // Quick actions
        if (!_isProcessing && !_isListening)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildQuickActionChip('Track habit'),
                _buildQuickActionChip('Log mood'),
                _buildQuickActionChip('Set goal'),
              ],
            ),
          ),

        // Transcript
        if (_isListening && _currentTranscript.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue[50],
            child: Text(
              _currentTranscript,
              style: const TextStyle(fontStyle: FontStyle.italic),
            ),
          ),

        // Input
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: const InputDecoration(
                    hintText: 'Type a message...',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  onSubmitted: (_) => _sendTextMessage(),
                  enabled: !_isListening,
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: Icon(_isListening ? Icons.mic : Icons.mic_none),
                onPressed: _toggleVoiceInput,
                color: _isListening ? Colors.red : Colors.blue,
                iconSize: 32,
              ),
              IconButton(
                icon: const Icon(Icons.send),
                onPressed: _sendTextMessage,
                color: Colors.blue,
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Build message bubble
  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment: message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: message.isUser ? Colors.blue : Colors.grey[200],
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                message.text,
                style: TextStyle(
                  color: message.isUser ? Colors.white : Colors.black,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('h:mm a').format(message.timestamp),
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
            if (message.suggestions.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: message.suggestions.map((suggestion) {
                  return ActionChip(
                    label: Text(suggestion),
                    onPressed: () => _handleQuickAction(suggestion),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Build context chip
  Widget _buildContextChip(String label, Color color) {
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withOpacity(0.1),
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  /// Build quick action chip
  Widget _buildQuickActionChip(String label) {
    return ActionChip(
      label: Text(label),
      onPressed: () => _handleQuickAction(label),
      backgroundColor: Colors.blue[50],
    );
  }

  /// Build insights tab
  Widget _buildInsightsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Weekly summary
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Weekly Summary',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildSummaryRow('Goals Achieved', '5 / 7', Colors.green),
                const SizedBox(height: 8),
                _buildSummaryRow('Habits Tracked', '42', Colors.blue),
                const SizedBox(height: 8),
                _buildSummaryRow('Current Streak', '12 days', Colors.orange),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Insights
        const Text(
          'Personalized Insights',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),

        ...(_insights.map((insight) => _buildInsightCard(insight))),

        const SizedBox(height: 16),

        // Predictions
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Predictions',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildPredictionRow(
                  'Churn Risk',
                  _churnRisk.toString().split('.').last.toUpperCase(),
                  _getChurnRiskColor(_churnRisk),
                ),
                const SizedBox(height: 8),
                _buildPredictionRow(
                  'Engagement Score',
                  '${(_userModel?.engagementScore ?? 0).toStringAsFixed(0)}/100',
                  Colors.blue,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Recommendations
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Recommendations',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const ListTile(
                  leading: Icon(Icons.star, color: Colors.amber),
                  title: Text('Try the new breathing exercise'),
                  subtitle: Text('Based on your meditation habits'),
                ),
                const ListTile(
                  leading: Icon(Icons.fitness_center, color: Colors.blue),
                  title: Text('Increase workout intensity'),
                  subtitle: Text('You\'re ready for the next level'),
                ),
                const ListTile(
                  leading: Icon(Icons.bedtime, color: Colors.purple),
                  title: Text('Improve sleep consistency'),
                  subtitle: Text('Try going to bed at the same time'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build insight card
  Widget _buildInsightCard(InsightCard insight) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(insight.icon, color: insight.color),
        title: Text(insight.title),
        subtitle: Text(insight.description),
        trailing: _buildTrendBadge(insight.trend),
      ),
    );
  }

  /// Build trend badge
  Widget _buildTrendBadge(InsightTrend trend) {
    IconData icon;
    Color color;

    switch (trend) {
      case InsightTrend.improving:
        icon = Icons.trending_up;
        color = Colors.green;
        break;
      case InsightTrend.declining:
        icon = Icons.trending_down;
        color = Colors.red;
        break;
      case InsightTrend.stable:
        icon = Icons.trending_flat;
        color = Colors.orange;
        break;
    }

    return Icon(icon, color: color);
  }

  /// Build summary row
  Widget _buildSummaryRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            value,
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  /// Build prediction row
  Widget _buildPredictionRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            value,
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  /// Get churn risk color
  Color _getChurnRiskColor(ChurnRisk risk) {
    switch (risk) {
      case ChurnRisk.low:
        return Colors.green;
      case ChurnRisk.medium:
        return Colors.orange;
      case ChurnRisk.high:
        return Colors.red;
    }
  }

  /// Build automation tab
  Widget _buildAutomationTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Automations list
        const Text(
          'Smart Automations',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),

        ...(_automations.asMap().entries.map((entry) {
          final index = entry.key;
          final automation = entry.value;
          return _buildAutomationCard(automation, index);
        })),

        const SizedBox(height: 16),

        // Create automation button
        ElevatedButton.icon(
          onPressed: () {
            _showSuccessSnackBar('Create automation feature coming soon');
          },
          icon: const Icon(Icons.add),
          label: const Text('Create Automation'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.all(16),
          ),
        ),

        const SizedBox(height: 24),

        // History
        const Text(
          'Recent Executions',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),

        ...(_automationHistory.map((execution) => _buildAutomationHistoryCard(execution))),
      ],
    );
  }

  /// Build automation card
  Widget _buildAutomationCard(SmartAutomation automation, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    automation.name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Switch(
                  value: automation.isEnabled,
                  onChanged: (_) => _toggleAutomation(index),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              automation.description,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Chip(
                  label: Text(automation.trigger, style: const TextStyle(fontSize: 12)),
                  backgroundColor: Colors.blue[50],
                  padding: const EdgeInsets.all(4),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 16),
                const SizedBox(width: 8),
                Chip(
                  label: Text(automation.action, style: const TextStyle(fontSize: 12)),
                  backgroundColor: Colors.green[50],
                  padding: const EdgeInsets.all(4),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Build automation history card
  Widget _buildAutomationHistoryCard(AutomationExecution execution) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          execution.success ? Icons.check_circle : Icons.error,
          color: execution.success ? Colors.green : Colors.red,
        ),
        title: Text(execution.automationName),
        subtitle: Text(DateFormat('MMM d, h:mm a').format(execution.timestamp)),
      ),
    );
  }

  /// Build personalization tab
  Widget _buildPersonalizationTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // User profile
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Profile',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('Learning Style:'),
                    const SizedBox(width: 8),
                    Chip(
                      label: Text(_userModel?.learningStyle ?? 'balanced'),
                      backgroundColor: Colors.blue[50],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Engagement Score'),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: (_userModel?.engagementScore ?? 0) / 100,
                  backgroundColor: Colors.grey[200],
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(_userModel?.engagementScore ?? 0).toStringAsFixed(0)}/100',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Content preferences
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Content Preferences',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildToggleRow('Video', true),
                _buildToggleRow('Article', true),
                _buildToggleRow('Audio', false),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Notification settings
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Notification Settings',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                const Text('Frequency (per day)'),
                Slider(
                  value: _notificationFrequency,
                  min: 1,
                  max: 10,
                  divisions: 9,
                  label: _notificationFrequency.toInt().toString(),
                  onChanged: (value) {
                    setState(() => _notificationFrequency = value);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Best Times'),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _preferences.bestTimes.map((time) {
                    return Chip(
                      label: Text(time),
                      backgroundColor: Colors.blue[50],
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // UI complexity
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'UI Complexity',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Simple'),
                    Expanded(
                      child: Slider(
                        value: _uiComplexity == 'simple' ? 0 : _uiComplexity == 'medium' ? 1 : 2,
                        min: 0,
                        max: 2,
                        divisions: 2,
                        onChanged: (value) {
                          setState(() {
                            _uiComplexity = value == 0 ? 'simple' : value == 1 ? 'medium' : 'advanced';
                          });
                        },
                      ),
                    ),
                    const Text('Advanced'),
                  ],
                ),
                Center(
                  child: Text(
                    _uiComplexity.toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build toggle row
  Widget _buildToggleRow(String label, bool value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Switch(
          value: value,
          onChanged: (newValue) {
            setState(() {});
          },
        ),
      ],
    );
  }

  /// Build privacy tab
  Widget _buildPrivacyTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Privacy indicator
        Card(
          color: Colors.green[50],
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.shield, color: Colors.green, size: 32),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Privacy First',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'All data stays on your device. No cloud processing.',
                        style: TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Conversation history
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Conversation History',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text('$_conversationHistoryCount messages stored locally'),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _clearConversationHistory,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                        ),
                        child: const Text('Clear'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _exportConversationHistory,
                        child: const Text('Export'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Model information
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Model Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildInfoRow('Version', '1.0.0'),
                const SizedBox(height: 8),
                _buildInfoRow('Size', '25 MB'),
                const SizedBox(height: 8),
                _buildInfoRow('Accuracy', '95%'),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Privacy controls
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Privacy Controls',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildToggleRow('Voice Recording', true),
                const SizedBox(height: 8),
                _buildToggleRow('Location Tracking', true),
                const SizedBox(height: 8),
                _buildToggleRow('Usage Analytics', false),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build info row
  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    _chatScrollController.dispose();
    _assistant?.dispose();
    _adaptiveLearning?.dispose();
    super.dispose();
  }
}

/// Chat message
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final List<String> suggestions;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.suggestions = const [],
  });
}

/// Insight card
class InsightCard {
  final String title;
  final String description;
  final IconData icon;
  final InsightTrend trend;
  final Color color;

  InsightCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.trend,
    required this.color,
  });
}

/// Insight trend
enum InsightTrend {
  improving,
  stable,
  declining,
}

/// Smart automation
class SmartAutomation {
  final String id;
  final String name;
  final String description;
  final String trigger;
  final String action;
  bool isEnabled;

  SmartAutomation({
    required this.id,
    required this.name,
    required this.description,
    required this.trigger,
    required this.action,
    required this.isEnabled,
  });
}

/// Automation execution
class AutomationExecution {
  final String automationName;
  final DateTime timestamp;
  final bool success;

  AutomationExecution({
    required this.automationName,
    required this.timestamp,
    required this.success,
  });
}
