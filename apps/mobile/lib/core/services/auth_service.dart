import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:io' show Platform;
import '../constants/app_constants.dart';
import '../../shared/models/user_model.dart';
import '../../shared/models/auth_response.dart';

/// Provider for AuthService
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;

  final Dio _dio = Dio();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  UserModel? _currentUser;

  /// Get the current authenticated user
  UserModel? get currentUser => _currentUser;

  AuthService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens securely
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          if (firstName != null) 'first_name': firstName,
          if (lastName != null) 'last_name': lastName,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens securely
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> signOut() async {
    try {
      // Sign out from Google if signed in
      await signOutFromGoogle();

      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken != null) {
        await _dio.post(
          '/auth/logout',
          options: Options(
            headers: {'Authorization': 'Bearer $accessToken'},
          ),
        );
      }
    } catch (e) {
      // Handle error but continue with local cleanup
    } finally {
      // Clear stored tokens
      await _secureStorage.delete(key: 'access_token');
      await _secureStorage.delete(key: 'refresh_token');
      _currentUser = null;
    }
  }

  Future<UserModel?> getCurrentUser() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) return null;

      final response = await _dio.get(
        '/auth/profile',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return UserModel.fromJson(response.data);
    } catch (e) {
      return null;
    }
  }

  Future<AuthResponse> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Update stored tokens
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        return data['message'] as String;
      }
      return 'Authentication failed';
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      return 'Receive timeout';
    } else if (error.type == DioExceptionType.connectionError) {
      return 'Connection error';
    } else {
      return 'An unexpected error occurred';
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _dio.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> signInWithGoogle() async {
    try {
      // Initialize GoogleSignIn (google_sign_in 7.x API)
      final googleSignIn = GoogleSignIn.instance;
      await googleSignIn.initialize(
        serverClientId: _getServerClientId(),
      );

      // Authenticate with Google (v7 uses authenticate() instead of signIn())
      final authResult = await googleSignIn.authenticate();
      if (authResult == null) {
        throw Exception('Google sign in was cancelled by user');
      }

      // Get user info directly from auth result
      final email = authResult.email;
      final displayName = authResult.displayName;
      final photoUrl = authResult.photoUrl;

      // Request authorization for scopes to get access token
      final authorization = await authResult.authorizationClient.authorizeScopes(
        ['email', 'profile', 'openid'],
      );

      // Send to backend for verification and user creation/login
      final response = await _dio.post(
        '/auth/google',
        data: {
          'accessToken': authorization.accessToken,
          'email': email,
          'displayName': displayName,
          'photoUrl': photoUrl,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Store tokens securely
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);

      _currentUser = authResponse.user;
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw Exception('Google Sign In failed: $e');
    }
  }

  String? _getServerClientId() {
    if (Platform.isAndroid) {
      final clientId = AppConstants.googleAndroidClientId;
      if (clientId.isEmpty) {
        throw Exception('Google Android Client ID not configured. Please set GOOGLE_ANDROID_CLIENT_ID environment variable.');
      }
      return clientId;
    } else if (Platform.isIOS) {
      final clientId = AppConstants.googleIOSClientId;
      if (clientId.isEmpty) {
        throw Exception('Google iOS Client ID not configured. Please set GOOGLE_IOS_CLIENT_ID environment variable.');
      }
      return clientId;
    }
    throw Exception('Unsupported platform for Google Sign In');
  }

  Future<void> signOutFromGoogle() async {
    try {
      final googleSignIn = GoogleSignIn.instance;
      await googleSignIn.signOut();
    } catch (e) {
      // Silently handle sign out errors
    }
  }
}

 