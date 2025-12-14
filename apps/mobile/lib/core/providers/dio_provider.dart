import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../storage/secure_storage.dart';
import '../utils/logger.dart';

/// Provider for Dio HTTP client
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();

  // Base configuration
  dio.options.baseUrl = AppConstants.apiUrl;
  dio.options.connectTimeout =
      const Duration(seconds: AppConstants.requestTimeoutSeconds);
  dio.options.receiveTimeout =
      const Duration(seconds: AppConstants.requestTimeoutSeconds);
  dio.options.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth interceptor with token refresh (must be first)
  dio.interceptors.add(AuthInterceptor(dio, SecureStorage()));

  // Add logging interceptor
  dio.interceptors.add(_LoggingInterceptor());

  // Add error interceptor
  dio.interceptors.add(_ErrorInterceptor());

  return dio;
});

/// Callback type for when authentication fails and user needs to re-login
typedef OnAuthFailedCallback = void Function();

/// Interceptor that handles authentication and automatic token refresh
class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorage _secureStorage;
  bool _isRefreshing = false;
  final _refreshCompleter = <Completer<String?>>[];

  /// Optional callback when auth completely fails (e.g., navigate to login)
  static OnAuthFailedCallback? onAuthFailed;

  AuthInterceptor(this._dio, this._secureStorage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for public endpoints
    if (_isPublicEndpoint(options.path)) {
      handler.next(options);
      return;
    }

    // Add access token to request
    final accessToken = await _secureStorage.getAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Only handle 401 Unauthorized errors
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }

    // Skip if this is a refresh or auth endpoint to avoid infinite loop
    if (_isAuthEndpoint(err.requestOptions.path)) {
      handler.next(err);
      return;
    }

    try {
      // Attempt to refresh the token
      final newAccessToken = await _refreshAccessToken();

      if (newAccessToken != null) {
        // Retry the original request with the new token
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final response = await _dio.fetch(retryOptions);
        handler.resolve(response);
        return;
      }
    } catch (e) {
      debugPrint('Token refresh failed: $e');
    }

    // Token refresh failed - notify app to handle logout
    await _handleAuthFailure();
    handler.next(err);
  }

  /// Refreshes the access token using the refresh token.
  /// Handles concurrent requests by queuing them.
  Future<String?> _refreshAccessToken() async {
    // If already refreshing, wait for the current refresh to complete
    if (_isRefreshing) {
      final completer = Completer<String?>();
      _refreshCompleter.add(completer);
      return completer.future;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      // Create a new Dio instance to avoid interceptor recursion
      final refreshDio = Dio(BaseOptions(
        baseUrl: AppConstants.apiUrl,
        connectTimeout:
            const Duration(seconds: AppConstants.requestTimeoutSeconds),
        receiveTimeout:
            const Duration(seconds: AppConstants.requestTimeoutSeconds),
      ));

      final response = await refreshDio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      final newAccessToken = response.data['access_token'] as String?;
      final newRefreshToken = response.data['refresh_token'] as String?;

      if (newAccessToken != null) {
        await _secureStorage.setAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _secureStorage.setRefreshToken(newRefreshToken);
        }

        // Notify all waiting requests
        for (final completer in _refreshCompleter) {
          completer.complete(newAccessToken);
        }
        _refreshCompleter.clear();

        debugPrint('Token refreshed successfully');
        return newAccessToken;
      }

      return null;
    } catch (e) {
      debugPrint('Token refresh error: $e');

      // Notify all waiting requests that refresh failed
      for (final completer in _refreshCompleter) {
        completer.complete(null);
      }
      _refreshCompleter.clear();

      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  /// Handles complete authentication failure
  Future<void> _handleAuthFailure() async {
    // Clear stored tokens
    await _secureStorage.clearAll();

    // Notify the app to handle logout (e.g., navigate to login screen)
    if (onAuthFailed != null) {
      onAuthFailed!();
    }

    debugPrint('Authentication failed - tokens cleared');
  }

  /// Check if the endpoint is public (doesn't require auth)
  bool _isPublicEndpoint(String path) {
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/google',
      '/health',
      '/version',
    ];
    return publicPaths.any((p) => path.contains(p));
  }

  /// Check if the endpoint is an auth endpoint (to avoid infinite refresh loop)
  bool _isAuthEndpoint(String path) {
    const authPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/auth/forgot-password',
    ];
    return authPaths.any((p) => path.contains(p));
  }
}

/// Logging interceptor for debugging
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    logger.d('🌐 ${options.method} ${options.uri}');
    if (options.data != null) {
      logger.d('📤 Request data: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logger.d('✅ ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logger.e(
        '❌ ${err.response?.statusCode ?? 'No Status'} ${err.requestOptions.uri}');
    logger.e('Error: ${err.message}');
    handler.next(err);
  }
}

/// Error handling interceptor
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Log the error
    logger.e('API Error: ${err.message}', error: err);
    handler.next(err);
  }
}
