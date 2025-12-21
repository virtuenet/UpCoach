import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/group_session_models.dart';
import '../providers/group_session_provider.dart';
import '../widgets/chat_message_bubble.dart';
import '../widgets/poll_widget.dart';

/// Live Session Screen
/// Displays the live group coaching session with video, chat, and Q&A
class LiveSessionScreen extends ConsumerStatefulWidget {
  final String sessionId;

  const LiveSessionScreen({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<LiveSessionScreen> createState() => _LiveSessionScreenState();
}

class _LiveSessionScreenState extends ConsumerState<LiveSessionScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _showChat = true;
  bool _showQna = false;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(groupSessionProvider(widget.sessionId));
    final chatState = ref.watch(liveSessionChatProvider(widget.sessionId));
    final session = sessionState.session;

    if (session == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Video area
            Expanded(
              flex: 2,
              child: Stack(
                children: [
                  // Video placeholder
                  Container(
                    color: Colors.grey[900],
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundImage: session.coachAvatarUrl != null
                                ? NetworkImage(session.coachAvatarUrl!)
                                : null,
                            child: session.coachAvatarUrl == null
                                ? const Icon(Icons.person, size: 40)
                                : null,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            session.coachName ?? 'Coach',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'LIVE',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Top bar
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.black54, Colors.transparent],
                        ),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_back, color: Colors.white),
                            onPressed: () => Navigator.pop(context),
                          ),
                          Expanded(
                            child: Text(
                              session.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          _ParticipantCount(count: session.currentParticipants),
                        ],
                      ),
                    ),
                  ),

                  // Control buttons
                  Positioned(
                    bottom: 12,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _ControlButton(
                          icon: Icons.mic,
                          label: 'Mute',
                          onPressed: () {},
                        ),
                        const SizedBox(width: 16),
                        _ControlButton(
                          icon: Icons.videocam,
                          label: 'Video',
                          onPressed: () {},
                        ),
                        const SizedBox(width: 16),
                        _ControlButton(
                          icon: Icons.pan_tool,
                          label: 'Raise Hand',
                          onPressed: () {},
                        ),
                        const SizedBox(width: 16),
                        _ControlButton(
                          icon: Icons.call_end,
                          label: 'Leave',
                          isDestructive: true,
                          onPressed: () => _showLeaveDialog(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Chat/Q&A area
            Expanded(
              flex: 3,
              child: Container(
                color: Theme.of(context).scaffoldBackgroundColor,
                child: Column(
                  children: [
                    // Tab bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          _TabButton(
                            label: 'Chat',
                            isSelected: _showChat && !_showQna,
                            onTap: () => setState(() {
                              _showChat = true;
                              _showQna = false;
                            }),
                          ),
                          const SizedBox(width: 8),
                          _TabButton(
                            label: 'Q&A',
                            isSelected: _showQna,
                            onTap: () => setState(() {
                              _showQna = true;
                              _showChat = false;
                            }),
                          ),
                          const Spacer(),
                          if (session.pollsEnabled)
                            IconButton(
                              icon: const Icon(Icons.poll_outlined),
                              onPressed: _showCreatePollDialog,
                              tooltip: 'Create Poll',
                            ),
                        ],
                      ),
                    ),

                    // Messages list
                    Expanded(
                      child: chatState.isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _getFilteredMessages(chatState.messages).length,
                              itemBuilder: (context, index) {
                                final message = _getFilteredMessages(chatState.messages)[index];

                                if (message.messageType == ChatMessageType.poll) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: PollWidget(
                                      message: message,
                                      onVote: (optionId) {
                                        ref.read(liveSessionChatProvider(widget.sessionId).notifier)
                                            .votePoll(message.id, optionId);
                                      },
                                    ),
                                  );
                                }

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: ChatMessageBubble(
                                    message: message,
                                    isQuestion: _showQna,
                                    onReaction: (emoji) {
                                      ref.read(liveSessionChatProvider(widget.sessionId).notifier)
                                          .addReaction(message.id, emoji);
                                    },
                                    onUpvote: message.messageType == ChatMessageType.question
                                        ? () {
                                            ref.read(liveSessionChatProvider(widget.sessionId).notifier)
                                                .upvoteQuestion(message.id);
                                          }
                                        : null,
                                  ),
                                );
                              },
                            ),
                    ),

                    // Input field
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 4,
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
                                hintText: _showQna ? 'Ask a question...' : 'Type a message...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                              ),
                              maxLines: 1,
                              textInputAction: TextInputAction.send,
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
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<ChatMessage> _getFilteredMessages(List<ChatMessage> messages) {
    if (_showQna) {
      return messages.where((m) =>
        m.messageType == ChatMessageType.question ||
        m.messageType == ChatMessageType.answer
      ).toList();
    }
    return messages.where((m) =>
      m.messageType != ChatMessageType.question &&
      m.messageType != ChatMessageType.answer
    ).toList();
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    final type = _showQna ? ChatMessageType.question : ChatMessageType.text;
    ref.read(liveSessionChatProvider(widget.sessionId).notifier)
        .sendMessage(content, type: type);

    _messageController.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showCreatePollDialog() {
    final questionController = TextEditingController();
    final optionControllers = [
      TextEditingController(),
      TextEditingController(),
    ];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Create Poll'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: questionController,
                  decoration: const InputDecoration(
                    labelText: 'Question',
                    hintText: 'Enter your poll question',
                  ),
                ),
                const SizedBox(height: 16),
                ...optionControllers.asMap().entries.map((entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TextField(
                    controller: entry.value,
                    decoration: InputDecoration(
                      labelText: 'Option ${entry.key + 1}',
                      suffixIcon: optionControllers.length > 2
                          ? IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () {
                                setState(() {
                                  optionControllers.removeAt(entry.key);
                                });
                              },
                            )
                          : null,
                    ),
                  ),
                )),
                if (optionControllers.length < 4)
                  TextButton.icon(
                    onPressed: () {
                      setState(() {
                        optionControllers.add(TextEditingController());
                      });
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Option'),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final question = questionController.text.trim();
                final options = optionControllers
                    .map((c) => c.text.trim())
                    .where((o) => o.isNotEmpty)
                    .toList();

                if (question.isNotEmpty && options.length >= 2) {
                  ref.read(liveSessionChatProvider(widget.sessionId).notifier)
                      .createPoll(question, options);
                  Navigator.pop(context);
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  void _showLeaveDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Session?'),
        content: const Text('Are you sure you want to leave this session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Stay'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
  }
}

/// Participant count indicator
class _ParticipantCount extends StatelessWidget {
  final int count;

  const _ParticipantCount({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white24,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.people, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

/// Control button
class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final bool isDestructive;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          decoration: BoxDecoration(
            color: isDestructive ? Colors.red : Colors.white24,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(icon, color: Colors.white),
            onPressed: onPressed,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }
}

/// Tab button
class _TabButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Theme.of(context).primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : null,
            fontWeight: isSelected ? FontWeight.bold : null,
          ),
        ),
      ),
    );
  }
}
