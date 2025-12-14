import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import '../../../core/config/app_config.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/health_data_point.dart';

// ignore_for_file: unused_import

/// Oura Ring API OAuth 2.0 Service
///
/// Implements OAuth 2.0 authentication and data fetching for Oura API v2.
/// Reference: https://cloud.ouraring.com/docs/
class OuraService {
  static const String _authUrl = 'https://cloud.ouraring.com/oauth/authorize';
  static const String _tokenUrl = 'https://api.ouraring.com/oauth/token';
  static const String _apiBaseUrl = 'https://api.ouraring.com/v2/usercollection';
  static const String _callbackScheme = 'upcoach';
  static const String _redirectUri = '$_callbackScheme://oura/callback';

  // Oura API scopes
  static const List<String> _scopes = [
    'daily',
    'heartrate',
    'personal',
    'session',
    'spo2',
    'tag',
    'workout',
  ];

  final SecureStorage _secureStorage;
  final Dio _dio;

  // Storage keys
  static const String _accessTokenKey = 'oura_access_token';
  static const String _refreshTokenKey = 'oura_refresh_token';
  static const String _tokenExpiryKey = 'oura_token_expiry';

  OuraService(this._secureStorage) : _dio = Dio() {
    _dio.options.baseUrl = _apiBaseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);

    // Add interceptor for automatic token refresh
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
          // Token expired, try to refresh
          final refreshed = await _refreshAccessToken();
          if (refreshed) {
            // Retry the request
            final token = await _getAccessToken();
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await _dio.fetch(error.requestOptions);
              handler.resolve(response);
              return;
            } catch (e) {
              handler.reject(error);
              return;
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  // ============================================================================
  // OAuth 2.0 Authentication
  // ============================================================================

  /// Initiate OAuth 2.0 authorization flow
  Future<bool> connect() async {
    try {
      final clientId = appConfig.ouraClientId;
      if (clientId.isEmpty) {
        debugPrint('Oura client ID not configured');
        return false;
      }

      // Build authorization URL
      final authorizationUrl = Uri.parse(_authUrl).replace(
        queryParameters: {
          'client_id': clientId,
          'redirect_uri': _redirectUri,
          'response_type': 'code',
          'scope': _scopes.join(' '),
          'state': _generateState(),
        },
      );

      // Launch OAuth flow
      final result = await FlutterWebAuth2.authenticate(
        url: authorizationUrl.toString(),
        callbackUrlScheme: _callbackScheme,
      );

      // Extract authorization code
      final uri = Uri.parse(result);
      final code = uri.queryParameters['code'];

      if (code == null || code.isEmpty) {
        debugPrint('No authorization code received from Oura');
        return false;
      }

      // Exchange code for tokens
      return await _exchangeCodeForTokens(code);
    } catch (e) {
      debugPrint('Oura OAuth error: $e');
      return false;
    }
  }

  /// Exchange authorization code for access and refresh tokens
  Future<bool> _exchangeCodeForTokens(String code) async {
    try {
      final clientId = appConfig.ouraClientId;
      final clientSecret = appConfig.ouraClientSecret;

      final response = await Dio().post(
        _tokenUrl,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
        data: {
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': _redirectUri,
          'client_id': clientId,
          'client_secret': clientSecret,
        },
      );

      if (response.statusCode == 200) {
        await _saveTokens(response.data);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Oura token exchange error: $e');
      return false;
    }
  }

  /// Refresh the access token using the refresh token
  Future<bool> _refreshAccessToken() async {
    try {
      final refreshToken = await _secureStorage.read(_refreshTokenKey);
      if (refreshToken == null) return false;

      final clientId = appConfig.ouraClientId;
      final clientSecret = appConfig.ouraClientSecret;

      final response = await Dio().post(
        _tokenUrl,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
        data: {
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken,
          'client_id': clientId,
          'client_secret': clientSecret,
        },
      );

      if (response.statusCode == 200) {
        await _saveTokens(response.data);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Oura token refresh error: $e');
      return false;
    }
  }

  /// Save tokens to secure storage
  Future<void> _saveTokens(Map<String, dynamic> tokenData) async {
    final accessToken = tokenData['access_token'] as String;
    final refreshToken = tokenData['refresh_token'] as String?;
    final expiresIn = tokenData['expires_in'] as int? ?? 86400;

    await _secureStorage.write(_accessTokenKey, accessToken);
    if (refreshToken != null) {
      await _secureStorage.write(_refreshTokenKey, refreshToken);
    }

    final expiry = DateTime.now().add(Duration(seconds: expiresIn));
    await _secureStorage.write(
      _tokenExpiryKey,
      expiry.toIso8601String(),
    );
  }

  /// Get access token from secure storage
  Future<String?> _getAccessToken() async {
    final token = await _secureStorage.read(_accessTokenKey);
    if (token == null) return null;

    // Check if token is expired
    final expiryStr = await _secureStorage.read(_tokenExpiryKey);
    if (expiryStr != null) {
      final expiry = DateTime.parse(expiryStr);
      if (DateTime.now().isAfter(expiry.subtract(const Duration(minutes: 5)))) {
        // Token is about to expire, refresh it
        await _refreshAccessToken();
        return await _secureStorage.read(_accessTokenKey);
      }
    }

    return token;
  }

  /// Disconnect from Oura
  Future<void> disconnect() async {
    await _secureStorage.deleteKey(_accessTokenKey);
    await _secureStorage.deleteKey(_refreshTokenKey);
    await _secureStorage.deleteKey(_tokenExpiryKey);
  }

  /// Check if connected to Oura
  Future<bool> isConnected() async {
    final token = await _getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ============================================================================
  // API Data Fetching
  // ============================================================================

  /// Get personal info
  Future<OuraPersonalInfo?> getPersonalInfo() async {
    try {
      final response = await _dio.get('/personal_info');
      if (response.statusCode == 200) {
        return OuraPersonalInfo.fromJson(response.data);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching Oura personal info: $e');
      return null;
    }
  }

  /// Get daily readiness data
  Future<List<OuraDailyReadiness>> getDailyReadiness({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/daily_readiness',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraDailyReadiness.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura readiness data: $e');
      return [];
    }
  }

  /// Get daily sleep data
  Future<List<OuraDailySleep>> getDailySleep({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/daily_sleep',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraDailySleep.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura sleep data: $e');
      return [];
    }
  }

  /// Get sleep periods (detailed sleep sessions)
  Future<List<OuraSleepPeriod>> getSleepPeriods({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/sleep',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraSleepPeriod.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura sleep periods: $e');
      return [];
    }
  }

  /// Get daily activity data
  Future<List<OuraDailyActivity>> getDailyActivity({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/daily_activity',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraDailyActivity.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura activity data: $e');
      return [];
    }
  }

  /// Get heart rate data
  Future<List<OuraHeartRate>> getHeartRate({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_datetime'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        params['end_datetime'] = endDate.toIso8601String();
      }

      final response = await _dio.get(
        '/heartrate',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraHeartRate.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura heart rate data: $e');
      return [];
    }
  }

  /// Get SpO2 data
  Future<List<OuraSpO2>> getSpO2({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/daily_spo2',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraSpO2.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura SpO2 data: $e');
      return [];
    }
  }

