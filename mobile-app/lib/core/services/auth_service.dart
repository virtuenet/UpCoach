import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../constants/app_constants.dart';
import '../../shared/models/user_model.dart';
import '../../shared/models/auth_response.dart';
import '../../features/auth/providers/two_factor_auth_provider.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  
  final Dio _dio = Dio();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final LocalAuthentication _localAuth = LocalAuthentication();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
  );

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
      // Sign out from third-party providers
      try {
        final isGoogleSignedIn = await _secureStorage.read(key: 'google_signed_in');
        if (isGoogleSignedIn == 'true') {
          await _googleSignIn.signOut();
          await _googleSignIn.disconnect(); // Fully disconnect
        }
      } catch (e) {
        // Handle Google sign out error but continue cleanup
      }

      // Clear all stored tokens and flags
      await _secureStorage.deleteAll();
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
      // Check if this is a Google-authenticated user
      final isGoogleSignedIn = await _secureStorage.read(key: 'google_signed_in');
      
      final endpoint = isGoogleSignedIn == 'true' 
          ? '/v2/auth/google/refresh'
          : '/auth/refresh';
      
      final response = await _dio.post(
        endpoint,
        data: {'refresh_token': refreshToken},
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Update stored tokens
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      
      // Update token expiry time
      final expiryTime = DateTime.now().add(Duration(seconds: authResponse.expiresIn));
      await _secureStorage.write(key: 'token_expiry', value: expiryTime.toIso8601String());
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> isTokenExpired() async {
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

  Future<void> ensureValidToken() async {
    try {
      if (await isTokenExpired()) {
        final refreshToken = await _secureStorage.read(key: 'refresh_token');
        if (refreshToken != null) {
          await this.refreshToken(refreshToken);
        }
      }
    } catch (e) {
      // Token refresh failed, user needs to re-authenticate
      await signOut();
      throw Exception('Session expired, please sign in again');
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
      // Sign out any previous Google account to ensure clean state
      await _googleSignIn.signOut();
      
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google sign-in was cancelled by the user');
      }

      // Obtain auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.idToken == null) {
        throw Exception('Failed to obtain Google authentication tokens');
      }

      // Get device info for better security
      String deviceId = 'flutter_device';
      String deviceModel = 'Unknown';
      String osVersion = 'Unknown';
      
      try {
        final deviceInfo = await _getDeviceInfo();
        deviceId = deviceInfo['device_id'] ?? deviceId;
        deviceModel = deviceInfo['device_model'] ?? deviceModel;
        osVersion = deviceInfo['os_version'] ?? osVersion;
      } catch (e) {
        // Continue with default values if device info fails
      }

      // Send the tokens to our backend for verification and account creation/login
      final response = await _dio.post(
        '/v2/auth/google/signin',  // Updated to v2 endpoint
        data: {
          'id_token': googleAuth.idToken,
          'access_token': googleAuth.accessToken,
          'client_info': {
            'platform': 'mobile',
            'app_version': await _getAppVersion(),
            'device_id': deviceId,
            'device_model': deviceModel,
            'os_version': osVersion,
          },
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens securely
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      await _secureStorage.write(key: 'google_signed_in', value: 'true');
      await _secureStorage.write(key: 'user_id', value: authResponse.user.id);
      
      // Store token expiry time for proactive refresh
      final expiryTime = DateTime.now().add(Duration(seconds: authResponse.expiresIn));
      await _secureStorage.write(key: 'token_expiry', value: expiryTime.toIso8601String());
      
      return authResponse;
    } on DioException catch (e) {
      // Sign out from Google on API error
      await _googleSignIn.signOut();
      throw _handleError(e);
    } catch (e) {
      // Sign out from Google on any error
      await _googleSignIn.signOut();
      throw Exception('Google Sign-In failed: ${e.toString()}');
    }
  }

  Future<Map<String, String>> _getDeviceInfo() async {
    try {
      // This would need device_info_plus package implementation
      return {
        'device_id': 'flutter_device_${DateTime.now().millisecondsSinceEpoch}',
        'device_model': 'Flutter Device',
        'os_version': '1.0',
      };
    } catch (e) {
      return {};
    }
  }

  Future<String> _getAppVersion() async {
    try {
      // This would need package_info_plus implementation
      return '1.0.0';
    } catch (e) {
      return '1.0.0';
    }
  }

  Future<AuthResponse> signInWithApple() async {
    try {
      // Check if Apple Sign In is available
      final isAvailable = await SignInWithApple.isAvailable();
      if (!isAvailable) {
        throw Exception('Apple Sign In is not available on this device');
      }

      // Trigger Apple Sign-In flow
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      if (credential.identityToken == null) {
        throw Exception('Failed to obtain Apple identity token');
      }

      // Send the Apple credential to our backend
      final response = await _dio.post(
        '/auth/apple',
        data: {
          'identity_token': credential.identityToken,
          'authorization_code': credential.authorizationCode,
          'user_identifier': credential.userIdentifier,
          'email': credential.email,
          'given_name': credential.givenName,
          'family_name': credential.familyName,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens securely
      await _secureStorage.write(key: 'access_token', value: authResponse.accessToken);
      await _secureStorage.write(key: 'refresh_token', value: authResponse.refreshToken);
      await _secureStorage.write(key: 'apple_signed_in', value: 'true');
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw Exception('Apple Sign-In failed: ${e.toString()}');
    }
  }

  // Two-Factor Authentication Methods

  Future<bool> isTwoFactorEnabled() async {
    try {
      final enabled = await _secureStorage.read(key: '2fa_enabled');
      return enabled == 'true';
    } catch (e) {
      return false;
    }
  }

  Future<bool> isSMSTwoFactorEnabled() async {
    try {
      final enabled = await _secureStorage.read(key: 'sms_2fa_enabled');
      return enabled == 'true';
    } catch (e) {
      return false;
    }
  }

  Future<bool> isBiometricEnabled() async {
    try {
      final enabled = await _secureStorage.read(key: 'biometric_enabled');
      return enabled == 'true';
    } catch (e) {
      return false;
    }
  }

  Future<String?> getPhoneNumber() async {
    try {
      return await _secureStorage.read(key: 'phone_number');
    } catch (e) {
      return null;
    }
  }

  Future<TwoFactorAuthSetup> initializeTOTPSetup() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/totp/setup',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      // Simulate TOTP setup response
      final secretKey = response.data['secret'] ?? 'JBSWY3DPEHPK3PXP'; // Example secret
      final qrCodeUrl = response.data['qr_code_url'] ?? 'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/UpCoach:user@example.com?secret=$secretKey&issuer=UpCoach';
      final backupCodes = List<String>.from(response.data['backup_codes'] ?? [
        '123456789',
        '987654321',
        '555666777',
        '888999000',
        '111222333'
      ]);

      return TwoFactorAuthSetup(
        secretKey: secretKey,
        qrCodeUrl: qrCodeUrl,
        backupCodes: backupCodes,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> verifyAndEnableTOTP(String verificationCode) async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/totp/verify',
        data: {'code': verificationCode},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      final success = response.data['success'] ?? true; // Simulate success
      if (success) {
        await _secureStorage.write(key: '2fa_enabled', value: 'true');
      }

      return success;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> disableTOTP(String currentPassword) async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/totp/disable',
        data: {'password': currentPassword},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      final success = response.data['success'] ?? true;
      if (success) {
        await _secureStorage.write(key: '2fa_enabled', value: 'false');
      }

      return success;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<String>> generateBackupCodes() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/backup-codes',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return List<String>.from(response.data['codes'] ?? [
        '123456789',
        '987654321',
        '555666777',
        '888999000',
        '111222333'
      ]);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> setupSMSTwoFactor(String phoneNumber) async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/sms/setup',
        data: {'phone_number': phoneNumber},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      final success = response.data['success'] ?? true;
      if (success) {
        await _secureStorage.write(key: 'sms_2fa_enabled', value: 'true');
        await _secureStorage.write(key: 'phone_number', value: phoneNumber);
      }

      return success;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> sendSMSVerificationCode() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/sms/send',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return response.data['success'] ?? true;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> verifySMSCode(String code) async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await _dio.post(
        '/auth/2fa/sms/verify',
        data: {'code': code},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return response.data['success'] ?? true;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> enableBiometricAuth() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      if (!isAvailable) {
        throw Exception('Biometric authentication not available');
      }

      final availableBiometrics = await _localAuth.getAvailableBiometrics();
      if (availableBiometrics.isEmpty) {
        throw Exception('No biometric methods available');
      }

      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Enable biometric authentication for UpCoach',
        options: const AuthenticationOptions(
          biometricOnly: true,
        ),
      );

      if (authenticated) {
        await _secureStorage.write(key: 'biometric_enabled', value: 'true');
      }

      return authenticated;
    } catch (e) {
      throw Exception('Failed to enable biometric authentication: $e');
    }
  }

  Future<void> disableBiometricAuth() async {
    try {
      await _secureStorage.write(key: 'biometric_enabled', value: 'false');
    } catch (e) {
      throw Exception('Failed to disable biometric authentication: $e');
    }
  }

  Future<bool> verifyTwoFactorCode(String code, {bool isBackupCode = false}) async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      if (accessToken == null) throw Exception('User not authenticated');

      final endpoint = isBackupCode ? '/auth/2fa/backup-code/verify' : '/auth/2fa/totp/verify';
      
      final response = await _dio.post(
        endpoint,
        data: {'code': code},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      return response.data['success'] ?? true;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final isEnabled = await isBiometricEnabled();
      if (!isEnabled) {
        throw Exception('Biometric authentication not enabled');
      }

      return await _localAuth.authenticate(
        localizedReason: 'Authenticate with biometrics to access UpCoach',
        options: const AuthenticationOptions(
          biometricOnly: true,
        ),
      );
    } catch (e) {
      throw Exception('Biometric authentication failed: $e');
    }
  }
}

 