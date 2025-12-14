import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/health/models/health_data_point.dart';
import 'package:upcoach_mobile/features/health/models/health_integration.dart';
import 'package:upcoach_mobile/features/health/providers/health_provider.dart';

void main() {
  group('Health Sync Integration Tests', () {
    group('HealthState', () {
      test('creates initial HealthState correctly', () {
        const state = HealthState();

        expect(state.isInitialized, isFalse);
        expect(state.isLoading, isFalse);
        expect(state.isSyncing, isFalse);
        expect(state.error, isNull);
        expect(state.isPlatformHealthAvailable, isFalse);
        expect(state.isPlatformHealthConnected, isFalse);
        expect(state.platformHealthName, equals('Health'));
        expect(state.todayStats, isNull);
        expect(state.readinessScore, isNull);
        expect(state.integrations, isEmpty);
        expect(state.lastSyncAt, isNull);
        expect(state.totalDataPoints, equals(0));
      });

      test('copyWith updates fields correctly', () {
        const state = HealthState();

        final updatedState = state.copyWith(
          isInitialized: true,
          isLoading: true,
          isPlatformHealthAvailable: true,
          isPlatformHealthConnected: true,
          platformHealthName: 'Apple Health',
          totalDataPoints: 100,
        );

        expect(updatedState.isInitialized, isTrue);
        expect(updatedState.isLoading, isTrue);
        expect(updatedState.isPlatformHealthAvailable, isTrue);
        expect(updatedState.isPlatformHealthConnected, isTrue);
        expect(updatedState.platformHealthName, equals('Apple Health'));
        expect(updatedState.totalDataPoints, equals(100));
      });

      test('connectedIntegrationsCount returns correct value', () {
        final integrations = [
          const HealthIntegration(
            source: AppHealthDataSource.fitbit,
            displayName: 'Fitbit',
            iconAsset: 'fitbit.png',
            category: IntegrationCategory.premiumWearables,
            supportedDataTypes: [],
            status: IntegrationStatus.connected,
          ),
          const HealthIntegration(
            source: AppHealthDataSource.garmin,
            displayName: 'Garmin',
            iconAsset: 'garmin.png',
            category: IntegrationCategory.premiumWearables,
            supportedDataTypes: [],
            status: IntegrationStatus.notConnected,
          ),
          const HealthIntegration(
            source: AppHealthDataSource.whoop,
            displayName: 'WHOOP',
            iconAsset: 'whoop.png',
            category: IntegrationCategory.premiumWearables,
            supportedDataTypes: [],
            status: IntegrationStatus.connected,
          ),
        ];

        final state = HealthState(integrations: integrations);

        expect(state.connectedIntegrationsCount, equals(2));
      });

      test('hasAnyConnection returns true when platform health connected', () {
        const state = HealthState(isPlatformHealthConnected: true);
        expect(state.hasAnyConnection, isTrue);
      });

      test('hasAnyConnection returns true when integrations connected', () {
        final integrations = [
          const HealthIntegration(
            source: AppHealthDataSource.fitbit,
            displayName: 'Fitbit',
            iconAsset: 'fitbit.png',
            category: IntegrationCategory.premiumWearables,
            supportedDataTypes: [],
            status: IntegrationStatus.connected,
          ),
        ];

        final state = HealthState(integrations: integrations);
        expect(state.hasAnyConnection, isTrue);
      });

      test('hasAnyConnection returns false when nothing connected', () {
        const state = HealthState();
        expect(state.hasAnyConnection, isFalse);
      });
    });

    group('AppHealthDataPoint', () {
      test('creates health data point correctly', () {
        final now = DateTime.now();
        final point = AppHealthDataPoint(
          id: 'point-001',
          type: AppHealthDataType.steps,
          value: 10000,
          unit: AppHealthDataUnit.count,
          timestamp: now,
          dateFrom: now.subtract(const Duration(hours: 1)),
          dateTo: now,
          source: AppHealthDataSource.appleHealth,
        );

        expect(point.id, equals('point-001'));
        expect(point.type, equals(AppHealthDataType.steps));
        expect(point.value, equals(10000));
        expect(point.unit, equals(AppHealthDataUnit.count));
        expect(point.source, equals(AppHealthDataSource.appleHealth));
        expect(point.isManualEntry, isFalse);
      });

      test('creates health data point with optional fields', () {
        final now = DateTime.now();
        final point = AppHealthDataPoint(
          id: 'point-002',
          type: AppHealthDataType.heartRate,
          value: 72,
          unit: AppHealthDataUnit.beatsPerMinute,
          timestamp: now,
          dateFrom: now,
          dateTo: now,
          source: AppHealthDataSource.fitbit,
          sourceDeviceName: 'Charge 5',
          sourceAppName: 'Fitbit',
          metadata: {'deviceId': 'abc123'},
          isManualEntry: false,
          syncedAt: now,
        );

        expect(point.sourceDeviceName, equals('Charge 5'));
        expect(point.sourceAppName, equals('Fitbit'));
        expect(point.metadata, isNotNull);
        expect(point.metadata!['deviceId'], equals('abc123'));
        expect(point.syncedAt, isNotNull);
      });
    });

    group('HealthStats', () {
      test('creates HealthStats with required fields', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
        );

        expect(stats.date, equals(now));
        expect(stats.period, equals(const Duration(days: 1)));
        expect(stats.steps, isNull);
        expect(stats.activeCalories, isNull);
      });

      test('creates HealthStats with activity data', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
          steps: 12500,
          activeCalories: 450.5,
          distanceKm: 8.5,
          flightsClimbed: 10,
          activeMinutes: 45,
          workoutMinutes: 30,
        );

        expect(stats.steps, equals(12500));
        expect(stats.activeCalories, equals(450.5));
        expect(stats.distanceKm, equals(8.5));
        expect(stats.flightsClimbed, equals(10));
        expect(stats.activeMinutes, equals(45));
        expect(stats.workoutMinutes, equals(30));
      });

      test('creates HealthStats with heart data', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
          averageHeartRate: 72.5,
          restingHeartRate: 58.0,
          heartRateVariability: 45.0,
          minHeartRate: 52.0,
          maxHeartRate: 165.0,
        );

        expect(stats.averageHeartRate, equals(72.5));
        expect(stats.restingHeartRate, equals(58.0));
        expect(stats.heartRateVariability, equals(45.0));
        expect(stats.minHeartRate, equals(52.0));
        expect(stats.maxHeartRate, equals(165.0));
      });

      test('creates HealthStats with sleep data', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
          sleepDurationMinutes: 480,
          deepSleepMinutes: 90,
          remSleepMinutes: 120,
          lightSleepMinutes: 240,
          awakeMinutes: 30,
          sleepEfficiency: 0.85,
        );

        expect(stats.sleepDurationMinutes, equals(480));
        expect(stats.deepSleepMinutes, equals(90));
        expect(stats.remSleepMinutes, equals(120));
        expect(stats.lightSleepMinutes, equals(240));
        expect(stats.awakeMinutes, equals(30));
        expect(stats.sleepEfficiency, equals(0.85));
      });

      test('creates HealthStats with wellness scores', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
          recoveryScore: 85,
          readinessScore: 78,
          strainScore: 12,
          stressLevel: 3,
          bodyBattery: 75.0,
        );

        expect(stats.recoveryScore, equals(85));
        expect(stats.readinessScore, equals(78));
        expect(stats.strainScore, equals(12));
        expect(stats.stressLevel, equals(3));
        expect(stats.bodyBattery, equals(75.0));
      });

      test('creates HealthStats with nutrition data', () {
        final now = DateTime.now();
        final stats = HealthStats(
          date: now,
          period: const Duration(days: 1),
          caloriesConsumed: 2200,
          proteinGrams: 120,
          carbsGrams: 250,
          fatGrams: 70,
          waterLiters: 2.5,
        );

        expect(stats.caloriesConsumed, equals(2200));
        expect(stats.proteinGrams, equals(120));
        expect(stats.carbsGrams, equals(250));
        expect(stats.fatGrams, equals(70));
        expect(stats.waterLiters, equals(2.5));
      });
    });

    group('DailyReadinessScore', () {
      test('creates DailyReadinessScore with required fields', () {
        final now = DateTime.now();
        final score = DailyReadinessScore(
          date: now,
          overallScore: 75,
          recommendation: 'Good day for moderate activity',
        );

        expect(score.date, equals(now));
        expect(score.overallScore, equals(75));
        expect(score.recommendation, equals('Good day for moderate activity'));
        expect(score.habitRecommendations, isEmpty);
        expect(score.activityRecommendations, isEmpty);
        expect(score.dataSourcesUsed, isEmpty);
        expect(score.confidenceLevel, equals(0.5));
      });

      test('creates DailyReadinessScore with all component scores', () {
        final now = DateTime.now();
        final score = DailyReadinessScore(
          date: now,
          overallScore: 82,
          recommendation: 'Great day for challenging goals',
          sleepScore: 90,
          recoveryScore: 85,
          activityScore: 78,
          stressScore: 80,
          hrvScore: 75,
        );

        expect(score.sleepScore, equals(90));
        expect(score.recoveryScore, equals(85));
        expect(score.activityScore, equals(78));
        expect(score.stressScore, equals(80));
        expect(score.hrvScore, equals(75));
      });

      test('creates DailyReadinessScore with recommendations', () {
        final now = DateTime.now();
        final score = DailyReadinessScore(
          date: now,
          overallScore: 45,
          recommendation: 'Consider lighter activities today',
          habitRecommendations: [
            'Prioritize essential habits only',
            'Earlier bedtime tonight recommended',
          ],
          activityRecommendations: [
            'Rest day or light stretching',
            'Focus on recovery',
          ],
        );

        expect(score.habitRecommendations, hasLength(2));
        expect(
          score.habitRecommendations,
          contains('Prioritize essential habits only'),
        );
        expect(score.activityRecommendations, hasLength(2));
      });

      test('creates DailyReadinessScore with data sources', () {
        final now = DateTime.now();
        final score = DailyReadinessScore(
          date: now,
          overallScore: 70,
          recommendation: 'Moderate activity recommended',
          dataSourcesUsed: [
            AppHealthDataSource.appleHealth,
            AppHealthDataSource.whoop,
            AppHealthDataSource.oura,
          ],
          confidenceLevel: 0.85,
        );

        expect(score.dataSourcesUsed, hasLength(3));
        expect(
          score.dataSourcesUsed,
          contains(AppHealthDataSource.appleHealth),
        );
        expect(score.dataSourcesUsed, contains(AppHealthDataSource.whoop));
        expect(score.dataSourcesUsed, contains(AppHealthDataSource.oura));
        expect(score.confidenceLevel, equals(0.85));
      });
    });

    group('AppHealthDataType', () {
      test('has all activity types', () {
        expect(
          AppHealthDataType.values,
          containsAll([
            AppHealthDataType.steps,
            AppHealthDataType.activeEnergyBurned,
            AppHealthDataType.distanceWalkingRunning,
            AppHealthDataType.flightsClimbed,
            AppHealthDataType.moveMinutes,
            AppHealthDataType.workoutMinutes,
          ]),
        );
      });

      test('has all heart types', () {
        expect(
          AppHealthDataType.values,
          containsAll([
            AppHealthDataType.heartRate,
            AppHealthDataType.restingHeartRate,
            AppHealthDataType.heartRateVariability,
          ]),
        );
      });

      test('has all sleep types', () {
        expect(
          AppHealthDataType.values,
          containsAll([
            AppHealthDataType.sleepAsleep,
            AppHealthDataType.sleepAwake,
            AppHealthDataType.sleepDeep,
            AppHealthDataType.sleepREM,
            AppHealthDataType.sleepLight,
            AppHealthDataType.sleepDuration,
          ]),
        );
      });

      test('has all body types', () {
        expect(
          AppHealthDataType.values,
          containsAll([
            AppHealthDataType.weight,
            AppHealthDataType.bodyMassIndex,
            AppHealthDataType.bodyFatPercentage,
            AppHealthDataType.leanBodyMass,
            AppHealthDataType.height,
          ]),
        );
      });

      test('has all fitness metric types', () {
        expect(
          AppHealthDataType.values,
          containsAll([
            AppHealthDataType.vo2Max,
            AppHealthDataType.recoveryScore,
            AppHealthDataType.strainScore,
            AppHealthDataType.readinessScore,
            AppHealthDataType.trainingLoad,
            AppHealthDataType.bodyBattery,
            AppHealthDataType.stressLevel,
          ]),
        );
      });
    });

    group('AppHealthDataUnit', () {
      test('has all unit types', () {
        expect(
          AppHealthDataUnit.values,
          containsAll([
            AppHealthDataUnit.count,
            AppHealthDataUnit.kilocalorie,
            AppHealthDataUnit.meter,
            AppHealthDataUnit.kilogram,
            AppHealthDataUnit.percent,
            AppHealthDataUnit.beatsPerMinute,
            AppHealthDataUnit.millisecond,
            AppHealthDataUnit.minute,
            AppHealthDataUnit.hour,
            AppHealthDataUnit.liter,
            AppHealthDataUnit.gram,
            AppHealthDataUnit.milligramPerDeciliter,
            AppHealthDataUnit.mmHg,
            AppHealthDataUnit.celsius,
            AppHealthDataUnit.noUnit,
          ]),
        );
      });
    });

    group('AppHealthDataSource', () {
      test('has all platform health sources', () {
        expect(
          AppHealthDataSource.values,
          containsAll([
            AppHealthDataSource.appleHealth,
            AppHealthDataSource.googleHealthConnect,
            AppHealthDataSource.samsungHealth,
            AppHealthDataSource.huaweiHealth,
          ]),
        );
      });

      test('has all premium wearable sources', () {
        expect(
          AppHealthDataSource.values,
          containsAll([
            AppHealthDataSource.fitbit,
            AppHealthDataSource.garmin,
            AppHealthDataSource.whoop,
            AppHealthDataSource.oura,
            AppHealthDataSource.polar,
            AppHealthDataSource.suunto,
            AppHealthDataSource.coros,
            AppHealthDataSource.withings,
            AppHealthDataSource.amazfit,
          ]),
        );
      });

      test('has all fitness app sources', () {
        expect(
          AppHealthDataSource.values,
          containsAll([
            AppHealthDataSource.strava,
            AppHealthDataSource.peloton,
            AppHealthDataSource.zwift,
            AppHealthDataSource.trainingPeaks,
            AppHealthDataSource.technogym,
          ]),
        );
      });
    });

    group('HealthIntegration', () {
      test('creates HealthIntegration correctly', () {
        const integration = HealthIntegration(
          source: AppHealthDataSource.fitbit,
          displayName: 'Fitbit',
          iconAsset: 'assets/icons/fitbit.png',
          category: IntegrationCategory.premiumWearables,
          supportedDataTypes: [
            AppHealthDataType.steps,
            AppHealthDataType.heartRate,
            AppHealthDataType.sleepDuration,
          ],
          status: IntegrationStatus.notConnected,
        );

        expect(integration.source, equals(AppHealthDataSource.fitbit));
        expect(integration.displayName, equals('Fitbit'));
        expect(integration.status, equals(IntegrationStatus.notConnected));
        expect(integration.supportedDataTypes, hasLength(3));
      });

      test('HealthIntegration copyWith updates status', () {
        const integration = HealthIntegration(
          source: AppHealthDataSource.whoop,
          displayName: 'WHOOP',
          iconAsset: 'assets/icons/whoop.png',
          category: IntegrationCategory.premiumWearables,
          supportedDataTypes: [AppHealthDataType.recoveryScore],
          status: IntegrationStatus.notConnected,
        );

        final connected = integration.copyWith(
          status: IntegrationStatus.connected,
          connectedAt: DateTime.now(),
          lastSyncAt: DateTime.now(),
        );

        expect(connected.status, equals(IntegrationStatus.connected));
        expect(connected.connectedAt, isNotNull);
        expect(connected.lastSyncAt, isNotNull);
      });
    });

    group('IntegrationStatus', () {
      test('has all status values', () {
        expect(
          IntegrationStatus.values,
          containsAll([
            IntegrationStatus.notConnected,
            IntegrationStatus.connecting,
            IntegrationStatus.connected,
            IntegrationStatus.error,
            IntegrationStatus.syncing,
          ]),
        );
      });
    });

    group('HealthPrivacySettings', () {
      test('creates default HealthPrivacySettings', () {
        const settings = HealthPrivacySettings();

        expect(settings.onDeviceOnly, isTrue);
        expect(settings.backgroundSyncEnabled, isTrue);
        expect(settings.syncIntervalMinutes, equals(15));
        expect(settings.wifiOnlySync, isFalse);
        expect(settings.dataRetentionDays, equals(90));
        expect(settings.showHealthNotifications, isTrue);
        expect(settings.useForAiCoaching, isTrue);
      });

      test('HealthPrivacySettings copyWith works', () {
        const settings = HealthPrivacySettings();

        final updated = settings.copyWith(
          onDeviceOnly: false,
          wifiOnlySync: true,
          dataRetentionDays: 30,
        );

        expect(updated.onDeviceOnly, isFalse);
        expect(updated.wifiOnlySync, isTrue);
        expect(updated.dataRetentionDays, equals(30));
        // Unchanged values
        expect(updated.backgroundSyncEnabled, isTrue);
        expect(updated.showHealthNotifications, isTrue);
      });
    });

    group('Multi-Source Data Aggregation', () {
      test('simulates aggregating data from multiple sources', () {
        final now = DateTime.now();

        // Simulate data from different sources
        final appleHealthSteps = AppHealthDataPoint(
          id: 'apple-steps-001',
          type: AppHealthDataType.steps,
          value: 8000,
          unit: AppHealthDataUnit.count,
          timestamp: now,
          dateFrom: now.subtract(const Duration(hours: 12)),
          dateTo: now,
          source: AppHealthDataSource.appleHealth,
        );

        final fitbitSteps = AppHealthDataPoint(
          id: 'fitbit-steps-001',
          type: AppHealthDataType.steps,
          value: 8500,
          unit: AppHealthDataUnit.count,
          timestamp: now,
          dateFrom: now.subtract(const Duration(hours: 12)),
          dateTo: now,
          source: AppHealthDataSource.fitbit,
        );

        final whoopRecovery = AppHealthDataPoint(
          id: 'whoop-recovery-001',
          type: AppHealthDataType.recoveryScore,
          value: 78,
          unit: AppHealthDataUnit.percent,
          timestamp: now,
          dateFrom: now.subtract(const Duration(hours: 8)),
          dateTo: now,
          source: AppHealthDataSource.whoop,
        );

        // Verify data is captured from different sources
        final allPoints = [appleHealthSteps, fitbitSteps, whoopRecovery];

        expect(allPoints.length, equals(3));

        // Count unique sources
        final uniqueSources = allPoints.map((p) => p.source).toSet();
        expect(uniqueSources.length, equals(3));
        expect(
          uniqueSources,
          containsAll([
            AppHealthDataSource.appleHealth,
            AppHealthDataSource.fitbit,
            AppHealthDataSource.whoop,
          ]),
        );

        // Verify steps data from different sources
        final stepsData = allPoints
            .where((p) => p.type == AppHealthDataType.steps)
            .toList();
        expect(stepsData.length, equals(2));

        // In real aggregation, we'd pick highest confidence or most recent
        // Here we verify we can access both values
        expect(stepsData[0].value, equals(8000)); // Apple Health
        expect(stepsData[1].value, equals(8500)); // Fitbit
      });

      test('simulates prioritizing data sources', () {
        // Priority order: wearable-specific > platform health > manual
        final sources = [
          AppHealthDataSource.whoop,
          AppHealthDataSource.appleHealth,
          AppHealthDataSource.manual,
        ];

        // WHOOP has highest priority for recovery data
        int priorityIndex(AppHealthDataSource source) {
          switch (source) {
            case AppHealthDataSource.whoop:
            case AppHealthDataSource.oura:
            case AppHealthDataSource.garmin:
            case AppHealthDataSource.fitbit:
              return 0; // Highest priority
            case AppHealthDataSource.appleHealth:
            case AppHealthDataSource.googleHealthConnect:
              return 1;
            case AppHealthDataSource.manual:
              return 2;
            default:
              return 3;
          }
        }

        // Sort by priority
        sources.sort((a, b) => priorityIndex(a).compareTo(priorityIndex(b)));

        expect(sources[0], equals(AppHealthDataSource.whoop));
        expect(sources[1], equals(AppHealthDataSource.appleHealth));
        expect(sources[2], equals(AppHealthDataSource.manual));
      });
    });

    group('Readiness Score Calculation', () {
      test('simulates high readiness score calculation', () {
        final stats = HealthStats(
          date: DateTime.now(),
          period: const Duration(days: 1),
          sleepDurationMinutes: 480, // 8 hours
          steps: 12000,
          recoveryScore: 85,
          heartRateVariability: 50,
        );

        // Simulate sleep score calculation
        int sleepScore;
        final sleepHours = stats.sleepDurationMinutes! / 60;
        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepScore = 90;
        } else if (sleepHours >= 6) {
          sleepScore = 70;
        } else {
          sleepScore = 40;
        }
        expect(sleepScore, equals(90));

        // Simulate activity score calculation
        int activityScore;
        if (stats.steps! >= 10000) {
          activityScore = 100;
        } else if (stats.steps! >= 7500) {
          activityScore = 80;
        } else if (stats.steps! >= 5000) {
          activityScore = 60;
        } else {
          activityScore = 40;
        }
        expect(activityScore, equals(100));

        // Calculate overall score
        final scores = [sleepScore, activityScore, stats.recoveryScore!];
        final overallScore =
            (scores.reduce((a, b) => a + b) / scores.length).round();

        expect(overallScore, greaterThanOrEqualTo(80));
      });

      test('simulates low readiness score calculation', () {
        final stats = HealthStats(
          date: DateTime.now(),
          period: const Duration(days: 1),
          sleepDurationMinutes: 300, // 5 hours
          steps: 3000,
          recoveryScore: 35,
        );

        // Simulate sleep score calculation
        int sleepScore;
        final sleepHours = stats.sleepDurationMinutes! / 60;
        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepScore = 90;
        } else if (sleepHours >= 6) {
          sleepScore = 70;
        } else {
          sleepScore = 40;
        }
        expect(sleepScore, equals(40));

        // Simulate activity score calculation
        int activityScore;
        if (stats.steps! >= 10000) {
          activityScore = 100;
        } else if (stats.steps! >= 7500) {
          activityScore = 80;
        } else if (stats.steps! >= 5000) {
          activityScore = 60;
        } else {
          activityScore = 40;
        }
        expect(activityScore, equals(40));

        // Calculate overall score
        final scores = [sleepScore, activityScore, stats.recoveryScore!];
        final overallScore =
            (scores.reduce((a, b) => a + b) / scores.length).round();

        expect(overallScore, lessThan(50));
      });

      test('generates appropriate recommendations based on score', () {
        String generateRecommendation(int score) {
          if (score >= 80) {
            return "Great day for challenging goals!";
          } else if (score >= 60) {
            return "Good for moderate activity";
          } else {
            return "Consider lighter activities today";
          }
        }

        expect(
          generateRecommendation(85),
          equals("Great day for challenging goals!"),
        );
        expect(
          generateRecommendation(70),
          equals("Good for moderate activity"),
        );
        expect(
          generateRecommendation(45),
          equals("Consider lighter activities today"),
        );
      });
    });

    group('Data Retention and Privacy', () {
      test('simulates data cleanup based on retention period', () {
        final now = DateTime.now();

        // Create data points with different timestamps
        final recentPoint = AppHealthDataPoint(
          id: 'recent-001',
          type: AppHealthDataType.steps,
          value: 10000,
          unit: AppHealthDataUnit.count,
          timestamp: now.subtract(const Duration(days: 30)),
          dateFrom: now.subtract(const Duration(days: 30)),
          dateTo: now.subtract(const Duration(days: 30)),
          source: AppHealthDataSource.appleHealth,
        );

        final oldPoint = AppHealthDataPoint(
          id: 'old-001',
          type: AppHealthDataType.steps,
          value: 8000,
          unit: AppHealthDataUnit.count,
          timestamp: now.subtract(const Duration(days: 100)),
          dateFrom: now.subtract(const Duration(days: 100)),
          dateTo: now.subtract(const Duration(days: 100)),
          source: AppHealthDataSource.appleHealth,
        );

        // Simulate retention filter (90 days default)
        const retentionDays = 90;
        final cutoffDate = now.subtract(const Duration(days: retentionDays));

        final allPoints = [recentPoint, oldPoint];
        final retainedPoints = allPoints
            .where((p) => p.timestamp.isAfter(cutoffDate))
            .toList();

        expect(retainedPoints.length, equals(1));
        expect(retainedPoints[0].id, equals('recent-001'));
      });

      test('privacy settings control data sharing', () {
        const settings = HealthPrivacySettings(
          onDeviceOnly: true,
          useForAiCoaching: true,
          allowedDataTypes: [
            AppHealthDataType.steps,
            AppHealthDataType.sleepAsleep,
            AppHealthDataType.sleepDeep,
          ],
        );

        // Verify allowed types are set
        expect(settings.allowedDataTypes, hasLength(3));
        expect(
          settings.allowedDataTypes,
          contains(AppHealthDataType.steps),
        );
        expect(
          settings.allowedDataTypes,
          contains(AppHealthDataType.sleepAsleep),
        );
        expect(settings.onDeviceOnly, isTrue);
        expect(settings.useForAiCoaching, isTrue);
      });
    });

    group('Sync Flow Simulation', () {
      test('simulates successful sync flow', () async {
        // Step 1: Check connection status
        var state = const HealthState(isPlatformHealthConnected: true);
        expect(state.isPlatformHealthConnected, isTrue);

        // Step 2: Start syncing
        state = state.copyWith(isSyncing: true, error: null);
        expect(state.isSyncing, isTrue);
        expect(state.error, isNull);

        // Step 3: Complete sync with data
        state = state.copyWith(
          isSyncing: false,
          totalDataPoints: 150,
          lastSyncAt: DateTime.now(),
          todayStats: HealthStats(
            date: DateTime.now(),
            period: const Duration(days: 1),
            steps: 10500,
            averageHeartRate: 72,
            sleepDurationMinutes: 450,
          ),
        );

        expect(state.isSyncing, isFalse);
        expect(state.totalDataPoints, equals(150));
        expect(state.lastSyncAt, isNotNull);
        expect(state.todayStats, isNotNull);
        expect(state.todayStats!.steps, equals(10500));
      });

      test('simulates sync flow with error', () {
        // Step 1: Start syncing
        var state = const HealthState(
          isPlatformHealthConnected: true,
          isSyncing: true,
        );

        // Step 2: Error occurs
        state = state.copyWith(
          isSyncing: false,
          error: 'Network connection lost',
        );

        expect(state.isSyncing, isFalse);
        expect(state.error, equals('Network connection lost'));
      });
    });

    group('HealthIntegrations predefined list', () {
      test('has platform health integrations', () {
        expect(HealthIntegrations.platformHealth, isNotEmpty);
        expect(
          HealthIntegrations.platformHealth.any(
            (i) => i.source == AppHealthDataSource.appleHealth,
          ),
          isTrue,
        );
      });

      test('has premium wearable integrations', () {
        expect(HealthIntegrations.premiumWearables, isNotEmpty);
        expect(
          HealthIntegrations.premiumWearables.any(
            (i) => i.source == AppHealthDataSource.fitbit,
          ),
          isTrue,
        );
        expect(
          HealthIntegrations.premiumWearables.any(
            (i) => i.source == AppHealthDataSource.whoop,
          ),
          isTrue,
        );
      });

      test('bySource returns correct integration', () {
        final fitbit = HealthIntegrations.bySource(AppHealthDataSource.fitbit);
        expect(fitbit, isNotNull);
        expect(fitbit!.displayName, equals('Fitbit'));
      });

      test('bySource returns null for unknown source', () {
        final unknown = HealthIntegrations.bySource(AppHealthDataSource.unknown);
        expect(unknown, isNull);
      });
    });
  });
}
