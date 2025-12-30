import 'dart:async';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';

// ============================================================================
// DATA MODELS
// ============================================================================

class NotificationInteraction {
  final DateTime timestamp;
  final String notificationType;
  final bool opened;
  final bool dismissed;
  final int timeToInteraction; // seconds
  final DayOfWeek dayOfWeek;
  final int hourOfDay;

  NotificationInteraction({
    required this.timestamp,
    required this.notificationType,
    required this.opened,
    required this.dismissed,
    required this.timeToInteraction,
    required this.dayOfWeek,
    required this.hourOfDay,
  });

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp.toIso8601String(),
        'notificationType': notificationType,
        'opened': opened,
        'dismissed': dismissed,
        'timeToInteraction': timeToInteraction,
        'dayOfWeek': dayOfWeek.index,
        'hourOfDay': hourOfDay,
      };

  factory NotificationInteraction.fromJson(Map<String, dynamic> json) {
    return NotificationInteraction(
      timestamp: DateTime.parse(json['timestamp']),
      notificationType: json['notificationType'],
      opened: json['opened'],
      dismissed: json['dismissed'],
      timeToInteraction: json['timeToInteraction'],
      dayOfWeek: DayOfWeek.values[json['dayOfWeek']],
      hourOfDay: json['hourOfDay'],
    );
  }
}

enum DayOfWeek { monday, tuesday, wednesday, thursday, friday, saturday, sunday }

class TimeSlot {
  final int hour;
  final double engagementScore;
  final int sampleSize;

  TimeSlot({
    required this.hour,
    required this.engagementScore,
    required this.sampleSize,
  });
}

class NotificationPrediction {
  final DateTime suggestedTime;
  final double engagementProbability;
  final String reasoning;
  final List<DateTime> alternativeTimes;

  NotificationPrediction({
    required this.suggestedTime,
    required this.engagementProbability,
    required this.reasoning,
    required this.alternativeTimes,
  });
}

// ============================================================================
// SMART NOTIFICATION OPTIMIZER
// ============================================================================

class SmartNotificationOptimizer {
  static final SmartNotificationOptimizer _instance =
      SmartNotificationOptimizer._internal();

  factory SmartNotificationOptimizer() => _instance;

  SmartNotificationOptimizer._internal();

  final List<NotificationInteraction> _interactions = [];
  final Map<int, List<double>> _hourlyScores = {}; // hour -> [scores]
  final Map<DayOfWeek, Map<int, List<double>>> _dayHourScores = {};

  static const int _maxInteractionsStored = 500;
  static const int _minSamplesForPrediction = 5;
  static const double _fatigueThreshold = 3; // notifications per day
  static const int _lookbackDays = 30;

  Timer? _cleanupTimer;
  bool _isInitialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  Future<void> initialize() async {
    if (_isInitialized) return;

    await _loadInteractions();

    // Start periodic cleanup
    _cleanupTimer = Timer.periodic(
      const Duration(hours: 24),
      (_) => _cleanupOldData(),
    );

    _isInitialized = true;
    print('SmartNotificationOptimizer initialized with ${_interactions.length} interactions');
  }

  void dispose() {
    _cleanupTimer?.cancel();
  }

  // ============================================================================
  // LEARNING FROM INTERACTIONS
  // ============================================================================

  Future<void> recordInteraction({
    required String notificationType,
    required DateTime notificationTime,
    required bool opened,
    required bool dismissed,
    int? timeToInteractionSeconds,
  }) async {
    final interaction = NotificationInteraction(
      timestamp: DateTime.now(),
      notificationType: notificationType,
      opened: opened,
      dismissed: dismissed,
      timeToInteraction: timeToInteractionSeconds ?? 0,
      dayOfWeek: _getDayOfWeek(notificationTime),
      hourOfDay: notificationTime.hour,
    );

    _interactions.add(interaction);

    // Update scores
    _updateScores(interaction);

    // Limit storage
    if (_interactions.length > _maxInteractionsStored) {
      _interactions.removeAt(0);
    }

    await _saveInteractions();
  }

  void _updateScores(NotificationInteraction interaction) {
    final score = _calculateEngagementScore(interaction);

    // Update hourly scores
    _hourlyScores.putIfAbsent(interaction.hourOfDay, () => []);
    _hourlyScores[interaction.hourOfDay]!.add(score);

    // Update day-hour scores
    _dayHourScores.putIfAbsent(interaction.dayOfWeek, () => {});
    _dayHourScores[interaction.dayOfWeek]!
        .putIfAbsent(interaction.hourOfDay, () => []);
    _dayHourScores[interaction.dayOfWeek]![interaction.hourOfDay]!.add(score);
  }

