import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/health/services/whoop_service.dart';

void main() {
  group('WhoopUserProfile', () {
    test('fromJson parses profile correctly', () {
      final json = {
        'user_id': 12345,
        'email': 'test@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
      };

      final profile = WhoopUserProfile.fromJson(json);

      expect(profile.userId, equals(12345));
      expect(profile.email, equals('test@example.com'));
      expect(profile.firstName, equals('John'));
      expect(profile.lastName, equals('Doe'));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'user_id': 12345,
      };

      final profile = WhoopUserProfile.fromJson(json);

      expect(profile.userId, equals(12345));
      expect(profile.email, equals(''));
      expect(profile.firstName, equals(''));
      expect(profile.lastName, equals(''));
    });
  });

  group('WhoopRecovery', () {
    test('fromJson parses recovery data correctly', () {
      final json = {
        'cycle_id': 1001,
        'sleep_id': 2001,
        'user_id': 12345,
        'created_at': '2024-01-15T08:00:00.000Z',
        'updated_at': '2024-01-15T08:00:00.000Z',
        'score': {
          'recovery_score': 85,
          'resting_heart_rate': 55,
          'hrv_rmssd_milli': 45.5,
          'spo2_percentage': 97.0,
          'skin_temp_celsius': 32.5,
        },
      };

      final recovery = WhoopRecovery.fromJson(json);

      expect(recovery.cycleId, equals(1001));
      expect(recovery.sleepId, equals(2001));
      expect(recovery.userId, equals(12345));
      expect(recovery.score.recoveryScore, equals(85));
      expect(recovery.score.restingHeartRate, equals(55));
      expect(recovery.score.hrvRmssdMilli, equals(45.5));
      expect(recovery.score.spo2Percentage, equals(97.0));
      expect(recovery.score.skinTempCelsius, equals(32.5));
    });

    test('WhoopRecoveryScore handles missing optional fields', () {
      final json = {
        'recovery_score': 80,
        'resting_heart_rate': 60,
        'hrv_rmssd_milli': 40.0,
      };

      final score = WhoopRecoveryScore.fromJson(json);

      expect(score.recoveryScore, equals(80));
      expect(score.restingHeartRate, equals(60));
      expect(score.hrvRmssdMilli, equals(40.0));
      expect(score.spo2Percentage, isNull);
      expect(score.skinTempCelsius, isNull);
    });
  });

  group('WhoopCycle', () {
    test('fromJson parses cycle data correctly', () {
      final json = {
        'id': 3001,
        'user_id': 12345,
        'created_at': '2024-01-15T00:00:00.000Z',
        'updated_at': '2024-01-15T23:59:59.000Z',
        'start': '2024-01-15T00:00:00.000Z',
        'end': '2024-01-15T23:59:59.000Z',
        'timezone_offset': '-05:00',
        'score': {
          'strain': 12.5,
          'kilojoule': 2500.0,
          'average_heart_rate': 72,
          'max_heart_rate': 165,
        },
      };

      final cycle = WhoopCycle.fromJson(json);

      expect(cycle.id, equals(3001));
      expect(cycle.userId, equals(12345));
      expect(cycle.timezoneOffset, equals('-05:00'));
      expect(cycle.score.strain, equals(12.5));
      expect(cycle.score.kilojoule, equals(2500.0));
      expect(cycle.score.averageHeartRate, equals(72));
      expect(cycle.score.maxHeartRate, equals(165));
    });

    test('fromJson handles null end time', () {
      final json = {
        'id': 3001,
        'user_id': 12345,
        'created_at': '2024-01-15T00:00:00.000Z',
        'updated_at': '2024-01-15T12:00:00.000Z',
        'start': '2024-01-15T00:00:00.000Z',
        'end': null,
        'score': {
          'strain': 8.0,
          'kilojoule': 1500.0,
          'average_heart_rate': 68,
          'max_heart_rate': 140,
        },
      };

      final cycle = WhoopCycle.fromJson(json);

      expect(cycle.end, isNull);
      expect(cycle.timezoneOffset, equals('+00:00'));
    });
  });

  group('WhoopSleep', () {
    test('fromJson parses sleep data correctly', () {
      final json = {
        'id': 4001,
        'user_id': 12345,
        'created_at': '2024-01-15T07:00:00.000Z',
        'updated_at': '2024-01-15T07:00:00.000Z',
        'start': '2024-01-14T23:00:00.000Z',
        'end': '2024-01-15T07:00:00.000Z',
        'timezone_offset': '-05:00',
        'nap': false,
        'score': {
          'stage_summary': {
            'total_in_bed_time_milli': 28800000,
            'total_awake_time_milli': 1800000,
            'total_no_data_time_milli': 0,
            'total_light_sleep_time_milli': 14400000,
            'total_slow_wave_sleep_time_milli': 5400000,
            'total_rem_sleep_time_milli': 5400000,
            'sleep_cycle_count': 5,
            'disturbance_count': 3,
          },
          'sleep_needed': {
            'baseline_milli': 28800000,
            'need_from_sleep_debt_milli': 0,
            'need_from_recent_strain_milli': 1800000,
            'need_from_recent_nap_milli': 0,
          },
          'respiratory_rate': 15.5,
          'sleep_performance_percentage': 92.0,
          'sleep_consistency_percentage': 88.0,
          'sleep_efficiency_percentage': 94.0,
        },
      };

      final sleep = WhoopSleep.fromJson(json);

      expect(sleep.id, equals(4001));
      expect(sleep.nap, isFalse);
      expect(sleep.score.stageSummary.totalInBedTimeMilli, equals(28800000));
      expect(sleep.score.stageSummary.sleepCycleCount, equals(5));
      expect(sleep.score.respiratoryRate, equals(15.5));
      expect(sleep.score.sleepPerformancePercentage, equals(92.0));
    });

    test('fromJson handles nap correctly', () {
      final json = {
        'id': 4002,
        'user_id': 12345,
        'created_at': '2024-01-15T15:00:00.000Z',
        'updated_at': '2024-01-15T15:30:00.000Z',
        'start': '2024-01-15T14:00:00.000Z',
        'end': '2024-01-15T15:00:00.000Z',
        'nap': true,
        'score': {
          'stage_summary': {
            'total_in_bed_time_milli': 3600000,
          },
          'sleep_needed': {},
        },
      };

      final sleep = WhoopSleep.fromJson(json);

      expect(sleep.nap, isTrue);
    });
  });

  group('WhoopWorkout', () {
    test('fromJson parses workout data correctly', () {
      final json = {
        'id': 5001,
        'user_id': 12345,
        'created_at': '2024-01-15T18:00:00.000Z',
        'updated_at': '2024-01-15T19:00:00.000Z',
        'start': '2024-01-15T17:00:00.000Z',
        'end': '2024-01-15T18:00:00.000Z',
        'timezone_offset': '-05:00',
        'sport_id': 1,
        'score': {
          'strain': 15.5,
          'average_heart_rate': 145,
          'max_heart_rate': 180,
          'kilojoule': 800.0,
          'percent_recorded': 98.5,
          'distance_meter': 8500.0,
          'altitude_gain_meter': 150.0,
          'altitude_change_meter': 10.0,
          'zone_duration': {
            'zone_zero_milli': 60000,
            'zone_one_milli': 300000,
            'zone_two_milli': 900000,
            'zone_three_milli': 1200000,
            'zone_four_milli': 600000,
            'zone_five_milli': 300000,
          },
        },
      };

      final workout = WhoopWorkout.fromJson(json);

      expect(workout.id, equals(5001));
      expect(workout.sportId, equals(1));
      expect(workout.score.strain, equals(15.5));
      expect(workout.score.averageHeartRate, equals(145));
      expect(workout.score.maxHeartRate, equals(180));
      expect(workout.score.distanceMeter, equals(8500.0));
      expect(workout.score.altitudeGainMeter, equals(150.0));
      expect(workout.score.zoneDuration, isNotNull);
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 5002,
        'user_id': 12345,
        'created_at': '2024-01-15T18:00:00.000Z',
        'updated_at': '2024-01-15T18:30:00.000Z',
        'start': '2024-01-15T17:30:00.000Z',
        'end': '2024-01-15T18:00:00.000Z',
        'sport_id': 2,
        'score': {
          'strain': 8.0,
          'average_heart_rate': 130,
          'max_heart_rate': 155,
          'kilojoule': 400.0,
          'percent_recorded': 100.0,
        },
      };

      final workout = WhoopWorkout.fromJson(json);

      expect(workout.score.distanceMeter, isNull);
      expect(workout.score.altitudeGainMeter, isNull);
      expect(workout.score.zoneDuration, isNull);
    });
  });

  group('WhoopBodyMeasurement', () {
    test('fromJson parses body measurements correctly', () {
      final json = {
        'height_meter': 1.80,
        'weight_kilogram': 75.5,
        'max_heart_rate': 190.0,
      };

      final measurement = WhoopBodyMeasurement.fromJson(json);

      expect(measurement.heightMeter, equals(1.80));
      expect(measurement.weightKilogram, equals(75.5));
      expect(measurement.maxHeartRate, equals(190.0));
    });
  });

  group('WhoopSleepStageSummary', () {
    test('fromJson parses all stages correctly', () {
      final json = {
        'total_in_bed_time_milli': 28800000,
        'total_awake_time_milli': 1800000,
        'total_no_data_time_milli': 300000,
        'total_light_sleep_time_milli': 14400000,
        'total_slow_wave_sleep_time_milli': 5400000,
        'total_rem_sleep_time_milli': 6900000,
        'sleep_cycle_count': 5,
        'disturbance_count': 2,
      };

      final summary = WhoopSleepStageSummary.fromJson(json);

      expect(summary.totalInBedTimeMilli, equals(28800000));
      expect(summary.totalAwakeTimeMilli, equals(1800000));
      expect(summary.totalNoDataTimeMilli, equals(300000));
      expect(summary.totalLightSleepTimeMilli, equals(14400000));
      expect(summary.totalSlowWaveSleepTimeMilli, equals(5400000));
      expect(summary.totalRemSleepTimeMilli, equals(6900000));
      expect(summary.sleepCycleCount, equals(5));
      expect(summary.disturbanceCount, equals(2));
    });

    test('fromJson handles missing values with defaults', () {
      final json = <String, dynamic>{};

      final summary = WhoopSleepStageSummary.fromJson(json);

      expect(summary.totalInBedTimeMilli, equals(0));
      expect(summary.sleepCycleCount, equals(0));
    });
  });
}
