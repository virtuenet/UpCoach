import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/health/services/oura_service.dart';

void main() {
  group('OuraPersonalInfo', () {
    test('fromJson parses personal info correctly', () {
      final json = {
        'id': 'user-123',
        'age': 35,
        'weight': 75.5,
        'height': 1.80,
        'biological_sex': 'male',
        'email': 'test@example.com',
      };

      final info = OuraPersonalInfo.fromJson(json);

      expect(info.id, equals('user-123'));
      expect(info.age, equals(35));
      expect(info.weight, equals(75.5));
      expect(info.height, equals(1.80));
      expect(info.biologicalSex, equals('male'));
      expect(info.email, equals('test@example.com'));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'user-123',
      };

      final info = OuraPersonalInfo.fromJson(json);

      expect(info.id, equals('user-123'));
      expect(info.age, isNull);
      expect(info.weight, isNull);
      expect(info.height, isNull);
    });
  });

  group('OuraDailyReadiness', () {
    test('fromJson parses readiness data correctly', () {
      final json = {
        'id': 'readiness-001',
        'day': '2024-01-15',
        'score': 85,
        'temperature_deviation': 0.2,
        'temperature_trend_deviation': -0.1,
        'contributors': {
          'activity_balance': 80,
          'body_temperature': 90,
          'hrv_balance': 75,
          'previous_day_activity': 85,
          'previous_night': 88,
          'recovery_index': 82,
          'resting_heart_rate': 90,
          'sleep_balance': 78,
        },
      };

      final readiness = OuraDailyReadiness.fromJson(json);

      expect(readiness.id, equals('readiness-001'));
      expect(readiness.day, equals('2024-01-15'));
      expect(readiness.score, equals(85));
      expect(readiness.temperatureDeviation, equals(0.2));
      expect(readiness.temperatureTrendDeviation, equals(-0.1));
      expect(readiness.contributors.activityBalance, equals(80));
      expect(readiness.contributors.bodyTemperature, equals(90));
      expect(readiness.contributors.hrvBalance, equals(75));
    });

    test('fromJson handles missing contributors', () {
      final json = {
        'id': 'readiness-001',
        'day': '2024-01-15',
        'score': 75,
      };

      final readiness = OuraDailyReadiness.fromJson(json);

      expect(readiness.score, equals(75));
      expect(readiness.contributors.activityBalance, isNull);
    });

    test('fromJson handles missing score with default', () {
      final json = <String, dynamic>{
        'id': 'readiness-001',
        'day': '2024-01-15',
        'contributors': <String, dynamic>{},
      };

      final readiness = OuraDailyReadiness.fromJson(json);

      expect(readiness.score, equals(0));
    });
  });

  group('OuraDailySleep', () {
    test('fromJson parses sleep data correctly', () {
      final json = {
        'id': 'sleep-001',
        'day': '2024-01-15',
        'score': 88,
        'contributors': {
          'deep_sleep': 85,
          'efficiency': 92,
          'latency': 90,
          'rem_sleep': 80,
          'restfulness': 88,
          'timing': 75,
          'total_sleep': 90,
        },
      };

      final sleep = OuraDailySleep.fromJson(json);

      expect(sleep.id, equals('sleep-001'));
      expect(sleep.day, equals('2024-01-15'));
      expect(sleep.score, equals(88));
      expect(sleep.contributors.deepSleep, equals(85));
      expect(sleep.contributors.efficiency, equals(92));
      expect(sleep.contributors.remSleep, equals(80));
      expect(sleep.contributors.totalSleep, equals(90));
    });
  });

  group('OuraSleepPeriod', () {
    test('fromJson parses sleep period correctly', () {
      final json = {
        'id': 'period-001',
        'day': '2024-01-15',
        'bedtime_start': '2024-01-14T23:00:00+00:00',
        'bedtime_end': '2024-01-15T07:00:00+00:00',
        'type': 'long_sleep',
        'awake_time': 1800,
        'deep_sleep_duration': 4500,
        'light_sleep_duration': 14400,
        'rem_sleep_duration': 5400,
        'total_sleep_duration': 24300,
        'efficiency': 92,
        'latency': 300,
        'average_heart_rate': 55,
        'lowest_heart_rate': 48,
        'average_hrv': 45,
        'average_breath': 15.5,
        'restless_periods': 3,
      };

      final period = OuraSleepPeriod.fromJson(json);

      expect(period.id, equals('period-001'));
      expect(period.day, equals('2024-01-15'));
      expect(period.type, equals('long_sleep'));
      expect(period.awakeTime, equals(1800));
      expect(period.deepSleepDuration, equals(4500));
      expect(period.lightSleepDuration, equals(14400));
      expect(period.remSleepDuration, equals(5400));
      expect(period.totalSleepDuration, equals(24300));
      expect(period.efficiency, equals(92));
      expect(period.averageHeartRate, equals(55));
      expect(period.lowestHeartRate, equals(48));
      expect(period.averageHrv, equals(45));
      expect(period.averageBreath, equals(15.5));
      expect(period.restlessPeriods, equals(3));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'period-001',
        'day': '2024-01-15',
        'bedtime_start': '2024-01-14T23:00:00+00:00',
        'bedtime_end': '2024-01-15T07:00:00+00:00',
      };

      final period = OuraSleepPeriod.fromJson(json);

      expect(period.type, equals('long_sleep'));
      expect(period.deepSleepDuration, isNull);
      expect(period.averageHrv, isNull);
    });
  });

  group('OuraDailyActivity', () {
    test('fromJson parses activity data correctly', () {
      final json = {
        'id': 'activity-001',
        'day': '2024-01-15',
        'score': 82,
        'active_calories': 450,
        'total_calories': 2200,
        'steps': 10500,
        'equivalent_walking_distance': 8500,
        'high_activity_met_minutes': 45,
        'medium_activity_met_minutes': 60,
        'low_activity_met_minutes': 120,
        'sedentary_met_minutes': 600,
        'non_wear_minutes': 30,
        'resting_time': 480,
        'inactivity_alerts': 2,
      };

      final activity = OuraDailyActivity.fromJson(json);

      expect(activity.id, equals('activity-001'));
      expect(activity.day, equals('2024-01-15'));
      expect(activity.score, equals(82));
      expect(activity.activeCalories, equals(450));
      expect(activity.totalCalories, equals(2200));
      expect(activity.steps, equals(10500));
      expect(activity.equivalentWalkingDistance, equals(8500));
      expect(activity.highActivityMetMinutes, equals(45));
      expect(activity.mediumActivityMetMinutes, equals(60));
      expect(activity.lowActivityMetMinutes, equals(120));
      expect(activity.sedentaryMetMinutes, equals(600));
      expect(activity.inactivityAlerts, equals(2));
    });

    test('fromJson handles missing values with defaults', () {
      final json = {
        'id': 'activity-001',
        'day': '2024-01-15',
      };

      final activity = OuraDailyActivity.fromJson(json);

      expect(activity.score, equals(0));
      expect(activity.activeCalories, equals(0));
      expect(activity.steps, equals(0));
    });
  });

  group('OuraHeartRate', () {
    test('fromJson parses heart rate data correctly', () {
      final json = {
        'bpm': 72,
        'source': 'awake',
        'timestamp': '2024-01-15T10:30:00+00:00',
      };

      final hr = OuraHeartRate.fromJson(json);

      expect(hr.bpm, equals(72));
      expect(hr.source, equals('awake'));
      expect(hr.timestamp, equals('2024-01-15T10:30:00+00:00'));
    });

    test('fromJson handles missing source', () {
      final json = {
        'bpm': 65,
        'timestamp': '2024-01-15T03:00:00+00:00',
      };

      final hr = OuraHeartRate.fromJson(json);

      expect(hr.bpm, equals(65));
      expect(hr.source, equals('unknown'));
    });
  });

  group('OuraSpO2', () {
    test('fromJson parses SpO2 data correctly', () {
      final json = {
        'id': 'spo2-001',
        'day': '2024-01-15',
        'spo2_percentage': {
          'average': 97.5,
        },
        'breathing_disturbance_index': 2.5,
      };

      final spo2 = OuraSpO2.fromJson(json);

      expect(spo2.id, equals('spo2-001'));
      expect(spo2.day, equals('2024-01-15'));
      expect(spo2.averagePercentage, equals(97.5));
      expect(spo2.breathingDisturbanceIndex, equals(2.5));
    });

    test('fromJson handles missing spo2_percentage', () {
      final json = {
        'id': 'spo2-001',
        'day': '2024-01-15',
      };

      final spo2 = OuraSpO2.fromJson(json);

      expect(spo2.averagePercentage, isNull);
      expect(spo2.breathingDisturbanceIndex, isNull);
    });
  });

  group('OuraWorkout', () {
    test('fromJson parses workout data correctly', () {
      final json = {
        'id': 'workout-001',
        'activity': 'running',
        'calories': 450,
        'day': '2024-01-15',
        'distance': 8500.0,
        'end_datetime': '2024-01-15T18:00:00+00:00',
        'intensity': 'hard',
        'label': 'Morning Run',
        'source': 'manual',
        'start_datetime': '2024-01-15T17:00:00+00:00',
      };

      final workout = OuraWorkout.fromJson(json);

      expect(workout.id, equals('workout-001'));
      expect(workout.activity, equals('running'));
      expect(workout.calories, equals(450));
      expect(workout.day, equals('2024-01-15'));
      expect(workout.distance, equals(8500.0));
      expect(workout.intensity, equals('hard'));
      expect(workout.label, equals('Morning Run'));
      expect(workout.source, equals('manual'));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'workout-001',
        'activity': 'cycling',
        'start_datetime': '2024-01-15T17:00:00+00:00',
      };

      final workout = OuraWorkout.fromJson(json);

      expect(workout.calories, isNull);
      expect(workout.distance, isNull);
      expect(workout.intensity, isNull);
      expect(workout.source, equals('unknown'));
    });
  });

  group('OuraReadinessContributors', () {
    test('fromJson parses all contributors correctly', () {
      final json = {
        'activity_balance': 85,
        'body_temperature': 90,
        'hrv_balance': 78,
        'previous_day_activity': 82,
        'previous_night': 88,
        'recovery_index': 80,
        'resting_heart_rate': 92,
        'sleep_balance': 75,
      };

      final contributors = OuraReadinessContributors.fromJson(json);

      expect(contributors.activityBalance, equals(85));
      expect(contributors.bodyTemperature, equals(90));
      expect(contributors.hrvBalance, equals(78));
      expect(contributors.previousDayActivity, equals(82));
      expect(contributors.previousNight, equals(88));
      expect(contributors.recoveryIndex, equals(80));
      expect(contributors.restingHeartRate, equals(92));
      expect(contributors.sleepBalance, equals(75));
    });

    test('fromJson handles empty json', () {
      final json = <String, dynamic>{};

      final contributors = OuraReadinessContributors.fromJson(json);

      expect(contributors.activityBalance, isNull);
      expect(contributors.bodyTemperature, isNull);
    });
  });

  group('OuraSleepContributors', () {
    test('fromJson parses all sleep contributors correctly', () {
      final json = {
        'deep_sleep': 85,
        'efficiency': 92,
        'latency': 88,
        'rem_sleep': 80,
        'restfulness': 90,
        'timing': 75,
        'total_sleep': 88,
      };

      final contributors = OuraSleepContributors.fromJson(json);

      expect(contributors.deepSleep, equals(85));
      expect(contributors.efficiency, equals(92));
      expect(contributors.latency, equals(88));
      expect(contributors.remSleep, equals(80));
      expect(contributors.restfulness, equals(90));
      expect(contributors.timing, equals(75));
      expect(contributors.totalSleep, equals(88));
    });
  });
}
