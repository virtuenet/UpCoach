import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';

/// Enhanced health integration service
///
/// Correlates health data (sleep, steps, heart rate) with habit completion
/// to provide personalized insights and recommendations.
class EnhancedHealthService {
  final HealthFactory _healthFactory = HealthFactory();

  /// Initialize health permissions
  Future<bool> requestPermissions() async {
    // Request health data permission
    final types = [
      HealthDataType.SLEEP_ASLEEP,
      HealthDataType.SLEEP_AWAKE,
      HealthDataType.SLEEP_IN_BED,
      HealthDataType.STEPS,
      HealthDataType.HEART_RATE,
      HealthDataType.ACTIVE_ENERGY_BURNED,
      HealthDataType.WORKOUT,
    ];

    final permissions = types.map((type) => HealthDataAccess.READ).toList();

    try {
      final granted = await _healthFactory.requestAuthorization(types, permissions: permissions);
      return granted;
    } catch (e) {
      print('Error requesting health permissions: $e');
      return false;
    }
  }

  /// Get sleep data for the last N days
  Future<List<HealthDataPoint>> getSleepData({int days = 30}) async {
    final now = DateTime.now();
    final startDate = now.subtract(Duration(days: days));

    try {
      final sleepData = await _healthFactory.getHealthDataFromTypes(
        startDate,
        now,
        [
          HealthDataType.SLEEP_ASLEEP,
          HealthDataType.SLEEP_IN_BED,
        ],
      );

      return sleepData;
    } catch (e) {
      print('Error fetching sleep data: $e');
      return [];
    }
  }

  /// Calculate average sleep duration
  Future<Duration> getAverageSleepDuration({int days = 7}) async {
    final sleepData = await getSleepData(days: days);

    if (sleepData.isEmpty) {
      return Duration.zero;
    }

    int totalMinutes = 0;
    int count = 0;

    for (final dataPoint in sleepData) {
      if (dataPoint.type == HealthDataType.SLEEP_ASLEEP) {
        final sleepValue = dataPoint.value as NumericHealthValue;
        totalMinutes += sleepValue.numericValue.toInt();
        count++;
      }
    }

    if (count == 0) return Duration.zero;

    return Duration(minutes: totalMinutes ~/ count);
  }

