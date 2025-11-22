import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'token_manager.dart';

/// Custom Dio interceptor for handling authentication and token refresh
class AuthInterceptor extends InterceptorsWrapper {
  final TokenManager _tokenManager;
  final Dio _dio;
  bool _isRefreshing = false;
  final List<RequestOptions> _pendingRequests = [];

  AuthInterceptor({
    required TokenManager tokenManager,
    required Dio dio,
  })  : _tokenManager = tokenManager,
        _dio = dio;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Skip auth for certain endpoints
    if (_shouldSkipAuth(options.path)) {
      handler.next(options);
      return;
    }

    // Add authorization header
    final token = await _tokenManager.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Add additional headers
    options.headers['X-Platform'] = 'mobile';
    options.headers['X-App-Version'] = '1.0.0';
    
    debugPrint('REQUEST[${options.method}] => PATH: ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    debugPrint('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
    
    if (err.response?.statusCode == 401) {
      // Token might be expired, try to refresh
      if (!_isRefreshing) {
        _isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          final refreshed = await _tokenManager.refreshTokens();
          
          if (refreshed) {
            _isRefreshing = false;
            
            // Retry the original request
            final token = await _tokenManager.getAccessToken();
            if (token != null) {
              err.requestOptions.headers['Authorization'] = 'Bearer $token';
              
              try {
                final response = await _dio.fetch(err.requestOptions);
                handler.resolve(response);
                
                // Retry all pending requests
                for (final request in _pendingRequests) {
                  request.headers['Authorization'] = 'Bearer $token';
                  _dio.fetch(request);
                }
                _pendingRequests.clear();
                
                return;
              } catch (e) {
                handler.next(err);
              }
            }
          } else {
            _isRefreshing = false;
            _pendingRequests.clear();
            
            // Token refresh failed, user needs to re-authenticate
            _handleAuthenticationError(err, handler);
          }
        } catch (e) {
          _isRefreshing = false;
          _pendingRequests.clear();
          _handleAuthenticationError(err, handler);
        }
      } else {
        // Token refresh is already in progress, queue this request
        _pendingRequests.add(err.requestOptions);
      }
    } else {
      handler.next(err);
    }
  }

  bool _shouldSkipAuth(String path) {
    // Skip auth for public endpoints
    final publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/google/signin',
      '/auth/apple/signin',
      '/health',
      '/status',
    ];
    
    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }

  void _handleAuthenticationError(DioException err, ErrorInterceptorHandler handler) {
    // Clear tokens and notify listeners
    _tokenManager.clearTokens();
    
    // Create a custom error for authentication failure
    final authError = DioException(
      requestOptions: err.requestOptions,
      error: 'Authentication failed. Please sign in again.',
      type: DioExceptionType.badResponse,
      response: Response(
        requestOptions: err.requestOptions,
        statusCode: 401,
        data: {
          'error': 'authentication_required',
          'message': 'Your session has expired. Please sign in again.',
        },
      ),
    );
    
    handler.next(authError);
  }
}

/// Logging interceptor for debugging
class LoggingInterceptor extends InterceptorsWrapper {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('╔══════════════════════════════════════════════════════════════');
      debugPrint('║ REQUEST');
      debugPrint('╟──────────────────────────────────────────────────────────────');
      debugPrint('║ ${options.method} ${options.path}');
      debugPrint('║ Headers: ${options.headers}');
      if (options.data != null) {
        debugPrint('║ Body: ${options.data}');
      }
      debugPrint('╚══════════════════════════════════════════════════════════════');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('╔══════════════════════════════════════════════════════════════');
      debugPrint('║ RESPONSE');
      debugPrint('╟──────────────────────────────────────────────────────────────');
      debugPrint('║ Status: ${response.statusCode}');
      debugPrint('║ Path: ${response.requestOptions.path}');
      if (response.data != null) {
        final data = response.data;
        if (data is Map || data is List) {
          debugPrint('║ Data: ${data.toString().substring(0, data.toString().length.clamp(0, 500))}...');
        } else {
          debugPrint('║ Data: $data');
        }
      }
      debugPrint('╚══════════════════════════════════════════════════════════════');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('╔══════════════════════════════════════════════════════════════');
      debugPrint('║ ERROR');
      debugPrint('╟──────────────────────────────────────────────────────────────');
      debugPrint('║ Status: ${err.response?.statusCode}');
      debugPrint('║ Path: ${err.requestOptions.path}');
      debugPrint('║ Message: ${err.message}');
      if (err.response?.data != null) {
        debugPrint('║ Response: ${err.response?.data}');
      }
      debugPrint('╚══════════════════════════════════════════════════════════════');
    }
    handler.next(err);
  }
}

/// Network connectivity interceptor
class NetworkInterceptor extends InterceptorsWrapper {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout) {
      final networkError = DioException(
        requestOptions: err.requestOptions,
        error: 'No internet connection',
        type: DioExceptionType.connectionError,
        response: Response(
          requestOptions: err.requestOptions,
          statusCode: 0,
          data: {
            'error': 'network_error',
            'message': 'Please check your internet connection and try again.',
          },
        ),
      );
      handler.next(networkError);
    } else {
      handler.next(err);
    }
  }
}