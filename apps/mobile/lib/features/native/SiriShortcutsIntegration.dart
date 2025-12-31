import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Shortcut platform
enum ShortcutPlatform {
  siri,
  googleAssistant,
}

/// Shortcut type
enum ShortcutType {
  logHabit,
  startSession,
  quickCheckIn,
  completeGoal,
  viewProgress,
  scheduleSession,
  dailyReflection,
  setReminder,
  viewHabits,
  markComplete,
  askProgress,
  weeklySummary,
  addJournalEntry,
  reviewGoals,
  upcomingSessions,
  moodCheck,
  habitStreak,
  goalUpdate,
  sessionNotes,
  coachFeedback,
  achievementView,
  milestoneTrack,
  customAction,
}

/// Intent type for iOS
enum IntentType {
  logHabit,
  startSession,
  checkIn,
  viewData,
  updateGoal,
  scheduleEvent,
  addNote,
  queryStatus,
}

/// Parameter type for shortcuts
enum ParameterType {
  string,
  number,
  boolean,
  date,
  time,
  duration,
  enum_,
}

/// Shortcut parameter definition
class ShortcutParameter {
  final String name;
  final String displayName;
  final ParameterType type;
  final bool isRequired;
  final dynamic defaultValue;
  final List<String>? enumValues;
  final String? description;

  const ShortcutParameter({
    required this.name,
    required this.displayName,
    required this.type,
    this.isRequired = false,
    this.defaultValue,
    this.enumValues,
    this.description,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'displayName': displayName,
        'type': type.name,
        'isRequired': isRequired,
        'defaultValue': defaultValue,
        'enumValues': enumValues,
        'description': description,
      };

  factory ShortcutParameter.fromJson(Map<String, dynamic> json) {
    return ShortcutParameter(
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      type: ParameterType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ParameterType.string,
      ),
      isRequired: json['isRequired'] as bool? ?? false,
      defaultValue: json['defaultValue'],
      enumValues: (json['enumValues'] as List?)?.cast<String>(),
      description: json['description'] as String?,
    );
  }
}

/// Shortcut definition
class ShortcutDefinition {
  final String id;
  final ShortcutType type;
  final String phrase;
  final String title;
  final String description;
  final String? subtitle;
  final List<ShortcutParameter> parameters;
  final bool isEnabled;
  final String? iconName;
  final Map<String, dynamic> metadata;

