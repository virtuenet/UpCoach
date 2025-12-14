import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../../../core/config/app_config.dart';
import '../models/health_data_point.dart';
import '../models/health_integration.dart';

/// Provider for TechnogymService
final technogymServiceProvider = Provider<TechnogymService>((ref) {
  return TechnogymService();
});

/// Service for integrating with Technogym Mywellness API
///
/// Technogym Mywellness API provides access to:
/// - Gym equipment workouts
/// - Strength training data (exercises, sets, reps, weights)
/// - Cardio metrics (duration, distance, calories)
/// - Exercise history
/// - Workout programs
class TechnogymService {
  static const String _baseUrl = 'https://api.mywellness.com';
  static const String _authUrl = 'https://id.mywellness.com/oauth2/authorize';
  static const String _tokenUrl = 'https://id.mywellness.com/oauth2/token';
  static const String _redirectUri = 'upcoach://technogym/callback';

  /// Get client ID from app config (set via --dart-define)
  String get _clientId => appConfig.technogymClientId;

  /// Get client secret from app config (set via --dart-define)
  String get _clientSecret => appConfig.technogymClientSecret;

  /// Check if Technogym credentials are configured
  bool get isConfigured =>
      _clientId.isNotEmpty && _clientSecret.isNotEmpty;

  static const List<String> _scopes = [
    'openid',
    'profile',
    'workout.read',
    'exercise.read',
    'activity.read',
  ];

  final Dio _dio = Dio();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Storage keys
  static const String _accessTokenKey = 'technogym_access_token';
  static const String _refreshTokenKey = 'technogym_refresh_token';
  static const String _expiresAtKey = 'technogym_expires_at';
  static const String _userIdKey = 'technogym_user_id';

  OAuthToken? _cachedToken;

  TechnogymService() {
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

  /// Check if user is connected to Technogym
  Future<bool> isConnected() async {
    final token = await _secureStorage.read(key: _accessTokenKey);
    return token != null;
  }

  /// Start OAuth2 authorization flow
  Future<bool> connect() async {
    if (!isConfigured) {
      debugPrint('Technogym credentials not configured. '
          'Set TECHNOGYM_CLIENT_ID and TECHNOGYM_CLIENT_SECRET via --dart-define');
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
      debugPrint('Error connecting to Technogym: $e');
      return false;
    }
  }

  /// Exchange authorization code for access token
  Future<void> _exchangeCodeForTokens(String code) async {
    try {
      final response = await Dio().post(
        _tokenUrl,
        data: {
          'grant_type': 'authorization_code',
          'code': code,
          'client_id': _clientId,
          'client_secret': _clientSecret,
          'redirect_uri': _redirectUri,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      final data = response.data;
      await _saveTokens(
        accessToken: data['access_token'],
        refreshToken: data['refresh_token'],
        expiresIn: data['expires_in'],
      );

      // Get user info
      await _fetchAndSaveUserInfo();
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

      final response = await Dio().post(
        _tokenUrl,
        data: {
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken,
          'client_id': _clientId,
          'client_secret': _clientSecret,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
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
  }) async {
    final expiresAt = DateTime.now().add(Duration(seconds: expiresIn));

    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    await _secureStorage.write(
      key: _expiresAtKey,
      value: expiresAt.toIso8601String(),
    );

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

  /// Fetch and save user info
  Future<void> _fetchAndSaveUserInfo() async {
    try {
      final response = await _dio.get('/v2/me');
      final userId = response.data['id']?.toString();
      if (userId != null) {
        await _secureStorage.write(key: _userIdKey, value: userId);
      }
    } catch (e) {
      debugPrint('Error fetching user info: $e');
    }
  }

  /// Disconnect from Technogym
  Future<void> disconnect() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _expiresAtKey);
    await _secureStorage.delete(key: _userIdKey);
    _cachedToken = null;
  }

  /// Fetch workouts for a date range
  Future<List<TechnogymWorkout>> fetchWorkouts({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Technogym');
    }

    try {
      final response = await _dio.get(
        '/v2/workout',
        queryParameters: {
          'from': startDate.toIso8601String(),
          'to': endDate.toIso8601String(),
        },
      );

      final workouts = (response.data['workouts'] as List?)
          ?.map((json) => TechnogymWorkout.fromJson(json))
          .toList() ?? [];

      return workouts;
    } catch (e) {
      debugPrint('Error fetching workouts: $e');
      rethrow;
    }
  }

  /// Fetch workout details
  Future<TechnogymWorkout> fetchWorkoutDetails(String workoutId) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Technogym');
    }

    try {
      final response = await _dio.get('/v2/workout/$workoutId');
      return TechnogymWorkout.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching workout details: $e');
      rethrow;
    }
  }

  /// Fetch user's exercise history
  Future<List<TechnogymExercise>> fetchExerciseHistory({
    required DateTime startDate,
    required DateTime endDate,
    String? exerciseType,
  }) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Technogym');
    }

    try {
      final response = await _dio.get(
        '/v2/exercise',
        queryParameters: {
          'from': startDate.toIso8601String(),
          'to': endDate.toIso8601String(),
          if (exerciseType != null) 'type': exerciseType,
        },
      );

      final exercises = (response.data['exercises'] as List?)
          ?.map((json) => TechnogymExercise.fromJson(json))
          .toList() ?? [];

      return exercises;
    } catch (e) {
      debugPrint('Error fetching exercise history: $e');
      rethrow;
    }
  }

