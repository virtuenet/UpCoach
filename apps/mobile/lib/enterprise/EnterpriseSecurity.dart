import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:device_info_plus/device_info_plus.dart';

/// Security threat level
enum ThreatLevel {
  none,
  low,
  medium,
  high,
  critical,
}

/// Security event type
enum SecurityEventType {
  jailbreakDetected,
  rootDetected,
  tamperDetected,
  debuggerDetected,
  sslPinningFailed,
  unauthorizedAccess,
  dataLeakage,
  suspiciousActivity,
}

/// Security event
class SecurityEvent {
  final SecurityEventType type;
  final ThreatLevel level;
  final String description;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  const SecurityEvent({
    required this.type,
    required this.level,
    required this.description,
    required this.timestamp,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'level': level.name,
      'description': description,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}

/// Certificate pinning configuration
class CertificatePinningConfig {
  final Map<String, List<String>> domainPins;
  final bool validateCertificateChain;
  final bool allowInvalidCertificates;

  const CertificatePinningConfig({
    required this.domainPins,
    this.validateCertificateChain = true,
    this.allowInvalidCertificates = false,
  });
}

/// Encryption key info
class KeyInfo {
  final String keyId;
  final String algorithm;
  final DateTime createdAt;
  final DateTime? expiresAt;

  const KeyInfo({
    required this.keyId,
    required this.algorithm,
    required this.createdAt,
    this.expiresAt,
  });
}

/// Enterprise security service
class EnterpriseSecurity {
  static const String _keyPrefix = 'enterprise_key_';
  static const String _securityEventsKey = 'security_events';

  final FlutterSecureStorage _secureStorage;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  
  static const MethodChannel _platform = MethodChannel('com.upcoach.security');

  final StreamController<SecurityEvent> _eventController =
      StreamController<SecurityEvent>.broadcast();

  List<SecurityEvent> _events = [];
  bool _initialized = false;
  ThreatLevel _currentThreatLevel = ThreatLevel.none;

  CertificatePinningConfig? _pinningConfig;

  EnterpriseSecurity({
    FlutterSecureStorage? secureStorage,
  }) : _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Load security events history
      await _loadSecurityEvents();

      // Run initial security checks
      await runSecurityChecks();

      _initialized = true;
      debugPrint('Enterprise security initialized');
    } catch (e) {
      debugPrint('Error initializing security: $e');
    }
  }

  // ============================================================================
  // Jailbreak/Root Detection
  // ============================================================================

  Future<bool> isJailbroken() async {
    if (!Platform.isIOS) return false;

    try {
      // Check for jailbreak indicators
      final indicators = [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
        '/private/var/lib/apt/',
      ];

      for (final path in indicators) {
        if (await File(path).exists()) {
          await _logSecurityEvent(SecurityEvent(
            type: SecurityEventType.jailbreakDetected,
            level: ThreatLevel.critical,
            description: 'Jailbreak detected: $path',
            timestamp: DateTime.now(),
          ));
          return true;
        }
      }

      // Check if app can write outside sandbox
      try {
        await File('/private/test.txt').writeAsString('test');
        await File('/private/test.txt').delete();
        await _logSecurityEvent(SecurityEvent(
          type: SecurityEventType.jailbreakDetected,
          level: ThreatLevel.critical,
          description: 'Jailbreak detected: sandbox escape',
          timestamp: DateTime.now(),
        ));
        return true;
      } catch (e) {
        // Expected to fail on non-jailbroken devices
      }

      return false;
    } catch (e) {
      debugPrint('Error checking jailbreak: $e');
      return false;
    }
  }

  Future<bool> isRooted() async {
    if (!Platform.isAndroid) return false;

    try {
      // Check for root indicators
      final suPaths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su',
      ];

      for (final path in suPaths) {
        if (await File(path).exists()) {
          await _logSecurityEvent(SecurityEvent(
            type: SecurityEventType.rootDetected,
            level: ThreatLevel.critical,
            description: 'Root detected: $path',
            timestamp: DateTime.now(),
          ));
          return true;
        }
      }

      // Check for root management apps
      final result = await _platform.invokeMethod('checkRoot');
      if (result == true) {
        await _logSecurityEvent(SecurityEvent(
          type: SecurityEventType.rootDetected,
          level: ThreatLevel.critical,
          description: 'Root detected via package check',
          timestamp: DateTime.now(),
        ));
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('Error checking root: $e');
      return false;
    }
  }

  // ============================================================================
  // App Attestation
  // ============================================================================

