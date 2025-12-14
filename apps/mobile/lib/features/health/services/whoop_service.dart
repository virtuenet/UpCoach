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

/// WHOOP API OAuth 2.0 Service
///
/// Implements OAuth 2.0 authentication and data fetching for WHOOP API.
/// Reference: https://developer.whoop.com/api
class WhoopService {
  static const String _authUrl = 'https://api.prod.whoop.com/oauth/oauth2/auth';
  static const String _tokenUrl = 'https://api.prod.whoop.com/oauth/oauth2/token';
  static const String _apiBaseUrl = 'https://api.prod.whoop.com/developer/v1';
  static const String _callbackScheme = 'upcoach';
  static const String _redirectUri = '$_callbackScheme://whoop/callback';

  // WHOOP API scopes
  static const List<String> _scopes = [
    'read:recovery',
    'read:cycles',
    'read:sleep',
    'read:workout',
    'read:profile',
    'read:body_measurement',
  ];

  final SecureStorage _secureStorage;
  final Dio _dio;

  // Storage keys
  static const String _accessTokenKey = 'whoop_access_token';
  static const String _refreshTokenKey = 'whoop_refresh_token';
  static const String _tokenExpiryKey = 'whoop_token_expiry';
  static const String _userIdKey = 'whoop_user_id';

