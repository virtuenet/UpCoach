import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:local_auth_ios/local_auth_ios.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Biometric authentication types supported
enum BiometricType {
  faceId,
  touchId,
  fingerprint,
  iris,
  none,
}

/// Authentication method
enum AuthMethod {
  biometric,
  pin,
  password,
}

/// Authentication result
class AuthResult {
  final bool success;
  final AuthMethod? method;
  final String? error;
  final bool isLocked;

  const AuthResult({
    required this.success,
    this.method,
    this.error,
    this.isLocked = false,
  });

  factory AuthResult.success(AuthMethod method) {
    return AuthResult(success: true, method: method);
  }

  factory AuthResult.failure(String error, {bool isLocked = false}) {
    return AuthResult(
      success: false,
      error: error,
      isLocked: isLocked,
    );
  }
}

/// Biometric authentication configuration
class BiometricConfig {
  final int maxFailedAttempts;
  final Duration lockoutDuration;
  final bool allowPinFallback;
  final bool allowPasswordFallback;
  final String biometricPrompt;
  final String pinPrompt;

  const BiometricConfig({
    this.maxFailedAttempts = 5,
    this.lockoutDuration = const Duration(minutes: 5),
    this.allowPinFallback = true,
    this.allowPasswordFallback = true,
    this.biometricPrompt = 'Authenticate to access UpCoach',
    this.pinPrompt = 'Enter your PIN',
  });
}

/// Service for handling biometric authentication with fallback options
class BiometricAuthenticationService {
  static const String _pinKey = 'user_pin_hash';
  static const String _passwordKey = 'user_password_hash';
  static const String _failedAttemptsKey = 'failed_attempts';
  static const String _lockoutTimeKey = 'lockout_time';
  static const String _biometricEnabledKey = 'biometric_enabled';

  final LocalAuthentication _localAuth;
  final FlutterSecureStorage _secureStorage;
  final BiometricConfig config;

  BiometricAuthenticationService({
    LocalAuthentication? localAuth,
    FlutterSecureStorage? secureStorage,
    this.config = const BiometricConfig(),
  })  : _localAuth = localAuth ?? LocalAuthentication(),
        _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  // ============================================================================
  // Biometric Availability Checking
  // ============================================================================

  /// Check if biometric authentication is available
  Future<bool> canCheckBiometrics() async {
    try {
      return await _localAuth.canCheckBiometrics;
    } catch (e) {
      debugPrint('Error checking biometric availability: $e');
      return false;
    }
  }

  /// Check if device is supported
  Future<bool> isDeviceSupported() async {
    try {
      return await _localAuth.isDeviceSupported();
    } catch (e) {
      debugPrint('Error checking device support: $e');
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      final availableBiometrics = await _localAuth.getAvailableBiometrics();
      return availableBiometrics.map(_mapBiometricType).toList();
    } catch (e) {
      debugPrint('Error getting available biometrics: $e');
      return [BiometricType.none];
    }
  }

  BiometricType _mapBiometricType(BiometricType type) {
    if (Platform.isIOS) {
      switch (type) {
        case BiometricType.face:
          return BiometricType.faceId;
        case BiometricType.fingerprint:
          return BiometricType.touchId;
        default:
          return BiometricType.none;
      }
    } else {
      switch (type) {
        case BiometricType.fingerprint:
          return BiometricType.fingerprint;
        case BiometricType.face:
          return BiometricType.faceId;
        case BiometricType.iris:
          return BiometricType.iris;
        default:
          return BiometricType.none;
      }
    }
  }

  // ============================================================================
  // Biometric Authentication
  // ============================================================================

