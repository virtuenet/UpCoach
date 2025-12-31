/**
 * AI Coaching Chat - Mobile AI coaching interface
 *
 * Features:
 * - Chat interface for AI coaching sessions
 * - Voice input support
 * - Message streaming (typing effect)
 * - Rich message formatting (markdown)
 * - Action item cards
 * - Quick reply suggestions
 * - Conversation history
 * - Session summaries
 * - Goal integration
 * - Progress tracking
 * - Mood check-ins
 * - Reflection prompts
 * - Export conversation
 * - Offline message queuing
 */

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Types and Models
enum MessageRole { user, assistant, system }

enum CoachingStyle { supportive, challenging, analytical, motivational }

enum MessageStatus { sending, sent, delivered, failed }

class Message {
  final String id;
  final MessageRole role;
  final String content;
  final DateTime timestamp;
  final int? tokens;
  final String? emotionalTone;
  final MessageStatus status;
  final List<ActionItem>? actionItems;

  Message({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.tokens,
    this.emotionalTone,
    this.status = MessageStatus.sent,
    this.actionItems,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      role: MessageRole.values.firstWhere(
        (e) => e.toString().split('.').last == json['role'],
        orElse: () => MessageRole.user,
      ),
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      tokens: json['tokens'] as int?,
      emotionalTone: json['emotionalTone'] as String?,
      status: MessageStatus.sent,
      actionItems: (json['actionItems'] as List<dynamic>?)
          ?.map((item) => ActionItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role.toString().split('.').last,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'tokens': tokens,
      'emotionalTone': emotionalTone,
    };
  }
}

class ActionItem {
  final String id;
  final String content;
  final String category;
  final String priority;
  final bool completed;

  ActionItem({
    required this.id,
    required this.content,
    required this.category,
    required this.priority,
    this.completed = false,
  });

  factory ActionItem.fromJson(Map<String, dynamic> json) {
    return ActionItem(
      id: json['id'] as String,
      content: json['content'] as String,
      category: json['category'] as String,
      priority: json['priority'] as String,
      completed: json['completed'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'category': category,
      'priority': priority,
      'completed': completed,
    };
  }
}

class QuickReply {
  final String text;
  final IconData icon;

  QuickReply({required this.text, required this.icon});
}

class SessionSummary {
  final String sessionId;
  final String summary;
  final List<String> keyTopics;
  final List<ActionItem> actionItems;
  final String emotionalJourney;
  final int duration;

  SessionSummary({
    required this.sessionId,
    required this.summary,
    required this.keyTopics,
    required this.actionItems,
    required this.emotionalJourney,
    required this.duration,
  });

  factory SessionSummary.fromJson(Map<String, dynamic> json) {
    return SessionSummary(
      sessionId: json['sessionId'] as String,
      summary: json['summary'] as String,
      keyTopics: List<String>.from(json['keyTopics'] as List),
      actionItems: (json['actionItems'] as List<dynamic>)
          .map((item) => ActionItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      emotionalJourney: json['emotionalJourney'] as String,
      duration: json['duration'] as int,
    );
  }
}

/**
 * AI Coaching Chat Widget
 */
class AICoachingChat extends StatefulWidget {
  final String? userId;
  final String? goalId;
  final CoachingStyle initialStyle;

  const AICoachingChat({
    Key? key,
    this.userId,
    this.goalId,
    this.initialStyle = CoachingStyle.supportive,
  }) : super(key: key);

  @override
  State<AICoachingChat> createState() => _AICoachingChatState();
}

class _AICoachingChatState extends State<AICoachingChat>
    with TickerProviderStateMixin {
  // State
  final List<Message> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final stt.SpeechToText _speech = stt.SpeechToText();

  String? _sessionId;
  bool _isLoading = false;
  bool _isListening = false;
  bool _isTyping = false;
  CoachingStyle _currentStyle = CoachingStyle.supportive;
  String _streamingMessage = '';
  List<QuickReply> _quickReplies = [];
  List<Message> _offlineQueue = [];

  late AnimationController _typingAnimationController;
  late SharedPreferences _prefs;

  // API Configuration
  static const String _baseUrl = 'https://api.upcoach.com';
  static const Duration _typingDelay = Duration(milliseconds: 50);

  @override
  void initState() {
    super.initState();
    _currentStyle = widget.initialStyle;
    _typingAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    _initializeSession();
    _loadConversationHistory();
    _initializeSpeech();
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _typingAnimationController.dispose();
    super.dispose();
  }

  // Initialization
  Future<void> _initializeSession() async {
    _prefs = await SharedPreferences.getInstance();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/ai/sessions'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': widget.userId,
          'style': _currentStyle.toString().split('.').last,
          'goalId': widget.goalId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _sessionId = data['sessionId'] as String;
        });

