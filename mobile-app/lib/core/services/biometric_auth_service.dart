import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Service for handling biometric authentication
class BiometricAuthService {
  static final BiometricAuthService _instance = BiometricAuthService._internal();
  factory BiometricAuthService() => _instance;

  final LocalAuthentication _localAuth = LocalAuthentication();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  // Cache biometric availability to avoid repeated checks
  bool? _isBiometricAvailable;
  List<BiometricType>? _availableBiometrics;

  BiometricAuthService._internal();

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

  /// Clear cached values (useful for testing or when biometric settings change)
  void clearCache() {
    _isBiometricAvailable = null;
    _availableBiometrics = null;
  }
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