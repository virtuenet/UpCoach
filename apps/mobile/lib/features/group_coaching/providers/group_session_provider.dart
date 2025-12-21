import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/group_session_models.dart';

/// Group session list state
class GroupSessionListState {
  final List<GroupSession> sessions;
  final bool isLoading;
  final String? error;
  final bool hasMore;
  final int page;

  const GroupSessionListState({
    this.sessions = const [],
    this.isLoading = false,
    this.error,
    this.hasMore = true,
    this.page = 1,
  });

  GroupSessionListState copyWith({
    List<GroupSession>? sessions,
    bool? isLoading,
    String? error,
    bool? hasMore,
    int? page,
  }) {
    return GroupSessionListState(
      sessions: sessions ?? this.sessions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
    );
  }
}

/// Group session list notifier
class GroupSessionListNotifier extends StateNotifier<GroupSessionListState> {
  GroupSessionListNotifier() : super(const GroupSessionListState());

  SessionType? _filterType;
  String? _filterCategory;
  bool? _filterFree;

  /// Load sessions
  Future<void> loadSessions({bool refresh = false}) async {
    if (state.isLoading) return;

    if (refresh) {
      state = state.copyWith(isLoading: true, page: 1, hasMore: true);
    } else {
      state = state.copyWith(isLoading: true);
    }

    try {
      // Simulated API call
      await Future.delayed(const Duration(milliseconds: 500));

      final newSessions = _generateMockSessions(state.page);

      state = state.copyWith(
        sessions: refresh ? newSessions : [...state.sessions, ...newSessions],
        isLoading: false,
        hasMore: newSessions.length >= 10,
        page: state.page + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load more sessions
  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoading) return;
    await loadSessions();
  }

  /// Set filter
  void setFilter({
    SessionType? type,
    String? category,
    bool? isFree,
  }) {
    _filterType = type;
    _filterCategory = category;
    _filterFree = isFree;
    loadSessions(refresh: true);
  }

  /// Clear filters
  void clearFilters() {
    _filterType = null;
    _filterCategory = null;
    _filterFree = null;
    loadSessions(refresh: true);
  }

  List<GroupSession> _generateMockSessions(int page) {
    final now = DateTime.now();
    return List.generate(10, (i) {
      final index = (page - 1) * 10 + i;
      return GroupSession(
        id: 'session_$index',
        coachId: 'coach_${index % 5}',
        title: 'Group Coaching Session ${index + 1}',
        description: 'Learn effective strategies for personal growth and habit building in this interactive group session.',
        sessionType: SessionType.values[index % SessionType.values.length],
        category: ['Productivity', 'Mindfulness', 'Health', 'Career'][index % 4],
        tags: ['coaching', 'growth', 'habits'],
        scheduledAt: now.add(Duration(days: index, hours: 10 + (index % 8))),
        durationMinutes: [60, 90, 120][index % 3],
        maxParticipants: 20,
        currentParticipants: 5 + (index % 15),
        isFree: index % 5 == 0,
        price: index % 5 == 0 ? null : 29.99 + (index % 4) * 10,
        status: SessionStatus.scheduled,
        coverImageUrl: 'https://picsum.photos/seed/$index/400/200',
        learningObjectives: [
          'Understand core concepts',
          'Apply practical techniques',
          'Build lasting habits',
        ],
        averageRating: 4.0 + (index % 10) / 10,
        ratingCount: 10 + index * 2,
        coachName: 'Coach ${['Sarah', 'Michael', 'Emily', 'David', 'Lisa'][index % 5]}',
        coachAvatarUrl: 'https://i.pravatar.cc/150?u=coach_${index % 5}',
      );
    });
  }
}

/// Group session list provider
final groupSessionListProvider =
    StateNotifierProvider<GroupSessionListNotifier, GroupSessionListState>((ref) {
  return GroupSessionListNotifier();
});

/// Single session state
class GroupSessionState {
  final GroupSession? session;
  final List<GroupSessionParticipant> participants;
  final bool isLoading;
  final String? error;
  final bool isRegistered;
  final ParticipantStatus? myStatus;