  /// Authenticate using biometrics
  Future<AuthResult> authenticateWithBiometrics({
    String? customMessage,
    bool stickyAuth = true,
  }) async {
    try {
      // Check if locked
      if (await _isLockedOut()) {
        final remainingTime = await _getRemainingLockoutTime();
        return AuthResult.failure(
          'Account locked. Try again in ${remainingTime.inMinutes} minutes',
          isLocked: true,
        );
      }

      // Check if biometric is enabled
      final isEnabled = await isBiometricEnabled();
      if (!isEnabled) {
        return AuthResult.failure('Biometric authentication not enabled');
      }

      // Authenticate
      final authenticated = await _localAuth.authenticate(
        localizedReason: customMessage ?? config.biometricPrompt,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
        authMessages: _getAuthMessages(),
      );

      if (authenticated) {
        await _resetFailedAttempts();
        return AuthResult.success(AuthMethod.biometric);
      } else {
        await _incrementFailedAttempts();
        return AuthResult.failure('Authentication failed');
      }
    } on PlatformException catch (e) {
      await _incrementFailedAttempts();
      return AuthResult.failure(_handlePlatformException(e));
    } catch (e) {
      return AuthResult.failure('Authentication error: $e');
    }
  }

  List<AuthMessages> _getAuthMessages() {
    return [
      if (Platform.isAndroid)
        const AndroidAuthMessages(
          signInTitle: 'Biometric Authentication',
          cancelButton: 'Cancel',
          biometricHint: 'Verify your identity',
          biometricNotRecognized: 'Not recognized. Try again.',
          biometricSuccess: 'Authenticated successfully',
        ),
      if (Platform.isIOS)
        const IOSAuthMessages(
          cancelButton: 'Cancel',
          goToSettingsButton: 'Settings',
          goToSettingsDescription: 'Please set up biometric authentication',
          lockOut: 'Biometric authentication is disabled. Please lock and unlock your device.',
        ),
    ];
  }

  String _handlePlatformException(PlatformException e) {
    switch (e.code) {
      case 'NotAvailable':
        return 'Biometric authentication not available';
      case 'NotEnrolled':
        return 'No biometric enrolled. Please set up in device settings';
      case 'LockedOut':
        return 'Too many failed attempts. Please try again later';
      case 'PermanentlyLockedOut':
        return 'Biometric authentication permanently locked. Use device password';
      case 'PasscodeNotSet':
        return 'Please set up device passcode first';
      default:
        return 'Authentication error: ${e.message}';
    }
  }

  // ============================================================================
  // PIN/Password Fallback
  // ============================================================================

  /// Set up PIN
  Future<bool> setupPin(String pin) async {
    try {
      if (pin.length < 4) {
        throw ArgumentError('PIN must be at least 4 digits');
      }

      final hash = _hashCredential(pin);
      await _secureStorage.write(key: _pinKey, value: hash);
      return true;
    } catch (e) {
      debugPrint('Error setting up PIN: $e');
      return false;
    }
  }

  /// Authenticate with PIN
  Future<AuthResult> authenticateWithPin(String pin) async {
    try {
      // Check if locked
      if (await _isLockedOut()) {
        final remainingTime = await _getRemainingLockoutTime();
        return AuthResult.failure(
          'Account locked. Try again in ${remainingTime.inMinutes} minutes',
          isLocked: true,
        );
      }

      final storedHash = await _secureStorage.read(key: _pinKey);
      if (storedHash == null) {
        return AuthResult.failure('PIN not set up');
      }

      final hash = _hashCredential(pin);
      if (hash == storedHash) {
        await _resetFailedAttempts();
        return AuthResult.success(AuthMethod.pin);
      } else {
        await _incrementFailedAttempts();
        return AuthResult.failure('Incorrect PIN');
      }
    } catch (e) {
      return AuthResult.failure('PIN authentication error: $e');
    }
  }

  /// Set up password
  Future<bool> setupPassword(String password) async {
    try {
      if (password.length < 8) {
        throw ArgumentError('Password must be at least 8 characters');
      }

      final hash = _hashCredential(password);
      await _secureStorage.write(key: _passwordKey, value: hash);
      return true;
    } catch (e) {
      debugPrint('Error setting up password: $e');
      return false;
    }
  }

  /// Authenticate with password
  Future<AuthResult> authenticateWithPassword(String password) async {
    try {
      // Check if locked
      if (await _isLockedOut()) {
        final remainingTime = await _getRemainingLockoutTime();
        return AuthResult.failure(
          'Account locked. Try again in ${remainingTime.inMinutes} minutes',
          isLocked: true,
        );
      }

      final storedHash = await _secureStorage.read(key: _passwordKey);
      if (storedHash == null) {
        return AuthResult.failure('Password not set up');
      }

      final hash = _hashCredential(password);
      if (hash == storedHash) {
        await _resetFailedAttempts();
        return AuthResult.success(AuthMethod.password);
      } else {
        await _incrementFailedAttempts();
        return AuthResult.failure('Incorrect password');
      }
    } catch (e) {
      return AuthResult.failure('Password authentication error: $e');
    }
  }

