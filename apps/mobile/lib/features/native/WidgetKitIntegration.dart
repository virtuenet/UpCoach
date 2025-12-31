import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Widget size categories for iOS and Android
enum WidgetSize {
  /// iOS: Small (2x2 grid), Android: 2x2
  small,

  /// iOS: Medium (4x2 grid), Android: 4x2
  medium,

  /// iOS: Large (4x4 grid), Android: 4x4
  large,

  /// iOS: Extra large (8x4 grid)
  extraLarge,

  /// iOS Lock Screen: Circular
  lockCircular,

  /// iOS Lock Screen: Rectangular
  lockRectangular,

  /// iOS Lock Screen: Inline
  lockInline,
}

/// Widget types available in the app
enum WidgetType {
  goalProgress,
  dailyHabitTracker,
  quickCheckIn,
  upcomingSessions,
  motivationalQuote,
  streakCounter,
  weeklySummary,
  reflectionPrompt,
  moodTracker,
  quickActions,
  coachingInsights,
  achievementShowcase,
}

/// Widget family for iOS WidgetKit
enum WidgetFamily {
  systemSmall,
  systemMedium,
  systemLarge,
  systemExtraLarge,
  accessoryCircular,
  accessoryRectangular,
  accessoryInline,
}

/// Widget update frequency
enum UpdateFrequency {
  never,
  hourly,
  everyFourHours,
  twiceDaily,
  daily,
  onDemand,
}

/// Widget configuration data
class WidgetConfiguration {
  final String id;
  final WidgetType type;
  final WidgetSize size;
  final Map<String, dynamic> settings;
  final UpdateFrequency updateFrequency;
  final DateTime? lastUpdated;
  final bool isDarkMode;
  final String? accentColor;

  const WidgetConfiguration({
    required this.id,
    required this.type,
    required this.size,
    this.settings = const {},
    this.updateFrequency = UpdateFrequency.hourly,
    this.lastUpdated,
    this.isDarkMode = false,
    this.accentColor,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'size': size.name,
        'settings': settings,
        'updateFrequency': updateFrequency.name,
        'lastUpdated': lastUpdated?.toIso8601String(),
        'isDarkMode': isDarkMode,
        'accentColor': accentColor,
      };

  factory WidgetConfiguration.fromJson(Map<String, dynamic> json) {
    return WidgetConfiguration(
      id: json['id'] as String,
      type: WidgetType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => WidgetType.goalProgress,
      ),
      size: WidgetSize.values.firstWhere(
        (e) => e.name == json['size'],
        orElse: () => WidgetSize.medium,
      ),
      settings: Map<String, dynamic>.from(json['settings'] as Map? ?? {}),
      updateFrequency: UpdateFrequency.values.firstWhere(
        (e) => e.name == json['updateFrequency'],
        orElse: () => UpdateFrequency.hourly,
      ),
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : null,
      isDarkMode: json['isDarkMode'] as bool? ?? false,
      accentColor: json['accentColor'] as String?,
    );
  }

  WidgetConfiguration copyWith({
    String? id,
    WidgetType? type,
    WidgetSize? size,
    Map<String, dynamic>? settings,
    UpdateFrequency? updateFrequency,
    DateTime? lastUpdated,
    bool? isDarkMode,
    String? accentColor,
  }) {
    return WidgetConfiguration(
      id: id ?? this.id,
      type: type ?? this.type,
      size: size ?? this.size,
      settings: settings ?? this.settings,
      updateFrequency: updateFrequency ?? this.updateFrequency,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      isDarkMode: isDarkMode ?? this.isDarkMode,
      accentColor: accentColor ?? this.accentColor,
    );
  }
}

/// Widget data for rendering
class WidgetData {
  final String widgetId;
  final WidgetType type;
  final Map<String, dynamic> content;
  final DateTime timestamp;
  final String? deepLink;

  const WidgetData({
    required this.widgetId,
    required this.type,
    required this.content,
    required this.timestamp,
    this.deepLink,
  });

  Map<String, dynamic> toJson() => {
        'widgetId': widgetId,
        'type': type.name,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        'deepLink': deepLink,
      };