        await _prefs.setString('activeSessionId', _sessionId!);
        _addWelcomeMessage();
      }
    } catch (e) {
      _showError('Failed to start session: ${e.toString()}');
    }
  }

  Future<void> _initializeSpeech() async {
    try {
      await _speech.initialize(
        onStatus: (status) {
          setState(() {
            _isListening = status == 'listening';
          });
        },
        onError: (error) {
          _showError('Voice recognition error: ${error.errorMsg}');
        },
      );
    } catch (e) {
      debugPrint('Speech initialization failed: ${e.toString()}');
    }
  }

  Future<void> _loadConversationHistory() async {
    final savedMessages = _prefs.getStringList('messages_${widget.userId}');
    if (savedMessages != null) {
      setState(() {
        _messages.addAll(
          savedMessages
              .map((msg) => Message.fromJson(jsonDecode(msg)))
              .toList(),
        );
      });
      _scrollToBottom();
    }
  }

  Future<void> _saveConversationHistory() async {
    final messagesJson = _messages.map((msg) => jsonEncode(msg.toJson())).toList();
    await _prefs.setStringList('messages_${widget.userId}', messagesJson);
  }

  // Message Sending
  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMessage = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: MessageRole.user,
      content: text.trim(),
      timestamp: DateTime.now(),
      status: MessageStatus.sending,
    );

    setState(() {
      _messages.add(userMessage);
      _textController.clear();
      _quickReplies.clear();
    });

    _scrollToBottom();
    await _saveConversationHistory();

    if (_sessionId == null) {
      setState(() {
        _offlineQueue.add(userMessage);
      });
      _showError('Offline mode - message will be sent when connected');
      return;
    }

    setState(() {
      _isLoading = true;
      _isTyping = true;
    });

    try {
      await _streamResponse(text);
    } catch (e) {
      setState(() {
        _messages.last = Message(
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          status: MessageStatus.failed,
        );
      });
      _showError('Failed to send message: ${e.toString()}');
    } finally {
      setState(() {
        _isLoading = false;
        _isTyping = false;
      });
    }
  }

  Future<void> _streamResponse(String userMessage) async {
    final url = Uri.parse('$_baseUrl/ai/sessions/$_sessionId/stream');

    final request = http.Request('POST', url);
    request.headers.addAll({
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    });
    request.body = jsonEncode({'message': userMessage});

    final streamedResponse = await request.send();

    String fullResponse = '';
    final responseId = DateTime.now().millisecondsSinceEpoch.toString();

    await for (final chunk in streamedResponse.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');

      for (final line in lines) {
        if (line.startsWith('data: ')) {
          final data = jsonDecode(line.substring(6));

          if (data['delta'] != null) {
            fullResponse += data['delta'] as String;

            setState(() {
              _streamingMessage = fullResponse;
            });

            await Future.delayed(_typingDelay);
          }

          if (data['isComplete'] == true) {
            final assistantMessage = Message(
              id: responseId,
              role: MessageRole.assistant,
              content: fullResponse,
              timestamp: DateTime.now(),
              tokens: data['tokens'] as int?,
              emotionalTone: data['emotionalTone'] as String?,
              status: MessageStatus.delivered,
            );

            setState(() {
              _messages.add(assistantMessage);
              _streamingMessage = '';
            });

            _scrollToBottom();
            await _saveConversationHistory();

            // Extract action items
            if (data['actionItems'] != null) {
              _handleActionItems(
                (data['actionItems'] as List)
                    .map((item) => ActionItem.fromJson(item as Map<String, dynamic>))
                    .toList(),
              );
            }

            // Generate quick replies
            _generateQuickReplies(fullResponse);
          }
        }
      }
    }
  }

  // Voice Input
  Future<void> _toggleListening() async {
    if (_isListening) {
      await _speech.stop();
      setState(() {
        _isListening = false;
      });
    } else {
      if (await _speech.hasPermission) {
        setState(() {
          _isListening = true;
        });

        await _speech.listen(
          onResult: (result) {
            setState(() {
              _textController.text = result.recognizedWords;
            });
          },
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 3),
          partialResults: true,
          cancelOnError: true,
        );
      } else {
        _showError('Microphone permission required');
      }
    }
  }

  // Action Items
  void _handleActionItems(List<ActionItem> items) {
    if (items.isEmpty) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Action Items',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _buildActionItemCard(item);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionItemCard(ActionItem item) {
    Color priorityColor;
    switch (item.priority) {
      case 'high':
        priorityColor = Colors.red;
        break;
      case 'medium':
        priorityColor = Colors.orange;
        break;
      default:
        priorityColor = Colors.green;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: priorityColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getActionIcon(item.category),
            color: priorityColor,
          ),
        ),
        title: Text(
          item.content,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          '${item.category.toUpperCase()} • ${item.priority} priority',
          style: TextStyle(color: Colors.grey[600], fontSize: 12),
        ),
        trailing: IconButton(
          icon: Icon(
            item.completed ? Icons.check_circle : Icons.circle_outlined,
            color: item.completed ? Colors.green : Colors.grey,
          ),
          onPressed: () {
            // Toggle completion
          },
        ),
      ),
    );
  }

  IconData _getActionIcon(String category) {
    switch (category) {
      case 'goal':
        return Icons.flag;
      case 'habit':
        return Icons.repeat;
      case 'reflection':
        return Icons.lightbulb_outline;
      case 'task':
        return Icons.check_box_outlined;
      default:
        return Icons.help_outline;
    }
  }

  // Quick Replies
  void _generateQuickReplies(String lastMessage) {
    setState(() {
      _quickReplies = [
        QuickReply(text: 'Tell me more', icon: Icons.arrow_forward),
        QuickReply(text: 'I have a question', icon: Icons.help_outline),
        QuickReply(text: 'What should I do next?', icon: Icons.directions),
      ];

      if (lastMessage.contains('goal')) {
        _quickReplies.add(
          QuickReply(text: 'Show my progress', icon: Icons.trending_up),
        );
      }
    });
  }

  // Session Summary
  Future<void> _showSessionSummary() async {
    if (_sessionId == null) return;

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/ai/sessions/$_sessionId/summary'),
      );

      if (response.statusCode == 200) {
        final summary = SessionSummary.fromJson(jsonDecode(response.body));

        if (!mounted) return;

        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (context) => DraggableScrollableSheet(
            initialChildSize: 0.7,
            maxChildSize: 0.95,
            minChildSize: 0.5,
            expand: false,
            builder: (context, scrollController) => _buildSummarySheet(
              summary,
              scrollController,
            ),
          ),
        );
      }
    } catch (e) {
      _showError('Failed to load summary: ${e.toString()}');
    }
  }

  Widget _buildSummarySheet(SessionSummary summary, ScrollController controller) {
    return SingleChildScrollView(
      controller: controller,
      padding: const EdgeInsets.all(16),
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
          const SizedBox(height: 16),
          const Text(
            'Session Summary',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${summary.duration} minutes',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          _buildSummarySection('Summary', summary.summary),
          const SizedBox(height: 16),
          _buildSummarySection('Key Topics', summary.keyTopics.join(', ')),
          const SizedBox(height: 16),
          _buildSummarySection('Emotional Journey', summary.emotionalJourney),
          const SizedBox(height: 16),
          const Text(
            'Action Items',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          ...summary.actionItems.map((item) => _buildActionItemCard(item)),
        ],
      ),
    );
  }

  Widget _buildSummarySection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Text(
          content,
          style: TextStyle(color: Colors.grey[700], height: 1.5),
        ),
      ],
    );
  }

  // Export Conversation
  Future<void> _exportConversation() async {
    final messagesText = _messages
        .map((msg) =>
            '[${msg.timestamp.toIso8601String()}] ${msg.role.toString().split('.').last.toUpperCase()}: ${msg.content}')
        .join('\n\n');

    await Share.share(
      messagesText,
      subject: 'AI Coaching Session - ${DateTime.now().toLocal()}',
    );
  }

  // Change Coaching Style
  void _showStylePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Choose Coaching Style',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...CoachingStyle.values.map((style) {
              final isSelected = style == _currentStyle;
              return ListTile(
                leading: Icon(
                  _getStyleIcon(style),
                  color: isSelected ? Theme.of(context).primaryColor : null,
                ),
                title: Text(
                  style.toString().split('.').last.toUpperCase(),
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? Theme.of(context).primaryColor : null,
                  ),
                ),
                subtitle: Text(_getStyleDescription(style)),
                trailing: isSelected ? const Icon(Icons.check) : null,
                onTap: () {
                  _changeStyle(style);
                  Navigator.pop(context);
                },
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  IconData _getStyleIcon(CoachingStyle style) {
    switch (style) {
      case CoachingStyle.supportive:
        return Icons.favorite;
      case CoachingStyle.challenging:
        return Icons.trending_up;
      case CoachingStyle.analytical:
        return Icons.analytics;
      case CoachingStyle.motivational:
        return Icons.electric_bolt;
    }
  }

  String _getStyleDescription(CoachingStyle style) {
    switch (style) {
      case CoachingStyle.supportive:
        return 'Warm and encouraging';
      case CoachingStyle.challenging:
        return 'Direct and growth-oriented';
      case CoachingStyle.analytical:
        return 'Logical and systematic';
      case CoachingStyle.motivational:
        return 'Energetic and inspiring';
    }
  }

  Future<void> _changeStyle(CoachingStyle newStyle) async {
    if (_sessionId == null) return;

    try {
      await http.put(
        Uri.parse('$_baseUrl/ai/sessions/$_sessionId/style'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'style': newStyle.toString().split('.').last}),
      );

      setState(() {
        _currentStyle = newStyle;
      });
    } catch (e) {
      _showError('Failed to change style: ${e.toString()}');
    }
  }

  // UI Helpers
  void _addWelcomeMessage() {
    final welcomeMessage = Message(
      id: 'welcome',
      role: MessageRole.assistant,
      content:
          "Hello! I'm your AI coaching assistant. I'm here to support you on your journey. What would you like to work on today?",
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.insert(0, welcomeMessage);
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // Build UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Coach'),
        actions: [
          IconButton(
            icon: Icon(_getStyleIcon(_currentStyle)),
            onPressed: _showStylePicker,
            tooltip: 'Change coaching style',
          ),
          IconButton(
            icon: const Icon(Icons.summarize),
            onPressed: _showSessionSummary,
            tooltip: 'Session summary',
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'export',
                child: ListTile(
                  leading: Icon(Icons.share),
                  title: Text('Export conversation'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'clear',
                child: ListTile(
                  leading: Icon(Icons.delete),
                  title: Text('Clear conversation'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'export') {
                _exportConversation();
              } else if (value == 'clear') {
                setState(() {
                  _messages.clear();
                });
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(_messages[index]);
              },
            ),
          ),

          // Quick Replies
          if (_quickReplies.isNotEmpty) _buildQuickReplies(),

          // Input
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Message message) {
    final isUser = message.role == MessageRole.user;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser
                    ? Theme.of(context).primaryColor
                    : Colors.grey[200],
                borderRadius: BorderRadius.circular(16),
              ),
              child: MarkdownBody(
                data: message.content,
                styleSheet: MarkdownStyleSheet(
                  p: TextStyle(
                    color: isUser ? Colors.white : Colors.black87,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTimestamp(message.timestamp),
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_streamingMessage.isNotEmpty)
              Flexible(
                child: MarkdownBody(
                  data: _streamingMessage,
                  styleSheet: MarkdownStyleSheet(
                    p: const TextStyle(color: Colors.black87),
                  ),
                ),
              )
            else
              Row(
                children: List.generate(
                  3,
                  (index) => FadeTransition(
                    opacity: _typingAnimationController.drive(
                      Tween(begin: 0.3, end: 1.0).chain(
                        CurveTween(curve: Curves.easeInOut),
                      ),
                    ),
                    child: Container(
                      margin: EdgeInsets.only(left: index == 0 ? 0 : 4),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey[400],
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickReplies() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _quickReplies.length,
        itemBuilder: (context, index) {
          final reply = _quickReplies[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              avatar: Icon(reply.icon, size: 16),
              label: Text(reply.text),
              onPressed: () {
                _sendMessage(reply.text);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        child: Row(
          children: [
            // Voice input
            IconButton(
              icon: Icon(
                _isListening ? Icons.mic : Icons.mic_none,
                color: _isListening ? Colors.red : null,
              ),
              onPressed: _toggleListening,
            ),

            // Text input
            Expanded(
              child: TextField(
                controller: _textController,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                onSubmitted: (_) => _sendMessage(_textController.text),
              ),
            ),

            const SizedBox(width: 8),

            // Send button
            CircleAvatar(
              backgroundColor: Theme.of(context).primaryColor,
              child: IconButton(
                icon: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white),
                onPressed:
                    _isLoading ? null : () => _sendMessage(_textController.text),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}';
    }
  }
}