  double _calculateEngagementScore(NotificationInteraction interaction) {
    if (interaction.dismissed) return 0.0;
    if (!interaction.opened) return 0.1;

    // Higher score for faster interactions
    double timeScore = 1.0;
    if (interaction.timeToInteraction > 0) {
      // Score decreases as time to interaction increases
      // Fast response (< 1 min) = 1.0, slow (> 1 hour) = 0.3
      final minutes = interaction.timeToInteraction / 60;
      timeScore = max(0.3, 1.0 - (minutes / 60) * 0.7);
    }

    return timeScore;
  }

  // ============================================================================
  // PREDICTION
  // ============================================================================

  Future<NotificationPrediction> predictOptimalTime({
    String notificationType = 'general',
    DateTime? referenceDate,
  }) async {
    final reference = referenceDate ?? DateTime.now();
    final dayOfWeek = _getDayOfWeek(reference);

    // Get optimal hours based on historical data
    final optimalHours = _getOptimalHours(dayOfWeek);

    if (optimalHours.isEmpty) {
      // No data, use default smart times
      return _getDefaultPrediction(reference);
    }

    // Find next available optimal time
    final suggestedTime = _findNextOptimalTime(reference, optimalHours);
    final engagementProb = _estimateEngagementProbability(
      suggestedTime.hour,
      dayOfWeek,
    );

    // Generate alternative times
    final alternatives = _generateAlternativeTimes(reference, optimalHours);

    final reasoning = _generateReasoning(suggestedTime, engagementProb, dayOfWeek);

    return NotificationPrediction(
      suggestedTime: suggestedTime,
      engagementProbability: engagementProb,
      reasoning: reasoning,
      alternativeTimes: alternatives,
    );
  }

  List<TimeSlot> _getOptimalHours(DayOfWeek dayOfWeek) {
    final slots = <TimeSlot>[];

    // Try day-specific data first
    if (_dayHourScores.containsKey(dayOfWeek)) {
      for (var hour in _dayHourScores[dayOfWeek]!.keys) {
        final scores = _dayHourScores[dayOfWeek]![hour]!;
        if (scores.length >= _minSamplesForPrediction) {
          final avgScore = scores.reduce((a, b) => a + b) / scores.length;
          slots.add(TimeSlot(
            hour: hour,
            engagementScore: avgScore,
            sampleSize: scores.length,
          ));
        }
      }
    }

    // Fallback to overall hourly data
    if (slots.isEmpty) {
      for (var hour in _hourlyScores.keys) {
        final scores = _hourlyScores[hour]!;
        if (scores.length >= _minSamplesForPrediction) {
          final avgScore = scores.reduce((a, b) => a + b) / scores.length;
          slots.add(TimeSlot(
            hour: hour,
            engagementScore: avgScore,
            sampleSize: scores.length,
          ));
        }
      }
    }

    // Sort by engagement score
    slots.sort((a, b) => b.engagementScore.compareTo(a.engagementScore));
    return slots.take(5).toList();
  }

  DateTime _findNextOptimalTime(DateTime reference, List<TimeSlot> optimalHours) {
    if (optimalHours.isEmpty) {
      return reference.add(const Duration(hours: 1));
    }

    // Find next occurrence of optimal hour
    final currentHour = reference.hour;
    final bestHour = optimalHours.first.hour;

    DateTime nextTime;
    if (bestHour > currentHour) {
      // Today at best hour
      nextTime = DateTime(
        reference.year,
        reference.month,
        reference.day,
        bestHour,
        0,
      );
    } else {
      // Tomorrow at best hour
      nextTime = DateTime(
        reference.year,
        reference.month,
        reference.day + 1,
        bestHour,
        0,
      );
    }

    // Avoid notification fatigue - check recent notifications
    if (_checkNotificationFatigue(reference)) {
      nextTime = nextTime.add(const Duration(hours: 2));
    }

    return nextTime;
  }

  double _estimateEngagementProbability(int hour, DayOfWeek dayOfWeek) {
    List<double>? scores;

    // Try day-specific first
    if (_dayHourScores.containsKey(dayOfWeek) &&
        _dayHourScores[dayOfWeek]!.containsKey(hour)) {
      scores = _dayHourScores[dayOfWeek]![hour];
    } else if (_hourlyScores.containsKey(hour)) {
      scores = _hourlyScores[hour];
    }

    if (scores == null || scores.isEmpty) {
      return 0.5; // Default probability
    }

    final avgScore = scores.reduce((a, b) => a + b) / scores.length;
    return avgScore.clamp(0.0, 1.0);
  }

  List<DateTime> _generateAlternativeTimes(
    DateTime reference,
    List<TimeSlot> optimalHours,
  ) {
    final alternatives = <DateTime>[];

    for (var i = 1; i < min(optimalHours.length, 3); i++) {
      final hour = optimalHours[i].hour;
      DateTime altTime;

      if (hour > reference.hour) {
        altTime = DateTime(
          reference.year,
          reference.month,
          reference.day,
          hour,
          0,
        );
      } else {
        altTime = DateTime(
          reference.year,
          reference.month,
          reference.day + 1,
          hour,
          0,
        );
      }

      alternatives.add(altTime);
    }

    return alternatives;
  }