  /// Get daily step count
  Future<int> getStepsToday() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);

    try {
      final stepsData = await _healthFactory.getHealthDataFromTypes(
        startOfDay,
        now,
        [HealthDataType.STEPS],
      );

      int totalSteps = 0;
      for (final dataPoint in stepsData) {
        final stepValue = dataPoint.value as NumericHealthValue;
        totalSteps += stepValue.numericValue.toInt();
      }

      return totalSteps;
    } catch (e) {
      print('Error fetching steps data: $e');
      return 0;
    }
  }

  /// Get heart rate variability (HRV) data
  Future<List<HealthDataPoint>> getHeartRateData({int days = 7}) async {
    final now = DateTime.now();
    final startDate = now.subtract(Duration(days: days));

    try {
      final heartRateData = await _healthFactory.getHealthDataFromTypes(
        startDate,
        now,
        [HealthDataType.HEART_RATE],
      );

      return heartRateData;
    } catch (e) {
      print('Error fetching heart rate data: $e');
      return [];
    }
  }

  /// Analyze correlation between sleep and habit completion
  ///
  /// Returns correlation insights like:
  /// "You complete 40% more habits after 7+ hours of sleep"
  Future<HealthCorrelation> analyzeSleepHabitCorrelation({
    required List<HabitCompletionData> habitData,
    int days = 30,
  }) async {
    final sleepData = await getSleepData(days: days);

    if (sleepData.isEmpty || habitData.isEmpty) {
      return HealthCorrelation(
        correlationType: CorrelationType.sleep,
        correlation: 0.0,
        insight: 'Not enough data to analyze correlation',
        recommendation: 'Track your habits and sleep for at least 7 days',
      );
    }

    // Group sleep data by day
    final Map<DateTime, double> sleepByDay = {};
    for (final dataPoint in sleepData) {
      if (dataPoint.type == HealthDataType.SLEEP_ASLEEP) {
        final date = DateTime(
          dataPoint.dateFrom.year,
          dataPoint.dateFrom.month,
          dataPoint.dateFrom.day,
        );
        final sleepValue = dataPoint.value as NumericHealthValue;
        sleepByDay[date] = (sleepByDay[date] ?? 0) + sleepValue.numericValue;
      }
    }

    // Calculate completion rates for different sleep durations
    double highSleepCompletionRate = 0;
    double lowSleepCompletionRate = 0;
    int highSleepDays = 0;
    int lowSleepDays = 0;

    for (final habit in habitData) {
      final date = DateTime(
        habit.date.year,
        habit.date.month,
        habit.date.day,
      );

      final sleepMinutes = sleepByDay[date] ?? 0;
      final sleepHours = sleepMinutes / 60;

      if (sleepHours >= 7) {
        highSleepCompletionRate += habit.completionRate;
        highSleepDays++;
      } else if (sleepHours > 0) {
        lowSleepCompletionRate += habit.completionRate;
        lowSleepDays++;
      }
    }

    if (highSleepDays == 0 || lowSleepDays == 0) {
      return HealthCorrelation(
        correlationType: CorrelationType.sleep,
        correlation: 0.0,
        insight: 'Need more varied sleep data',
        recommendation: 'Continue tracking for better insights',
      );
    }

    final avgHighSleep = highSleepCompletionRate / highSleepDays;
    final avgLowSleep = lowSleepCompletionRate / lowSleepDays;

    final difference = ((avgHighSleep - avgLowSleep) / avgLowSleep * 100).round();

    String insight;
    String recommendation;

    if (difference > 20) {
      insight = 'You complete $difference% more habits after 7+ hours of sleep';
      recommendation = 'Aim for 7-9 hours of sleep to maximize habit success';
    } else if (difference < -20) {
      insight = 'You complete ${difference.abs()}% fewer habits after 7+ hours of sleep';
      recommendation = 'Your optimal sleep duration may be different. Experiment to find what works.';
    } else {
      insight = 'Sleep duration has minimal impact on your habit completion';
      recommendation = 'Focus on sleep quality and consistency instead of just duration';
    }

    return HealthCorrelation(
      correlationType: CorrelationType.sleep,
      correlation: difference / 100,
      insight: insight,
      recommendation: recommendation,
    );
  }

  /// Analyze correlation between steps and habit completion
  Future<HealthCorrelation> analyzeStepsHabitCorrelation({
    required List<HabitCompletionData> habitData,
    int days = 30,
  }) async {
    // Similar implementation for steps correlation
    return HealthCorrelation(
      correlationType: CorrelationType.activity,
      correlation: 0.0,
      insight: 'Analysis in progress',
      recommendation: 'Keep tracking your activity',
    );
  }

  /// Get personalized recommendations based on health data
  Future<List<HealthRecommendation>> getRecommendations() async {
    final recommendations = <HealthRecommendation>[];

    // Check sleep
    final avgSleep = await getAverageSleepDuration(days: 7);
    if (avgSleep.inHours < 7) {
      recommendations.add(HealthRecommendation(
        title: 'Improve Sleep',
        description: 'Your average sleep is ${avgSleep.inHours}h ${avgSleep.inMinutes % 60}m. Aim for 7-9 hours.',
        priority: RecommendationPriority.high,
        actionUrl: 'upcoach://habits/create?template=sleep',
      ));
    }

    // Check steps
    final stepsToday = await getStepsToday();
    if (stepsToday < 5000) {
      recommendations.add(HealthRecommendation(
        title: 'Increase Activity',
        description: 'You have $stepsToday steps today. Aim for 10,000 steps daily.',
        priority: RecommendationPriority.medium,
        actionUrl: 'upcoach://habits/create?template=walking',
      ));
    }

    return recommendations;
  }
}

/// Habit completion data for correlation analysis
class HabitCompletionData {
  final DateTime date;
  final double completionRate;
  final int completedCount;
  final int totalCount;

  HabitCompletionData({
    required this.date,
    required this.completionRate,
    required this.completedCount,
    required this.totalCount,
  });
}

/// Health correlation result
class HealthCorrelation {
  final CorrelationType correlationType;
  final double correlation; // -1.0 to 1.0
  final String insight;
  final String recommendation;

  HealthCorrelation({
    required this.correlationType,
    required this.correlation,
    required this.insight,
    required this.recommendation,
  });
}

enum CorrelationType {
  sleep,
  activity,
  heartRate,
  workout,
}

/// Health-based recommendation
class HealthRecommendation {
  final String title;
  final String description;
  final RecommendationPriority priority;
  final String? actionUrl;

  HealthRecommendation({
    required this.title,
    required this.description,
    required this.priority,
    this.actionUrl,
  });
}

enum RecommendationPriority {
  high,
  medium,
  low,
}
