import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'dart:async';

// ============================================================================
// DATA MODELS
// ============================================================================

class ChatMessage {
  final String id;
  final String content;
  final bool isUser;
  final DateTime timestamp;
  final MessageStatus status;
  final List<String>? suggestions;
  final List<ContextCard>? contextCards;

  ChatMessage({
    required this.id,
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.status = MessageStatus.sent,
    this.suggestions,
    this.contextCards,
  });
}

enum MessageStatus { sending, sent, error }

class ContextCard {
  final String type; // 'goal', 'habit', 'insight'
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  ContextCard({
    required this.type,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
  });
}

// ============================================================================
// AI CHAT SCREEN
// ============================================================================

class AIChatScreen extends StatefulWidget {
  const AIChatScreen({Key? key}) : super(key: key);

  @override
  State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> with TickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  final stt.SpeechToText _speech = stt.SpeechToText();

  bool _isLoading = false;
  bool _isSpeechAvailable = false;
  bool _isListening = false;
  String _conversationId = '';
  List<String> _quickSuggestions = [
    "What are my goals for today?",
    "Show me my progress",
    "I need motivation",
    "Help me set a new goal",
  ];

  @override
  void initState() {
    super.initState();
    _initializeSpeech();
    _startConversation();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  Future<void> _initializeSpeech() async {
    try {
      _isSpeechAvailable = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
          }
        },
        onError: (error) {
          setState(() => _isListening = false);
          _showError('Voice input error: ${error.errorMsg}');
        },
      );
      setState(() {});
    } catch (e) {
      print('Speech initialization error: $e');
    }
  }

  Future<void> _startConversation() async {
    // Initialize conversation with API
    _conversationId = 'conv_${DateTime.now().millisecondsSinceEpoch}';

    // Add welcome message
    setState(() {
      _messages.add(ChatMessage(
        id: 'welcome',
        content:
            "Hi! I'm your AI coach. I'm here to help you achieve your goals, track your progress, and provide personalized guidance. How can I support you today?",
        isUser: false,
        timestamp: DateTime.now(),
        suggestions: _quickSuggestions,
      ));
    });

    _scrollToBottom();
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMessage = ChatMessage(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      content: text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
      status: MessageStatus.sending,
    );

    setState(() {
      _messages.add(userMessage);
      _isLoading = true;
    });

    _messageController.clear();
    _scrollToBottom();

    try {
      // Call API to get AI response
      final response = await _getAIResponse(text);

      setState(() {
        // Update user message status
        final index = _messages.indexWhere((m) => m.id == userMessage.id);
        if (index != -1) {
          _messages[index] = ChatMessage(
            id: userMessage.id,
            content: userMessage.content,
            isUser: true,
            timestamp: userMessage.timestamp,
            status: MessageStatus.sent,
          );
        }

        // Add AI response
        _messages.add(response);
        _isLoading = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        final index = _messages.indexWhere((m) => m.id == userMessage.id);
        if (index != -1) {
          _messages[index] = ChatMessage(
            id: userMessage.id,
            content: userMessage.content,
            isUser: true,
            timestamp: userMessage.timestamp,
            status: MessageStatus.error,
          );
        }
        _isLoading = false;
      });
      _showError('Failed to send message. Please try again.');
    }
  }

  Future<ChatMessage> _getAIResponse(String userMessage) async {
    // Simulate API call
    await Future.delayed(const Duration(milliseconds: 1500));

    // Mock response generation based on keywords
    String response = _generateMockResponse(userMessage);
    List<String>? suggestions = _generateSuggestions(userMessage);
    List<ContextCard>? contextCards = _generateContextCards(userMessage);

    return ChatMessage(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      content: response,
      isUser: false,
      timestamp: DateTime.now(),
      suggestions: suggestions,
      contextCards: contextCards,
    );
  }

  String _generateMockResponse(String userMessage) {
    final lower = userMessage.toLowerCase();

    if (lower.contains('goal') || lower.contains('set')) {
      return "I'd love to help you set a new goal! What would you like to achieve? Let's make it specific and actionable.";
    } else if (lower.contains('progress') || lower.contains('doing')) {
      return "You're doing great! You're on a 7-day streak and have completed 3 out of 5 active goals this week. Your fitness goal is at 80% completion. Keep up the excellent work!";
    } else if (lower.contains('motivat') || lower.contains('inspire')) {
      return "You've got this! Remember why you started - every small step forward is progress. You've already shown commitment by maintaining your streak. What's one thing you can do today to move closer to your goals?";
    } else if (lower.contains('help') || lower.contains('struggling')) {
      return "I hear you. It's okay to find things challenging. What specific obstacle are you facing right now? Let's break it down together and find a solution.";
    } else if (lower.contains('habit') || lower.contains('track')) {
      return "Great! Habit tracking is powerful. What habit would you like to track? How often do you want to do it - daily, weekly, or custom?";
    } else {
      return "I understand. Tell me more about what's on your mind, and I'll provide personalized guidance to help you move forward.";
    }
  }

  List<String> _generateSuggestions(String userMessage) {
    final lower = userMessage.toLowerCase();

    if (lower.contains('goal')) {
      return [
        "Help me break it down",
        "Set a deadline",
        "Create action steps",
      ];
    } else if (lower.contains('progress')) {
      return [
        "Show detailed analytics",
        "Compare with last week",
        "View all achievements",
      ];
    } else {
      return [
        "What should I focus on?",
        "Show my goals",
        "Track a new habit",
      ];
    }
  }

  List<ContextCard>? _generateContextCards(String userMessage) {
    final lower = userMessage.toLowerCase();

    if (lower.contains('progress') || lower.contains('goal')) {
      return [
        ContextCard(
          type: 'goal',
          title: 'Fitness Goal',
          subtitle: '80% complete - On track!',
          icon: Icons.fitness_center,
          onTap: () => _showSnackbar('Opening Fitness Goal...'),
        ),
        ContextCard(
          type: 'habit',
          title: 'Morning Meditation',
          subtitle: '7-day streak',
          icon: Icons.self_improvement,
          onTap: () => _showSnackbar('Opening Meditation Habit...'),
        ),
      ];
    }
    return null;
  }

  // ============================================================================
  // VOICE INPUT
  // ============================================================================

  Future<void> _startListening() async {
    if (!_isSpeechAvailable) {
      _showError('Voice input is not available on this device');
      return;
    }

    if (_isListening) {
      await _stopListening();
      return;
    }

    setState(() => _isListening = true);

    await _speech.listen(
      onResult: (result) {
        setState(() {
          _messageController.text = result.recognizedWords;
        });

        if (result.finalResult) {
          _stopListening();
        }
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      partialResults: true,
      cancelOnError: true,
    );
  }

  Future<void> _stopListening() async {
    if (_isListening) {
      await _speech.stop();
      setState(() => _isListening = false);
    }
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

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
      ),
    );
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  // ============================================================================
  // BUILD UI
  // ============================================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Coach'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              // Show conversation history
              _showSnackbar('Conversation history');
            },
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showAboutDialog();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _messages.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return _buildMessageBubble(_messages[index]);
                    },
                  ),
          ),

          // Loading indicator
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                children: [
                  SizedBox(width: 16),
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Text('AI is thinking...', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),

          // Input area
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 80,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Start a conversation',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Ask me anything about your goals, progress, or habits',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment:
            message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!message.isUser) ...[
                CircleAvatar(
                  radius: 16,
                  backgroundColor: Theme.of(context).primaryColor,
                  child: const Icon(Icons.psychology, size: 18, color: Colors.white),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: message.isUser
                        ? Theme.of(context).primaryColor
                        : Colors.grey[200],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    message.content,
                    style: TextStyle(
                      color: message.isUser ? Colors.white : Colors.black87,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              if (message.isUser) ...[
                const SizedBox(width: 8),
                CircleAvatar(
                  radius: 16,
                  backgroundColor: Colors.grey[300],
                  child: const Icon(Icons.person, size: 18, color: Colors.black54),
                ),
              ],
            ],
          ),

          // Context cards
          if (message.contextCards != null && message.contextCards!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 40),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: message.contextCards!
                    .map((card) => _buildContextCard(card))
                    .toList(),
              ),
            ),

          // Suggestions
          if (message.suggestions != null && message.suggestions!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 40),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: message.suggestions!
                    .map((suggestion) => _buildSuggestionChip(suggestion))
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildContextCard(ContextCard card) {
    return InkWell(
      onTap: card.onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(card.icon, size: 20, color: Theme.of(context).primaryColor),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  card.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Text(
                  card.subtitle,
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChip(String suggestion) {
    return ActionChip(
      label: Text(suggestion, style: const TextStyle(fontSize: 13)),
      onPressed: () {
        _messageController.text = suggestion;
        _sendMessage(suggestion);
      },
      backgroundColor: Colors.white,
      side: BorderSide(color: Theme.of(context).primaryColor),
    );
  }

  Widget _buildInputArea() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: SafeArea(
        child: Row(
          children: [
            // Voice input button
            IconButton(
              icon: Icon(
                _isListening ? Icons.mic : Icons.mic_none,
                color: _isListening ? Colors.red : Colors.grey[600],
              ),
              onPressed: _isSpeechAvailable ? _startListening : null,
            ),

            // Text input
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: _isListening ? 'Listening...' : 'Type a message...',
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                onSubmitted: _sendMessage,
              ),
            ),

            // Send button
            IconButton(
              icon: Icon(
                Icons.send,
                color: Theme.of(context).primaryColor,
              ),
              onPressed: () => _sendMessage(_messageController.text),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AI Coach'),
        content: const Text(
          'Your personal AI coaching assistant powered by advanced NLP and machine learning. '
          'I can help you set goals, track habits, analyze progress, and provide personalized guidance.\n\n'
          'Features:\n'
          '• Natural language understanding\n'
          '• Context-aware responses\n'
          '• Voice input support\n'
          '• Personalized recommendations',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}