  String _hashCredential(String credential) {
    // In production, use a proper hashing algorithm like bcrypt or argon2
    // This is a simplified version
    return credential.hashCode.toString();
  }

  // ============================================================================
  // Failed Attempt Tracking and Lockout
  // ============================================================================

  Future<void> _incrementFailedAttempts() async {
    final attempts = await _getFailedAttempts();
    final newAttempts = attempts + 1;

    await _secureStorage.write(
      key: _failedAttemptsKey,
      value: newAttempts.toString(),
    );

    if (newAttempts >= config.maxFailedAttempts) {
      final lockoutTime = DateTime.now().add(config.lockoutDuration);
      await _secureStorage.write(
        key: _lockoutTimeKey,
        value: lockoutTime.toIso8601String(),
      );
    }
  }

  Future<void> _resetFailedAttempts() async {
    await _secureStorage.delete(key: _failedAttemptsKey);
    await _secureStorage.delete(key: _lockoutTimeKey);
  }

  Future<int> _getFailedAttempts() async {
    final attemptsStr = await _secureStorage.read(key: _failedAttemptsKey);
    return attemptsStr != null ? int.tryParse(attemptsStr) ?? 0 : 0;
  }

  Future<bool> _isLockedOut() async {
    final lockoutTimeStr = await _secureStorage.read(key: _lockoutTimeKey);
    if (lockoutTimeStr == null) return false;

    final lockoutTime = DateTime.parse(lockoutTimeStr);
    final isLocked = DateTime.now().isBefore(lockoutTime);

    if (!isLocked) {
      await _resetFailedAttempts();
    }

    return isLocked;
  }

  Future<Duration> _getRemainingLockoutTime() async {
    final lockoutTimeStr = await _secureStorage.read(key: _lockoutTimeKey);
    if (lockoutTimeStr == null) return Duration.zero;

    final lockoutTime = DateTime.parse(lockoutTimeStr);
    final remaining = lockoutTime.difference(DateTime.now());

    return remaining.isNegative ? Duration.zero : remaining;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /// Enable/disable biometric authentication
  Future<void> setBiometricEnabled(bool enabled) async {
    await _secureStorage.write(
      key: _biometricEnabledKey,
      value: enabled.toString(),
    );
  }

  /// Check if biometric authentication is enabled
  Future<bool> isBiometricEnabled() async {
    final enabled = await _secureStorage.read(key: _biometricEnabledKey);
    return enabled == 'true';
  }

  /// Check if PIN is set up
  Future<bool> isPinSetup() async {
    final pin = await _secureStorage.read(key: _pinKey);
    return pin != null;
  }

  /// Check if password is set up
  Future<bool> isPasswordSetup() async {
    final password = await _secureStorage.read(key: _passwordKey);
    return password != null;
  }

  /// Get authentication status
  Future<Map<String, dynamic>> getAuthStatus() async {
    return {
      'canCheckBiometrics': await canCheckBiometrics(),
      'isDeviceSupported': await isDeviceSupported(),
      'availableBiometrics': await getAvailableBiometrics(),
      'biometricEnabled': await isBiometricEnabled(),
      'pinSetup': await isPinSetup(),
      'passwordSetup': await isPasswordSetup(),
      'isLockedOut': await _isLockedOut(),
      'failedAttempts': await _getFailedAttempts(),
      'remainingLockoutTime': (await _getRemainingLockoutTime()).inSeconds,
    };
  }

  /// Reset all authentication settings
  Future<void> resetAuthentication() async {
    await _secureStorage.delete(key: _pinKey);
    await _secureStorage.delete(key: _passwordKey);
    await _secureStorage.delete(key: _biometricEnabledKey);
    await _resetFailedAttempts();
  }

  /// Dispose resources
  void dispose() {
    // Clean up if needed
  }
}