  /// Get workout data
  Future<List<OuraWorkout>> getWorkouts({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (startDate != null) {
        params['start_date'] = _formatDate(startDate);
      }
      if (endDate != null) {
        params['end_date'] = _formatDate(endDate);
      }

      final response = await _dio.get(
        '/workout',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        return data
            .map((json) => OuraWorkout.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching Oura workout data: $e');
      return [];
    }
  }

  /// Format date as YYYY-MM-DD
  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Generate a random state for OAuth
  String _generateState() {
    final random = DateTime.now().millisecondsSinceEpoch;
    return base64Url.encode(utf8.encode('oura_$random')).substring(0, 16);
  }
}

// ============================================================================
// Oura Data Models
// ============================================================================

class OuraPersonalInfo {
  final String id;
  final int? age;
  final double? weight;
  final double? height;
  final String? biologicalSex;
  final String? email;

  const OuraPersonalInfo({
    required this.id,
    this.age,
    this.weight,
    this.height,
    this.biologicalSex,
    this.email,
  });

  factory OuraPersonalInfo.fromJson(Map<String, dynamic> json) {
    return OuraPersonalInfo(
      id: json['id'] as String,
      age: json['age'] as int?,
      weight: (json['weight'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      biologicalSex: json['biological_sex'] as String?,
      email: json['email'] as String?,
    );
  }
}

class OuraDailyReadiness {
  final String id;
  final String day;
  final int score;
  final double? temperatureDeviation;
  final double? temperatureTrendDeviation;
  final OuraReadinessContributors contributors;

  const OuraDailyReadiness({
    required this.id,
    required this.day,
    required this.score,
    this.temperatureDeviation,
    this.temperatureTrendDeviation,
    required this.contributors,
  });

  factory OuraDailyReadiness.fromJson(Map<String, dynamic> json) {
    return OuraDailyReadiness(
      id: json['id'] as String,
      day: json['day'] as String,
      score: json['score'] as int? ?? 0,
      temperatureDeviation: (json['temperature_deviation'] as num?)?.toDouble(),
      temperatureTrendDeviation: (json['temperature_trend_deviation'] as num?)?.toDouble(),
      contributors: OuraReadinessContributors.fromJson(
        json['contributors'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class OuraReadinessContributors {
  final int? activityBalance;
  final int? bodyTemperature;
  final int? hrvBalance;
  final int? previousDayActivity;
  final int? previousNight;
  final int? recoveryIndex;
  final int? restingHeartRate;
  final int? sleepBalance;

  const OuraReadinessContributors({
    this.activityBalance,
    this.bodyTemperature,
    this.hrvBalance,
    this.previousDayActivity,
    this.previousNight,
    this.recoveryIndex,
    this.restingHeartRate,
    this.sleepBalance,
  });

  factory OuraReadinessContributors.fromJson(Map<String, dynamic> json) {
    return OuraReadinessContributors(
      activityBalance: json['activity_balance'] as int?,
      bodyTemperature: json['body_temperature'] as int?,
      hrvBalance: json['hrv_balance'] as int?,
      previousDayActivity: json['previous_day_activity'] as int?,
      previousNight: json['previous_night'] as int?,
      recoveryIndex: json['recovery_index'] as int?,
      restingHeartRate: json['resting_heart_rate'] as int?,
      sleepBalance: json['sleep_balance'] as int?,
    );
  }
}

class OuraDailySleep {
  final String id;
  final String day;
  final int score;
  final OuraSleepContributors contributors;

  const OuraDailySleep({
    required this.id,
    required this.day,
    required this.score,
    required this.contributors,
  });

  factory OuraDailySleep.fromJson(Map<String, dynamic> json) {
    return OuraDailySleep(
      id: json['id'] as String,
      day: json['day'] as String,
      score: json['score'] as int? ?? 0,
      contributors: OuraSleepContributors.fromJson(
        json['contributors'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class OuraSleepContributors {
  final int? deepSleep;
  final int? efficiency;
  final int? latency;
  final int? remSleep;
  final int? restfulness;
  final int? timing;
  final int? totalSleep;

  const OuraSleepContributors({
    this.deepSleep,
    this.efficiency,
    this.latency,
    this.remSleep,
    this.restfulness,
    this.timing,
    this.totalSleep,
  });

  factory OuraSleepContributors.fromJson(Map<String, dynamic> json) {
    return OuraSleepContributors(
      deepSleep: json['deep_sleep'] as int?,
      efficiency: json['efficiency'] as int?,
      latency: json['latency'] as int?,
      remSleep: json['rem_sleep'] as int?,
      restfulness: json['restfulness'] as int?,
      timing: json['timing'] as int?,
      totalSleep: json['total_sleep'] as int?,
    );
  }
}

class OuraSleepPeriod {
  final String id;
  final String day;
  final String bedtimeStart;
  final String bedtimeEnd;
  final String type;
  final int? awakeTime;
  final int? deepSleepDuration;
  final int? lightSleepDuration;
  final int? remSleepDuration;
  final int? totalSleepDuration;
  final int? efficiency;
  final int? latency;
  final int? averageHeartRate;
  final int? lowestHeartRate;
  final int? averageHrv;
  final double? averageBreath;
  final int? restlessPeriods;

  const OuraSleepPeriod({
    required this.id,
    required this.day,
    required this.bedtimeStart,
    required this.bedtimeEnd,
    required this.type,
    this.awakeTime,
    this.deepSleepDuration,
    this.lightSleepDuration,
    this.remSleepDuration,
    this.totalSleepDuration,
    this.efficiency,
    this.latency,
    this.averageHeartRate,
    this.lowestHeartRate,
    this.averageHrv,
    this.averageBreath,
    this.restlessPeriods,
  });

  factory OuraSleepPeriod.fromJson(Map<String, dynamic> json) {
    return OuraSleepPeriod(
      id: json['id'] as String,
      day: json['day'] as String,
      bedtimeStart: json['bedtime_start'] as String,
      bedtimeEnd: json['bedtime_end'] as String,
      type: json['type'] as String? ?? 'long_sleep',
      awakeTime: json['awake_time'] as int?,
      deepSleepDuration: json['deep_sleep_duration'] as int?,
      lightSleepDuration: json['light_sleep_duration'] as int?,
      remSleepDuration: json['rem_sleep_duration'] as int?,
      totalSleepDuration: json['total_sleep_duration'] as int?,
      efficiency: json['efficiency'] as int?,
      latency: json['latency'] as int?,
      averageHeartRate: json['average_heart_rate'] as int?,
      lowestHeartRate: json['lowest_heart_rate'] as int?,
      averageHrv: json['average_hrv'] as int?,
      averageBreath: (json['average_breath'] as num?)?.toDouble(),
      restlessPeriods: json['restless_periods'] as int?,
    );
  }
}

class OuraDailyActivity {
  final String id;
  final String day;
  final int score;
  final int activeCalories;
  final int totalCalories;
  final int steps;
  final int equivalentWalkingDistance;
  final int highActivityMetMinutes;
  final int mediumActivityMetMinutes;
  final int lowActivityMetMinutes;
  final int sedentaryMetMinutes;
  final int nonWearMinutes;
  final int restingTime;
  final int inactivityAlerts;

  const OuraDailyActivity({
    required this.id,
    required this.day,
    required this.score,
    required this.activeCalories,
    required this.totalCalories,
    required this.steps,
    required this.equivalentWalkingDistance,
    required this.highActivityMetMinutes,
    required this.mediumActivityMetMinutes,
    required this.lowActivityMetMinutes,
    required this.sedentaryMetMinutes,
    required this.nonWearMinutes,
    required this.restingTime,
    required this.inactivityAlerts,
  });

  factory OuraDailyActivity.fromJson(Map<String, dynamic> json) {
    return OuraDailyActivity(
      id: json['id'] as String,
      day: json['day'] as String,
      score: json['score'] as int? ?? 0,
      activeCalories: json['active_calories'] as int? ?? 0,
      totalCalories: json['total_calories'] as int? ?? 0,
      steps: json['steps'] as int? ?? 0,
      equivalentWalkingDistance: json['equivalent_walking_distance'] as int? ?? 0,
      highActivityMetMinutes: json['high_activity_met_minutes'] as int? ?? 0,
      mediumActivityMetMinutes: json['medium_activity_met_minutes'] as int? ?? 0,
      lowActivityMetMinutes: json['low_activity_met_minutes'] as int? ?? 0,
      sedentaryMetMinutes: json['sedentary_met_minutes'] as int? ?? 0,
      nonWearMinutes: json['non_wear_minutes'] as int? ?? 0,
      restingTime: json['resting_time'] as int? ?? 0,
      inactivityAlerts: json['inactivity_alerts'] as int? ?? 0,
    );
  }
}

class OuraHeartRate {
  final int bpm;
  final String source;
  final String timestamp;

  const OuraHeartRate({
    required this.bpm,
    required this.source,
    required this.timestamp,
  });

  factory OuraHeartRate.fromJson(Map<String, dynamic> json) {
    return OuraHeartRate(
      bpm: json['bpm'] as int,
      source: json['source'] as String? ?? 'unknown',
      timestamp: json['timestamp'] as String,
    );
  }
}

class OuraSpO2 {
  final String id;
  final String day;
  final double? averagePercentage;
  final double? breathingDisturbanceIndex;

  const OuraSpO2({
    required this.id,
    required this.day,
    this.averagePercentage,
    this.breathingDisturbanceIndex,
  });

  factory OuraSpO2.fromJson(Map<String, dynamic> json) {
    return OuraSpO2(
      id: json['id'] as String,
      day: json['day'] as String,
      averagePercentage: (json['spo2_percentage']?['average'] as num?)?.toDouble(),
      breathingDisturbanceIndex: (json['breathing_disturbance_index'] as num?)?.toDouble(),
    );
  }
}

class OuraWorkout {
  final String id;
  final String activity;
  final int? calories;
  final String? day;
  final double? distance;
  final String? endDatetime;
  final String? intensity;
  final String? label;
  final String source;
  final String startDatetime;

  const OuraWorkout({
    required this.id,
    required this.activity,
    this.calories,
    this.day,
    this.distance,
    this.endDatetime,
    this.intensity,
    this.label,
    required this.source,
    required this.startDatetime,
  });

  factory OuraWorkout.fromJson(Map<String, dynamic> json) {
    return OuraWorkout(
      id: json['id'] as String,
      activity: json['activity'] as String,
      calories: json['calories'] as int?,
      day: json['day'] as String?,
      distance: (json['distance'] as num?)?.toDouble(),
      endDatetime: json['end_datetime'] as String?,
      intensity: json['intensity'] as String?,
      label: json['label'] as String?,
      source: json['source'] as String? ?? 'unknown',
      startDatetime: json['start_datetime'] as String,
    );
  }
}

// ============================================================================
// Provider
// ============================================================================

final ouraServiceProvider = Provider<OuraService>((ref) {
  final secureStorage = SecureStorage();
  return OuraService(secureStorage);
});