  WhoopService(this._secureStorage) : _dio = Dio() {
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
      final clientId = appConfig.whoopClientId;
      if (clientId.isEmpty) {
        debugPrint('WHOOP client ID not configured');
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
        debugPrint('No authorization code received from WHOOP');
        return false;
      }

      // Exchange code for tokens
      return await _exchangeCodeForTokens(code);
    } catch (e) {
      debugPrint('WHOOP OAuth error: $e');
      return false;
    }
  }

  /// Exchange authorization code for access and refresh tokens
  Future<bool> _exchangeCodeForTokens(String code) async {
    try {
      final clientId = appConfig.whoopClientId;
      final clientSecret = appConfig.whoopClientSecret;

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
      debugPrint('WHOOP token exchange error: $e');
      return false;
    }
  }

  /// Refresh the access token using the refresh token
  Future<bool> _refreshAccessToken() async {
    try {
      final refreshToken = await _secureStorage.read(_refreshTokenKey);
      if (refreshToken == null) return false;

      final clientId = appConfig.whoopClientId;
      final clientSecret = appConfig.whoopClientSecret;

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
      debugPrint('WHOOP token refresh error: $e');
      return false;
    }
  }

  /// Save tokens to secure storage
  Future<void> _saveTokens(Map<String, dynamic> tokenData) async {
    final accessToken = tokenData['access_token'] as String;
    final refreshToken = tokenData['refresh_token'] as String?;
    final expiresIn = tokenData['expires_in'] as int? ?? 3600;

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

  /// Disconnect from WHOOP
  Future<void> disconnect() async {
    await _secureStorage.deleteKey(_accessTokenKey);
    await _secureStorage.deleteKey(_refreshTokenKey);
    await _secureStorage.deleteKey(_tokenExpiryKey);
    await _secureStorage.deleteKey(_userIdKey);
  }

  /// Check if connected to WHOOP
  Future<bool> isConnected() async {
    final token = await _getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ============================================================================
  // API Data Fetching
  // ============================================================================

  /// Get user profile
  Future<WhoopUserProfile?> getUserProfile() async {
    try {
      final response = await _dio.get('/user/profile/basic');
      if (response.statusCode == 200) {
        final profile = WhoopUserProfile.fromJson(response.data);
        await _secureStorage.write(
          _userIdKey,
          profile.userId.toString(),
        );
        return profile;
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching WHOOP profile: $e');
      return null;
    }
  }

  /// Get recovery data for a date range
  Future<List<WhoopRecovery>> getRecoveryData({
    DateTime? startDate,
    DateTime? endDate,
    int limit = 25,
  }) async {
    try {
      final params = <String, dynamic>{
        'limit': limit,
      };

      if (startDate != null) {
        params['start'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        params['end'] = endDate.toIso8601String();
      }

      final response = await _dio.get(
        '/recovery',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final records = response.data['records'] as List<dynamic>? ?? [];
        return records
            .map((json) => WhoopRecovery.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching WHOOP recovery data: $e');
      return [];
    }
  }

  /// Get cycle (strain) data for a date range
  Future<List<WhoopCycle>> getCycleData({
    DateTime? startDate,
    DateTime? endDate,
    int limit = 25,
  }) async {
    try {
      final params = <String, dynamic>{
        'limit': limit,
      };

      if (startDate != null) {
        params['start'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        params['end'] = endDate.toIso8601String();
      }

      final response = await _dio.get(
        '/cycle',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final records = response.data['records'] as List<dynamic>? ?? [];
        return records
            .map((json) => WhoopCycle.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching WHOOP cycle data: $e');
      return [];
    }
  }

  /// Get sleep data for a date range
  Future<List<WhoopSleep>> getSleepData({
    DateTime? startDate,
    DateTime? endDate,
    int limit = 25,
  }) async {
    try {
      final params = <String, dynamic>{
        'limit': limit,
      };

      if (startDate != null) {
        params['start'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        params['end'] = endDate.toIso8601String();
      }

      final response = await _dio.get(
        '/activity/sleep',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final records = response.data['records'] as List<dynamic>? ?? [];
        return records
            .map((json) => WhoopSleep.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching WHOOP sleep data: $e');
      return [];
    }
  }

  /// Get workout data for a date range
  Future<List<WhoopWorkout>> getWorkoutData({
    DateTime? startDate,
    DateTime? endDate,
    int limit = 25,
  }) async {
    try {
      final params = <String, dynamic>{
        'limit': limit,
      };

      if (startDate != null) {
        params['start'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        params['end'] = endDate.toIso8601String();
      }

      final response = await _dio.get(
        '/activity/workout',
        queryParameters: params,
      );

      if (response.statusCode == 200) {
        final records = response.data['records'] as List<dynamic>? ?? [];
        return records
            .map((json) => WhoopWorkout.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching WHOOP workout data: $e');
      return [];
    }
  }

  /// Get body measurements
  Future<WhoopBodyMeasurement?> getBodyMeasurements() async {
    try {
      final response = await _dio.get('/user/measurement/body');
      if (response.statusCode == 200) {
        return WhoopBodyMeasurement.fromJson(response.data);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching WHOOP body measurements: $e');
      return null;
    }
  }

  /// Generate a random state for OAuth
  String _generateState() {
    final random = DateTime.now().millisecondsSinceEpoch;
    return base64Url.encode(utf8.encode('whoop_$random')).substring(0, 16);
  }
}

// ============================================================================
// WHOOP Data Models
// ============================================================================

class WhoopUserProfile {
  final int userId;
  final String email;
  final String firstName;
  final String lastName;

  const WhoopUserProfile({
    required this.userId,
    required this.email,
    required this.firstName,
    required this.lastName,
  });

  factory WhoopUserProfile.fromJson(Map<String, dynamic> json) {
    return WhoopUserProfile(
      userId: json['user_id'] as int,
      email: json['email'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
    );
  }
}

class WhoopRecovery {
  final int cycleId;
  final int sleepId;
  final int userId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final WhoopRecoveryScore score;

  const WhoopRecovery({
    required this.cycleId,
    required this.sleepId,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    required this.score,
  });

  factory WhoopRecovery.fromJson(Map<String, dynamic> json) {
    return WhoopRecovery(
      cycleId: json['cycle_id'] as int,
      sleepId: json['sleep_id'] as int,
      userId: json['user_id'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      score: WhoopRecoveryScore.fromJson(json['score'] as Map<String, dynamic>),
    );
  }
}

class WhoopRecoveryScore {
  final int recoveryScore;
  final int restingHeartRate;
  final double hrvRmssdMilli;
  final double? spo2Percentage;
  final double? skinTempCelsius;

  const WhoopRecoveryScore({
    required this.recoveryScore,
    required this.restingHeartRate,
    required this.hrvRmssdMilli,
    this.spo2Percentage,
    this.skinTempCelsius,
  });

  factory WhoopRecoveryScore.fromJson(Map<String, dynamic> json) {
    return WhoopRecoveryScore(
      recoveryScore: json['recovery_score'] as int,
      restingHeartRate: json['resting_heart_rate'] as int,
      hrvRmssdMilli: (json['hrv_rmssd_milli'] as num).toDouble(),
      spo2Percentage: (json['spo2_percentage'] as num?)?.toDouble(),
      skinTempCelsius: (json['skin_temp_celsius'] as num?)?.toDouble(),
    );
  }
}

class WhoopCycle {
  final int id;
  final int userId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime start;
  final DateTime? end;
  final String timezoneOffset;
  final WhoopCycleScore score;

  const WhoopCycle({
    required this.id,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    required this.start,
    this.end,
    required this.timezoneOffset,
    required this.score,
  });

  factory WhoopCycle.fromJson(Map<String, dynamic> json) {
    return WhoopCycle(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      start: DateTime.parse(json['start'] as String),
      end: json['end'] != null ? DateTime.parse(json['end'] as String) : null,
      timezoneOffset: json['timezone_offset'] as String? ?? '+00:00',
      score: WhoopCycleScore.fromJson(json['score'] as Map<String, dynamic>),
    );
  }
}

class WhoopCycleScore {
  final double strain;
  final double kilojoule;
  final int averageHeartRate;
  final int maxHeartRate;

  const WhoopCycleScore({
    required this.strain,
    required this.kilojoule,
    required this.averageHeartRate,
    required this.maxHeartRate,
  });

  factory WhoopCycleScore.fromJson(Map<String, dynamic> json) {
    return WhoopCycleScore(
      strain: (json['strain'] as num).toDouble(),
      kilojoule: (json['kilojoule'] as num).toDouble(),
      averageHeartRate: json['average_heart_rate'] as int,
      maxHeartRate: json['max_heart_rate'] as int,
    );
  }
}

class WhoopSleep {
  final int id;
  final int userId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime start;
  final DateTime end;
  final String timezoneOffset;
  final bool nap;
  final WhoopSleepScore score;

  const WhoopSleep({
    required this.id,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    required this.start,
    required this.end,
    required this.timezoneOffset,
    required this.nap,
    required this.score,
  });

  factory WhoopSleep.fromJson(Map<String, dynamic> json) {
    return WhoopSleep(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      start: DateTime.parse(json['start'] as String),
      end: DateTime.parse(json['end'] as String),
      timezoneOffset: json['timezone_offset'] as String? ?? '+00:00',
      nap: json['nap'] as bool? ?? false,
      score: WhoopSleepScore.fromJson(json['score'] as Map<String, dynamic>),
    );
  }
}

class WhoopSleepScore {
  final WhoopSleepStageSummary stageSummary;
  final int sleepNeededBaselineMilli;
  final int sleepNeededFromSleepDebtMilli;
  final int sleepNeededFromRecentStrainMilli;
  final int sleepNeededFromRecentNapMilli;
  final double respiratoryRate;
  final double sleepPerformancePercentage;
  final double sleepConsistencyPercentage;
  final double sleepEfficiencyPercentage;

  const WhoopSleepScore({
    required this.stageSummary,
    required this.sleepNeededBaselineMilli,
    required this.sleepNeededFromSleepDebtMilli,
    required this.sleepNeededFromRecentStrainMilli,
    required this.sleepNeededFromRecentNapMilli,
    required this.respiratoryRate,
    required this.sleepPerformancePercentage,
    required this.sleepConsistencyPercentage,
    required this.sleepEfficiencyPercentage,
  });

  factory WhoopSleepScore.fromJson(Map<String, dynamic> json) {
    return WhoopSleepScore(
      stageSummary: WhoopSleepStageSummary.fromJson(
        json['stage_summary'] as Map<String, dynamic>,
      ),
      sleepNeededBaselineMilli: json['sleep_needed']['baseline_milli'] as int? ?? 0,
      sleepNeededFromSleepDebtMilli: json['sleep_needed']['need_from_sleep_debt_milli'] as int? ?? 0,
      sleepNeededFromRecentStrainMilli: json['sleep_needed']['need_from_recent_strain_milli'] as int? ?? 0,
      sleepNeededFromRecentNapMilli: json['sleep_needed']['need_from_recent_nap_milli'] as int? ?? 0,
      respiratoryRate: (json['respiratory_rate'] as num?)?.toDouble() ?? 0.0,
      sleepPerformancePercentage: (json['sleep_performance_percentage'] as num?)?.toDouble() ?? 0.0,
      sleepConsistencyPercentage: (json['sleep_consistency_percentage'] as num?)?.toDouble() ?? 0.0,
      sleepEfficiencyPercentage: (json['sleep_efficiency_percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class WhoopSleepStageSummary {
  final int totalInBedTimeMilli;
  final int totalAwakeTimeMilli;
  final int totalNoDataTimeMilli;
  final int totalLightSleepTimeMilli;
  final int totalSlowWaveSleepTimeMilli;
  final int totalRemSleepTimeMilli;
  final int sleepCycleCount;
  final int disturbanceCount;

  const WhoopSleepStageSummary({
    required this.totalInBedTimeMilli,
    required this.totalAwakeTimeMilli,
    required this.totalNoDataTimeMilli,
    required this.totalLightSleepTimeMilli,
    required this.totalSlowWaveSleepTimeMilli,
    required this.totalRemSleepTimeMilli,
    required this.sleepCycleCount,
    required this.disturbanceCount,
  });

  factory WhoopSleepStageSummary.fromJson(Map<String, dynamic> json) {
    return WhoopSleepStageSummary(
      totalInBedTimeMilli: json['total_in_bed_time_milli'] as int? ?? 0,
      totalAwakeTimeMilli: json['total_awake_time_milli'] as int? ?? 0,
      totalNoDataTimeMilli: json['total_no_data_time_milli'] as int? ?? 0,
      totalLightSleepTimeMilli: json['total_light_sleep_time_milli'] as int? ?? 0,
      totalSlowWaveSleepTimeMilli: json['total_slow_wave_sleep_time_milli'] as int? ?? 0,
      totalRemSleepTimeMilli: json['total_rem_sleep_time_milli'] as int? ?? 0,
      sleepCycleCount: json['sleep_cycle_count'] as int? ?? 0,
      disturbanceCount: json['disturbance_count'] as int? ?? 0,
    );
  }
}

class WhoopWorkout {
  final int id;
  final int userId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime start;
  final DateTime end;
  final String timezoneOffset;
  final int sportId;
  final WhoopWorkoutScore score;

  const WhoopWorkout({
    required this.id,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    required this.start,
    required this.end,
    required this.timezoneOffset,
    required this.sportId,
    required this.score,
  });

  factory WhoopWorkout.fromJson(Map<String, dynamic> json) {
    return WhoopWorkout(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      start: DateTime.parse(json['start'] as String),
      end: DateTime.parse(json['end'] as String),
      timezoneOffset: json['timezone_offset'] as String? ?? '+00:00',
      sportId: json['sport_id'] as int,
      score: WhoopWorkoutScore.fromJson(json['score'] as Map<String, dynamic>),
    );
  }
}

class WhoopWorkoutScore {
  final double strain;
  final int averageHeartRate;
  final int maxHeartRate;
  final double kilojoule;
  final double percentRecorded;
  final double? distanceMeter;
  final double? altitudeGainMeter;
  final double? altitudeChangeMeter;
  final Map<String, int>? zoneDuration;

  const WhoopWorkoutScore({
    required this.strain,
    required this.averageHeartRate,
    required this.maxHeartRate,
    required this.kilojoule,
    required this.percentRecorded,
    this.distanceMeter,
    this.altitudeGainMeter,
    this.altitudeChangeMeter,
    this.zoneDuration,
  });

  factory WhoopWorkoutScore.fromJson(Map<String, dynamic> json) {
    return WhoopWorkoutScore(
      strain: (json['strain'] as num).toDouble(),
      averageHeartRate: json['average_heart_rate'] as int,
      maxHeartRate: json['max_heart_rate'] as int,
      kilojoule: (json['kilojoule'] as num).toDouble(),
      percentRecorded: (json['percent_recorded'] as num).toDouble(),
      distanceMeter: (json['distance_meter'] as num?)?.toDouble(),
      altitudeGainMeter: (json['altitude_gain_meter'] as num?)?.toDouble(),
      altitudeChangeMeter: (json['altitude_change_meter'] as num?)?.toDouble(),
      zoneDuration: json['zone_duration'] != null
          ? Map<String, int>.from(json['zone_duration'] as Map)
          : null,
    );
  }
}

class WhoopBodyMeasurement {
  final double heightMeter;
  final double weightKilogram;
  final double maxHeartRate;

  const WhoopBodyMeasurement({
    required this.heightMeter,
    required this.weightKilogram,
    required this.maxHeartRate,
  });

  factory WhoopBodyMeasurement.fromJson(Map<String, dynamic> json) {
    return WhoopBodyMeasurement(
      heightMeter: (json['height_meter'] as num).toDouble(),
      weightKilogram: (json['weight_kilogram'] as num).toDouble(),
      maxHeartRate: (json['max_heart_rate'] as num).toDouble(),
    );
  }
}

// ============================================================================
// Provider
// ============================================================================

final whoopServiceProvider = Provider<WhoopService>((ref) {
  final secureStorage = SecureStorage();
  return WhoopService(secureStorage);
});
