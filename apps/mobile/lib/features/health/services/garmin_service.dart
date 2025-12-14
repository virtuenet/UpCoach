import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import '../../../core/config/app_config.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/health_data_point.dart';

// ignore_for_file: unused_import

/// Garmin Connect API OAuth 1.0a Service
///
/// Implements OAuth 1.0a authentication and data fetching for Garmin Connect API.
/// Reference: https://developer.garmin.com/gc-developer-program/activity-api/
///
/// OAuth 1.0a requires signature generation using HMAC-SHA1
class GarminService {
  static const String _requestTokenUrl =
      'https://connectapi.garmin.com/oauth-service/oauth/request_token';
  static const String _accessTokenUrl =
      'https://connectapi.garmin.com/oauth-service/oauth/access_token';
  static const String _authorizeUrl =
      'https://connect.garmin.com/oauthConfirm';
  static const String _apiBaseUrl =
      'https://apis.garmin.com';
  static const String _callbackScheme = 'upcoach';
  static const String _callbackUrl = '$_callbackScheme://garmin/callback';

  final SecureStorage _secureStorage;
  final Dio _dio;

  // Storage keys
  static const String _accessTokenKey = 'garmin_access_token';
  static const String _accessTokenSecretKey = 'garmin_access_token_secret';
  static const String _userIdKey = 'garmin_user_id';

  // Temporary storage during OAuth flow
  String? _requestToken;
  String? _requestTokenSecret;

  GarminService(this._secureStorage) : _dio = Dio() {
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
  }

  // ============================================================================
  // OAuth 1.0a Authentication
  // ============================================================================

  /// Initiate OAuth 1.0a authorization flow
  Future<bool> connect() async {
    try {
      final consumerKey = appConfig.garminConsumerKey;
      if (consumerKey.isEmpty) {
        debugPrint('Garmin consumer key not configured');
        return false;
      }

      // Step 1: Get request token
      final requestTokenObtained = await _getRequestToken();
      if (!requestTokenObtained) {
        debugPrint('Failed to obtain Garmin request token');
        return false;
      }

      // Step 2: Redirect user to authorization URL
      final authUrl = '$_authorizeUrl?oauth_token=$_requestToken';

      final result = await FlutterWebAuth2.authenticate(
        url: authUrl,
        callbackUrlScheme: _callbackScheme,
      );

      // Extract oauth_verifier from callback
      final uri = Uri.parse(result);
      final oauthVerifier = uri.queryParameters['oauth_verifier'];

      if (oauthVerifier == null || oauthVerifier.isEmpty) {
        debugPrint('No oauth_verifier received from Garmin');
        return false;
      }

      // Step 3: Exchange request token for access token
      return await _getAccessToken(oauthVerifier);
    } catch (e) {
      debugPrint('Garmin OAuth error: $e');
      return false;
    }
  }

  /// Step 1: Get request token
  Future<bool> _getRequestToken() async {
    try {
      final consumerKey = appConfig.garminConsumerKey;
      final consumerSecret = appConfig.garminConsumerSecret;

      final oauthParams = {
        'oauth_callback': _callbackUrl,
        'oauth_consumer_key': consumerKey,
        'oauth_nonce': _generateNonce(),
        'oauth_signature_method': 'HMAC-SHA1',
        'oauth_timestamp': _getTimestamp(),
        'oauth_version': '1.0',
      };

      // Generate signature
      final signature = _generateSignature(
        'POST',
        _requestTokenUrl,
        oauthParams,
        consumerSecret,
        '', // No token secret yet
      );

      oauthParams['oauth_signature'] = signature;

      // Build Authorization header
      final authHeader = _buildAuthorizationHeader(oauthParams);

      final response = await _dio.post(
        _requestTokenUrl,
        options: Options(
          headers: {'Authorization': authHeader},
        ),
      );

      if (response.statusCode == 200) {
        final responseParams = Uri.splitQueryString(response.data as String);
        _requestToken = responseParams['oauth_token'];
        _requestTokenSecret = responseParams['oauth_token_secret'];
        return _requestToken != null && _requestTokenSecret != null;
      }
      return false;
    } catch (e) {
      debugPrint('Error getting Garmin request token: $e');
      return false;
    }
  }