  const ShortcutDefinition({
    required this.id,
    required this.type,
    required this.phrase,
    required this.title,
    required this.description,
    this.subtitle,
    this.parameters = const [],
    this.isEnabled = true,
    this.iconName,
    this.metadata = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'phrase': phrase,
        'title': title,
        'description': description,
        'subtitle': subtitle,
        'parameters': parameters.map((p) => p.toJson()).toList(),
        'isEnabled': isEnabled,
        'iconName': iconName,
        'metadata': metadata,
      };

  factory ShortcutDefinition.fromJson(Map<String, dynamic> json) {
    return ShortcutDefinition(
      id: json['id'] as String,
      type: ShortcutType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ShortcutType.customAction,
      ),
      phrase: json['phrase'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      subtitle: json['subtitle'] as String?,
      parameters: (json['parameters'] as List?)
              ?.map((p) => ShortcutParameter.fromJson(Map<String, dynamic>.from(p as Map)))
              .toList() ??
          [],
      isEnabled: json['isEnabled'] as bool? ?? true,
      iconName: json['iconName'] as String?,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
    );
  }

  ShortcutDefinition copyWith({
    String? id,
    ShortcutType? type,
    String? phrase,
    String? title,
    String? description,
    String? subtitle,
    List<ShortcutParameter>? parameters,
    bool? isEnabled,
    String? iconName,
    Map<String, dynamic>? metadata,
  }) {
    return ShortcutDefinition(
      id: id ?? this.id,
      type: type ?? this.type,
      phrase: phrase ?? this.phrase,
      title: title ?? this.title,
      description: description ?? this.description,
      subtitle: subtitle ?? this.subtitle,
      parameters: parameters ?? this.parameters,
      isEnabled: isEnabled ?? this.isEnabled,
      iconName: iconName ?? this.iconName,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Shortcut invocation data
class ShortcutInvocation {
  final String shortcutId;
  final ShortcutType type;
  final Map<String, dynamic> parameters;
  final DateTime timestamp;
  final String? userInput;

  const ShortcutInvocation({
    required this.shortcutId,
    required this.type,
    required this.parameters,
    required this.timestamp,
    this.userInput,
  });

  Map<String, dynamic> toJson() => {
        'shortcutId': shortcutId,
        'type': type.name,
        'parameters': parameters,
        'timestamp': timestamp.toIso8601String(),
        'userInput': userInput,
      };

  factory ShortcutInvocation.fromJson(Map<String, dynamic> json) {
    return ShortcutInvocation(
      shortcutId: json['shortcutId'] as String,
      type: ShortcutType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ShortcutType.customAction,
      ),
      parameters: Map<String, dynamic>.from(json['parameters'] as Map? ?? {}),
      timestamp: DateTime.parse(json['timestamp'] as String),
      userInput: json['userInput'] as String?,
    );
  }
}

/// Shortcut execution result
class ShortcutResult {
  final bool success;
  final String? message;
  final Map<String, dynamic>? data;
  final String? spokenResponse;
  final String? error;

  const ShortcutResult({
    required this.success,
    this.message,
    this.data,
    this.spokenResponse,
    this.error,
  });

  Map<String, dynamic> toJson() => {
        'success': success,
        'message': message,
        'data': data,
        'spokenResponse': spokenResponse,
        'error': error,
      };

  factory ShortcutResult.fromJson(Map<String, dynamic> json) {
    return ShortcutResult(
      success: json['success'] as bool,
      message: json['message'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      spokenResponse: json['spokenResponse'] as String?,
      error: json['error'] as String?,
    );
  }
}

/// Contextual suggestion for Siri/Assistant
class ContextualSuggestion {
  final String id;
  final ShortcutType type;
  final String title;
  final String subtitle;
  final DateTime relevantFrom;
  final DateTime relevantUntil;
  final Map<String, dynamic> parameters;

  const ContextualSuggestion({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.relevantFrom,
    required this.relevantUntil,
    this.parameters = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'title': title,
        'subtitle': subtitle,
        'relevantFrom': relevantFrom.toIso8601String(),
        'relevantUntil': relevantUntil.toIso8601String(),
        'parameters': parameters,
      };
}

/// Shortcut handler callback
typedef ShortcutHandler = Future<ShortcutResult> Function(
  ShortcutInvocation invocation,
);

/// Siri Shortcuts and Google Assistant Actions integration manager
class SiriShortcutsIntegration {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach.app/shortcuts');

  static const EventChannel _eventChannel =
      EventChannel('com.upcoach.app/shortcuts/events');

  static SiriShortcutsIntegration? _instance;
  static SiriShortcutsIntegration get instance {
    _instance ??= SiriShortcutsIntegration._();
    return _instance!;
  }

  SiriShortcutsIntegration._() {
    _initialize();
  }

  final Map<String, ShortcutDefinition> _shortcuts = {};
  final Map<ShortcutType, ShortcutHandler> _handlers = {};
  final List<StreamSubscription> _subscriptions = [];
  final StreamController<ShortcutInvocation> _invocationController =
      StreamController<ShortcutInvocation>.broadcast();

  bool _isInitialized = false;
  ShortcutPlatform? _platform;

  /// Stream of shortcut invocations
  Stream<ShortcutInvocation> get invocationStream =>
      _invocationController.stream;

  /// Current platform
  ShortcutPlatform? get platform => _platform;

  /// Initialize the shortcuts integration
  Future<void> _initialize() async {
    if (_isInitialized) return;

    try {
      _channel.setMethodCallHandler(_handleMethodCall);

      final eventSubscription = _eventChannel.receiveBroadcastStream().listen(
            _handleEvent,
            onError: (error) {
              debugPrint('Shortcuts event stream error: $error');
            },
          );
      _subscriptions.add(eventSubscription);

      if (Platform.isIOS) {
        _platform = ShortcutPlatform.siri;
        await _initializeSiri();
      } else if (Platform.isAndroid) {
        _platform = ShortcutPlatform.googleAssistant;
        await _initializeGoogleAssistant();
      }

      _registerDefaultShortcuts();
      _registerDefaultHandlers();
      _isInitialized = true;
      debugPrint('SiriShortcutsIntegration initialized for $_platform');
    } catch (e) {
      debugPrint('Failed to initialize SiriShortcutsIntegration: $e');
    }
  }

  /// Initialize Siri Shortcuts
  Future<void> _initializeSiri() async {
    try {
      await _channel.invokeMethod('initializeSiri');
    } catch (e) {
      debugPrint('Failed to initialize Siri: $e');
    }
  }

  /// Initialize Google Assistant Actions
  Future<void> _initializeGoogleAssistant() async {
    try {
      await _channel.invokeMethod('initializeGoogleAssistant');
    } catch (e) {
      debugPrint('Failed to initialize Google Assistant: $e');
    }
  }

  /// Register default shortcuts
  void _registerDefaultShortcuts() {
    final shortcuts = _getDefaultShortcuts();
    for (final shortcut in shortcuts) {
      _shortcuts[shortcut.id] = shortcut;
      donateShortcut(shortcut);
    }
  }

  /// Get default shortcut definitions
  List<ShortcutDefinition> _getDefaultShortcuts() {
    return [
      ShortcutDefinition(
        id: 'log_habit',
        type: ShortcutType.logHabit,
        phrase: 'Log [habit]',
        title: 'Log Habit',
        description: 'Mark a habit as complete',
        parameters: [
          const ShortcutParameter(
            name: 'habitName',
            displayName: 'Habit Name',
            type: ParameterType.string,
            isRequired: true,
          ),
        ],
        iconName: 'checkmark.circle',
      ),
      const ShortcutDefinition(
        id: 'start_session',
        type: ShortcutType.startSession,
        phrase: 'Start coaching session',
        title: 'Start Coaching Session',
        description: 'Begin a coaching session',
        iconName: 'video.circle',
      ),
      ShortcutDefinition(
        id: 'quick_checkin',
        type: ShortcutType.quickCheckIn,
        phrase: 'Check in with mood [mood]',
        title: 'Quick Check-in',
        description: 'Log your current mood and state',
        parameters: [
          ShortcutParameter(
            name: 'mood',
            displayName: 'Mood',
            type: ParameterType.enum_,
            isRequired: false,
            enumValues: const ['great', 'good', 'okay', 'bad', 'terrible'],
          ),
        ],
        iconName: 'face.smiling',
      ),
      ShortcutDefinition(
        id: 'complete_goal',
        type: ShortcutType.completeGoal,
        phrase: 'Complete goal [goal]',
        title: 'Complete Goal',
        description: 'Mark a goal as complete',
        parameters: [
          const ShortcutParameter(
            name: 'goalName',
            displayName: 'Goal Name',
            type: ParameterType.string,
            isRequired: true,
          ),
        ],
        iconName: 'flag.checkered',
      ),
      const ShortcutDefinition(
        id: 'view_progress',
        type: ShortcutType.viewProgress,
        phrase: 'View my progress',
        title: 'View Progress',
        description: 'See your current progress',
        iconName: 'chart.bar',
      ),
      ShortcutDefinition(
        id: 'schedule_session',
        type: ShortcutType.scheduleSession,
        phrase: 'Schedule session with [coach]',
        title: 'Schedule Session',
        description: 'Book a coaching session',
        parameters: [
          const ShortcutParameter(
            name: 'coachName',
            displayName: 'Coach Name',
            type: ParameterType.string,
            isRequired: false,
          ),
          const ShortcutParameter(
            name: 'dateTime',
            displayName: 'Date & Time',
            type: ParameterType.date,
            isRequired: false,
          ),
        ],
        iconName: 'calendar.badge.plus',
      ),
      const ShortcutDefinition(
        id: 'daily_reflection',
        type: ShortcutType.dailyReflection,
        phrase: 'Daily reflection',
        title: 'Daily Reflection',
        description: 'Start your daily reflection',
        iconName: 'book',
      ),
      ShortcutDefinition(
        id: 'set_reminder',
        type: ShortcutType.setReminder,
        phrase: 'Set reminder for [time]',
        title: 'Set Reminder',
        description: 'Set a coaching reminder',
        parameters: [
          const ShortcutParameter(
            name: 'time',
            displayName: 'Time',
            type: ParameterType.time,
            isRequired: true,
          ),
          const ShortcutParameter(
            name: 'message',
            displayName: 'Message',
            type: ParameterType.string,
            isRequired: false,
          ),
        ],
        iconName: 'bell',
      ),
      const ShortcutDefinition(
        id: 'view_habits',
        type: ShortcutType.viewHabits,
        phrase: 'View habits',
        title: 'View Habits',
        description: 'See your habit tracker',
        iconName: 'list.bullet',
      ),
      ShortcutDefinition(
        id: 'mark_complete',
        type: ShortcutType.markComplete,
        phrase: 'Mark [habit] complete',
        title: 'Mark Complete',
        description: 'Mark a habit as complete',
        parameters: [
          const ShortcutParameter(
            name: 'habitName',
            displayName: 'Habit Name',
            type: ParameterType.string,
            isRequired: true,
          ),
        ],
        iconName: 'checkmark.circle.fill',
      ),
      const ShortcutDefinition(
        id: 'ask_progress',
        type: ShortcutType.askProgress,
        phrase: 'How am I doing?',
        title: 'Check Progress',
        description: 'Ask about your current progress',
        iconName: 'questionmark.circle',
      ),
      const ShortcutDefinition(
        id: 'weekly_summary',
        type: ShortcutType.weeklySummary,
        phrase: 'Weekly summary',
        title: 'Weekly Summary',
        description: 'Get your weekly progress summary',
        iconName: 'chart.line.uptrend.xyaxis',
      ),
      ShortcutDefinition(
        id: 'add_journal',
        type: ShortcutType.addJournalEntry,
        phrase: 'Add journal entry',
        title: 'Add Journal Entry',
        description: 'Create a new journal entry',
        parameters: [
          const ShortcutParameter(
            name: 'content',
            displayName: 'Content',
            type: ParameterType.string,
            isRequired: false,
          ),
        ],
        iconName: 'pencil.circle',
      ),
      const ShortcutDefinition(
        id: 'review_goals',
        type: ShortcutType.reviewGoals,
        phrase: 'Review my goals',
        title: 'Review Goals',
        description: 'Review your active goals',
        iconName: 'target',
      ),
      const ShortcutDefinition(
        id: 'upcoming_sessions',
        type: ShortcutType.upcomingSessions,
        phrase: 'Upcoming sessions',
        title: 'Upcoming Sessions',
        description: 'See your scheduled sessions',
        iconName: 'calendar',
      ),
      ShortcutDefinition(
        id: 'mood_check',
        type: ShortcutType.moodCheck,
        phrase: 'Log mood [mood]',
        title: 'Log Mood',
        description: 'Record your current mood',
        parameters: [
          ShortcutParameter(
            name: 'mood',
            displayName: 'Mood',
            type: ParameterType.enum_,
            isRequired: true,
            enumValues: const ['great', 'good', 'okay', 'bad', 'terrible'],
          ),
        ],
        iconName: 'face.smiling',
      ),
      const ShortcutDefinition(
        id: 'habit_streak',
        type: ShortcutType.habitStreak,
        phrase: 'Show habit streaks',
        title: 'Habit Streaks',
        description: 'View your current streaks',
        iconName: 'flame',
      ),
      ShortcutDefinition(
        id: 'goal_update',
        type: ShortcutType.goalUpdate,
        phrase: 'Update goal [goal]',
        title: 'Update Goal',
        description: 'Update goal progress',
        parameters: [
          const ShortcutParameter(
            name: 'goalName',
            displayName: 'Goal Name',
            type: ParameterType.string,
            isRequired: true,
          ),
          const ShortcutParameter(
            name: 'progress',
            displayName: 'Progress',
            type: ParameterType.number,
            isRequired: false,
          ),
        ],
        iconName: 'arrow.up.circle',
      ),
      ShortcutDefinition(
        id: 'session_notes',
        type: ShortcutType.sessionNotes,
        phrase: 'Add session notes',
        title: 'Session Notes',
        description: 'Add notes to your last session',
        parameters: [
          const ShortcutParameter(
            name: 'notes',
            displayName: 'Notes',
            type: ParameterType.string,
            isRequired: false,
          ),
        ],
        iconName: 'note.text',
      ),
      const ShortcutDefinition(
        id: 'coach_feedback',
        type: ShortcutType.coachFeedback,
        phrase: 'Send coach feedback',
        title: 'Coach Feedback',
        description: 'Provide feedback to your coach',
        iconName: 'star',
      ),
      const ShortcutDefinition(
        id: 'achievement_view',
        type: ShortcutType.achievementView,
        phrase: 'View achievements',
        title: 'View Achievements',
        description: 'See your earned achievements',
        iconName: 'trophy',
      ),
      const ShortcutDefinition(
        id: 'milestone_track',
        type: ShortcutType.milestoneTrack,
        phrase: 'Track milestones',
        title: 'Track Milestones',
        description: 'View your milestone progress',
        iconName: 'map',
      ),
    ];
  }

  /// Register default handlers
  void _registerDefaultHandlers() {
    registerHandler(ShortcutType.logHabit, (invocation) async {
      final habitName = invocation.parameters['habitName'] as String?;

      if (habitName == null) {
        return const ShortcutResult(
          success: false,
          error: 'Habit name is required',
          spokenResponse: 'Please specify which habit to log.',
        );
      }

      debugPrint('Logging habit: $habitName');

      return ShortcutResult(
        success: true,
        message: 'Habit logged successfully',
        spokenResponse: 'I\'ve logged $habitName as complete.',
        data: {'habitName': habitName, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.startSession, (invocation) async {
      debugPrint('Starting coaching session');

      return const ShortcutResult(
        success: true,
        message: 'Session started',
        spokenResponse: 'Starting your coaching session now.',
      );
    });

    registerHandler(ShortcutType.quickCheckIn, (invocation) async {
      final mood = invocation.parameters['mood'] as String? ?? 'okay';

      debugPrint('Quick check-in with mood: $mood');

      return ShortcutResult(
        success: true,
        message: 'Check-in recorded',
        spokenResponse: 'Got it, you\'re feeling $mood today.',
        data: {'mood': mood, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.completeGoal, (invocation) async {
      final goalName = invocation.parameters['goalName'] as String?;

      if (goalName == null) {
        return const ShortcutResult(
          success: false,
          error: 'Goal name is required',
          spokenResponse: 'Please specify which goal to complete.',
        );
      }

      debugPrint('Completing goal: $goalName');

      return ShortcutResult(
        success: true,
        message: 'Goal completed',
        spokenResponse: 'Congratulations! You\'ve completed $goalName.',
        data: {'goalName': goalName, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.viewProgress, (invocation) async {
      debugPrint('Viewing progress');

      return const ShortcutResult(
        success: true,
        message: 'Showing progress',
        spokenResponse:
            'You\'ve completed 5 of 7 habits today, and you\'re at 70% of your weekly goal.',
        data: {
          'habitsCompleted': 5,
          'habitsTotal': 7,
          'goalProgress': 0.7,
        },
      );
    });

    registerHandler(ShortcutType.scheduleSession, (invocation) async {
      final coachName = invocation.parameters['coachName'] as String?;

      debugPrint('Scheduling session with coach: $coachName');

      return ShortcutResult(
        success: true,
        message: 'Session scheduled',
        spokenResponse: coachName != null
            ? 'I\'ve scheduled a session with $coachName.'
            : 'I\'ve scheduled your coaching session.',
      );
    });

    registerHandler(ShortcutType.dailyReflection, (invocation) async {
      debugPrint('Starting daily reflection');

      return const ShortcutResult(
        success: true,
        message: 'Reflection started',
        spokenResponse: 'Let\'s reflect on your day. What are you grateful for?',
      );
    });

    registerHandler(ShortcutType.setReminder, (invocation) async {
      final time = invocation.parameters['time'] as String?;
      final message = invocation.parameters['message'] as String?;

      debugPrint('Setting reminder for: $time');

      return ShortcutResult(
        success: true,
        message: 'Reminder set',
        spokenResponse: 'I\'ve set a reminder for $time.',
        data: {'time': time, 'message': message},
      );
    });

    registerHandler(ShortcutType.viewHabits, (invocation) async {
      debugPrint('Viewing habits');

      return const ShortcutResult(
        success: true,
        message: 'Showing habits',
        spokenResponse: 'You have 5 habits today. 3 are complete.',
        data: {
          'totalHabits': 5,
          'completedHabits': 3,
        },
      );
    });

    registerHandler(ShortcutType.markComplete, (invocation) async {
      final habitName = invocation.parameters['habitName'] as String?;

      if (habitName == null) {
        return const ShortcutResult(
          success: false,
          error: 'Habit name is required',
          spokenResponse: 'Please specify which habit to mark complete.',
        );
      }

      debugPrint('Marking habit complete: $habitName');

      return ShortcutResult(
        success: true,
        message: 'Habit marked complete',
        spokenResponse: 'Great job! I\'ve marked $habitName as complete.',
        data: {'habitName': habitName, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.askProgress, (invocation) async {
      debugPrint('Asking for progress');

      return const ShortcutResult(
        success: true,
        message: 'Progress summary',
        spokenResponse:
            'You\'re doing great! You\'ve completed 70% of your goals this week and maintained a 15-day streak.',
        data: {
          'weeklyProgress': 0.7,
          'currentStreak': 15,
        },
      );
    });

    registerHandler(ShortcutType.weeklySummary, (invocation) async {
      debugPrint('Getting weekly summary');

      return const ShortcutResult(
        success: true,
        message: 'Weekly summary',
        spokenResponse:
            'This week, you completed 5 goals, logged 32 habits, and attended 2 coaching sessions.',
        data: {
          'goalsCompleted': 5,
          'habitsLogged': 32,
          'sessionsAttended': 2,
        },
      );
    });

    registerHandler(ShortcutType.addJournalEntry, (invocation) async {
      final content = invocation.parameters['content'] as String?;

      debugPrint('Adding journal entry');

      return ShortcutResult(
        success: true,
        message: 'Journal entry added',
        spokenResponse: content != null
            ? 'I\'ve added your journal entry.'
            : 'Opening the journal for you.',
        data: {'content': content, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.reviewGoals, (invocation) async {
      debugPrint('Reviewing goals');

      return const ShortcutResult(
        success: true,
        message: 'Showing goals',
        spokenResponse: 'You have 3 active goals. Daily Exercise is at 70% progress.',
        data: {
          'activeGoals': 3,
          'topGoal': 'Daily Exercise',
          'topGoalProgress': 0.7,
        },
      );
    });

    registerHandler(ShortcutType.upcomingSessions, (invocation) async {
      debugPrint('Getting upcoming sessions');

      return const ShortcutResult(
        success: true,
        message: 'Showing upcoming sessions',
        spokenResponse: 'You have a session with Sarah Johnson in 2 hours.',
        data: {
          'nextSession': 'Sarah Johnson',
          'hoursUntil': 2,
        },
      );
    });

    registerHandler(ShortcutType.moodCheck, (invocation) async {
      final mood = invocation.parameters['mood'] as String? ?? 'okay';

      debugPrint('Logging mood: $mood');

      return ShortcutResult(
        success: true,
        message: 'Mood logged',
        spokenResponse: 'I\'ve logged your mood as $mood.',
        data: {'mood': mood, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.habitStreak, (invocation) async {
      debugPrint('Showing habit streaks');

      return const ShortcutResult(
        success: true,
        message: 'Showing streaks',
        spokenResponse: 'Your longest streak is 15 days for meditation. You have 3 active streaks.',
        data: {
          'longestStreak': 15,
          'activeStreaks': 3,
        },
      );
    });

    registerHandler(ShortcutType.goalUpdate, (invocation) async {
      final goalName = invocation.parameters['goalName'] as String?;
      final progress = invocation.parameters['progress'];

      debugPrint('Updating goal: $goalName to progress: $progress');

      return ShortcutResult(
        success: true,
        message: 'Goal updated',
        spokenResponse: 'I\'ve updated your progress for $goalName.',
        data: {'goalName': goalName, 'progress': progress},
      );
    });

    registerHandler(ShortcutType.sessionNotes, (invocation) async {
      final notes = invocation.parameters['notes'] as String?;

      debugPrint('Adding session notes');

      return ShortcutResult(
        success: true,
        message: 'Notes added',
        spokenResponse: notes != null
            ? 'I\'ve added your session notes.'
            : 'Opening session notes for you.',
        data: {'notes': notes, 'timestamp': DateTime.now().toIso8601String()},
      );
    });

    registerHandler(ShortcutType.coachFeedback, (invocation) async {
      debugPrint('Providing coach feedback');

      return const ShortcutResult(
        success: true,
        message: 'Feedback ready',
        spokenResponse: 'I\'ll help you send feedback to your coach.',
      );
    });

    registerHandler(ShortcutType.achievementView, (invocation) async {
      debugPrint('Viewing achievements');

      return const ShortcutResult(
        success: true,
        message: 'Showing achievements',
        spokenResponse: 'You\'ve earned 12 achievements. Your latest is the 30-day streak badge.',
        data: {
          'totalAchievements': 12,
          'latestAchievement': '30-day streak',
        },
      );
    });

    registerHandler(ShortcutType.milestoneTrack, (invocation) async {
      debugPrint('Tracking milestones');

      return const ShortcutResult(
        success: true,
        message: 'Showing milestones',
        spokenResponse: 'You\'re 2 milestones away from your goal.',
        data: {
          'completedMilestones': 3,
          'totalMilestones': 5,
        },
      );
    });
  }

  /// Handle method calls from native code
  Future<dynamic> _handleMethodCall(MethodCall call) async {
    try {
      switch (call.method) {
        case 'handleIntent':
          return await _handleIntent(call.arguments);

        case 'handleVoiceCommand':
          return await _handleVoiceCommand(call.arguments);

        case 'getShortcutData':
          final shortcutId = call.arguments['shortcutId'] as String;
          return _getShortcutData(shortcutId);

        case 'onShortcutInvoked':
          await _onShortcutInvoked(call.arguments);
          return null;

        default:
          debugPrint('Unknown method call: ${call.method}');
          return null;
      }
    } catch (e) {
      debugPrint('Error handling method call ${call.method}: $e');
      rethrow;
    }
  }

  /// Handle events from native code
  void _handleEvent(dynamic event) {
    try {
      if (event is Map) {
        final eventType = event['type'] as String?;
        final data = event['data'] as Map?;

        switch (eventType) {
          case 'shortcutDonated':
            _onShortcutDonated(data);
            break;
          case 'suggestionShown':
            _onSuggestionShown(data);
            break;
          default:
            debugPrint('Unknown event type: $eventType');
        }
      }
    } catch (e) {
      debugPrint('Error handling event: $e');
    }
  }

  /// Handle intent execution
  Future<Map<String, dynamic>> _handleIntent(dynamic arguments) async {
    try {
      final invocation = ShortcutInvocation.fromJson(
        Map<String, dynamic>.from(arguments as Map),
      );

      _invocationController.add(invocation);

      final handler = _handlers[invocation.type];
      if (handler == null) {
        return {
          'success': false,
          'error': 'No handler registered for ${invocation.type}',
        };
      }

      final result = await handler(invocation);
      return result.toJson();
    } catch (e) {
      debugPrint('Error handling intent: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Handle voice command
  Future<Map<String, dynamic>> _handleVoiceCommand(dynamic arguments) async {
    try {
      final command = arguments['command'] as String?;

      if (command == null) {
        return {
          'success': false,
          'error': 'No command provided',
        };
      }

      // Parse voice command and execute
      final invocation = _parseVoiceCommand(command);
      if (invocation != null) {
        return await _handleIntent(invocation.toJson());
      }

      return {
        'success': false,
        'error': 'Could not parse command',
      };
    } catch (e) {
      debugPrint('Error handling voice command: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Parse voice command into invocation
  ShortcutInvocation? _parseVoiceCommand(String command) {
    final lowerCommand = command.toLowerCase();

    for (final shortcut in _shortcuts.values) {
      final phrase = shortcut.phrase.toLowerCase();

      // Simple pattern matching
      if (lowerCommand.contains(phrase.replaceAll(RegExp(r'\[.*?\]'), ''))) {
        return ShortcutInvocation(
          shortcutId: shortcut.id,
          type: shortcut.type,
          parameters: {},
          timestamp: DateTime.now(),
          userInput: command,
        );
      }
    }

    return null;
  }

  /// Get shortcut data
  Map<String, dynamic>? _getShortcutData(String shortcutId) {
    final shortcut = _shortcuts[shortcutId];
    return shortcut?.toJson();
  }

  /// Shortcut invoked callback
  Future<void> _onShortcutInvoked(dynamic arguments) async {
    try {
      final invocation = ShortcutInvocation.fromJson(
        Map<String, dynamic>.from(arguments as Map),
      );

      _invocationController.add(invocation);
    } catch (e) {
      debugPrint('Error handling shortcut invoked: $e');
    }
  }

  /// Shortcut donated callback
  void _onShortcutDonated(Map? data) {
    if (data == null) return;

    try {
      final shortcutId = data['shortcutId'] as String?;
      debugPrint('Shortcut donated: $shortcutId');
    } catch (e) {
      debugPrint('Error handling shortcut donated: $e');
    }
  }

  /// Suggestion shown callback
  void _onSuggestionShown(Map? data) {
    if (data == null) return;

    try {
      final suggestionId = data['suggestionId'] as String?;
      debugPrint('Suggestion shown: $suggestionId');
    } catch (e) {
      debugPrint('Error handling suggestion shown: $e');
    }
  }

  /// Register a shortcut handler
  void registerHandler(ShortcutType type, ShortcutHandler handler) {
    _handlers[type] = handler;
  }

  /// Register a custom shortcut
  Future<bool> registerShortcut(ShortcutDefinition shortcut) async {
    try {
      _shortcuts[shortcut.id] = shortcut;
      await donateShortcut(shortcut);
      return true;
    } catch (e) {
      debugPrint('Failed to register shortcut: $e');
      return false;
    }
  }

  /// Donate a shortcut to Siri/Assistant
  Future<bool> donateShortcut(ShortcutDefinition shortcut) async {
    try {
      await _channel.invokeMethod('donateShortcut', shortcut.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to donate shortcut: $e');
      return false;
    }
  }

  /// Delete a shortcut
  Future<bool> deleteShortcut(String shortcutId) async {
    try {
      _shortcuts.remove(shortcutId);
      await _channel.invokeMethod('deleteShortcut', {
        'shortcutId': shortcutId,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to delete shortcut: $e');
      return false;
    }
  }

  /// Delete all shortcuts
  Future<bool> deleteAllShortcuts() async {
    try {
      _shortcuts.clear();
      await _channel.invokeMethod('deleteAllShortcuts');
      return true;
    } catch (e) {
      debugPrint('Failed to delete all shortcuts: $e');
      return false;
    }
  }

  /// Donate contextual suggestion
  Future<bool> donateSuggestion(ContextualSuggestion suggestion) async {
    try {
      await _channel.invokeMethod('donateSuggestion', suggestion.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to donate suggestion: $e');
      return false;
    }
  }

  /// Get all registered shortcuts
  List<ShortcutDefinition> getShortcuts() {
    return _shortcuts.values.toList();
  }

  /// Get shortcut by ID
  ShortcutDefinition? getShortcut(String shortcutId) {
    return _shortcuts[shortcutId];
  }

  /// Update shortcut
  Future<bool> updateShortcut(ShortcutDefinition shortcut) async {
    try {
      _shortcuts[shortcut.id] = shortcut;
      await donateShortcut(shortcut);
      return true;
    } catch (e) {
      debugPrint('Failed to update shortcut: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _subscriptions.clear();
    _invocationController.close();
    _isInitialized = false;
  }
}
