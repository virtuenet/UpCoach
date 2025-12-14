import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/health/services/fitbit_service.dart';

void main() {
  group('FitbitActivitySummary', () {
    test('fromJson parses activity summary correctly', () {
      final json = {
        'summary': {
          'steps': 10000,
          'caloriesOut': 2500,
          'activityCalories': 800,
          'sedentaryMinutes': 600,
          'lightlyActiveMinutes': 120,
          'fairlyActiveMinutes': 30,
          'veryActiveMinutes': 45,
          'floors': 10,
          'distances': [
            {'activity': 'total', 'distance': 8.5},
            {'activity': 'tracker', 'distance': 8.5},
          ],
        },
        'activities': [],
      };

      final summary = FitbitActivitySummary.fromJson(json);

      expect(summary.summary.steps, equals(10000));
      expect(summary.summary.caloriesOut, equals(2500));
      expect(summary.summary.activityCalories, equals(800));
      expect(summary.summary.sedentaryMinutes, equals(600));
      expect(summary.summary.lightlyActiveMinutes, equals(120));
      expect(summary.summary.fairlyActiveMinutes, equals(30));
      expect(summary.summary.veryActiveMinutes, equals(45));
      expect(summary.summary.floors, equals(10));
      expect(summary.summary.distances.length, equals(2));
    });

    test('fromJson handles missing summary gracefully', () {
      final json = <String, dynamic>{};

      final summary = FitbitActivitySummary.fromJson(json);

      expect(summary.summary.steps, equals(0));
      expect(summary.summary.caloriesOut, equals(0));
      expect(summary.activities, isEmpty);
    });

    test('fromJson handles null values with defaults', () {
      final json = {
        'summary': {
          'steps': null,
          'caloriesOut': null,
        },
      };

      final summary = FitbitActivitySummary.fromJson(json);

      expect(summary.summary.steps, equals(0));
      expect(summary.summary.caloriesOut, equals(0));
    });
  });

  group('FitbitHeartRateData', () {
    test('fromJson parses heart rate data correctly', () {
      final json = {
        'activities-heart': [
          {
            'dateTime': '2024-01-15',
            'value': {
              'restingHeartRate': 62,
              'heartRateZones': [
                {'name': 'Out of Range', 'min': 30, 'max': 91, 'minutes': 1200, 'caloriesOut': 1500},
                {'name': 'Fat Burn', 'min': 91, 'max': 127, 'minutes': 60, 'caloriesOut': 300},
                {'name': 'Cardio', 'min': 127, 'max': 154, 'minutes': 30, 'caloriesOut': 250},
                {'name': 'Peak', 'min': 154, 'max': 220, 'minutes': 10, 'caloriesOut': 100},
              ],
            },
          },
        ],
      };

      final heartRate = FitbitHeartRateData.fromJson(json);

      expect(heartRate.restingHeartRate, equals(62));
      expect(heartRate.heartRateZones.length, equals(4));
      expect(heartRate.heartRateZones[0].name, equals('Out of Range'));
      expect(heartRate.heartRateZones[0].min, equals(30));
      expect(heartRate.heartRateZones[0].max, equals(91));
      expect(heartRate.heartRateZones[0].minutes, equals(1200));
    });

    test('fromJson handles empty activities-heart array', () {
      final json = {
        'activities-heart': [],
      };

      final heartRate = FitbitHeartRateData.fromJson(json);

      expect(heartRate.restingHeartRate, isNull);
      expect(heartRate.heartRateZones, isEmpty);
    });

    test('fromJson handles null activities-heart', () {
      final json = <String, dynamic>{};

      final heartRate = FitbitHeartRateData.fromJson(json);

      expect(heartRate.restingHeartRate, isNull);
      expect(heartRate.heartRateZones, isEmpty);
    });
  });

  group('FitbitSleepData', () {
    test('fromJson parses sleep data correctly', () {
      final json = {
        'sleep': [
          {
            'logId': '12345678',
            'startTime': '2024-01-15T23:00:00.000',
            'endTime': '2024-01-16T07:00:00.000',
            'duration': 28800000,
            'efficiency': 92,
            'isMainSleep': true,
          },
        ],
        'summary': {
          'totalMinutesAsleep': 420,
          'totalSleepRecords': 1,
          'totalTimeInBed': 480,
          'stages': {
            'deep': 80,
            'light': 220,
            'rem': 100,
            'wake': 20,
          },
        },
      };

      final sleep = FitbitSleepData.fromJson(json);

      expect(sleep.sleep.length, equals(1));
      expect(sleep.sleep[0].logId, equals('12345678'));
      expect(sleep.sleep[0].efficiency, equals(92));
      expect(sleep.sleep[0].isMainSleep, isTrue);

      expect(sleep.summary, isNotNull);
      expect(sleep.summary!.totalMinutesAsleep, equals(420));
      expect(sleep.summary!.totalSleepRecords, equals(1));
      expect(sleep.summary!.totalTimeInBed, equals(480));

      expect(sleep.summary!.stages, isNotNull);
      expect(sleep.summary!.stages!.deep, equals(80));
      expect(sleep.summary!.stages!.light, equals(220));
      expect(sleep.summary!.stages!.rem, equals(100));
      expect(sleep.summary!.stages!.wake, equals(20));
    });

    test('fromJson handles missing summary', () {
      final json = {
        'sleep': [],
      };

      final sleep = FitbitSleepData.fromJson(json);

      expect(sleep.sleep, isEmpty);
      expect(sleep.summary, isNull);
    });

    test('fromJson handles missing stages', () {
      final json = {
        'summary': {
          'totalMinutesAsleep': 420,
        },
      };

      final sleep = FitbitSleepData.fromJson(json);

      expect(sleep.summary!.totalMinutesAsleep, equals(420));
      expect(sleep.summary!.stages, isNull);
    });
  });

  group('FitbitWeightEntry', () {
    test('fromJson parses weight entry correctly', () {
      final json = {
        'logId': '987654321',
        'weight': 75.5,
        'bmi': 24.2,
        'fat': 18.5,
        'date': '2024-01-15',
        'time': '08:30:00',
      };

      final weight = FitbitWeightEntry.fromJson(json);

      expect(weight.logId, equals('987654321'));
      expect(weight.weight, equals(75.5));
      expect(weight.bmi, equals(24.2));
      expect(weight.fat, equals(18.5));
      expect(weight.date, equals('2024-01-15'));
      expect(weight.time, equals('08:30:00'));
      expect(weight.dateTime.year, equals(2024));
      expect(weight.dateTime.month, equals(1));
      expect(weight.dateTime.day, equals(15));
      expect(weight.dateTime.hour, equals(8));
      expect(weight.dateTime.minute, equals(30));
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'logId': '987654321',
        'weight': 75.5,
        'date': '2024-01-15',
        'time': '08:30:00',
      };

      final weight = FitbitWeightEntry.fromJson(json);

      expect(weight.weight, equals(75.5));
      expect(weight.bmi, isNull);
      expect(weight.fat, isNull);
    });
  });

  group('FitbitSpO2Data', () {
    test('fromJson parses SpO2 data correctly', () {
      final json = {
        'dateTime': '2024-01-15T00:00:00.000',
        'value': {
          'avg': 97.5,
          'min': 95.0,
          'max': 99.0,
        },
      };

      final spo2 = FitbitSpO2Data.fromJson(json);

      expect(spo2.dateTime.year, equals(2024));
      expect(spo2.value, equals(97.5));
      expect(spo2.min, equals(95.0));
      expect(spo2.max, equals(99.0));
    });

    test('fromJson handles missing value data', () {
      final json = {
        'dateTime': '2024-01-15T00:00:00.000',
      };

      final spo2 = FitbitSpO2Data.fromJson(json);

      expect(spo2.value, isNull);
      expect(spo2.min, isNull);
      expect(spo2.max, isNull);
    });
  });

  group('FitbitService Data Conversion', () {
    late FitbitService service;

    setUp(() {
      service = FitbitService();
    });

    test('convertToHealthDataPoints converts activity data', () {
      final activity = FitbitActivitySummary(
        summary: FitbitActivitySummaryData(
          steps: 10000,
          caloriesOut: 2500,
          activityCalories: 800,
          distances: [
            {'activity': 'total', 'distance': 8.5},
          ],
        ),
      );

      final dataPoints = service.convertToHealthDataPoints(
        activity: activity,
        date: DateTime(2024, 1, 15),
      );

      expect(dataPoints.length, equals(3)); // steps, calories, distance
      expect(dataPoints[0].value, equals(10000.0)); // steps
      expect(dataPoints[1].value, equals(800.0)); // activity calories
      expect(dataPoints[2].value, equals(8500.0)); // distance in meters
    });

    test('convertToHealthDataPoints converts heart rate data', () {
      final heartRate = FitbitHeartRateData(
        restingHeartRate: 62,
        heartRateZones: [],
      );

      final dataPoints = service.convertToHealthDataPoints(
        heartRate: heartRate,
        date: DateTime(2024, 1, 15),
      );

      expect(dataPoints.length, equals(1));
      expect(dataPoints[0].value, equals(62.0));
    });

    test('convertToHealthDataPoints converts sleep data with stages', () {
      final sleep = FitbitSleepData(
        summary: FitbitSleepSummary(
          totalMinutesAsleep: 420,
          stages: FitbitSleepStages(
            deep: 80,
            light: 220,
            rem: 100,
            wake: 20,
          ),
        ),
      );

      final dataPoints = service.convertToHealthDataPoints(
        sleep: sleep,
        date: DateTime(2024, 1, 15),
      );

      // Should have: total sleep, deep, rem, light
      expect(dataPoints.length, equals(4));
    });

    test('convertToHealthDataPoints converts weight data', () {
      final weights = [
        FitbitWeightEntry(
          logId: '123',
          weight: 75.5,
          bmi: 24.2,
          date: '2024-01-15',
          time: '08:00:00',
          dateTime: DateTime(2024, 1, 15, 8, 0),
        ),
      ];

      final dataPoints = service.convertToHealthDataPoints(
        weights: weights,
        date: DateTime(2024, 1, 15),
      );

      expect(dataPoints.length, equals(2)); // weight and bmi
      expect(dataPoints[0].value, equals(75.5));
      expect(dataPoints[1].value, equals(24.2));
    });

    test('convertToHealthDataPoints handles empty data', () {
      final dataPoints = service.convertToHealthDataPoints(
        date: DateTime(2024, 1, 15),
      );

      expect(dataPoints, isEmpty);
    });

    test('convertToHealthDataPoints skips zero values', () {
      final activity = FitbitActivitySummary(
        summary: FitbitActivitySummaryData(
          steps: 0,
          caloriesOut: 0,
          activityCalories: 0,
        ),
      );

      final dataPoints = service.convertToHealthDataPoints(
        activity: activity,
        date: DateTime(2024, 1, 15),
      );

      expect(dataPoints, isEmpty);
    });
  });

  group('FitbitHeartRateZone', () {
    test('fromJson parses zone correctly', () {
      final json = {
        'name': 'Fat Burn',
        'min': 91,
        'max': 127,
        'minutes': 45,
        'caloriesOut': 200,
      };

      final zone = FitbitHeartRateZone.fromJson(json);

      expect(zone.name, equals('Fat Burn'));
      expect(zone.min, equals(91));
      expect(zone.max, equals(127));
      expect(zone.minutes, equals(45));
      expect(zone.caloriesOut, equals(200));
    });

    test('fromJson handles missing values with defaults', () {
      final json = {
        'name': 'Test Zone',
        'min': 50,
        'max': 100,
      };

      final zone = FitbitHeartRateZone.fromJson(json);

      expect(zone.minutes, equals(0));
      expect(zone.caloriesOut, equals(0));
    });
  });
}