  Future<bool> verifyAppIntegrity() async {
    try {
      // Check if app signature is valid
      final result = await _platform.invokeMethod('verifySignature');
      
      if (result != true) {
        await _logSecurityEvent(SecurityEvent(
          type: SecurityEventType.tamperDetected,
          level: ThreatLevel.high,
          description: 'App signature verification failed',
          timestamp: DateTime.now(),
        ));
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('Error verifying app integrity: $e');
      return false;
    }
  }

  Future<String?> getAppAttestation() async {
    try {
      if (Platform.isIOS) {
        // Use Apple App Attest
        final result = await _platform.invokeMethod('generateAttestation');
        return result as String?;
      } else if (Platform.isAndroid) {
        // Use SafetyNet Attestation
        final result = await _platform.invokeMethod('safetyNetAttest');
        return result as String?;
      }
      return null;
    } catch (e) {
      debugPrint('Error getting attestation: $e');
      return null;
    }
  }

  // ============================================================================
  // Certificate Pinning
  // ============================================================================

  void configureCertificatePinning(CertificatePinningConfig config) {
    _pinningConfig = config;
  }

  bool validateCertificate(String domain, List<int> certificate) {
    if (_pinningConfig == null) return true;

    final pins = _pinningConfig!.domainPins[domain];
    if (pins == null || pins.isEmpty) return true;

    // Calculate certificate hash
    final certHash = sha256.convert(certificate).toString();

    if (!pins.contains(certHash)) {
      _logSecurityEvent(SecurityEvent(
        type: SecurityEventType.sslPinningFailed,
        level: ThreatLevel.high,
        description: 'SSL pinning failed for domain: $domain',
        timestamp: DateTime.now(),
        metadata: {'domain': domain, 'hash': certHash},
      ));
      return false;
    }

    return true;
  }

  HttpClient createSecureHttpClient() {
    final client = HttpClient();
    
    if (_pinningConfig != null && !_pinningConfig!.allowInvalidCertificates) {
      client.badCertificateCallback = (cert, host, port) {
        // Validate certificate chain
        if (_pinningConfig!.validateCertificateChain) {
          return validateCertificate(host, cert.der);
        }
        return false;
      };
    }

    return client;
  }

  // ============================================================================
  // Encrypted Data at Rest
  // ============================================================================

  Future<void> secureWrite(String key, String value) async {
    try {
      final encryptedKey = _encryptKey(key);
      await _secureStorage.write(key: encryptedKey, value: value);
    } catch (e) {
      debugPrint('Error writing secure data: $e');
      rethrow;
    }
  }

  Future<String?> secureRead(String key) async {
    try {
      final encryptedKey = _encryptKey(key);
      return await _secureStorage.read(key: encryptedKey);
    } catch (e) {
      debugPrint('Error reading secure data: $e');
      return null;
    }
  }

  Future<void> secureDelete(String key) async {
    try {
      final encryptedKey = _encryptKey(key);
      await _secureStorage.delete(key: encryptedKey);
    } catch (e) {
      debugPrint('Error deleting secure data: $e');
    }
  }

  Future<void> secureDeleteAll() async {
    try {
      await _secureStorage.deleteAll();
    } catch (e) {
      debugPrint('Error deleting all secure data: $e');
    }
  }

  String _encryptKey(String key) {
    final bytes = utf8.encode(key);
    final hash = sha256.convert(bytes);
    return '$_keyPrefix${hash.toString()}';
  }

  // ============================================================================
  // Secure Key Storage
  // ============================================================================

  Future<KeyInfo> generateEncryptionKey(String keyId) async {
    try {
      if (Platform.isIOS) {
        await _platform.invokeMethod('generateKey', {'keyId': keyId});
      } else if (Platform.isAndroid) {
        await _platform.invokeMethod('generateKeystore', {'keyId': keyId});
      }

      final keyInfo = KeyInfo(
        keyId: keyId,
        algorithm: 'AES256',
        createdAt: DateTime.now(),
      );

      return keyInfo;
    } catch (e) {
      debugPrint('Error generating key: $e');
      rethrow;
    }
  }

  Future<bool> deleteEncryptionKey(String keyId) async {
    try {
      await _platform.invokeMethod('deleteKey', {'keyId': keyId});
      return true;
    } catch (e) {
      debugPrint('Error deleting key: $e');
      return false;
    }
  }

  Future<String?> encrypt(String data, String keyId) async {
    try {
      final result = await _platform.invokeMethod('encrypt', {
        'data': data,
        'keyId': keyId,
      });
      return result as String?;
    } catch (e) {
      debugPrint('Error encrypting data: $e');
      return null;
    }
  }

  Future<String?> decrypt(String encryptedData, String keyId) async {
    try {
      final result = await _platform.invokeMethod('decrypt', {
        'data': encryptedData,
        'keyId': keyId,
      });
      return result as String?;
    } catch (e) {
      debugPrint('Error decrypting data: $e');
      return null;
    }
  }

  // ============================================================================
  // Tamper Detection
  // ============================================================================

  Future<bool> detectDebugger() async {
    try {
      final result = await _platform.invokeMethod('detectDebugger');
      if (result == true) {
        await _logSecurityEvent(SecurityEvent(
          type: SecurityEventType.debuggerDetected,
          level: ThreatLevel.high,
          description: 'Debugger detected',
          timestamp: DateTime.now(),
        ));
      }
      return result as bool? ?? false;
    } catch (e) {
      debugPrint('Error detecting debugger: $e');
      return false;
    }
  }

  Future<bool> detectEmulator() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        
        // Check for emulator indicators
        final isEmulator = !androidInfo.isPhysicalDevice ||
            androidInfo.model.contains('sdk') ||
            androidInfo.model.contains('emulator') ||
            androidInfo.manufacturer == 'Google' && androidInfo.brand == 'generic';

        if (isEmulator) {
          await _logSecurityEvent(SecurityEvent(
            type: SecurityEventType.suspiciousActivity,
            level: ThreatLevel.medium,
            description: 'App running on emulator',
            timestamp: DateTime.now(),
          ));
        }

        return isEmulator;
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        final isSimulator = !iosInfo.isPhysicalDevice;

        if (isSimulator) {
          await _logSecurityEvent(SecurityEvent(
            type: SecurityEventType.suspiciousActivity,
            level: ThreatLevel.medium,
            description: 'App running on simulator',
            timestamp: DateTime.now(),
          ));
        }

        return isSimulator;
      }

