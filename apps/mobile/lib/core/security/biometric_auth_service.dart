/// Biometric Authentication Service
///
/// Provides secure biometric authentication including Face ID, Touch ID,
/// fingerprint, and device credential fallbacks.

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Biometric type supported by the device
enum BiometricType {
  fingerprint,
  faceId,
  iris,
  strong,
  weak,
}

/// Authentication result
enum AuthResult {
  success,
  failed,
  cancelled,
  notAvailable,
  notEnrolled,
  lockedOut,
  permanentlyLockedOut,
  error,
}

/// Biometric capabilities
class BiometricCapabilities {
  final bool isHardwareAvailable;
  final bool canAuthenticate;
  final bool isBiometricEnrolled;
  final bool isDeviceCredentialAvailable;
  final List<BiometricType> availableBiometrics;
  final String? errorMessage;

  const BiometricCapabilities({
    this.isHardwareAvailable = false,
    this.canAuthenticate = false,
    this.isBiometricEnrolled = false,
    this.isDeviceCredentialAvailable = false,
    this.availableBiometrics = const [],
    this.errorMessage,
  });

  bool get isAvailable =>
      isHardwareAvailable && (isBiometricEnrolled || isDeviceCredentialAvailable);

  Map<String, dynamic> toJson() => {
        'isHardwareAvailable': isHardwareAvailable,
        'canAuthenticate': canAuthenticate,
        'isBiometricEnrolled': isBiometricEnrolled,
        'isDeviceCredentialAvailable': isDeviceCredentialAvailable,
        'availableBiometrics': availableBiometrics.map((b) => b.name).toList(),
        'errorMessage': errorMessage,
      };
}

/// Authentication options
class AuthenticationOptions {
  final String localizedReason;
  final bool useErrorDialogs;
  final bool stickyAuth;
  final bool sensitiveTransaction;
  final bool biometricOnly;
  final String? androidBiometricPromptTitle;
  final String? androidBiometricPromptSubtitle;
  final String? androidNegativeButton;
  final String? iosFallbackButton;

  const AuthenticationOptions({
    required this.localizedReason,
    this.useErrorDialogs = true,
    this.stickyAuth = true,
    this.sensitiveTransaction = false,
    this.biometricOnly = false,
    this.androidBiometricPromptTitle,
    this.androidBiometricPromptSubtitle,
    this.androidNegativeButton,
    this.iosFallbackButton,
  });
}

/// Authentication event
class AuthenticationEvent {
  final String type;
  final AuthResult? result;
  final BiometricType? biometricType;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  AuthenticationEvent({
    required this.type,
    this.result,
    this.biometricType,
    Map<String, dynamic>? metadata,
  })  : timestamp = DateTime.now(),
        metadata = metadata;

  Map<String, dynamic> toJson() => {
        'type': type,
        'result': result?.name,
        'biometricType': biometricType?.name,
        'timestamp': timestamp.toIso8601String(),
        'metadata': metadata,
      };
}

/// Biometric authentication service
class BiometricAuthService extends ChangeNotifier {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/biometric_auth');

  BiometricCapabilities? _capabilities;
  bool _isAuthenticating = false;
  DateTime? _lastAuthTime;
  int _failedAttempts = 0;
  DateTime? _lockoutEndTime;

  final List<AuthenticationEvent> _authEvents = [];
  final StreamController<AuthenticationEvent> _eventController =
      StreamController<AuthenticationEvent>.broadcast();

  // Configuration
  final int _maxFailedAttempts = 5;
  final Duration _lockoutDuration = const Duration(minutes: 5);
  final Duration _authValidityDuration = const Duration(minutes: 15);

  BiometricCapabilities? get capabilities => _capabilities;
  bool get isAuthenticating => _isAuthenticating;
  DateTime? get lastAuthTime => _lastAuthTime;
  bool get isLockedOut =>
      _lockoutEndTime != null && DateTime.now().isBefore(_lockoutEndTime!);
  int get failedAttempts => _failedAttempts;
  Stream<AuthenticationEvent> get authEvents => _eventController.stream;

  /// Check if authentication is still valid
  bool get isAuthValid {
    if (_lastAuthTime == null) return false;
    return DateTime.now().difference(_lastAuthTime!) < _authValidityDuration;
  }

  /// Initialize service
  Future<void> initialize() async {
    try {
      _capabilities = await checkCapabilities();
      notifyListeners();
    } catch (e) {
      debugPrint('BiometricAuthService: Failed to initialize: $e');
    }
  }

