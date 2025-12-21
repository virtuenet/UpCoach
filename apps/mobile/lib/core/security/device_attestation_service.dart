/// Device Attestation Service
///
/// Provides device integrity verification using platform-specific attestation:
/// - iOS: App Attest / DeviceCheck
/// - Android: Play Integrity API / SafetyNet

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Attestation type
enum AttestationType {
  appAttest, // iOS App Attest
  deviceCheck, // iOS DeviceCheck
  playIntegrity, // Android Play Integrity
  safetyNet, // Android SafetyNet (deprecated but fallback)
}

/// Device attestation result
enum AttestationResult {
  valid,
  invalid,
  unsupported,
  networkError,
  serverError,
  timeout,
  unknown,
}

/// Integrity verdict levels
enum IntegrityLevel {
  /// Device passes all integrity checks
  high,

  /// Device passes basic checks but may have issues
  medium,

  /// Device fails some integrity checks
  low,

  /// Device fails critical integrity checks
  compromised,

  /// Cannot determine integrity
  unknown,
}

/// Device attestation data
class AttestationData {
  final String attestationToken;
  final AttestationType type;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  const AttestationData({
    required this.attestationToken,
    required this.type,
    required this.timestamp,
    this.metadata,
  });

  Map<String, dynamic> toJson() => {
        'attestationToken': attestationToken,
        'type': type.name,
        'timestamp': timestamp.toIso8601String(),
        'metadata': metadata,
      };
}

/// Integrity assessment
class IntegrityAssessment {
  final IntegrityLevel level;
  final AttestationResult result;
  final List<String> issues;
  final Map<String, bool> checks;
  final DateTime assessedAt;

  const IntegrityAssessment({
    required this.level,
    required this.result,
    this.issues = const [],
    this.checks = const {},
    required this.assessedAt,
  });

  bool get isValid =>
      level == IntegrityLevel.high || level == IntegrityLevel.medium;

  Map<String, dynamic> toJson() => {
        'level': level.name,
        'result': result.name,
        'issues': issues,
        'checks': checks,
        'assessedAt': assessedAt.toIso8601String(),
      };
}

/// Play Integrity verdict (Android)
class PlayIntegrityVerdict {
  final bool meetsDeviceIntegrity;
  final bool meetsBasicIntegrity;
  final bool meetsCtsProfileMatch;
  final bool isPlayProtectVerified;
  final String? appRecognitionVerdict;
  final String? licensingVerdict;

  const PlayIntegrityVerdict({
    this.meetsDeviceIntegrity = false,
    this.meetsBasicIntegrity = false,
    this.meetsCtsProfileMatch = false,
    this.isPlayProtectVerified = false,
    this.appRecognitionVerdict,
    this.licensingVerdict,
  });

  IntegrityLevel get integrityLevel {
    if (meetsDeviceIntegrity && meetsCtsProfileMatch && isPlayProtectVerified) {
      return IntegrityLevel.high;
    }
    if (meetsBasicIntegrity) {
      return IntegrityLevel.medium;
    }
    if (!meetsDeviceIntegrity && !meetsBasicIntegrity) {
      return IntegrityLevel.compromised;
    }
    return IntegrityLevel.low;
  }

  factory PlayIntegrityVerdict.fromJson(Map<String, dynamic> json) {
    return PlayIntegrityVerdict(
      meetsDeviceIntegrity: json['meetsDeviceIntegrity'] == true,
      meetsBasicIntegrity: json['meetsBasicIntegrity'] == true,
      meetsCtsProfileMatch: json['meetsCtsProfileMatch'] == true,
      isPlayProtectVerified: json['isPlayProtectVerified'] == true,
      appRecognitionVerdict: json['appRecognitionVerdict']?.toString(),
      licensingVerdict: json['licensingVerdict']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'meetsDeviceIntegrity': meetsDeviceIntegrity,
        'meetsBasicIntegrity': meetsBasicIntegrity,
        'meetsCtsProfileMatch': meetsCtsProfileMatch,
        'isPlayProtectVerified': isPlayProtectVerified,
        'appRecognitionVerdict': appRecognitionVerdict,
        'licensingVerdict': licensingVerdict,
      };
}

/// App Attest result (iOS)
class AppAttestResult {
  final bool isValid;
  final String? keyId;
  final int? riskMetric;
  final DateTime? attestedAt;

  const AppAttestResult({
    this.isValid = false,
    this.keyId,
    this.riskMetric,
    this.attestedAt,
  });

  IntegrityLevel get integrityLevel {
    if (!isValid) return IntegrityLevel.compromised;
    if (riskMetric != null && riskMetric! > 50) return IntegrityLevel.low;
    if (riskMetric != null && riskMetric! > 20) return IntegrityLevel.medium;
    return IntegrityLevel.high;
  }