  /// Step 3: Exchange request token for access token
  Future<bool> _getAccessToken(String oauthVerifier) async {
    try {
      final consumerKey = appConfig.garminConsumerKey;
      final consumerSecret = appConfig.garminConsumerSecret;

      final oauthParams = {
        'oauth_consumer_key': consumerKey,
        'oauth_nonce': _generateNonce(),
        'oauth_signature_method': 'HMAC-SHA1',
        'oauth_timestamp': _getTimestamp(),
        'oauth_token': _requestToken!,
        'oauth_verifier': oauthVerifier,
        'oauth_version': '1.0',
      };

      // Generate signature
      final signature = _generateSignature(
        'POST',
        _accessTokenUrl,
        oauthParams,
        consumerSecret,
        _requestTokenSecret!,
      );

      oauthParams['oauth_signature'] = signature;

      // Build Authorization header
      final authHeader = _buildAuthorizationHeader(oauthParams);

      final response = await _dio.post(
        _accessTokenUrl,
        options: Options(
          headers: {'Authorization': authHeader},
        ),
      );

      if (response.statusCode == 200) {
        final responseParams = Uri.splitQueryString(response.data as String);
        final accessToken = responseParams['oauth_token'];
        final accessTokenSecret = responseParams['oauth_token_secret'];

        if (accessToken != null && accessTokenSecret != null) {
          await _secureStorage.write(_accessTokenKey, accessToken);
          await _secureStorage.write(
            _accessTokenSecretKey,
            accessTokenSecret,
          );

          // Clear temporary tokens
          _requestToken = null;
          _requestTokenSecret = null;

          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('Error getting Garmin access token: $e');
      return false;
    }
  }

  /// Make an authenticated API request
  Future<Response<T>?> _makeAuthenticatedRequest<T>(
    String method,
    String url, {
    Map<String, dynamic>? queryParameters,
    dynamic data,
  }) async {
    try {
      final accessToken = await _secureStorage.read(_accessTokenKey);
      final accessTokenSecret =
          await _secureStorage.read(_accessTokenSecretKey);

      if (accessToken == null || accessTokenSecret == null) {
        debugPrint('Not authenticated with Garmin');
        return null;
      }

      final consumerKey = appConfig.garminConsumerKey;
      final consumerSecret = appConfig.garminConsumerSecret;

      final oauthParams = {
        'oauth_consumer_key': consumerKey,
        'oauth_nonce': _generateNonce(),
        'oauth_signature_method': 'HMAC-SHA1',
        'oauth_timestamp': _getTimestamp(),
        'oauth_token': accessToken,
        'oauth_version': '1.0',
      };

      // Include query parameters in signature base string
      final allParams = <String, dynamic>{...oauthParams};
      if (queryParameters != null) {
        allParams.addAll(queryParameters.map((k, v) => MapEntry(k, v.toString())));
      }

      // Generate signature
      final signature = _generateSignature(
        method,
        url,
        allParams.map((k, v) => MapEntry(k, v.toString())),
        consumerSecret,
        accessTokenSecret,
      );

      oauthParams['oauth_signature'] = signature;

      // Build Authorization header
      final authHeader = _buildAuthorizationHeader(oauthParams);

      final response = await _dio.request<T>(
        url,
        options: Options(
          method: method,
          headers: {'Authorization': authHeader},
        ),
        queryParameters: queryParameters,
        data: data,
      );

      return response;
    } catch (e) {
      debugPrint('Garmin API request error: $e');
      return null;
    }
  }

  /// Disconnect from Garmin
  Future<void> disconnect() async {
    await _secureStorage.deleteKey(_accessTokenKey);
    await _secureStorage.deleteKey(_accessTokenSecretKey);
    await _secureStorage.deleteKey(_userIdKey);
  }

  /// Check if connected to Garmin
  Future<bool> isConnected() async {
    final token = await _secureStorage.read(_accessTokenKey);
    return token != null && token.isNotEmpty;
  }

  // ============================================================================
  // OAuth 1.0a Signature Generation
  // ============================================================================

  /// Generate OAuth 1.0a signature using HMAC-SHA1
  String _generateSignature(
    String method,
    String url,
    Map<String, String> params,
    String consumerSecret,
    String tokenSecret,
  ) {
    // Sort parameters and encode
    final sortedParams = SplayTreeMap<String, String>.from(params);
    final paramString = sortedParams.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');

    // Create signature base string
    final signatureBase = [
      method.toUpperCase(),
      Uri.encodeComponent(url),
      Uri.encodeComponent(paramString),
    ].join('&');

    // Create signing key
    final signingKey =
        '${Uri.encodeComponent(consumerSecret)}&${Uri.encodeComponent(tokenSecret)}';

    // Generate HMAC-SHA1 signature
    final hmac = Hmac(sha1, utf8.encode(signingKey));
    final digest = hmac.convert(utf8.encode(signatureBase));

    return base64.encode(digest.bytes);
  }

  /// Build OAuth Authorization header
  String _buildAuthorizationHeader(Map<String, String> params) {
    final headerParams = params.entries
        .map((e) =>
            '${Uri.encodeComponent(e.key)}="${Uri.encodeComponent(e.value)}"')
        .join(', ');
    return 'OAuth $headerParams';
  }

  /// Generate a random nonce
  String _generateNonce() {
    final random = Random.secure();
    final values = List<int>.generate(32, (i) => random.nextInt(256));
    return base64Url.encode(values).replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
  }

  /// Get current Unix timestamp
  String _getTimestamp() {
    return (DateTime.now().millisecondsSinceEpoch ~/ 1000).toString();
  }

  // ============================================================================
  // API Data Fetching
  // ============================================================================

  /// Get user ID
  Future<String?> getUserId() async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/user/id',
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final userId = response!.data!['userId']?.toString();
      if (userId != null) {
        await _secureStorage.write(_userIdKey, userId);
      }
      return userId;
    }
    return null;
  }