  String _generateReasoning(
    DateTime suggestedTime,
    double probability,
    DayOfWeek dayOfWeek,
  ) {
    final hour = suggestedTime.hour;
    String timeOfDay;

    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    final probPercent = (probability * 100).toInt();

    return 'Based on your past interactions, you\'re most likely to engage with '
        'notifications in the $timeOfDay on ${_dayOfWeekToString(dayOfWeek)}s '
        '($probPercent% engagement rate).';
  }

  NotificationPrediction _getDefaultPrediction(DateTime reference) {
    // Default optimal times based on research
    final defaultHours = [9, 12, 18, 20]; // Morning, lunch, evening, night

    final currentHour = reference.hour;
    int bestHour = defaultHours.firstWhere(
      (h) => h > currentHour,
      orElse: () => defaultHours.first,
    );

    DateTime suggestedTime;
    if (bestHour > currentHour) {
      suggestedTime = DateTime(
        reference.year,
        reference.month,
        reference.day,
        bestHour,
        0,
      );
    } else {
      suggestedTime = DateTime(
        reference.year,
        reference.month,
        reference.day + 1,
        bestHour,
        0,
      );
    }

    return NotificationPrediction(
      suggestedTime: suggestedTime,
      engagementProbability: 0.5,
      reasoning: 'Using default optimal times. More data will improve predictions.',
      alternativeTimes: defaultHours
          .where((h) => h != bestHour)
          .take(3)
          .map((h) => DateTime(reference.year, reference.month, reference.day, h, 0))
          .toList(),
    );
  }

  // ============================================================================
  // FATIGUE PREVENTION
  // ============================================================================

  bool _checkNotificationFatigue(DateTime reference) {
    final today = DateTime(reference.year, reference.month, reference.day);
    final todayInteractions = _interactions.where((i) {
      final interactionDate = DateTime(
        i.timestamp.year,
        i.timestamp.month,
        i.timestamp.day,
      );
      return interactionDate == today;
    }).length;

    return todayInteractions >= _fatigueThreshold;
  }

  Future<bool> shouldSendNotification({
    required String notificationType,
    DateTime? scheduledTime,
  }) async {
    final time = scheduledTime ?? DateTime.now();

    // Check fatigue
    if (_checkNotificationFatigue(time)) {
      return false;
    }

    // Check quiet hours (10 PM - 7 AM)
    final hour = time.hour;
    if (hour >= 22 || hour < 7) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  Map<String, dynamic> getAnalytics() {
    final totalInteractions = _interactions.length;
    final openedCount = _interactions.where((i) => i.opened).length;
    final dismissedCount = _interactions.where((i) => i.dismissed).length;

    final openRate = totalInteractions > 0 ? openedCount / totalInteractions : 0.0;

    // Find best time slots
    final bestTimeSlots = _hourlyScores.entries
        .where((e) => e.value.length >= _minSamplesForPrediction)
        .map((e) {
          final avgScore = e.value.reduce((a, b) => a + b) / e.value.length;
          return {'hour': e.key, 'score': avgScore, 'samples': e.value.length};
        })
        .toList()
      ..sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));

    return {
      'totalInteractions': totalInteractions,
      'openRate': openRate,
      'dismissRate': totalInteractions > 0 ? dismissedCount / totalInteractions : 0.0,
      'bestTimeSlots': bestTimeSlots.take(5).toList(),
      'dataQuality': totalInteractions >= 20 ? 'good' : 'learning',
    };
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  Future<void> _saveInteractions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _interactions.map((i) => i.toJson()).toList();
      // In production, would serialize to JSON string
      // For now, just mark as saved
      await prefs.setBool('notifications_optimizer_saved', true);
    } catch (e) {
      print('Error saving interactions: $e');
    }
  }

  Future<void> _loadInteractions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // In production, would deserialize from JSON string
      // For now, just check if saved
      final saved = prefs.getBool('notifications_optimizer_saved') ?? false;
      if (saved) {
        print('Loaded notification interactions');
      }
    } catch (e) {
      print('Error loading interactions: $e');
    }
  }

  void _cleanupOldData() {
    final cutoff = DateTime.now().subtract(Duration(days: _lookbackDays));
    _interactions.removeWhere((i) => i.timestamp.isBefore(cutoff));
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  DayOfWeek _getDayOfWeek(DateTime date) {
    return DayOfWeek.values[date.weekday - 1];
  }

  String _dayOfWeekToString(DayOfWeek day) {
    return day.toString().split('.').last;
  }
}