  /// Fetch user's activity summary
  Future<TechnogymActivitySummary> fetchActivitySummary({
    required DateTime date,
  }) async {
    if (!await isConnected()) {
      throw Exception('Not connected to Technogym');
    }

    try {
      final response = await _dio.get(
        '/v2/activity/summary',
        queryParameters: {
          'date': date.toIso8601String().split('T').first,
        },
      );

      return TechnogymActivitySummary.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching activity summary: $e');
      rethrow;
    }
  }

  /// Convert Technogym workouts to HealthDataPoints
  List<AppHealthDataPoint> convertToHealthDataPoints(
    List<TechnogymWorkout> workouts,
  ) {
    final dataPoints = <AppHealthDataPoint>[];

    for (final workout in workouts) {
      // Add workout duration
      if (workout.durationMinutes != null) {
        dataPoints.add(AppHealthDataPoint(
          id: '${workout.id}_duration',
          type: AppHealthDataType.workoutMinutes,
          value: workout.durationMinutes!.toDouble(),
          unit: AppHealthDataUnit.minute,
          timestamp: workout.startTime,
          dateFrom: workout.startTime,
          dateTo: workout.endTime ?? workout.startTime,
          source: AppHealthDataSource.technogym,
          sourceAppName: 'Technogym Mywellness',
          metadata: {
            'workoutId': workout.id,
            'workoutType': workout.type,
            'equipmentType': workout.equipmentType,
          },
        ));
      }

      // Add calories burned
      if (workout.caloriesBurned != null) {
        dataPoints.add(AppHealthDataPoint(
          id: '${workout.id}_calories',
          type: AppHealthDataType.activeEnergyBurned,
          value: workout.caloriesBurned!.toDouble(),
          unit: AppHealthDataUnit.kilocalorie,
          timestamp: workout.startTime,
          dateFrom: workout.startTime,
          dateTo: workout.endTime ?? workout.startTime,
          source: AppHealthDataSource.technogym,
          sourceAppName: 'Technogym Mywellness',
        ));
      }

      // Add distance if available (for cardio workouts)
      if (workout.distanceMeters != null && workout.distanceMeters! > 0) {
        dataPoints.add(AppHealthDataPoint(
          id: '${workout.id}_distance',
          type: AppHealthDataType.distanceWalkingRunning,
          value: workout.distanceMeters!.toDouble(),
          unit: AppHealthDataUnit.meter,
          timestamp: workout.startTime,
          dateFrom: workout.startTime,
          dateTo: workout.endTime ?? workout.startTime,
          source: AppHealthDataSource.technogym,
          sourceAppName: 'Technogym Mywellness',
        ));
      }

      // Add average heart rate if available
      if (workout.averageHeartRate != null) {
        dataPoints.add(AppHealthDataPoint(
          id: '${workout.id}_hr',
          type: AppHealthDataType.heartRate,
          value: workout.averageHeartRate!.toDouble(),
          unit: AppHealthDataUnit.beatsPerMinute,
          timestamp: workout.startTime,
          dateFrom: workout.startTime,
          dateTo: workout.endTime ?? workout.startTime,
          source: AppHealthDataSource.technogym,
          sourceAppName: 'Technogym Mywellness',
        ));
      }
    }

    return dataPoints;
  }
}

/// Represents a Technogym workout session
class TechnogymWorkout {
  final String id;
  final DateTime startTime;
  final DateTime? endTime;
  final String? type; // e.g., "cardio", "strength", "functional"
  final String? equipmentType; // e.g., "treadmill", "bike", "chest_press"
  final int? durationMinutes;
  final int? caloriesBurned;
  final double? distanceMeters;
  final int? averageHeartRate;
  final int? maxHeartRate;
  final List<TechnogymExercise>? exercises;
  final Map<String, dynamic>? metadata;

  TechnogymWorkout({
    required this.id,
    required this.startTime,
    this.endTime,
    this.type,
    this.equipmentType,
    this.durationMinutes,
    this.caloriesBurned,
    this.distanceMeters,
    this.averageHeartRate,
    this.maxHeartRate,
    this.exercises,
    this.metadata,
  });