  const GroupSessionState({
    this.session,
    this.participants = const [],
    this.isLoading = false,
    this.error,
    this.isRegistered = false,
    this.myStatus,
  });

  GroupSessionState copyWith({
    GroupSession? session,
    List<GroupSessionParticipant>? participants,
    bool? isLoading,
    String? error,
    bool? isRegistered,
    ParticipantStatus? myStatus,
  }) {
    return GroupSessionState(
      session: session ?? this.session,
      participants: participants ?? this.participants,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isRegistered: isRegistered ?? this.isRegistered,
      myStatus: myStatus ?? this.myStatus,
    );
  }
}

/// Single session notifier
class GroupSessionNotifier extends StateNotifier<GroupSessionState> {
  final String sessionId;

  GroupSessionNotifier(this.sessionId) : super(const GroupSessionState()) {
    loadSession();
  }

  /// Load session details
  Future<void> loadSession() async {
    state = state.copyWith(isLoading: true);

    try {
      await Future.delayed(const Duration(milliseconds: 300));

      final session = GroupSession(
        id: sessionId,
        coachId: 'coach_1',
        title: 'Building Better Habits',
        description: 'Join us for an interactive session on building sustainable habits. '
            'Learn the science behind habit formation, identify your keystone habits, '
            'and create an actionable plan for positive change.',
        sessionType: SessionType.workshop,
        category: 'Productivity',
        tags: ['habits', 'productivity', 'growth'],
        scheduledAt: DateTime.now().add(const Duration(days: 2, hours: 3)),
        durationMinutes: 90,
        maxParticipants: 20,
        currentParticipants: 12,
        isFree: false,
        price: 49.99,
        earlyBirdPrice: 39.99,
        earlyBirdDeadline: DateTime.now().add(const Duration(days: 1)),
        status: SessionStatus.scheduled,
        coverImageUrl: 'https://picsum.photos/seed/habits/800/400',
        prerequisites: 'No prior experience needed. Just bring an open mind!',
        learningObjectives: [
          'Understand the habit loop and how to leverage it',
          'Identify your personal keystone habits',
          'Create a 30-day habit building plan',
          'Learn techniques to overcome resistance',
        ],
        chatEnabled: true,
        pollsEnabled: true,
        qnaEnabled: true,
        averageRating: 4.8,
        ratingCount: 156,
        coachName: 'Sarah Mitchell',
        coachAvatarUrl: 'https://i.pravatar.cc/150?u=coach_1',
        coachBio: 'Certified life coach with 10+ years of experience helping people transform their lives through better habits.',
      );

      state = state.copyWith(
        session: session,
        isLoading: false,
        isRegistered: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Register for session
  Future<RegistrationResult> register() async {
    if (state.session == null) {
      return const RegistrationResult(success: false, error: 'Session not found');
    }

    try {
      await Future.delayed(const Duration(milliseconds: 500));

      final participant = GroupSessionParticipant(
        id: 'participant_new',
        sessionId: sessionId,
        userId: 'current_user',
        status: ParticipantStatus.registered,
        registeredAt: DateTime.now(),
      );

      state = state.copyWith(
        isRegistered: true,
        myStatus: ParticipantStatus.registered,
        session: state.session!.copyWith(
          currentParticipants: state.session!.currentParticipants + 1,
        ),
      );

      return RegistrationResult(
        success: true,
        participant: participant,
        requiresPayment: !state.session!.isFree,
        paymentAmount: state.session!.currentPrice,
      );
    } catch (e) {
      return RegistrationResult(success: false, error: e.toString());
    }
  }

  /// Cancel registration
  Future<bool> cancelRegistration() async {
    try {
      await Future.delayed(const Duration(milliseconds: 300));

      state = state.copyWith(
        isRegistered: false,
        myStatus: ParticipantStatus.cancelled,
        session: state.session?.copyWith(
          currentParticipants: (state.session!.currentParticipants - 1).clamp(0, 999),
        ),
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Submit rating
  Future<bool> submitRating(int rating, String? feedback) async {
    try {
      await Future.delayed(const Duration(milliseconds: 300));
      return true;
    } catch (e) {
      return false;
    }
  }
}

/// Single session provider
final groupSessionProvider =
    StateNotifierProvider.family<GroupSessionNotifier, GroupSessionState, String>(
  (ref, sessionId) => GroupSessionNotifier(sessionId),
);

/// Live session chat state
class LiveSessionChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;
  final bool isConnected;

  const LiveSessionChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
    this.isConnected = false,
  });

  LiveSessionChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
    bool? isConnected,
  }) {
    return LiveSessionChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isConnected: isConnected ?? this.isConnected,
    );
  }
}

/// Live session chat notifier
class LiveSessionChatNotifier extends StateNotifier<LiveSessionChatState> {
  final String sessionId;
  Timer? _pollingTimer;

