import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../constants/app_constants.dart';
import '../../shared/models/auth_response.dart';
import '../../shared/models/user_model.dart';

/// Service for handling Google Sign-In authentication
class GoogleAuthService {
  static final GoogleAuthService _instance = GoogleAuthService._internal();
  factory GoogleAuthService() => _instance;

  final Dio _dio = Dio();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  
  // Configure Google Sign-In with required scopes
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'openid',
    ],
    // Server client ID for web/backend verification
    // This should be configured per environment
    serverClientId: kIsWeb 
        ? 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
        : null,
  );

  GoogleAuthService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    
    // Add request/response interceptors for debugging
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          debugPrint('REQUEST[${options.method}] => PATH: ${options.path}');
          handler.next(options);
        },
        onResponse: (response, handler) {
          debugPrint('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
          handler.next(response);
        },
        onError: (DioException e, handler) {
          debugPrint('ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
          handler.next(e);
        },
      ),
    );
  }

  /// Sign in with Google
  Future<AuthResponse> signIn() async {
    try {
      // Sign out any previous session for clean state
      await _googleSignIn.signOut();
      
      // Trigger the Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw GoogleAuthException(
          'Sign-in cancelled',
          GoogleAuthErrorCode.userCancelled,
        );
      }

      // Get authentication tokens
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.idToken == null) {
        throw GoogleAuthException(
          'Failed to obtain ID token',
          GoogleAuthErrorCode.tokenError,
        );
      }

      // Get device and app information
      final deviceInfo = await _getDeviceInfo();
      final appInfo = await _getAppInfo();
      
      // Send tokens to backend for verification
      final response = await _dio.post(
        '/v2/auth/google/signin',
        data: {
          'id_token': googleAuth.idToken,
          'access_token': googleAuth.accessToken,
          'client_info': {
            'platform': Platform.operatingSystem,
            'app_version': appInfo['version'],
            'app_build': appInfo['build'],
            'device_id': deviceInfo['id'],
            'device_model': deviceInfo['model'],
            'device_manufacturer': deviceInfo['manufacturer'],
            'os_version': deviceInfo['os_version'],
          },
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store authentication data securely
      await _storeAuthData(authResponse, googleUser);
      
      return authResponse;
    } on DioException catch (e) {
      await _googleSignIn.signOut();
      throw _handleDioError(e);
    } on GoogleAuthException {
      await _googleSignIn.signOut();
      rethrow;
    } catch (e) {
      await _googleSignIn.signOut();
      throw GoogleAuthException(
        'Unexpected error: ${e.toString()}',
        GoogleAuthErrorCode.unknown,
      );
    }
  }

  /// Silent sign in (automatic sign in if user previously signed in)
  Future<AuthResponse?> signInSilently() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signInSilently();
      
      if (googleUser == null) {
        return null;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.idToken == null) {
        return null;
      }

      final deviceInfo = await _getDeviceInfo();
      final appInfo = await _getAppInfo();
      
      final response = await _dio.post(
        '/v2/auth/google/signin',
        data: {
          'id_token': googleAuth.idToken,
          'access_token': googleAuth.accessToken,
          'client_info': {
            'platform': Platform.operatingSystem,
            'app_version': appInfo['version'],
            'app_build': appInfo['build'],
            'device_id': deviceInfo['id'],
            'device_model': deviceInfo['model'],
            'device_manufacturer': deviceInfo['manufacturer'],
            'os_version': deviceInfo['os_version'],
          },
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      await _storeAuthData(authResponse, googleUser);
      
      return authResponse;
    } catch (e) {
      debugPrint('Silent sign-in failed: $e');
      return null;
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _clearAuthData();
    } catch (e) {
      debugPrint('Error during Google sign out: $e');
      // Clear local data even if Google sign out fails
      await _clearAuthData();
    }
  }

  /// Disconnect Google account (revoke access)
  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
      await _clearAuthData();
    } catch (e) {
      debugPrint('Error during Google disconnect: $e');
      await _clearAuthData();
    }
  }

  /// Check if user is currently signed in with Google
  Future<bool> isSignedIn() async {
    final isSignedIn = await _googleSignIn.isSignedIn();
    final hasStoredToken = await _secureStorage.read(key: 'google_signed_in') == 'true';
    return isSignedIn && hasStoredToken;
  }

  /// Get current Google user
  GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;

  /// Refresh Google tokens
  Future<AuthResponse> refreshTokens() async {
    try {
      final refreshToken = await _secureStorage.read(key: 'refresh_token');
      if (refreshToken == null) {
        throw GoogleAuthException(
          'No refresh token available',
          GoogleAuthErrorCode.tokenError,
        );
      }

      final response = await _dio.post(
        '/v2/auth/google/refresh',
        data: {'refresh_token': refreshToken},
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Update stored tokens
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      
      // Update token expiry
      final expiryTime = DateTime.now().add(Duration(seconds: authResponse.expiresIn));
      await _secureStorage.write(key: 'token_expiry', value: expiryTime.toIso8601String());
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Validate current session
  Future<bool> validateSession() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) return false;

      final response = await _dio.get(
        '/v2/auth/session',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Private helper methods

  Future<Map<String, String>> _getDeviceInfo() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        return {
          'id': androidInfo.id,
          'model': androidInfo.model,
          'manufacturer': androidInfo.manufacturer,
          'os_version': 'Android ${androidInfo.version.release}',
        };
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        return {
          'id': iosInfo.identifierForVendor ?? 'unknown',
          'model': iosInfo.model,
          'manufacturer': 'Apple',
          'os_version': 'iOS ${iosInfo.systemVersion}',
        };
      }
      return {
        'id': 'unknown',
        'model': 'unknown',
        'manufacturer': 'unknown',
        'os_version': Platform.operatingSystem,
      };
    } catch (e) {
      return {
        'id': 'error',
        'model': 'error',
        'manufacturer': 'error',
        'os_version': 'error',
      };
    }
  }

  Future<Map<String, String>> _getAppInfo() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      return {
        'version': packageInfo.version,
        'build': packageInfo.buildNumber,
      };
    } catch (e) {
      return {
        'version': '1.0.0',
        'build': '1',
      };
    }
  }

  Future<void> _storeAuthData(AuthResponse authResponse, GoogleSignInAccount googleUser) async {
    await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
    await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
    await _secureStorage.write(key: 'google_signed_in', value: 'true');
    await _secureStorage.write(key: 'user_id', value: authResponse.user.id);
    await _secureStorage.write(key: 'user_email', value: googleUser.email);
    await _secureStorage.write(key: 'user_name', value: googleUser.displayName ?? '');
    await _secureStorage.write(key: 'user_photo', value: googleUser.photoUrl ?? '');
    
    // Store token expiry time
    final expiryTime = DateTime.now().add(Duration(seconds: authResponse.expiresIn));
    await _secureStorage.write(key: 'token_expiry', value: expiryTime.toIso8601String());
  }

  Future<void> _clearAuthData() async {
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
    await _secureStorage.delete(key: 'google_signed_in');
    await _secureStorage.delete(key: 'user_id');
    await _secureStorage.delete(key: 'user_email');
    await _secureStorage.delete(key: 'user_name');
    await _secureStorage.delete(key: 'user_photo');
    await _secureStorage.delete(key: 'token_expiry');
  }

  GoogleAuthException _handleDioError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final data = error.response!.data;
      
      String message = 'Authentication failed';
      if (data is Map<String, dynamic>) {
        message = data['message'] ?? message;
      }
      
      GoogleAuthErrorCode code;
      switch (statusCode) {
        case 401:
          code = GoogleAuthErrorCode.unauthorized;
          break;
        case 403:
          code = GoogleAuthErrorCode.forbidden;
          break;
        case 404:
          code = GoogleAuthErrorCode.notFound;
          break;
        case 429:
          code = GoogleAuthErrorCode.rateLimited;
          break;
        case 500:
        case 502:
        case 503:
          code = GoogleAuthErrorCode.serverError;
          break;
        default:
          code = GoogleAuthErrorCode.unknown;
      }
      
      return GoogleAuthException(message, code);
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return GoogleAuthException('Connection timeout', GoogleAuthErrorCode.networkError);
    } else if (error.type == DioExceptionType.receiveTimeout) {
      return GoogleAuthException('Request timeout', GoogleAuthErrorCode.networkError);
    } else if (error.type == DioExceptionType.connectionError) {
      return GoogleAuthException('No internet connection', GoogleAuthErrorCode.networkError);
    } else {
      return GoogleAuthException('An unexpected error occurred', GoogleAuthErrorCode.unknown);
    }
  }
}

/// Custom exception for Google authentication errors
class GoogleAuthException implements Exception {
  final String message;
  final GoogleAuthErrorCode code;

  GoogleAuthException(this.message, this.code);

  @override
  String toString() => 'GoogleAuthException: $message (code: ${code.name})';
}

/// Error codes for Google authentication
enum GoogleAuthErrorCode {
  userCancelled,
  tokenError,
  networkError,
  unauthorized,
  forbidden,
  notFound,
  rateLimited,
  serverError,
  unknown,
}