  /// Get daily summaries
  Future<List<GarminDailySummary>> getDailySummaries({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/dailies',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final summaries = response!.data!['dailies'] as List<dynamic>? ?? [];
      return summaries
          .map((json) => GarminDailySummary.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get activities
  Future<List<GarminActivity>> getActivities({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/activities',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final activities = response!.data!['activities'] as List<dynamic>? ?? [];
      return activities
          .map((json) => GarminActivity.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get sleep data
  Future<List<GarminSleep>> getSleepData({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/sleeps',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final sleeps = response!.data!['sleeps'] as List<dynamic>? ?? [];
      return sleeps
          .map((json) => GarminSleep.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get body composition data
  Future<List<GarminBodyComposition>> getBodyComposition({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/bodyComps',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final bodyComps = response!.data!['bodyComps'] as List<dynamic>? ?? [];
      return bodyComps
          .map((json) => GarminBodyComposition.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get stress data
  Future<List<GarminStress>> getStressData({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/stressDetails',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final stressData = response!.data!['stressDetails'] as List<dynamic>? ?? [];
      return stressData
          .map((json) => GarminStress.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get respiration data
  Future<List<GarminRespiration>> getRespirationData({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/respirations',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final respirations =
          response!.data!['respirations'] as List<dynamic>? ?? [];
      return respirations
          .map((json) => GarminRespiration.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get pulse ox data (SpO2)
  Future<List<GarminPulseOx>> getPulseOxData({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _makeAuthenticatedRequest<Map<String, dynamic>>(
      'GET',
      '$_apiBaseUrl/wellness-api/rest/pulseOx',
      queryParameters: {
        'uploadStartTimeInSeconds': startDate.millisecondsSinceEpoch ~/ 1000,
        'uploadEndTimeInSeconds': endDate.millisecondsSinceEpoch ~/ 1000,
      },
    );

    if (response?.statusCode == 200 && response?.data != null) {
      final pulseOxData = response!.data!['pulseOx'] as List<dynamic>? ?? [];
      return pulseOxData
          .map((json) => GarminPulseOx.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}

// ============================================================================
// Garmin Data Models
// ============================================================================

class GarminDailySummary {
  final int calendarDate;
  final int steps;
  final double? distanceInMeters;
  final int? activeKilocalories;
  final int? restingHeartRateInBeatsPerMinute;
  final int? averageHeartRateInBeatsPerMinute;
  final int? maxHeartRateInBeatsPerMinute;
  final int? minHeartRateInBeatsPerMinute;
  final int? floorsClimbed;
  final int? moderateIntensityDurationInSeconds;
  final int? vigorousIntensityDurationInSeconds;
  final int? highlyActiveSeconds;
  final int? activeSeconds;
  final int? sedentarySeconds;

  const GarminDailySummary({
    required this.calendarDate,
    required this.steps,
    this.distanceInMeters,
    this.activeKilocalories,
    this.restingHeartRateInBeatsPerMinute,
    this.averageHeartRateInBeatsPerMinute,
    this.maxHeartRateInBeatsPerMinute,
    this.minHeartRateInBeatsPerMinute,
    this.floorsClimbed,
    this.moderateIntensityDurationInSeconds,
    this.vigorousIntensityDurationInSeconds,
    this.highlyActiveSeconds,
    this.activeSeconds,
    this.sedentarySeconds,
  });

  factory GarminDailySummary.fromJson(Map<String, dynamic> json) {
    return GarminDailySummary(
      calendarDate: json['calendarDate'] as int,
      steps: json['steps'] as int? ?? 0,
      distanceInMeters: (json['distanceInMeters'] as num?)?.toDouble(),
      activeKilocalories: json['activeKilocalories'] as int?,
      restingHeartRateInBeatsPerMinute:
          json['restingHeartRateInBeatsPerMinute'] as int?,
      averageHeartRateInBeatsPerMinute:
          json['averageHeartRateInBeatsPerMinute'] as int?,
      maxHeartRateInBeatsPerMinute:
          json['maxHeartRateInBeatsPerMinute'] as int?,
      minHeartRateInBeatsPerMinute:
          json['minHeartRateInBeatsPerMinute'] as int?,
      floorsClimbed: json['floorsClimbed'] as int?,
      moderateIntensityDurationInSeconds:
          json['moderateIntensityDurationInSeconds'] as int?,
      vigorousIntensityDurationInSeconds:
          json['vigorousIntensityDurationInSeconds'] as int?,
      highlyActiveSeconds: json['highlyActiveSeconds'] as int?,
      activeSeconds: json['activeSeconds'] as int?,
      sedentarySeconds: json['sedentarySeconds'] as int?,
    );
  }
}

class GarminActivity {
  final String activityId;
  final String activityType;
  final int startTimeInSeconds;
  final int? durationInSeconds;
  final double? distanceInMeters;
  final int? activeKilocalories;
  final int? averageHeartRateInBeatsPerMinute;
  final int? maxHeartRateInBeatsPerMinute;
  final double? averageSpeedInMetersPerSecond;
  final double? maxSpeedInMetersPerSecond;
  final int? steps;
  final double? averageRunCadenceInStepsPerMinute;
  final double? maxRunCadenceInStepsPerMinute;

  const GarminActivity({
    required this.activityId,
    required this.activityType,
    required this.startTimeInSeconds,
    this.durationInSeconds,
    this.distanceInMeters,
    this.activeKilocalories,
    this.averageHeartRateInBeatsPerMinute,
    this.maxHeartRateInBeatsPerMinute,
    this.averageSpeedInMetersPerSecond,
    this.maxSpeedInMetersPerSecond,
    this.steps,
    this.averageRunCadenceInStepsPerMinute,
    this.maxRunCadenceInStepsPerMinute,
  });

  factory GarminActivity.fromJson(Map<String, dynamic> json) {
    return GarminActivity(
      activityId: json['activityId'] as String? ?? '',
      activityType: json['activityType'] as String? ?? 'unknown',
      startTimeInSeconds: json['startTimeInSeconds'] as int,
      durationInSeconds: json['durationInSeconds'] as int?,
      distanceInMeters: (json['distanceInMeters'] as num?)?.toDouble(),
      activeKilocalories: json['activeKilocalories'] as int?,
      averageHeartRateInBeatsPerMinute:
          json['averageHeartRateInBeatsPerMinute'] as int?,
      maxHeartRateInBeatsPerMinute:
          json['maxHeartRateInBeatsPerMinute'] as int?,
      averageSpeedInMetersPerSecond:
          (json['averageSpeedInMetersPerSecond'] as num?)?.toDouble(),
      maxSpeedInMetersPerSecond:
          (json['maxSpeedInMetersPerSecond'] as num?)?.toDouble(),
      steps: json['steps'] as int?,
      averageRunCadenceInStepsPerMinute:
          (json['averageRunCadenceInStepsPerMinute'] as num?)?.toDouble(),
      maxRunCadenceInStepsPerMinute:
          (json['maxRunCadenceInStepsPerMinute'] as num?)?.toDouble(),
    );
  }
}

class GarminSleep {
  final int startTimeInSeconds;
  final int? durationInSeconds;
  final int? deepSleepDurationInSeconds;
  final int? lightSleepDurationInSeconds;
  final int? remSleepDurationInSeconds;
  final int? awakeDurationInSeconds;
  final int? overallSleepScore;
  final double? averageRespirationValue;
  final double? lowestRespirationValue;
  final double? highestRespirationValue;
  final double? averageSpO2Value;
  final double? lowestSpO2Value;
  final double? avgSleepStress;

  const GarminSleep({
    required this.startTimeInSeconds,
    this.durationInSeconds,
    this.deepSleepDurationInSeconds,
    this.lightSleepDurationInSeconds,
    this.remSleepDurationInSeconds,
    this.awakeDurationInSeconds,
    this.overallSleepScore,
    this.averageRespirationValue,
    this.lowestRespirationValue,
    this.highestRespirationValue,
    this.averageSpO2Value,
    this.lowestSpO2Value,
    this.avgSleepStress,
  });

  factory GarminSleep.fromJson(Map<String, dynamic> json) {
    return GarminSleep(
      startTimeInSeconds: json['startTimeInSeconds'] as int,
      durationInSeconds: json['durationInSeconds'] as int?,
      deepSleepDurationInSeconds: json['deepSleepDurationInSeconds'] as int?,
      lightSleepDurationInSeconds: json['lightSleepDurationInSeconds'] as int?,
      remSleepDurationInSeconds: json['remSleepDurationInSeconds'] as int?,
      awakeDurationInSeconds: json['awakeDurationInSeconds'] as int?,
      overallSleepScore: json['overallSleepScore'] as int?,
      averageRespirationValue:
          (json['averageRespirationValue'] as num?)?.toDouble(),
      lowestRespirationValue:
          (json['lowestRespirationValue'] as num?)?.toDouble(),
      highestRespirationValue:
          (json['highestRespirationValue'] as num?)?.toDouble(),
      averageSpO2Value: (json['averageSpO2Value'] as num?)?.toDouble(),
      lowestSpO2Value: (json['lowestSpO2Value'] as num?)?.toDouble(),
      avgSleepStress: (json['avgSleepStress'] as num?)?.toDouble(),
    );
  }
}

class GarminBodyComposition {
  final int measurementTimeInSeconds;
  final int? weightInGrams;
  final double? bodyFatPercentage;
  final double? bmi;
  final int? muscleMassInGrams;
  final int? boneMassInGrams;
  final double? bodyWaterPercentage;
  final int? metabolicAge;
  final int? visceralFat;

  const GarminBodyComposition({
    required this.measurementTimeInSeconds,
    this.weightInGrams,
    this.bodyFatPercentage,
    this.bmi,
    this.muscleMassInGrams,
    this.boneMassInGrams,
    this.bodyWaterPercentage,
    this.metabolicAge,
    this.visceralFat,
  });

  factory GarminBodyComposition.fromJson(Map<String, dynamic> json) {
    return GarminBodyComposition(
      measurementTimeInSeconds: json['measurementTimeInSeconds'] as int,
      weightInGrams: json['weightInGrams'] as int?,
      bodyFatPercentage: (json['bodyFatPercentage'] as num?)?.toDouble(),
      bmi: (json['bmi'] as num?)?.toDouble(),
      muscleMassInGrams: json['muscleMassInGrams'] as int?,
      boneMassInGrams: json['boneMassInGrams'] as int?,
      bodyWaterPercentage: (json['bodyWaterPercentage'] as num?)?.toDouble(),
      metabolicAge: json['metabolicAge'] as int?,
      visceralFat: json['visceralFat'] as int?,
    );
  }
}

class GarminStress {
  final int calendarDate;
  final int? averageStressLevel;
  final int? maxStressLevel;
  final String? stressQualifier;

  const GarminStress({
    required this.calendarDate,
    this.averageStressLevel,
    this.maxStressLevel,
    this.stressQualifier,
  });

  factory GarminStress.fromJson(Map<String, dynamic> json) {
    return GarminStress(
      calendarDate: json['calendarDate'] as int,
      averageStressLevel: json['averageStressLevel'] as int?,
      maxStressLevel: json['maxStressLevel'] as int?,
      stressQualifier: json['stressQualifier'] as String?,
    );
  }
}

class GarminRespiration {
  final int startTimeInSeconds;
  final double? avgWakingRespirationValue;
  final double? highestRespirationValue;
  final double? lowestRespirationValue;

  const GarminRespiration({
    required this.startTimeInSeconds,
    this.avgWakingRespirationValue,
    this.highestRespirationValue,
    this.lowestRespirationValue,
  });

  factory GarminRespiration.fromJson(Map<String, dynamic> json) {
    return GarminRespiration(
      startTimeInSeconds: json['startTimeInSeconds'] as int,
      avgWakingRespirationValue:
          (json['avgWakingRespirationValue'] as num?)?.toDouble(),
      highestRespirationValue:
          (json['highestRespirationValue'] as num?)?.toDouble(),
      lowestRespirationValue:
          (json['lowestRespirationValue'] as num?)?.toDouble(),
    );
  }
}

class GarminPulseOx {
  final int calendarDate;
  final double? averageSpO2;
  final double? lowestSpO2;
  final double? latestSpO2;

  const GarminPulseOx({
    required this.calendarDate,
    this.averageSpO2,
    this.lowestSpO2,
    this.latestSpO2,
  });

  factory GarminPulseOx.fromJson(Map<String, dynamic> json) {
    return GarminPulseOx(
      calendarDate: json['calendarDate'] as int,
      averageSpO2: (json['averageSpO2'] as num?)?.toDouble(),
      lowestSpO2: (json['lowestSpO2'] as num?)?.toDouble(),
      latestSpO2: (json['latestSpO2'] as num?)?.toDouble(),
    );
  }
}

// ============================================================================
// Provider
// ============================================================================

final garminServiceProvider = Provider<GarminService>((ref) {
  final secureStorage = SecureStorage();
  return GarminService(secureStorage);
});