  /// Check device biometric capabilities
  Future<BiometricCapabilities> checkCapabilities() async {
    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'checkCapabilities',
      );

      if (result == null) {
        return const BiometricCapabilities();
      }

      final availableBiometrics = <BiometricType>[];
      final biometricsList = result['availableBiometrics'] as List<dynamic>?;

      if (biometricsList != null) {
        for (final biometric in biometricsList) {
          switch (biometric.toString().toLowerCase()) {
            case 'fingerprint':
              availableBiometrics.add(BiometricType.fingerprint);
              break;
            case 'face':
            case 'faceid':
              availableBiometrics.add(BiometricType.faceId);
              break;
            case 'iris':
              availableBiometrics.add(BiometricType.iris);
              break;
            case 'strong':
              availableBiometrics.add(BiometricType.strong);
              break;
            case 'weak':
              availableBiometrics.add(BiometricType.weak);
              break;
          }
        }
      }

      final capabilities = BiometricCapabilities(
        isHardwareAvailable: result['isHardwareAvailable'] == true,
        canAuthenticate: result['canAuthenticate'] == true,
        isBiometricEnrolled: result['isBiometricEnrolled'] == true,
        isDeviceCredentialAvailable:
            result['isDeviceCredentialAvailable'] == true,
        availableBiometrics: availableBiometrics,
        errorMessage: result['errorMessage']?.toString(),
      );

      _capabilities = capabilities;
      notifyListeners();

