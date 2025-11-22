import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';

/// Enhanced biometric authentication service with advanced security features
class BiometricAuthService {
  static final BiometricAuthService _instance = BiometricAuthService._internal();
  factory BiometricAuthService() => _instance;

  final LocalAuthentication _localAuth = LocalAuthentication();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: IOSAccessibility.biometricCurrentSet,
    ),
  );

  // Enhanced caching and security features
  bool? _isBiometricAvailable;
  List<BiometricType>? _availableBiometrics;
  StreamController<BiometricAuthEvent>? _eventController;
  Timer? _lockoutTimer;

  // Security constants
  static const int _maxFailedAttempts = 5;
  static const int _lockoutDurationMinutes = 15;
  static const String _storageKeyBiometricEnabled = 'biometric_enabled';
  static const String _storageKeyAuthAttempts = 'auth_attempts';
  static const String _storageKeyLastAuthTime = 'last_auth_time';
  static const String _storageKeySecureToken = 'secure_biometric_token';

  BiometricAuthService._internal();

  /// Initialize the service with enhanced security features
  Future<void> initialize() async {
    _eventController = StreamController<BiometricAuthEvent>.broadcast();
    await _checkLockoutStatus();
  }

  /// Stream of biometric authentication events
  Stream<BiometricAuthEvent> get authEvents => _eventController!.stream;

  /// Check if biometric authentication is available on the device
  Future<bool> isBiometricAvailable() async {
    try {
      // Return cached value if available
      if (_isBiometricAvailable != null) {
        return _isBiometricAvailable!;
      }

      final bool canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final bool isDeviceSupported = await _localAuth.isDeviceSupported();
      
      _isBiometricAvailable = canCheckBiometrics && isDeviceSupported;
      return _isBiometricAvailable!;
    } on PlatformException catch (e) {
      debugPrint('Error checking biometric availability: $e');
      _isBiometricAvailable = false;
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      if (_availableBiometrics != null) {
        return _availableBiometrics!;
      }

      if (await isBiometricAvailable()) {
        _availableBiometrics = await _localAuth.getAvailableBiometrics();
        return _availableBiometrics!;
      }
      
      return [];
    } on PlatformException catch (e) {
      debugPrint('Error getting available biometrics: $e');
      return [];
    }
  }

  /// Check if biometric authentication is enabled for the app
  Future<bool> isBiometricEnabled() async {
    try {
      final enabled = await _secureStorage.read(key: 'biometric_enabled');
      return enabled == 'true';
    } catch (e) {
      return false;
    }
  }

  /// Enable biometric authentication for the app
  Future<BiometricAuthResult> enableBiometric() async {
    try {
      if (!await isBiometricAvailable()) {
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.notAvailable,
          message: 'Biometric authentication is not available on this device',
        );
      }

      final authenticated = await authenticate(
        reason: 'Enable biometric authentication for UpCoach',
        useErrorDialogs: true,
      );

      if (authenticated.success) {
        await _secureStorage.write(key: 'biometric_enabled', value: 'true');
        await _storeBiometricCredentials();
        
        return BiometricAuthResult(
          success: true,
          message: 'Biometric authentication enabled successfully',
        );
      }

      return authenticated;
    } catch (e) {
      return BiometricAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        message: 'Failed to enable biometric authentication: $e',
      );
    }
  }

  /// Disable biometric authentication for the app
  Future<bool> disableBiometric() async {
    try {
      await _secureStorage.write(key: 'biometric_enabled', value: 'false');
      await _clearBiometricCredentials();
      return true;
    } catch (e) {
      debugPrint('Error disabling biometric: $e');
      return false;
    }
  }

  /// Authenticate using biometrics
  Future<BiometricAuthResult> authenticate({
    required String reason,
    bool useErrorDialogs = true,
    bool stickyAuth = true,
    bool biometricOnly = true,
  }) async {
    try {
      if (!await isBiometricAvailable()) {
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.notAvailable,
          message: 'Biometric authentication is not available',
        );
      }

      final bool authenticated = await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          useErrorDialogs: useErrorDialogs,
          stickyAuth: stickyAuth,
          biometricOnly: biometricOnly,
        ),
      );

      if (authenticated) {
        return BiometricAuthResult(
          success: true,
          message: 'Authentication successful',
        );
      } else {
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.failed,
          message: 'Authentication failed',
        );
      }
    } on PlatformException catch (e) {
      return _handlePlatformException(e);
    } catch (e) {
      return BiometricAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        message: 'An unexpected error occurred: $e',
      );
    }
  }

  /// Authenticate for app access (with stored credentials)
  Future<BiometricAuthResult> authenticateForAppAccess() async {
    try {
      if (!await isBiometricEnabled()) {
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.notEnabled,
          message: 'Biometric authentication is not enabled',
        );
      }

      final result = await authenticate(
        reason: 'Authenticate to access UpCoach',
        useErrorDialogs: true,
      );

      if (result.success) {
        // Restore stored credentials if needed
        await _restoreBiometricCredentials();
      }

      return result;
    } catch (e) {
      return BiometricAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        message: 'Failed to authenticate: $e',
      );
    }
  }

  /// Get biometric prompt message based on available biometrics
  Future<String> getBiometricPromptMessage() async {
    final biometrics = await getAvailableBiometrics();
    
    if (Platform.isIOS) {
      if (biometrics.contains(BiometricType.face)) {
        return 'Authenticate with Face ID to access UpCoach';
      } else if (biometrics.contains(BiometricType.fingerprint)) {
        return 'Authenticate with Touch ID to access UpCoach';
      }
    } else if (Platform.isAndroid) {
      if (biometrics.contains(BiometricType.face)) {
        return 'Authenticate with your face to access UpCoach';
      } else if (biometrics.contains(BiometricType.fingerprint)) {
        return 'Authenticate with your fingerprint to access UpCoach';
      } else if (biometrics.contains(BiometricType.iris)) {
        return 'Authenticate with iris scan to access UpCoach';
      }
    }
    
    return 'Authenticate with biometrics to access UpCoach';
  }

  /// Get user-friendly biometric type name
  Future<String> getBiometricTypeName() async {
    final biometrics = await getAvailableBiometrics();
    
    if (Platform.isIOS) {
      if (biometrics.contains(BiometricType.face)) {
        return 'Face ID';
      } else if (biometrics.contains(BiometricType.fingerprint)) {
        return 'Touch ID';
      }
    } else if (Platform.isAndroid) {
      if (biometrics.contains(BiometricType.face)) {
        return 'Face Unlock';
      } else if (biometrics.contains(BiometricType.fingerprint)) {
        return 'Fingerprint';
      } else if (biometrics.contains(BiometricType.iris)) {
        return 'Iris Scan';
      }
    }
    
    return 'Biometric Authentication';
  }

  /// Stop authentication (if supported)
  Future<bool> stopAuthentication() async {
    try {
      return await _localAuth.stopAuthentication();
    } catch (e) {
      debugPrint('Error stopping authentication: $e');
      return false;
    }
  }

  // Private helper methods

  Future<void> _storeBiometricCredentials() async {
    // Store encrypted credentials that can be accessed after biometric auth
    // This is a placeholder - in production, you'd encrypt these with biometric-derived keys
    final accessToken = await _secureStorage.read(key: 'access_token');
    if (accessToken != null) {
      await _secureStorage.write(
        key: 'biometric_access_token',
        value: accessToken,
      );
    }
  }

  Future<void> _restoreBiometricCredentials() async {
    // Restore credentials after successful biometric authentication
    final bioAccessToken = await _secureStorage.read(key: 'biometric_access_token');
    if (bioAccessToken != null) {
      await _secureStorage.write(
        key: 'access_token',
        value: bioAccessToken,
      );
    }
  }

  Future<void> _clearBiometricCredentials() async {
    await _secureStorage.delete(key: 'biometric_access_token');
  }

  BiometricAuthResult _handlePlatformException(PlatformException e) {
    debugPrint('Biometric authentication error: ${e.code} - ${e.message}');
    
    BiometricAuthError error;
    String message;
    
    switch (e.code) {
      case 'NotEnrolled':
        error = BiometricAuthError.notEnrolled;
        message = 'No biometrics enrolled. Please set up biometrics in your device settings.';
        break;
      case 'NotAvailable':
        error = BiometricAuthError.notAvailable;
        message = 'Biometric authentication is not available on this device.';
        break;
      case 'PasscodeNotSet':
        error = BiometricAuthError.passcodeNotSet;
        message = 'Please set up a device passcode first.';
        break;
      case 'LockedOut':
        error = BiometricAuthError.lockedOut;
        message = 'Too many failed attempts. Biometric authentication is locked.';
        break;
      case 'PermanentlyLockedOut':
        error = BiometricAuthError.permanentlyLockedOut;
        message = 'Biometric authentication is permanently locked. Please use device passcode.';
        break;
      case 'UserCanceled':
        error = BiometricAuthError.userCancelled;
        message = 'Authentication cancelled by user.';
        break;
      default:
        error = BiometricAuthError.unknown;
        message = e.message ?? 'An unknown error occurred';
    }
    
    return BiometricAuthResult(
      success: false,
      error: error,
      message: message,
    );
  }

  /// Enhanced authentication with security features
  Future<BiometricAuthResult> authenticateWithSecurity({
    required String reason,
    bool useErrorDialogs = true,
    bool stickyAuth = true,
    bool biometricOnly = false,
  }) async {
    try {
      // Check if locked out
      if (await _isLockedOut()) {
        final remainingTime = await _getRemainingLockoutTime();
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.lockedOut,
          message: 'Account locked due to failed attempts. Try again in ${remainingTime.inMinutes} minutes.',
        );
      }

      // Perform authentication
      final result = await authenticate(
        reason: reason,
        useErrorDialogs: useErrorDialogs,
        stickyAuth: stickyAuth,
        biometricOnly: biometricOnly,
      );

      if (result.success) {
        await _resetFailedAttempts();
        await _updateLastAuthTime();
        _eventController?.add(BiometricAuthEvent.authenticated);
      } else {
        await _incrementFailedAttempts();

        final failedAttempts = await _getFailedAttempts();
        if (failedAttempts >= _maxFailedAttempts) {
          await _initiateTemporaryLockout();
          _eventController?.add(BiometricAuthEvent.lockedOut);
          return BiometricAuthResult(
            success: false,
            error: BiometricAuthError.lockedOut,
            message: 'Too many failed attempts. Account locked for $_lockoutDurationMinutes minutes.',
          );
        }

        _eventController?.add(BiometricAuthEvent.failed);
      }

      return result;
    } catch (e) {
      return BiometricAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        message: 'Authentication error: $e',
      );
    }
  }

  /// Generate secure token for enhanced security
  Future<String> _generateSecureToken(String? userIdentifier) async {
    final deviceInfo = await _getDeviceInfo();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final randomBytes = List.generate(32, (i) => timestamp % 256);

    final tokenData = {
      'user_identifier': userIdentifier ?? 'anonymous',
      'device_info': deviceInfo,
      'timestamp': timestamp,
      'random': base64Encode(randomBytes),
    };

    final tokenJson = jsonEncode(tokenData);
    final tokenBytes = utf8.encode(tokenJson);
    final hash = sha256.convert(tokenBytes);

    return base64Encode(hash.bytes);
  }

  /// Get device information for security
  Future<Map<String, String>> _getDeviceInfo() async {
    return {
      'platform': Platform.operatingSystem,
      'version': Platform.operatingSystemVersion,
    };
  }

  /// Check if currently locked out
  Future<bool> _isLockedOut() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lockoutUntil = prefs.getInt('lockout_until');
      if (lockoutUntil == null) return false;

      final lockoutTime = DateTime.fromMillisecondsSinceEpoch(lockoutUntil);
      return DateTime.now().isBefore(lockoutTime);
    } catch (e) {
      return false;
    }
  }

  /// Get remaining lockout time
  Future<Duration> _getRemainingLockoutTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lockoutUntil = prefs.getInt('lockout_until');
      if (lockoutUntil == null) return Duration.zero;

      final lockoutTime = DateTime.fromMillisecondsSinceEpoch(lockoutUntil);
      final remaining = lockoutTime.difference(DateTime.now());
      return remaining.isNegative ? Duration.zero : remaining;
    } catch (e) {
      return Duration.zero;
    }
  }

  /// Initiate temporary lockout
  Future<void> _initiateTemporaryLockout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lockoutUntil = DateTime.now().add(const Duration(minutes: _lockoutDurationMinutes));
      await prefs.setInt('lockout_until', lockoutUntil.millisecondsSinceEpoch);

      _lockoutTimer?.cancel();
      _lockoutTimer = Timer(const Duration(minutes: _lockoutDurationMinutes), () {
        _eventController?.add(BiometricAuthEvent.lockoutExpired);
      });
    } catch (e) {
      debugPrint('Error initiating lockout: $e');
    }
  }

  /// Get failed attempts count
  Future<int> _getFailedAttempts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(_storageKeyAuthAttempts) ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /// Increment failed attempts
  Future<void> _incrementFailedAttempts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await _getFailedAttempts();
      await prefs.setInt(_storageKeyAuthAttempts, current + 1);
    } catch (e) {
      debugPrint('Error incrementing failed attempts: $e');
    }
  }

  /// Reset failed attempts
  Future<void> _resetFailedAttempts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKeyAuthAttempts);
    } catch (e) {
      debugPrint('Error resetting failed attempts: $e');
    }
  }

  /// Update last authentication time
  Future<void> _updateLastAuthTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_storageKeyLastAuthTime, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      debugPrint('Error updating last auth time: $e');
    }
  }

  /// Check lockout status on initialization
  Future<void> _checkLockoutStatus() async {
    if (await _isLockedOut()) {
      final remainingTime = await _getRemainingLockoutTime();
      _lockoutTimer?.cancel();
      _lockoutTimer = Timer(remainingTime, () {
        _eventController?.add(BiometricAuthEvent.lockoutExpired);
      });
    }
  }

  /// Get authentication statistics
  Future<BiometricAuthStats> getAuthStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isEnabled = await isBiometricEnabled();
      final failedAttempts = await _getFailedAttempts();
      final isLockedOut = await _isLockedOut();
      final lastAuthTime = prefs.getInt(_storageKeyLastAuthTime);
      final availableBiometrics = await getAvailableBiometrics();

      return BiometricAuthStats(
        isEnabled: isEnabled,
        failedAttempts: failedAttempts,
        isLockedOut: isLockedOut,
        lastAuthTime: lastAuthTime != null
            ? DateTime.fromMillisecondsSinceEpoch(lastAuthTime)
            : null,
        availableBiometrics: availableBiometrics,
        remainingLockoutTime: isLockedOut ? await _getRemainingLockoutTime() : null,
      );
    } catch (e) {
      debugPrint('Error getting auth stats: $e');
      return BiometricAuthStats(
        isEnabled: false,
        failedAttempts: 0,
        isLockedOut: false,
        availableBiometrics: [],
      );
    }
  }

  /// Clear all biometric data
  Future<void> clearAllBiometricData() async {
    try {
      await disableBiometric();

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKeyAuthAttempts);
      await prefs.remove(_storageKeyLastAuthTime);
      await prefs.remove('lockout_until');

      await _secureStorage.deleteAll();

      _lockoutTimer?.cancel();
      _eventController?.add(BiometricAuthEvent.dataCleared);
    } catch (e) {
      debugPrint('Error clearing biometric data: $e');
    }
  }

  /// Clear cached values (useful for testing or when biometric settings change)
  void clearCache() {
    _isBiometricAvailable = null;
    _availableBiometrics = null;
  }

  /// Dispose resources
  void dispose() {
    _eventController?.close();
    _lockoutTimer?.cancel();
  }
}

/// Biometric authentication events
enum BiometricAuthEvent {
  enrolled,
  disabled,
  authenticated,
  failed,
  lockedOut,
  lockoutExpired,
  dataCleared,
}

/// Biometric authentication statistics
class BiometricAuthStats {
  final bool isEnabled;
  final int failedAttempts;
  final bool isLockedOut;
  final DateTime? lastAuthTime;
  final List<BiometricType> availableBiometrics;
  final Duration? remainingLockoutTime;

  BiometricAuthStats({
    required this.isEnabled,
    required this.failedAttempts,
    required this.isLockedOut,
    required this.availableBiometrics,
    this.lastAuthTime,
    this.remainingLockoutTime,
  });
}

/// Result of biometric authentication attempt
class BiometricAuthResult {
  final bool success;
  final BiometricAuthError? error;
  final String message;

  BiometricAuthResult({
    required this.success,
    this.error,
    required this.message,
  });
}

/// Biometric authentication error types
enum BiometricAuthError {
  notAvailable,
  notEnrolled,
  notEnabled,
  passcodeNotSet,
  failed,
  userCancelled,
  lockedOut,
  permanentlyLockedOut,
  unknown,
}