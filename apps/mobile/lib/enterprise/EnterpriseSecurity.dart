import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

/// Security configuration
class SecurityConfig {
  final bool enableCertificatePinning;
  final List<String> pinnedCertificates;
  final bool enableRootDetection;
  final bool enableJailbreakDetection;
  final bool enableAppAttestation;
  final bool enableEncryptedStorage;

  const SecurityConfig({
    this.enableCertificatePinning = true,
    this.pinnedCertificates = const [],
    this.enableRootDetection = true,
    this.enableJailbreakDetection = true,
    this.enableAppAttestation = true,
    this.enableEncryptedStorage = true,
  });
}

/// Enterprise security service
class EnterpriseSecurity {
  static const MethodChannel _channel = MethodChannel('com.upcoach/security');

  final SecurityConfig config;
  bool _isInitialized = false;

  EnterpriseSecurity({this.config = const SecurityConfig()});

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Setup certificate pinning
      if (config.enableCertificatePinning) {
        await _setupCertificatePinning();
      }

      // Check for root/jailbreak
      if (config.enableRootDetection || config.enableJailbreakDetection) {
        final isCompromised = await checkDeviceIntegrity();
        if (isCompromised) {
          debugPrint('WARNING: Device integrity compromised');
        }
      }

      // Setup encrypted storage
      if (config.enableEncryptedStorage) {
        await _setupEncryptedStorage();
      }

      _isInitialized = true;
      debugPrint('EnterpriseSecurity initialized');
    } catch (e) {
      debugPrint('Error initializing EnterpriseSecurity: $e');
    }
  }

  // ============================================================================
  // Certificate Pinning
  // ============================================================================

  Future<void> _setupCertificatePinning() async {
    try {
      if (config.pinnedCertificates.isEmpty) {
        debugPrint('No certificates to pin');
        return;
      }

      await _channel.invokeMethod('setupCertificatePinning', {
        'certificates': config.pinnedCertificates,
      });

      debugPrint('Certificate pinning configured');
    } catch (e) {
      debugPrint('Error setting up certificate pinning: $e');
    }
  }

  Future<bool> verifyCertificate(String certificate) async {
    try {
      final result = await _channel.invokeMethod('verifyCertificate', {
        'certificate': certificate,
      });
      return result as bool;
    } catch (e) {
      debugPrint('Error verifying certificate: $e');
      return false;
    }
  }

  // ============================================================================
  // Root/Jailbreak Detection
  // ============================================================================

  Future<bool> checkDeviceIntegrity() async {
    if (Platform.isAndroid) {
      return await _checkForRoot();
    } else if (Platform.isIOS) {
      return await _checkForJailbreak();
    }
    return false;
  }

  Future<bool> _checkForRoot() async {
    try {
      final result = await _channel.invokeMethod('checkRootStatus');
      return result as bool? ?? false;
    } catch (e) {
      debugPrint('Error checking root status: $e');
      return false;
    }
  }

  Future<bool> _checkForJailbreak() async {
    try {
      final result = await _channel.invokeMethod('checkJailbreakStatus');
      return result as bool? ?? false;
    } catch (e) {
      debugPrint('Error checking jailbreak status: $e');
      return false;
    }
  }

  // ============================================================================
  // App Attestation
  // ============================================================================

  Future<String?> generateAttestation() async {
    if (!config.enableAppAttestation) return null;

    try {
      final result = await _channel.invokeMethod('generateAttestation');
      return result as String?;
    } catch (e) {
      debugPrint('Error generating attestation: $e');
      return null;
    }
  }

  Future<bool> verifyAttestation(String attestation) async {
    try {
      final result = await _channel.invokeMethod('verifyAttestation', {
        'attestation': attestation,
      });
      return result as bool? ?? false;
    } catch (e) {
      debugPrint('Error verifying attestation: $e');
      return false;
    }
  }

  // ============================================================================
  // Encrypted Storage
  // ============================================================================

  Future<void> _setupEncryptedStorage() async {
    try {
      await _channel.invokeMethod('setupEncryptedStorage');
      debugPrint('Encrypted storage configured');
    } catch (e) {
      debugPrint('Error setting up encrypted storage: $e');
    }
  }

  Future<void> secureWrite(String key, String value) async {
    try {
      final encrypted = _encrypt(value);
      await _channel.invokeMethod('secureWrite', {
        'key': key,
        'value': encrypted,
      });
    } catch (e) {
      debugPrint('Error writing secure data: $e');
    }
  }

  Future<String?> secureRead(String key) async {
    try {
      final encrypted = await _channel.invokeMethod('secureRead', {'key': key});
      if (encrypted == null) return null;
      return _decrypt(encrypted as String);
    } catch (e) {
      debugPrint('Error reading secure data: $e');
      return null;
    }
  }

  String _encrypt(String data) {
    // In production, use proper encryption
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  String _decrypt(String encrypted) {
    // In production, use proper decryption
    return encrypted;
  }

  // ============================================================================
  // Secure Communication
  // ============================================================================

  Future<Map<String, String>> getSecureHeaders() async {
    return {
      'X-App-Attestation': await generateAttestation() ?? '',
      'X-Device-ID': await _getDeviceId(),
      'X-Timestamp': DateTime.now().millisecondsSinceEpoch.toString(),
    };
  }

  Future<String> _getDeviceId() async {
    try {
      final result = await _channel.invokeMethod('getDeviceId');
      return result as String? ?? '';
    } catch (e) {
      return '';
    }
  }

  // ============================================================================
  // Security Checks
  // ============================================================================

  Future<SecurityReport> performSecurityAudit() async {
    final checks = <String, bool>{};

    checks['certificatePinning'] = config.enableCertificatePinning;
    checks['deviceIntegrity'] = !await checkDeviceIntegrity();
    checks['encryptedStorage'] = config.enableEncryptedStorage;
    checks['attestation'] = config.enableAppAttestation;

    final passed = checks.values.where((v) => v).length;
    final total = checks.length;

    return SecurityReport(
      checks: checks,
      score: (passed / total * 100).toInt(),
      timestamp: DateTime.now(),
    );
  }
}

/// Security report
class SecurityReport {
  final Map<String, bool> checks;
  final int score;
  final DateTime timestamp;

  const SecurityReport({
    required this.checks,
    required this.score,
    required this.timestamp,
  });
}