  factory AppAttestResult.fromJson(Map<String, dynamic> json) {
    return AppAttestResult(
      isValid: json['isValid'] == true,
      keyId: json['keyId']?.toString(),
      riskMetric: json['riskMetric'] as int?,
      attestedAt: json['attestedAt'] != null
          ? DateTime.tryParse(json['attestedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'isValid': isValid,
        'keyId': keyId,
        'riskMetric': riskMetric,
        'attestedAt': attestedAt?.toIso8601String(),
      };
}

/// Device attestation service
class DeviceAttestationService extends ChangeNotifier {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/device_attestation');

  IntegrityAssessment? _lastAssessment;
  AttestationData? _lastAttestation;
  bool _isAttesting = false;
  DateTime? _lastAttestationTime;

  // Configuration
  final Duration _attestationCacheDuration = const Duration(hours: 1);
  final Duration _attestationTimeout = const Duration(seconds: 30);

  IntegrityAssessment? get lastAssessment => _lastAssessment;
  AttestationData? get lastAttestation => _lastAttestation;
  bool get isAttesting => _isAttesting;

  /// Check if cached attestation is still valid
  bool get hasValidCachedAttestation {
    if (_lastAttestationTime == null || _lastAssessment == null) return false;
    return DateTime.now().difference(_lastAttestationTime!) <
            _attestationCacheDuration &&
        _lastAssessment!.isValid;
  }

  /// Get supported attestation type for current platform
  Future<AttestationType?> getSupportedAttestationType() async {
    try {
      final result = await _channel.invokeMethod<String>('getSupportedType');
      switch (result) {
        case 'appAttest':
          return AttestationType.appAttest;
        case 'deviceCheck':
          return AttestationType.deviceCheck;
        case 'playIntegrity':
          return AttestationType.playIntegrity;
        case 'safetyNet':
          return AttestationType.safetyNet;
        default:
          return null;
      }
    } catch (e) {
      debugPrint('DeviceAttestationService: Error getting supported type: $e');
      return null;
    }
  }

  /// Perform full device attestation
  Future<IntegrityAssessment> attestDevice({
    String? challenge,
    bool forceRefresh = false,
  }) async {
    // Return cached if valid and not forcing refresh
    if (!forceRefresh && hasValidCachedAttestation) {
      return _lastAssessment!;
    }

    if (_isAttesting) {
      return _lastAssessment ??
          IntegrityAssessment(
            level: IntegrityLevel.unknown,
            result: AttestationResult.unknown,
            assessedAt: DateTime.now(),
          );
    }

    _isAttesting = true;
    notifyListeners();

    try {
      final result = await _channel
          .invokeMethod<Map<dynamic, dynamic>>(
            'attestDevice',
            {'challenge': challenge ?? _generateChallenge()},
          )
          .timeout(_attestationTimeout);

      if (result == null) {
        return _createFailedAssessment(AttestationResult.unknown);
      }

      // Parse attestation token
      final attestationToken = result['attestationToken']?.toString();
      final typeStr = result['type']?.toString();

      if (attestationToken != null && typeStr != null) {
        final type = _parseAttestationType(typeStr);
        _lastAttestation = AttestationData(
          attestationToken: attestationToken,
          type: type,
          timestamp: DateTime.now(),
          metadata: Map<String, dynamic>.from(result['metadata'] ?? {}),
        );
      }

      // Parse integrity verdict
      IntegrityLevel level;
      final checks = <String, bool>{};
      final issues = <String>[];

      if (result['playIntegrity'] != null) {
        final verdict = PlayIntegrityVerdict.fromJson(
          Map<String, dynamic>.from(result['playIntegrity']),
        );
        level = verdict.integrityLevel;

        checks['deviceIntegrity'] = verdict.meetsDeviceIntegrity;
        checks['basicIntegrity'] = verdict.meetsBasicIntegrity;
        checks['ctsProfileMatch'] = verdict.meetsCtsProfileMatch;
        checks['playProtect'] = verdict.isPlayProtectVerified;

        if (!verdict.meetsDeviceIntegrity) {
          issues.add('Device integrity check failed');
        }
        if (!verdict.meetsCtsProfileMatch) {
          issues.add('CTS profile mismatch detected');
        }
        if (!verdict.isPlayProtectVerified) {
          issues.add('Play Protect not verified');
        }
      } else if (result['appAttest'] != null) {
        final attestResult = AppAttestResult.fromJson(
          Map<String, dynamic>.from(result['appAttest']),
        );
        level = attestResult.integrityLevel;

        checks['attestation'] = attestResult.isValid;

        if (!attestResult.isValid) {
          issues.add('App attestation failed');
        }
        if (attestResult.riskMetric != null && attestResult.riskMetric! > 20) {
          issues.add('Elevated risk metric: ${attestResult.riskMetric}');
        }
      } else {
        level = IntegrityLevel.unknown;
        issues.add('No attestation data received');
      }

      // Additional checks
      if (result['isRooted'] == true || result['isJailbroken'] == true) {
        level = IntegrityLevel.compromised;
        checks['rootDetection'] = false;
        issues.add('Device appears to be rooted/jailbroken');
      } else {
        checks['rootDetection'] = true;
      }

      if (result['isEmulator'] == true) {
        level = IntegrityLevel.low;
        checks['emulatorDetection'] = false;
        issues.add('Running on emulator/simulator');
      } else {
        checks['emulatorDetection'] = true;
      }

      if (result['isDebuggerAttached'] == true) {
        checks['debuggerDetection'] = false;
        issues.add('Debugger attached');
      } else {
        checks['debuggerDetection'] = true;
      }

      _lastAssessment = IntegrityAssessment(
        level: level,
        result: AttestationResult.valid,
        issues: issues,
        checks: checks,
        assessedAt: DateTime.now(),
      );

      _lastAttestationTime = DateTime.now();
      notifyListeners();

      return _lastAssessment!;
    } on PlatformException catch (e) {
      debugPrint('DeviceAttestationService: Platform error: ${e.message}');
      return _createFailedAssessment(AttestationResult.serverError);
    } on TimeoutException {
      debugPrint('DeviceAttestationService: Attestation timeout');
      return _createFailedAssessment(AttestationResult.timeout);
    } catch (e) {
      debugPrint('DeviceAttestationService: Error: $e');
      return _createFailedAssessment(AttestationResult.unknown);
    } finally {
      _isAttesting = false;
      notifyListeners();
    }
  }

  /// Generate attestation for a specific request (e.g., API call)
  Future<String?> generateRequestAttestation(String requestData) async {
    try {
      final result = await _channel.invokeMethod<String>(
        'generateAssertion',
        {
          'challenge': base64Encode(utf8.encode(requestData)),
        },
      );
      return result;
    } catch (e) {
      debugPrint(
          'DeviceAttestationService: Error generating request attestation: $e');
      return null;
    }
  }

  /// Check for specific tampering indicators
  Future<Map<String, bool>> checkTamperingIndicators() async {
    try {
      final result = await _channel
          .invokeMethod<Map<dynamic, dynamic>>('checkTampering');

      if (result == null) {
        return {};
      }

      return {
        'isRooted': result['isRooted'] == true,
        'isJailbroken': result['isJailbroken'] == true,
        'isEmulator': result['isEmulator'] == true,
        'isDebuggerAttached': result['isDebuggerAttached'] == true,
        'hasHookingFramework': result['hasHookingFramework'] == true,
        'hasModifiedSignature': result['hasModifiedSignature'] == true,
        'isRunningInVirtualEnvironment':
            result['isRunningInVirtualEnvironment'] == true,
        'hasUnauthorizedStore': result['hasUnauthorizedStore'] == true,
      };
    } catch (e) {
      debugPrint('DeviceAttestationService: Error checking tampering: $e');
      return {};
    }
  }

  /// Verify app integrity (signature, resources, etc.)
  Future<bool> verifyAppIntegrity() async {
    try {
      final result = await _channel.invokeMethod<bool>('verifyAppIntegrity');
      return result ?? false;
    } catch (e) {
      debugPrint('DeviceAttestationService: Error verifying app integrity: $e');
      return false;
    }
  }

  /// Get device fingerprint for binding
  Future<String?> getDeviceFingerprint() async {
    try {
      final result = await _channel.invokeMethod<String>('getDeviceFingerprint');
      return result;
    } catch (e) {
      debugPrint('DeviceAttestationService: Error getting fingerprint: $e');
      return null;
    }
  }

  /// Register for continuous attestation monitoring
  Stream<IntegrityAssessment> monitorIntegrity({
    Duration interval = const Duration(minutes: 30),
  }) async* {
    while (true) {
      final assessment = await attestDevice(forceRefresh: true);
      yield assessment;

      if (assessment.level == IntegrityLevel.compromised) {
        // If compromised, check more frequently
        await Future.delayed(const Duration(minutes: 5));
      } else {
        await Future.delayed(interval);
      }
    }
  }

  IntegrityAssessment _createFailedAssessment(AttestationResult result) {
    _lastAssessment = IntegrityAssessment(
      level: IntegrityLevel.unknown,
      result: result,
      issues: ['Attestation failed: ${result.name}'],
      assessedAt: DateTime.now(),
    );
    notifyListeners();
    return _lastAssessment!;
  }

  AttestationType _parseAttestationType(String typeStr) {
    switch (typeStr.toLowerCase()) {
      case 'appattest':
        return AttestationType.appAttest;
      case 'devicecheck':
        return AttestationType.deviceCheck;
      case 'playintegrity':
        return AttestationType.playIntegrity;
      case 'safetynet':
        return AttestationType.safetyNet;
      default:
        return AttestationType.playIntegrity;
    }
  }

  String _generateChallenge() {
    // Generate a random challenge nonce
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = DateTime.now().microsecondsSinceEpoch;
    return base64Encode(utf8.encode('$timestamp:$random'));
  }

  /// Clear cached attestation data
  void clearCache() {
    _lastAssessment = null;
    _lastAttestation = null;
    _lastAttestationTime = null;
    notifyListeners();
  }
}

/// Global instance
final deviceAttestationService = DeviceAttestationService();
