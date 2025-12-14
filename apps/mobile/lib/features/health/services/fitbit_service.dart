import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'dart:convert';

import '../../../core/config/app_config.dart';
import '../models/health_data_point.dart';
import '../models/health_integration.dart';

/// Provider for FitbitService
final fitbitServiceProvider = Provider<FitbitService>((ref) {
  return FitbitService();
});

/// Service for integrating with Fitbit Web API
///
/// Fitbit API provides access to:
/// - Activity data (steps, distance, calories, floors, active minutes)
/// - Heart rate data (resting HR, heart rate zones)
/// - Sleep data (stages, duration, efficiency)
/// - Body data (weight, BMI, body fat)
/// - SpO2 data
class FitbitService {
  static const String _baseUrl = 'https://api.fitbit.com';
  static const String _authUrl = 'https://www.fitbit.com/oauth2/authorize';
  static const String _tokenUrl = 'https://api.fitbit.com/oauth2/token';
  static const String _redirectUri = 'upcoach://fitbit/callback';

  /// Get client ID from app config (set via --dart-define)
  String get _clientId => appConfig.fitbitClientId;

  /// Get client secret from app config (set via --dart-define)
  String get _clientSecret => appConfig.fitbitClientSecret;

  /// Check if Fitbit credentials are configured
  bool get isConfigured =>
      _clientId.isNotEmpty && _clientSecret.isNotEmpty;

  static const List<String> _scopes = [
    'activity',
    'heartrate',
    'sleep',
    'weight',
    'profile',
    'oxygen_saturation',
  ];

  final Dio _dio = Dio();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Storage keys
  static const String _accessTokenKey = 'fitbit_access_token';
  static const String _refreshTokenKey = 'fitbit_refresh_token';
  static const String _expiresAtKey = 'fitbit_expires_at';
  static const String _userIdKey = 'fitbit_user_id';

  OAuthToken? _cachedToken;

