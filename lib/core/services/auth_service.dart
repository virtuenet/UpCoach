import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import '../../shared/models/user_model.dart';
import '../../shared/models/auth_response.dart';

class AuthService {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  
  AuthService({
    Dio? dio,
    FlutterSecureStorage? storage,
  }) : _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage();

  // Configure Dio with base URL and interceptors
  void _configureDio() {
    _dio.options.baseUrl = AppConstants.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    
    // Add auth interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['Content-Type'] = 'application/json';
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Try to refresh token
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry the request
              final token = await getAccessToken();
              error.requestOptions.headers['Authorization'] = 'Bearer $token';
              final response = await _dio.request(
                error.requestOptions.path,
                data: error.requestOptions.data,
                queryParameters: error.requestOptions.queryParameters,
                options: Options(
                  method: error.requestOptions.method,
                  headers: error.requestOptions.headers,
                ),
              );
              handler.resolve(response);
              return;
            }
            // Token refresh failed, logout user
            await logout();
          }
          handler.next(error);
        },
      ),
    );
  }

  // Register user
  Future<AuthResponse> register(RegisterRequest request) async {
    _configureDio();
    try {
      final response = await _dio.post('/auth/register', data: request.toJson());
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens
      await _storeTokens(authResponse.tokens);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Login user
  Future<AuthResponse> login(LoginRequest request) async {
    _configureDio();
    try {
      final response = await _dio.post('/auth/login', data: request.toJson());
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens
      await _storeTokens(authResponse.tokens);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Get current user profile
  Future<User> getCurrentUser() async {
    _configureDio();
    try {
      final response = await _dio.get('/users/me');
      return User.fromJson(response.data['user']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Refresh access token
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) return false;
      
      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });
      
      final tokens = AuthTokens.fromJson(response.data['tokens']);
      await _storeTokens(tokens);
      
      return true;
    } catch (e) {
      return false;
    }
  }

  // Logout user
  Future<void> logout() async {
    _configureDio();
    try {
      await _dio.post('/auth/logout');
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await _clearTokens();
    }
  }

  // Store tokens securely
  Future<void> _storeTokens(AuthTokens tokens) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: tokens.accessToken);
    await _storage.write(key: AppConstants.refreshTokenKey, value: tokens.refreshToken);
  }

  // Get stored access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: AppConstants.accessTokenKey);
  }

  // Get stored refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: AppConstants.refreshTokenKey);
  }

  // Clear stored tokens
  Future<void> _clearTokens() async {
    await _storage.delete(key: AppConstants.accessTokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
    await _storage.delete(key: AppConstants.userIdKey);
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null;
  }

  // Handle API errors
  String _handleError(DioException error) {
    if (error.response?.data != null) {
      final errorData = error.response!.data;
      if (errorData is Map<String, dynamic> && errorData['error'] != null) {
        return errorData['error']['message'] ?? 'Unknown error occurred';
      }
    }
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timeout. Please check your internet connection.';
      case DioExceptionType.receiveTimeout:
        return 'Server response timeout. Please try again.';
      case DioExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
} 