      return false;
    } catch (e) {
      debugPrint('Error detecting emulator: $e');
      return false;
    }
  }

  // ============================================================================
  // Security Checks
  // ============================================================================

  Future<void> runSecurityChecks() async {
    try {
      // Check for jailbreak/root
      if (Platform.isIOS) {
        final jailbroken = await isJailbroken();
        if (jailbroken) {
          _currentThreatLevel = ThreatLevel.critical;
        }
      } else if (Platform.isAndroid) {
        final rooted = await isRooted();
        if (rooted) {
          _currentThreatLevel = ThreatLevel.critical;
        }
      }

      // Check for debugger
      final debuggerDetected = await detectDebugger();
      if (debuggerDetected && _currentThreatLevel.index < ThreatLevel.high.index) {
        _currentThreatLevel = ThreatLevel.high;
      }

      // Check for emulator
      final emulatorDetected = await detectEmulator();
      if (emulatorDetected && _currentThreatLevel.index < ThreatLevel.medium.index) {
        _currentThreatLevel = ThreatLevel.medium;
      }

      // Verify app integrity
      final integrityValid = await verifyAppIntegrity();
      if (!integrityValid && _currentThreatLevel.index < ThreatLevel.high.index) {
        _currentThreatLevel = ThreatLevel.high;
      }

      debugPrint('Security checks completed. Threat level: ${_currentThreatLevel.name}');
    } catch (e) {
      debugPrint('Error running security checks: $e');
    }
  }

  ThreatLevel getCurrentThreatLevel() => _currentThreatLevel;

  bool isSecure() => _currentThreatLevel.index <= ThreatLevel.low.index;

  // ============================================================================
  // Security Events
  // ============================================================================

  Future<void> _loadSecurityEvents() async {
    try {
      final eventsJson = await _secureStorage.read(key: _securityEventsKey);
      if (eventsJson != null) {
        // Load events from secure storage
        _events = [];
      }
    } catch (e) {
      debugPrint('Error loading security events: $e');
    }
  }

  Future<void> _logSecurityEvent(SecurityEvent event) async {
    _events.add(event);
    _eventController.add(event);

    // Keep only last 100 events
    if (_events.length > 100) {
      _events = _events.sublist(_events.length - 100);
    }

    // Save to secure storage
    try {
      final eventsJson = jsonEncode(_events.map((e) => e.toJson()).toList());
      await _secureStorage.write(key: _securityEventsKey, value: eventsJson);
    } catch (e) {
      debugPrint('Error saving security events: $e');
    }

    debugPrint('Security event logged: ${event.type.name} - ${event.description}');
  }

  Stream<SecurityEvent> get securityEvents => _eventController.stream;

  List<SecurityEvent> getSecurityEvents() => List.unmodifiable(_events);

  List<SecurityEvent> getEventsByType(SecurityEventType type) {
    return _events.where((e) => e.type == type).toList();
  }

  // ============================================================================
  // Network Security
  // ============================================================================

  bool shouldAllowConnection(String url) {
    // Check if connection should be allowed based on security policies
    if (!isSecure()) {
      debugPrint('Connection blocked due to security concerns');
      return false;
    }

    return true;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  void dispose() {
    _eventController.close();
  }
}