      return capabilities;
    } on PlatformException catch (e) {
      debugPrint('BiometricAuthService: Platform error: ${e.message}');
      return BiometricCapabilities(errorMessage: e.message);
    } catch (e) {
      debugPrint('BiometricAuthService: Error checking capabilities: $e');
      return BiometricCapabilities(errorMessage: e.toString());
    }
  }

  /// Authenticate user
  Future<AuthResult> authenticate({
    required String reason,
    bool biometricOnly = false,
    bool sensitiveTransaction = false,
  }) async {
    // Check lockout
    if (isLockedOut) {
      _emitEvent(AuthenticationEvent(
        type: 'attempt_blocked',
        result: AuthResult.lockedOut,
        metadata: {'lockoutEndTime': _lockoutEndTime?.toIso8601String()},
      ));
      return AuthResult.lockedOut;
    }

    if (_isAuthenticating) {
      return AuthResult.error;
    }

    _isAuthenticating = true;
    notifyListeners();

    try {
      final result = await _channel.invokeMethod<String>(
        'authenticate',
        {
          'localizedReason': reason,
          'biometricOnly': biometricOnly,
          'sensitiveTransaction': sensitiveTransaction,
        },
      );

      final authResult = _parseResult(result);

      if (authResult == AuthResult.success) {
        _lastAuthTime = DateTime.now();
        _failedAttempts = 0;
        _emitEvent(AuthenticationEvent(
          type: 'authentication_success',
          result: authResult,
        ));
      } else if (authResult == AuthResult.failed) {
        _failedAttempts++;
        if (_failedAttempts >= _maxFailedAttempts) {
          _lockoutEndTime = DateTime.now().add(_lockoutDuration);
          _emitEvent(AuthenticationEvent(
            type: 'lockout_triggered',
            result: AuthResult.lockedOut,
            metadata: {
              'failedAttempts': _failedAttempts,
              'lockoutEndTime': _lockoutEndTime?.toIso8601String(),
            },
          ));
        } else {
          _emitEvent(AuthenticationEvent(
            type: 'authentication_failed',
            result: authResult,
            metadata: {
              'failedAttempts': _failedAttempts,
              'remainingAttempts': _maxFailedAttempts - _failedAttempts,
            },
          ));
        }
      } else {
        _emitEvent(AuthenticationEvent(
          type: 'authentication_result',
          result: authResult,
        ));
      }

      return authResult;
    } on PlatformException catch (e) {
      debugPrint('BiometricAuthService: Platform error: ${e.message}');
      _emitEvent(AuthenticationEvent(
        type: 'authentication_error',
        result: AuthResult.error,
        metadata: {'error': e.message},
      ));
      return AuthResult.error;
    } catch (e) {
      debugPrint('BiometricAuthService: Authentication error: $e');
      _emitEvent(AuthenticationEvent(
        type: 'authentication_error',
        result: AuthResult.error,
        metadata: {'error': e.toString()},
      ));
      return AuthResult.error;
    } finally {
      _isAuthenticating = false;
      notifyListeners();
    }
  }

  /// Authenticate with custom options
  Future<AuthResult> authenticateWithOptions(
      AuthenticationOptions options) async {
    if (isLockedOut) {
      return AuthResult.lockedOut;
    }

    if (_isAuthenticating) {
      return AuthResult.error;
    }

    _isAuthenticating = true;
    notifyListeners();

    try {
      final result = await _channel.invokeMethod<String>(
        'authenticateWithOptions',
        {
          'localizedReason': options.localizedReason,
          'useErrorDialogs': options.useErrorDialogs,
          'stickyAuth': options.stickyAuth,
          'sensitiveTransaction': options.sensitiveTransaction,
          'biometricOnly': options.biometricOnly,
          'androidBiometricPromptTitle': options.androidBiometricPromptTitle,
          'androidBiometricPromptSubtitle':
              options.androidBiometricPromptSubtitle,
          'androidNegativeButton': options.androidNegativeButton,
          'iosFallbackButton': options.iosFallbackButton,
        },
      );

      final authResult = _parseResult(result);

      if (authResult == AuthResult.success) {
        _lastAuthTime = DateTime.now();
        _failedAttempts = 0;
      } else if (authResult == AuthResult.failed) {
        _failedAttempts++;
        if (_failedAttempts >= _maxFailedAttempts) {
          _lockoutEndTime = DateTime.now().add(_lockoutDuration);
        }
      }

      return authResult;
    } on PlatformException catch (e) {
      debugPrint('BiometricAuthService: Platform error: ${e.message}');
      return AuthResult.error;
    } catch (e) {
      debugPrint('BiometricAuthService: Authentication error: $e');
      return AuthResult.error;
    } finally {
      _isAuthenticating = false;
      notifyListeners();
    }
  }

  /// Cancel ongoing authentication
  Future<void> cancelAuthentication() async {
    if (!_isAuthenticating) return;

    try {
      await _channel.invokeMethod('cancelAuthentication');
    } catch (e) {
      debugPrint('BiometricAuthService: Cancel error: $e');
    }
  }

  /// Invalidate current authentication
  void invalidateAuthentication() {
    _lastAuthTime = null;
    notifyListeners();

    _emitEvent(AuthenticationEvent(
      type: 'authentication_invalidated',
    ));
  }

  /// Reset lockout (e.g., after successful password verification)
  void resetLockout() {
    _failedAttempts = 0;
    _lockoutEndTime = null;
    notifyListeners();

    _emitEvent(AuthenticationEvent(
      type: 'lockout_reset',
    ));
  }

  /// Get authentication history
  List<AuthenticationEvent> getAuthHistory({int limit = 50}) {
    return _authEvents.take(limit).toList();
  }

  /// Get primary biometric type for display
  BiometricType? get primaryBiometric {
    if (_capabilities == null || _capabilities!.availableBiometrics.isEmpty) {
      return null;
    }

    // Prefer Face ID over fingerprint
    if (_capabilities!.availableBiometrics.contains(BiometricType.faceId)) {
      return BiometricType.faceId;
    }

    return _capabilities!.availableBiometrics.first;
  }

  /// Get localized biometric name
  String getBiometricName(BiometricType type) {
    switch (type) {
      case BiometricType.fingerprint:
        return 'Fingerprint';
      case BiometricType.faceId:
        return 'Face ID';
      case BiometricType.iris:
        return 'Iris';
      case BiometricType.strong:
        return 'Biometric';
      case BiometricType.weak:
        return 'Biometric';
    }
  }

  AuthResult _parseResult(String? result) {
    switch (result) {
      case 'success':
        return AuthResult.success;
      case 'failed':
        return AuthResult.failed;
      case 'cancelled':
        return AuthResult.cancelled;
      case 'notAvailable':
        return AuthResult.notAvailable;
      case 'notEnrolled':
        return AuthResult.notEnrolled;
      case 'lockedOut':
        return AuthResult.lockedOut;
      case 'permanentlyLockedOut':
        return AuthResult.permanentlyLockedOut;
      default:
        return AuthResult.error;
    }
  }

  void _emitEvent(AuthenticationEvent event) {
    _authEvents.insert(0, event);
    if (_authEvents.length > 100) {
      _authEvents.removeRange(100, _authEvents.length);
    }
    _eventController.add(event);
  }

  @override
  void dispose() {
    _eventController.close();
    super.dispose();
  }
}

/// Global instance
final biometricAuthService = BiometricAuthService();