  factory TechnogymWorkout.fromJson(Map<String, dynamic> json) {
    return TechnogymWorkout(
      id: json['id']?.toString() ?? '',
      startTime: DateTime.parse(json['startTime'] ?? json['start_time']),
      endTime: json['endTime'] != null || json['end_time'] != null
          ? DateTime.parse(json['endTime'] ?? json['end_time'])
          : null,
      type: json['type'],
      equipmentType: json['equipmentType'] ?? json['equipment_type'],
      durationMinutes: json['durationMinutes'] ?? json['duration_minutes'],
      caloriesBurned: json['caloriesBurned'] ?? json['calories_burned'],
      distanceMeters: (json['distanceMeters'] ?? json['distance_meters'])?.toDouble(),
      averageHeartRate: json['averageHeartRate'] ?? json['average_heart_rate'],
      maxHeartRate: json['maxHeartRate'] ?? json['max_heart_rate'],
      exercises: (json['exercises'] as List?)
          ?.map((e) => TechnogymExercise.fromJson(e))
          .toList(),
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'type': type,
      'equipmentType': equipmentType,
      'durationMinutes': durationMinutes,
      'caloriesBurned': caloriesBurned,
      'distanceMeters': distanceMeters,
      'averageHeartRate': averageHeartRate,
      'maxHeartRate': maxHeartRate,
      'exercises': exercises?.map((e) => e.toJson()).toList(),
      'metadata': metadata,
    };
  }
}

/// Represents a Technogym exercise within a workout
class TechnogymExercise {
  final String id;
  final String name;
  final String? muscleGroup;
  final String? equipmentName;
  final int? sets;
  final int? reps;
  final double? weightKg;
  final int? durationSeconds;
  final int? caloriesBurned;
  final DateTime? performedAt;

  TechnogymExercise({
    required this.id,
    required this.name,
    this.muscleGroup,
    this.equipmentName,
    this.sets,
    this.reps,
    this.weightKg,
    this.durationSeconds,
    this.caloriesBurned,
    this.performedAt,
  });

  factory TechnogymExercise.fromJson(Map<String, dynamic> json) {
    return TechnogymExercise(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      muscleGroup: json['muscleGroup'] ?? json['muscle_group'],
      equipmentName: json['equipmentName'] ?? json['equipment_name'],
      sets: json['sets'],
      reps: json['reps'],
      weightKg: (json['weightKg'] ?? json['weight_kg'])?.toDouble(),
      durationSeconds: json['durationSeconds'] ?? json['duration_seconds'],
      caloriesBurned: json['caloriesBurned'] ?? json['calories_burned'],
      performedAt: json['performedAt'] != null || json['performed_at'] != null
          ? DateTime.parse(json['performedAt'] ?? json['performed_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'muscleGroup': muscleGroup,
      'equipmentName': equipmentName,
      'sets': sets,
      'reps': reps,
      'weightKg': weightKg,
      'durationSeconds': durationSeconds,
      'caloriesBurned': caloriesBurned,
      'performedAt': performedAt?.toIso8601String(),
    };
  }

  /// Get a formatted string of the exercise (e.g., "Chest Press: 3x12 @ 60kg")
  String get formattedString {
    final parts = <String>[name];

    if (sets != null && reps != null) {
      parts.add('${sets}x$reps');
    }

    if (weightKg != null) {
      parts.add('@ ${weightKg!.toStringAsFixed(1)}kg');
    }

    return parts.join(' ');
  }
}

/// Represents a daily activity summary from Technogym
class TechnogymActivitySummary {
  final DateTime date;
  final int? totalWorkouts;
  final int? totalDurationMinutes;
  final int? totalCaloriesBurned;
  final double? totalDistanceMeters;
  final int? strengthWorkouts;
  final int? cardioWorkouts;
  final Map<String, int>? muscleGroupBreakdown;
  final Map<String, int>? equipmentUsage;

  TechnogymActivitySummary({
    required this.date,
    this.totalWorkouts,
    this.totalDurationMinutes,
    this.totalCaloriesBurned,
    this.totalDistanceMeters,
    this.strengthWorkouts,
    this.cardioWorkouts,
    this.muscleGroupBreakdown,
    this.equipmentUsage,
  });

  factory TechnogymActivitySummary.fromJson(Map<String, dynamic> json) {
    return TechnogymActivitySummary(
      date: DateTime.parse(json['date']),
      totalWorkouts: json['totalWorkouts'] ?? json['total_workouts'],
      totalDurationMinutes: json['totalDurationMinutes'] ?? json['total_duration_minutes'],
      totalCaloriesBurned: json['totalCaloriesBurned'] ?? json['total_calories_burned'],
      totalDistanceMeters: (json['totalDistanceMeters'] ?? json['total_distance_meters'])?.toDouble(),
      strengthWorkouts: json['strengthWorkouts'] ?? json['strength_workouts'],
      cardioWorkouts: json['cardioWorkouts'] ?? json['cardio_workouts'],
      muscleGroupBreakdown: (json['muscleGroupBreakdown'] ?? json['muscle_group_breakdown'])
          ?.cast<String, int>(),
      equipmentUsage: (json['equipmentUsage'] ?? json['equipment_usage'])
          ?.cast<String, int>(),
    );
  }

  /// Get percentage of cardio vs strength workouts
  double get cardioPercentage {
    final total = (cardioWorkouts ?? 0) + (strengthWorkouts ?? 0);
    if (total == 0) return 0;
    return (cardioWorkouts ?? 0) / total * 100;
  }

  double get strengthPercentage {
    final total = (cardioWorkouts ?? 0) + (strengthWorkouts ?? 0);
    if (total == 0) return 0;
    return (strengthWorkouts ?? 0) / total * 100;
  }
}