  FitbitService() {
    _dio.options.baseUrl = _baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try to refresh token
          final refreshed = await _refreshAccessToken();
          if (refreshed) {
            // Retry request
            final retryResponse = await _dio.fetch(error.requestOptions);
            handler.resolve(retryResponse);
            return;
          }
        }
        handler.next(error);
      },
    ));
  }

  /// Check if user is connected to Fitbit
  Future<bool> isConnected() async {
    final token = await _secureStorage.read(key: _accessTokenKey);
    return token != null;
  }

  /// Start OAuth2 authorization flow with PKCE
  Future<bool> connect() async {
    if (!isConfigured) {
      debugPrint('Fitbit credentials not configured. '
          'Set FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET via --dart-define');
      return false;
    }

    try {
      final authorizationUrl = Uri.parse(_authUrl).replace(
        queryParameters: {
          'response_type': 'code',
          'client_id': _clientId,
          'redirect_uri': _redirectUri,
          'scope': _scopes.join(' '),
          'state': DateTime.now().millisecondsSinceEpoch.toString(),
          'prompt': 'login consent',
        },
      );

      // Launch OAuth flow
      final result = await FlutterWebAuth2.authenticate(
        url: authorizationUrl.toString(),
        callbackUrlScheme: 'upcoach',
      );

      // Parse authorization code from callback
      final uri = Uri.parse(result);
      final code = uri.queryParameters['code'];

      if (code == null) {
        throw Exception('No authorization code received');
      }

      // Exchange code for tokens
      await _exchangeCodeForTokens(code);

      return true;
    } catch (e) {
      debugPrint('Error connecting to Fitbit: $e');
      return false;
    }
  }

  /// Exchange authorization code for access token
  Future<void> _exchangeCodeForTokens(String code) async {
    try {
      // Fitbit requires Basic Auth header for token exchange
      final credentials = base64Encode(utf8.encode('$_clientId:$_clientSecret'));

      final response = await Dio().post(
        _tokenUrl,
        data: {
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': _redirectUri,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: {
            'Authorization': 'Basic $credentials',
          },
        ),
      );

      final data = response.data;
      await _saveTokens(
        accessToken: data['access_token'],
        refreshToken: data['refresh_token'],
        expiresIn: data['expires_in'],
        userId: data['user_id'],
      );
    } catch (e) {
      debugPrint('Error exchanging code for tokens: $e');
      rethrow;
    }
  }

  /// Refresh access token
  Future<bool> _refreshAccessToken() async {
    try {
      final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      if (refreshToken == null) return false;

      final credentials = base64Encode(utf8.encode('$_clientId:$_clientSecret'));

      final response = await Dio().post(
        _tokenUrl,
        data: {
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: {
            'Authorization': 'Basic $credentials',
          },
        ),
      );

      final data = response.data;
      await _saveTokens(
        accessToken: data['access_token'],
        refreshToken: data['refresh_token'] ?? refreshToken,
        expiresIn: data['expires_in'],
      );

      return true;
    } catch (e) {
      debugPrint('Error refreshing token: $e');
      await disconnect();
      return false;
    }
  }

  /// Save OAuth tokens
  Future<void> _saveTokens({
    required String accessToken,
    required String refreshToken,
    required int expiresIn,
    String? userId,
  }) async {
    final expiresAt = DateTime.now().add(Duration(seconds: expiresIn));

    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    await _secureStorage.write(
      key: _expiresAtKey,
      value: expiresAt.toIso8601String(),
    );
    if (userId != null) {
      await _secureStorage.write(key: _userIdKey, value: userId);
    }

    _cachedToken = OAuthToken(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
    );
  }

  /// Get current access token
  Future<String?> _getAccessToken() async {
    // Use cached token if available and not expired
    if (_cachedToken != null) {
      if (DateTime.now()
          .isBefore(_cachedToken!.expiresAt.subtract(const Duration(minutes: 5)))) {
        return _cachedToken!.accessToken;
      }
    }

    // Check if token is expired
    final expiresAtStr = await _secureStorage.read(key: _expiresAtKey);
    if (expiresAtStr != null) {
      final expiresAt = DateTime.parse(expiresAtStr);
      if (DateTime.now().isAfter(expiresAt.subtract(const Duration(minutes: 5)))) {
        // Token expired or about to expire, refresh it
        await _refreshAccessToken();
      }
    }

    return _secureStorage.read(key: _accessTokenKey);
  }

  /// Disconnect from Fitbit
  Future<void> disconnect() async {
    // Optionally revoke token on Fitbit's server
    try {
      final token = await _secureStorage.read(key: _accessTokenKey);
      if (token != null) {
        final credentials = base64Encode(utf8.encode('$_clientId:$_clientSecret'));
        await Dio().post(
          'https://api.fitbit.com/oauth2/revoke',
          data: {'token': token},
          options: Options(
            contentType: Headers.formUrlEncodedContentType,
            headers: {'Authorization': 'Basic $credentials'},
          ),
        );
      }
    } catch (e) {
      debugPrint('Error revoking Fitbit token: $e');
    }

    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _expiresAtKey);
    await _secureStorage.delete(key: _userIdKey);
    _cachedToken = null;
  }

  /// Fetch activity data for a date
  Future<FitbitActivitySummary> fetchActivitySummary(DateTime date) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Fitbit');
    }

    try {
      final dateStr = _formatDate(date);
      final response = await _dio.get('/1/user/-/activities/date/$dateStr.json');
      return FitbitActivitySummary.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching activity summary: $e');
      rethrow;
    }
  }

  /// Fetch heart rate data for a date
  Future<FitbitHeartRateData> fetchHeartRate(DateTime date) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Fitbit');
    }

    try {
      final dateStr = _formatDate(date);
      final response = await _dio.get('/1/user/-/activities/heart/date/$dateStr/1d.json');
      return FitbitHeartRateData.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching heart rate data: $e');
      rethrow;
    }
  }

  /// Fetch sleep data for a date
  Future<FitbitSleepData> fetchSleep(DateTime date) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Fitbit');
    }

    try {
      final dateStr = _formatDate(date);
      final response = await _dio.get('/1.2/user/-/sleep/date/$dateStr.json');
      return FitbitSleepData.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching sleep data: $e');
      rethrow;
    }
  }

  /// Fetch body weight data for a date range
  Future<List<FitbitWeightEntry>> fetchWeight({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Fitbit');
    }

    try {
      final startStr = _formatDate(startDate);
      final endStr = _formatDate(endDate);
      final response = await _dio.get('/1/user/-/body/log/weight/date/$startStr/$endStr.json');

      final weights = (response.data['weight'] as List?)
          ?.map((json) => FitbitWeightEntry.fromJson(json))
          .toList() ?? [];

      return weights;
    } catch (e) {
      debugPrint('Error fetching weight data: $e');
      rethrow;
    }
  }

  /// Fetch SpO2 data for a date
  Future<FitbitSpO2Data?> fetchSpO2(DateTime date) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Fitbit');
    }

    try {
      final dateStr = _formatDate(date);
      final response = await _dio.get('/1/user/-/spo2/date/$dateStr.json');
      return FitbitSpO2Data.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching SpO2 data: $e');
      return null;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Convert Fitbit data to HealthDataPoints
  List<AppHealthDataPoint> convertToHealthDataPoints({
    FitbitActivitySummary? activity,
    FitbitHeartRateData? heartRate,
    FitbitSleepData? sleep,
    List<FitbitWeightEntry>? weights,
    DateTime? date,
  }) {
    final dataPoints = <AppHealthDataPoint>[];
    final timestamp = date ?? DateTime.now();

    if (activity != null) {
      final summary = activity.summary;

      // Steps
      if (summary.steps > 0) {
        dataPoints.add(AppHealthDataPoint(
          id: 'fitbit_steps_${timestamp.toIso8601String()}',
          type: AppHealthDataType.steps,
          value: summary.steps.toDouble(),
          unit: AppHealthDataUnit.count,
          timestamp: timestamp,
          dateFrom: timestamp,
          dateTo: timestamp,
          source: AppHealthDataSource.fitbit,
          sourceAppName: 'Fitbit',
        ));
      }

      // Calories
      if (summary.caloriesOut > 0) {
        dataPoints.add(AppHealthDataPoint(
          id: 'fitbit_calories_${timestamp.toIso8601String()}',
          type: AppHealthDataType.activeEnergyBurned,
          value: summary.activityCalories.toDouble(),
          unit: AppHealthDataUnit.kilocalorie,
          timestamp: timestamp,
          dateFrom: timestamp,
          dateTo: timestamp,
          source: AppHealthDataSource.fitbit,
          sourceAppName: 'Fitbit',
        ));
      }

      // Distance
      final distances = activity.summary.distances;
      if (distances.isNotEmpty) {
        final totalDistance = distances.firstWhere(
          (d) => d['activity'] == 'total',
          orElse: () => {'distance': 0.0},
        );
        final distanceKm = (totalDistance['distance'] as num?)?.toDouble() ?? 0.0;
        if (distanceKm > 0) {
          dataPoints.add(AppHealthDataPoint(
            id: 'fitbit_distance_${timestamp.toIso8601String()}',
            type: AppHealthDataType.distanceWalkingRunning,
            value: distanceKm * 1000, // Convert to meters
            unit: AppHealthDataUnit.meter,
            timestamp: timestamp,
            dateFrom: timestamp,
            dateTo: timestamp,
            source: AppHealthDataSource.fitbit,
            sourceAppName: 'Fitbit',
          ));
        }
      }
    }

    if (heartRate != null && heartRate.restingHeartRate != null) {
      dataPoints.add(AppHealthDataPoint(
        id: 'fitbit_rhr_${timestamp.toIso8601String()}',
        type: AppHealthDataType.restingHeartRate,
        value: heartRate.restingHeartRate!.toDouble(),
        unit: AppHealthDataUnit.beatsPerMinute,
        timestamp: timestamp,
        dateFrom: timestamp,
        dateTo: timestamp,
        source: AppHealthDataSource.fitbit,
        sourceAppName: 'Fitbit',
      ));
    }

    if (sleep != null && sleep.summary != null) {
      final summary = sleep.summary!;

      // Total sleep duration
      if (summary.totalMinutesAsleep > 0) {
        dataPoints.add(AppHealthDataPoint(
          id: 'fitbit_sleep_${timestamp.toIso8601String()}',
          type: AppHealthDataType.sleepAsleep,
          value: summary.totalMinutesAsleep.toDouble(),
          unit: AppHealthDataUnit.minute,
          timestamp: timestamp,
          dateFrom: timestamp,
          dateTo: timestamp,
          source: AppHealthDataSource.fitbit,
          sourceAppName: 'Fitbit',
        ));
      }

      // Sleep stages
      if (summary.stages != null) {
        if (summary.stages!.deep > 0) {
          dataPoints.add(AppHealthDataPoint(
            id: 'fitbit_sleep_deep_${timestamp.toIso8601String()}',
            type: AppHealthDataType.sleepDeep,
            value: summary.stages!.deep.toDouble(),
            unit: AppHealthDataUnit.minute,
            timestamp: timestamp,
            dateFrom: timestamp,
            dateTo: timestamp,
            source: AppHealthDataSource.fitbit,
            sourceAppName: 'Fitbit',
          ));
        }
        if (summary.stages!.rem > 0) {
          dataPoints.add(AppHealthDataPoint(
            id: 'fitbit_sleep_rem_${timestamp.toIso8601String()}',
            type: AppHealthDataType.sleepREM,
            value: summary.stages!.rem.toDouble(),
            unit: AppHealthDataUnit.minute,
            timestamp: timestamp,
            dateFrom: timestamp,
            dateTo: timestamp,
            source: AppHealthDataSource.fitbit,
            sourceAppName: 'Fitbit',
          ));
        }
        if (summary.stages!.light > 0) {
          dataPoints.add(AppHealthDataPoint(
            id: 'fitbit_sleep_light_${timestamp.toIso8601String()}',
            type: AppHealthDataType.sleepLight,
            value: summary.stages!.light.toDouble(),
            unit: AppHealthDataUnit.minute,
            timestamp: timestamp,
            dateFrom: timestamp,
            dateTo: timestamp,
            source: AppHealthDataSource.fitbit,
            sourceAppName: 'Fitbit',
          ));
        }
      }
    }

    if (weights != null) {
      for (final weight in weights) {
        dataPoints.add(AppHealthDataPoint(
          id: 'fitbit_weight_${weight.date}_${weight.logId}',
          type: AppHealthDataType.weight,
          value: weight.weight,
          unit: AppHealthDataUnit.kilogram,
          timestamp: weight.dateTime,
          dateFrom: weight.dateTime,
          dateTo: weight.dateTime,
          source: AppHealthDataSource.fitbit,
          sourceAppName: 'Fitbit',
        ));

        if (weight.bmi != null) {
          dataPoints.add(AppHealthDataPoint(
            id: 'fitbit_bmi_${weight.date}_${weight.logId}',
            type: AppHealthDataType.bodyMassIndex,
            value: weight.bmi!,
            unit: AppHealthDataUnit.noUnit,
            timestamp: weight.dateTime,
            dateFrom: weight.dateTime,
            dateTo: weight.dateTime,
            source: AppHealthDataSource.fitbit,
            sourceAppName: 'Fitbit',
          ));
        }
      }
    }

    return dataPoints;
  }
}