  LiveSessionChatNotifier(this.sessionId) : super(const LiveSessionChatState()) {
    connect();
  }

  /// Connect to chat
  Future<void> connect() async {
    state = state.copyWith(isLoading: true);

    try {
      await Future.delayed(const Duration(milliseconds: 300));

      // Load initial messages
      final messages = _generateMockMessages();

      state = state.copyWith(
        messages: messages,
        isLoading: false,
        isConnected: true,
      );

      // Start polling for new messages
      _startPolling();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Send a message
  Future<ChatMessage?> sendMessage(String content, {ChatMessageType type = ChatMessageType.text}) async {
    try {
      final message = ChatMessage(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
        sessionId: sessionId,
        userId: 'current_user',
        messageType: type,
        content: content,
        createdAt: DateTime.now(),
        userName: 'You',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=current_user',
      );

      state = state.copyWith(
        messages: [...state.messages, message],
      );

      return message;
    } catch (e) {
      return null;
    }
  }

  /// Send a poll
  Future<ChatMessage?> createPoll(String question, List<String> options) async {
    try {
      final pollData = PollData(
        question: question,
        options: options.asMap().entries.map((e) => PollOption(
          id: 'opt_${e.key}',
          text: e.value,
        )).toList(),
      );

      final message = ChatMessage(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
        sessionId: sessionId,
        userId: 'current_user',
        messageType: ChatMessageType.poll,
        content: question,
        pollData: pollData,
        createdAt: DateTime.now(),
        userName: 'You',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=current_user',
      );

      state = state.copyWith(
        messages: [...state.messages, message],
      );

      return message;
    } catch (e) {
      return null;
    }
  }

  /// Vote on a poll
  Future<bool> votePoll(String messageId, String optionId) async {
    try {
      final messages = state.messages.map((m) {
        if (m.id == messageId && m.pollData != null) {
          final updatedOptions = m.pollData!.options.map((opt) {
            if (opt.id == optionId) {
              return opt.copyWith(
                voteCount: opt.voteCount + 1,
                hasVoted: true,
              );
            }
            return opt;
          }).toList();

          return m.copyWith(
            pollData: m.pollData!.copyWith(options: updatedOptions),
          );
        }
        return m;
      }).toList();

      state = state.copyWith(messages: messages);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Add reaction
  Future<bool> addReaction(String messageId, String emoji) async {
    try {
      final messages = state.messages.map((m) {
        if (m.id == messageId) {
          final existingIndex = m.reactions.indexWhere((r) => r.emoji == emoji);
          List<ChatReaction> updatedReactions;

          if (existingIndex >= 0) {
            updatedReactions = [...m.reactions];
            updatedReactions[existingIndex] = ChatReaction(
              emoji: emoji,
              count: m.reactions[existingIndex].count + 1,
              hasReacted: true,
            );
          } else {
            updatedReactions = [
              ...m.reactions,
              ChatReaction(emoji: emoji, count: 1, hasReacted: true),
            ];
          }

          return m.copyWith(reactions: updatedReactions);
        }
        return m;
      }).toList();

      state = state.copyWith(messages: messages);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Upvote a question
  Future<bool> upvoteQuestion(String messageId) async {
    try {
      final messages = state.messages.map((m) {
        if (m.id == messageId && m.messageType == ChatMessageType.question) {
          return m.copyWith(
            upvoteCount: m.upvoteCount + 1,
            hasUpvoted: true,
          );
        }
        return m;
      }).toList();

      state = state.copyWith(messages: messages);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Disconnect
  void disconnect() {
    _pollingTimer?.cancel();
    state = state.copyWith(isConnected: false);
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _checkForNewMessages();
    });
  }

  void _checkForNewMessages() {
    // In production, this would fetch new messages from WebSocket or API
  }

  List<ChatMessage> _generateMockMessages() {
    final now = DateTime.now();
    return [
      ChatMessage(
        id: 'msg_1',
        sessionId: sessionId,
        userId: 'coach_1',
        messageType: ChatMessageType.announcement,
        content: 'Welcome everyone! We\'ll be starting in 5 minutes.',
        createdAt: now.subtract(const Duration(minutes: 10)),
        isPinned: true,
        userName: 'Coach Sarah',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=coach_1',
      ),
      ChatMessage(
        id: 'msg_2',
        sessionId: sessionId,
        userId: 'user_2',
        messageType: ChatMessageType.text,
        content: 'Excited to be here!',
        createdAt: now.subtract(const Duration(minutes: 8)),
        reactions: [
          const ChatReaction(emoji: '🎉', count: 5),
          const ChatReaction(emoji: '👍', count: 3),
        ],
        userName: 'Michael R.',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=user_2',
      ),
      ChatMessage(
        id: 'msg_3',
        sessionId: sessionId,
        userId: 'user_3',
        messageType: ChatMessageType.question,
        content: 'Will we receive any materials after the session?',
        createdAt: now.subtract(const Duration(minutes: 5)),
        upvoteCount: 12,
        isAnswered: true,
        userName: 'Emily K.',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=user_3',
      ),
      ChatMessage(
        id: 'msg_4',
        sessionId: sessionId,
        userId: 'coach_1',
        messageType: ChatMessageType.answer,
        content: 'Yes! All participants will receive a PDF workbook and access to the recording.',
        replyToId: 'msg_3',
        createdAt: now.subtract(const Duration(minutes: 4)),
        userName: 'Coach Sarah',
        userAvatarUrl: 'https://i.pravatar.cc/150?u=coach_1',
      ),
    ];
  }
}

/// Live session chat provider
final liveSessionChatProvider =
    StateNotifierProvider.family<LiveSessionChatNotifier, LiveSessionChatState, String>(
  (ref, sessionId) => LiveSessionChatNotifier(sessionId),
);

/// My registered sessions provider
final myRegisteredSessionsProvider = FutureProvider<List<GroupSession>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 300));

  // Mock registered sessions
  return [
    GroupSession(
      id: 'my_session_1',
      coachId: 'coach_1',
      title: 'Morning Productivity Masterclass',
      description: 'Start your day right with proven productivity techniques.',
      sessionType: SessionType.masterclass,
      category: 'Productivity',
      scheduledAt: DateTime.now().add(const Duration(days: 1, hours: 8)),
      durationMinutes: 60,
      maxParticipants: 15,
      currentParticipants: 10,
      isFree: true,
      status: SessionStatus.scheduled,
      coachName: 'Coach Sarah',
    ),
    GroupSession(
      id: 'my_session_2',
      coachId: 'coach_2',
      title: 'Mindfulness and Stress Management',
      description: 'Learn practical mindfulness techniques for daily life.',
      sessionType: SessionType.workshop,
      category: 'Mindfulness',
      scheduledAt: DateTime.now().add(const Duration(days: 3, hours: 14)),
      durationMinutes: 90,
      maxParticipants: 20,
      currentParticipants: 18,
      isFree: false,
      price: 29.99,
      status: SessionStatus.scheduled,
      coachName: 'Coach David',
    ),
  ];
});

/// Session categories provider
final sessionCategoriesProvider = Provider<List<String>>((ref) {
  return [
    'All',
    'Productivity',
    'Mindfulness',
    'Health',
    'Career',
    'Relationships',
    'Finance',
  ];
});