  factory WidgetData.fromJson(Map<String, dynamic> json) {
    return WidgetData(
      widgetId: json['widgetId'] as String,
      type: WidgetType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => WidgetType.goalProgress,
      ),
      content: Map<String, dynamic>.from(json['content'] as Map? ?? {}),
      timestamp: DateTime.parse(json['timestamp'] as String),
      deepLink: json['deepLink'] as String?,
    );
  }
}

/// Live Activity data for iOS
class LiveActivityData {
  final String activityId;
  final String title;
  final String subtitle;
  final Map<String, dynamic> dynamicContent;
  final DateTime startTime;
  final DateTime? endTime;
  final String? deepLink;

  const LiveActivityData({
    required this.activityId,
    required this.title,
    required this.subtitle,
    required this.dynamicContent,
    required this.startTime,
    this.endTime,
    this.deepLink,
  });

  Map<String, dynamic> toJson() => {
        'activityId': activityId,
        'title': title,
        'subtitle': subtitle,
        'dynamicContent': dynamicContent,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'deepLink': deepLink,
      };
}

/// Dynamic Island content for iPhone 14 Pro+
class DynamicIslandContent {
  final String id;
  final String compactLeading;
  final String compactTrailing;
  final String minimalView;
  final Map<String, dynamic> expandedContent;

  const DynamicIslandContent({
    required this.id,
    required this.compactLeading,
    required this.compactTrailing,
    required this.minimalView,
    required this.expandedContent,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'compactLeading': compactLeading,
        'compactTrailing': compactTrailing,
        'minimalView': minimalView,
        'expandedContent': expandedContent,
      };
}

/// Widget timeline entry for iOS WidgetKit
class WidgetTimelineEntry {
  final DateTime date;
  final WidgetData data;
  final bool isPlaceholder;

  const WidgetTimelineEntry({
    required this.date,
    required this.data,
    this.isPlaceholder = false,
  });

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'data': data.toJson(),
        'isPlaceholder': isPlaceholder,
      };
}

/// Widget update result
class WidgetUpdateResult {
  final bool success;
  final String? error;
  final int widgetsUpdated;

  const WidgetUpdateResult({
    required this.success,
    this.error,
    this.widgetsUpdated = 0,
  });
}

/// WidgetKit and Android Widgets integration manager
class WidgetKitIntegration {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach.app/widgets');

  static const EventChannel _eventChannel =
      EventChannel('com.upcoach.app/widgets/events');

  static WidgetKitIntegration? _instance;
  static WidgetKitIntegration get instance {
    _instance ??= WidgetKitIntegration._();
    return _instance!;
  }

  WidgetKitIntegration._() {
    _initialize();
  }

  final Map<String, WidgetConfiguration> _configurations = {};
  final Map<WidgetType, WidgetData Function()> _dataProviders = {};
  final List<StreamSubscription> _subscriptions = [];
  final StreamController<WidgetUpdateResult> _updateController =
      StreamController<WidgetUpdateResult>.broadcast();

  bool _isInitialized = false;
  Timer? _updateTimer;

  /// Stream of widget update results
  Stream<WidgetUpdateResult> get updateStream => _updateController.stream;

  /// Initialize the widget integration
  Future<void> _initialize() async {
    if (_isInitialized) return;

    try {
      _channel.setMethodCallHandler(_handleMethodCall);

      final eventSubscription = _eventChannel.receiveBroadcastStream().listen(
            _handleEvent,
            onError: (error) {
              debugPrint('Widget event stream error: $error');
            },
          );
      _subscriptions.add(eventSubscription);

      if (Platform.isIOS) {
        await _initializeWidgetKit();
      } else if (Platform.isAndroid) {
        await _initializeAndroidWidgets();
      }

      _isInitialized = true;
      debugPrint('WidgetKitIntegration initialized');
    } catch (e) {
      debugPrint('Failed to initialize WidgetKitIntegration: $e');
    }
  }

  /// Initialize iOS WidgetKit
  Future<void> _initializeWidgetKit() async {
    try {
      await _channel.invokeMethod('initializeWidgetKit');
      await _reloadTimelines();
    } catch (e) {
      debugPrint('Failed to initialize WidgetKit: $e');
    }
  }

  /// Initialize Android widgets
  Future<void> _initializeAndroidWidgets() async {
    try {
      await _channel.invokeMethod('initializeAndroidWidgets');
      await _updateAllWidgets();
    } catch (e) {
      debugPrint('Failed to initialize Android widgets: $e');
    }
  }

