import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../../shared/models/auth_response.dart';

/// Manages JWT tokens with automatic refresh and secure storage
class TokenManager {
  static final TokenManager _instance = TokenManager._internal();
  factory TokenManager() => _instance;

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final Dio _dio = Dio();
  
  Timer? _refreshTimer;
  StreamController<TokenState>? _tokenStateController;
  
  TokenManager._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  /// Stream of token state changes
  Stream<TokenState> get tokenStateStream {
    _tokenStateController ??= StreamController<TokenState>.broadcast();
    return _tokenStateController!.stream;
  }

  /// Initialize token manager and start auto-refresh
  Future<void> initialize() async {
    await _scheduleTokenRefresh();
  }

  /// Store tokens securely
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required int expiresIn,
    Map<String, String>? additionalData,
  }) async {
    try {
      await _secureStorage.write(key: 'access_token', value: accessToken);
      await _secureStorage.write(key: 'refresh_token', value: refreshToken);
      
      final expiryTime = DateTime.now().add(Duration(seconds: expiresIn));
      await _secureStorage.write(key: 'token_expiry', value: expiryTime.toIso8601String());
      
      // Store additional data if provided
      if (additionalData != null) {
        for (final entry in additionalData.entries) {
          await _secureStorage.write(key: entry.key, value: entry.value);
        }
      }
      
      _notifyTokenState(TokenState.valid);
      await _scheduleTokenRefresh();
    } catch (e) {
      debugPrint('Error saving tokens: $e');
      _notifyTokenState(TokenState.error);
      throw TokenManagerException('Failed to save tokens: $e');
    }
  }

  /// Get current access token
  Future<String?> getAccessToken() async {
    try {
      // Check if token needs refresh
      if (await _needsRefresh()) {
        await refreshTokens();
      }
      
      return await _secureStorage.read(key: 'access_token');
    } catch (e) {
      debugPrint('Error getting access token: $e');
      return null;
    }
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _secureStorage.read(key: 'refresh_token');
    } catch (e) {
      debugPrint('Error getting refresh token: $e');
      return null;
    }
  }

  /// Refresh tokens
  Future<bool> refreshTokens() async {
    try {
      _notifyTokenState(TokenState.refreshing);
      
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) {
        _notifyTokenState(TokenState.expired);
        return false;
      }

      // Check if this is a Google-authenticated user
      final isGoogleSignedIn = await _secureStorage.read(key: 'google_signed_in') == 'true';
      
      final endpoint = isGoogleSignedIn 
          ? '/v2/auth/google/refresh'
          : '/auth/refresh';
      
      final response = await _dio.post(
        endpoint,
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200) {
        final authResponse = AuthResponse.fromJson(response.data);
        
        await saveTokens(
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          expiresIn: authResponse.expiresIn,
        );
        
        _notifyTokenState(TokenState.valid);
        return true;
      } else {
        _notifyTokenState(TokenState.expired);
        return false;
      }
    } on DioException catch (e) {
      debugPrint('Token refresh failed: $e');
      
      if (e.response?.statusCode == 401) {
        _notifyTokenState(TokenState.expired);
        await clearTokens();
      } else {
        _notifyTokenState(TokenState.error);
      }
      
      return false;
    } catch (e) {
      debugPrint('Unexpected error during token refresh: $e');
      _notifyTokenState(TokenState.error);
      return false;
    }
  }

  /// Clear all stored tokens
  Future<void> clearTokens() async {
    try {
      _cancelRefreshTimer();
      
      await _secureStorage.delete(key: 'access_token');
      await _secureStorage.delete(key: 'refresh_token');
      await _secureStorage.delete(key: 'token_expiry');
      await _secureStorage.delete(key: 'google_signed_in');
      await _secureStorage.delete(key: 'user_id');
      await _secureStorage.delete(key: 'user_email');
      await _secureStorage.delete(key: 'user_name');
      await _secureStorage.delete(key: 'user_photo');
      
      _notifyTokenState(TokenState.cleared);
    } catch (e) {
      debugPrint('Error clearing tokens: $e');
      throw TokenManagerException('Failed to clear tokens: $e');
    }
  }

  /// Check if tokens are valid
  Future<bool> hasValidTokens() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) return false;
      
      return !(await _needsRefresh());
    } catch (e) {
      return false;
    }
  }

  /// Get token expiry time
  Future<DateTime?> getTokenExpiry() async {
    try {
      final expiryString = await _secureStorage.read(key: 'token_expiry');
      if (expiryString == null) return null;
      
      return DateTime.parse(expiryString);
    } catch (e) {
      return null;
    }
  }

  /// Add authorization header to Dio instance
  Future<void> configureAuthorizationHeader(Dio dio) async {
    final token = await getAccessToken();
    if (token != null) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  /// Create Dio interceptor for automatic token refresh
  InterceptorsWrapper createAuthInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try to refresh token
          final refreshed = await refreshTokens();
          if (refreshed) {
            // Retry the request with new token
            final token = await getAccessToken();
            if (token != null) {
              error.requestOptions.headers['Authorization'] = 'Bearer $token';
              
              try {
                final response = await _dio.fetch(error.requestOptions);
                handler.resolve(response);
                return;
              } catch (e) {
                handler.next(error);
              }
            }
          }
        }
        handler.next(error);
      },
    );
  }

  // Private helper methods

  Future<bool> _needsRefresh() async {
    try {
      final expiryString = await _secureStorage.read(key: 'token_expiry');
      if (expiryString == null) return true;
      
      final expiry = DateTime.parse(expiryString);
      // Refresh if token expires in less than 5 minutes
      return DateTime.now().isAfter(expiry.subtract(const Duration(minutes: 5)));
    } catch (e) {
      return true;
    }
  }

  Future<void> _scheduleTokenRefresh() async {
    _cancelRefreshTimer();
    
    final expiry = await getTokenExpiry();
    if (expiry == null) return;
    
    // Schedule refresh 5 minutes before expiry
    final refreshTime = expiry.subtract(const Duration(minutes: 5));
    final now = DateTime.now();
    
    if (refreshTime.isAfter(now)) {
      final duration = refreshTime.difference(now);
      _refreshTimer = Timer(duration, () async {
        await refreshTokens();
      });
      
      debugPrint('Token refresh scheduled for: $refreshTime');
    }
  }

  void _cancelRefreshTimer() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  void _notifyTokenState(TokenState state) {
    if (_tokenStateController?.hasListener ?? false) {
      _tokenStateController!.add(state);
    }
  }

  /// Dispose resources
  void dispose() {
    _cancelRefreshTimer();
    _tokenStateController?.close();
    _tokenStateController = null;
  }
}

/// Token state enum
enum TokenState {
  valid,
  refreshing,
  expired,
  error,
  cleared,
}

/// Token manager exception
class TokenManagerException implements Exception {
  final String message;
  
  TokenManagerException(this.message);
  
  @override
  String toString() => 'TokenManagerException: $message';
}