/// Fitbit activity summary model
class FitbitActivitySummary {
  final FitbitActivitySummaryData summary;
  final List<Map<String, dynamic>> activities;

  FitbitActivitySummary({
    required this.summary,
    this.activities = const [],
  });

  factory FitbitActivitySummary.fromJson(Map<String, dynamic> json) {
    return FitbitActivitySummary(
      summary: FitbitActivitySummaryData.fromJson(json['summary'] ?? {}),
      activities: (json['activities'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    );
  }
}

class FitbitActivitySummaryData {
  final int steps;
  final int caloriesOut;
  final int activityCalories;
  final int sedentaryMinutes;
  final int lightlyActiveMinutes;
  final int fairlyActiveMinutes;
  final int veryActiveMinutes;
  final int floors;
  final List<Map<String, dynamic>> distances;

  FitbitActivitySummaryData({
    this.steps = 0,
    this.caloriesOut = 0,
    this.activityCalories = 0,
    this.sedentaryMinutes = 0,
    this.lightlyActiveMinutes = 0,
    this.fairlyActiveMinutes = 0,
    this.veryActiveMinutes = 0,
    this.floors = 0,
    this.distances = const [],
  });

  factory FitbitActivitySummaryData.fromJson(Map<String, dynamic> json) {
    return FitbitActivitySummaryData(
      steps: json['steps'] ?? 0,
      caloriesOut: json['caloriesOut'] ?? 0,
      activityCalories: json['activityCalories'] ?? 0,
      sedentaryMinutes: json['sedentaryMinutes'] ?? 0,
      lightlyActiveMinutes: json['lightlyActiveMinutes'] ?? 0,
      fairlyActiveMinutes: json['fairlyActiveMinutes'] ?? 0,
      veryActiveMinutes: json['veryActiveMinutes'] ?? 0,
      floors: json['floors'] ?? 0,
      distances: (json['distances'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    );
  }
}

/// Fitbit heart rate data model
class FitbitHeartRateData {
  final int? restingHeartRate;
  final List<FitbitHeartRateZone> heartRateZones;

  FitbitHeartRateData({
    this.restingHeartRate,
    this.heartRateZones = const [],
  });

  factory FitbitHeartRateData.fromJson(Map<String, dynamic> json) {
    final activitiesHeart = json['activities-heart'] as List?;
    if (activitiesHeart == null || activitiesHeart.isEmpty) {
      return FitbitHeartRateData();
    }

    final dayData = activitiesHeart.first['value'] as Map<String, dynamic>?;
    if (dayData == null) {
      return FitbitHeartRateData();
    }

    return FitbitHeartRateData(
      restingHeartRate: dayData['restingHeartRate'],
      heartRateZones: (dayData['heartRateZones'] as List?)
              ?.map((z) => FitbitHeartRateZone.fromJson(z))
              .toList() ??
          [],
    );
  }
}

class FitbitHeartRateZone {
  final String name;
  final int min;
  final int max;
  final int minutes;
  final int caloriesOut;

  FitbitHeartRateZone({
    required this.name,
    required this.min,
    required this.max,
    this.minutes = 0,
    this.caloriesOut = 0,
  });

  factory FitbitHeartRateZone.fromJson(Map<String, dynamic> json) {
    return FitbitHeartRateZone(
      name: json['name'] ?? '',
      min: json['min'] ?? 0,
      max: json['max'] ?? 0,
      minutes: json['minutes'] ?? 0,
      caloriesOut: json['caloriesOut'] ?? 0,
    );
  }
}

/// Fitbit sleep data model
class FitbitSleepData {
  final List<FitbitSleepEntry> sleep;
  final FitbitSleepSummary? summary;

  FitbitSleepData({
    this.sleep = const [],
    this.summary,
  });

  factory FitbitSleepData.fromJson(Map<String, dynamic> json) {
    return FitbitSleepData(
      sleep: (json['sleep'] as List?)
              ?.map((s) => FitbitSleepEntry.fromJson(s))
              .toList() ??
          [],
      summary: json['summary'] != null
          ? FitbitSleepSummary.fromJson(json['summary'])
          : null,
    );
  }
}

class FitbitSleepEntry {
  final String logId;
  final DateTime startTime;
  final DateTime endTime;
  final int duration;
  final int efficiency;
  final bool isMainSleep;

  FitbitSleepEntry({
    required this.logId,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.efficiency,
    this.isMainSleep = false,
  });

  factory FitbitSleepEntry.fromJson(Map<String, dynamic> json) {
    return FitbitSleepEntry(
      logId: json['logId']?.toString() ?? '',
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      duration: json['duration'] ?? 0,
      efficiency: json['efficiency'] ?? 0,
      isMainSleep: json['isMainSleep'] ?? false,
    );
  }
}

class FitbitSleepSummary {
  final int totalMinutesAsleep;
  final int totalSleepRecords;
  final int totalTimeInBed;
  final FitbitSleepStages? stages;

  FitbitSleepSummary({
    this.totalMinutesAsleep = 0,
    this.totalSleepRecords = 0,
    this.totalTimeInBed = 0,
    this.stages,
  });

  factory FitbitSleepSummary.fromJson(Map<String, dynamic> json) {
    return FitbitSleepSummary(
      totalMinutesAsleep: json['totalMinutesAsleep'] ?? 0,
      totalSleepRecords: json['totalSleepRecords'] ?? 0,
      totalTimeInBed: json['totalTimeInBed'] ?? 0,
      stages: json['stages'] != null
          ? FitbitSleepStages.fromJson(json['stages'])
          : null,
    );
  }
}

class FitbitSleepStages {
  final int deep;
  final int light;
  final int rem;
  final int wake;

  FitbitSleepStages({
    this.deep = 0,
    this.light = 0,
    this.rem = 0,
    this.wake = 0,
  });

  factory FitbitSleepStages.fromJson(Map<String, dynamic> json) {
    return FitbitSleepStages(
      deep: json['deep'] ?? 0,
      light: json['light'] ?? 0,
      rem: json['rem'] ?? 0,
      wake: json['wake'] ?? 0,
    );
  }
}

/// Fitbit weight entry model
class FitbitWeightEntry {
  final String logId;
  final double weight;
  final double? bmi;
  final double? fat;
  final String date;
  final String time;
  final DateTime dateTime;

  FitbitWeightEntry({
    required this.logId,
    required this.weight,
    this.bmi,
    this.fat,
    required this.date,
    required this.time,
    required this.dateTime,
  });

  factory FitbitWeightEntry.fromJson(Map<String, dynamic> json) {
    final date = json['date'] as String;
    final time = json['time'] as String;
    return FitbitWeightEntry(
      logId: json['logId']?.toString() ?? '',
      weight: (json['weight'] as num).toDouble(),
      bmi: (json['bmi'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
      date: date,
      time: time,
      dateTime: DateTime.parse('${date}T$time'),
    );
  }
}

/// Fitbit SpO2 data model
class FitbitSpO2Data {
  final DateTime dateTime;
  final double? value;
  final double? min;
  final double? max;

  FitbitSpO2Data({
    required this.dateTime,
    this.value,
    this.min,
    this.max,
  });

  factory FitbitSpO2Data.fromJson(Map<String, dynamic> json) {
    return FitbitSpO2Data(
      dateTime: DateTime.parse(json['dateTime'] ?? DateTime.now().toIso8601String()),
      value: (json['value']?['avg'] as num?)?.toDouble(),
      min: (json['value']?['min'] as num?)?.toDouble(),
      max: (json['value']?['max'] as num?)?.toDouble(),
    );
  }
}