  /// Handle method calls from native code
  Future<dynamic> _handleMethodCall(MethodCall call) async {
    try {
      switch (call.method) {
        case 'getWidgetData':
          final widgetId = call.arguments['widgetId'] as String;
          final typeString = call.arguments['type'] as String;
          final type = WidgetType.values.firstWhere(
            (e) => e.name == typeString,
            orElse: () => WidgetType.goalProgress,
          );
          return await _getWidgetData(widgetId, type);

        case 'handleWidgetTap':
          final deepLink = call.arguments['deepLink'] as String?;
          if (deepLink != null) {
            await _handleDeepLink(deepLink);
          }
          return null;

        case 'configureWidget':
          final config = WidgetConfiguration.fromJson(
            Map<String, dynamic>.from(call.arguments as Map),
          );
          await _saveConfiguration(config);
          return null;

        case 'requestUpdate':
          final widgetId = call.arguments['widgetId'] as String?;
          if (widgetId != null) {
            await updateWidget(widgetId);
          } else {
            await _updateAllWidgets();
          }
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
          case 'widgetAdded':
            _onWidgetAdded(data);
            break;
          case 'widgetRemoved':
            _onWidgetRemoved(data);
            break;
          case 'widgetUpdated':
            _onWidgetUpdated(data);
            break;
          default:
            debugPrint('Unknown event type: $eventType');
        }
      }
    } catch (e) {
      debugPrint('Error handling event: $e');
    }
  }

  /// Register a data provider for a widget type
  void registerDataProvider(
    WidgetType type,
    WidgetData Function() provider,
  ) {
    _dataProviders[type] = provider;
  }

  /// Get widget data for a specific widget
  Future<Map<String, dynamic>> _getWidgetData(
    String widgetId,
    WidgetType type,
  ) async {
    try {
      final provider = _dataProviders[type];
      if (provider == null) {
        return _getDefaultWidgetData(type);
      }

      final data = provider();
      return data.toJson();
    } catch (e) {
      debugPrint('Error getting widget data for $widgetId: $e');
      return _getDefaultWidgetData(type);
    }
  }

  /// Get default widget data when provider is not available
  Map<String, dynamic> _getDefaultWidgetData(WidgetType type) {
    final now = DateTime.now();

    switch (type) {
      case WidgetType.goalProgress:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'goals': [
              {
                'name': 'Daily Exercise',
                'progress': 0.7,
                'target': 30,
                'current': 21,
                'unit': 'days',
              },
              {
                'name': 'Read 20 Books',
                'progress': 0.4,
                'target': 20,
                'current': 8,
                'unit': 'books',
              },
            ],
          },
          timestamp: now,
          deepLink: 'upcoach://goals',
        ).toJson();

      case WidgetType.dailyHabitTracker:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'habits': [
              {'name': 'Meditate', 'completed': true, 'streak': 15},
              {'name': 'Journal', 'completed': true, 'streak': 8},
              {'name': 'Exercise', 'completed': false, 'streak': 12},
              {'name': 'Read', 'completed': false, 'streak': 5},
            ],
            'completionRate': 0.5,
            'date': now.toIso8601String(),
          },
          timestamp: now,
          deepLink: 'upcoach://habits',
        ).toJson();

      case WidgetType.quickCheckIn:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'prompt': 'How are you feeling today?',
            'lastCheckIn': now.subtract(const Duration(hours: 6)).toIso8601String(),
            'streak': 12,
          },
          timestamp: now,
          deepLink: 'upcoach://checkin',
        ).toJson();

      case WidgetType.upcomingSessions:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'sessions': [
              {
                'coachName': 'Sarah Johnson',
                'time': now.add(const Duration(hours: 2)).toIso8601String(),
                'duration': 60,
                'type': 'Career Coaching',
              },
              {
                'coachName': 'Michael Chen',
                'time': now.add(const Duration(days: 1, hours: 10)).toIso8601String(),
                'duration': 45,
                'type': 'Life Coaching',
              },
            ],
          },
          timestamp: now,
          deepLink: 'upcoach://sessions',
        ).toJson();

      case WidgetType.motivationalQuote:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'quote': 'The only way to do great work is to love what you do.',
            'author': 'Steve Jobs',
            'category': 'motivation',
          },
          timestamp: now,
          deepLink: 'upcoach://quotes',
        ).toJson();

      case WidgetType.streakCounter:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'streaks': [
              {'name': 'Daily Check-in', 'count': 45, 'isActive': true},
              {'name': 'Meditation', 'count': 15, 'isActive': true},
              {'name': 'Exercise', 'count': 12, 'isActive': true},
            ],
            'longestStreak': 45,
            'totalActiveStreaks': 3,
          },
          timestamp: now,
          deepLink: 'upcoach://streaks',
        ).toJson();

      case WidgetType.weeklySummary:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'goalsCompleted': 5,
            'habitsCompleted': 32,
            'sessionsAttended': 2,
            'checkIns': 7,
            'weekProgress': 0.85,
            'weekStart': now.subtract(const Duration(days: 3)).toIso8601String(),
          },
          timestamp: now,
          deepLink: 'upcoach://summary',
        ).toJson();

      case WidgetType.reflectionPrompt:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'prompt': 'What are you grateful for today?',
            'category': 'gratitude',
            'hasResponded': false,
            'responseCount': 0,
          },
          timestamp: now,
          deepLink: 'upcoach://reflect',
        ).toJson();

      case WidgetType.moodTracker:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'currentMood': 'good',
            'moodHistory': [
              {'mood': 'great', 'timestamp': now.subtract(const Duration(days: 1)).toIso8601String()},
              {'mood': 'good', 'timestamp': now.subtract(const Duration(days: 2)).toIso8601String()},
              {'mood': 'neutral', 'timestamp': now.subtract(const Duration(days: 3)).toIso8601String()},
            ],
            'averageMood': 'good',
          },
          timestamp: now,
          deepLink: 'upcoach://mood',
        ).toJson();

      case WidgetType.quickActions:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'actions': [
              {'id': 'checkin', 'label': 'Quick Check-in', 'icon': 'check'},
              {'id': 'habit', 'label': 'Log Habit', 'icon': 'plus'},
              {'id': 'journal', 'label': 'Journal Entry', 'icon': 'edit'},
              {'id': 'session', 'label': 'Book Session', 'icon': 'calendar'},
            ],
          },
          timestamp: now,
          deepLink: 'upcoach://actions',
        ).toJson();

      case WidgetType.coachingInsights:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'insight': 'You\'ve completed 85% of your weekly goals. Keep it up!',
            'type': 'progress',
            'actionable': true,
            'action': 'View Details',
          },
          timestamp: now,
          deepLink: 'upcoach://insights',
        ).toJson();

      case WidgetType.achievementShowcase:
        return WidgetData(
          widgetId: 'default',
          type: type,
          content: {
            'achievements': [
              {'name': '30-Day Streak', 'unlockedAt': now.subtract(const Duration(days: 2)).toIso8601String()},
              {'name': 'Goal Master', 'unlockedAt': now.subtract(const Duration(days: 5)).toIso8601String()},
            ],
            'totalAchievements': 12,
            'recentCount': 2,
          },
          timestamp: now,
          deepLink: 'upcoach://achievements',
        ).toJson();
    }
  }

  /// Save widget configuration
  Future<void> _saveConfiguration(WidgetConfiguration config) async {
    _configurations[config.id] = config;
    await _persistConfiguration(config);
  }

  /// Persist configuration to native storage
  Future<void> _persistConfiguration(WidgetConfiguration config) async {
    try {
      await _channel.invokeMethod('saveConfiguration', config.toJson());
    } catch (e) {
      debugPrint('Failed to persist configuration: $e');
    }
  }

  /// Update a specific widget
  Future<void> updateWidget(String widgetId) async {
    try {
      final config = _configurations[widgetId];
      if (config == null) {
        debugPrint('No configuration found for widget: $widgetId');
        return;
      }

      final data = await _getWidgetData(widgetId, config.type);

      await _channel.invokeMethod('updateWidget', {
        'widgetId': widgetId,
        'data': data,
      });

      _updateController.add(const WidgetUpdateResult(
        success: true,
        widgetsUpdated: 1,
      ));
    } catch (e) {
      debugPrint('Failed to update widget $widgetId: $e');
      _updateController.add(WidgetUpdateResult(
        success: false,
        error: e.toString(),
      ));
    }
  }

  /// Update all widgets
  Future<void> _updateAllWidgets() async {
    try {
      int updated = 0;

      for (final config in _configurations.values) {
        try {
          final data = await _getWidgetData(config.id, config.type);

          await _channel.invokeMethod('updateWidget', {
            'widgetId': config.id,
            'data': data,
          });

          updated++;
        } catch (e) {
          debugPrint('Failed to update widget ${config.id}: $e');
        }
      }

      _updateController.add(WidgetUpdateResult(
        success: true,
        widgetsUpdated: updated,
      ));
    } catch (e) {
      debugPrint('Failed to update all widgets: $e');
      _updateController.add(WidgetUpdateResult(
        success: false,
        error: e.toString(),
      ));
    }
  }

  /// Reload all widget timelines (iOS only)
  Future<void> _reloadTimelines() async {
    if (!Platform.isIOS) return;

    try {
      await _channel.invokeMethod('reloadAllTimelines');
    } catch (e) {
      debugPrint('Failed to reload timelines: $e');
    }
  }

  /// Reload timeline for a specific widget kind (iOS only)
  Future<void> reloadTimeline(WidgetType type) async {
    if (!Platform.isIOS) return;

    try {
      await _channel.invokeMethod('reloadTimeline', {
        'kind': type.name,
      });
    } catch (e) {
      debugPrint('Failed to reload timeline for ${type.name}: $e');
    }
  }

  /// Start a Live Activity (iOS only)
  Future<String?> startLiveActivity(LiveActivityData data) async {
    if (!Platform.isIOS) return null;

    try {
      final activityId = await _channel.invokeMethod<String>(
        'startLiveActivity',
        data.toJson(),
      );
      return activityId;
    } catch (e) {
      debugPrint('Failed to start live activity: $e');
      return null;
    }
  }

  /// Update a Live Activity (iOS only)
  Future<bool> updateLiveActivity(
    String activityId,
    Map<String, dynamic> content,
  ) async {
    if (!Platform.isIOS) return false;

    try {
      await _channel.invokeMethod('updateLiveActivity', {
        'activityId': activityId,
        'content': content,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to update live activity: $e');
      return false;
    }
  }

  /// End a Live Activity (iOS only)
  Future<bool> endLiveActivity(String activityId) async {
    if (!Platform.isIOS) return false;

    try {
      await _channel.invokeMethod('endLiveActivity', {
        'activityId': activityId,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to end live activity: $e');
      return false;
    }
  }

  /// Update Dynamic Island content (iOS only, iPhone 14 Pro+)
  Future<bool> updateDynamicIsland(DynamicIslandContent content) async {
    if (!Platform.isIOS) return false;

    try {
      await _channel.invokeMethod('updateDynamicIsland', content.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to update Dynamic Island: $e');
      return false;
    }
  }

  /// Configure a widget
  Future<bool> configureWidget(WidgetConfiguration config) async {
    try {
      await _saveConfiguration(config);
      await updateWidget(config.id);
      return true;
    } catch (e) {
      debugPrint('Failed to configure widget: $e');
      return false;
    }
  }

  /// Get all widget configurations
  List<WidgetConfiguration> getConfigurations() {
    return _configurations.values.toList();
  }

  /// Get configuration for a specific widget
  WidgetConfiguration? getConfiguration(String widgetId) {
    return _configurations[widgetId];
  }

  /// Remove a widget configuration
  Future<bool> removeConfiguration(String widgetId) async {
    try {
      _configurations.remove(widgetId);
      await _channel.invokeMethod('removeConfiguration', {
        'widgetId': widgetId,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to remove configuration: $e');
      return false;
    }
  }

  /// Handle deep link from widget
  Future<void> _handleDeepLink(String deepLink) async {
    try {
      debugPrint('Handling widget deep link: $deepLink');
      // Deep link handling would be implemented by the app
      // This is a hook for the app to register a handler
    } catch (e) {
      debugPrint('Failed to handle deep link: $e');
    }
  }

  /// Widget added callback
  void _onWidgetAdded(Map? data) {
    if (data == null) return;

    try {
      final widgetId = data['widgetId'] as String?;
      final typeString = data['type'] as String?;

      if (widgetId != null && typeString != null) {
        final type = WidgetType.values.firstWhere(
          (e) => e.name == typeString,
          orElse: () => WidgetType.goalProgress,
        );

        final config = WidgetConfiguration(
          id: widgetId,
          type: type,
          size: WidgetSize.medium,
        );

        _saveConfiguration(config);
        updateWidget(widgetId);
      }
    } catch (e) {
      debugPrint('Error handling widget added: $e');
    }
  }

  /// Widget removed callback
  void _onWidgetRemoved(Map? data) {
    if (data == null) return;

    try {
      final widgetId = data['widgetId'] as String?;
      if (widgetId != null) {
        removeConfiguration(widgetId);
      }
    } catch (e) {
      debugPrint('Error handling widget removed: $e');
    }
  }

  /// Widget updated callback
  void _onWidgetUpdated(Map? data) {
    if (data == null) return;

    try {
      final widgetId = data['widgetId'] as String?;
      if (widgetId != null) {
        updateWidget(widgetId);
      }
    } catch (e) {
      debugPrint('Error handling widget updated: $e');
    }
  }

  /// Start automatic widget updates
  void startAutomaticUpdates({Duration interval = const Duration(hours: 1)}) {
    _stopAutomaticUpdates();

    _updateTimer = Timer.periodic(interval, (timer) {
      _updateAllWidgets();
    });

    debugPrint('Started automatic widget updates with interval: $interval');
  }

  /// Stop automatic widget updates
  void _stopAutomaticUpdates() {
    _updateTimer?.cancel();
    _updateTimer = null;
  }

  /// Force update all widgets
  Future<WidgetUpdateResult> forceUpdateAll() async {
    await _updateAllWidgets();

    if (Platform.isIOS) {
      await _reloadTimelines();
    }

    return const WidgetUpdateResult(success: true);
  }

  /// Get widget gallery (available widget types with previews)
  List<Map<String, dynamic>> getWidgetGallery() {
    return [
      {
        'type': WidgetType.goalProgress,
        'name': 'Goal Progress',
        'description': 'Track your active goals and progress',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.dailyHabitTracker,
        'name': 'Daily Habits',
        'description': 'Check off your daily habits',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.quickCheckIn,
        'name': 'Quick Check-in',
        'description': 'Fast mood and wellness check-in',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium],
      },
      {
        'type': WidgetType.upcomingSessions,
        'name': 'Upcoming Sessions',
        'description': 'Your scheduled coaching sessions',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.motivationalQuote,
        'name': 'Daily Quote',
        'description': 'Inspiring quotes to motivate you',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.streakCounter,
        'name': 'Streak Counter',
        'description': 'Your current streaks and achievements',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium],
      },
      {
        'type': WidgetType.weeklySummary,
        'name': 'Weekly Summary',
        'description': 'Your week at a glance',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.reflectionPrompt,
        'name': 'Reflection Prompt',
        'description': 'Daily prompts for self-reflection',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.moodTracker,
        'name': 'Mood Tracker',
        'description': 'Track your mood over time',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.quickActions,
        'name': 'Quick Actions',
        'description': 'Fast access to common actions',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.coachingInsights,
        'name': 'Coaching Insights',
        'description': 'Personalized insights from your data',
        'supportedSizes': [WidgetSize.medium, WidgetSize.large],
      },
      {
        'type': WidgetType.achievementShowcase,
        'name': 'Achievements',
        'description': 'Showcase your latest achievements',
        'supportedSizes': [WidgetSize.small, WidgetSize.medium],
      },
    ];
  }

  /// Check if device supports Live Activities (iOS 16.1+)
  Future<bool> supportsLiveActivities() async {
    if (!Platform.isIOS) return false;

    try {
      final result = await _channel.invokeMethod<bool>('supportsLiveActivities');
      return result ?? false;
    } catch (e) {
      debugPrint('Failed to check Live Activities support: $e');
      return false;
    }
  }

  /// Check if device supports Dynamic Island (iPhone 14 Pro+)
  Future<bool> supportsDynamicIsland() async {
    if (!Platform.isIOS) return false;

    try {
      final result = await _channel.invokeMethod<bool>('supportsDynamicIsland');
      return result ?? false;
    } catch (e) {
      debugPrint('Failed to check Dynamic Island support: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _stopAutomaticUpdates();
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _subscriptions.clear();
    _updateController.close();
    _isInitialized = false;
  }
}
