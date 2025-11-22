import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach/core/theme/app_colors.dart';
import 'package:upcoach/shared/widgets/custom_app_bar.dart';
import 'package:upcoach/shared/widgets/loading_indicator.dart';
import '../../domain/services/ai_service.dart';
import '../../domain/models/ai_response.dart';
import '../widgets/chat_message_widget.dart';
import '../widgets/ai_input_widget.dart';

final chatMessagesProvider = StateNotifierProvider<ChatMessagesNotifier, List<AIResponse>>((ref) {
  return ChatMessagesNotifier();
});

class ChatMessagesNotifier extends StateNotifier<List<AIResponse>> {
  ChatMessagesNotifier() : super([]);

  void addMessage(AIResponse message) {
    state = [...state, message];
  }

  void clearMessages() {
    state = [];
  }
}

class AICoachScreen extends ConsumerStatefulWidget {
  const AICoachScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AICoachScreen> createState() => _AICoachScreenState();
}

class _AICoachScreenState extends ConsumerState<AICoachScreen> {
  final _scrollController = ScrollController();
  final _sessionId = DateTime.now().millisecondsSinceEpoch.toString();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _sendInitialMessage();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendInitialMessage() async {
    final aiService = ref.read(aiServiceProvider);
    
    setState(() => _isLoading = true);
    
    try {
      final response = await aiService.sendMessage(
        "Hello! I'm here to help you with your coaching journey. What would you like to work on today?",
        sessionId: _sessionId,
      );
      
      ref.read(chatMessagesProvider.notifier).addMessage(response);
    } catch (e) {
      _showError('Failed to connect to AI coach');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage(String message) async {
    if (message.trim().isEmpty) return;

    // Add user message
    final userMessage = AIResponse(
      content: message,
      sessionId: _sessionId,
      role: 'user',
      timestamp: DateTime.now(),
    );
    ref.read(chatMessagesProvider.notifier).addMessage(userMessage);

    setState(() => _isLoading = true);
    
    try {
      final aiService = ref.read(aiServiceProvider);
      final messages = ref.read(chatMessagesProvider);
      
      // Get conversation history
      final history = messages.map((m) => {
        'role': m.role,
        'content': m.content,
      }).toList();
      
      final response = await aiService.getSmartResponse(
        message,
        conversationHistory: history,
      );
      
      ref.read(chatMessagesProvider.notifier).addMessage(response);
      
      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      _showError('Failed to send message');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: 'AI Coach',
        actions: [
          IconButton(
            icon: const Icon(Icons.insights),
            onPressed: () => context.go('/ai/insights'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(chatMessagesProvider.notifier).clearMessages();
              _sendInitialMessage();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty && !_isLoading
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(UIConstants.spacingMD),
                    itemCount: messages.length + (_isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == messages.length && _isLoading) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: LoadingIndicator()),
                        );
                      }
                      
                      final message = messages[index];
                      return ChatMessageWidget(
                        message: message,
                        isUser: message.role == 'user',
                      );
                    },
                  ),
          ),
          AIInputWidget(
            onSendMessage: _sendMessage,
            isLoading: _isLoading,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.psychology,
            size: 80,
            color: AppColors.primary.withOpacity(0.5),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Text(
            'Start Your AI Coaching Session',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Ask me anything about your goals, habits, or progress',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: UIConstants.spacingXL),
          _buildSuggestionChips(),
        ],
      ),
    );
  }

  Widget _buildSuggestionChips() {
    final suggestions = [
      'Help me set a fitness goal',
      'I need motivation',
      'Review my progress',
      'Create a morning routine',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: suggestions.map((suggestion) {
        return ActionChip(
          label: Text(suggestion),
          onPressed: () => _sendMessage(suggestion),
          backgroundColor: AppColors.primary.withOpacity(0.1),
          labelStyle: TextStyle(color: AppColors.primary),
        );
      }).toList(),
    );
  }
}