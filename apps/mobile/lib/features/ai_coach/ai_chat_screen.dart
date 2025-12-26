import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/ai_coach_service.dart';

/// AI Chat Screen (Phase 8)
///
/// Conversational AI coach interface with:
/// - Message bubbles for user and assistant
/// - Typing indicators
/// - Suggested actions (quick replies)
/// - Context-aware responses
/// - Intent detection
class AIChatScreen extends ConsumerStatefulWidget {
  const AIChatScreen({super.key});

  @override
  ConsumerState<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends ConsumerState<AIChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessageModel> _messages = [];
  bool _isTyping = false;
  String? _conversationId;

  @override
  void initState() {
    super.initState();
    _loadConversationHistory();
  }

  Future<void> _loadConversationHistory() async {
    // Load recent conversation from service
    // In production: fetch from API
    setState(() {
      _messages.add(ChatMessageModel(
        id: 'welcome',
        role: 'assistant',
        content: "Hi there! I'm your AI coach. How can I support your goals today?",
        timestamp: DateTime.now(),
      ));
    });
  }

  Future<void> _sendMessage(String message) async {
    if (message.trim().isEmpty) return;

    final userMessage = ChatMessageModel(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: message,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _messageController.clear();
      _isTyping = true;
    });

    _scrollToBottom();

    try {
      // Call AI coach service
      final response = await ref.read(aiCoachServiceProvider).sendMessage(
        message: message,
        conversationId: _conversationId,
      );

      setState(() {
        _conversationId = response.conversationId;
        _messages.add(ChatMessageModel(
          id: 'msg_${DateTime.now().millisecondsSinceEpoch}_assistant',
          role: 'assistant',
          content: response.message,
          intent: response.intent,
          suggestedActions: response.suggestedActions,
          timestamp: DateTime.now(),
        ));
        _isTyping = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        _isTyping = false;
        _messages.add(ChatMessageModel(
          id: 'error_${DateTime.now().millisecondsSinceEpoch}',
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again!",
          timestamp: DateTime.now(),
        ));
      });
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Coach'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // Show settings
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16.0),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= _messages.length) {
                  // Typing indicator
                  return _buildTypingIndicator();
                }

                final message = _messages[index];
                return _buildMessageBubble(message);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessageModel message) {
    final isUser = message.role == 'user';

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16.0),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              decoration: BoxDecoration(
                color: isUser
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey[200],
                borderRadius: BorderRadius.circular(20.0),
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: isUser ? Colors.white : Colors.black87,
                  fontSize: 16.0,
                ),
              ),
            ),
            if (message.suggestedActions != null && message.suggestedActions!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Wrap(
                  spacing: 8.0,
                  runSpacing: 8.0,
                  children: message.suggestedActions!.map((action) {
                    return ActionChip(
                      label: Text(action.label),
                      avatar: Icon(
                        _getIconForAction(action.type),
                        size: 16.0,
                      ),
                      onPressed: () => _handleSuggestedAction(action),
                    );
                  }).toList(),
                ),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                _formatTime(message.timestamp),
                style: TextStyle(
                  fontSize: 12.0,
                  color: Colors.grey[600],
                ),
              ),
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
        margin: const EdgeInsets.only(bottom: 16.0),
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(20.0),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildDot(delay: 0),
            const SizedBox(width: 4.0),
            _buildDot(delay: 200),
            const SizedBox(width: 4.0),
            _buildDot(delay: 400),
          ],
        ),
      ),
    );
  }

  Widget _buildDot({required int delay}) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Container(
            width: 8.0,
            height: 8.0,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4.0,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Type your message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24.0),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 12.0,
                ),
              ),
              maxLines: null,
              textCapitalization: TextCapitalization.sentences,
              onSubmitted: _sendMessage,
            ),
          ),
          const SizedBox(width: 12.0),
          FloatingActionButton(
            onPressed: () => _sendMessage(_messageController.text),
            mini: true,
            child: const Icon(Icons.send),
          ),
        ],
      ),
    );
  }

  void _handleSuggestedAction(SuggestedActionModel action) {
    // Navigate to appropriate screen based on action
    switch (action.action) {
      case 'navigate':
        final screen = action.data?['screen'];
        if (screen == 'CreateGoal') {
          Navigator.pushNamed(context, '/create-goal');
        } else if (screen == 'CreateHabit') {
          Navigator.pushNamed(context, '/create-habit');
        } else if (screen == 'Analytics') {
          Navigator.pushNamed(context, '/analytics');
        }
        break;
      default:
        // Handle other actions
        break;
    }
  }

  IconData _getIconForAction(String type) {
    switch (type) {
      case 'navigation':
        return Icons.arrow_forward;
      case 'action':
        return Icons.check_circle;
      default:
        return Icons.info;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inDays < 1) {
      return '${diff.inHours}h ago';
    } else {
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

/// Chat Message Model
class ChatMessageModel {
  final String id;
  final String role;
  final String content;
  final String? intent;
  final List<SuggestedActionModel>? suggestedActions;
  final DateTime timestamp;

  ChatMessageModel({
    required this.id,
    required this.role,
    required this.content,
    this.intent,
    this.suggestedActions,
    required this.timestamp,
  });
}

/// Suggested Action Model
class SuggestedActionModel {
  final String type;
  final String label;
  final String action;
  final Map<String, dynamic>? data;

  SuggestedActionModel({
    required this.type,
    required this.label,
    required this.action,
    this.data,
  });
}

/// AI Coach Service Provider
final aiCoachServiceProvider = Provider<AICoachService>((ref) {
  return AICoachService();
});
